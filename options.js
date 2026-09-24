/**
 * @file options.js
 */

const PROMPT_PREFIX_STORAGE_KEY = "geminiPromptPrefix";
const DEFAULT_PROMPT_PREFIX = (typeof chrome !== "undefined" && chrome.i18n?.getMessage?.("defaultPromptPrefix")) || "Résume-moi la vidéo :";
const SAMPLE_VIDEO_URL = "https://www.youtube.com/watch?v=abcdefghijk";

const form = document.getElementById("options-form");
const promptPrefixInput = document.getElementById("prompt-prefix");
const promptPreview = document.getElementById("prompt-preview");
const resetButton = document.getElementById("reset-button");
const statusMessage = document.getElementById("status");

const localizedName = typeof chrome !== "undefined" && chrome.i18n?.getMessage?.("extensionName");
if (localizedName) {
    const titleEl = document.getElementById("title");
    if (titleEl) titleEl.textContent = localizedName;
    document.title = `Options — ${localizedName}`;
}

let statusTimeoutId = 0;

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

function buildPromptPreview(prefix) {
    const normalizedPrefix = normalizePromptPrefix(prefix);
    if (!normalizedPrefix) return SAMPLE_VIDEO_URL;
    return `${normalizedPrefix}${getPromptPrefixSeparator(normalizedPrefix)}${SAMPLE_VIDEO_URL}`;
}

function setStatus(message, isError = false) {
    clearTimeout(statusTimeoutId);
    statusMessage.textContent = message;
    statusMessage.classList.toggle("error", isError);

    statusTimeoutId = window.setTimeout(() => {
        statusMessage.textContent = "";
        statusMessage.classList.remove("error");
    }, 3000);
}

function updatePreview() {
    promptPreview.textContent = buildPromptPreview(promptPrefixInput.value);
}

function storageGet(key) {
    const extensionApi = getExtensionApi();
    if (!extensionApi) return Promise.resolve({});

    if (extensionApi.isPromiseBased) {
        return extensionApi.api.storage.local.get(key);
    }

    return new Promise((resolve) => {
        extensionApi.api.storage.local.get(key, (result) => {
            resolve(extensionApi.api.runtime?.lastError ? {} : result);
        });
    });
}

function storageSet(values) {
    const extensionApi = getExtensionApi();
    if (!extensionApi) return Promise.resolve();

    if (extensionApi.isPromiseBased) {
        return extensionApi.api.storage.local.set(values);
    }

    return new Promise((resolve, reject) => {
        extensionApi.api.storage.local.set(values, () => {
            const error = extensionApi.api.runtime?.lastError;
            if (error) {
                reject(new Error(error.message));
                return;
            }
            resolve();
        });
    });
}

function storageRemove(key) {
    const extensionApi = getExtensionApi();
    if (!extensionApi) return Promise.resolve();

    if (extensionApi.isPromiseBased) {
        return extensionApi.api.storage.local.remove(key);
    }

    return new Promise((resolve, reject) => {
        extensionApi.api.storage.local.remove(key, () => {
            const error = extensionApi.api.runtime?.lastError;
            if (error) {
                reject(new Error(error.message));
                return;
            }
            resolve();
        });
    });
}

async function restoreOptions() {
    const storedValues = await storageGet(PROMPT_PREFIX_STORAGE_KEY);
    promptPrefixInput.value = normalizePromptPrefix(storedValues[PROMPT_PREFIX_STORAGE_KEY]);
    updatePreview();
}

async function saveOptions(event) {
    event.preventDefault();

    const promptPrefix = normalizePromptPrefix(promptPrefixInput.value);
    promptPrefixInput.value = promptPrefix;
    updatePreview();

    try {
        await storageSet({
            [PROMPT_PREFIX_STORAGE_KEY]: promptPrefix
        });
        setStatus("Texte enregistré.");
    } catch {
        setStatus("Impossible d'enregistrer le texte.", true);
    }
}

async function resetOptions() {
    try {
        await storageRemove(PROMPT_PREFIX_STORAGE_KEY);
        promptPrefixInput.value = DEFAULT_PROMPT_PREFIX;
        updatePreview();
        setStatus("Texte réinitialisé.");
    } catch {
        setStatus("Impossible de réinitialiser le texte.", true);
    }
}

promptPrefixInput.addEventListener("input", updatePreview);
form.addEventListener("submit", saveOptions);
resetButton.addEventListener("click", resetOptions);

void restoreOptions().catch(() => {
    promptPrefixInput.value = DEFAULT_PROMPT_PREFIX;
    updatePreview();
    setStatus("Impossible de charger le réglage, valeur par défaut utilisée.");
});
