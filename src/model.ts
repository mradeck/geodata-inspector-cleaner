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
  properties?: Record<string, unknown>;
  approximation?: string;
}

export interface ImportWarning {
  code: string;
  message: string;
  count?: number;
}

export interface GeoDataset {
  fileName: string;
  format: SourceFormat;
  features: GeoFeature[];
  declaredCrs: string | null;
  warnings: ImportWarning[];
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
  category: "remote-cluster" | "extent-inflation" | "z-zero" | "crs" | "import-loss" | "ambiguous-primary";
  severity: FindingSeverity;
  title: string;
  detail: string;
  featureIds: string[];
  recommendation: FindingRecommendation;
}

export interface CrsAssessment {
  status: "declared" | "plausible" | "unknown" | "contradictory";
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
  /** Ein Feature aus dem vom Benutzer bestätigten Hauptcluster. */
  preferredPrimaryFeatureId?: string | null;
}

export interface InspectionReport {
  dataset: GeoDataset;
  config: InspectionConfig;
  featureStatistics: FeatureStatistics[];
  clusters: SpatialCluster[];
  primaryClusterId: string | null;
  primarySelection: "automatic" | "manual";
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
