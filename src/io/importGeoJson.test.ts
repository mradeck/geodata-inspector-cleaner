import { describe, expect, it } from "vitest";
import { importGeoJson } from "./importGeoJson";
import { readDataset } from "./readDataset";
import { createCleanedExport } from "./exportCleaned";
import { inspectDataset } from "../analysis/inspectDataset";
import { parseDxf } from "./parseDxf";

function point(coordinates = [9, 0, 123.45], name?: string) {
  return JSON.stringify({ type: "Feature", properties: { layer: "Survey", name: "Synthetic" },
    geometry: { type: "Point", coordinates },
    ...(name ? { crs: { type: "name", properties: { name } } } : {}) });
}

describe("GeoJSON import in EPSG:25832", () => {
  it("uses RFC 7946 longitude/latitude and truly projects at the file boundary, retaining Z and properties", async () => {
    const dataset = await readDataset(new File([point()], "synthetic.geojson"));
    expect(dataset.declaredCrs).toBe("EPSG:25832");
    expect(dataset.coordinateImport?.source).toBe("geojson-default");
    expect(dataset.features[0]!.points[0]!.x).toBeCloseTo(500000, 6);
    expect(dataset.features[0]!.points[0]!.y).toBeCloseTo(0, 6);
    expect(dataset.features[0]!.points[0]!.z).toBe(123.45);
    expect(dataset.features[0]!.properties?.name).toBe("Synthetic");
  });
  it.each(["EPSG:4326", "urn:ogc:def:crs:EPSG::4326", "urn:ogc:def:crs:OGC:1.3:CRS84"])("honors %s", (crs) => {
    expect(importGeoJson(point(undefined, crs), "test.json").features[0]!.points[0]!.x).toBeCloseTo(500000, 6);
  });
  it("does not reproject existing UTM coordinates twice", () => {
    const dataset = importGeoJson(point([500000, 5300000, 44], "EPSG:25832"), "test.json");
    expect(dataset.features[0]!.points[0]).toEqual({ x: 500000, y: 5300000, z: 44 });
  });
  it("rejects unsupported CRS and projected coordinates lacking a declaration", () => {
    expect(() => importGeoJson(point(undefined, "EPSG:99999"), "test.json")).toThrow("unsupported CRS");
    expect(() => importGeoJson(point([500000, 5300000]), "test.json")).toThrow("check source CRS");
  });
  it.each(["dxf", "geojson"] as const)("exports meter coordinates and reimports %s without displacement", (outputFormat) => {
    const dataset = importGeoJson(point(), "test.geojson");
    const output = createCleanedExport(dataset, inspectDataset(dataset), {
      outputFormat, selectionIds: new Set(dataset.features.map((f) => f.id)), allowUnchangedOutput: true,
    });
    const reloaded = outputFormat === "dxf" ? parseDxf(output.content, output.fileName) : importGeoJson(output.content, output.fileName);
    expect(reloaded.features[0]!.points[0]!.x).toBeCloseTo(500000, 6);
    expect(reloaded.features[0]!.points[0]!.z).toBe(123.45);
    if (outputFormat === "dxf") expect(output.content).toContain("$INSUNITS\n70\n6");
  });
});

it.skipIf(!process.env.GEOJSON_IMPORT_FIXTURE)("checks a private local polygon through DXF export without publishing a fixture", async () => {
  const { readFile } = await import("node:fs/promises");
  const text = await readFile(process.env.GEOJSON_IMPORT_FIXTURE!, "utf8");
  const original = JSON.parse(text);
  const source = original.features[0].geometry.coordinates[0] as number[][];
  const dataset = importGeoJson(text, "local.geojson");
  expect(dataset.features).toHaveLength(1);
  expect(dataset.features[0]!.points).toHaveLength(source.length - 1);
  expect(dataset.features[0]!.points.every((p) => p.x > 100000 && p.y > 1000000)).toBe(true);
  expect(dataset.features[0]!.points.map((p) => p.z)).toEqual(source.slice(0, -1).map((p) => p[2] ?? 0));
  const output = createCleanedExport(dataset, inspectDataset(dataset), {
    outputFormat: "dxf", selectionIds: new Set(dataset.features.map((f) => f.id)), allowUnchangedOutput: true,
  });
  const reloaded = parseDxf(output.content, output.fileName);
  expect(reloaded.features).toHaveLength(1);
  expect(reloaded.features[0]!.kind).toBe("polygon");
  expect(reloaded.features[0]!.points).toHaveLength(source.length - 1);
  for (const [index, p] of reloaded.features[0]!.points.entries()) {
    expect(p.x).toBeCloseTo(dataset.features[0]!.points[index]!.x, 5);
    expect(p.y).toBeCloseTo(dataset.features[0]!.points[index]!.y, 5);
  }
});
