import { describe, expect, it } from "vitest";
import { appendGeoJson } from "./appendGeoJson";
import { importGeoJson } from "./importGeoJson";
import { exportFeaturesAsDxf, createCleanedExport } from "./exportCleaned";
import { parseDxf } from "./parseDxf";
import { inspectDataset } from "../analysis/inspectDataset";

const incoming = () => importGeoJson(JSON.stringify({ type: "Feature", properties: { layer: "Added" }, geometry: { type: "LineString", coordinates: [[9,48,12],[9.001,48.001,13]] } }), "extra.geojson");

describe("adding GeoJSON", () => {
  it("retains previous GeoJSON objects with collision-free IDs and exports all", () => {
    const first = incoming();
    const merged = appendGeoJson(appendGeoJson(first, incoming(), "EPSG:25832"), incoming(), "EPSG:25832");
    expect(merged.features).toHaveLength(3);
    expect(new Set(merged.features.map((f) => f.id)).size).toBe(3);
    expect(merged.features[0]).toBe(first.features[0]);
    const result = createCleanedExport(merged, inspectDataset(merged), { outputFormat: "dxf", selectionIds: new Set(merged.features.map((f) => f.id)), allowUnchangedOutput: true });
    expect(parseDxf(result.content, result.fileName).features).toHaveLength(3);
  });
  it("preserves original DXF entity bytes and appends native entities with unique handles and layers", () => {
    const original = parseDxf(exportFeaturesAsDxf([{id:"old", layer:"Original", kind:"point",sourceType:"POINT",points:[{x:500000,y:5310000,z:73}]}], "EPSG:25832"), "original.dxf");
    const merged = appendGeoJson(appendGeoJson(original, incoming(), "EPSG:25832"), incoming(), "EPSG:25832");
    expect(merged.features).toHaveLength(3);
    expect(merged.features[0]!.points).toEqual(original.features[0]!.points);
    const old = original.dxfDuplicates!.entities[0]!;
    const kept = merged.dxfDuplicates!.entities[0]!;
    expect(merged.dxfDuplicates!.source.slice(kept.start,kept.end)).toBe(original.dxfDuplicates!.source.slice(old.start,old.end));
    const handles = merged.dxfDuplicates!.entities.flatMap((e) => e.tags.filter((t) => t.code === 5).map((t) => t.value));
    expect(new Set(handles).size).toBe(handles.length);
    expect(merged.layerMetadata?.filter((l) => l.name === "Added")).toHaveLength(1);
    expect(merged.dxfDuplicates!.candidates).toHaveLength(1);
    expect(merged.features[1]!.points.map((p) => p.z)).toEqual([12,13]);
  });
  it("rejects a CRS mismatch without changing the original", () => {
    const original = incoming(); const before = JSON.stringify(original);
    expect(() => appendGeoJson(original, incoming(), "EPSG:25833")).toThrow("append-crs");
    expect(JSON.stringify(original)).toBe(before);
  });
});
