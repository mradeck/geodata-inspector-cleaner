import "./styles.css";
import { inspectDataset } from "./analysis/inspectDataset";
import { selectDisturbanceArea } from "./analysis/selectDisturbanceArea";
import { median } from "./analysis/statistics";
import { assessClustersForMap, type ClusterMapReport, type MapClusterAssessment } from "./geo/mapProjection";
import {
  formatNumber,
  formatPercent,
  getLanguage,
  initI18n,
  LANGUAGE_LABELS,
  onLanguageChange,
  setLanguage,
  t,
} from "./i18n";
import { readDataset } from "./io/readDataset";
import type { Bounds2D, GeoDataset, InspectionFinding, InspectionReport } from "./model";
import { renderPreview } from "./render/renderPreview";
import { demoDataset } from "./sample/demoDataset";
import { OsmClusterMap } from "./map/osmClusterMap";

const elements = {
  fileInput: byId<HTMLInputElement>("file-input"),
  dropZone: byId<HTMLElement>("drop-zone"),
  loadDemo: byId<HTMLButtonElement>("load-demo"),
  clusterDistance: byId<HTMLInputElement>("cluster-distance"),
  clusterDistanceValue: byId<HTMLElement>("cluster-distance-value"),
  fileFacts: byId<HTMLElement>("file-facts"),
  emptyState: byId<HTMLElement>("empty-state"),
  results: byId<HTMLElement>("results"),
  stageTitle: byId<HTMLElement>("stage-title"),
  findings: byId<HTMLElement>("findings"),
  status: byId<HTMLElement>("status"),
  downloadReport: byId<HTMLButtonElement>("download-report"),
  conceptLink: byId<HTMLAnchorElement>("concept-link"),
  overviewCanvas: byId<HTMLCanvasElement>("overview-canvas"),
  focusCanvas: byId<HTMLCanvasElement>("focus-canvas"),
  disturbanceCanvas: byId<HTMLCanvasElement>("disturbance-canvas"),
  disturbanceBadge: byId<HTMLElement>("disturbance-badge"),
  osmMap: byId<HTMLElement>("osm-map"),
  mapEmpty: byId<HTMLElement>("map-empty"),
  mapCandidates: byId<HTMLElement>("map-candidates"),
  languageToggle: byId<HTMLButtonElement>("btn-toggle-language"),
  languageFlag: byId<HTMLElement>("language-flag"),
  languageCode: byId<HTMLElement>("language-code"),
};

let currentDataset: GeoDataset | null = null;
let currentReport: InspectionReport | null = null;
let highlightedIds = new Set<string>();
let preferredPrimaryFeatureId: string | null = null;
let osmClusterMap: OsmClusterMap | null = null;

initI18n();
syncLanguageControl();
syncClusterDistanceLabel();

elements.languageToggle.addEventListener("click", () => {
  setLanguage(getLanguage() === "de" ? "en" : "de");
});

onLanguageChange((language) => {
  syncLanguageControl();
  syncClusterDistanceLabel();
  if (currentReport) renderDashboard(currentReport);
  setStatus(t("status.languageChanged", { language: LANGUAGE_LABELS[language].name }), "ok");
});

elements.fileInput.addEventListener("change", () => {
  const file = elements.fileInput.files?.[0];
  if (file) void loadFile(file);
});

for (const eventName of ["dragenter", "dragover"]) {
  elements.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropZone.classList.add("dragging");
  });
}
for (const eventName of ["dragleave", "drop"]) {
  elements.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropZone.classList.remove("dragging");
  });
}
elements.dropZone.addEventListener("drop", (event) => {
  const file = event.dataTransfer?.files[0];
  if (file) void loadFile(file);
});

elements.loadDemo.addEventListener("click", () => {
  currentDataset = demoDataset;
  highlightedIds.clear();
  preferredPrimaryFeatureId = null;
  analyzeAndRender(t("status.demoLoaded"));
});

elements.clusterDistance.addEventListener("input", () => {
  syncClusterDistanceLabel();
  if (currentDataset) analyzeAndRender(t("status.parametersUpdated"));
});

elements.downloadReport.addEventListener("click", () => {
  if (!currentReport) return;
  const serializable = {
    generatedAt: new Date().toISOString(),
    application: "geodata-inspector-cleaner",
    version: "2607.01.0",
    file: currentReport.dataset.fileName,
    format: currentReport.dataset.format,
    config: currentReport.config,
    declaredCrs: currentReport.dataset.declaredCrs,
    crsAssessment: localizeCrsAssessment(currentReport),
    fullBounds: currentReport.fullBounds,
    focusBounds: currentReport.focusBounds,
    extentInflationFactor: currentReport.extentInflationFactor,
    clusters: currentReport.clusters,
    findings: currentReport.findings.map((finding) => ({
      ...finding,
      ...localizeFinding(finding, currentReport!),
    })),
    recommendedRemovalIds: [...currentReport.recommendedRemovalIds],
    warnings: currentReport.dataset.warnings.map((warning) => ({
      ...warning,
      message: localizeWarning(warning.code, warning.message),
    })),
  };
  downloadText(`${baseName(currentReport.dataset.fileName)}-inspection-report.json`, JSON.stringify(serializable, null, 2));
});

new ResizeObserver(() => renderCanvases()).observe(document.querySelector(".preview-grid") ?? document.body);

async function loadFile(file: File): Promise<void> {
  setStatus(t("status.reading", { file: file.name }), "working");
  try {
    currentDataset = await readDataset(file);
    highlightedIds.clear();
    preferredPrimaryFeatureId = null;
    analyzeAndRender(t("status.analyzed", { file: file.name }));
  } catch (error) {
    setStatus(error instanceof Error ? localizeReadError(error.message) : t("status.readError"), "error");
  } finally {
    elements.fileInput.value = "";
  }
}

function analyzeAndRender(status: string): void {
  if (!currentDataset) return;
  currentReport = inspectDataset(currentDataset, {
    clusterDistanceMeters: Number(elements.clusterDistance.value),
  }, { preferredPrimaryFeatureId });
  renderDashboard(currentReport);
  setStatus(status, currentReport.findings.some((finding) => finding.severity === "critical") ? "warning" : "ok");
}

function renderDashboard(report: InspectionReport): void {
  elements.emptyState.hidden = true;
  elements.results.hidden = false;
  elements.downloadReport.disabled = false;
  elements.stageTitle.textContent = report.dataset.fileName;

  const layerCount = new Set(report.dataset.features.map((feature) => feature.layer)).size;
  setText("metric-features", formatNumber(report.dataset.features.length));
  setText("metric-layers", t("metric.layers", { count: formatNumber(layerCount) }));
  setText("metric-clusters", formatNumber(report.clusters.length));
  const primary = report.clusters.find((cluster) => cluster.isPrimary);
  setText("metric-dominance", primary
    ? report.primarySelection === "manual"
      ? t("metric.primaryManual", { count: formatNumber(primary.featureCount) })
      : t("metric.primaryShare", { share: formatPercent(primary.featureCount / report.dataset.features.length) })
    : t("metric.noGeometry"));
  setText("metric-inflation", report.extentInflationFactor === null ? "–" : `${formatNumber(report.extentInflationFactor)}×`);
  setText("metric-crs", report.dataset.declaredCrs ?? (report.crs.status === "plausible" ? t("metric.candidate") : t("metric.unknown")));
  setText("metric-crs-status", report.crs.status);
  setText("overview-extent", formatBoundsSize(report.fullBounds));
  setText("overview-coordinate-range", formatCoordinateRange(report.fullBounds));
  setText("focus-title", report.primarySelection === "manual"
    ? t("preview.focusManual")
    : report.primaryIsDominant
      ? t("preview.focus")
      : t("preview.focusAmbiguous"));
  setText("focus-extent", formatBoundsSize(report.focusBounds));
  setText("focus-coordinate-range", formatCoordinateRange(report.focusBounds));
  const disturbance = selectDisturbanceArea(report);
  setText("disturbance-extent", disturbance
    ? t("preview.disturbanceFeatures", {
        extent: formatBoundsSize(disturbance.bounds),
        count: formatNumber(disturbance.featureIds.size),
      })
    : t("preview.noDisturbance"));
  elements.disturbanceBadge.textContent = t(disturbance?.assessment === "recommended-removal"
    ? "preview.disturbanceRemoval"
    : "preview.disturbanceReview");
  elements.disturbanceBadge.classList.toggle("removal-recommended", disturbance?.assessment === "recommended-removal");
  setText("disturbance-coordinate-range", formatCoordinateRange(disturbance?.bounds ?? null));
  const localizedCrs = localizeCrsAssessment(report);
  setText("crs-title", localizedCrs.label);
  setText("crs-detail", localizedCrs.explanation);

  elements.fileFacts.classList.remove("empty");
  elements.fileFacts.innerHTML = `
    <p class="eyebrow">${escapeHtml(t("inventory.title"))}</p>
    <dl>
      <div><dt>${escapeHtml(t("inventory.format"))}</dt><dd>${escapeHtml(report.dataset.format.toUpperCase())}</dd></div>
      <div><dt>${escapeHtml(t("inventory.features"))}</dt><dd>${formatNumber(report.dataset.features.length)}</dd></div>
      <div><dt>${escapeHtml(t("inventory.layers"))}</dt><dd>${formatNumber(layerCount)}</dd></div>
      <div><dt>${escapeHtml(t("inventory.warnings"))}</dt><dd>${formatNumber(report.dataset.warnings.length)}</dd></div>
    </dl>`;

  renderFindings(report);
  renderMapSection(report);
  renderCanvases();
}

function renderMapSection(report: InspectionReport): void {
  const mapReport = assessClustersForMap(report);
  setText("map-crs-label", mapReport.sourceCrs
    ? t(mapReport.source === "declared" ? "map.crs.declared" : "map.crs.heuristic", { crs: mapReport.sourceCrs })
    : t("map.crs.missing"));
  const drawable = mapReport.clusters.filter(isDrawableMapCluster);
  elements.mapEmpty.hidden = drawable.length > 0;
  if (!osmClusterMap) osmClusterMap = new OsmClusterMap(elements.osmMap);
  osmClusterMap.render(mapReport, report.dataset);
  renderMapCandidates(mapReport, report);
}

function renderMapCandidates(mapReport: ClusterMapReport, report: InspectionReport): void {
  elements.mapCandidates.innerHTML = "";
  for (const candidate of mapReport.clusters) {
    const cluster = report.clusters.find((item) => item.id === candidate.clusterId);
    if (!cluster) continue;
    const card = document.createElement("article");
    card.className = `map-candidate status-${candidate.status}${cluster.isPrimary ? " current-primary" : ""}`;

    const heading = document.createElement("div");
    heading.className = "map-candidate-title";
    const title = document.createElement("strong");
    const titleKey = cluster.isPrimary
      ? report.primarySelection === "automatic" && !report.primaryIsDominant
        ? "map.automaticCandidate"
        : "map.currentPrimary"
      : "map.cluster";
    title.textContent = t(titleKey, {
      count: formatNumber(cluster.featureCount),
    });
    const badge = document.createElement("span");
    badge.textContent = mapStatusLabel(candidate);
    heading.append(title, badge);

    const detail = document.createElement("p");
    detail.textContent = localizeMapReason(candidate, mapReport);
    card.append(heading, detail);

    const actions = document.createElement("div");
    actions.className = "map-candidate-actions";
    if (isDrawableMapCluster(candidate)) {
      const show = document.createElement("button");
      show.type = "button";
      show.className = "button show-map-area";
      show.textContent = t("map.showArea");
      show.addEventListener("click", () => osmClusterMap?.focusCluster(candidate.clusterId));
      actions.append(show);
    }

    if (candidate.status === "mappable" && !cluster.isPrimary) {
      const choose = document.createElement("button");
      choose.type = "button";
      choose.className = "button choose-primary";
      choose.textContent = t("map.choosePrimary");
      choose.addEventListener("click", () => {
        preferredPrimaryFeatureId = cluster.featureIds[0] ?? null;
        highlightedIds = new Set(cluster.featureIds);
        analyzeAndRender(t("status.primarySelected"));
      });
      actions.append(choose);
    }
    if (actions.childElementCount > 0) card.append(actions);
    elements.mapCandidates.append(card);
  }
}

function isDrawableMapCluster(candidate: MapClusterAssessment): boolean {
  return candidate.bounds !== null && candidate.center !== null &&
    (candidate.status === "mappable" || candidate.status === "outside-area-of-use");
}

function mapStatusLabel(candidate: MapClusterAssessment): string {
  return ({
    mappable: t("map.status.mappable"),
    "outside-area-of-use": t("map.status.outside"),
    "invalid-coordinate": t("map.status.invalid"),
    "unsupported-crs": t("map.status.missing"),
  })[candidate.status];
}

function renderFindings(report: InspectionReport): void {
  const findings = report.findings;
  if (findings.length === 0) {
    elements.findings.innerHTML = `<div class="finding-placeholder"><span>✓</span><p>${escapeHtml(t("findings.none"))}</p></div>`;
    return;
  }
  elements.findings.innerHTML = "";
  for (const finding of findings) {
    const localized = localizeFinding(finding, report);
    const article = document.createElement("button");
    article.type = "button";
    article.className = `finding-card severity-${finding.severity}`;
    article.innerHTML = `
      <span class="finding-symbol">${finding.severity === "critical" ? "!" : finding.severity === "warning" ? "△" : "i"}</span>
      <span class="finding-copy">
        <span class="finding-meta">${escapeHtml(categoryLabel(finding.category))} · ${escapeHtml(recommendationLabel(finding.recommendation))}</span>
        <strong>${escapeHtml(localized.title)}</strong>
        <small>${escapeHtml(localized.detail)}</small>
      </span>
      <span class="finding-count">${finding.featureIds.length ? formatNumber(finding.featureIds.length) : "–"}</span>`;
    article.addEventListener("click", () => {
      highlightedIds = new Set(finding.featureIds);
      document.querySelectorAll(".finding-card").forEach((card) => card.classList.remove("selected"));
      article.classList.add("selected");
      renderCanvases();
    });
    elements.findings.append(article);
  }
}

function renderCanvases(): void {
  if (!currentDataset || !currentReport || elements.results.hidden) return;
  const primaryIds = new Set(currentReport.clusters.find((cluster) => cluster.isPrimary)?.featureIds ?? []);
  renderPreview(elements.overviewCanvas, currentDataset, currentReport, {
    bounds: currentReport.fullBounds,
    highlightedFeatureIds: highlightedIds,
    showClusterOverview: true,
  });
  renderPreview(elements.focusCanvas, currentDataset, currentReport, {
    bounds: currentReport.focusBounds,
    visibleFeatureIds: primaryIds,
    highlightedFeatureIds: highlightedIds,
  });
  const disturbance = selectDisturbanceArea(currentReport);
  renderPreview(elements.disturbanceCanvas, currentDataset, currentReport, {
    bounds: disturbance?.bounds ?? null,
    visibleFeatureIds: disturbance?.featureIds ?? new Set<string>(),
    highlightedFeatureIds: highlightedIds,
    emptyMessage: t("preview.noDisturbance"),
  });
}

function setStatus(message: string, type: "working" | "error" | "warning" | "ok"): void {
  elements.status.className = `status-${type}`;
  elements.status.innerHTML = `<i></i><span>${escapeHtml(message)}</span>`;
}

function formatBoundsSize(bounds: Bounds2D | null): string {
  if (!bounds) return t("preview.noBounds");
  return `${formatDistance(bounds.maxX - bounds.minX)} × ${formatDistance(bounds.maxY - bounds.minY)}`;
}

function formatCoordinateRange(bounds: Bounds2D | null): string {
  if (!bounds) return t("preview.coordinateRangeEmpty");
  return t("preview.coordinateRange", {
    minX: formatNumber(bounds.minX, 2),
    maxX: formatNumber(bounds.maxX, 2),
    minY: formatNumber(bounds.minY, 2),
    maxY: formatNumber(bounds.maxY, 2),
  });
}

function formatDistance(meters: number): string {
  return meters >= 1000
    ? t("unit.km", { value: formatNumber(meters / 1000, 1) })
    : t("unit.m", { value: formatNumber(meters) });
}

function categoryLabel(category: InspectionFinding["category"]): string {
  return ({
    "remote-cluster": t("finding.category.remote-cluster"),
    "extent-inflation": t("finding.category.extent-inflation"),
    "z-zero": t("finding.category.z-zero"),
    crs: t("finding.category.crs"),
    "import-loss": t("finding.category.import-loss"),
    "ambiguous-primary": t("finding.category.ambiguous-primary"),
  })[category];
}

function recommendationLabel(recommendation: InspectionFinding["recommendation"]): string {
  return ({
    keep: t("finding.recommendation.keep"),
    review: t("finding.recommendation.review"),
    remove: t("finding.recommendation.remove"),
    "set-crs": t("finding.recommendation.set-crs"),
  })[recommendation];
}

function localizeFinding(finding: InspectionFinding, report: InspectionReport): { title: string; detail: string } {
  if (finding.category === "ambiguous-primary") {
    const primary = report.clusters.find((cluster) => cluster.isPrimary);
    const share = primary && report.dataset.features.length > 0
      ? primary.featureCount / report.dataset.features.length
      : 0;
    return {
      title: t("finding.ambiguous.title"),
      detail: t("finding.ambiguous.detail", { share: formatPercent(share, 1) }),
    };
  }

  if (finding.category === "remote-cluster") {
    const cluster = report.clusters.find((candidate) =>
      candidate.featureIds.length === finding.featureIds.length &&
      candidate.featureIds.every((id) => finding.featureIds.includes(id)),
    );
    const primary = report.clusters.find((candidate) => candidate.isPrimary);
    const share = primary && report.dataset.features.length > 0
      ? primary.featureCount / report.dataset.features.length
      : 0;
    return {
      title: t("finding.remote.title", { count: formatNumber(cluster?.featureCount ?? finding.featureIds.length) }),
      detail: t("finding.remote.detail", {
        distance: formatDistance(cluster?.distanceToPrimaryMeters ?? 0),
        vertices: formatNumber(cluster?.vertexCount ?? 0),
        share: formatPercent(share, 1),
      }),
    };
  }

  if (finding.category === "extent-inflation") {
    return {
      title: t("finding.extent.title", { factor: formatNumber(report.extentInflationFactor ?? 1) }),
      detail: t("finding.extent.detail", {
        full: formatBoundsSize(report.fullBounds),
        focus: formatBoundsSize(report.focusBounds),
      }),
    };
  }

  if (finding.category === "z-zero") {
    const affected = new Set(finding.featureIds);
    const primary = new Set(report.clusters.find((cluster) => cluster.isPrimary)?.featureIds ?? []);
    const realHeights = report.featureStatistics
      .filter((stat) => primary.has(stat.featureId) && !stat.allZeroZ)
      .map((stat) => stat.medianZ);
    const featureById = new Map(report.dataset.features.map((feature) => [feature.id, feature]));
    const layers = [...new Set(finding.featureIds.map((id) => featureById.get(id)?.layer).filter((layer): layer is string => Boolean(layer)))];
    return {
      title: t("finding.zZero.title", { count: formatNumber(affected.size) }),
      detail: t("finding.zZero.detail", {
        height: formatNumber(median(realHeights), 3),
        layers: layers.join(", ") || t("metric.unknown"),
      }),
    };
  }

  if (finding.category === "crs") {
    const crs = localizeCrsAssessment(report);
    return { title: crs.label, detail: crs.explanation };
  }

  if (finding.category === "import-loss") {
    const warningIndex = Number.parseInt(finding.id.replace("import-", ""), 10);
    const warning = report.dataset.warnings[warningIndex];
    if (!warning) return { title: t("warning.generic"), detail: finding.detail };
    return {
      title: t("finding.import.title", {
        message: localizeWarning(warning.code, warning.message),
        count: warning.count ? ` (${formatNumber(warning.count)})` : "",
      }),
      detail: t("finding.import.detail", { code: warning.code }),
    };
  }

  return { title: finding.title, detail: finding.detail };
}

function localizeCrsAssessment(report: InspectionReport): { label: string; explanation: string } {
  const heuristic = crsHeuristicLabel(report.focusBounds ?? report.fullBounds);
  const crs = report.dataset.declaredCrs ?? "–";
  if (report.crs.status === "declared") {
    return {
      label: t("crs.declared.title", { crs }),
      explanation: t("crs.declared.detail", { heuristic }),
    };
  }
  if (report.crs.status === "contradictory") {
    return {
      label: t("crs.contradictory.title", { crs }),
      explanation: t("crs.contradictory.detail", { heuristic }),
    };
  }
  if (report.crs.status === "plausible") {
    return {
      label: t("crs.plausible.title", { heuristic }),
      explanation: t("crs.plausible.detail"),
    };
  }
  return { label: t("crs.unknown.title"), explanation: t("crs.unknown.detail") };
}

function crsHeuristicLabel(bounds: Bounds2D | null): string {
  if (!bounds) return t("crs.heuristic.local");
  if (bounds.minX >= -180 && bounds.maxX <= 180 && bounds.minY >= -90 && bounds.maxY <= 90) {
    return t("crs.heuristic.geographic");
  }
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  if (Math.abs(centerX) >= 100_000 && Math.abs(centerX) <= 10_000_000 && Math.abs(centerY) >= 100_000) {
    return t("crs.heuristic.projected");
  }
  return t("crs.heuristic.local");
}

function localizeMapReason(candidate: MapClusterAssessment, report: ClusterMapReport): string {
  if (candidate.status === "mappable" && candidate.center) {
    return t("map.reason.mappable", {
      crs: report.sourceCrs ?? "–",
      lat: formatNumber(candidate.center.lat, 5),
      lon: formatNumber(candidate.center.lon, 5),
    });
  }
  if (candidate.status === "outside-area-of-use") {
    return t("map.reason.outside", { area: report.sourceCrs ?? "CRS" });
  }
  return t(candidate.status === "invalid-coordinate" ? "map.reason.invalid" : "map.reason.unsupported");
}

function localizeWarning(code: string, fallback: string): string {
  if (code === "geojson.holes-preview") return t("warning.geojson.holes-preview");
  if (code === "geojson.invalid-geometry") return t("warning.geojson.invalid-geometry");
  if (code === "dxf.invalid-coordinates") return t("warning.dxf.invalid-coordinates");
  if (code === "demo.approximation") return t("warning.demo.approximation");
  if (code.startsWith("dxf.approximated.")) return t("warning.dxf.approximated", { type: code.split(".").at(-1) ?? "DXF" });
  if (code.startsWith("dxf.skipped.")) return t("warning.dxf.skipped", { type: code.split(".").at(-1) ?? "DXF" });
  if (code.startsWith("geojson.unsupported.")) return t("warning.geojson.unsupported", { type: code.split(".").at(-1) ?? "GeoJSON" });
  return fallback;
}

function localizeReadError(message: string): string {
  if (message === "Die Datei ist kein gültiges JSON.") return t("error.invalidJson");
  if (message === "GeoJSON muss ein Objekt als Wurzelelement enthalten.") return t("error.geojsonRoot");
  if (message === "Nicht unterstützte GeoJSON-Wurzelstruktur.") return t("error.geojsonStructure");
  if (message === "Binäre DXF-Dateien werden im Prototyp noch nicht unterstützt.") return t("error.binaryDxf");
  if (message === "Die Datei enthält keine lesbaren DXF-Gruppen.") return t("error.dxfGroups");
  if (message === "Die DXF-Datei enthält keine ENTITIES-Sektion.") return t("error.dxfEntities");
  if (message.startsWith("DWG ist in der reinen SPA")) return t("error.dwg");
  if (message === "Unterstützt werden derzeit .dxf, .geojson und .json.") return t("error.format");
  return message;
}

function syncLanguageControl(): void {
  const language = getLanguage();
  elements.languageFlag.textContent = LANGUAGE_LABELS[language].flag;
  elements.languageCode.textContent = language.toUpperCase();
  elements.languageToggle.setAttribute("aria-label", t("lang.toggle.title"));
  elements.conceptLink.href = `./concept.html?lang=${language}`;
}

function syncClusterDistanceLabel(): void {
  elements.clusterDistanceValue.textContent = t("unit.m", {
    value: formatNumber(Number(elements.clusterDistance.value)),
  });
}

function baseName(fileName: string): string {
  return fileName.replace(/^.*[\\/]/, "").replace(/\.[^.]+$/, "");
}

function downloadText(fileName: string, content: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

function setText(id: string, value: string): void {
  byId<HTMLElement>(id).textContent = value;
}

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Element #${id} fehlt.`);
  return element as T;
}
