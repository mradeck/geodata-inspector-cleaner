import { describe, expect, it } from "vitest";
import page from "../index.html?raw";
import copyrightDocument from "../docs/COPYRIGHT-LICENSES.md?raw";

describe("Über- und Copyright-Informationen", () => {
  it("verlinkt die reduzierte Pointcloud-Manager-Version transparent", () => {
    expect(page).toContain("https://stable-v53--pointcloud-manager.netlify.app/");
    expect(page).toContain('data-i18n="about.pointcloudDemoIntro"');
    expect(page).toContain('data-i18n="about.pointcloudDemoLink"');
  });

  it("bietet Copyright im Über-Menü und eine belastbare Lizenzquelle", () => {
    expect(page).toContain('id="open-copyright"');
    expect(page).toContain('id="copyright-dialog"');
    expect(copyrightDocument).toContain("**Release:** 2607.02.0");
    expect(copyrightDocument).toContain("## Direkte Laufzeitabhängigkeiten");
    expect(copyrightDocument).toContain("## OpenStreetMap");
  });
});
