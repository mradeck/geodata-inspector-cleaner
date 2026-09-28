export type SourceFormat = "dxf" | "geojson";

export type GeometryKind = "point" | "line" | "polyline" | "polygon" | "anchor";

export interface Position3 {
  x: number;
  y: number;
  z: number;
}

export interface GeoFeature {
  id: string;
  layer: string;
  kind: GeometryKind;
  points: Position3[];
  sourceType: string;
  sourceHandle?: string;
  sourceEntityId?: string;
  properties?: Record<string, unknown>;
  approximation?: string;
  /** Complete sampled HATCH rings, used to avoid exporting an already represented outline twice. */
  hatchBoundaryPoints?: Position3[][];
}

export interface ImportWarning {
  code: string;
  message: string;
  count?: number;
}

export interface GeoLayerMetadata {
  name: string;
  /** Darstellungsfarbe aus TrueColor beziehungsweise ACI. */
  color: string;
  aciColor: number;
  trueColor: number | null;
  lineType: string;
  /** DXF-Code 370 in 1/100 mm; negative Werte sind spezielle Defaults. */
  lineWeight: number | null;
  flags: number;
  isOff: boolean;
  isFrozen: boolean;
  isLocked: boolean;
  isPlottable: boolean;
}

export interface GeoDataset {
  fileName: string;
  format: SourceFormat;
  features: GeoFeature[];
  declaredCrs: string | null;
  warnings: ImportWarning[];
  layerMetadata?: GeoLayerMetadata[];
  dxfDuplicates?: import("./duplicates/dxfDuplicates").DxfDuplicateCheck;
}

export interface Bounds2D {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface FeatureStatistics {
  featureId: string;
  center: Position3;
  bounds: Bounds2D;
  vertexCount: number;
  medianZ: number;
  allZeroZ: boolean;
}

export interface SpatialCluster {
  id: string;
  featureIds: string[];
  featureCount: number;
  vertexCount: number;
  bounds: Bounds2D;
  center: Position3;
  distanceToPrimaryMeters: number;
  isPrimary: boolean;
}

export type FindingSeverity = "info" | "warning" | "critical";
export type FindingRecommendation = "keep" | "review" | "remove" | "set-crs";

export interface InspectionFinding {
  id: string;
  category: "remote-cluster" | "extent-inflation" | "z-zero" | "crs" | "import-loss" | "ambiguous-primary" | "dxf-duplicates";
  severity: FindingSeverity;
  title: string;
  detail: string;
  featureIds: string[];
  recommendation: FindingRecommendation;
}

export interface CrsAssessment {
  status: "declared" | "plausible" | "unknown" | "contradictory";
  source: "input" | "metadata" | "heuristic" | "missing";
  label: string;
  confidence: "high" | "medium" | "low";
  explanation: string;
}

export interface InspectionConfig {
  clusterDistanceMeters: number;
  primaryDominanceRatio: number;
  zeroZEpsilonMeters: number;
  minimumRealZMagnitudeMeters: number;
}

export interface InspectionOptions {
  /** Manuell gesetztes CRS für Analyse, Kartenprojektion und Exporthinweis. */
  analysisCrs?: string | null;
  /** Ein Feature aus dem bevorzugten Hauptcluster. */
  preferredPrimaryFeatureId?: string | null;
  /** Herkunft der bevorzugten Auswahl; manuell bestätigte Auswahl bleibt stärker. */
  preferredPrimarySource?: "manual" | "crs";
}

export interface InspectionReport {
  dataset: GeoDataset;
  /** Operative CRS-Vorgabe aus dem Eingabefeld; Dateimetadaten bleiben separat. */
  analysisCrs: string | null;
  config: InspectionConfig;
  featureStatistics: FeatureStatistics[];
  clusters: SpatialCluster[];
  primaryClusterId: string | null;
  primarySelection: "automatic" | "crs" | "manual";
  primaryIsDominant: boolean;
  fullBounds: Bounds2D | null;
  focusBounds: Bounds2D | null;
  extentInflationFactor: number | null;
  crs: CrsAssessment;
  findings: InspectionFinding[];
  recommendedRemovalIds: Set<string>;
}

export const DEFAULT_INSPECTION_CONFIG: InspectionConfig = {
  clusterDistanceMeters: 1000,
  primaryDominanceRatio: 0.6,
  zeroZEpsilonMeters: 0.001,
  minimumRealZMagnitudeMeters: 20,
};
