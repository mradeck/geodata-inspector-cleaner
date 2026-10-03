import type { GeoDataset } from '../model';
import { t } from '../i18n';
import { canRepair, type SingleVertexAction } from './singleVertexPolyline';

export class SingleVertexPanel {
  private dataset: GeoDataset | null = null;
  private actions = new Map<string, SingleVertexAction>();
  constructor(private root: HTMLElement, private changed: () => void) {}
  selection() { return new Map(this.actions); }
  stats() {
    const findings = this.dataset?.singleVertexPolylines?.findings ?? [];
    return { detected: findings.length, eligible: findings.filter(canRepair).length,
      converted: [...this.actions.values()].filter(a=>a==='convert').length,
      deleted: [...this.actions.values()].filter(a=>a==='delete').length };
  }
  setAll(action: SingleVertexAction) {
    for (const f of this.dataset?.singleVertexPolylines?.findings ?? []) if (canRepair(f)) this.actions.set(f.id,action);
    this.refresh();
  }
  report() {
    const check = this.dataset?.singleVertexPolylines;
    return check ? { error: check.error, findings: check.findings.map(f => ({ ...f, selected: this.actions.get(f.id) !== 'keep' && this.actions.has(f.id), action: this.actions.get(f.id) ?? 'keep' })) } : null;
  }
  render(dataset: GeoDataset): void {
    if (this.dataset !== dataset) {
      this.dataset = dataset;
      this.actions = new Map((dataset.singleVertexPolylines?.findings ?? []).filter(canRepair).map(f=>[f.id,'convert']));
    }
    const check = dataset.singleVertexPolylines;
    this.root.replaceChildren(); this.root.hidden = !check;
    if (!check) return;
    const title = document.createElement('h3'); title.id = 'single-vertex-title'; title.textContent = t('repair.title'); this.root.append(title);
    if (check.error) { this.root.append(p(t(`repair.error.${check.error}`))); return; }
    const stats = this.stats();
    this.root.append(p(t('repair.summary', {count:stats.detected,eligible:stats.eligible,selected:stats.converted+stats.deleted})), p(t('repair.explanation')));
    if (!check.findings.length) return;
    const wrap=document.createElement('div'); wrap.className='duplicate-table-wrap';
    const table=document.createElement('table'); const head=table.createTHead().insertRow();
    for(const key of ['action','entity','xyz','copies','status'] as const){const th=document.createElement('th'); th.scope='col';th.textContent=t(`repair.${key}`);head.append(th);}
    const body=table.createTBody();
    for(const f of check.findings){
      const row=body.insertRow(); const input=document.createElement('select'); input.className='repair-select'; input.disabled=!canRepair(f);
      input.setAttribute('aria-label',t('repair.actionFor',{handle:f.handle??f.id,layer:f.layer}));
      for(const action of ['convert','delete','keep'] as const){const option=document.createElement('option');option.value=action;option.textContent=t(`repair.${action}`);input.append(option);}
      input.value=this.actions.get(f.id)??'keep';
      input.addEventListener('change',()=>{this.actions.set(f.id,input.value as SingleVertexAction);this.refresh();});row.insertCell().append(input);
      row.insertCell().textContent=`${f.handle??f.id} · ${f.layer}`;
      row.insertCell().textContent=f.xyz?.join(' / ')??'–';
      row.insertCell().textContent=f.pointCopies.map(p=>`${p.handle??p.id} · ${p.layer}`).join('; ')||'–';
      row.insertCell().textContent=canRepair(f)?t('repair.convertReady'):t(`repair.block.${f.blocked!}`);
    }
    wrap.append(table);this.root.append(wrap,p(t('repair.separate')));
  }
  private refresh(){if(this.dataset)this.render(this.dataset);this.changed();}
}
function p(text:string){const p=document.createElement('p');p.textContent=text;return p;}
