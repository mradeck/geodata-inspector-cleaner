import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { analyzeDataset } from "./analysis/analyzeDataset";
import { inspectDataset } from "./analysis/inspectDataset";
import { assessClustersForMap, normalizeEpsg } from "./geo/mapProjection";
import { createCleanedExport } from "./io/exportCleaned";
import type { GeoDataset, GeoFeature } from "./model";

function line(id: string, x: number, y: number): GeoFeature {
  return {
    id,
    layer: "Plan",
    kind: "line",
    sourceType: "LINE",
    points: [{ x, y, z: 0 }, { x: x + 20, y: y + 10, z: 0 }],
  };
}

function ambiguousDataset(): GeoDataset {
  return {
    fileName: "crs-input.dxf",
    format: "dxf",
    declaredCrs: null,
    warnings: [],
    features: [
      line("remote-a", 1_352_038, 10_810_648),
      line("remote-b", 1_352_088, 10_810_698),
      line("project-a", 676_000, 5_405_296),
      line("project-b", 676_050, 5_405_346),
    ],
  };
}

describe("CRS analysis input", () => {
  it("normalisiert die Schreibweisen aus dem Pointcloud Manager", () => {
    expect(normalizeEpsg("25832")).toBe("EPSG:25832");
    expect(normalizeEpsg("epsg 25832")).toBe("EPSG:25832");
    expect(normalizeEpsg("UTM32N")).toBe("EPSG:25832");
    expect(normalizeEpsg("kein-code")).toBeNull();
  });

  it("nutzt die Eingabe für eine neue CRS-gestützte Hauptbereichswahl", () => {
    const report = analyzeDataset(ambiguousDataset(), {}, { analysisCrs: "EPSG:25832" });
    const primary = report.clusters.find((cluster) => cluster.isPrimary);
    const mapReport = assessClustersForMap(report);

    expect(report.analysisCrs).toBe("EPSG:25832");
    expect(report.crs.source).toBe("input");
    expect(report.primarySelection).toBe("crs");
    expect(primary?.featureIds).toContain("project-a");
    expect(mapReport.source).toBe("input");
    expect(mapReport.clusters.filter((cluster) => cluster.status === "mappable")).toHaveLength(1);
  });

  it("hält automatisch übernommene Dateimetadaten von manueller Eingabe getrennt", () => {
    const dataset = { ...ambiguousDataset(), declaredCrs: "EPSG:25832" };
    const report = analyzeDataset(dataset);
    const mapReport = assessClustersForMap(report);

    expect(report.analysisCrs).toBeNull();
    expect(report.crs.source).toBe("metadata");
    expect(mapReport.source).toBe("declared");
  });

  it("übernimmt das Analyse-CRS als Exporthinweis ohne Koordinatenänderung", () => {
    const dataset = ambiguousDataset();
    const report = inspectDataset(dataset, {}, {
      analysisCrs: "EPSG:25832",
      preferredPrimaryFeatureId: "project-a",
      preferredPrimarySource: "manual",
    });
    const exported = createCleanedExport(dataset, report, {
      coordinateSystemLabel: report.analysisCrs,
    });

    expect(exported.content).toContain("CRS EPSG:25832");
    expect(exported.content).toContain("676000");
  });

  it("liefert das sichtbare Eingabefeld mit EPSG:25832 als Default aus", () => {
    const indexPage = readFileSync(new URL("../index.html", import.meta.url), "utf8");
    expect(indexPage).toContain('id="analysis-crs"');
    expect(indexPage).toContain('value="EPSG:25832"');
    expect(indexPage).toContain('aria-describedby="analysis-crs-help"');
  });
});
