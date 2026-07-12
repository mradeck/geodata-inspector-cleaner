import { describe, expect, it } from "vitest";
import { de } from "./de";
import { en } from "./en";

describe("i18n catalogs", () => {
  it("keeps German and English catalogs in exact key parity", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(de).sort());
  });

  it("contains no blank translations", () => {
    expect(Object.values(de).every((value) => value.trim().length > 0)).toBe(true);
    expect(Object.values(en).every((value) => value.trim().length > 0)).toBe(true);
  });
});
