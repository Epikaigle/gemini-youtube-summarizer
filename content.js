/**
 * @file content.js
 */

const MENU_BUTTON_ID = "gemini-summary-button-menu";
const WATCH_PAGE_BUTTON_ID = "gemini-summary-button-watch-page";
const GEMINI_APP_URL = "https://gemini.google.com/";
const PROMPT_PREFIX_STORAGE_KEY = "geminiPromptPrefix";
const DEFAULT_PROMPT_PREFIX = "Résume-moi la vidéo :";
const MENU_VIDEO_URL_ATTRIBUTE = "data-gemini-summary-video-url";
const MENU_POPUP_SELECTOR = [
    "tp-yt-iron-dropdown",
    "ytd-menu-popup-renderer[role='menu']",
    "yt-sheet-view-model[slot='dropdown-content']"
].join(", ");
const MENU_ITEMS_CONTAINER_SELECTOR = "yt-list-view-model, tp-yt-paper-listbox#items";
const WATCH_PAGE_ACTIONS_SELECTOR = "#actions";
const WATCH_PAGE_TOP_LEVEL_BUTTONS_SELECTORS = [
    "#actions #top-level-buttons-computed",
    "#actions-inner #top-level-buttons-computed",
    "ytd-watch-metadata #top-level-buttons-computed",
    "#menu #top-level-buttons-computed"
];
const LEGACY_INLINE_BUTTON_SELECTOR = ".gemini-summary-inline-slot, .gemini-summary-inline-button";
const ACTION_MENU_LABELS = [
    "more actions",
    "more options",
    "action menu",
    "options",
    "autres actions",
    "menu d'action",
    "menu d'actions",
    "menu des actions"
];
const COMPACT_ACTION_MENU_LABELS = [
    "plus",
    "more"
];
const VIDEO_CONTEXT_SELECTOR = [
    "ytd-channel-video-player-renderer",
    "ytd-channel-featured-content-renderer",
    "ytd-grid-video-renderer",
    "ytd-reel-item-renderer",
    "ytd-rich-grid-media",
    "ytd-rich-item-renderer",
    "ytd-video-renderer",
    "ytd-compact-video-renderer",
    "ytd-compact-radio-renderer",
    "ytd-playlist-panel-video-renderer",
    "ytd-playlist-video-renderer",
    "yt-lockup-grid-view-model",
    "yt-lockup-view-model"
].join(", ");
const VIDEO_LINK_SELECTOR = [
    "a[href*='/watch?v=']",
    "a[href*='/shorts/']",
    "a[href*='/live/']"
].join(", ");
const SUMMARY_ICON_PATH = "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z";
const MENU_TRIGGER_MAX_AGE_MS = 5000;
const MENU_INJECTION_WINDOW_MS = 7000;
const ACTIVATION_KEYS = new Set(["Enter", " ", "Spacebar"]);
const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

let pendingMenuRequestId = 0;
let pendingMenuUrl = null;
let pendingMenuRequestDeadline = 0;
let watchButtonRequestId = 0;
let watchActionsObserver = null;
let watchActionsObserverTarget = null;
let menuPopupObserver = null;
let menuPopupObserverTimeoutId = 0;
let lastMenuTrigger = null;
let lastMenuTriggerTimestamp = 0;
let lastSummaryActivation = {
    target: null,
    videoUrl: null,
    timestamp: 0
};
let promptPrefix = DEFAULT_PROMPT_PREFIX;

function getExtensionApi() {
    if (typeof browser !== "undefined" && browser.storage?.local) {
        return {
            api: browser,
            isPromiseBased: true
        };
    }

    if (typeof chrome !== "undefined" && chrome.storage?.local) {
        return {
            api: chrome,
            isPromiseBased: false
        };
    }

    return null;
}

function normalizePromptPrefix(value) {
    if (typeof value !== "string") return DEFAULT_PROMPT_PREFIX;
    return value.trim();
}

function getPromptPrefixSeparator(value) {
    return /\s$/.test(value) ? "" : " ";
}

async function loadPromptPrefix() {
    const extensionApi = getExtensionApi();
    if (!extensionApi) return;

    try {
        if (extensionApi.isPromiseBased) {
            const result = await extensionApi.api.storage.local.get(PROMPT_PREFIX_STORAGE_KEY);
            promptPrefix = normalizePromptPrefix(result[PROMPT_PREFIX_STORAGE_KEY]);
            return;
        }

        await new Promise((resolve) => {
            extensionApi.api.storage.local.get(PROMPT_PREFIX_STORAGE_KEY, (result) => {
                if (!extensionApi.api.runtime?.lastError) {
                    promptPrefix = normalizePromptPrefix(result[PROMPT_PREFIX_STORAGE_KEY]);
                }
                resolve();
            });
        });
    } catch {
        promptPrefix = DEFAULT_PROMPT_PREFIX;
    }
}

function watchPromptPrefixChanges() {
    const extensionApi = getExtensionApi();
    if (!extensionApi?.api.storage?.onChanged) return;

    extensionApi.api.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== "local" || !changes[PROMPT_PREFIX_STORAGE_KEY]) return;
        promptPrefix = normalizePromptPrefix(changes[PROMPT_PREFIX_STORAGE_KEY].newValue);
    });
}

function isWatchPage(url = window.location.href) {
    try {
        return new URL(url).pathname === "/watch";
    } catch {
        return url.includes("/watch");
    }
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

function isActivationKey(key) {
    return ACTIVATION_KEYS.has(key);
}

function isPrimaryActivationEvent(event) {
    if (event.type === "keydown") {
        return isActivationKey(event.key);
    }

    return event.button === 0;
}

function isDuplicateSummaryActivation(target, videoUrl) {
    return (
        lastSummaryActivation.target === target &&
        lastSummaryActivation.videoUrl === videoUrl &&
        Date.now() - lastSummaryActivation.timestamp < 750
    );
}

function rememberSummaryActivation(target, videoUrl) {
    lastSummaryActivation = {
        target,
        videoUrl,
        timestamp: Date.now()
    };
}

function normalizeVideoUrl(videoUrl) {
    if (!videoUrl) return null;

    try {
        const url = new URL(videoUrl, window.location.origin);

        if (url.pathname === "/watch") {
            const videoId = url.searchParams.get("v");
            return videoId ? `https://www.youtube.com/watch?v=${videoId}` : url.toString();
        }

        if (url.pathname.startsWith("/shorts/")) {
            const shortId = url.pathname.split("/")[2];
            return shortId ? `https://www.youtube.com/shorts/${shortId}` : url.toString();
        }

        if (url.pathname.startsWith("/live/")) {
            const liveId = url.pathname.split("/")[2];
            return liveId ? `https://www.youtube.com/live/${liveId}` : url.toString();
        }

        return url.toString();
    } catch {
        return videoUrl;
    }
}

function buildGeminiPrompt(videoUrl) {
    const prefix = normalizePromptPrefix(promptPrefix);
    if (!prefix) return videoUrl;
    return `${prefix}${getPromptPrefixSeparator(prefix)}${videoUrl}`;
}

function buildWatchUrlFromVideoId(videoId) {
    return YOUTUBE_VIDEO_ID_PATTERN.test(videoId) ? `https://www.youtube.com/watch?v=${videoId}` : null;
}

function openGeminiTab(videoUrl) {
    const normalizedUrl = normalizeVideoUrl(videoUrl);
    if (!normalizedUrl) return;

    const prompt = buildGeminiPrompt(normalizedUrl);
    const geminiUrl = `${GEMINI_APP_URL}?prompt=${encodeURIComponent(prompt)}`;
    window.open(geminiUrl, "_blank", "noopener,noreferrer");
}

function getClosestElement(target) {
    if (!target) return null;
    if (target instanceof Element) return target;
    return target.parentElement || null;
}

function getElementDescriptorText(element) {
    if (!element) return "";

    return [
        element.getAttribute?.("aria-label"),
        element.getAttribute?.("title"),
        element.textContent
    ].filter(Boolean).join(" ").toLowerCase();
}

function closeMenuPopup() {
    document.querySelectorAll("tp-yt-iron-overlay-backdrop").forEach((backdrop) => backdrop.click());
    document.dispatchEvent(new KeyboardEvent("keydown", {
        key: "Escape",
        code: "Escape",
        bubbles: true,
        cancelable: true
    }));
}

function removeLegacyInlineButtons() {
    document.querySelectorAll(LEGACY_INLINE_BUTTON_SELECTOR).forEach((element) => element.remove());
}

function createSummaryIconNode(size = 24) {
    const iconShape = document.createElement("span");
    iconShape.className = "yt-icon-shape";
    iconShape.style.width = `${size}px`;
    iconShape.style.height = `${size}px`;
    iconShape.style.display = "block";
    iconShape.style.fill = "currentColor";

    const wrapper = document.createElement("div");
    wrapper.style.width = "100%";
    wrapper.style.height = "100%";
    wrapper.style.display = "block";
    wrapper.style.fill = "currentColor";

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("height", String(size));
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", String(size));
    svg.setAttribute("focusable", "false");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", SUMMARY_ICON_PATH);

    svg.appendChild(path);
    wrapper.appendChild(svg);
    iconShape.appendChild(wrapper);

    return iconShape;
}

function waitFor(getValue, { root = document.documentElement, timeout = 4000, observeAttributes = true } = {}) {
    return new Promise((resolve, reject) => {
        const initialValue = getValue();
        if (initialValue) {
            resolve(initialValue);
            return;
        }

        const observerOptions = {
            childList: true,
            subtree: true
        };

        if (observeAttributes) {
            observerOptions.attributes = true;
            observerOptions.attributeFilter = ["style", "class", "hidden", "aria-hidden", "disabled"];
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
            reject(new Error("Timed out while waiting for a DOM update."));
        }, timeout);

        function cleanup() {
            observer.disconnect();
            clearInterval(intervalId);
            clearTimeout(timeoutId);
        }

        observer.observe(root, observerOptions);
    });
}

function handleSummaryActivation(videoUrl, event) {
    if (!isPrimaryActivationEvent(event)) {
        return;
    }

    const activationTarget = event.currentTarget || event.target;
    if (isDuplicateSummaryActivation(activationTarget, videoUrl)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();

    rememberSummaryActivation(activationTarget, videoUrl);
    openGeminiTab(videoUrl);
    closeMenuPopup();
}

function bindSummaryActivation(target, videoUrl) {
    if (!target) return;

    const activate = (event) => handleSummaryActivation(videoUrl, event);
    target.addEventListener("mousedown", activate, true);
    target.addEventListener("click", activate, true);
    target.addEventListener("keydown", activate, true);
}

function setSummaryVideoUrlAttribute(element, videoUrl) {
    if (!(element instanceof Element) || !videoUrl) return;
    element.setAttribute(MENU_VIDEO_URL_ATTRIBUTE, videoUrl);
}

function getInjectedMenuVideoUrl(menuItem) {
    if (!(menuItem instanceof Element)) return null;

    return (
        menuItem.getAttribute(MENU_VIDEO_URL_ATTRIBUTE) ||
        menuItem.querySelector(`[${MENU_VIDEO_URL_ATTRIBUTE}]`)?.getAttribute(MENU_VIDEO_URL_ATTRIBUTE) ||
        null
    );
}

function createViewModelMenuItem(itemsContainer, videoUrl) {
    const templateItem = itemsContainer.querySelector("yt-list-item-view-model");
    if (!templateItem) return null;

    const menuItem = templateItem.cloneNode(true);
    menuItem.id = MENU_BUTTON_ID;
    menuItem.setAttribute("role", "menuitem");
    menuItem.setAttribute("aria-label", "Résumer");
    menuItem.removeAttribute("aria-disabled");

    const actionTarget =
        menuItem.querySelector("button, a, .ytButtonOrAnchorHost, .yt-list-item-view-model__button-or-anchor") ||
        menuItem.querySelector(".yt-list-item-view-model__container") ||
        menuItem.querySelector(".ytListItemViewModelContainer") ||
        menuItem;
    if (actionTarget instanceof HTMLElement) {
        actionTarget.removeAttribute("href");
        actionTarget.removeAttribute("target");
        actionTarget.removeAttribute("rel");
        actionTarget.removeAttribute("aria-disabled");
        actionTarget.disabled = false;
        actionTarget.setAttribute("aria-label", "Résumer");
        actionTarget.setAttribute("title", "Résumer");
        actionTarget.setAttribute("tabindex", "0");

        if (actionTarget instanceof HTMLButtonElement) {
            actionTarget.type = "button";
        }
    }

    setSummaryVideoUrlAttribute(menuItem, videoUrl);
    setSummaryVideoUrlAttribute(actionTarget, videoUrl);

    const title = menuItem.querySelector(".ytListItemViewModelTitle, .yt-list-item-view-model__title, span[role='text'], yt-formatted-string");
    if (title) {
        title.textContent = "Résumer";
    }

    const iconWrapper =
        menuItem.querySelector(".ytListItemViewModelImageContainer") ||
        menuItem.querySelector(".ytListItemViewModelImage") ||
        menuItem.querySelector(".yt-list-item-view-model__image") ||
        menuItem.querySelector(".yt-list-item-view-model__image-container");
    if (iconWrapper) {
        iconWrapper.setAttribute("aria-hidden", "true");
        iconWrapper.replaceChildren(createSummaryIconNode());
    }

    bindSummaryActivation(menuItem, videoUrl);
    bindSummaryActivation(actionTarget, videoUrl);
    return menuItem;
}

function createPaperListboxMenuItem(itemsContainer, videoUrl) {
    const templateItem =
        Array.from(itemsContainer.querySelectorAll("tp-yt-paper-item")).find((item) => item.querySelector("yt-icon")) ||
        itemsContainer.querySelector("tp-yt-paper-item");
    if (!templateItem) return null;

    const menuItem = templateItem.cloneNode(true);
    menuItem.id = MENU_BUTTON_ID;
    menuItem.setAttribute("aria-label", "Résumer");
    menuItem.setAttribute("aria-disabled", "false");
    setSummaryVideoUrlAttribute(menuItem, videoUrl);

    bindSummaryActivation(menuItem, videoUrl);
    return menuItem;
}

function finalizePaperListboxMenuItem(menuItem) {
    const textElement = menuItem.querySelector("yt-formatted-string");
    if (textElement) {
        textElement.removeAttribute("is-empty");
        textElement.textContent = "Résumer";
    }

    const legacyIcon = menuItem.querySelector("yt-icon, [data-gemini-summary-paper-icon='true']");
    const iconHost = document.createElement("span");
    iconHost.setAttribute("data-gemini-summary-paper-icon", "true");
    iconHost.setAttribute("aria-hidden", "true");
    iconHost.style.display = "inline-flex";
    iconHost.style.alignItems = "center";
    iconHost.style.justifyContent = "center";
    iconHost.style.width = "24px";
    iconHost.style.height = "24px";
    iconHost.style.minWidth = "24px";
    iconHost.style.marginRight = "16px";
    iconHost.style.color = "currentColor";
    iconHost.style.fill = "currentColor";
    iconHost.appendChild(createSummaryIconNode());

    if (legacyIcon) {
        legacyIcon.replaceWith(iconHost);
    } else {
        const insertBefore = textElement || menuItem.firstChild || null;
        menuItem.insertBefore(iconHost, insertBefore);
    }
}

function injectMenuItem(itemsContainer, videoUrl) {
    itemsContainer.querySelector(`#${MENU_BUTTON_ID}`)?.remove();

    const menuItem = itemsContainer.matches("tp-yt-paper-listbox")
        ? createPaperListboxMenuItem(itemsContainer, videoUrl)
        : createViewModelMenuItem(itemsContainer, videoUrl);

    if (!menuItem) return;

    itemsContainer.prepend(menuItem);

    if (itemsContainer.matches("tp-yt-paper-listbox")) {
        finalizePaperListboxMenuItem(menuItem);
    }
}

function findVisibleMenuPopup() {
    return Array.from(document.querySelectorAll(MENU_POPUP_SELECTOR))
        .filter((popup) => isVisibleElement(popup))
        .filter((popup) => popup.querySelector(MENU_ITEMS_CONTAINER_SELECTOR))
        .at(-1) || null;
}

function maybeInjectVisibleMenuItem() {
    if (!pendingMenuRequestDeadline || Date.now() > pendingMenuRequestDeadline) {
        return false;
    }

    const menuPopup = findVisibleMenuPopup();
    if (!menuPopup) return false;

    const itemsContainer = menuPopup.querySelector(MENU_ITEMS_CONTAINER_SELECTOR);
    if (!itemsContainer || !itemsContainer.children.length) {
        return false;
    }

    const resolvedVideoUrl = resolveMenuVideoUrl(pendingMenuUrl);
    if (!resolvedVideoUrl) {
        return false;
    }

    const existingMenuItem = itemsContainer.querySelector(`#${MENU_BUTTON_ID}`);
    if (getInjectedMenuVideoUrl(existingMenuItem) === resolvedVideoUrl) {
        return true;
    }

    injectMenuItem(itemsContainer, resolvedVideoUrl);
    pendingMenuUrl = resolvedVideoUrl;
    return true;
}

function startMenuPopupObserver() {
    if (!menuPopupObserver) {
        menuPopupObserver = new MutationObserver(() => {
            maybeInjectVisibleMenuItem();
        });
    }

    menuPopupObserver.disconnect();

    menuPopupObserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "class", "hidden", "aria-hidden"]
    });

    clearTimeout(menuPopupObserverTimeoutId);
    menuPopupObserverTimeoutId = window.setTimeout(() => {
        menuPopupObserver?.disconnect();
        menuPopupObserverTimeoutId = 0;
    }, MENU_INJECTION_WINDOW_MS);
}

function matchesActionMenuTrigger(button) {
    if (!button) return false;

    const triggerHost =
        button.closest("yt-icon-button, button-view-model, yt-button-shape, [role='button']") ||
        button.parentElement;
    const videoContext = button.closest(VIDEO_CONTEXT_SELECTOR);

    const descriptorText = [button, triggerHost]
        .map((element) => getElementDescriptorText(element))
        .filter(Boolean)
        .join(" ");

    if (videoContext && ACTION_MENU_LABELS.some((label) => descriptorText.includes(label))) {
        return true;
    }

    if (
        videoContext &&
        COMPACT_ACTION_MENU_LABELS.some((label) => descriptorText.trim() === label || descriptorText.includes(` ${label} `))
    ) {
        return true;
    }

    if (videoContext && (button.classList?.contains("dropdown-trigger") || triggerHost?.classList?.contains("dropdown-trigger"))) {
        return true;
    }

    if (videoContext && button.closest(".yt-lockup-metadata-view-model__menu-button, .yt-lockup-view-model__menu-button")) {
        return true;
    }

    if (button.closest("ytd-menu-renderer") && videoContext && !button.closest(WATCH_PAGE_ACTIONS_SELECTOR)) {
        return true;
    }

    return false;
}

function findActionMenuButton(target) {
    const element = getClosestElement(target);
    const menuButton = element?.closest("button, button-view-model, yt-icon-button, yt-button-shape, [role='button']") || null;
    return matchesActionMenuTrigger(menuButton) ? menuButton : null;
}

function rememberMenuTrigger(menuButton) {
    if (!menuButton) return;

    lastMenuTrigger = menuButton;
    lastMenuTriggerTimestamp = Date.now();
}

function getRecentMenuTrigger() {
    if (!lastMenuTrigger?.isConnected) return null;
    if (Date.now() - lastMenuTriggerTimestamp > MENU_TRIGGER_MAX_AGE_MS) return null;
    return lastMenuTrigger;
}

function extractVideoUrl(container) {
    const linkCandidates = Array.from(container.querySelectorAll(VIDEO_LINK_SELECTOR));
    const rankedCandidate = linkCandidates
        .map((linkElement) => ({
            linkElement,
            score: getVideoLinkPriority(linkElement)
        }))
        .sort((left, right) => right.score - left.score)[0];
    const linkedUrl = normalizeVideoUrl(rankedCandidate?.linkElement?.href);
    if (linkedUrl) {
        return linkedUrl;
    }

    const fallbackVideoId = extractVideoIdFromContext(container);
    return fallbackVideoId ? buildWatchUrlFromVideoId(fallbackVideoId) : null;
}

function getVideoLinkPriority(linkElement) {
    if (!linkElement) return -1;

    let score = 0;

    if (linkElement.id === "thumbnail") score += 40;
    if (linkElement.id === "video-title" || linkElement.id === "video-title-link") score += 35;
    if (linkElement.closest("ytd-thumbnail, yt-thumbnail-view-model")) score += 20;
    if (linkElement.closest("#video-title, #video-title-link, h3")) score += 15;
    if (linkElement.href?.includes("/watch?v=")) score += 10;
    if (linkElement.getAttribute("aria-hidden") === "true") score -= 25;

    return score;
}

function extractVideoIdFromValue(value) {
    if (!value || typeof value !== "string") return null;

    const trimmedValue = value.trim();
    if (YOUTUBE_VIDEO_ID_PATTERN.test(trimmedValue)) {
        return trimmedValue;
    }

    const contentIdMatch = trimmedValue.match(/(?:^|\s)content-id-([A-Za-z0-9_-]{11})(?:\s|$)/);
    if (contentIdMatch) {
        return contentIdMatch[1];
    }

    try {
        const url = new URL(trimmedValue, window.location.origin);
        if (url.pathname === "/watch") {
            const videoId = url.searchParams.get("v");
            if (videoId && YOUTUBE_VIDEO_ID_PATTERN.test(videoId)) {
                return videoId;
            }
        }

        if (url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/live/")) {
            const videoId = url.pathname.split("/")[2];
            if (videoId && YOUTUBE_VIDEO_ID_PATTERN.test(videoId)) {
                return videoId;
            }
        }

        if (url.hostname === "youtu.be") {
            const videoId = url.pathname.split("/").filter(Boolean)[0];
            if (videoId && YOUTUBE_VIDEO_ID_PATTERN.test(videoId)) {
                return videoId;
            }
        }
    } catch {
        // Ignore non-URL values.
    }

    return null;
}

function extractVideoIdFromElement(element) {
    if (!(element instanceof Element)) return null;

    const attributeNames = [
        "video-id",
        "videoid",
        "data-video-id",
        "data-content-id",
        "href"
    ];

    for (const attributeName of attributeNames) {
        const videoId = extractVideoIdFromValue(element.getAttribute(attributeName));
        if (videoId) {
            return videoId;
        }
    }

    const datasetValues = [
        element.dataset?.videoId,
        element.dataset?.contentId
    ];
    for (const value of datasetValues) {
        const videoId = extractVideoIdFromValue(value);
        if (videoId) {
            return videoId;
        }
    }

    return extractVideoIdFromValue(element.className);
}

function extractVideoIdFromContext(container) {
    if (!(container instanceof Element)) return null;

    const directCandidates = [
        container,
        ...container.querySelectorAll("[video-id], [videoid], [data-video-id], [data-content-id], [class*='content-id-']")
    ];

    for (const candidate of directCandidates) {
        const videoId = extractVideoIdFromElement(candidate);
        if (videoId) {
            return videoId;
        }
    }

    let ancestor = container.parentElement;
    for (let level = 0; ancestor && level < 3; level += 1, ancestor = ancestor.parentElement) {
        const videoId = extractVideoIdFromElement(ancestor);
        if (videoId) {
            return videoId;
        }
    }

    return null;
}

function extractMenuVideoUrlFromButton(menuButton) {
    const videoContext = menuButton.closest(VIDEO_CONTEXT_SELECTOR);
    if (videoContext) {
        return extractVideoUrl(videoContext);
    }

    if (isWatchPage() && menuButton.closest("#actions, #actions-inner, #menu, ytd-watch-metadata")) {
        return normalizeVideoUrl(window.location.href);
    }

    return null;
}

function resolveMenuVideoUrl(videoUrl) {
    if (videoUrl) return videoUrl;

    const recentMenuTrigger = getRecentMenuTrigger();
    return recentMenuTrigger ? extractMenuVideoUrlFromButton(recentMenuTrigger) : null;
}

async function injectMenuItemWhenReady(requestId, videoUrl) {
    try {
        const readyMenu = await waitFor(() => {
            return maybeInjectVisibleMenuItem() ? { ready: true } : null;
        }, { timeout: MENU_INJECTION_WINDOW_MS });
        const { ready } = readyMenu;
        const resolvedVideoUrl = resolveMenuVideoUrl(videoUrl);

        if (!ready || !resolvedVideoUrl) {
            return;
        }

        if (requestId !== pendingMenuRequestId || (pendingMenuUrl && pendingMenuUrl !== resolvedVideoUrl)) {
            return;
        }
    } catch {
        // The popup closed before it was ready. Nothing to recover here.
    } finally {
        if (requestId === pendingMenuRequestId) {
            pendingMenuUrl = null;
            pendingMenuRequestDeadline = 0;
        }
    }
}

function scheduleMenuInjection(videoUrl) {
    pendingMenuUrl = videoUrl;
    pendingMenuRequestDeadline = Date.now() + MENU_INJECTION_WINDOW_MS;
    startMenuPopupObserver();
    const requestId = ++pendingMenuRequestId;

    queueMicrotask(() => {
        void injectMenuItemWhenReady(requestId, videoUrl);
    });
}

function captureMenuRequest(event) {
    if (!isPrimaryActivationEvent(event)) return;

    const menuButton = findActionMenuButton(event.target);
    if (!menuButton) return;

    rememberMenuTrigger(menuButton);

    const videoUrl = extractMenuVideoUrlFromButton(menuButton);
    scheduleMenuInjection(videoUrl);
}

function findWatchPageTopLevelButtons() {
    for (const selector of WATCH_PAGE_TOP_LEVEL_BUTTONS_SELECTORS) {
        const element = document.querySelector(selector);
        if (element) return element;
    }

    return null;
}

function findWatchPageAnchor() {
    const topLevelButtons = findWatchPageTopLevelButtons();
    if (!topLevelButtons) return null;

    return topLevelButtons.querySelector(":scope > yt-button-view-model, :scope > button-view-model, :scope > yt-button-shape") || null;
}

function createWatchPageButton() {
    const topLevelButtons = findWatchPageTopLevelButtons();
    const templateButtonHost = topLevelButtons?.querySelector(":scope > yt-button-view-model, :scope > button-view-model, :scope > yt-button-shape") || null;

    if (templateButtonHost) {
        const buttonHost = templateButtonHost.cloneNode(true);
        buttonHost.setAttribute("data-gemini-summary-watch-wrapper", "true");

        const button = buttonHost.querySelector("button");
        if (!button) return null;

        button.id = WATCH_PAGE_BUTTON_ID;
        button.type = "button";
        button.setAttribute("aria-label", "Résumer");
        button.setAttribute("title", "Résumer");
        button.removeAttribute("aria-pressed");
        button.style.removeProperty("display");
        button.style.removeProperty("visibility");

        const icon = button.querySelector(".ytSpecButtonShapeNextIcon, .yt-spec-button-shape-next__icon");
        if (icon) {
            icon.setAttribute("aria-hidden", "true");
            icon.replaceChildren(createSummaryIconNode());
        }

        const textContent = button.querySelector(".ytSpecButtonShapeNextButtonTextContent, .yt-spec-button-shape-next__button-text-content");
        if (textContent) {
            textContent.replaceChildren();
            textContent.textContent = "Résumer";
        }

        button.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            openGeminiTab(window.location.href);
        });

        return buttonHost;
    }

    const button = document.createElement("button");
    button.id = WATCH_PAGE_BUTTON_ID;
    button.type = "button";
    button.className = "yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m yt-spec-button-shape-next--icon-leading";
    button.style.marginRight = "8px";

    const icon = document.createElement("div");
    icon.className = "yt-spec-button-shape-next__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.appendChild(createSummaryIconNode());

    const textContent = document.createElement("div");
    textContent.className = "yt-spec-button-shape-next__button-text-content";

    const label = document.createElement("span");
    label.className = "yt-core-attributed-string yt-core-attributed-string--white-space-no-wrap";
    label.textContent = "Résumer";

    textContent.appendChild(label);
    button.appendChild(icon);
    button.appendChild(textContent);
    button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openGeminiTab(window.location.href);
    });

    return button;
}

function injectWatchPageButton() {
    const existingButton = document.getElementById(WATCH_PAGE_BUTTON_ID);
    const topLevelButtons = findWatchPageTopLevelButtons();
    if (!topLevelButtons) return;

    if (existingButton && topLevelButtons.contains(existingButton)) return;
    const existingButtonWrapper = existingButton?.closest("[data-gemini-summary-watch-wrapper='true']");
    (existingButtonWrapper || existingButton)?.remove();

    const anchor = findWatchPageAnchor();
    const watchPageButton = createWatchPageButton();
    if (!watchPageButton) return;

    if (anchor?.parentNode) {
        anchor.parentNode.insertBefore(watchPageButton, anchor);
        return;
    }

    topLevelButtons.appendChild(watchPageButton);
}

function stopWatchActionsObserver() {
    watchActionsObserver?.disconnect();
    watchActionsObserver = null;
    watchActionsObserverTarget = null;
}

function startWatchActionsObserver(actionsContainer) {
    if (!actionsContainer) return;
    if (watchActionsObserver && watchActionsObserverTarget === actionsContainer) return;

    stopWatchActionsObserver();

    watchActionsObserverTarget = actionsContainer;
    watchActionsObserver = new MutationObserver(() => {
        if (!isWatchPage()) {
            stopWatchActionsObserver();
            return;
        }

        if (!actionsContainer.isConnected) {
            stopWatchActionsObserver();
            void ensureWatchPageButton();
            return;
        }

        injectWatchPageButton();
    });

    watchActionsObserver.observe(actionsContainer, {
        childList: true,
        subtree: true
    });
}

async function ensureWatchPageButton() {
    const requestId = ++watchButtonRequestId;

    if (!isWatchPage()) {
        stopWatchActionsObserver();
        const existingButton = document.getElementById(WATCH_PAGE_BUTTON_ID);
        const existingButtonWrapper = existingButton?.closest("[data-gemini-summary-watch-wrapper='true']");
        (existingButtonWrapper || existingButton)?.remove();
        return;
    }

    try {
        const actionsContainer = await waitFor(() => document.querySelector(WATCH_PAGE_ACTIONS_SELECTOR), {
            timeout: 10000
        });
        await waitFor(() => findWatchPageTopLevelButtons(), {
            root: actionsContainer,
            timeout: 10000
        });

        if (requestId !== watchButtonRequestId || !isWatchPage()) {
            return;
        }

        injectWatchPageButton();
        startWatchActionsObserver(actionsContainer);
    } catch {
        // The watch-page actions are not available yet or the layout changed.
    }
}

document.addEventListener("pointerdown", captureMenuRequest, true);
document.addEventListener("mousedown", captureMenuRequest, true);
document.addEventListener("click", captureMenuRequest, true);
document.addEventListener("keydown", captureMenuRequest, true);
document.addEventListener("yt-navigate-finish", () => {
    removeLegacyInlineButtons();
    ensureWatchPageButton();
});
document.addEventListener("yt-page-data-updated", () => {
    removeLegacyInlineButtons();
    ensureWatchPageButton();
});

removeLegacyInlineButtons();
void loadPromptPrefix();
watchPromptPrefixChanges();
ensureWatchPageButton();
