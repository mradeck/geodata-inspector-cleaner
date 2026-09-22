import { DuplicatePanel } from "./duplicates/renderDuplicatePanel";
import { duplicateCounts } from "./duplicates/dxfDuplicates";
import "./styles.css";
import { analyzeDataset } from "./analysis/analyzeDataset";
import {
  buildDefaultSelection,
  countSelected,
  FILTER_SHAPE_TYPES,
  filterFeatures,
  selectionKey,
  summarizeLayers,
  type FeatureFilterSelection,
  type FilterShapeType,
  type LayerObjectSummary,
} from "./analysis/layerFilter";
import { selectDisturbanceArea } from "./analysis/selectDisturbanceArea";
import { median } from "./analysis/statistics";
import { assessClustersForMap, normalizeEpsg, type ClusterMapReport, type MapClusterAssessment } from "./geo/mapProjection";
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
import { CleanerError, createCleanedExport } from "./io/exportCleaned";
import { getDxfAcadVersion, setDxfAcadVersion } from "./io/dxfExportSettings";
import type { DxfAcadVersion } from "./io/dxfNormalizedExporter";
import type { Bounds2D, GeoDataset, InspectionFinding, InspectionReport } from "./model";
import { renderPreview } from "./render/renderPreview";
import { demoDataset } from "./sample/demoDataset";
import { OsmClusterMap } from "./map/osmClusterMap";
import { getTheme, initTheme, onThemeChange, toggleTheme } from "./theme";
import { APP_VERSION } from "./version";
import { initAppFooter } from "./appFooter";

const elements = {
  headerVersion: byId<HTMLElement>("header-version"),
  fileInput: byId<HTMLInputElement>("file-input"),
  dropZone: byId<HTMLElement>("drop-zone"),
  loadDemo: byId<HTMLButtonElement>("load-demo"),
  clusterDistance: byId<HTMLInputElement>("cluster-distance"),
  clusterDistanceValue: byId<HTMLElement>("cluster-distance-value"),
  analysisCrs: byId<HTMLInputElement>("analysis-crs"),
  analysisCrsHelp: byId<HTMLElement>("analysis-crs-help"),
  fileFacts: byId<HTMLElement>("file-facts"),
  emptyState: byId<HTMLElement>("empty-state"),
  results: byId<HTMLElement>("results"),
  stageTitle: byId<HTMLElement>("stage-title"),
  findings: byId<HTMLElement>("findings"),
  status: byId<HTMLElement>("status"),
  downloadReport: byId<HTMLButtonElement>("download-report"),
  downloadCleaned: byId<HTMLButtonElement>("download-cleaned"),
  downloadGeoJsonAsDxf: byId<HTMLButtonElement>("download-geojson-as-dxf"),
  cleanerConversionNote: byId<HTMLElement>("cleaner-conversion-note"),
  dxfAcadVersion: byId<HTMLSelectElement>("dxf-acad-version"),
  cleanerSummary: byId<HTMLElement>("cleaner-summary"),
  objectFilterTable: byId<HTMLElement>("object-filter-table"),
  objectFilterSummary: byId<HTMLElement>("object-filter-summary"),
  filterPointsOff: byId<HTMLButtonElement>("filter-points-off"),
  filterPointsOn: byId<HTMLButtonElement>("filter-points-on"),
  filterAllOn: byId<HTMLButtonElement>("filter-all-on"),
  filterAllOff: byId<HTMLButtonElement>("filter-all-off"),
  objectFilterConfirmation: byId<HTMLElement>("object-filter-confirmation"),
  objectFilterConfirmationText: byId<HTMLElement>("object-filter-confirmation-text"),
  filterConfirmPrimary: byId<HTMLButtonElement>("filter-confirm-primary"),
  helpLink: byId<HTMLAnchorElement>("help-link"),
  aboutMenu: byId<HTMLDetailsElement>("about-menu"),
  openAbout: byId<HTMLButtonElement>("open-about"),
  openCopyright: byId<HTMLButtonElement>("open-copyright"),
  closeAbout: byId<HTMLButtonElement>("close-about"),
  confirmAbout: byId<HTMLButtonElement>("confirm-about"),
  aboutDialog: byId<HTMLElement>("about-dialog"),
  closeCopyright: byId<HTMLButtonElement>("close-copyright"),
  confirmCopyright: byId<HTMLButtonElement>("confirm-copyright"),
  copyrightDialog: byId<HTMLElement>("copyright-dialog"),
  copyrightContent: byId<HTMLElement>("copyright-content"),
  overviewCanvas: byId<HTMLCanvasElement>("overview-canvas"),
  focusCanvas: byId<HTMLCanvasElement>("focus-canvas"),
  focusOsmMap: byId<HTMLElement>("focus-osm-map"),
  focusPreviewVisual: byId<HTMLElement>("focus-preview-visual"),
  disturbanceCanvas: byId<HTMLCanvasElement>("disturbance-canvas"),
  disturbancePreviewCard: byId<HTMLDetailsElement>("disturbance-preview-card"),
  disturbancePreviewToggle: byId<HTMLElement>("disturbance-preview-toggle"),
  disturbanceToggleLabel: byId<HTMLElement>("disturbance-toggle-label"),
  disturbanceOsmMap: byId<HTMLElement>("disturbance-osm-map"),
  disturbancePreviewVisual: byId<HTMLElement>("disturbance-preview-visual"),
  disturbanceBadge: byId<HTMLElement>("disturbance-badge"),
  osmMap: byId<HTMLElement>("osm-map"),
  mapEmpty: byId<HTMLElement>("map-empty"),
  mapCandidates: byId<HTMLElement>("map-candidates"),
  languageToggle: byId<HTMLButtonElement>("btn-toggle-language"),
  languageFlag: byId<HTMLElement>("language-flag"),
  languageCode: byId<HTMLElement>("language-code"),
  themeToggle: byId<HTMLButtonElement>("btn-toggle-theme"),
  themeIcon: byId<HTMLElement>("theme-icon"),
};

const duplicatePanel = new DuplicatePanel(byId<HTMLElement>("duplicate-panel"), downloadText, applyDuplicateCleanup);

let currentDataset: GeoDataset | null = null;
let currentReport: InspectionReport | null = null;
let highlightedIds = new Set<string>();
let preferredPrimaryFeatureId: string | null = null;
let osmClusterMap: OsmClusterMap | null = null;
let focusOsmMap: OsmClusterMap | null = null;
let disturbanceOsmMap: OsmClusterMap | null = null;
let layerSummaries: LayerObjectSummary[] = [];
let featureFilterSelection: FeatureFilterSelection = new Set();
let previousAboutFocus: HTMLElement | null = null;
let previousCopyrightFocus: HTMLElement | null = null;
let copyrightLoaded = false;
let analysisCrsWasEdited = false;
let analysisCrsUpdateTimer: number | null = null;

initTheme();
initI18n();
initAppFooter(openCopyrightDialog);
syncAppIdentity();
elements.dxfAcadVersion.value = getDxfAcadVersion();
syncLanguageControl();
syncThemeControl();
syncDisturbanceDisclosure();
syncClusterDistanceLabel();
setAnalysisCrsValidity(true);

elements.languageToggle.addEventListener("click", () => {
  setLanguage(getLanguage() === "de" ? "en" : "de");
});

elements.themeToggle.addEventListener("click", () => {
  const theme = toggleTheme();
  setStatus(t(theme === "light" ? "status.themeLight" : "status.themeDark"), "ok");
});

elements.disturbancePreviewCard.addEventListener("toggle", () => {
  syncDisturbanceDisclosure();
  if (!elements.disturbancePreviewCard.open) return;
  window.requestAnimationFrame(() => {
    renderCanvases();
    if (currentReport) renderDetailMaps(currentReport, assessClustersForMap(currentReport));
  });
});

elements.openAbout.addEventListener("click", openAboutDialog);
elements.openCopyright.addEventListener("click", openCopyrightDialog);
elements.closeAbout.addEventListener("click", closeAboutDialog);
elements.confirmAbout.addEventListener("click", closeAboutDialog);
elements.closeCopyright.addEventListener("click", closeCopyrightDialog);
elements.confirmCopyright.addEventListener("click", closeCopyrightDialog);
elements.aboutDialog.addEventListener("click", (event) => {
  if (event.target === elements.aboutDialog) closeAboutDialog();
});
elements.copyrightDialog.addEventListener("click", (event) => {
  if (event.target === elements.copyrightDialog) closeCopyrightDialog();
});
document.addEventListener("click", (event) => {
  if (!elements.aboutMenu.contains(event.target as Node)) elements.aboutMenu.open = false;
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!elements.copyrightDialog.hidden) closeCopyrightDialog();
  else if (!elements.aboutDialog.hidden) closeAboutDialog();
  else elements.aboutMenu.open = false;
});

onThemeChange(() => syncThemeControl());

onLanguageChange((language) => {
  syncAppIdentity();
  syncLanguageControl();
  syncThemeControl();
  syncDisturbanceDisclosure();
  syncClusterDistanceLabel();
  setAnalysisCrsValidity(elements.analysisCrs.getAttribute("aria-invalid") !== "true");
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
  syncAnalysisCrsFromDataset(currentDataset);
  resetObjectFilter();
  highlightedIds.clear();
  preferredPrimaryFeatureId = null;
  analyzeAndRender(t("status.demoLoaded"));
});

elements.filterPointsOff.addEventListener("click", () => setObjectFilter("point", false));
elements.filterPointsOn.addEventListener("click", () => setObjectFilter("point", true));
elements.filterAllOn.addEventListener("click", () => setObjectFilter(null, true));
elements.filterAllOff.addEventListener("click", () => setObjectFilter(null, false));
elements.dxfAcadVersion.addEventListener("change", () => {
  const version = selectedDxfAcadVersion();
  setDxfAcadVersion(version);
  setStatus(t("status.dxfVersionChanged", { version }), "ok");
});
elements.filterConfirmPrimary.addEventListener("click", () => {
  const primary = currentReport?.clusters.find((cluster) => cluster.isPrimary);
  preferredPrimaryFeatureId = primary?.featureIds[0] ?? null;
  if (preferredPrimaryFeatureId) {
    highlightedIds = new Set(primary?.featureIds ?? []);
    analyzeAndRender(t("status.primarySelected"));
  }
});

elements.clusterDistance.addEventListener("input", () => {
  syncClusterDistanceLabel();
  if (currentDataset) analyzeAndRender(t("status.parametersUpdated"));
});

elements.analysisCrs.addEventListener("input", () => {
  cancelAnalysisCrsUpdate();
  analysisCrsUpdateTimer = window.setTimeout(() => {
    analysisCrsUpdateTimer = null;
    applyAnalysisCrsInput();
  }, 350);
});

elements.analysisCrs.addEventListener("change", () => {
  cancelAnalysisCrsUpdate();
  applyAnalysisCrsInput();
});

elements.analysisCrs.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  cancelAnalysisCrsUpdate();
  applyAnalysisCrsInput();
});

function applyAnalysisCrsInput(): void {
  const raw = elements.analysisCrs.value.trim();
  const normalized = normalizeEpsg(raw);
  analysisCrsWasEdited = true;
  if (raw && !normalized) {
    setAnalysisCrsValidity(false);
    setStatus(t("status.crsInvalid"), "error");
    return;
  }

  elements.analysisCrs.value = normalized ?? "";
  setAnalysisCrsValidity(true);
  const alreadyApplied = currentReport?.analysisCrs === normalized;
  if (alreadyApplied) {
    setStatus(t("status.crsUpdated", { crs: normalized ?? t("metric.unknown") }), "ok");
    return;
  }
  preferredPrimaryFeatureId = null;
  highlightedIds.clear();
  if (currentDataset) analyzeAndRender(t("status.crsUpdated", { crs: normalized ?? t("metric.unknown") }));
  else setStatus(t("status.crsUpdated", { crs: normalized ?? t("metric.unknown") }), "ok");
}

function cancelAnalysisCrsUpdate(): void {
  if (analysisCrsUpdateTimer === null) return;
  window.clearTimeout(analysisCrsUpdateTimer);
  analysisCrsUpdateTimer = null;
}

elements.downloadReport.addEventListener("click", () => {
  if (!currentReport) return;
  const serializable = {
    generatedAt: new Date().toISOString(),
    application: "geodata-inspector-cleaner",
    version: APP_VERSION,
    file: currentReport.dataset.fileName,
    format: currentReport.dataset.format,
    config: currentReport.config,
    declaredCrs: currentReport.dataset.declaredCrs,
    analysisCrs: currentReport.analysisCrs,
    analysisCrsSource: currentReport.crs.source,
    crsAssessment: localizeCrsAssessment(currentReport),
    fullBounds: currentReport.fullBounds,
    focusBounds: currentReport.focusBounds,
    extentInflationFactor: currentReport.extentInflationFactor,
    clusters: currentReport.clusters,
    primaryClusterId: currentReport.primaryClusterId,
    primarySelection: currentReport.primarySelection,
    findings: currentReport.findings.map((finding) => ({
      ...finding,
      ...localizeFinding(finding, currentReport!),
    })),
    recommendedRemovalIds: [...currentReport.recommendedRemovalIds],
    duplicates: duplicatePanel.report(),
    objectFilter: {
      selectedFeatureCount: countSelected(currentReport.dataset.features, featureFilterSelection),
      totalFeatureCount: currentReport.dataset.features.length,
      layers: layerSummaries.map((summary) => ({
        layerName: summary.layerName,
        metadata: summary.metadata,
        counts: summary.counts,
        selectedTypes: FILTER_SHAPE_TYPES.filter((type) =>
          featureFilterSelection.has(selectionKey(summary.layerName, type)),
        ),
      })),
    },
    dxfExportProfile: selectedDxfAcadVersion(),
    warnings: currentReport.dataset.warnings.map((warning) => ({
      ...warning,
      message: localizeWarning(warning.code, warning.message),
    })),
  };
  downloadText(`${baseName(currentReport.dataset.fileName)}-inspection-report.json`, JSON.stringify(serializable, null, 2), "application/json;charset=utf-8");
});

elements.downloadCleaned.addEventListener("click", () => exportCurrentSelection());
elements.downloadGeoJsonAsDxf.addEventListener("click", () => exportCurrentSelection("dxf", true));

function exportCurrentSelection(outputFormat?: "dxf" | "geojson", allowUnchangedOutput = false): void {
  if (!currentDataset || !currentReport) return;
  try {
    const cleaned = createCleanedExport(currentDataset, currentReport, {
      featureFilterSelection,
      outputFormat,
      allowUnchangedOutput,
      acadVersion: selectedDxfAcadVersion(),
      coordinateSystemLabel: currentReport.analysisCrs ?? currentDataset.declaredCrs,
    });
    downloadText(cleaned.fileName, cleaned.content, cleaned.mimeType);
    elements.cleanerSummary.textContent = t("cleaner.validated", {
      kept: formatNumber(cleaned.keptFeatureCount),
      removed: formatNumber(cleaned.removedFeatureCount),
    });
    setStatus(t("status.cleanedSaved", { file: cleaned.fileName }), "ok");
  } catch (error) {
    const message = error instanceof CleanerError ? t(`cleaner.error.${error.code}`) : t("cleaner.error.unknown");
    setStatus(message, "error");
  }
}

function selectedDxfAcadVersion(): DxfAcadVersion {
  return elements.dxfAcadVersion.value === "AC1032" ? "AC1032" : "AC1015";
}

new ResizeObserver(() => renderCanvases()).observe(document.querySelector(".preview-grid") ?? document.body);

function applyDuplicateCleanup(dataset: GeoDataset, status: string): void {
  // Reparsed feature IDs and cluster membership belong to a new working dataset.
  // Retain the last valid CRS; an unfinished input must not leave stale counts.
  const analysisCrs = currentReport?.analysisCrs ?? null;
  const report = analyzeDataset(dataset, {
    clusterDistanceMeters: Number(elements.clusterDistance.value),
  }, { analysisCrs });
  cancelAnalysisCrsUpdate();
  currentDataset = dataset;
  currentReport = report;
  elements.analysisCrs.value = analysisCrs ?? normalizeEpsg(dataset.declaredCrs) ?? "";
  setAnalysisCrsValidity(true);
  preferredPrimaryFeatureId = null;
  highlightedIds.clear();
  resetObjectFilter();
  renderDashboard(report);
  setStatus(status, "ok");
}

async function loadFile(file: File): Promise<void> {
  setStatus(t("status.reading", { file: file.name }), "working");
  try {
    currentDataset = await readDataset(file);
    syncAnalysisCrsFromDataset(currentDataset);
    resetObjectFilter();
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
  const rawCrs = elements.analysisCrs.value.trim();
  const analysisCrs = normalizeEpsg(rawCrs);
  if (rawCrs && !analysisCrs) {
    setAnalysisCrsValidity(false);
    setStatus(t("status.crsInvalid"), "error");
    return;
  }
  const declaredCrs = normalizeEpsg(currentDataset.declaredCrs);
  const analysisCrsOverride = !analysisCrsWasEdited && analysisCrs === declaredCrs
    ? null
    : analysisCrs;
  currentReport = analyzeDataset(currentDataset, {
    clusterDistanceMeters: Number(elements.clusterDistance.value),
  }, { preferredPrimaryFeatureId, analysisCrs: analysisCrsOverride });
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
      : report.primarySelection === "crs"
        ? t("metric.primaryCrs", { count: formatNumber(primary.featureCount) })
        : t("metric.primaryShare", { share: formatPercent(primary.featureCount / report.dataset.features.length) })
    : t("metric.noGeometry"));
  setText("metric-inflation", report.extentInflationFactor === null ? "–" : `${formatNumber(report.extentInflationFactor)}×`);
  setText("metric-crs", report.analysisCrs ?? report.dataset.declaredCrs ?? (report.crs.status === "plausible" ? t("metric.candidate") : t("metric.unknown")));
  setText("metric-crs-status", report.crs.status);
  setText("overview-extent", formatBoundsSize(report.fullBounds));
  setText("overview-coordinate-range", formatCoordinateRange(report.fullBounds));
  setText("focus-title", report.primarySelection === "manual"
    ? t("preview.focusManual")
    : report.primarySelection === "crs"
      ? t("preview.focusCrs")
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

  duplicatePanel.render(report.dataset);
  renderFindings(report);
  renderObjectFilter(report.dataset);
  renderCleaner(report);
  renderMapSection(report);
  renderCanvases();
}

function resetObjectFilter(): void {
  if (!currentDataset) {
    layerSummaries = [];
    featureFilterSelection = new Set();
    return;
  }
  layerSummaries = summarizeLayers(currentDataset);
  featureFilterSelection = buildDefaultSelection(layerSummaries);
}

function setObjectFilter(type: FilterShapeType | null, selected: boolean): void {
  if (!currentDataset) return;
  for (const summary of layerSummaries) {
    for (const candidateType of FILTER_SHAPE_TYPES) {
      if (type !== null && candidateType !== type) continue;
      if (summary.counts[candidateType] === 0) continue;
      const key = selectionKey(summary.layerName, candidateType);
      if (selected) featureFilterSelection.add(key);
      else featureFilterSelection.delete(key);
    }
  }
  renderObjectFilter(currentDataset);
  if (currentReport) renderCleaner(currentReport);
  renderCanvases();
  setStatus(t("status.objectFilterUpdated"), "ok");
}

function renderObjectFilter(dataset: GeoDataset): void {
  const total = dataset.features.length;
  const kept = countSelected(dataset.features, featureFilterSelection);
  elements.objectFilterSummary.textContent = t("filter.summary", {
    kept: formatNumber(kept),
    total: formatNumber(total),
  });
  const primary = currentReport?.clusters.find((cluster) => cluster.isPrimary);
  const confirmed = currentReport?.primarySelection === "manual";
  elements.objectFilterConfirmation.classList.toggle("confirmed", confirmed);
  elements.objectFilterConfirmationText.textContent = t(confirmed ? "filter.confirmed" : "filter.confirmHint");
  elements.filterConfirmPrimary.hidden = confirmed;
  elements.filterConfirmPrimary.disabled = !primary;
  elements.objectFilterTable.replaceChildren();

  const header = document.createElement("div");
  header.className = "object-filter-row object-filter-row-head";
  header.append(createFilterCell(t("filter.column.layer"), "object-filter-cell"));
  for (const type of FILTER_SHAPE_TYPES) {
    header.append(createFilterCell(filterTypeLabel(type), "object-filter-cell object-filter-cell-type"));
  }
  elements.objectFilterTable.append(header);

  for (const summary of layerSummaries) {
    const row = document.createElement("div");
    row.className = "object-filter-row";
    const layerCell = document.createElement("div");
    layerCell.className = "object-filter-cell object-filter-layer";
    const swatch = document.createElement("span");
    swatch.className = "object-filter-swatch";
    swatch.style.background = summary.metadata.color;
    const name = document.createElement("span");
    name.className = "object-filter-layer-name";
    name.textContent = `${summary.layerName} · ${formatNumber(summary.total)}`;
    name.title = summary.layerName;
    const metadata = document.createElement("span");
    metadata.className = "object-filter-metadata";
    metadata.textContent = formatLayerMetadata(summary);
    metadata.title = metadata.textContent;
    layerCell.append(swatch, name, metadata);
    row.append(layerCell);

    for (const type of FILTER_SHAPE_TYPES) {
      const cell = document.createElement("div");
      cell.className = "object-filter-cell object-filter-cell-type";
      const count = summary.counts[type];
      if (count === 0) {
        cell.classList.add("object-filter-empty");
        cell.textContent = "–";
      } else {
        const key = selectionKey(summary.layerName, type);
        const label = document.createElement("label");
        label.className = "object-filter-check";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = featureFilterSelection.has(key);
        input.setAttribute("aria-label", t("filter.keepAria", {
          count: formatNumber(count),
          type: filterTypeLabel(type),
          layer: summary.layerName,
        }));
        input.addEventListener("change", () => {
          if (input.checked) featureFilterSelection.add(key);
          else featureFilterSelection.delete(key);
          renderObjectFilter(dataset);
          if (currentReport) renderCleaner(currentReport);
          renderCanvases();
          setStatus(t("status.objectFilterUpdated"), "ok");
        });
        const countLabel = document.createElement("span");
        countLabel.textContent = formatNumber(count);
        label.append(input, countLabel);
        cell.append(label);
      }
      row.append(cell);
    }
    elements.objectFilterTable.append(row);
  }
}

function createFilterCell(text: string, className: string): HTMLElement {
  const cell = document.createElement("div");
  cell.className = className;
  cell.textContent = text;
  return cell;
}

function filterTypeLabel(type: FilterShapeType): string {
  return t(({
    point: "filter.type.point",
    line: "filter.type.line",
    polyline: "filter.type.polyline",
    area: "filter.type.area",
  } as const)[type]);
}

function formatLayerMetadata(summary: LayerObjectSummary): string {
  const metadata = summary.metadata;
  const states = [
    metadata.isOff ? t("filter.state.off") : null,
    metadata.isFrozen ? t("filter.state.frozen") : null,
    metadata.isLocked ? t("filter.state.locked") : null,
    !metadata.isPlottable ? t("filter.state.noPlot") : null,
  ].filter((state): state is string => state !== null);
  const lineWeight = metadata.lineWeight !== null && metadata.lineWeight >= 0
    ? t("filter.lineWeight.value", { value: formatNumber(metadata.lineWeight / 100, 2) })
    : t("filter.lineWeight.default");
  return t("filter.metadata", {
    color: metadata.color.toUpperCase(),
    aci: metadata.aciColor,
    lineType: metadata.lineType,
    lineWeight,
    states: states.join(", ") || t("filter.state.normal"),
  });
}

function renderCleaner(report: InspectionReport): void {
  const primary = report.clusters.find((cluster) => cluster.isPrimary);
  const primaryIds = new Set(primary?.featureIds ?? []);
  const kept = filterFeatures(report.dataset.features, featureFilterSelection)
    .filter((feature) => primaryIds.has(feature.id)).length;
  const spatialRemoved = report.dataset.features.length - (primary?.featureCount ?? 0);
  const objectFiltered = Math.max(0, (primary?.featureCount ?? 0) - kept);
  const removed = Math.max(0, report.dataset.features.length - kept);
  const canExport = report.primarySelection === "manual" && Boolean(primary) && kept > 0;
  const isGeoJson = report.dataset.format === "geojson";
  elements.downloadCleaned.textContent = t(report.dataset.format === "dxf" ? "cleaner.downloadDxf" : "cleaner.downloadGeoJson");
  elements.downloadCleaned.disabled = !canExport || removed === 0;
  elements.downloadGeoJsonAsDxf.hidden = !isGeoJson;
  elements.downloadGeoJsonAsDxf.disabled = !canExport;
  elements.cleanerConversionNote.hidden = !isGeoJson;

  if (!primary) {
    elements.cleanerSummary.textContent = t("cleaner.noPrimary");
  } else if (kept === 0) {
    elements.cleanerSummary.textContent = t("cleaner.nothingSelected");
  } else if (report.primarySelection !== "manual") {
    elements.cleanerSummary.textContent = t("cleaner.confirm", {
      kept: formatNumber(kept),
      removed: formatNumber(removed),
    });
  } else if (removed === 0) {
    elements.cleanerSummary.textContent = t(isGeoJson ? "cleaner.conversionOnly" : "cleaner.nothingToRemove", {
      kept: formatNumber(kept),
    });
  } else {
    elements.cleanerSummary.textContent = t("cleaner.ready", {
      kept: formatNumber(kept),
      removed: formatNumber(removed),
      spatial: formatNumber(spatialRemoved),
      filtered: formatNumber(objectFiltered),
    });
  }
}

function renderMapSection(report: InspectionReport): void {
  const mapReport = assessClustersForMap(report);
  setText("map-crs-label", mapReport.sourceCrs
    ? t(mapReport.source === "input"
      ? "map.crs.input"
      : mapReport.source === "declared"
        ? "map.crs.declared"
        : "map.crs.heuristic", { crs: mapReport.sourceCrs })
    : t("map.crs.missing"));
  const drawable = mapReport.clusters.filter(isDrawableMapCluster);
  elements.mapEmpty.hidden = drawable.length > 0;
  if (!osmClusterMap) osmClusterMap = new OsmClusterMap(elements.osmMap);
  osmClusterMap.render(mapReport, report.dataset);
  renderDetailMaps(report, mapReport);
  renderMapCandidates(mapReport, report);
}

function renderDetailMaps(report: InspectionReport, mapReport: ClusterMapReport): void {
  const primary = report.clusters.find((cluster) => cluster.isPrimary);
  if (!focusOsmMap) focusOsmMap = new OsmClusterMap(elements.focusOsmMap);
  const focusHasMap = primary
    ? focusOsmMap.render(mapReport, report.dataset, {
        visibleClusterIds: new Set([primary.id]),
        initialClusterId: primary.id,
      })
    : false;
  setDetailMapAvailability(elements.focusPreviewVisual, elements.focusOsmMap, focusHasMap);

  if (!elements.disturbancePreviewCard.open) {
    setDetailMapAvailability(elements.disturbancePreviewVisual, elements.disturbanceOsmMap, false);
    return;
  }

  const disturbance = selectDisturbanceArea(report);
  const disturbanceClusterIds = new Set(report.clusters
    .filter((cluster) => !cluster.isPrimary && cluster.featureIds.some((id) => disturbance?.featureIds.has(id)))
    .map((cluster) => cluster.id));
  if (!disturbanceOsmMap) disturbanceOsmMap = new OsmClusterMap(elements.disturbanceOsmMap);
  const disturbanceHasMap = disturbanceClusterIds.size > 0 && disturbanceOsmMap.render(mapReport, report.dataset, {
    visibleClusterIds: disturbanceClusterIds,
    initialClusterId: disturbanceClusterIds.values().next().value ?? null,
  });
  setDetailMapAvailability(elements.disturbancePreviewVisual, elements.disturbanceOsmMap, disturbanceHasMap);
}

function setDetailMapAvailability(visual: HTMLElement, mapElement: HTMLElement, available: boolean): void {
  visual.classList.toggle("has-osm", available);
  mapElement.inert = !available;
  if (available) mapElement.removeAttribute("aria-hidden");
  else mapElement.setAttribute("aria-hidden", "true");
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
      ? report.primarySelection === "crs"
        ? "map.crsCandidate"
        : report.primarySelection === "automatic" && !report.primaryIsDominant
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

    if (candidate.status === "mappable" && (!cluster.isPrimary || report.primarySelection !== "manual")) {
      const choose = document.createElement("button");
      choose.type = "button";
      choose.className = "button choose-primary";
      choose.textContent = t(cluster.isPrimary ? "map.confirmPrimary" : "map.choosePrimary");
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
      if (finding.category === "dxf-duplicates") {
        const panel = byId<HTMLElement>("duplicate-panel");
        const details = panel.querySelector("details");
        if (details) details.open = true;
        panel.scrollIntoView({ block: "start", behavior: "smooth" });
      }
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
  const selectedIds = new Set(filterFeatures(currentDataset.features, featureFilterSelection).map((feature) => feature.id));
  const filteredPrimaryIds = new Set([...primaryIds].filter((id) => selectedIds.has(id)));
  renderPreview(elements.overviewCanvas, currentDataset, currentReport, {
    bounds: currentReport.fullBounds,
    highlightedFeatureIds: highlightedIds,
    showClusterOverview: true,
  });
  renderPreview(elements.focusCanvas, currentDataset, currentReport, {
    bounds: currentReport.focusBounds,
    visibleFeatureIds: filteredPrimaryIds,
    highlightedFeatureIds: highlightedIds,
  });
  if (elements.disturbancePreviewCard.open) {
    const disturbance = selectDisturbanceArea(currentReport);
    renderPreview(elements.disturbanceCanvas, currentDataset, currentReport, {
      bounds: disturbance?.bounds ?? null,
      visibleFeatureIds: disturbance?.featureIds ?? new Set<string>(),
      highlightedFeatureIds: highlightedIds,
      emptyMessage: t("preview.noDisturbance"),
    });
  }
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
  if (category === "dxf-duplicates") return t("duplicate.title");
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

  if (finding.category === "dxf-duplicates" && report.dataset.dxfDuplicates) {
    const check = report.dataset.dxfDuplicates;
    const counts = duplicateCounts(check);
    return { title: t("duplicate.title"), detail: check.error ? t(`duplicate.error.${check.error}`) : t("duplicate.summary", {
      total: formatNumber(check.entities.length), same: formatNumber(counts.sameLayer), cross: formatNumber(counts.crossLayer),
    }) };
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
  const crs = report.analysisCrs ?? report.dataset.declaredCrs ?? "–";
  if (report.crs.status === "declared") {
    return {
      label: t(report.crs.source === "input" ? "crs.input.title" : "crs.declared.title", { crs }),
      explanation: t(report.crs.source === "input" ? "crs.input.detail" : "crs.declared.detail", { heuristic }),
    };
  }
  if (report.crs.status === "contradictory") {
    return {
      label: t("crs.contradictory.title", { crs }),
      explanation: t(report.crs.source === "input" ? "crs.contradictory.inputDetail" : "crs.contradictory.detail", { heuristic }),
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

function syncAnalysisCrsFromDataset(dataset: GeoDataset): void {
  if (analysisCrsWasEdited) return;
  elements.analysisCrs.value = normalizeEpsg(dataset.declaredCrs) ?? "EPSG:25832";
  setAnalysisCrsValidity(true);
}

function setAnalysisCrsValidity(valid: boolean): void {
  elements.analysisCrs.setAttribute("aria-invalid", String(!valid));
  elements.analysisCrsHelp.classList.toggle("error", !valid);
  elements.analysisCrsHelp.dataset.i18n = valid ? "analysis.crsHelp" : "analysis.crsInvalid";
  elements.analysisCrsHelp.textContent = t(valid ? "analysis.crsHelp" : "analysis.crsInvalid");
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
  elements.helpLink.href = `./help.html?lang=${language}`;
}

function syncAppIdentity(): void {
  const version = `v${APP_VERSION}`;
  elements.headerVersion.textContent = version;
  document.title = `${t("app.title")} ${version}`;
}

function syncThemeControl(): void {
  const isDark = getTheme() === "dark";
  elements.themeIcon.textContent = isDark ? "☀" : "☾";
  const label = t(isDark ? "theme.toggle.toLight" : "theme.toggle.toDark");
  elements.themeToggle.title = label;
  elements.themeToggle.setAttribute("aria-label", label);
}

function syncDisturbanceDisclosure(): void {
  const expanded = elements.disturbancePreviewCard.open;
  elements.disturbanceToggleLabel.textContent = t(expanded
    ? "preview.disturbanceCollapse"
    : "preview.disturbanceExpand");
  const label = t(expanded
    ? "preview.disturbanceCollapseAria"
    : "preview.disturbanceExpandAria");
  elements.disturbancePreviewToggle.setAttribute("aria-label", label);
  elements.disturbancePreviewToggle.setAttribute("aria-expanded", String(expanded));
  elements.disturbancePreviewToggle.title = label;
}

function openAboutDialog(): void {
  elements.aboutMenu.open = false;
  previousAboutFocus = elements.aboutMenu.querySelector<HTMLElement>("summary");
  elements.aboutDialog.hidden = false;
  elements.closeAbout.focus();
}

function closeAboutDialog(): void {
  if (elements.aboutDialog.hidden) return;
  elements.aboutDialog.hidden = true;
  previousAboutFocus?.focus();
  previousAboutFocus = null;
}

function openCopyrightDialog(): void {
  previousCopyrightFocus = document.activeElement instanceof HTMLElement && !elements.aboutMenu.contains(document.activeElement)
    ? document.activeElement
    : elements.aboutMenu.querySelector<HTMLElement>("summary");
  elements.aboutMenu.open = false;
  elements.copyrightDialog.hidden = false;
  elements.closeCopyright.focus();
  setStatus(t("status.copyrightOpened"), "ok");
  if (!copyrightLoaded) void loadCopyrightContent();
}

async function loadCopyrightContent(): Promise<void> {
  try {
    const [{ marked }, copyrightDocument] = await Promise.all([
      import("marked"),
      import("../docs/COPYRIGHT-LICENSES.md?raw"),
    ]);
    elements.copyrightContent.innerHTML = marked.parse(copyrightDocument.default, { async: false }) as string;
    elements.copyrightContent.querySelectorAll<HTMLAnchorElement>("a").forEach((anchor) => {
      anchor.target = "_blank";
      anchor.rel = "noopener";
    });
    copyrightLoaded = true;
  } catch {
    elements.copyrightContent.innerHTML = "";
    const message = document.createElement("p");
    message.textContent = t("copyright.error");
    elements.copyrightContent.append(message);
  }
}

function closeCopyrightDialog(): void {
  if (elements.copyrightDialog.hidden) return;
  elements.copyrightDialog.hidden = true;
  previousCopyrightFocus?.focus();
  previousCopyrightFocus = null;
}

function syncClusterDistanceLabel(): void {
  elements.clusterDistanceValue.textContent = t("unit.m", {
    value: formatNumber(Number(elements.clusterDistance.value)),
  });
}

function baseName(fileName: string): string {
  return fileName.replace(/^.*[\\/]/, "").replace(/\.[^.]+$/, "");
}

function downloadText(fileName: string, content: string, mimeType: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
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
