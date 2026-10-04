import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import page from "../index.html?raw";
import footerCode from "./appFooter.ts?raw";
import { supportMailto } from "./appFooter";
import { APP_VERSION } from "./version";
import { de } from "./i18n/de";
import { en } from "./i18n/en";
const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");

describe("App-Fußzeile", () => {
  it("verlinkt die gemeinsamen Apps und Quellen, Impressum und Ko-fi ohne Embeds", () => {
    const footer = page.split('<footer class="app-footer">')[1]!.split('</footer>')[0]!;
    for (const url of [
      "https://measuremap-viewer-editor-emlid.netlify.app/",
      "https://skycheck-de.netlify.app/",
      "https://www.michael-radeck.de",
      "https://www.openstreetmap.org/copyright",
      "https://www.ldbv.bayern.de/produkte/weitere/opendata.html",
      "https://www.govdata.de/dl-de/by-2-0",
      "https://geoid-forge.netlify.app/",
      "https://dxf-coordinate-forge.netlify.app/",
      "https://www.pointcloud-manager.com",
      "https://mradeck.github.io/gps-utm-coordinate-converter/",
      "https://www.multikopterschule.de/Kontakt-Impressum/IMPRESSUM/",
      "https://ko-fi.com/mradeck/tip",
    ]) expect(footer).toContain(`href="${url}" target="_blank" rel="noopener noreferrer"`);
    expect(footer).not.toMatch(/<iframe|<script/);
    expect(footer).not.toContain('href="https://geodata-inspector-cleaner.netlify.app/"');
  });

  it("verwendet einen nativen Kontakt-Dialog und die bestehende Lizenzansicht", () => {
    expect(page).toContain('<dialog id="support-dialog"');
    expect(page).toContain('aria-labelledby="support-title"');
    expect(page).toContain('<form method="dialog">');
    expect(footerCode).toContain('dialog.showModal()');
    expect(footerCode).toContain('addEventListener("click", openCopyright)');
    expect(footerCode).toContain('onLanguageChange(sync)');
    expect(styles).toContain('grid-template-rows: 72px minmax(0, 1fr) auto');
  });

  it("bereitet E-Mails mit Versionsbezug ohne Projektdaten oder Anhänge vor", () => {
    for (const kind of ["bugreport", "contact"] as const) {
      const link = new URL(supportMailto(kind));
      expect(link.protocol).toBe("mailto:");
      expect(link.pathname).toBe("michael.radeck@email.de");
      expect(link.searchParams.get("subject")).toContain(APP_VERSION);
      expect([...link.searchParams.keys()].sort()).toEqual(kind === "bugreport" ? ["body", "subject"] : ["subject"]);
    }
    expect(new URL(supportMailto("bugreport")).searchParams.get("body")).toContain("Schritte zum Fehler");
    expect(footerCode).not.toMatch(/fetch\(|currentDataset|currentReport|\.files/);
  });

  it("lokalisiert alle neuen sichtbaren und barrierefreien Beschriftungen", () => {
    const footerMarkup = page.split('<footer class="app-footer">')[1]!.split('<div id="about-dialog"')[0]!;
    const keys = [...footerMarkup.matchAll(/data-i18n(?:-aria-label)?="([^"]+)"/g)].map(match => match[1]!);
    for (const key of keys) {
      expect(de).toHaveProperty(key);
      expect(en).toHaveProperty(key);
    }
    expect(en["footer.imprint"]).toBe("Imprint");
    expect(en["support.bugBody"]).toContain("Steps to reproduce");
  });
});
