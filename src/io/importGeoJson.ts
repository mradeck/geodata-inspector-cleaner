import proj4 from "proj4";
import { normalizeEpsg } from "../geo/mapProjection";
import type { GeoDataset } from "../model";
import { parseGeoJson } from "./parseGeoJson";

/** Reproject once at the file-import boundary. The parser remains coordinate-preserving
 * for export validation. RFC 7946 positions use longitude, latitude order. */
export function importGeoJson(text: string, fileName: string): GeoDataset {
  const dataset = parseGeoJson(text, fileName);
  const declared = dataset.declaredCrs;
  const sourceCrs = declared == null || /(?:^|[:/])CRS:?84$/i.test(declared)
    ? "EPSG:4326" : normalizeEpsg(declared);
  if (!sourceCrs || !proj4.defs(sourceCrs)) {
    throw new Error(`GeoJSON: CRS nicht unterstützt / unsupported CRS: ${declared}`);
  }
  const targetCrs = "EPSG:25832";
  const features = dataset.features.map((feature) => ({
    ...feature,
    points: feature.points.map((point) => {
      if (sourceCrs === "EPSG:4326" && (Math.abs(point.x) > 180 || Math.abs(point.y) >= 90)) {
        throw new Error("GeoJSON: ungültige WGS84-Koordinaten; Quell-CRS prüfen / invalid WGS84 coordinates; check source CRS");
      }
      if (sourceCrs === targetCrs) return { ...point };
      const [x, y] = proj4(sourceCrs, targetCrs, [point.x, point.y]);
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        throw new Error("GeoJSON: Koordinaten nicht transformierbar / coordinate transformation failed");
      }
      return { x: x!, y: y!, z: point.z };
    }),
  }));
  return {
    ...dataset, features, declaredCrs: targetCrs,
    coordinateImport: { sourceCrs, targetCrs, source: declared == null ? "geojson-default" : "declared" },
  };
}
