import { renderMarkdown } from "./markdown";
import germanConcept from "../docs/PRODUCT-DESIGN.md?raw";
import englishConcept from "../docs/PRODUCT-DESIGN.en.md?raw";
import "@fontsource-variable/inter";
import "./styles.css";
import "./concept.css";
import { cycleThemeMode, getThemeMode, initTheme, onThemeChange, THEME_ICONS } from "./theme";
import {
  getLanguage,
  initI18n,
  LANGUAGE_LABELS,
  onLanguageChange,
  setLanguage,
  t,
  type Lang,
} from "./i18n";

const content = byId<HTMLElement>("concept-content");
const languageToggle = byId<HTMLButtonElement>("btn-toggle-language");
const languageFlag = byId<HTMLImageElement>("language-flag");
const languageCode = byId<HTMLElement>("language-code");
const themeToggle = byId<HTMLButtonElement>("btn-toggle-theme");
const themeIcon = byId<HTMLElement>("theme-icon");

initTheme();
initI18n();
const requestedLanguage = new URLSearchParams(window.location.search).get("lang");
if (requestedLanguage === "de" || requestedLanguage === "en") {
  setLanguage(requestedLanguage);
}
renderConcept();

languageToggle.addEventListener("click", () => {
  setLanguage(getLanguage() === "de" ? "en" : "de");
});

themeToggle.addEventListener("click", () => cycleThemeMode());

onLanguageChange(() => renderConcept());
onThemeChange(() => syncThemeControl());

function renderConcept(): void {
  const language = getLanguage();
  const markdown = language === "de" ? germanConcept : englishConcept;
  content.innerHTML = renderMarkdown(markdown);
  syncLanguageControl(language);
  syncThemeControl();
  document.title = `${t("header.concept")} · ${t("app.title")}`;
  window.history.replaceState(null, "", `?lang=${language}`);
}

function syncLanguageControl(language: Lang): void {
  languageFlag.src = LANGUAGE_LABELS[language].flag;
  languageCode.textContent = language.toUpperCase();
  languageToggle.setAttribute("aria-label", t("lang.toggle.title"));
}

function syncThemeControl(): void {
  const mode = getThemeMode();
  themeIcon.innerHTML = THEME_ICONS[mode];
  const label = t(`theme.mode.${mode}`);
  themeToggle.title = label;
  themeToggle.setAttribute("aria-label", label);
}

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element #${id}`);
  return element as T;
}
