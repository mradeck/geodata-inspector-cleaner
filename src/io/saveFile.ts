import { t } from "../i18n";

interface Writable { write(data: string): Promise<void>; close(): Promise<void>; abort(): Promise<void> }
export type SavePicker = (options: { suggestedName: string }) => Promise<{ createWritable(): Promise<Writable> }>;

export async function saveWithPicker(picker: SavePicker, name: string, content: string): Promise<boolean> {
  let handle;
  try { handle = await picker({ suggestedName: name }); }
  catch (error) { if (error instanceof Error && error.name === "AbortError") return false; throw error; }
  const stream = await handle.createWritable();
  try { await stream.write(content); await stream.close(); }
  catch (error) { try { await stream.abort(); } catch { /* preserve the original failure */ } throw error; }
  return true;
}

/** A fresh explicit click also guarantees user activation after expensive export generation.
 * No stored file handle or silent fallback: every file gets its own destination choice. */
export function saveTextFile(name: string, content: string, mime: string): Promise<boolean> {
  const picker = (window as Window & { showSaveFilePicker?: SavePicker }).showSaveFilePicker;
  if (picker) return saveWithPicker(picker.bind(window), name, content).catch(() => saveDialog(name, content, mime, true));
  return saveDialog(name, content, mime);
}

function saveDialog(name: string, content: string, mime: string, failed = false): Promise<boolean> {
  return new Promise((resolve) => {
    const picker = (window as Window & { showSaveFilePicker?: SavePicker }).showSaveFilePicker;
    const dialog = document.createElement("dialog"); dialog.className = "save-file-dialog";
    dialog.setAttribute("aria-labelledby", "save-file-title");
    const title = document.createElement("h2"); title.id = "save-file-title"; title.textContent = t("save.title");
    const filename = document.createElement("p"); filename.textContent = name; filename.className = "save-file-name";
    const hint = document.createElement("p"); hint.textContent = t(picker ? "save.chooseHint" : "save.unsupported");
    const status = document.createElement("p"); status.setAttribute("role", "status"); if (failed) status.textContent = t("save.failed");
    const save = document.createElement("button"); save.className = "button";
    save.textContent = t(picker ? "save.choose" : "save.download");
    const cancel = document.createElement("button"); cancel.className = "button"; cancel.textContent = t("save.cancel");
    let writing = false;
    const finish = (saved: boolean) => { dialog.close(); dialog.remove(); resolve(saved); };
    cancel.addEventListener("click", () => finish(false));
    dialog.addEventListener("cancel", (event) => { event.preventDefault(); if (!writing) finish(false); });
    save.addEventListener("click", async () => {
      if (writing) return;
      writing = true; save.disabled = true; cancel.disabled = true; status.textContent = "";
      try {
        if (picker) {
          const saved = await saveWithPicker(picker.bind(window), name, content);
          if (saved) { finish(true); return; }
        } else {
          const url = URL.createObjectURL(new Blob([content], { type: mime }));
          const anchor = document.createElement("a"); anchor.href = url; anchor.download = name;
          document.body.append(anchor); anchor.click(); anchor.remove();
          setTimeout(() => URL.revokeObjectURL(url), 60_000);
          finish(true); return;
        }
      } catch { status.textContent = t("save.failed"); }
      writing = false; save.disabled = false; cancel.disabled = false;
    });
    dialog.append(title, filename, hint, save, cancel, status);
    document.body.append(dialog); dialog.showModal(); save.focus();
  });
}
