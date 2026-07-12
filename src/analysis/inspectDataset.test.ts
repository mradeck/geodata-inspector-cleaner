import { describe, expect, it } from "vitest";
import { inspectDataset } from "./inspectDataset";
import type { GeoDataset, GeoFeature } from "../model";

function line(id: string, x: number, y: number, z = 425): GeoFeature {
  return {
    id,
    layer: "Plan",
    kind: "line",
    sourceType: "LINE",
    points: [{ x, y, z }, { x: x + 20, y: y + 10, z }],
  };
}

function dataset(features: GeoFeature[], declaredCrs: string | null = null): GeoDataset {
  return { fileName: "test.dxf", format: "dxf", features, declaredCrs, warnings: [] };
}

describe("inspectDataset", () => {
  it("findet einen weit entfernten Plankopf und quantifiziert die Extent-Inflation", () => {
    const features = [
      line("a", 704_700, 5_389_400),
      line("b", 704_760, 5_389_440),
      line("c", 704_820, 5_389_410),
      line("d", 704_740, 5_389_500),
      line("e", 704_810, 5_389_480),
      line("title", -400_000, -20_000_000, -16_000),
    ];
    const report = inspectDataset(dataset(features));

    expect(report.clusters).toHaveLength(2);
    expect(report.primaryIsDominant).toBe(true);
    expect(report.recommendedRemovalIds.has("title")).toBe(true);
    expect(report.extentInflationFactor).toBeGreaterThan(1000);
    expect(report.findings.some((finding) => finding.category === "remote-cluster")).toBe(true);
  });

  it("empfiehlt bei zwei gleich großen Gruppen keine automatische Entfernung", () => {
    const features = [
      line("a", 0, 0),
      line("b", 10, 10),
      line("c", 10_000, 10_000),
      line("d", 10_010, 10_010),
    ];
    const report = inspectDataset(dataset(features));

    expect(report.primaryIsDominant).toBe(false);
    expect(report.recommendedRemovalIds.size).toBe(0);
    expect(report.findings.some((finding) => finding.category === "ambiguous-primary")).toBe(true);
  });

  it("weist WGS84 ohne Metadaten nur als plausiblen Kandidaten aus", () => {
    const report = inspectDataset(dataset([
      line("a", 11.77, 48.62, 0),
      line("b", 11.78, 48.63, 0),
    ]));

    expect(report.crs.status).toBe("plausible");
    expect(report.crs.label).toContain("WGS84");
  });

  it("meldet einzelne Z=0-Features nur neben deutlich echten Höhen", () => {
    const features = [
      line("a", 100, 100, 425),
      line("b", 120, 120, 426),
      line("zero", 140, 140, 0),
    ];
    const report = inspectDataset(dataset(features));
    const finding = report.findings.find((item) => item.category === "z-zero");

    expect(finding?.featureIds).toEqual(["zero"]);
  });
});
