import { marked } from "marked";

/**
 * Gemeinsamer Markdown-Renderer für Haupt-App (Copyright-Dialog), Hilfe- und
 * Konzeptseite. Die Haupt-App lädt dieses Modul dynamisch; Hilfe und Konzept
 * importieren es statisch. Der Umweg über ein eigenes Modul hält den
 * gemeinsamen Chunk frei von Verweisen auf den main-Chunk, damit die
 * Nebenseiten im Produktions-Build nicht den App-Bootstrap mitstarten.
 */
export function renderMarkdown(source: string): string {
  return marked.parse(source, { async: false }) as string;
}
