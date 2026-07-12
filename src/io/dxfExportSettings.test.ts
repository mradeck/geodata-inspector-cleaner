import { describe, expect, it } from "vitest";
import { getDxfAcadVersion, setDxfAcadVersion } from "./dxfExportSettings";

function fakeStorage() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

describe("DXF-Zielformat-Einstellung", () => {
  it("verwendet AC1015 als Default und merkt AC1032", () => {
    const storage = fakeStorage();
    expect(getDxfAcadVersion(storage)).toBe("AC1015");
    setDxfAcadVersion("AC1032", storage);
    expect(getDxfAcadVersion(storage)).toBe("AC1032");
    setDxfAcadVersion("AC1015", storage);
    expect(getDxfAcadVersion(storage)).toBe("AC1015");
    expect(storage.values.size).toBe(0);
  });

  it("fällt bei Storage-Fehlern sicher auf AC1015 zurück", () => {
    const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => { throw new Error("blocked"); } };
    expect(getDxfAcadVersion(broken)).toBe("AC1015");
    expect(() => setDxfAcadVersion("AC1032", broken)).not.toThrow();
  });
});
