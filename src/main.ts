import "./styles.css";
import { inspectDataset } from "./analysis/inspectDataset";
import { readDataset } from "./io/readDataset";
import type { Bounds2D, GeoDataset, InspectionFinding, InspectionReport } from "./model";
import { renderPreview } from "./render/renderPreview";
import { demoDataset } from "./sample/demoDataset";

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
  overviewCanvas: byId<HTMLCanvasElement>("overview-canvas"),
  focusCanvas: byId<HTMLCanvasElement>("focus-canvas"),
};

let currentDataset: GeoDataset | null = null;
let currentReport: InspectionReport | null = null;
let highlightedIds = new Set<string>();

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
  analyzeAndRender("Beispieldatei geladen");
});

elements.clusterDistance.addEventListener("input", () => {
  const distance = Number(elements.clusterDistance.value);
  elements.clusterDistanceValue.textContent = `${distance.toLocaleString("de-DE")} m`;
  if (currentDataset) analyzeAndRender("Analyseparameter aktualisiert");
});

elements.downloadReport.addEventListener("click", () => {
  if (!currentReport) return;
  const serializable = {
    generatedAt: new Date().toISOString(),
    application: "geodata-inspector-cleaner",
    version: "0.1.0",
    file: currentReport.dataset.fileName,
    format: currentReport.dataset.format,
    config: currentReport.config,
    declaredCrs: currentReport.dataset.declaredCrs,
    crsAssessment: currentReport.crs,
    fullBounds: currentReport.fullBounds,
    focusBounds: currentReport.focusBounds,
    extentInflationFactor: currentReport.extentInflationFactor,
    clusters: currentReport.clusters,
    findings: currentReport.findings,
    recommendedRemovalIds: [...currentReport.recommendedRemovalIds],
    warnings: currentReport.dataset.warnings,
  };
  downloadText(`${baseName(currentReport.dataset.fileName)}-inspection-report.json`, JSON.stringify(serializable, null, 2));
});

new ResizeObserver(() => renderCanvases()).observe(document.querySelector(".preview-grid") ?? document.body);

async function loadFile(file: File): Promise<void> {
  setStatus(`Lese ${file.name} …`, "working");
  try {
    currentDataset = await readDataset(file);
    highlightedIds.clear();
    analyzeAndRender(`${file.name} lokal analysiert`);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Datei konnte nicht gelesen werden.", "error");
  } finally {
    elements.fileInput.value = "";
  }
}

function analyzeAndRender(status: string): void {
  if (!currentDataset) return;
  currentReport = inspectDataset(currentDataset, {
    clusterDistanceMeters: Number(elements.clusterDistance.value),
  });
  renderDashboard(currentReport);
  setStatus(status, currentReport.findings.some((finding) => finding.severity === "critical") ? "warning" : "ok");
}

function renderDashboard(report: InspectionReport): void {
  elements.emptyState.hidden = true;
  elements.results.hidden = false;
  elements.downloadReport.disabled = false;
  elements.stageTitle.textContent = report.dataset.fileName;

  const layerCount = new Set(report.dataset.features.map((feature) => feature.layer)).size;
  setText("metric-features", report.dataset.features.length.toLocaleString("de-DE"));
  setText("metric-layers", `${layerCount.toLocaleString("de-DE")} Layer`);
  setText("metric-clusters", report.clusters.length.toLocaleString("de-DE"));
  const primary = report.clusters.find((cluster) => cluster.isPrimary);
  setText("metric-dominance", primary ? `${(primary.featureCount / report.dataset.features.length).toLocaleString("de-DE", { style: "percent", maximumFractionDigits: 0 })} im Hauptbereich` : "keine Geometrie");
  setText("metric-inflation", report.extentInflationFactor === null ? "–" : `${report.extentInflationFactor.toLocaleString("de-DE", { maximumFractionDigits: 0 })}×`);
  setText("metric-crs", report.dataset.declaredCrs ?? (report.crs.status === "plausible" ? "Kandidat" : "Unbekannt"));
  setText("metric-crs-status", report.crs.status);
  setText("overview-extent", formatBoundsSize(report.fullBounds));
  setText("focus-extent", formatBoundsSize(report.focusBounds));
  setText("crs-title", report.crs.label);
  setText("crs-detail", report.crs.explanation);

  elements.fileFacts.classList.remove("empty");
  elements.fileFacts.innerHTML = `
    <p class="eyebrow">Datei-Inventar</p>
    <dl>
      <div><dt>Format</dt><dd>${escapeHtml(report.dataset.format.toUpperCase())}</dd></div>
      <div><dt>Features</dt><dd>${report.dataset.features.length.toLocaleString("de-DE")}</dd></div>
      <div><dt>Layer</dt><dd>${layerCount.toLocaleString("de-DE")}</dd></div>
      <div><dt>Warnungen</dt><dd>${report.dataset.warnings.length.toLocaleString("de-DE")}</dd></div>
    </dl>`;

  renderFindings(report.findings);
  renderCanvases();
}

function renderFindings(findings: InspectionFinding[]): void {
  if (findings.length === 0) {
    elements.findings.innerHTML = '<div class="finding-placeholder"><span>✓</span><p>Keine Auffälligkeiten mit den aktuellen Regeln gefunden.</p></div>';
    return;
  }
  elements.findings.innerHTML = "";
  for (const finding of findings) {
    const article = document.createElement("button");
    article.type = "button";
    article.className = `finding-card severity-${finding.severity}`;
    article.innerHTML = `
      <span class="finding-symbol">${finding.severity === "critical" ? "!" : finding.severity === "warning" ? "△" : "i"}</span>
      <span class="finding-copy">
        <span class="finding-meta">${escapeHtml(categoryLabel(finding.category))} · ${escapeHtml(recommendationLabel(finding.recommendation))}</span>
        <strong>${escapeHtml(finding.title)}</strong>
        <small>${escapeHtml(finding.detail)}</small>
      </span>
      <span class="finding-count">${finding.featureIds.length || "–"}</span>`;
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
}

function setStatus(message: string, type: "working" | "error" | "warning" | "ok"): void {
  elements.status.className = `status-${type}`;
  elements.status.innerHTML = `<i></i>${escapeHtml(message)}`;
}

function formatBoundsSize(bounds: Bounds2D | null): string {
  if (!bounds) return "keine gültigen Bounds";
  return `${formatDistance(bounds.maxX - bounds.minX)} × ${formatDistance(bounds.maxY - bounds.minY)}`;
}

function formatDistance(meters: number): string {
  return meters >= 1000
    ? `${(meters / 1000).toLocaleString("de-DE", { maximumFractionDigits: 1 })} km`
    : `${meters.toLocaleString("de-DE", { maximumFractionDigits: 0 })} m`;
}

function categoryLabel(category: InspectionFinding["category"]): string {
  return ({
    "remote-cluster": "Räumliches Cluster",
    "extent-inflation": "Ausdehnung",
    "z-zero": "Höhen",
    crs: "Koordinatensystem",
    "import-loss": "Importbilanz",
    "ambiguous-primary": "Mehrdeutigkeit",
  })[category];
}

function recommendationLabel(recommendation: InspectionFinding["recommendation"]): string {
  return ({ keep: "behalten", review: "prüfen", remove: "Entfernung empfohlen", "set-crs": "CRS bestätigen" })[recommendation];
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
