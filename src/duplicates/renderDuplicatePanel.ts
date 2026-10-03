import { formatNumber, t } from "../i18n";
import type { GeoDataset } from "../model";
import { APP_VERSION } from "../version";
import { duplicateCounts, type DxfDuplicateCandidate, type DxfDuplicateCheck, type DxfSourceEntity } from "./dxfDuplicates";

const PAGE_SIZE = 50;

export class DuplicatePanel {
  private check: DxfDuplicateCheck | undefined;
  private dataset: GeoDataset | undefined;
  private selected = new Set<string>();
  private candidatesById = new Map<string, DxfDuplicateCandidate>();
  private filter = "all";
  private page = 0;
  private expanded = false;
  private message = "";

  constructor(private readonly root: HTMLElement, private readonly changed: () => void) {}
  selection(): ReadonlySet<string> { return new Set(this.selected); }

  stats() { return { detected: this.check?.candidates.length ?? 0, eligible: this.check?.candidates.filter((c) => !c.blocked).length ?? 0 }; }
  selectAll(enabled: boolean): void {
    this.selected = new Set(enabled ? this.check?.candidates.filter((c) => !c.blocked).map((c) => c.entityId) ?? [] : []);
    this.refresh();
  }

  report() {
    if (!this.check || !this.dataset) return null;
    const entities = new Map(this.check.entities.map((e) => [e.id, e]));
    return {
      application: "geodata-inspector-cleaner", version: APP_VERSION,
      sourceFile: this.dataset.fileName, generatedAt: new Date().toISOString(),
      mode: "source-preserving-duplicates-only", applied: false,
      comparison: "Exact ENTITIES tags; handles excluded, internal owner handles canonicalized; cross-layer also excludes layer tags. No coordinate tolerance.",
      error: this.check.error, total: this.check.entities.length, ...duplicateCounts(this.check),
      selectedRemovalCount: this.selected.size,
      candidates: this.check.candidates.map((c) => ({
        kind: c.kind, blocked: c.blocked, selectedForRemoval: this.selected.has(c.entityId),
        a: describe(entities.get(this.keeperId(c))!), b: describe(entities.get(c.entityId)!),
      })),
    };
  }

  render(dataset: GeoDataset): void {
    if (dataset !== this.dataset) {
      this.dataset = dataset; this.check = dataset.dxfDuplicates;
      this.candidatesById = new Map(this.check?.candidates.map((c) => [c.entityId, c]) ?? []);
      this.selected = new Set(this.check?.candidates.filter((c) => !c.blocked && c.kind === "same-layer").map((c) => c.entityId) ?? []); this.page = 0; this.filter = "all"; this.expanded = false; this.message = "";
    }
    this.root.hidden = !this.check;
    this.root.replaceChildren();
    if (!this.check) return;
    const check = this.check;
    const counts = duplicateCounts(check);
    const header = document.createElement("header"); header.className = "object-filter-header";
    const title = document.createElement("h3"); title.id = "duplicate-title"; title.textContent = t("duplicate.title");
    header.append(title); this.root.append(header);
    if (check.error) { this.root.append(paragraph(t(`duplicate.error.${check.error}`))); return; }
    this.root.append(paragraph(t("duplicate.summary", { total: formatNumber(check.entities.length), same: formatNumber(counts.sameLayer), cross: formatNumber(counts.crossLayer) })));
    this.root.append(paragraph(t("duplicate.detail")));
    const details = document.createElement("details"); details.open = this.expanded;
    const summary = document.createElement("summary"); summary.textContent = t("duplicate.selection", { selected: formatNumber(this.selected.size), kept: formatNumber(check.entities.length - this.selected.size) });
    details.append(summary); details.addEventListener("toggle", () => { this.expanded = details.open; });
    details.append(paragraph(t("duplicate.scopeNote")), paragraph(t("duplicate.orderNote")));
    const actions = document.createElement("div"); actions.className = "duplicate-actions";
    for (const kind of ["same-layer", "cross-layer"] as const) {
      const eligible = check.candidates.filter((c) => c.kind === kind && !c.blocked);
      actions.append(button(t(kind === "same-layer" ? "duplicate.selectSame" : "duplicate.selectCross"), () => {
        eligible.forEach((c) => this.selected.add(c.entityId)); this.message = ""; this.refresh();
      }, eligible.length === 0));
    }
    actions.append(button(t("duplicate.clear"), () => { this.selected.clear(); this.message = ""; this.refresh(); }, this.selected.size === 0));
    details.append(actions);
    const label = document.createElement("label"); label.className = "duplicate-filter"; label.textContent = t("duplicate.filter");
    const filter = document.createElement("select");
    for (const value of ["all", "same-layer", "cross-layer"] as const) {
      const option = document.createElement("option"); option.value = value; option.textContent = t(`duplicate.${value}`); filter.append(option);
    }
    filter.value = this.filter; filter.addEventListener("change", () => { this.filter = filter.value; this.page = 0; this.refresh(); });
    label.append(filter); details.append(label);
    const candidates = check.candidates.filter((c) => this.filter === "all" || c.kind === this.filter);
    const pages = Math.max(1, Math.ceil(candidates.length / PAGE_SIZE)); this.page = Math.min(this.page, pages - 1);
    const entities = new Map(check.entities.map((e) => [e.id, e]));
    const wrap = document.createElement("div"); wrap.className = "duplicate-table-wrap";
    const table = document.createElement("table");
    const head = table.createTHead().insertRow();
    for (const key of ["remove", "kind", "type", "a", "b", "position"] as const) {
      const th = document.createElement("th"); th.scope = "col"; th.textContent = t(`duplicate.${key}`); head.append(th);
    }
    const body = table.createTBody();
    for (const candidate of candidates.slice(this.page * PAGE_SIZE, (this.page + 1) * PAGE_SIZE)) {
      const a = entities.get(this.keeperId(candidate))!; const b = entities.get(candidate.entityId)!;
      const row = body.insertRow(); row.classList.toggle("duplicate-selected", this.selected.has(b.id));
      const cell = row.insertCell(); const input = document.createElement("input"); input.type = "checkbox";
      input.dataset.duplicateId = b.id; input.checked = this.selected.has(b.id); input.disabled = candidate.blocked;
      input.setAttribute("aria-label", t("duplicate.checkbox", { handle: b.handle ?? b.id, layer: b.layer }));
      input.addEventListener("change", () => {
        if (input.checked) this.selected.add(b.id); else this.selected.delete(b.id);
        this.message = ""; this.refresh(); this.root.querySelector<HTMLInputElement>(`[data-duplicate-id="${b.id}"]`)?.focus();
      });
      cell.append(input);
      if (candidate.blocked) { const reason = document.createElement("small"); reason.textContent = t("duplicate.blocked"); cell.append(reason); }
      row.insertCell().textContent = t(`duplicate.${candidate.kind}`);
      row.insertCell().textContent = b.type;
      for (const entity of [a, b]) {
        const cell = row.insertCell(); const handle = document.createElement("code");
        handle.textContent = entity.handle ?? t("duplicate.noHandle", { id: entity.id });
        const layer = document.createElement("span"); layer.textContent = entity.layer; cell.append(handle, document.createElement("br"), layer);
      }
      row.insertCell().textContent = firstPoint(b)?.map((v) => formatNumber(v, 3)).join(" / ") ?? "–";
    }
    wrap.append(table); details.append(wrap);
    if (!candidates.length) details.append(paragraph(t("duplicate.none")));
    const pagination = document.createElement("div"); pagination.className = "duplicate-actions";
    pagination.append(button(t("duplicate.previous"), () => { this.page--; this.refresh(); }, this.page === 0),
      paragraph(t("duplicate.page", { page: this.page + 1, pages, count: formatNumber(candidates.length) })),
      button(t("duplicate.next"), () => { this.page++; this.refresh(); }, this.page >= pages - 1));
    details.append(pagination);
    details.append(paragraph(t("plan.pending")));
    const status = paragraph(this.message); status.setAttribute("role", "status"); this.root.append(details, status);
  }

  private keeperId(candidate: DxfDuplicateCandidate): string {
    const byId = this.candidatesById;
    let keeperId = candidate.keeperId;
    while (this.selected.has(keeperId) && byId.has(keeperId)) keeperId = byId.get(keeperId)!.keeperId;
    return keeperId;
  }
  private refresh() { if (this.dataset) this.render(this.dataset); this.changed(); }

}
function paragraph(text: string) { const p = document.createElement("p"); p.textContent = text; return p; }
function button(text: string, action: () => void, disabled = false) {
  const b = document.createElement("button"); b.type = "button"; b.className = "button"; b.textContent = text; b.disabled = disabled; b.addEventListener("click", action); return b;
}
function firstPoint(e: DxfSourceEntity): number[] | null {
  // POLYLINE header 10/20/30 is a dummy origin; use its first VERTEX instead.
  const start = e.type === "POLYLINE" ? e.tags.findIndex((t) => t.code === 0 && t.value.trim() === "VERTEX") : 0;
  if (start < 0) return null;
  const tags = e.tags.slice(start);
  const value = (code: number) => { const raw = tags.find((t) => t.code === code)?.value; return raw === undefined ? NaN : Number(raw); };
  const point = [value(10), value(20), value(30)]; if (!Number.isFinite(point[2])) point[2] = 0;
  return point.every(Number.isFinite) ? point : null;
}
function describe(e: DxfSourceEntity) { return { id: e.id, handle: e.handle, layer: e.layer, type: e.type, firstPoint: firstPoint(e) }; }
function baseName(name: string) { return name.replace(/^.*[\\/]/, "").replace(/\.[^.]+$/, ""); }
