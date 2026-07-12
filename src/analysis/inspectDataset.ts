import {
  DEFAULT_INSPECTION_CONFIG,
  type Bounds2D,
  type CrsAssessment,
  type FeatureStatistics,
  type GeoDataset,
  type InspectionConfig,
  type InspectionFinding,
  type InspectionOptions,
  type InspectionReport,
  type SpatialCluster,
} from "../model";
import {
  boundsCenter,
  boundsFromPoints,
  boundsMaxExtent,
  distance2D,
  median,
  mergeBounds,
} from "./statistics";

class UnionFind {
  private readonly parent: number[];
  private readonly rank: number[];

  constructor(size: number) {
    this.parent = Array.from({ length: size }, (_, index) => index);
    this.rank = Array.from({ length: size }, () => 0);
  }

  find(index: number): number {
    const parent = this.parent[index];
    if (parent === undefined) return index;
    if (parent !== index) this.parent[index] = this.find(parent);
    return this.parent[index] ?? index;
  }

  union(left: number, right: number): void {
    const leftRoot = this.find(left);
    const rightRoot = this.find(right);
    if (leftRoot === rightRoot) return;
    const leftRank = this.rank[leftRoot] ?? 0;
    const rightRank = this.rank[rightRoot] ?? 0;
    if (leftRank < rightRank) {
      this.parent[leftRoot] = rightRoot;
    } else if (leftRank > rightRank) {
      this.parent[rightRoot] = leftRoot;
    } else {
      this.parent[rightRoot] = leftRoot;
      this.rank[leftRoot] = leftRank + 1;
    }
  }
}

export function inspectDataset(
  dataset: GeoDataset,
  overrides: Partial<InspectionConfig> = {},
  options: InspectionOptions = {},
): InspectionReport {
  const config: InspectionConfig = { ...DEFAULT_INSPECTION_CONFIG, ...overrides };
  const featureStatistics = collectFeatureStatistics(dataset, config);
  const clusters = buildClusters(featureStatistics, config.clusterDistanceMeters);
  const manuallySelectedPrimary = options.preferredPrimaryFeatureId
    ? clusters.find((cluster) => cluster.featureIds.includes(options.preferredPrimaryFeatureId!)) ?? null
    : null;
  const primary = manuallySelectedPrimary ?? choosePrimaryCluster(clusters);
  const primarySelection: "automatic" | "manual" = manuallySelectedPrimary ? "manual" : "automatic";

  if (primary) {
    for (const cluster of clusters) {
      cluster.isPrimary = cluster.id === primary.id;
      cluster.distanceToPrimaryMeters = cluster.isPrimary
        ? 0
        : distanceBetweenBounds(cluster.bounds, primary.bounds);
    }
  }

  const primaryRatio = primary && featureStatistics.length > 0
    ? primary.featureCount / featureStatistics.length
    : 0;
  const primaryIsDominant = primaryRatio >= config.primaryDominanceRatio;
  const fullBounds = mergeBounds(featureStatistics.map((stat) => stat.bounds));
  const focusBounds = primary?.bounds ?? fullBounds;
  const extentInflationFactor = calculateInflation(fullBounds, focusBounds);
  const crs = assessCrs(dataset, focusBounds);
  const findings: InspectionFinding[] = [];
  const recommendedRemovalIds = new Set<string>();

  if (clusters.length > 1 && !primaryIsDominant && primarySelection === "automatic") {
    findings.push({
      id: "ambiguous-primary",
      category: "ambiguous-primary",
      severity: "warning",
      title: "Mehrere gleichrangige räumliche Gruppen",
      detail: `Der größte Cluster enthält nur ${formatPercent(primaryRatio)} der Features. Kein Cluster wird automatisch als Störgeometrie empfohlen.`,
      featureIds: [],
      recommendation: "review",
    });
  }

  if (primary) {
    for (const cluster of clusters.filter((item) => !item.isPrimary)) {
      const distance = cluster.distanceToPrimaryMeters;
      const recommendation = primaryIsDominant || primarySelection === "manual" ? "remove" : "review";
      findings.push({
        id: `remote-${cluster.id}`,
        category: "remote-cluster",
        severity: recommendation === "remove" ? "critical" : "warning",
        title: `Entfernter Cluster mit ${cluster.featureCount.toLocaleString("de-DE")} Features`,
        detail: `${formatDistance(distance)} vom Hauptbereich; ${cluster.vertexCount.toLocaleString("de-DE")} Stützpunkte. Empfehlung basiert auf einer Hauptcluster-Dominanz von ${formatPercent(primaryRatio)}.`,
        featureIds: cluster.featureIds,
        recommendation,
      });
      if (recommendation === "remove") {
        for (const featureId of cluster.featureIds) recommendedRemovalIds.add(featureId);
      }
    }
  }

  if (extentInflationFactor !== null && extentInflationFactor >= 10) {
    findings.push({
      id: "extent-inflation",
      category: "extent-inflation",
      severity: extentInflationFactor >= 100 ? "critical" : "warning",
      title: `Gesamtausdehnung um Faktor ${formatFactor(extentInflationFactor)} aufgebläht`,
      detail: `Gesamt: ${formatExtent(fullBounds)}; Fokusbereich: ${formatExtent(focusBounds)}. Dies erklärt typischerweise ein unbrauchbares „Zoom all“.`,
      featureIds: [],
      recommendation: "review",
    });
  }

  appendZeroZFinding(findings, featureStatistics, primary, dataset, config);
  findings.push({
    id: "crs-assessment",
    category: "crs",
    severity: crs.status === "contradictory" ? "critical" : crs.status === "unknown" ? "warning" : "info",
    title: crs.label,
    detail: crs.explanation,
    featureIds: [],
    recommendation: crs.status === "declared" ? "keep" : "set-crs",
  });

  for (const [index, warning] of dataset.warnings.entries()) {
    findings.push({
      id: `import-${index}`,
      category: "import-loss",
      severity: "warning",
      title: warning.count ? `${warning.message} (${warning.count})` : warning.message,
      detail: `Importer-Code: ${warning.code}. Der Inhalt muss vor einem bereinigten Export bewertet werden.`,
      featureIds: [],
      recommendation: "review",
    });
  }

  return {
    dataset,
    config,
    featureStatistics,
    clusters,
    primaryClusterId: primary?.id ?? null,
    primarySelection,
    primaryIsDominant,
    fullBounds,
    focusBounds,
    extentInflationFactor,
    crs,
    findings,
    recommendedRemovalIds,
  };
}

function collectFeatureStatistics(dataset: GeoDataset, config: InspectionConfig): FeatureStatistics[] {
  const result: FeatureStatistics[] = [];
  for (const feature of dataset.features) {
    const validPoints = feature.points.filter(
      (point) => Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z),
    );
    const bounds = boundsFromPoints(validPoints);
    if (!bounds) continue;
    const zValues = validPoints.map((point) => point.z);
    result.push({
      featureId: feature.id,
      center: { ...boundsCenter(bounds), z: median(zValues) },
      bounds,
      vertexCount: validPoints.length,
      medianZ: median(zValues),
      allZeroZ: zValues.every((value) => Math.abs(value) <= config.zeroZEpsilonMeters),
    });
  }
  return result;
}

function buildClusters(stats: FeatureStatistics[], distance: number): SpatialCluster[] {
  if (stats.length === 0) return [];
  const cellSize = Math.max(distance, 0.000001);
  const grid = new Map<string, number[]>();
  const unionFind = new UnionFind(stats.length);

  for (let index = 0; index < stats.length; index++) {
    const current = stats[index];
    if (!current) continue;
    const cellX = Math.floor(current.center.x / cellSize);
    const cellY = Math.floor(current.center.y / cellSize);
    for (let offsetX = -1; offsetX <= 1; offsetX++) {
      for (let offsetY = -1; offsetY <= 1; offsetY++) {
        const candidates = grid.get(`${cellX + offsetX}:${cellY + offsetY}`) ?? [];
        for (const candidateIndex of candidates) {
          const candidate = stats[candidateIndex];
          if (candidate && distance2D(current.center, candidate.center) <= distance) {
            unionFind.union(index, candidateIndex);
          }
        }
      }
    }
    const key = `${cellX}:${cellY}`;
    const bucket = grid.get(key) ?? [];
    bucket.push(index);
    grid.set(key, bucket);
  }

  const groups = new Map<number, FeatureStatistics[]>();
  for (let index = 0; index < stats.length; index++) {
    const root = unionFind.find(index);
    const group = groups.get(root) ?? [];
    const stat = stats[index];
    if (stat) group.push(stat);
    groups.set(root, group);
  }

  const clusters: SpatialCluster[] = [];
  let clusterIndex = 0;
  for (const members of groups.values()) {
    const bounds = mergeBounds(members.map((member) => member.bounds));
    if (!bounds) continue;
    clusterIndex++;
    clusters.push({
        id: `cluster-${clusterIndex}`,
        featureIds: members.map((member) => member.featureId),
        featureCount: members.length,
        vertexCount: members.reduce((sum, member) => sum + member.vertexCount, 0),
        bounds,
        center: boundsCenter(bounds),
        distanceToPrimaryMeters: 0,
        isPrimary: false,
    });
  }
  return clusters.sort((a, b) => b.featureCount - a.featureCount || b.vertexCount - a.vertexCount);
}

function choosePrimaryCluster(clusters: SpatialCluster[]): SpatialCluster | null {
  return clusters[0] ?? null;
}

function appendZeroZFinding(
  findings: InspectionFinding[],
  stats: FeatureStatistics[],
  primary: SpatialCluster | null,
  dataset: GeoDataset,
  config: InspectionConfig,
): void {
  if (!primary) return;
  const primaryIds = new Set(primary.featureIds);
  const primaryStats = stats.filter((stat) => primaryIds.has(stat.featureId));
  const realHeights = primaryStats.filter((stat) => !stat.allZeroZ).map((stat) => stat.medianZ);
  if (realHeights.length === 0) return;
  const medianRealHeight = median(realHeights);
  if (Math.abs(medianRealHeight) < config.minimumRealZMagnitudeMeters) return;
  const zeroStats = primaryStats.filter((stat) => stat.allZeroZ);
  if (zeroStats.length === 0) return;
  const featureById = new Map(dataset.features.map((feature) => [feature.id, feature]));
  const layers = new Set(zeroStats.map((stat) => featureById.get(stat.featureId)?.layer).filter(Boolean));
  findings.push({
    id: "z-zero",
    category: "z-zero",
    severity: "warning",
    title: `${zeroStats.length.toLocaleString("de-DE")} Features vollständig auf Z=0`,
    detail: `Im Hauptbereich liegen zugleich echte Höhen mit Median ${formatNumber(medianRealHeight)} m vor. Betroffene Layer: ${[...layers].join(", ") || "unbekannt"}.`,
    featureIds: zeroStats.map((stat) => stat.featureId),
    recommendation: "review",
  });
}

function assessCrs(dataset: GeoDataset, bounds: Bounds2D | null): CrsAssessment {
  if (!bounds) {
    return { status: "unknown", label: "Koordinatensystem nicht bestimmbar", confidence: "low", explanation: "Keine gültigen XY-Koordinaten vorhanden." };
  }
  const center = boundsCenter(bounds);
  const looksLonLat = bounds.minX >= -180 && bounds.maxX <= 180 && bounds.minY >= -90 && bounds.maxY <= 90;
  const looksProjectedMetric = Math.abs(center.x) >= 100_000 && Math.abs(center.x) <= 10_000_000 && Math.abs(center.y) >= 100_000;
  const heuristic = looksLonLat
    ? "Geografische Längen-/Breitengrade, wahrscheinlich WGS84/CRS84"
    : looksProjectedMetric
      ? "Projiziertes metrisches Koordinatensystem, beispielsweise UTM oder Gauß-Krüger"
      : "Lokales oder anhand der Werte nicht eindeutig erkennbares Koordinatensystem";

  if (dataset.declaredCrs) {
    const declaredLooksGeographic = /(?:4326|CRS84)/i.test(dataset.declaredCrs);
    const contradictory = declaredLooksGeographic !== looksLonLat && (declaredLooksGeographic || looksLonLat);
    return contradictory
      ? {
          status: "contradictory",
          label: `CRS-Widerspruch: ${dataset.declaredCrs}`,
          confidence: "high",
          explanation: `Die Datei deklariert ${dataset.declaredCrs}, der Koordinatenwertebereich wirkt jedoch wie: ${heuristic}.`,
        }
      : {
          status: "declared",
          label: `Deklariertes CRS: ${dataset.declaredCrs}`,
          confidence: "high",
          explanation: `Das CRS stammt aus Dateimetadaten. Plausibilitätsbild: ${heuristic}.`,
        };
  }

  if (looksLonLat || looksProjectedMetric) {
    return {
      status: "plausible",
      label: `CRS-Kandidat: ${heuristic}`,
      confidence: "medium",
      explanation: "Die Zuordnung beruht nur auf Koordinatenbereichen und beweist keinen konkreten EPSG-Code. Vor Transformation oder Export bestätigen.",
    };
  }

  return {
    status: "unknown",
    label: "Koordinatensystem unbekannt",
    confidence: "low",
    explanation: `${heuristic}. Ohne Metadaten oder Benutzerangabe ist keine sichere Transformation möglich.`,
  };
}

function distanceBetweenBounds(a: Bounds2D, b: Bounds2D): number {
  const dx = Math.max(a.minX - b.maxX, b.minX - a.maxX, 0);
  const dy = Math.max(a.minY - b.maxY, b.minY - a.maxY, 0);
  return Math.hypot(dx, dy);
}

function calculateInflation(full: Bounds2D | null, focus: Bounds2D | null): number | null {
  if (!full || !focus) return null;
  const focusExtent = boundsMaxExtent(focus);
  if (focusExtent <= 0) return null;
  return boundsMaxExtent(full) / focusExtent;
}

function formatDistance(meters: number): string {
  return meters >= 1000
    ? `${(meters / 1000).toLocaleString("de-DE", { maximumFractionDigits: 1 })} km`
    : `${meters.toLocaleString("de-DE", { maximumFractionDigits: 0 })} m`;
}

function formatExtent(bounds: Bounds2D | null): string {
  if (!bounds) return "nicht bestimmbar";
  return `${formatDistance(bounds.maxX - bounds.minX)} × ${formatDistance(bounds.maxY - bounds.minY)}`;
}

function formatPercent(value: number): string {
  return value.toLocaleString("de-DE", { style: "percent", maximumFractionDigits: 1 });
}

function formatNumber(value: number): string {
  return value.toLocaleString("de-DE", { maximumFractionDigits: 3 });
}

function formatFactor(value: number): string {
  return value.toLocaleString("de-DE", { maximumFractionDigits: value < 10 ? 1 : 0 });
}
