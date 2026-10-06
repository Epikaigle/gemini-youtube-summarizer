/**
 * @file options.js
 * Options & Toolbar Popup script for YouTube Summarizer with Gemini.
 */

const PROMPT_PREFIX_STORAGE_KEY = "geminiPromptPrefix";
const AUTO_SUBMIT_STORAGE_KEY = "geminiAutoSubmit";
const LANGUAGE_STORAGE_KEY = "extensionLanguage";
const SAMPLE_VIDEO_URL = "https://www.youtube.com/watch?v=abcdefghijk";

const UI_TRANSLATIONS = {
  fr: {
    optionsTitle: "Résumé YouTube avec Gemini",
    optionsIntro: "Personnalisez la langue, l'envoi automatique sur Gemini et le texte de votre prompt.",
    languageSectionTitle: "Langue de l'extension",
    languageLabel: "Langue d'affichage",
    languageAuto: "Auto",
    geminiSectionTitle: "Comportement sur Gemini",
    autoSubmitLabel: "Envoyer automatiquement le prompt",
    autoSubmitHelp: "Activé : Gemini lance l'analyse dès le chargement.\nDésactivé : le prompt est injecté sans être envoyé, vous permettant de choisir votre modèle (Flash, Pro, Advanced...) avant de cliquer sur Envoyer.",
    promptSectionTitle: "Personnalisation du prompt",
    promptPrefixLabel: "Texte avant le lien YouTube",
    promptPrefixHint: "Le lien est ajouté automatiquement. Laisse le champ vide pour envoyer uniquement le lien.",
    presetClassic: "Résumé classique",
    presetKeyPoints: "5 idées clés",
    presetPlan: "Plan détaillé",
    presetSimple: "Vulgarisation",
    presetLinkOnly: "Lien seul",
    previewLabel: "Aperçu envoyé à Gemini",
    saveButton: "Enregistrer",
    resetButton: "Réinitialiser",
    openFullTab: "Ouvrir en plein écran ↗",
    statusSaved: "Paramètres enregistrés avec succès.",
    statusError: "Impossible d'enregistrer les paramètres.",
    statusReset: "Paramètres réinitialisés par défaut.",
    defaultPromptPrefix: "Résume-moi la vidéo :"
  },
  en: {
    optionsTitle: "YouTube Summarizer with Gemini",
    optionsIntro: "Customize language, auto-submit behavior on Gemini, and your default prompt text.",
    languageSectionTitle: "Extension Language",
    languageLabel: "Display Language",
    languageAuto: "Auto",
    geminiSectionTitle: "Gemini Behavior",
    autoSubmitLabel: "Automatically submit prompt on Gemini",
    autoSubmitHelp: "Enabled: Gemini immediately triggers analysis upon loading.\nDisabled: Prompt is placed in the input field without sending, allowing you to select your Gemini model (Flash, Pro, Advanced...) before clicking Send manually.",
    promptSectionTitle: "Prompt Customization",
    promptPrefixLabel: "Text before the YouTube link",
    promptPrefixHint: "The video URL is appended automatically. Leave empty to send only the link.",
    presetClassic: "Classic Summary",
    presetKeyPoints: "5 Key Takeaways",
    presetPlan: "Detailed Outline",
    presetSimple: "Simple Explanation",
    presetLinkOnly: "Link Only",
    previewLabel: "Preview sent to Gemini",
    saveButton: "Save",
    resetButton: "Reset",
    openFullTab: "Open in full tab ↗",
    statusSaved: "Settings saved successfully.",
    statusError: "Unable to save settings.",
    statusReset: "Settings reset to defaults.",
    defaultPromptPrefix: "Summarize this video:"
  },
  es: {
    optionsTitle: "YouTube Summarizer with Gemini",
    optionsIntro: "Personaliza el idioma, el envío automático a Gemini y el texto de tu instrucción.",
    languageSectionTitle: "Idioma de la extensión",
    languageLabel: "Idioma de visualización",
    languageAuto: "Auto",
    geminiSectionTitle: "Comportamento en Gemini",
    autoSubmitLabel: "Enviar automáticamente la instrucción en Gemini",
    autoSubmitHelp: "Activado: Gemini inicia el análisis inmediatamente al cargar.\nDesactivado: La instrucción se inserta en el campo sin enviarse, lo que te permite elegir el modelo (Flash, Pro, Advanced...) antes de pulsar Enviar.",
    promptSectionTitle: "Personalización de la instrucción",
    promptPrefixLabel: "Texto antes del enlace de YouTube",
    promptPrefixHint: "El enlace se añade automáticamente. Deja el campo vacío para enviar solo el enlace.",
    presetClassic: "Resumen clásico",
    presetKeyPoints: "5 ideas clave",
    presetPlan: "Esquema detallado",
    presetSimple: "Explicación simple",
    presetLinkOnly: "Solo enlace",
    previewLabel: "Vista previa enviada a Gemini",
    saveButton: "Guardar",
    resetButton: "Restablecer",
    openFullTab: "Abrir en pestaña completa ↗",
    statusSaved: "Configuración guardada correctamente.",
    statusError: "No se pudo guardar la configuración.",
    statusReset: "Configuración restablecida por defecto.",
    defaultPromptPrefix: "Resúmeme el video:"
  }
};

const PRESET_VALUES = {
  fr: {
    classic: "Résume-moi la vidéo :",
    points: "Donne-moi les 5 idées clés de cette vidéo :",
    plan: "Rédige un plan structuré et détaillé de cette vidéo :",
    simple: "Explique simplement le contenu de cette vidéo :",
    link: ""
  },
  en: {
    classic: "Summarize this video:",
    points: "Give me the 5 key takeaways from this video:",
    plan: "Write a detailed, structured outline of this video:",
    simple: "Explain the content of this video in simple terms:",
    link: ""
  },
  es: {
    classic: "Resúmeme el video:",
    points: "Dame las 5 ideas clave de este video:",
    plan: "Escribe un esquema estructurado y detallado de este video:",
    simple: "Explica de forma sencilla el contenido de este video:",
    link: ""
  }
};

const form = document.getElementById("options-form");
const promptPrefixInput = document.getElementById("prompt-prefix");
const promptPreview = document.getElementById("prompt-preview");
const autoSubmitCheckbox = document.getElementById("auto-submit");
const resetButton = document.getElementById("reset-button");
const statusMessage = document.getElementById("status");
const openFullTabBtn = document.getElementById("open-full-tab");
const langRadioButtons = document.querySelectorAll('input[name="extension-language"]');

let statusTimeoutId = 0;
let currentLanguageSetting = ""; // "" = auto, "fr", "en", "es"
let activeEffectiveLang = "fr";

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

function resolveEffectiveLanguage(savedLang) {
  if (savedLang === "fr" || savedLang === "en" || savedLang === "es") {
    return savedLang;
  }
  const browserLang = (typeof chrome !== "undefined" && chrome.i18n?.getUILanguage?.()) || navigator.language || "en";
  if (browserLang.startsWith("fr")) return "fr";
  if (browserLang.startsWith("es")) return "es";
  return "en";
}

function getTranslation(key, lang = activeEffectiveLang) {
  const dict = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS.en;
  return dict[key] || (typeof chrome !== "undefined" && chrome.i18n?.getMessage?.(key)) || "";
}

function applyTranslations(effectiveLang) {
  activeEffectiveLang = effectiveLang;
  document.documentElement.lang = effectiveLang;

  const elementsWithI18n = document.querySelectorAll("[data-i18n]");
  for (const element of elementsWithI18n) {
    const key = element.getAttribute("data-i18n");
    const text = getTranslation(key, effectiveLang);
    if (text) {
      if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
        element.placeholder = text;
      } else {
        element.textContent = text;
      }
    }
  }

  const elementsWithTitle = document.querySelectorAll("[data-i18n-title]");
  for (const element of elementsWithTitle) {
    const key = element.getAttribute("data-i18n-title");
    const text = getTranslation(key, effectiveLang);
    if (text) {
      element.title = text;
      element.setAttribute("aria-label", text.replace(/ ↗$/, ""));
    }
  }

  const docTitle = getTranslation("optionsTitle", effectiveLang);
  if (docTitle) {
    document.title = document.body.classList.contains("is-popup")
      ? docTitle
      : `Options — ${docTitle}`;
  }
}

function normalizePromptPrefix(value) {
  if (typeof value !== "string") {
    return getTranslation("defaultPromptPrefix", activeEffectiveLang);
  }
  return value.trim();
}

function getPromptPrefixSeparator(value) {
  return /\s$/.test(value) ? "" : " ";
}

function buildPromptPreview(prefix) {
  const normalizedPrefix = typeof prefix === "string" ? prefix.trim() : "";
  if (!normalizedPrefix) return SAMPLE_VIDEO_URL;
  return `${normalizedPrefix}${getPromptPrefixSeparator(normalizedPrefix)}${SAMPLE_VIDEO_URL}`;
}

function updatePreview() {
  if (promptPreview && promptPrefixInput) {
    promptPreview.textContent = buildPromptPreview(promptPrefixInput.value);
  }
}

function setStatus(message, isError = false) {
  clearTimeout(statusTimeoutId);
  if (!statusMessage) return;

  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);

  statusTimeoutId = window.setTimeout(() => {
    statusMessage.textContent = "";
    statusMessage.classList.remove("error");
  }, 3500);
}

function storageGet(keys) {
  const extensionApi = getExtensionApi();
  if (!extensionApi) return Promise.resolve({});

  if (extensionApi.isPromiseBased) {
    return extensionApi.api.storage.local.get(keys);
  }

  return new Promise((resolve) => {
    extensionApi.api.storage.local.get(keys, (result) => {
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

function storageRemove(keys) {
  const extensionApi = getExtensionApi();
  if (!extensionApi) return Promise.resolve();

  if (extensionApi.isPromiseBased) {
    return extensionApi.api.storage.local.remove(keys);
  }

  return new Promise((resolve, reject) => {
    extensionApi.api.storage.local.remove(keys, () => {
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
  const stored = await storageGet([
    PROMPT_PREFIX_STORAGE_KEY,
    AUTO_SUBMIT_STORAGE_KEY,
    LANGUAGE_STORAGE_KEY
  ]);

  currentLanguageSetting = stored[LANGUAGE_STORAGE_KEY] || "";
  activeEffectiveLang = resolveEffectiveLanguage(currentLanguageSetting);
  applyTranslations(activeEffectiveLang);

  for (const radio of langRadioButtons) {
    radio.checked = (radio.value === currentLanguageSetting);
  }

  if (autoSubmitCheckbox) {
    autoSubmitCheckbox.checked = (stored[AUTO_SUBMIT_STORAGE_KEY] !== false);
  }

  const defaultPrefix = getTranslation("defaultPromptPrefix", activeEffectiveLang);
  const savedPrefix = stored[PROMPT_PREFIX_STORAGE_KEY];
  promptPrefixInput.value = (typeof savedPrefix === "string") ? savedPrefix : defaultPrefix;

  updatePreview();
}

async function saveOptions(event) {
  if (event) event.preventDefault();

  const selectedLangRadio = document.querySelector('input[name="extension-language"]:checked');
  currentLanguageSetting = selectedLangRadio ? selectedLangRadio.value : "";
  activeEffectiveLang = resolveEffectiveLanguage(currentLanguageSetting);
  applyTranslations(activeEffectiveLang);

  const autoSubmit = autoSubmitCheckbox ? autoSubmitCheckbox.checked : true;
  const promptPrefix = promptPrefixInput.value.trim();

  try {
    await storageSet({
      [LANGUAGE_STORAGE_KEY]: currentLanguageSetting,
      [AUTO_SUBMIT_STORAGE_KEY]: autoSubmit,
      [PROMPT_PREFIX_STORAGE_KEY]: promptPrefix
    });
    setStatus(getTranslation("statusSaved", activeEffectiveLang));
  } catch {
    setStatus(getTranslation("statusError", activeEffectiveLang), true);
  }
}

async function resetOptions() {
  currentLanguageSetting = "";
  activeEffectiveLang = resolveEffectiveLanguage(currentLanguageSetting);
  applyTranslations(activeEffectiveLang);

  for (const radio of langRadioButtons) {
    radio.checked = (radio.value === "");
  }

  if (autoSubmitCheckbox) {
    autoSubmitCheckbox.checked = true;
  }

  const defaultPrefix = getTranslation("defaultPromptPrefix", activeEffectiveLang);
  promptPrefixInput.value = defaultPrefix;
  updatePreview();

  try {
    await storageRemove([
      PROMPT_PREFIX_STORAGE_KEY,
      AUTO_SUBMIT_STORAGE_KEY,
      LANGUAGE_STORAGE_KEY
    ]);
    setStatus(getTranslation("statusReset", activeEffectiveLang));
  } catch {
    setStatus(getTranslation("statusError", activeEffectiveLang), true);
  }
}

function handleLanguageChange(event) {
  currentLanguageSetting = event.target.value;
  activeEffectiveLang = resolveEffectiveLanguage(currentLanguageSetting);
  applyTranslations(activeEffectiveLang);

  // If prompt is currently untouched or at the default of another language, update it to the new default
  const previousDefaults = Object.values(UI_TRANSLATIONS).map((d) => d.defaultPromptPrefix);
  if (!promptPrefixInput.value || previousDefaults.includes(promptPrefixInput.value.trim())) {
    promptPrefixInput.value = getTranslation("defaultPromptPrefix", activeEffectiveLang);
  }
  updatePreview();

  // Save the language preference immediately
  storageSet({ [LANGUAGE_STORAGE_KEY]: currentLanguageSetting }).catch(() => {});
}

function handlePresetClick(event) {
  const chip = event.target.closest(".preset-chip");
  if (!chip) return;

  const presetKey = chip.getAttribute("data-preset");
  const presetsForLang = PRESET_VALUES[activeEffectiveLang] || PRESET_VALUES.en;
  if (presetKey in presetsForLang) {
    promptPrefixInput.value = presetsForLang[presetKey];
    updatePreview();
  }
}

if (promptPrefixInput) {
  promptPrefixInput.addEventListener("input", updatePreview);
}

if (form) {
  form.addEventListener("submit", saveOptions);
}

if (resetButton) {
  resetButton.addEventListener("click", resetOptions);
}

for (const radio of langRadioButtons) {
  radio.addEventListener("change", handleLanguageChange);
}

const presetsBar = document.querySelector(".presets-bar");
if (presetsBar) {
  presetsBar.addEventListener("click", handlePresetClick);
}

if (openFullTabBtn) {
  openFullTabBtn.addEventListener("click", (event) => {
    event.preventDefault();
    const extensionApi = getExtensionApi();
    if (extensionApi?.api.tabs?.create) {
      extensionApi.api.tabs.create({ url: "options.html" });
    } else {
      window.open("options.html", "_blank");
    }
  });
}

void restoreOptions().catch(() => {
  activeEffectiveLang = resolveEffectiveLanguage("");
  applyTranslations(activeEffectiveLang);
  if (promptPrefixInput) {
    promptPrefixInput.value = getTranslation("defaultPromptPrefix", activeEffectiveLang);
  }
  updatePreview();
});
