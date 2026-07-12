import type { Bounds2D, GeoDataset, InspectionReport, Position3 } from "../model";

interface RenderOptions {
  bounds: Bounds2D | null;
  visibleFeatureIds?: Set<string> | null;
  highlightedFeatureIds?: Set<string>;
  showClusterOverview?: boolean;
}

export function renderPreview(
  canvas: HTMLCanvasElement,
  dataset: GeoDataset,
  report: InspectionReport,
  options: RenderOptions,
): void {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(rect.width * ratio));
  const height = Math.max(1, Math.round(rect.height * ratio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const context = canvas.getContext("2d");
  if (!context) return;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, rect.width, rect.height);
  drawBackground(context, rect.width, rect.height);
  if (!options.bounds) return;

  const padding = 26;
  const boundsWidth = Math.max(options.bounds.maxX - options.bounds.minX, 1e-9);
  const boundsHeight = Math.max(options.bounds.maxY - options.bounds.minY, 1e-9);
  const scale = Math.min((rect.width - padding * 2) / boundsWidth, (rect.height - padding * 2) / boundsHeight);
  const renderedWidth = boundsWidth * scale;
  const renderedHeight = boundsHeight * scale;
  const offsetX = (rect.width - renderedWidth) / 2;
  const offsetY = (rect.height - renderedHeight) / 2;

  const toScreen = (point: Position3): [number, number] => [
    offsetX + (point.x - options.bounds!.minX) * scale,
    rect.height - offsetY - (point.y - options.bounds!.minY) * scale,
  ];

  const primaryIds = new Set(report.clusters.find((cluster) => cluster.isPrimary)?.featureIds ?? []);
  const highlighted = options.highlightedFeatureIds ?? new Set<string>();
  const visibleIds = options.visibleFeatureIds;

  for (const feature of dataset.features) {
    if (visibleIds && !visibleIds.has(feature.id)) continue;
    const isHighlighted = highlighted.has(feature.id);
    const isRemote = !primaryIds.has(feature.id);
    context.strokeStyle = isHighlighted ? "#ffd166" : isRemote ? "#ff647c" : "#4de2b1";
    context.fillStyle = context.strokeStyle;
    context.lineWidth = isHighlighted ? 3 : isRemote ? 2 : 1.4;
    context.globalAlpha = isHighlighted ? 1 : 0.86;

    if (feature.points.length === 1 || feature.kind === "anchor" || feature.kind === "point") {
      const point = feature.points[0];
      if (!point) continue;
      const [x, y] = toScreen(point);
      context.beginPath();
      context.arc(x, y, isHighlighted ? 5 : 3, 0, Math.PI * 2);
      context.fill();
      if (feature.kind === "anchor") drawCross(context, x, y, 6);
      continue;
    }

    context.beginPath();
    feature.points.forEach((point, index) => {
      const [x, y] = toScreen(point);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    if (feature.kind === "polygon") context.closePath();
    context.stroke();
  }
  if (options.showClusterOverview) {
    drawClusterOverview(context, report, toScreen, options.visibleFeatureIds ?? null);
  }
  context.globalAlpha = 1;
  drawScale(context, rect.width, rect.height, scale);
}

function drawClusterOverview(
  context: CanvasRenderingContext2D,
  report: InspectionReport,
  toScreen: (point: Position3) => [number, number],
  visibleFeatureIds: Set<string> | null,
): void {
  const clusters = report.clusters.filter((cluster) =>
    !visibleFeatureIds || cluster.featureIds.some((id) => visibleFeatureIds.has(id)),
  );
  const primary = clusters.find((cluster) => cluster.isPrimary);
  if (primary) {
    const [primaryX, primaryY] = toScreen(primary.center);
    context.save();
    context.setLineDash([5, 5]);
    context.lineWidth = 1;
    for (const cluster of clusters) {
      if (cluster.isPrimary) continue;
      const [x, y] = toScreen(cluster.center);
      context.strokeStyle = "rgba(255, 100, 124, 0.4)";
      context.beginPath();
      context.moveTo(primaryX, primaryY);
      context.lineTo(x, y);
      context.stroke();
    }
    context.restore();
  }

  for (const cluster of clusters) {
    const [x, y] = toScreen(cluster.center);
    const color = cluster.isPrimary ? "#4de2b1" : "#ff647c";
    context.save();
    context.globalAlpha = 1;
    context.fillStyle = color;
    context.strokeStyle = color;
    context.shadowColor = color;
    context.shadowBlur = 12;
    context.beginPath();
    context.arc(x, y, cluster.isPrimary ? 6 : 5, 0, Math.PI * 2);
    context.fill();
    context.shadowBlur = 0;
    context.globalAlpha = 0.45;
    context.beginPath();
    context.arc(x, y, cluster.isPrimary ? 12 : 10, 0, Math.PI * 2);
    context.stroke();
    context.globalAlpha = 1;
    context.fillStyle = "rgba(228, 242, 239, 0.78)";
    context.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
    context.textAlign = x > 90 ? "right" : "left";
    context.fillText(
      `${cluster.isPrimary ? "Hauptbereich" : "Cluster"} · ${cluster.featureCount}`,
      x + (x > 90 ? -13 : 13),
      y - 9,
    );
    context.restore();
  }
}

function drawBackground(context: CanvasRenderingContext2D, width: number, height: number): void {
  context.fillStyle = "#0c171a";
  context.fillRect(0, 0, width, height);
  context.strokeStyle = "rgba(142, 184, 178, 0.08)";
  context.lineWidth = 1;
  const spacing = 32;
  for (let x = spacing; x < width; x += spacing) {
    context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke();
  }
  for (let y = spacing; y < height; y += spacing) {
    context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke();
  }
}

function drawCross(context: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  context.beginPath();
  context.moveTo(x - size, y); context.lineTo(x + size, y);
  context.moveTo(x, y - size); context.lineTo(x, y + size);
  context.stroke();
}

function drawScale(context: CanvasRenderingContext2D, width: number, height: number, scale: number): void {
  if (!Number.isFinite(scale) || scale <= 0) return;
  const targetPixels = 90;
  const rawWorld = targetPixels / scale;
  const magnitude = 10 ** Math.floor(Math.log10(rawWorld));
  const normalized = rawWorld / magnitude;
  const nice = normalized < 2 ? 1 : normalized < 5 ? 2 : 5;
  const worldLength = nice * magnitude;
  const pixelLength = worldLength * scale;
  const x = width - pixelLength - 18;
  const y = height - 18;
  context.strokeStyle = "rgba(224, 244, 239, 0.72)";
  context.fillStyle = "rgba(224, 244, 239, 0.72)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(x, y - 4); context.lineTo(x, y); context.lineTo(x + pixelLength, y); context.lineTo(x + pixelLength, y - 4);
  context.stroke();
  context.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
  context.textAlign = "center";
  context.fillText(formatScale(worldLength), x + pixelLength / 2, y - 6);
}

function formatScale(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toLocaleString("de-DE", { maximumFractionDigits: 1 })} km` : `${meters.toLocaleString("de-DE", { maximumFractionDigits: 1 })} m`;
}
