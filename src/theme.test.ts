import { describe, expect, it } from "vitest";
import page from "../index.html?raw";
import helpPage from "../help.html?raw";
import conceptPage from "../concept.html?raw";
import { nextThemeMode, normalizeStoredTheme, resolveTheme, THEME_ICONS } from "./theme";

describe("Theme-Einstellung", () => {
  it("verwendet automatisch als Default", () => {
    expect(normalizeStoredTheme(null)).toBe("auto");
    expect(normalizeStoredTheme("unknown")).toBe("auto");
    expect(normalizeStoredTheme("auto")).toBe("auto");
  });

  it("akzeptiert eine gespeicherte helle oder dunkle Auswahl", () => {
    expect(normalizeStoredTheme("light")).toBe("light");
    expect(normalizeStoredTheme("dark")).toBe("dark");
  });

  it("schaltet zyklisch automatisch → hell → dunkel → automatisch", () => {
    expect(nextThemeMode("auto")).toBe("light");
    expect(nextThemeMode("light")).toBe("dark");
    expect(nextThemeMode("dark")).toBe("auto");
  });

  it("folgt im automatischen Modus der Systemeinstellung", () => {
    expect(resolveTheme("auto", true)).toBe("light");
    expect(resolveTheme("auto", false)).toBe("dark");
    expect(resolveTheme("light", false)).toBe("light");
    expect(resolveTheme("dark", true)).toBe("dark");
  });

  it("liefert Inline-SVG-Symbole für alle drei Zustände", () => {
    for (const icon of Object.values(THEME_ICONS)) expect(icon).toMatch(/^<svg [^>]*aria-hidden="true"/);
  });

  it("setzt das Theme vor dem ersten Zeichnen auf allen Seiten", () => {
    for (const html of [page, helpPage, conceptPage]) {
      const head = html.split("</head>")[0]!;
      expect(head).toContain('localStorage.getItem("gic.theme")');
      expect(head).toContain("prefers-color-scheme: light");
      expect(head).not.toContain('<script type="module"');
    }
  });
});
