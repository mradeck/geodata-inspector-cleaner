/** Effektiv dargestelltes Theme. */
export type Theme = "dark" | "light";
/** Nutzerwahl: „auto“ folgt prefers-color-scheme. */
export type ThemeMode = "auto" | "light" | "dark";

const STORAGE_KEY = "gic.theme";
const THEME_ORDER: readonly ThemeMode[] = ["auto", "light", "dark"];
const listeners = new Set<(theme: Theme, mode: ThemeMode) => void>();
let currentMode: ThemeMode = "auto";
let systemQuery: MediaQueryList | null = null;

/** Inline-SVG-Symbole wie in den übrigen öffentlichen Apps: Halbkreis, Sonne, Mond. */
export const THEME_ICONS: Record<ThemeMode, string> = {
  auto: '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/></svg>',
  light: '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>',
  dark: '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" fill="currentColor"/></svg>',
};

export function getThemeMode(): ThemeMode {
  return currentMode;
}

/** Effektives Theme (bei „auto“ aus der Systemeinstellung abgeleitet). */
export function getTheme(): Theme {
  return resolveTheme(currentMode, systemPrefersLight());
}

export function initTheme(): void {
  currentMode = readStoredMode();
  applyTheme();
  if (!systemQuery && typeof window.matchMedia === "function") {
    systemQuery = window.matchMedia("(prefers-color-scheme: light)");
    systemQuery.addEventListener?.("change", () => {
      if (currentMode !== "auto") return;
      applyTheme();
      notify();
    });
  }
}

export function setThemeMode(mode: ThemeMode): void {
  currentMode = mode;
  applyTheme();
  try { window.localStorage.setItem(STORAGE_KEY, mode); } catch { /* aktuelle Sitzung bleibt aktiv */ }
  notify();
}

/** Schaltet zyklisch automatisch → hell → dunkel → automatisch. */
export function cycleThemeMode(): ThemeMode {
  const next = nextThemeMode(currentMode);
  setThemeMode(next);
  return next;
}

export function nextThemeMode(mode: ThemeMode): ThemeMode {
  return THEME_ORDER[(THEME_ORDER.indexOf(mode) + 1) % THEME_ORDER.length]!;
}

export function onThemeChange(listener: (theme: Theme, mode: ThemeMode) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function normalizeStoredTheme(value: string | null): ThemeMode {
  return value === "dark" || value === "light" ? value : "auto";
}

export function resolveTheme(mode: ThemeMode, prefersLight: boolean): Theme {
  if (mode === "auto") return prefersLight ? "light" : "dark";
  return mode;
}

function notify(): void {
  const theme = getTheme();
  listeners.forEach((listener) => listener(theme, currentMode));
}

function systemPrefersLight(): boolean {
  try { return window.matchMedia("(prefers-color-scheme: light)").matches; } catch { return false; }
}

function readStoredMode(): ThemeMode {
  try { return normalizeStoredTheme(window.localStorage.getItem(STORAGE_KEY)); } catch { return "auto"; }
}

function applyTheme(): void {
  const theme = getTheme();
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.dataset.themeMode = currentMode;
  root.style.colorScheme = theme;
}
