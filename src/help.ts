import { marked } from "marked";
import readme from "../README.md?raw";
import "./styles.css";
import "./concept.css";
import {
  getLanguage,
  initI18n,
  LANGUAGE_LABELS,
  onLanguageChange,
  setLanguage,
  t,
  type Lang,
} from "./i18n";
import { getTheme, initTheme, onThemeChange, toggleTheme } from "./theme";

const content = byId<HTMLElement>("help-content");
const languageToggle = byId<HTMLButtonElement>("btn-toggle-language");
const languageFlag = byId<HTMLElement>("language-flag");
const languageCode = byId<HTMLElement>("language-code");
const themeToggle = byId<HTMLButtonElement>("btn-toggle-theme");
const themeIcon = byId<HTMLElement>("theme-icon");

initTheme();
initI18n();
const requestedLanguage = new URLSearchParams(window.location.search).get("lang");
if (requestedLanguage === "de" || requestedLanguage === "en") {
  setLanguage(requestedLanguage);
}
renderHelp();

languageToggle.addEventListener("click", () => {
  setLanguage(getLanguage() === "de" ? "en" : "de");
});
themeToggle.addEventListener("click", () => toggleTheme());

onLanguageChange(() => renderHelp());
onThemeChange(() => syncThemeControl());

function renderHelp(): void {
  const language = getLanguage();
  content.innerHTML = marked.parse(readme, { async: false }) as string;
  syncLanguageControl(language);
  syncThemeControl();
  document.title = `${t("header.help")} · ${t("app.title")}`;
  window.history.replaceState(null, "", `?lang=${language}`);
}

function syncLanguageControl(language: Lang): void {
  languageFlag.textContent = LANGUAGE_LABELS[language].flag;
  languageCode.textContent = language.toUpperCase();
  languageToggle.setAttribute("aria-label", t("lang.toggle.title"));
}

function syncThemeControl(): void {
  const isDark = getTheme() === "dark";
  themeIcon.textContent = isDark ? "☀" : "☾";
  const label = t(isDark ? "theme.toggle.toLight" : "theme.toggle.toDark");
  themeToggle.title = label;
  themeToggle.setAttribute("aria-label", label);
}

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element #${id}`);
  return element as T;
}
