import { describe, expect, it } from "vitest";
import { normalizeStoredTheme } from "./theme";

describe("Theme-Einstellung", () => {
  it("verwendet hell als Default", () => {
    expect(normalizeStoredTheme(null)).toBe("light");
    expect(normalizeStoredTheme("unknown")).toBe("light");
  });

  it("akzeptiert eine gespeicherte helle Auswahl", () => {
    expect(normalizeStoredTheme("light")).toBe("light");
    expect(normalizeStoredTheme("dark")).toBe("dark");
  });
});
