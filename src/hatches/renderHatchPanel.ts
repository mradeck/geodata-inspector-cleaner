import { formatNumber, t } from "../i18n";
import type { GeoDataset } from "../model";
import { inspectHatchOutlines, type HatchOutlineCheck } from "./hatchOutlines";

export class HatchPanel {
  private dataset: GeoDataset | null = null;
  private check: HatchOutlineCheck | null = null;
  private enabled = false;
  constructor(private readonly root: HTMLElement, private readonly changed: () => void) {}
  active(): boolean { return this.enabled; }

  stats() { return { detected: this.check?.hatchCount ?? 0, available: Boolean(this.check && !this.check.error && this.check.outlines.some((o) => !o.exists)) }; }
  setActive(enabled: boolean): void {
    this.enabled = enabled && this.stats().available;
    if (this.dataset) this.render(this.dataset);
    this.changed();
  }
  report() {
    return this.check ? { ...this.check, enabled: this.enabled, outlines: this.check.outlines.map((o) => ({
      sourceHandle: o.sourceHandle, layer: o.layer, path: o.pathIndex + 1,
      vertices: o.boundary.vertices.length, approximated: o.boundary.approximated, exists: o.exists,
    })) } : null;
  }
  render(dataset: GeoDataset): void {
    if (dataset !== this.dataset) {
      this.dataset = dataset;
      this.check = dataset.dxfDuplicates ? inspectHatchOutlines(dataset.dxfDuplicates) : null;
      this.enabled = Boolean(this.check && !this.check.error && this.check.outlines.some((o) => !o.exists));
    }
    this.root.replaceChildren();
    this.root.hidden = !this.check || (!this.check.hatchCount && !this.check.error);
    if (this.root.hidden || !this.check) return;
    const title = document.createElement("h3"); title.id = "hatch-title"; title.textContent = t("hatch.title");
    this.root.append(title);
    if (this.check.error) { this.root.append(p(t("hatch.unavailable"))); return; }
    const pending = this.check.outlines.filter((o) => !o.exists);
    this.root.append(p(t("hatch.summary", { hatches: formatNumber(this.check.hatchCount), outlines: formatNumber(pending.length), existing: formatNumber(this.check.outlines.filter((o) => o.exists).length) })), p(t("hatch.detail")));
    const approximate = pending.filter((o) => o.boundary.approximated).length;
    if (approximate) this.root.append(p(t("hatch.approximate", { count: approximate })));
    const list = document.createElement("details");
    const summary = document.createElement("summary"); summary.textContent = t("hatch.list"); list.append(summary);
    const wrap = document.createElement("div"); wrap.className = "duplicate-table-wrap";
    const table = document.createElement("table"); const head = table.createTHead().insertRow();
    for (const key of ["handle", "layer", "path", "vertices", "status"] as const) { const cell = document.createElement("th"); cell.scope = "col"; cell.textContent = t(`hatch.${key}`); head.append(cell); }
    const body = table.createTBody();
    for (const o of this.check.outlines) {
      const row = body.insertRow();
      for (const text of [o.sourceHandle ?? o.sourceId, o.layer, String(o.pathIndex + 1), String(o.boundary.vertices.length), t(o.exists ? "hatch.existing" : o.boundary.approximated ? "hatch.segmented" : "hatch.exact")]) row.insertCell().textContent = text;
    }
    for (const issue of this.check.skipped) {
      const row = body.insertRow();
      for (const text of [issue.handle ?? "–", issue.layer, "–", "–", t(`hatch.reason.${issue.reason}`)]) row.insertCell().textContent = text;
    }
    wrap.append(table); list.append(wrap); this.root.append(list);
    if (this.check.skipped.length) this.root.append(p(t("hatch.skipped", { count: this.check.skipped.length })));
    const label = document.createElement("label");
    const action = document.createElement("input"); action.type = "checkbox"; action.checked = this.enabled;
    action.disabled = !pending.length;
    label.append(action, document.createTextNode(t("plan.hatches")));
    action.addEventListener("change", () => { this.enabled = action.checked; this.changed(); });
    this.root.append(label, p(t("plan.pending")), p(t("plan.hatchNote")));
  }
}
function p(text: string) { const el = document.createElement("p"); el.textContent = text; return el; }
