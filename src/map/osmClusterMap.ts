import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { projectPositionToMap, type ClusterMapReport, type MapClusterAssessment } from "../geo/mapProjection";
import { formatNumber, t } from "../i18n";
import type { GeoDataset, GeoFeature, Position3 } from "../model";

export const OSM_TILE_URL = import.meta.env.VITE_OSM_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const MAX_MAP_VERTICES = 100_000;
const PLAUSIBLE_GEOMETRY_COLOR = "#12a87a";
const PLAUSIBLE_EXTENT_COLOR = "#3185d6";
const DISTURBANCE_COLOR = "#e24d66";

type DrawableCluster = MapClusterAssessment & {
  center: NonNullable<MapClusterAssessment["center"]>;
  bounds: NonNullable<MapClusterAssessment["bounds"]>;
};

export interface OsmClusterRenderOptions {
  visibleClusterIds?: ReadonlySet<string>;
  initialClusterId?: string | null;
}

export class OsmClusterMap {
  private readonly map: L.Map;
  private readonly geometryLayers = L.layerGroup();
  private readonly boundaryLayers = L.layerGroup();
  private readonly markerLayers = L.layerGroup();
  private readonly renderer: L.Canvas;
  private readonly clusterBounds = new Map<string, L.LatLngBounds>();
  private tileLayer: L.TileLayer | null = null;

  constructor(container: HTMLElement) {
    this.map = L.map(container, {
      zoomControl: true,
      attributionControl: true,
      preferCanvas: true,
      worldCopyJump: false,
    }).setView([51, 10], 5);
    this.map.attributionControl.setPrefix(false);
    this.renderer = L.canvas({ padding: 0.4 });
    this.geometryLayers.addTo(this.map);
    this.boundaryLayers.addTo(this.map);
    this.markerLayers.addTo(this.map);
  }

  render(report: ClusterMapReport, dataset: GeoDataset, options: OsmClusterRenderOptions = {}): boolean {
    this.geometryLayers.clearLayers();
    this.boundaryLayers.clearLayers();
    this.markerLayers.clearLayers();
    this.clusterBounds.clear();

    const drawable = report.clusters.filter((cluster): cluster is DrawableCluster =>
      isDrawableCluster(cluster) && (!options.visibleClusterIds || options.visibleClusterIds.has(cluster.clusterId)),
    );
    if (drawable.length === 0 || !report.sourceCrs) {
      this.removeTiles();
      this.map.setView([51, 10], 5, { animate: false });
      window.setTimeout(() => this.map.invalidateSize(), 0);
      this.localizeControls();
      return false;
    }

    this.ensureTiles();
    this.drawDatasetGeometry(dataset, drawable, report.sourceCrs);

    for (const cluster of drawable) {
      const bounds = L.latLngBounds(
        [cluster.bounds.south, cluster.bounds.west],
        [cluster.bounds.north, cluster.bounds.east],
      );
      this.clusterBounds.set(cluster.clusterId, bounds);
      const geometryColor = clusterGeometryColor(cluster);
      const extentColor = clusterExtentColor(cluster);

      L.rectangle(bounds, {
        renderer: this.renderer,
        color: extentColor,
        weight: cluster.isPrimary ? 3 : 2.5,
        dashArray: cluster.isPrimary ? undefined : "8 6",
        fillColor: geometryColor,
        fillOpacity: 0.08,
      }).addTo(this.boundaryLayers);

      const marker = L.circleMarker([cluster.center.lat, cluster.center.lon], {
        renderer: this.renderer,
        radius: cluster.isPrimary ? 8 : 7,
        color: "#ffffff",
        weight: 2,
        fillColor: geometryColor,
        fillOpacity: 0.95,
      }).addTo(this.markerLayers);
      marker.bindTooltip(createTooltip(cluster), { direction: "top", offset: [0, -8] });
    }

    const initial = drawable.find((cluster) => cluster.clusterId === options.initialClusterId)
      ?? drawable.find((cluster) => cluster.isPrimary && cluster.status === "mappable")
      ?? drawable.find((cluster) => cluster.status === "mappable")
      ?? drawable.find((cluster) => cluster.isPrimary)
      ?? drawable[0];
    if (initial) this.focusCluster(initial.clusterId);
    window.setTimeout(() => this.map.invalidateSize(), 0);
    this.localizeControls();
    return true;
  }

  focusCluster(clusterId: string): boolean {
    const bounds = this.clusterBounds.get(clusterId);
    if (!bounds) return false;
    this.map.fitBounds(bounds, { padding: [44, 44], maxZoom: 18, animate: false });
    return true;
  }

  destroy(): void {
    this.map.remove();
  }

  private drawDatasetGeometry(dataset: GeoDataset, clusters: DrawableCluster[], sourceCrs: string): void {
    const clusterByFeatureId = new Map<string, DrawableCluster>();
    for (const cluster of clusters) {
      for (const featureId of cluster.featureIds) clusterByFeatureId.set(featureId, cluster);
    }

    const drawableFeatures = dataset.features.filter((feature) => clusterByFeatureId.has(feature.id));
    const totalVertices = drawableFeatures.reduce((sum, feature) => sum + feature.points.length, 0);
    const stride = Math.max(1, Math.ceil(totalVertices / MAX_MAP_VERTICES));

    for (const feature of drawableFeatures) {
      const cluster = clusterByFeatureId.get(feature.id);
      if (!cluster) continue;
      const sampled = samplePoints(feature.points, stride);
      const positions = sampled
        .map((point) => projectPositionToMap(point, sourceCrs))
        .filter((point): point is NonNullable<typeof point> => point !== null)
        .map((point) => L.latLng(point.lat, point.lon));
      if (positions.length === 0) continue;
      this.drawFeature(feature, positions, clusterGeometryColor(cluster));
    }
  }

  private drawFeature(feature: GeoFeature, positions: L.LatLng[], color: string): void {
    if (positions.length === 1 || feature.kind === "point" || feature.kind === "anchor") {
      L.circleMarker(positions[0]!, {
        renderer: this.renderer,
        radius: feature.kind === "anchor" ? 3.5 : 2.5,
        color,
        weight: 1.5,
        fillColor: color,
        fillOpacity: 0.9,
      }).addTo(this.geometryLayers);
      return;
    }

    const options: L.PolylineOptions = {
      renderer: this.renderer,
      color,
      weight: 2,
      opacity: 0.88,
      fillColor: color,
      fillOpacity: feature.kind === "polygon" ? 0.1 : 0,
      interactive: false,
    };
    if (feature.kind === "polygon") L.polygon(positions, options).addTo(this.geometryLayers);
    else L.polyline(positions, options).addTo(this.geometryLayers);
  }

  private ensureTiles(): void {
    if (this.tileLayer) return;
    this.tileLayer = L.tileLayer(OSM_TILE_URL, {
      maxZoom: 19,
      detectRetina: false,
      keepBuffer: 1,
      updateWhenIdle: true,
      noWrap: true,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    }).addTo(this.map);
  }

  private removeTiles(): void {
    if (!this.tileLayer) return;
    this.tileLayer.removeFrom(this.map);
    this.tileLayer = null;
  }

  private localizeControls(): void {
    const container = this.map.getContainer();
    const zoomIn = container.querySelector<HTMLElement>(".leaflet-control-zoom-in");
    const zoomOut = container.querySelector<HTMLElement>(".leaflet-control-zoom-out");
    if (zoomIn) {
      zoomIn.title = t("map.zoomIn");
      zoomIn.setAttribute("aria-label", t("map.zoomIn"));
    }
    if (zoomOut) {
      zoomOut.title = t("map.zoomOut");
      zoomOut.setAttribute("aria-label", t("map.zoomOut"));
    }
  }
}

function isDrawableCluster(cluster: MapClusterAssessment): cluster is DrawableCluster {
  return cluster.center !== null && cluster.bounds !== null &&
    (cluster.status === "mappable" || cluster.status === "outside-area-of-use");
}

function clusterGeometryColor(cluster: MapClusterAssessment): string {
  return cluster.status === "mappable" ? PLAUSIBLE_GEOMETRY_COLOR : DISTURBANCE_COLOR;
}

function clusterExtentColor(cluster: MapClusterAssessment): string {
  return cluster.status === "mappable" ? PLAUSIBLE_EXTENT_COLOR : DISTURBANCE_COLOR;
}

function samplePoints(points: Position3[], stride: number): Position3[] {
  if (stride <= 1 || points.length <= 2) return points;
  const sampled: Position3[] = [];
  for (let index = 0; index < points.length; index += stride) {
    const point = points[index];
    if (point) sampled.push(point);
  }
  const last = points.at(-1);
  if (last && sampled.at(-1) !== last) sampled.push(last);
  return sampled;
}

function createTooltip(cluster: MapClusterAssessment): HTMLElement {
  const element = document.createElement("span");
  element.textContent = t(cluster.isPrimary ? "map.tooltip.main" : "map.tooltip.cluster", {
    count: formatNumber(cluster.featureCount),
  });
  return element;
}
