import { describe, expect, it } from "vitest";
import readme from "../README.md?raw";

describe("README-basierte Hilfe", () => {
  it("enthält die zentralen Bedien- und Exportabschnitte", () => {
    expect(readme).toContain("## Schnellstart");
    expect(readme).toContain("DXF-Zielformat");
    expect(readme).toContain("Störbereich entfernen und bereinigte Datei speichern");
  });

  it("enthält die veröffentlichte Anwendung und kein typisches UTF-8-Mojibake", () => {
    expect(readme).toContain("https://geodata-inspector-cleaner.netlify.app/");
    expect(readme).not.toMatch(/[ÃÂ]/);
    expect(readme).not.toContain("â€“");
  });
});
