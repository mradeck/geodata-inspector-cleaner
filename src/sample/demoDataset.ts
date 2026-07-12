import type { GeoDataset, GeoFeature, Position3 } from "../model";

const features: GeoFeature[] = [];
let nextId = 1;

function addLine(layer: string, points: Position3[], sourceType = "LINE"): void {
  features.push({ id: `demo-${nextId++}`, layer, kind: points.length === 2 ? "line" : "polyline", points, sourceType });
}

function addAnchor(layer: string, point: Position3, sourceType = "MTEXT"): void {
  features.push({
    id: `demo-${nextId++}`,
    layer,
    kind: "anchor",
    points: [point],
    sourceType,
    approximation: `${sourceType} wird nur über den Einfüge-/Ankerpunkt bewertet.`,
  });
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
// 14 Beschriftungsanker machen den falschen Cluster mit insgesamt 18 Features
// minimal größer als den 17-Feature-Projektbereich. Das bildet den realen
// private-project-Fast-50/50-Fall nach und beweist, warum „größter Cluster gewinnt"
// ohne Kartenprüfung nicht ausreicht.
for (let index = 0; index < 14; index++) {
  addAnchor("Plankopf", {
    x: titleX + 35 + (index % 2) * 190,
    y: titleY + 35 + Math.floor(index / 2) * 32,
    z: 0,
  });
}

export const demoDataset: GeoDataset = {
  fileName: "demo-bestandsplan-mit-plankopf.dxf",
  format: "dxf",
  declaredCrs: "EPSG:25832",
  features,
  layerMetadata: [
    { name: "2D-Ergänzung", color: "#4da3ff", aciColor: 5, trueColor: 5_088_255, lineType: "DASHED", lineWeight: 18, flags: 0, isOff: false, isFrozen: false, isLocked: false, isPlottable: true },
    { name: "Bestand", color: "#4de2b1", aciColor: 3, trueColor: 5_104_305, lineType: "CONTINUOUS", lineWeight: 25, flags: 0, isOff: false, isFrozen: false, isLocked: false, isPlottable: true },
    { name: "Plankopf", color: "#ff647c", aciColor: 1, trueColor: 16_737_404, lineType: "CONTINUOUS", lineWeight: 35, flags: 4, isOff: false, isFrozen: false, isLocked: true, isPlottable: true },
  ],
  warnings: [
    {
      code: "demo.approximation",
      message: "Demo: Plankopf-Beschriftungen nur über Ankerpunkte repräsentiert",
      count: 14,
    },
  ],
};
