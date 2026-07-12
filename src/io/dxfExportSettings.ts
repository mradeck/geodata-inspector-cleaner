import type { DxfAcadVersion } from "./dxfNormalizedExporter";

const STORAGE_KEY = "gic.dxfAcadVersion";

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** AC1015 bleibt wie im Pointcloud-Manager der OEM-kompatible Default. */
export function getDxfAcadVersion(storage: StorageLike | null = browserStorage()): DxfAcadVersion {
  try {
    return storage?.getItem(STORAGE_KEY) === "AC1032" ? "AC1032" : "AC1015";
  } catch {
    return "AC1015";
  }
}

export function setDxfAcadVersion(version: DxfAcadVersion, storage: StorageLike | null = browserStorage()): void {
  try {
    if (version === "AC1032") storage?.setItem(STORAGE_KEY, version);
    else storage?.removeItem(STORAGE_KEY);
  } catch {
    // Gesperrter Storage darf den Export nicht verhindern.
  }
}

function browserStorage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}
