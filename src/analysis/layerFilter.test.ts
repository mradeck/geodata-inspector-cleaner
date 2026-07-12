import { describe, expect, it } from "vitest";
import type { GeoDataset } from "../model";
import {
  buildDefaultSelection,
  classifyFeature,
  filterFeatures,
  selectionKey,
  summarizeLayers,
} from "./layerFilter";

const dataset: GeoDataset = {
  fileName: "layers.dxf",
  format: "dxf",
  declaredCrs: null,
  warnings: [],
  layerMetadata: [{
    name: "2 Punkte", color: "#00ff00", aciColor: 3, trueColor: null,
    lineType: "DASHED", lineWeight: 25, flags: 4, isOff: false,
    isFrozen: false, isLocked: true, isPlottable: true,
  }],
  features: [
    { id: "p", layer: "2 Punkte", kind: "point", sourceType: "POINT", points: [{ x: 0, y: 0, z: 0 }] },
    { id: "t", layer: "2 Punkte", kind: "anchor", sourceType: "TEXT", points: [{ x: 1, y: 1, z: 0 }] },
    { id: "l", layer: "10 Linien", kind: "line", sourceType: "LINE", points: [{ x: 0, y: 0, z: 0 }, { x: 2, y: 2, z: 0 }] },
  ],
};

describe("Layer- und Objekttypfilter", () => {
  it("fasst numerisch sortiert zusammen und übernimmt Metadaten", () => {
    const summaries = summarizeLayers(dataset);
    expect(summaries.map((summary) => summary.layerName)).toEqual(["2 Punkte", "10 Linien"]);
    expect(summaries[0]?.counts.point).toBe(2);
    expect(summaries[0]?.metadata).toMatchObject({ color: "#00ff00", lineType: "DASHED", isLocked: true });
  });

  it("klassifiziert Anker als exportierte Punkte und wählt Punkte standardmäßig ab", () => {
    expect(classifyFeature(dataset.features[1]!)).toBe("point");
    const selection = buildDefaultSelection(summarizeLayers(dataset));
    expect(selection.has(selectionKey("2 Punkte", "point"))).toBe(false);
    expect(filterFeatures(dataset.features, selection).map((feature) => feature.id)).toEqual(["l"]);
  });
});
