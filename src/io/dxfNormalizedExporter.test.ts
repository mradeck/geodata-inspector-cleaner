import { describe, expect, it } from "vitest";
import type { GeoFeature } from "../model";
import { exportNormalizedDxf } from "./dxfNormalizedExporter";
import { parseDxf } from "./parseDxf";

const features: GeoFeature[] = [
  { id: "1", layer: "Bäume", kind: "point", sourceType: "POINT", points: [{ x: 676000.123, y: 5405296.456, z: 14.2 }] },
  { id: "2", layer: "Baeume", kind: "line", sourceType: "LINE", points: [{ x: 676001, y: 5405297, z: 14 }, { x: 676010, y: 5405310, z: 15 }] },
  { id: "3", layer: "Plan/Kante", kind: "polygon", sourceType: "LWPOLYLINE", points: [{ x: 676002, y: 5405298, z: 14 }, { x: 676008, y: 5405298, z: 14 }, { x: 676008, y: 5405305, z: 14 }] },
];

function groups(text: string): Array<{ code: number; value: string }> {
  const lines = text.trimEnd().split("\n");
  const result: Array<{ code: number; value: string }> = [];
  for (let index = 0; index + 1 < lines.length; index += 2) {
    result.push({ code: Number(lines[index]), value: lines[index + 1] ?? "" });
  }
  return result;
}

describe("vollständiger normalisierter DXF-Exporter", () => {
  it("schreibt das OEM-Gerüst, eindeutige Handles und kollisionsfreie Layernamen", () => {
    const dxf = exportNormalizedDxf(features, {
      acadVersion: "AC1015",
      insUnits: 6,
      coordinateSystemLabel: "EPSG:25832",
      comments: [],
    });
    const parsedGroups = groups(dxf);
    const handles = parsedGroups.filter((group) => group.code === 5).map((group) => group.value);

    for (const marker of ["LTYPE", "LAYER", "STYLE", "APPID", "VIEW", "UCS", "VPORT", "DIMSTYLE", "BLOCK_RECORD", "BLOCKS", "OBJECTS", "ACAD_GROUP"]) {
      expect(dxf).toContain(marker);
    }
    expect(new Set(handles).size).toBe(handles.length);
    expect(dxf).toContain("2\nBaeume\n");
    expect(dxf).toContain("2\nBaeume_2\n");
    expect(dxf).toContain("2\nPlan_Kante\n");
    expect(parsedGroups.filter((group) => [10, 11, 20, 21, 30, 31].includes(group.code)).map((group) => group.value).join(" ")).not.toMatch(/[eE]/);
    expect(parseDxf(dxf, "complete.dxf").features).toHaveLength(3);
  });

  it("ändert zwischen AC1015 und AC1032 nur das gewählte Profil", () => {
    const base = { insUnits: 6 as const, coordinateSystemLabel: null, comments: [] };
    const ac1015 = exportNormalizedDxf(features, { ...base, acadVersion: "AC1015" });
    const ac1032 = exportNormalizedDxf(features, { ...base, acadVersion: "AC1032" });
    expect(ac1032.replace("AC1032", "AC1015")).toBe(ac1015);
  });
});
