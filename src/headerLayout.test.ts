import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import indexPage from "../index.html?raw";
import helpPage from "../help.html?raw";
import conceptPage from "../concept.html?raw";
import germanReadme from "../README.de.md?raw";
import englishReadme from "../README.md?raw";
import mainCode from "./main.ts?raw";
import helpCode from "./help.ts?raw";
import conceptCode from "./concept.ts?raw";
import { helpMarkdown } from "./helpSource";

const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");

function topActions(page: string): string {
  return page.split('class="top-actions"')[1]!.split("</nav>")[0]!;
}

describe("Kopfleiste (Design-Runde 3)", () => {
  it("ordnet Prüfbericht, Über, Hilfe-(i), Interface und Sprache in fester Reihenfolge", () => {
    const actions = topActions(indexPage);
    const order = ['id="download-report"', 'id="about-menu"', 'id="help-link"', 'id="btn-toggle-theme"', 'id="btn-toggle-language"']
      .map((marker) => actions.indexOf(marker));
    expect(order.every((position) => position >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("zeigt die Hilfe als Icon-Knopf mit Titel und aria-label statt als Text", () => {
    const helpLink = indexPage.split('id="help-link"')[1]!.split("</a>")[0]!;
    expect(helpLink).toContain("<svg");
    expect(helpLink).toContain('data-i18n-title="header.help"');
    expect(helpLink).toContain('data-i18n-aria-label="header.help"');
    expect(helpLink).not.toContain('data-i18n="header.help"');
  });

  it("bietet Interface- und Sprachknopf auch auf Hilfe- und Konzeptseite", () => {
    for (const page of [helpPage, conceptPage]) {
      const actions = topActions(page);
      expect(actions.indexOf('id="btn-toggle-theme"')).toBeGreaterThan(-1);
      expect(actions.indexOf('id="btn-toggle-language"')).toBeGreaterThan(actions.indexOf('id="btn-toggle-theme"'));
    }
  });
});

describe("Hilfe je Sprache", () => {
  it("rendert Deutsch aus README.de.md und Englisch aus README.md", () => {
    expect(helpMarkdown("de")).toBe(germanReadme);
    expect(helpMarkdown("en")).toBe(englishReadme);
  });

  it("deckt in der englischen Hilfe die Hauptabschnitte der deutschen ab", () => {
    for (const heading of [
      "## Help, language and appearance",
      "## Version display and compact disturbance preview",
      "## Setting the CRS / EPSG for the analysis",
      "## One combined export for all checks",
      "### DXF structure and duplicates",
      "### Hatch outlines",
      "### Save location and cancelling",
      "## Quick start",
      "## Versioning",
      "## Guiding principles",
      "## Version history",
      "## Repair single-vertex DXF lines",
    ]) {
      expect(englishReadme).toContain(heading);
    }
    const germanH2 = germanReadme.match(/^## /gm)!.length;
    const englishH2 = englishReadme.match(/^## /gm)!.length;
    expect(englishH2).toBeGreaterThanOrEqual(germanH2);
    expect(englishReadme).not.toMatch(/[ÃÂ]/);
  });
});

describe("Schrift Inter selbst gehostet", () => {
  it("importiert @fontsource-variable/inter in allen drei Einstiegen", () => {
    for (const code of [mainCode, helpCode, conceptCode]) {
      expect(code).toContain('import "@fontsource-variable/inter";');
    }
    expect(styles).toContain('--font-ui: "Inter Variable", "Inter", system-ui');
  });

  it("lädt keine Schriften von Google Fonts", () => {
    for (const source of [indexPage, helpPage, conceptPage, styles]) {
      expect(source).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);
    }
  });
});
