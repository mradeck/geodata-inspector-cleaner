import { describe, expect, it } from "vitest";
import { inspectDataset } from "../analysis/inspectDataset";
import { selectionKey, type FeatureFilterSelection } from "../analysis/layerFilter";
import type { GeoDataset } from "../model";
import { CleanerError, createCleanedExport, omitCoveredHatchPreviews } from "./exportCleaned";
import { parseDxf } from "./parseDxf";
import { parseGeoJson } from "./parseGeoJson";

function dataset(format: "dxf" | "geojson"): GeoDataset {
  return {
    fileName: `project.${format === "dxf" ? "dxf" : "geojson"}`,
    format,
    declaredCrs: "EPSG:25832",
    warnings: [],
    features: [
      { id: "main-a", layer: "Gelände", kind: "line", sourceType: "LINE", points: [{ x: 676000, y: 5405296, z: 14 }, { x: 676020, y: 5405310, z: 15 }] },
      { id: "main-b", layer: "Plan/Kante", kind: "polygon", sourceType: "LWPOLYLINE", points: [{ x: 676010, y: 5405300, z: 14 }, { x: 676030, y: 5405300, z: 14 }, { x: 676030, y: 5405320, z: 14 }] },
      { id: "remote", layer: "Plankopf", kind: "anchor", sourceType: "TEXT", points: [{ x: 1_352_000, y: 10_810_000, z: 0 }] },
    ],
  };
}

function manuallySelectMain(source: GeoDataset) {
  return inspectDataset(source, { clusterDistanceMeters: 1_000 }, { preferredPrimaryFeatureId: "main-a" });
}

describe("bereinigter Export", () => {
  it("erzeugt mit der Pointcloud-Manager-Strategie eine neue DXF mit korrekten Extents", () => {
    const source = dataset("dxf");
    const result = createCleanedExport(source, manuallySelectMain(source));
    const reparsed = parseDxf(result.content, result.fileName);

    expect(result.fileName).toBe("project-cleaned.dxf");
    expect(result.keptFeatureCount).toBe(2);
    expect(result.removedFeatureCount).toBe(1);
    expect(result.content).toContain("$INSUNITS\n70\n6");
    expect(result.content).toContain("$EXTMIN");
    expect(result.content).toContain("$EXTMAX");
    expect(result.content).toContain("CRS EPSG:25832");
    expect(result.content).toContain("Cleaner retained features: 2");
    expect(result.content).toContain("Cleaner removed features: 1");
    expect(result.content).toContain("Plan_Kante");
    expect(result.content).not.toContain("1352000");
    expect(reparsed.features).toHaveLength(2);
    expect(inspectDataset(reparsed).clusters).toHaveLength(1);
  });

  it("verweigert den Export ohne manuelle Bestätigung", () => {
    const source = dataset("dxf");
    expect(() => createCleanedExport(source, inspectDataset(source)))
      .toThrowError(new CleanerError("primary-not-confirmed"));
  });

  it("schreibt GeoJSON neu und erhält Eigenschaften sowie Layer", () => {
    const source = dataset("geojson");
    source.features[0]!.properties = { objectId: 42 };
    const result = createCleanedExport(source, manuallySelectMain(source));
    const reparsed = parseGeoJson(result.content, result.fileName);

    expect(result.fileName).toBe("project-cleaned.geojson");
    expect(reparsed.features).toHaveLength(2);
    expect(reparsed.features[0]?.layer).toBe("Gelände");
    expect(reparsed.features[0]?.properties).toMatchObject({ objectId: 42, _cleanerLayer: "Gelände" });
    expect(JSON.parse(result.content)._cleaner).toMatchObject({ keptFeatureCount: 2, removedFeatureCount: 1 });
  });

  it("wendet Layer×Typ-Entscheidungen zusätzlich zum räumlichen Cleaner an", () => {
    const source = dataset("dxf");
    source.layerMetadata = [{
      name: "Gelände", color: "#00ff00", aciColor: 3, trueColor: null,
      lineType: "CONTINUOUS", lineWeight: 25, flags: 0, isOff: false,
      isFrozen: false, isLocked: false, isPlottable: true,
    }];
    const selection: FeatureFilterSelection = new Set([selectionKey("Gelände", "line")]);
    const result = createCleanedExport(source, manuallySelectMain(source), { featureFilterSelection: selection });
    const reparsed = parseDxf(result.content, result.fileName);

    expect(result.keptFeatureCount).toBe(1);
    expect(result.spatialRemovedFeatureCount).toBe(1);
    expect(result.filterRemovedFeatureCount).toBe(1);
    expect(result.removedFeatureCount).toBe(2);
    expect(result.content).toContain("Cleaner object filter: Plan/Kante / area: 1");
    expect(result.content).toContain("420\n65280");
    expect(reparsed.features.map((feature) => feature.layer)).toEqual(["Gelaende"]);
  });

  it("verweigert einen Objektfilter, der den Hauptbereich vollständig leert", () => {
    const source = dataset("dxf");
    expect(() => createCleanedExport(source, manuallySelectMain(source), { featureFilterSelection: new Set() }))
      .toThrowError(new CleanerError("nothing-kept"));
  });

  it("unterstützt reines Objekt-Cleaning auch ohne räumlichen Störcluster", () => {
    const source = dataset("dxf");
    source.features = source.features.filter((feature) => feature.id !== "remote");
    const selection: FeatureFilterSelection = new Set([selectionKey("Gelände", "line")]);
    const result = createCleanedExport(source, manuallySelectMain(source), { featureFilterSelection: selection });

    expect(result.keptFeatureCount).toBe(1);
    expect(result.spatialRemovedFeatureCount).toBe(0);
    expect(result.filterRemovedFeatureCount).toBe(1);
    expect(result.removedFeatureCount).toBe(1);
  });

  it("konvertiert ein bestätigtes GeoJSON mit Filterung in eine wieder einlesbare DXF", () => {
    const source = dataset("geojson");
    const result = createCleanedExport(source, manuallySelectMain(source), {
      outputFormat: "dxf",
      allowUnchangedOutput: true,
    });
    const reparsed = parseDxf(result.content, result.fileName);

    expect(result.fileName).toBe("project-cleaned.dxf");
    expect(result.outputFormat).toBe("dxf");
    expect(result.mimeType).toContain("application/dxf");
    expect(result.content).toContain("Cleaner format conversion: geojson -> dxf");
    expect(result.content).toContain("$INSUNITS\n70\n6");
    expect(reparsed.features).toHaveLength(2);
  });

  it("erlaubt eine unveränderte GeoJSON-Konvertierung und markiert geografische Werte als einheitenlos", () => {
    const source = dataset("geojson");
    source.features = source.features.filter((feature) => feature.id !== "remote");
    source.declaredCrs = "urn:ogc:def:crs:EPSG::4326";
    const result = createCleanedExport(source, manuallySelectMain(source), {
      outputFormat: "dxf",
      allowUnchangedOutput: true,
    });

    expect(result.fileName).toBe("project-converted.dxf");
    expect(result.removedFeatureCount).toBe(0);
    expect(result.content).toContain("$INSUNITS\n70\n0");
    expect(result.content).toContain("Coordinate values preserved without reprojection");
  });

  it("bietet AC1015 als OEM-Default und AC1032 mit identischer Vollstruktur", () => {
    const source = dataset("dxf");
    const report = manuallySelectMain(source);
    const ac1015 = createCleanedExport(source, report);
    const ac1032 = createCleanedExport(source, report, { acadVersion: "AC1032" });

    expect(ac1015.content).toContain("$ACADVER\n1\nAC1015");
    expect(ac1032.content).toContain("$ACADVER\n1\nAC1032");
    expect(ac1032.content).toContain("DXF target format: AC1032");
    for (const structuralMarker of ["$HANDSEED", "BLOCK_RECORD", "*Model_Space", "OBJECTS", "AcDbDictionary", "AcDb3dPolyline"]) {
      expect(ac1015.content).toContain(structuralMarker);
      expect(ac1032.content).toContain(structuralMarker);
    }
    expect(ac1032.content.replaceAll("AC1032", "AC1015")).toBe(ac1015.content);
    expect(parseDxf(ac1032.content, ac1032.fileName).features).toHaveLength(2);
  });
});

describe('covered hatch previews in normalized DXF output', () => {
  it('requires every ring, same layer, same Z, and a selected closed polyline; leaves other duplicates alone', () => {
    const outline = dataset('dxf').features[1]!;
    const inner = outline.points.map((p) => ({ ...p, x: p.x + 1 }));
    const hatch = { ...outline, id: 'hatch', sourceType: 'HATCH', hatchBoundaryPoints: [outline.points, inner] };
    const hole = { ...outline, id: 'inner', points: inner };
    expect(omitCoveredHatchPreviews([hatch, outline])).toHaveLength(2);
    expect(omitCoveredHatchPreviews([hatch, outline, hole])).toEqual([outline, hole]);
    expect(omitCoveredHatchPreviews([hatch, { ...outline, layer: 'other' }, hole])).toHaveLength(3);
    expect(omitCoveredHatchPreviews([hatch, { ...outline, kind: 'polyline' }, hole])).toHaveLength(3);
    expect(omitCoveredHatchPreviews([hatch, { ...outline, points: outline.points.map((p) => ({...p,z:p.z+0.000001})) }, hole])).toHaveLength(3);
    expect(omitCoveredHatchPreviews([hatch])).toEqual([hatch]);
    expect(omitCoveredHatchPreviews([outline, {...outline,id:'copy'}])).toHaveLength(2);
    expect(omitCoveredHatchPreviews([{...hatch,hatchBoundaryPoints:undefined},outline,hole])).toHaveLength(3);
  });
});
