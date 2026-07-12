import { describe, expect, it } from "vitest";
import packageMetadata from "../package.json";
import { de } from "./i18n/de";
import { en } from "./i18n/en";
import { APP_VERSION } from "./version";

describe("Versionskonsistenz", () => {
  it("verwendet displayVersion zentral in App und Sprachkatalogen", () => {
    expect(APP_VERSION).toBe(packageMetadata.displayVersion);
    expect(de["version.label"]).toBe(`Version ${packageMetadata.displayVersion}`);
    expect(en["version.label"]).toBe(`Version ${packageMetadata.displayVersion}`);
  });

  it("bildet die kanonische Version npm-kompatibel ohne führende Release-Null ab", () => {
    const [period, release, patch] = packageMetadata.displayVersion.split(".");
    expect(packageMetadata.version).toBe(`${period}.${Number(release)}.${patch}`);
  });
});
