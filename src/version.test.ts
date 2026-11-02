import { describe, expect, it } from "vitest";
import packageMetadata from "../package.json";
import indexPage from "../index.html?raw";
import { de } from "./i18n/de";
import { en } from "./i18n/en";
import { APP_VERSION } from "./version";

describe("Versionskonsistenz", () => {
  it("verwendet displayVersion zentral in App, Kopfleiste und Fußleiste", () => {
    expect(APP_VERSION).toBe(packageMetadata.displayVersion);
    // Seit 26.23.2 gibt es keine eigene Versionszeile mehr unter der Fußleiste.
    expect(de).not.toHaveProperty("version.label");
    expect(en).not.toHaveProperty("version.label");
    expect(indexPage).toContain('id="footer-version"');
  });

  it("folgt dem Schema Jahr.Push.Iteration und ist npm-kompatibel identisch", () => {
    expect(packageMetadata.displayVersion).toMatch(/^\d{2}\.[1-9]\d*\.[1-9]\d*$/);
    expect(packageMetadata.version).toBe(packageMetadata.displayVersion);
  });

  it("zeigt die vollständige Version neben dem App-Titel an", () => {
    expect(indexPage).toContain('id="header-version"');
    expect(indexPage).toContain(`v${packageMetadata.displayVersion}</span>`);
  });
});
