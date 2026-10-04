import type { GeoDataset } from "../model";
import { normalizeEpsg } from "../geo/mapProjection";
import { appendGeoJson } from "./appendGeoJson";
import { mergeDxf } from "./mergeDxf";
import { parseDxf } from "./parseDxf";

export function appendDataset(existing: GeoDataset, incoming: GeoDataset, workingCrs: string | null): GeoDataset {
  const crs = normalizeEpsg(workingCrs ?? existing.declaredCrs);
  const incomingCrs = normalizeEpsg(incoming.declaredCrs);
  if (!crs || (incoming.declaredCrs && !incomingCrs) || (incomingCrs && incomingCrs !== crs)) throw new Error("append-crs");
  let result: GeoDataset;
  if (incoming.format === "geojson") result = appendGeoJson(existing, incoming, crs);
  else if (existing.format === "geojson") result = appendGeoJson(incoming, existing, crs);
  else {
    if (!existing.dxfDuplicates || !incoming.dxfDuplicates) throw new Error("append-structure");
    result = parseDxf(mergeDxf(existing.dxfDuplicates.source, incoming.dxfDuplicates.source), existing.fileName);
    result.declaredCrs = crs;
  }
  result.importedFileNames = [...(existing.importedFileNames ?? [existing.fileName]), ...(incoming.importedFileNames ?? [incoming.fileName])];
  return result;
}
