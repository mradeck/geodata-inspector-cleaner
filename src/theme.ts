export type Theme = "dark" | "light";

const STORAGE_KEY = "gic.theme";
const listeners = new Set<(theme: Theme) => void>();
let currentTheme: Theme = "dark";

export function getTheme(): Theme {
  return currentTheme;
}

export function initTheme(): void {
  currentTheme = readStoredTheme();
  applyTheme(currentTheme);
}

export function setTheme(theme: Theme): void {
  currentTheme = theme;
  applyTheme(theme);
  try { window.localStorage.setItem(STORAGE_KEY, theme); } catch { /* aktuelle Sitzung bleibt aktiv */ }
  listeners.forEach((listener) => listener(theme));
}

export function toggleTheme(): Theme {
  const next = currentTheme === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}

export function onThemeChange(listener: (theme: Theme) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function normalizeStoredTheme(value: string | null): Theme {
  return value === "light" ? "light" : "dark";
}

function readStoredTheme(): Theme {
  try { return normalizeStoredTheme(window.localStorage.getItem(STORAGE_KEY)); } catch { return "dark"; }
}

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}
