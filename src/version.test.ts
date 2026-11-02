import { describe, expect, it } from "vitest";
import packageMetadata from "../package.json";
import indexPage from "../index.html?raw";
import { de } from "./i18n/de";
import { en } from "./i18n/en";
import { APP_VERSION } from "./version";

describe("Versionskonsistenz", () => {
  it("verwendet displayVersion zentral in App und Sprachkatalogen", () => {
    expect(APP_VERSION).toBe(packageMetadata.displayVersion);
    expect(de["version.label"]).toBe(`Version ${packageMetadata.displayVersion}`);
    expect(en["version.label"]).toBe(`Version ${packageMetadata.displayVersion}`);
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
