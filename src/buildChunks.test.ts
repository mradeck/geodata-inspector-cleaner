// @vitest-environment node
import { describe, expect, it } from "vitest";
import { build, type Rollup } from "vite";
import { fileURLToPath } from "node:url";

/**
 * Regression 26.22.1: Im Produktions-Build zog der gemeinsame Markdown-Chunk
 * den main-Chunk nach (Rolldown-Laufzeit-Helfer lag dort). help.html und
 * concept.html starteten dadurch den App-Bootstrap und blieben leer
 * („Element #header-version fehlt.“). Die Nebenseiten dürfen den main-Chunk
 * weder statisch noch dynamisch erreichen.
 */
describe("Produktions-Build: Chunk-Trennung", () => {
  it("Hilfe- und Konzeptseite importieren den main-Chunk nicht", async () => {
    const root = fileURLToPath(new URL("..", import.meta.url));
    const result = await build({ root, logLevel: "silent", build: { write: false } });
    const outputs = (Array.isArray(result) ? result : [result]) as Rollup.RollupOutput[];
    const chunks = outputs.flatMap((output) => output.output).filter((item): item is Rollup.OutputChunk => item.type === "chunk");
    const byFile = new Map(chunks.map((chunk) => [chunk.fileName, chunk]));
    const mainChunk = chunks.find((chunk) => chunk.isEntry && chunk.name === "main");
    expect(mainChunk).toBeDefined();

    for (const entryName of ["help", "concept"]) {
      const entry = chunks.find((chunk) => chunk.isEntry && chunk.name === entryName);
      expect(entry, entryName).toBeDefined();
      const reachable = new Set<string>();
      const queue = [entry!.fileName];
      while (queue.length > 0) {
        const fileName = queue.pop()!;
        if (reachable.has(fileName)) continue;
        reachable.add(fileName);
        const chunk = byFile.get(fileName);
        if (chunk) queue.push(...chunk.imports, ...chunk.dynamicImports);
      }
      expect([...reachable], entryName).not.toContain(mainChunk!.fileName);
    }
  }, 60_000);
});
