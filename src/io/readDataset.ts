import type { GeoDataset } from "../model";
import { parseDxf } from "./parseDxf";
import { parseGeoJson } from "./parseGeoJson";

export async function readDataset(file: File): Promise<GeoDataset> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "dwg") {
    throw new Error("DWG ist in der reinen SPA noch nicht direkt unterstützt. Bitte zunächst nach DXF konvertieren; die DWG-Strategie ist in der Projektdokumentation beschrieben.");
  }
  // Retain the UTF-8 BOM for the source-preserving duplicate export.
  const text = extension === "dxf"
    ? new TextDecoder("utf-8", { ignoreBOM: true }).decode(await file.arrayBuffer())
    : await file.text();
  if (extension === "dxf") return parseDxf(text, file.name);
  if (extension === "geojson" || extension === "json") return parseGeoJson(text, file.name);
  throw new Error("Unterstützt werden derzeit .dxf, .geojson und .json.");
}
