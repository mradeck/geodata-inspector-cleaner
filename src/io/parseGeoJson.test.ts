import { describe, expect, it } from "vitest";
import { parseGeoJson } from "./parseGeoJson";

describe("parseGeoJson", () => {
  it("normalisiert Multi-Geometrien, Layer und CRS", () => {
    const dataset = parseGeoJson(JSON.stringify({
      type: "FeatureCollection",
      crs: { type: "name", properties: { name: "EPSG:25832" } },
      features: [
        {
          type: "Feature",
          properties: { layer: "Grenzen" },
          geometry: { type: "MultiLineString", coordinates: [[[1, 2, 3], [4, 5, 6]], [[10, 20], [30, 40]]] },
        },
      ],
    }), "plan.geojson");

    expect(dataset.features).toHaveLength(2);
    expect(dataset.features.every((feature) => feature.layer === "Grenzen")).toBe(true);
    expect(dataset.declaredCrs).toBe("EPSG:25832");
    expect(dataset.features[1]?.points[0]?.z).toBe(0);
  });

  it("bilanziert Polygonlöcher statt sie still zu verlieren", () => {
    const dataset = parseGeoJson(JSON.stringify({
      type: "Polygon",
      coordinates: [
        [[0, 0], [10, 0], [10, 10], [0, 0]],
        [[2, 2], [3, 2], [3, 3], [2, 2]],
      ],
    }), "area.geojson");

    expect(dataset.features).toHaveLength(1);
    expect(dataset.warnings.find((warning) => warning.code === "geojson.holes-preview")?.count).toBe(1);
  });
});
