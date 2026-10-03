import { marked } from "marked";
import germanConcept from "../docs/PRODUCT-DESIGN.md?raw";
import englishConcept from "../docs/PRODUCT-DESIGN.en.md?raw";
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

const content = byId<HTMLElement>("concept-content");
const languageToggle = byId<HTMLButtonElement>("btn-toggle-language");
const languageFlag = byId<HTMLImageElement>("language-flag");
const languageCode = byId<HTMLElement>("language-code");

initI18n();
const requestedLanguage = new URLSearchParams(window.location.search).get("lang");
if (requestedLanguage === "de" || requestedLanguage === "en") {
  setLanguage(requestedLanguage);
}
renderConcept();

languageToggle.addEventListener("click", () => {
  setLanguage(getLanguage() === "de" ? "en" : "de");
});

onLanguageChange(() => renderConcept());

function renderConcept(): void {
  const language = getLanguage();
  const markdown = language === "de" ? germanConcept : englishConcept;
  content.innerHTML = marked.parse(markdown, { async: false }) as string;
  syncLanguageControl(language);
  document.title = `${t("header.concept")} · ${t("app.title")}`;
  window.history.replaceState(null, "", `?lang=${language}`);
}

function syncLanguageControl(language: Lang): void {
  languageFlag.src = LANGUAGE_LABELS[language].flag;
  languageCode.textContent = language.toUpperCase();
  languageToggle.setAttribute("aria-label", t("lang.toggle.title"));
}

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element #${id}`);
  return element as T;
}
