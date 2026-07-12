import type { GeoDataset, GeoFeature, Position3 } from "../model";

const features: GeoFeature[] = [];
let nextId = 1;

function addLine(layer: string, points: Position3[], sourceType = "LINE"): void {
  features.push({ id: `demo-${nextId++}`, layer, kind: points.length === 2 ? "line" : "polyline", points, sourceType });
}

const baseX = 704_700;
const baseY = 5_389_400;
for (let index = 0; index < 16; index++) {
  const x = baseX + (index % 4) * 70;
  const y = baseY + Math.floor(index / 4) * 55;
  addLine("Bestand", [
    { x, y, z: 424 + (index % 3) * 0.4 },
    { x: x + 55, y: y + 35, z: 424.2 + (index % 3) * 0.4 },
  ]);
}
addLine("2D-Ergänzung", [{ x: baseX + 100, y: baseY + 80, z: 0 }, { x: baseX + 145, y: baseY + 95, z: 0 }]);

const titleX = -400_000;
const titleY = -20_000_000;
addLine("Plankopf", [{ x: titleX, y: titleY, z: 0 }, { x: titleX + 420, y: titleY, z: 0 }], "LWPOLYLINE");
addLine("Plankopf", [{ x: titleX + 420, y: titleY, z: 0 }, { x: titleX + 420, y: titleY + 297, z: 0 }], "LWPOLYLINE");
addLine("Plankopf", [{ x: titleX + 420, y: titleY + 297, z: 0 }, { x: titleX, y: titleY + 297, z: 0 }], "LWPOLYLINE");
addLine("Plankopf", [{ x: titleX, y: titleY + 297, z: 0 }, { x: titleX, y: titleY, z: 0 }], "LWPOLYLINE");

export const demoDataset: GeoDataset = {
  fileName: "demo-bestandsplan-mit-plankopf.dxf",
  format: "dxf",
  declaredCrs: "EPSG:25832",
  features,
  warnings: [
    {
      code: "demo.approximation",
      message: "Demo: Plankopf-Beschriftungen nur über Ankerpunkte repräsentiert",
      count: 3,
    },
  ],
};
