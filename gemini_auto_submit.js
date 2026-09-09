/**
 * @file gemini_auto_submit.js
 */

(function() {
    const SCRIPT_FLAG = "__geminiAutoSubmitInitialized";
    const PROMPT_PARAM = "prompt";
    const INPUT_TIMEOUT = 20000;
    const SUBMIT_TIMEOUT = 15000;
    const SUBMIT_READY_DELAY_MS = 450;
    const SUBMIT_LABEL_HINTS = [
        "send",
        "send message",
        "submit",
        "envoyer",
        "envoyer le message",
        "soumettre",
        "demander",
        "ask gemini"
    ];
    const SUBMIT_EXCLUDED_LABEL_HINTS = [
        "micro",
        "mic",
        "voice",
        "vocal",
        "image",
        "upload",
        "importer",
        "ajouter",
        "add",
        "stop",
        "arrêter",
        "cancel",
        "annuler"
    ];
    const INPUT_SELECTORS = [
        "rich-textarea > div[role='textbox']",
        "div.ql-editor[contenteditable='true']",
        "div.ql-editor[contenteditable]",
        "div[contenteditable='true'][data-placeholder]",
        "div[contenteditable='plaintext-only']",
        "[role='textbox'][contenteditable='true'][aria-label]",
        "[role='textbox'][contenteditable][aria-label]",
        "[role='textbox'][contenteditable='true']",
        "[role='textbox'][contenteditable]",
        "textarea[aria-label]",
        "textarea"
    ];
    const SUBMIT_BUTTON_SELECTORS = [
        ".send-button",
        "[data-test-id='send-button']",
        "[data-testid='send-button']",
        "button.send-button",
        "button[aria-label='Send message']",
        "button[aria-label*='Send' i]",
        "button[aria-label*='Submit' i]",
        "button[aria-label*='Envoyer' i]",
        "button[aria-label*='Soumettre' i]",
        "button[aria-label*='Demander' i]",
        "button[mattooltip*='Envoyer' i]",
        "button[mattooltip*='Send' i]",
        "button[title*='Envoyer' i]",
        "button[title*='Send' i]"
    ];

    if (window[SCRIPT_FLAG]) return;
    window[SCRIPT_FLAG] = true;
    window.__geminiAutoSubmitLastError = null;
    window.__geminiAutoSubmitStatus = "idle";

    function getPromptFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get(PROMPT_PARAM)?.trim() || "";
    }

    function isVisibleElement(element) {
        if (!element) return false;

        const style = window.getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden" || element.hidden) {
            return false;
        }

        const rect = element.getBoundingClientRect?.();
        return !rect || rect.width > 0 || rect.height > 0;
    }

    function waitFor(getValue, { root = document.documentElement, timeout = 10000 } = {}) {
        return new Promise((resolve, reject) => {
            const initialValue = getValue();
            if (initialValue) {
                resolve(initialValue);
                return;
            }

            const observer = new MutationObserver(() => {
                const value = getValue();
                if (value) {
                    cleanup();
                    resolve(value);
                }
            });

            const intervalId = setInterval(() => {
                const value = getValue();
                if (value) {
                    cleanup();
                    resolve(value);
                }
            }, 150);

            const timeoutId = setTimeout(() => {
                cleanup();
                reject(new Error("Timed out while waiting for Gemini to become ready."));
            }, timeout);

            function cleanup() {
                observer.disconnect();
                clearInterval(intervalId);
                clearTimeout(timeoutId);
            }

            observer.observe(root, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ["class", "style", "disabled", "aria-disabled", "hidden"]
            });
        });
    }

    function findPromptInput() {
        for (const selector of INPUT_SELECTORS) {
            const match = Array.from(document.querySelectorAll(selector)).find((element) => isVisibleElement(element));
            if (match) return match;
        }

        return null;
    }

    function findSubmitButton() {
        for (const selector of SUBMIT_BUTTON_SELECTORS) {
            const match = Array.from(document.querySelectorAll(selector))
                .find((element) => isVisibleElement(element) && looksLikeSubmitButton(element));
            if (match) return match;
        }

        const fallbackButton = Array.from(document.querySelectorAll("button, [role='button']"))
            .filter((element) => isVisibleElement(element))
            .find((element) => looksLikeSubmitButton(element));

        if (fallbackButton) {
            return fallbackButton;
        }

        return null;
    }

    function getElementDescriptor(element) {
        return [
            element.getAttribute("aria-label"),
            element.getAttribute("title"),
            element.getAttribute("mattooltip"),
            element.getAttribute("data-tooltip"),
            element.textContent
        ].filter(Boolean).join(" ").toLowerCase();
    }

    function looksLikeSubmitButton(element) {
        const descriptor = getElementDescriptor(element);
        if (!descriptor) return false;

        if (SUBMIT_EXCLUDED_LABEL_HINTS.some((label) => descriptor.includes(label))) {
            return false;
        }

        return SUBMIT_LABEL_HINTS.some((label) => descriptor.includes(label));
    }

    function isSubmitButtonEnabled(button) {
        return !!button && !button.disabled && button.getAttribute("aria-disabled") !== "true";
    }

    function readInputValue(input) {
        if (!input) return "";

        if (typeof input.value === "string") {
            return input.value.trim();
        }

        return (input.textContent || "").replace(/\u200B/g, "").trim();
    }

    function dispatchInputEvent(target, inputType, data) {
        try {
            target.dispatchEvent(new InputEvent("input", {
                bubbles: true,
                cancelable: true,
                composed: true,
                inputType,
                data
            }));
        } catch {
            target.dispatchEvent(new Event("input", {
                bubbles: true,
                cancelable: true
            }));
        }
    }

    function clickElement(element) {
        element.focus?.();

        if (typeof PointerEvent === "function") {
            try {
                element.dispatchEvent(new PointerEvent("pointerdown", {
                    bubbles: true,
                    cancelable: true,
                    pointerType: "mouse",
                    button: 0
                }));
                element.dispatchEvent(new PointerEvent("pointerup", {
                    bubbles: true,
                    cancelable: true,
                    pointerType: "mouse",
                    button: 0
                }));
            } catch {
                // Some isolated extension contexts expose PointerEvent partially.
            }
        }

        element.dispatchEvent(new MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            button: 0
        }));
        element.dispatchEvent(new MouseEvent("mouseup", {
            bubbles: true,
            cancelable: true,
            button: 0
        }));
        element.click();
    }

    function pressEnter(input) {
        input.dispatchEvent(new KeyboardEvent("keydown", {
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true,
            composed: true
        }));
    }

    function setPromptValue(input, promptText) {
        input.focus();

        if (input.isContentEditable) {
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(input);
            selection?.removeAllRanges();
            selection?.addRange(range);

            let insertedViaCommand = false;
            if (typeof document.execCommand === "function") {
                try {
                    insertedViaCommand = document.execCommand("insertText", false, promptText);
                } catch {
                    insertedViaCommand = false;
                }
            }

            if (!insertedViaCommand || !readInputValue(input)) {
                input.textContent = "";
                dispatchInputEvent(input, "deleteContentBackward", null);
                input.textContent = promptText;
            }

            dispatchInputEvent(input, "insertText", promptText);
            input.dispatchEvent(new Event("change", { bubbles: true }));
            return;
        }

        const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), "value");
        if (descriptor?.set) {
            descriptor.set.call(input, promptText);
        } else {
            input.value = promptText;
        }

        dispatchInputEvent(input, "insertText", promptText);
        input.dispatchEvent(new Event("change", { bubbles: true }));
    }

    async function ensurePromptInInput(input, promptText) {
        const currentValue = readInputValue(input);
        if (currentValue === promptText) return;

        setPromptValue(input, promptText);

        try {
            await waitFor(() => {
                const value = readInputValue(input);
                return value === promptText || value.includes(promptText) ? value : null;
            }, {
                root: input,
                timeout: 3000
            });
        } catch {
            // Leave the text in place if Gemini's internal state update is slower.
        }
    }

    function cleanupPromptParam() {
        const url = new URL(window.location.href);
        if (!url.searchParams.has(PROMPT_PARAM)) return;

        url.searchParams.delete(PROMPT_PARAM);
        const nextUrl = `${url.pathname}${url.search ? url.search : ""}${url.hash}`;
        history.replaceState({}, "", nextUrl);
    }

    async function waitForSubmitAcknowledgement(promptInput, promptText) {
        try {
            await waitFor(() => {
                const activeInput = findPromptInput() || promptInput;
                const currentValue = readInputValue(activeInput);
                const submitButton = findSubmitButton();

                if (!isSubmitButtonEnabled(submitButton)) {
                    return true;
                }

                if (!currentValue) {
                    return true;
                }

                if (currentValue !== promptText && !currentValue.includes(promptText)) {
                    return true;
                }

                return null;
            }, {
                timeout: 20000
            });

            return true;
        } catch {
            return false;
        }
    }

    function keepPromptParamCleanAfterSubmit(promptInput, promptText, duration = 60000) {
        const stopAt = Date.now() + duration;

        const cleanupWhenSubmitted = () => {
            const activeInput = findPromptInput() || promptInput;
            const currentValue = readInputValue(activeInput);

            if (!currentValue || (currentValue !== promptText && !currentValue.includes(promptText))) {
                cleanupPromptParam();
            }
        };

        const intervalId = window.setInterval(() => {
            cleanupWhenSubmitted();

            if (Date.now() >= stopAt) {
                clearInterval(intervalId);
            }
        }, 1000);

        window.setTimeout(cleanupWhenSubmitted, 500);
    }

    async function autoSubmitPrompt() {
        const promptText = getPromptFromUrl();
        if (!promptText) return;

        window.__geminiAutoSubmitStatus = "waiting_for_input";
        const promptInput = await waitFor(() => findPromptInput(), { timeout: INPUT_TIMEOUT });
        window.__geminiAutoSubmitStatus = "filling_prompt";
        await ensurePromptInInput(promptInput, promptText);

        window.__geminiAutoSubmitStatus = "waiting_for_submit";
        const submitButton = await waitFor(() => {
            const button = findSubmitButton();
            return isSubmitButtonEnabled(button) ? button : null;
        }, {
            timeout: SUBMIT_TIMEOUT
        });

        await new Promise((resolve) => setTimeout(resolve, SUBMIT_READY_DELAY_MS));
        window.__geminiAutoSubmitStatus = "submitting";
        clickElement(submitButton);
        keepPromptParamCleanAfterSubmit(promptInput, promptText);

        if (await waitForSubmitAcknowledgement(promptInput, promptText)) {
            cleanupPromptParam();
            window.__geminiAutoSubmitStatus = "submitted";
            return;
        }

        clickElement(findSubmitButton() || submitButton);

        if (await waitForSubmitAcknowledgement(promptInput, promptText)) {
            cleanupPromptParam();
            window.__geminiAutoSubmitStatus = "submitted_after_retry";
            return;
        }

        pressEnter(findPromptInput() || promptInput);

        if (await waitForSubmitAcknowledgement(promptInput, promptText)) {
            cleanupPromptParam();
            window.__geminiAutoSubmitStatus = "submitted_with_enter_fallback";
            return;
        }

        window.__geminiAutoSubmitStatus = "submit_not_acknowledged";
    }

    autoSubmitPrompt().catch((error) => {
        window.__geminiAutoSubmitLastError = error instanceof Error ? error.message : String(error);
        window.__geminiAutoSubmitStatus = "error";
    });
})();
