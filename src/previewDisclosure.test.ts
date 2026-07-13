import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import indexPage from "../index.html?raw";

const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");

describe("Störbereichsvorschau", () => {
  it("ist als standardmäßig geschlossenes Details-Element aufgebaut", () => {
    const disclosure = indexPage.match(/<details id="disturbance-preview-card"[^>]*>/)?.[0];
    expect(disclosure).toBeDefined();
    expect(disclosure).not.toMatch(/\sopen(?:\s|=|>)/);
  });

  it("besitzt lokalisierbare Auf- und Einklappsteuerung", () => {
    expect(indexPage).toContain('id="disturbance-preview-toggle"');
    expect(indexPage).toContain('data-i18n="preview.disturbanceExpand"');
  });

  it("reduziert den geschlossenen Zustand auf die Kopfzeile", () => {
    expect(styles).toContain(".preview-card.disturbance-preview-card");
    expect(styles).toContain("display: block; align-self: start;");
    expect(styles).toContain(".disturbance-preview-card:not([open]) > .disturbance-preview-content { display: none; }");
  });

  it("hält Befunde scrollbar und entfernt die Roadmap-Kachel", () => {
    expect(styles).toContain(".findings-list { flex: 1 1 auto; min-height: 0;");
    expect(styles).toContain("overflow-y: auto;");
    expect(indexPage).not.toContain('class="roadmap-card"');
  });
});
