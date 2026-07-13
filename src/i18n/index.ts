import { de, type TranslationKey } from "./de";
import { en } from "./en";

export type Lang = "de" | "en";

export const LANGUAGE_LABELS: Record<Lang, { name: string; flag: string }> = {
  de: { name: "Deutsch", flag: "🇩🇪" },
  en: { name: "English", flag: "🇬🇧" },
};

const DICTS = { de, en } satisfies Record<Lang, Record<TranslationKey, string>>;
const STORAGE_KEY = "gic.lang";
let currentLanguage: Lang = detectInitialLanguage();
const listeners = new Set<(language: Lang) => void>();

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const template = DICTS[currentLanguage][key] ?? de[key] ?? key;
  return params ? template.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`)) : template;
}

export function getLanguage(): Lang {
  return currentLanguage;
}

export function setLanguage(language: Lang): void {
  if (language === currentLanguage) return;
  currentLanguage = language;
  try { localStorage.setItem(STORAGE_KEY, language); } catch { /* storage unavailable */ }
  document.documentElement.lang = language;
  applyDomTranslations();
  listeners.forEach((listener) => listener(language));
}

export function initI18n(): void {
  document.documentElement.lang = currentLanguage;
  document.title = t("app.title");
  applyDomTranslations();
}

export function onLanguageChange(listener: (language: Lang) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function applyDomTranslations(): void {
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n as TranslationKey | undefined;
    if (key) element.textContent = t(key);
  });
  document.querySelectorAll<HTMLElement>("[data-i18n-title]").forEach((element) => {
    const key = element.dataset.i18nTitle as TranslationKey | undefined;
    if (key) element.title = t(key);
  });
  document.querySelectorAll<HTMLInputElement>("[data-i18n-placeholder]").forEach((element) => {
    const key = element.dataset.i18nPlaceholder as TranslationKey | undefined;
    if (key) element.placeholder = t(key);
  });
  document.querySelectorAll<HTMLElement>("[data-i18n-aria-label]").forEach((element) => {
    const key = element.dataset.i18nAriaLabel as TranslationKey | undefined;
    if (key) element.setAttribute("aria-label", t(key));
  });
}

export function formatNumber(value: number, maximumFractionDigits = 0): string {
  return value.toLocaleString(currentLanguage === "de" ? "de-DE" : "en-US", { maximumFractionDigits });
}

export function formatPercent(value: number, maximumFractionDigits = 0): string {
  return value.toLocaleString(currentLanguage === "de" ? "de-DE" : "en-US", {
    style: "percent",
    maximumFractionDigits,
  });
}

function detectInitialLanguage(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "de" || stored === "en") return stored;
  } catch { /* storage unavailable */ }
  if (typeof window === "undefined") return "de";
  const host = window.location.hostname;
  if (!host || host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) return "de";
  return navigator.language?.toLowerCase().startsWith("de") ? "de" : "en";
}
