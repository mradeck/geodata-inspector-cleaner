import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");
const documentStyles = readFileSync(new URL("./concept.css", import.meta.url), "utf8");

describe("Viewport-gebundene Startansicht", () => {
  it("hält die App-Hülle in der Browserhöhe und scrollt Inhalte intern", () => {
    expect(styles).toContain("body { margin: 0; min-width: 1180px; height: 100vh; min-height: 0; overflow: hidden;");
    expect(styles).toContain(".app-shell { height: 100vh; min-height: 0; overflow: hidden;");
    expect(styles).toContain(".stage { min-width: 0; overflow: auto; display: flex; flex-direction: column;");
  });

  it("behält lange Dokumentseiten scrollbar und definiert Raster für beide Themes", () => {
    expect(documentStyles).toContain("overflow: auto;");
    expect(styles.match(/--empty-grid-line:/g)).toHaveLength(2);
    expect(styles).toContain("var(--empty-grid-line)");
  });
});
