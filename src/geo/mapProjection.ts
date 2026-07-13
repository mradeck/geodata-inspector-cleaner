import proj4 from "proj4";
import type { Bounds2D, InspectionReport, Position3, SpatialCluster } from "../model";

export interface LonLat {
  lon: number;
  lat: number;
}

export interface LonLatBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

export type MapClusterStatus = "mappable" | "outside-area-of-use" | "invalid-coordinate" | "unsupported-crs";

export interface MapClusterAssessment {
  clusterId: string;
  featureIds: string[];
  featureCount: number;
  isPrimary: boolean;
  status: MapClusterStatus;
  center: LonLat | null;
  bounds: LonLatBounds | null;
  reason: string;
}

export interface ClusterMapReport {
  sourceCrs: string | null;
  source: "input" | "declared" | "heuristic" | "missing";
  clusters: MapClusterAssessment[];
}

interface AreaOfUse {
  west: number;
  south: number;
  east: number;
  north: number;
  label: string;
}

proj4.defs("EPSG:25832", "+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs +type=crs");
proj4.defs("EPSG:25833", "+proj=utm +zone=33 +ellps=GRS80 +units=m +no_defs +type=crs");
proj4.defs("EPSG:31468", "+proj=tmerc +lat_0=0 +lon_0=12 +k=1 +x_0=4500000 +y_0=0 +ellps=bessel +towgs84=598.1,73.7,418.2,0.202,0.045,-2.455,6.7 +units=m +no_defs +type=crs");
proj4.defs("EPSG:3857", "+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs");

const AREAS_OF_USE: Partial<Record<string, AreaOfUse>> = {
  "EPSG:25832": { west: 6, south: 38, east: 12, north: 84, label: "ETRS89 / UTM Zone 32N" },
  "EPSG:25833": { west: 12, south: 38, east: 18, north: 84, label: "ETRS89 / UTM Zone 33N" },
  "EPSG:31468": { west: 10.5, south: 47, east: 13.5, north: 56.5, label: "DHDN / Gauß-Krüger Zone 4" },
};

// Bewusst identisch zur CRS-Normalisierung des Pointcloud Managers, damit
// Projektangaben in beiden Anwendungen gleich interpretiert werden.
const SUPPORTED_ALIASES: Record<string, string> = {
  UTM32: "EPSG:25832",
  UTM32N: "EPSG:25832",
  ETRS89UTM32: "EPSG:25832",
  ETRS89UTM32N: "EPSG:25832",
  UTM33: "EPSG:25833",
  UTM33N: "EPSG:25833",
  ETRS89UTM33: "EPSG:25833",
  ETRS89UTM33N: "EPSG:25833",
  GK4: "EPSG:31468",
  DHDNGK4: "EPSG:31468",
};

const WEB_MERCATOR_LAT_LIMIT = 85.05112878;

export function assessClustersForMap(report: InspectionReport): ClusterMapReport {
  const resolved = resolveSourceCrs(report);
  if (!resolved.crs) {
    return {
      sourceCrs: null,
      source: "missing",
      clusters: report.clusters.map((cluster) => unsupportedCluster(cluster, "Kein eindeutig nutzbares Quell-CRS vorhanden.")),
    };
  }

  if (!proj4.defs(resolved.crs)) {
    return {
      sourceCrs: resolved.crs,
      source: resolved.source,
      clusters: report.clusters.map((cluster) => unsupportedCluster(cluster, `${resolved.crs} ist für die Kartenvorschau noch nicht registriert.`)),
    };
  }

  return {
    sourceCrs: resolved.crs,
    source: resolved.source,
    clusters: report.clusters.map((cluster) => assessCluster(cluster, resolved.crs!)),
  };
}

export function normalizeEpsg(value: string | null | undefined): string | null {
  if (!value) return null;
  const compact = value.trim().toUpperCase().replace(/[\s_-]/g, "");
  const alias = SUPPORTED_ALIASES[compact];
  if (alias) return alias;
  const direct = compact.match(/^EPSG:?([0-9]{4,6})$/);
  if (direct?.[1]) return `EPSG:${direct[1]}`;
  const digitsOnly = compact.match(/^([0-9]{4,6})$/);
  if (digitsOnly?.[1]) return `EPSG:${digitsOnly[1]}`;
  if (/EPSG/i.test(value)) {
    const codes = value.match(/\d{4,6}/g);
    if (codes?.length) return `EPSG:${codes[codes.length - 1]}`;
  }
  return null;
}

/** Transformiert einen Geometriepunkt in den darstellbaren WGS84-Kartenraum. */
export function projectPositionToMap(point: Pick<Position3, "x" | "y">, sourceCrs: string): LonLat | null {
  try {
    const result = proj4(sourceCrs, "EPSG:4326", [point.x, point.y]);
    const lon = result[0];
    const lat = result[1];
    if (typeof lon !== "number" || typeof lat !== "number" || !Number.isFinite(lon) || !Number.isFinite(lat)) return null;
    if (lon < -180 || lon > 180 || lat < -WEB_MERCATOR_LAT_LIMIT || lat > WEB_MERCATOR_LAT_LIMIT) return null;
    return { lon, lat };
  } catch {
    return null;
  }
}

function resolveSourceCrs(report: InspectionReport): { crs: string | null; source: "input" | "declared" | "heuristic" | "missing" } {
  const input = normalizeEpsg(report.analysisCrs);
  if (input) return { crs: input, source: "input" };
  const declared = normalizeEpsg(report.dataset.declaredCrs);
  if (declared) return { crs: declared, source: "declared" };
  const bounds = report.fullBounds;
  if (bounds && bounds.minX >= -180 && bounds.maxX <= 180 && bounds.minY >= -90 && bounds.maxY <= 90) {
    return { crs: "EPSG:4326", source: "heuristic" };
  }
  return { crs: null, source: "missing" };
}

function assessCluster(cluster: SpatialCluster, sourceCrs: string): MapClusterAssessment {
  const projected = projectBounds(cluster.bounds, sourceCrs);
  if (!projected) {
    return {
      ...baseCluster(cluster),
      status: "invalid-coordinate",
      center: null,
      bounds: null,
      reason: `Die Koordinaten lassen sich aus ${sourceCrs} nicht in gültige Kartenkoordinaten transformieren.`,
    };
  }

  const center: LonLat = {
    lon: (projected.west + projected.east) / 2,
    lat: (projected.south + projected.north) / 2,
  };
  if (!isWebMappable(projected)) {
    return {
      ...baseCluster(cluster),
      status: "invalid-coordinate",
      center,
      bounds: projected,
      reason: "Die transformierte Lage liegt außerhalb des darstellbaren Webkartenbereichs.",
    };
  }

  const area = AREAS_OF_USE[sourceCrs];
  if (area && !contains(area, center)) {
    return {
      ...baseCluster(cluster),
      status: "outside-area-of-use",
      center,
      bounds: projected,
      reason: `Transformierte Lage außerhalb des plausiblen Einsatzgebiets von ${area.label}.`,
    };
  }

  return {
    ...baseCluster(cluster),
    status: "mappable",
    center,
    bounds: projected,
    reason: `${sourceCrs} ergibt eine kartierbare Lage bei ${center.lat.toFixed(5)}°, ${center.lon.toFixed(5)}°.`,
  };
}

function projectBounds(bounds: Bounds2D, sourceCrs: string): LonLatBounds | null {
  const corners = [
    [bounds.minX, bounds.minY],
    [bounds.minX, bounds.maxY],
    [bounds.maxX, bounds.minY],
    [bounds.maxX, bounds.maxY],
  ] as const;
  const projected: LonLat[] = [];
  for (const [x, y] of corners) {
    const point = projectPositionToMap({ x, y }, sourceCrs);
    if (!point) return null;
    projected.push(point);
  }
  return {
    west: Math.min(...projected.map((point) => point.lon)),
    south: Math.min(...projected.map((point) => point.lat)),
    east: Math.max(...projected.map((point) => point.lon)),
    north: Math.max(...projected.map((point) => point.lat)),
  };
}

function baseCluster(cluster: SpatialCluster) {
  return {
    clusterId: cluster.id,
    featureIds: cluster.featureIds,
    featureCount: cluster.featureCount,
    isPrimary: cluster.isPrimary,
  };
}

function unsupportedCluster(cluster: SpatialCluster, reason: string): MapClusterAssessment {
  return { ...baseCluster(cluster), status: "unsupported-crs", center: null, bounds: null, reason };
}

function contains(area: AreaOfUse, point: LonLat): boolean {
  return point.lon >= area.west && point.lon <= area.east && point.lat >= area.south && point.lat <= area.north;
}

function isWebMappable(bounds: LonLatBounds): boolean {
  return bounds.west >= -180 && bounds.east <= 180 && bounds.south >= -WEB_MERCATOR_LAT_LIMIT && bounds.north <= WEB_MERCATOR_LAT_LIMIT;
}
