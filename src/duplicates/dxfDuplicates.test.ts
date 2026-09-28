import { summarizeLayers } from "../analysis/layerFilter";
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { inspectDxfDuplicates, duplicateCounts, createDuplicateExport } from "./dxfDuplicates";
import { parseDxf } from "../io/parseDxf";
import { inspectDataset } from "../analysis/inspectDataset";
import { readDataset } from "../io/readDataset";

const file = (entities: string, tail = "") => `0\nSECTION\n2\nHEADER\n999\nCRS EPSG:25832\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n${entities}0\nENDSEC\n${tail}0\nEOF\n`;
const line = (handle: string, layer = "A", z = "3", extra = "") => `0\nLINE\n5\n${handle}\n8\n${layer}\n10\n1\n20\n2\n30\n${z}\n11\n4\n21\n5\n31\n6\n${extra}`;
const poly = (handle: string, secondX = "4", closed = "9") => `0\nPOLYLINE\n5\n${handle}\n8\nA\n66\n1\n70\n${closed}\n0\nVERTEX\n5\n${handle}1\n330\n${handle}\n8\nA\n10\n1\n20\n2\n30\n3\n0\nVERTEX\n5\n${handle}2\n330\n${handle}\n8\nA\n10\n${secondX}\n20\n5\n30\n6\n0\nSEQEND\n5\n${handle}3\n330\n${handle}\n`;

describe("exact DXF duplicate check and source-preserving export", () => {
  it("separates same-layer copies from additional cross-layer copies without double counting", () => {
    const check = inspectDxfDuplicates(file(line("10") + line("11") + line("12", "B") + line("13", "B") + line("14", "C")));
    expect(check.error).toBeNull();
    expect(duplicateCounts(check)).toEqual({ sameLayer: 2, crossLayer: 2 });
    expect(new Set(check.candidates.map((c) => c.entityId)).size).toBe(4);
    const same = createDuplicateExport(check, new Set(check.candidates.filter((c) => c.kind === "same-layer").map((c) => c.entityId)));
    expect(same.keptCount).toBe(3);
    expect(duplicateCounts(inspectDxfDuplicates(same.content))).toEqual({ sameLayer: 0, crossLayer: 2 });
    const all = createDuplicateExport(check, new Set(check.candidates.map((c) => c.entityId)));
    expect(all.keptCount).toBe(1);
    expect(all.content).toBe(file(line("10")));
    expect(inspectDxfDuplicates(all.content).candidates).toHaveLength(0);
  });

  it("keeps tiny differences in Z, style, coordinate spelling and vertex order", () => {
    const check = inspectDxfDuplicates(file(line("10") + line("11", "A", "3.000000001") + line("12", "A", "3.0") + line("13", "A", "3", "62\n1\n") + line("14").replace("10\n1", "10\n4").replace("11\n4", "11\n1")));
    expect(check.candidates).toHaveLength(0);
  });

  it("compares and removes complete POLYLINE/VERTEX/SEQEND sequences including owner links", () => {
    const source = file(poly("A0") + poly("B0") + poly("C0", "4.001") + poly("D0", "4", "8"));
    const check = inspectDxfDuplicates(source);
    expect(check.entities).toHaveLength(4); expect(check.candidates).toHaveLength(1);
    expect(check.candidates[0]?.blocked).toBe(false);
    const output = createDuplicateExport(check, new Set([check.candidates[0]!.entityId]));
    expect(output.content).toBe(file(poly("A0") + poly("C0", "4.001") + poly("D0", "4", "8")));
  });

  it("does not merge text anchors with different text or INSERTs with different attributes", () => {
    const text = (h: string, value: string) => `0\nTEXT\n5\n${h}\n8\nA\n10\n1\n20\n2\n1\n${value}\n`;
    const insert = (h: string, value: string) => `0\nINSERT\n5\n${h}\n8\nA\n2\nBlock\n66\n1\n10\n1\n20\n2\n0\nATTRIB\n5\n${h}1\n1\n${value}\n0\nSEQEND\n5\n${h}2\n`;
    const check = inspectDxfDuplicates(file(text("A", "one") + text("B", "two") + insert("C", "one") + insert("D", "two") + insert("E", "one")));
    expect(check.entities).toHaveLength(5); expect(check.candidates).toHaveLength(1);
    expect(createDuplicateExport(check, new Set([check.candidates[0]!.entityId])).content).toBe(file(text("A", "one") + text("B", "two") + insert("C", "one") + insert("D", "two")));
  });

  it("preserves unsupported entities, comments, UTF-8 BOM, whitespace and CRLF byte-for-byte", async () => {
    const unknown = "0\nCUSTOM\n5\nC0\n1\n  Grüße  \n";
    const source = "\ufeff" + file(line("A0") + line("B0") + unknown).replaceAll("\n", "\r\n");
    const dataset = await readDataset(new File([source], "test.dxf"));
    expect(dataset.dxfDuplicates?.source).toBe(source);
    const output = createDuplicateExport(dataset.dxfDuplicates!, new Set(["entity-2"]));
    expect(output.content).toBe("\ufeff" + file(line("A0") + unknown).replaceAll("\n", "\r\n"));
    expect(new TextEncoder().encode(output.content)).toEqual(new TextEncoder().encode(source.replace(line("B0").replaceAll("\n", "\r\n"), "")));
  });

  it("retains the existing GeoJSON BOM handling", async () => {
    const source = '\ufeff{"type":"FeatureCollection","features":[]}';
    const dataset = await readDataset(new File([source], "test.geojson"));
    expect(dataset.format).toBe("geojson");
    expect(dataset.dxfDuplicates).toBeUndefined();
  });

  it("supports an individually selected copy and rejects first originals, unknown and empty selections", () => {
    const check = inspectDxfDuplicates(file(line("A") + line("B") + line("C")));
    expect(createDuplicateExport(check, new Set(["entity-3"])).content).toBe(file(line("A") + line("B")));
    for (const ids of [[], ["entity-1"], ["missing"]]) expect(() => createDuplicateExport(check, new Set(ids))).toThrow();
  });

  it.each([350, 340, 1005, 390])("blocks deletion of externally referenced handles (code %i)", (code) => {
    const tail = `0\nSECTION\n2\nOBJECTS\n0\nDICTIONARY\n5\nF0\n${code}\nB0\n0\nENDSEC\n`;
    const check = inspectDxfDuplicates(file(line("A0") + line("B0"), tail));
    expect(check.candidates[0]?.blocked).toBe(true);
    expect(() => createDuplicateExport(check, new Set(["entity-2"]))).toThrow();
  });

  it("removes only IDBUFFER member pointers with selected duplicates, preserving owner and unrelated members", () => {
    const tail = "0\nSECTION\n2\nOBJECTS\n0\nIDBUFFER\n5\nF0\n330\nFF\n100\nAcDbIdBuffer\n330\nB0\n330\nA0\n330\nB0\n0\nENDSEC\n";
    const check = inspectDxfDuplicates(file(line("A0") + line("B0"), tail));
    expect(check.candidates[0]?.blocked).toBe(false);
    const out = createDuplicateExport(check, new Set(["entity-2"]));
    expect(out.removedReferenceCount).toBe(2);
    expect(out.content).toBe(file(line("A0"), tail.replaceAll("330\nB0\n", "")));
  });
  it.each([
    "0\nIDBUFFER\n330\nB0\n100\nAcDbIdBuffer\n",
    "0\nIDBUFFER\n100\nAcDbIdBuffer\n102\n{ACAD_REACTORS\n330\nB0\n102\n}\n",
    "0\nXRECORD\n100\nAcDbIdBuffer\n330\nB0\n",
    "0\nIDBUFFER\n100\nAcDbIdBuffer\n100\nCustomSubclass\n330\nB0\n",
  ])("keeps owners, reactors and unknown pointer contexts protected", (object) => {
    const check = inspectDxfDuplicates(file(line("A0") + line("B0"), `0\nSECTION\n2\nOBJECTS\n${object}0\nENDSEC\n`));
    expect(check.candidates[0]?.blocked).toBe(true);
  });

  it("blocks duplicate handle identities and referenced child handles", () => {
    const check = inspectDxfDuplicates(file(poly("A0") + poly("B0"), "0\nSECTION\n2\nOBJECTS\n0\nXRECORD\n340\nB01\n0\nENDSEC\n"));
    expect(check.candidates[0]?.blocked).toBe(true);
    const ambiguous = inspectDxfDuplicates(file(line("A") + line("A")));
    expect(ambiguous.candidates[0]?.blocked).toBe(true);
  });

  it("rejects incomplete compound structures and unsafe decoding without deleting anything", () => {
    for (const source of [file(poly("A")).replace("0\nSEQEND\n", "0\nLINE\n"), "0\nSECTION\n2", file(line("A")).replace("0\nENDSEC\n0\nEOF\n", ""), file(line("A", "\ufffd"))]) {
      const check = inspectDxfDuplicates(source);
      expect(check.error).not.toBeNull();
      expect(() => createDuplicateExport(check, new Set(["entity-2"]))).toThrow();
    }
  });

  it("adds an automatic finding without silently adding removals to the spatial cleaner", () => {
    const dataset = parseDxf(file(line("A") + line("B")), "test.dxf");
    const report = inspectDataset(dataset);
    expect(report.findings.find((f) => f.category === "dxf-duplicates")?.recommendation).toBe("review");
    expect(report.recommendedRemovalIds.size).toBe(0);
    expect(dataset.features).toHaveLength(2);
  });

  it("distinguishes model space / paper space and external owners", () => {
    expect(inspectDxfDuplicates(file(line("A", "A", "3", "67\n0\n") + line("B", "A", "3", "67\n1\n"))).candidates).toHaveLength(0);
    expect(inspectDxfDuplicates(file(line("A", "A", "3", "330\nFF\n") + line("B", "A", "3", "330\nEE\n"))).candidates).toHaveLength(0);
  });
});

// Opt-in local regression: never copy private survey data into the repository.
it.skipIf(!process.env.DXF_DUPLICATE_FIXTURE)("reproduces the 1285 → 638 → 608 HBF cleanup", () => {
  const source = readFileSync(process.env.DXF_DUPLICATE_FIXTURE!, "utf8");
  const check = inspectDxfDuplicates(source);
  expect(check.error).toBeNull(); expect(check.entities).toHaveLength(1285);
  expect(duplicateCounts(check)).toEqual({ sameLayer: 647, crossLayer: 30 });
  expect(check.candidates.filter((c) => c.blocked)).toHaveLength(0);
  const exact = createDuplicateExport(check, new Set(check.candidates.filter((c) => c.kind === "same-layer").map((c) => c.entityId)));
  expect(exact.keptCount).toBe(638);
  const working = parseDxf(exact.content, "working.dxf");
  const workingReport = inspectDataset(working);
  expect(working.features).toHaveLength(638);
  expect(workingReport.clusters.reduce((n, c) => n + c.featureCount, 0)).toBe(638);
  expect(summarizeLayers(working).reduce((n, layer) => n + Object.values(layer.counts).reduce((a, b) => a + b, 0), 0)).toBe(638);
  expect(duplicateCounts(working.dxfDuplicates!)).toEqual({ sameLayer: 0, crossLayer: 30 });
  const secondPass = createDuplicateExport(working.dxfDuplicates!, new Set(working.dxfDuplicates!.candidates.map((c) => c.entityId)));
  expect(secondPass.keptCount).toBe(608);
  expect(inspectDataset(parseDxf(secondPass.content, "final.dxf")).dataset.features).toHaveLength(608);
  const all = createDuplicateExport(check, new Set(check.candidates.map((c) => c.entityId)));
  expect(all.keptCount).toBe(608);
  expect(parseDxf(all.content, "clean.dxf").features).toHaveLength(608);
  expect(inspectDxfDuplicates(all.content).candidates).toHaveLength(0);
});
