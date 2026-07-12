import { describe, expect, it } from "vitest";
import { normalizeStoredTheme } from "./theme";

describe("Theme-Einstellung", () => {
  it("verwendet dunkel als sicheren Default", () => {
    expect(normalizeStoredTheme(null)).toBe("dark");
    expect(normalizeStoredTheme("unknown")).toBe("dark");
  });

  it("akzeptiert eine gespeicherte helle Auswahl", () => {
    expect(normalizeStoredTheme("light")).toBe("light");
    expect(normalizeStoredTheme("dark")).toBe("dark");
  });
});
