import { describe, expect, it } from "vitest";
import germanConcept from "../docs/PRODUCT-DESIGN.md?raw";
import englishConcept from "../docs/PRODUCT-DESIGN.en.md?raw";

describe("localized product concept", () => {
  it("provides complete German and English success criteria", () => {
    expect(germanConcept).toContain("## 9. Erfolgskriterien");
    expect(germanConcept).toContain("Plankopf-Ausreißern lässt sich");
    expect(englishConcept).toContain("## 9. Success Criteria");
    expect(englishConcept).toContain("remote title-block outliers can be opened");
  });

  it("contains no common UTF-8 mojibake sequences", () => {
    for (const document of [germanConcept, englishConcept]) {
      expect(document).not.toMatch(/[ÃÂ]/);
      expect(document).not.toContain("â€“");
      expect(document).not.toContain("â€œ");
    }
  });
});
