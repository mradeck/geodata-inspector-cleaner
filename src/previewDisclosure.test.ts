import { describe, expect, it } from "vitest";
import indexPage from "../index.html?raw";

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
});
