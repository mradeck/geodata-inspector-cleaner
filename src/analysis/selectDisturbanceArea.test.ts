import { describe, expect, it } from "vitest";
import type { GeoDataset, GeoFeature } from "../model";
import { inspectDataset } from "./inspectDataset";
import { selectDisturbanceArea } from "./selectDisturbanceArea";

function line(id: string, x: number, y: number): GeoFeature {
  return {
    id,
    layer: "Plan",
    kind: "line",
    sourceType: "LINE",
    points: [{ x, y, z: 0 }, { x: x + 10, y: y + 10, z: 0 }],
  };
}

function inspect(features: GeoFeature[]) {
  const dataset: GeoDataset = { fileName: "test.dxf", format: "dxf", features, declaredCrs: null, warnings: [] };
  return inspectDataset(dataset);
}

describe("selectDisturbanceArea", () => {
  it("zeigt bei dominantem Hauptcluster die Entfernungsempfehlung separat", () => {
    const report = inspect([
      line("a", 0, 0), line("b", 20, 20), line("c", 40, 40),
      line("d", 60, 60), line("e", 80, 80), line("title", 50_000, 50_000),
    ]);
    const disturbance = selectDisturbanceArea(report);

    expect(disturbance?.assessment).toBe("recommended-removal");
    expect([...disturbance?.featureIds ?? []]).toEqual(["title"]);
  });

  it("zeigt bei gleichrangigen Clustern den Gegenbereich nur als Prüfbereich", () => {
    const report = inspect([
      line("a", 0, 0), line("b", 20, 20),
      line("c", 50_000, 50_000), line("d", 50_020, 50_020),
    ]);
    const disturbance = selectDisturbanceArea(report);

    expect(disturbance?.assessment).toBe("review");
    expect(disturbance?.featureIds.size).toBe(2);
  });

  it("liefert bei einem einzelnen Cluster keinen Störbereich", () => {
    const report = inspect([line("a", 0, 0), line("b", 20, 20)]);
    expect(selectDisturbanceArea(report)).toBeNull();
  });
});
