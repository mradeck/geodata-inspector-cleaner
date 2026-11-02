import germanReadme from "../README.de.md?raw";
import englishReadme from "../README.md?raw";
import type { Lang } from "./i18n";

/** Hilfe-Quelle je Sprache: Deutsch aus README.de.md, Englisch aus README.md. */
export function helpMarkdown(language: Lang): string {
  return language === "en" ? englishReadme : germanReadme;
}
