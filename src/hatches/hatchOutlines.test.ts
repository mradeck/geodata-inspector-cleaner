import { createCleanedExport } from "../io/exportCleaned";
import { inspectDataset } from "../analysis/inspectDataset";
import { describe, expect, it } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { createDuplicateExport, inspectDxfDuplicates } from "../duplicates/dxfDuplicates";
import { parseDxf } from "../io/parseDxf";
import { createHatchOutlineExport, inspectHatchOutlines } from "./hatchOutlines";
import { readHatchGeometry, toWorld } from "./hatchBoundaries";

const tags = (...values: Array<string | number>) => values.join("\n") + "\n";
const file = (entities: string) => tags(0,"SECTION",2,"HEADER",9,"$ACADVER",1,"AC1032",9,"$HANDSEED",5,"100",0,"ENDSEC",0,"SECTION",2,"ENTITIES") + entities + tags(0,"ENDSEC",0,"EOF");
const hatch = (paths: string, count = 1, extra = "") => tags(0,"HATCH",5,"A0",330,"1F",100,"AcDbEntity",8,"Pflanzflächen",100,"AcDbHatch",10,0,20,0,30,7) + extra + tags(91,count) + paths + tags(75,0,76,1,98,1,10,-10000000,20,-10000000);
const line = (x: number, y: number, u: number, v: number) => tags(72,1,10,x,20,y,11,u,21,v);
const rectangle = (x = 0, y = 0, size = 10, flags = 1) => tags(92,flags,93,4) + line(x,y,x+size,y) + line(x+size,y,x+size,y+size) + line(x+size,y+size,x,y+size) + line(x,y+size,x,y) + tags(97,0);
const read = (source: string) => inspectDxfDuplicates(source);

describe("HATCH outlines", () => {
  it("creates one closed outline per boundary, including inner rings, while preserving original source entities", () => {
    const source = file(hatch(rectangle() + rectangle(2,2,2,16),2));
    const check = inspectHatchOutlines(read(source));
    expect(check.skipped).toEqual([]); expect(check.outlines).toHaveLength(2);
    const output = createHatchOutlineExport(read(source));
    const entities = read(output.content).entities;
    expect(entities.map((e) => e.type)).toEqual(["HATCH","LWPOLYLINE","LWPOLYLINE"]);
    expect(entities[0]!.tags).toEqual(read(source).entities[0]!.tags);
    expect(entities.slice(1).every((e) => e.layer === "Pflanzflächen" && e.tags.some((t) => t.code === 70 && t.value === "1"))).toBe(true);
    expect(output.created.map((c) => c.handle)).toEqual(["101","102"]);
    expect(output.content).toContain('$HANDSEED\n5\n103\n');
    expect(parseDxf(output.content, 'test.dxf').features).toHaveLength(3);
  });
  it("uses neither the HATCH origin nor seed points as preview vertices", () => {
    const dataset = parseDxf(file(hatch(rectangle(100,200))), 'test.dxf');
    expect(dataset.features[0]!.points).toEqual([{x:100,y:200,z:7},{x:110,y:200,z:7},{x:110,y:210,z:7},{x:100,y:210,z:7}]);
  });
  it("preserves polyline bulges, closure, layer and the hatch plane", () => {
    const path = tags(92,2,72,1,73,1,93,2,10,0,20,0,42,1,10,10,20,0,42,1,97,0);
    const source = file(hatch(path,1,tags(210,0,220,1,230,0)));
    const output = createHatchOutlineExport(read(source));
    const generated = read(output.content).entities[1]!;
    expect(generated.tags.filter((t) => t.code === 42).map((t) => t.value)).toEqual(['1','1']);
    const feature = parseDxf(output.content,'curves.dxf').features[1]!;
    expect(feature.kind).toBe('polygon'); expect(feature.points.length).toBeGreaterThan(20);
    expect(feature.points.every((p) => p.y === 7)).toBe(true);
    expect(toWorld({x:1,y:2,bulge:0},7,[0,1,0])).toEqual({x:-1,y:7,z:2});
  });
  it.each([1,0])("retains circular arc orientation (CCW flag %i) as exact bulges", (ccw) => {
    // Upper semicircle: CCW 0→180, CW DXF complementary 180→360.
    const arc = tags(72,2,10,0,20,0,40,5,50,ccw ? 0 : 180,51,ccw ? 180 : 360,73,ccw);
    const path = tags(92,1,93,2) + arc + (ccw ? line(-5,0,5,0) : line(5,0,-5,0)) + tags(97,0);
    const o = inspectHatchOutlines(read(file(hatch(path))));
    expect(o.skipped).toEqual([]);
    expect(o.outlines[0]!.boundary.vertices[0]!.bulge).toBeCloseTo(ccw ? 1 : -1);
    expect(o.outlines[0]!.boundary.approximated).toBe(false);
  });
  it("exports a full circle as two native semicircular segments", () => {
    const path = tags(92,1,93,1,72,2,10,0,20,0,40,5,50,0,51,360,73,1,97,0);
    const output = createHatchOutlineExport(read(file(hatch(path))));
    expect(output.created[0]!.vertices).toBe(2);
    expect(parseDxf(output.content,'circle.dxf').features[1]!.kind).toBe('polygon');
  });
  it("segments elliptical boundaries and reports the approximation", () => {
    const path = tags(92,1,93,1,72,3,10,0,20,0,11,10,21,0,40,0.5,50,0,51,360,73,1,97,0);
    const o = inspectHatchOutlines(read(file(hatch(path))));
    expect(o.skipped).toEqual([]);
    const b = o.outlines[0]!.boundary;
    expect(b.approximated).toBe(true); expect(b.vertices.length).toBeGreaterThan(100);
    for (const p of b.vertices) expect((p.x / 10) ** 2 + (p.y / 5) ** 2).toBeCloseTo(1, 10);
  });
  it("reads interleaved rational spline weights and joins to the closing edge", () => {
    // Rational quadratic quarter circle followed by two lines back to start.
    const spline = tags(72,4,94,2,73,1,74,0,95,6,96,3,40,0,40,0,40,0,40,1,40,1,40,1,10,1,20,0,42,1,10,1,20,1,42,Math.SQRT1_2,10,0,20,1,42,1,97,0);
    const path = tags(92,1,93,3) + spline + line(0,1,0,0) + line(0,0,1,0) + tags(97,0);
    const o = inspectHatchOutlines(read(file(hatch(path))));
    expect(o.skipped).toEqual([]);
    const b = o.outlines[0]!.boundary;
    expect(b.approximated).toBe(true);
    for (const p of b.vertices.slice(0,-1)) expect(p.x ** 2 + p.y ** 2).toBeCloseTo(1, 8);
  });
  it("does not duplicate outlines on repeated use or after reimport", () => {
    const output = createHatchOutlineExport(read(file(hatch(rectangle()))));
    const next = inspectHatchOutlines(read(output.content));
    expect(next.outlines).toHaveLength(1); expect(next.outlines[0]!.exists).toBe(true);
    expect(() => createHatchOutlineExport(read(output.content))).toThrow('no-outlines');
  });
  it("skips the entire hatch if a boundary is open or malformed, never creates a partial hole set", () => {
    const open = rectangle().replace(line(0,10,0,0),line(0,10,0,1));
    const result = inspectHatchOutlines(read(file(hatch(rectangle() + open,2))));
    expect(result.outlines).toHaveLength(0); expect(result.skipped[0]?.reason).toBe('open');
  });
  it("preserves paper-space ownership, CRLF and unknown objects", () => {
    const original = file(hatch(rectangle()).replace('330\n1F\n','102\n{ACAD_REACTORS\n330\nFFFF\n102\n}\n330\n2F\n').replace('8\nPflanzflächen\n','67\n1\n8\nPflanzflächen\n410\nLayout1\n') + tags(0,'CUSTOM',5,'B0',1,'keep me')).replaceAll('\n','\r\n');
    const output = createHatchOutlineExport(read(original));
    const last = read(output.content).entities.at(-1)!;
    expect(last.tags.find((t) => t.code === 330)?.value).toBe('2F');
    expect(last.tags.find((t) => t.code === 67)?.value).toBe('1');
    expect(last.tags.find((t) => t.code === 410)?.value).toBe('Layout1');
    expect(output.content).not.toMatch(/[^\r]\n/);
  });
});

it.skipIf(!process.env.HATCH_FIXTURE)('covers all 35 boundaries with 33 unique outlines from the 34 private sample hatches', () => {
  const source = readFileSync(process.env.HATCH_FIXTURE!, 'utf8');
  const output = createHatchOutlineExport(read(source));
  expect(output.hatchCount).toBe(34); expect(output.created).toHaveLength(33); expect(output.existingCount).toBe(2); expect(output.skipped).toEqual([]);
  expect(new Set(output.created.map((o) => o.layer))).toEqual(new Set(['_G-0000-SHRA-BODEND-PT']));
  const dataset = parseDxf(output.content,'sample.dxf');
  expect(dataset.features).toHaveLength(96); // Includes paper-space title-block attributes.
  expect(dataset.features.filter((f) => f.layer === '_G-0000-SHRA-BODEND-PT')).toHaveLength(67);
  expect(read(output.content).entities).toHaveLength(71); // INSERT + attributes count as one source entity.
  if (process.env.HATCH_TEST_OUTPUT) writeFileSync(process.env.HATCH_TEST_OUTPUT,output.content);
});

it.skipIf(!process.env.HATCH_FIXTURE)('allows the two original hatch duplicates to be removed without an outline roundtrip', () => {
  const original = read(readFileSync(process.env.HATCH_FIXTURE!, 'utf8'));
  expect(original.candidates).toHaveLength(2);
  expect(original.candidates.every((c) => !c.blocked)).toBe(true);
  const output = createDuplicateExport(original, new Set(original.candidates.map((c) => c.entityId)));
  expect(output.removedReferenceCount).toBe(2);
  expect(read(output.content).candidates).toHaveLength(0);
  expect(inspectHatchOutlines(read(output.content)).outlines.filter((o) => !o.exists)).toHaveLength(33);
  const withOutlines = read(createHatchOutlineExport(original).content);
  expect(withOutlines.candidates.every((c) => !c.blocked)).toBe(true);
});

it.skipIf(!process.env.HATCH_FIXTURE)('exports 33 contours, not 67, when cleaning hatches together with generated outlines', () => {
  const source = read(readFileSync(process.env.HATCH_FIXTURE!, 'utf8'));
  const dataset = parseDxf(createHatchOutlineExport(source).content, 'sample-umrisse.dxf');
  const firstHatch = dataset.features.find((f) => f.sourceType === 'HATCH')!;
  const report = inspectDataset(dataset, { clusterDistanceMeters: 1000 }, { preferredPrimaryFeatureId: firstHatch.id });
  const output = createCleanedExport(dataset, report);
  expect(output.keptFeatureCount).toBe(33);
  expect(output.coveredHatchFeatureCount).toBe(34);
  expect(output.spatialRemovedFeatureCount).toBe(29);
  expect(output.filterRemovedFeatureCount).toBe(0);
  expect(output.removedFeatureCount).toBe(63);
  const cleaned = read(output.content);
  expect(cleaned.entities).toHaveLength(33);
  expect(cleaned.candidates).toHaveLength(0);
  if (process.env.HATCH_CLEAN_OUTPUT) writeFileSync(process.env.HATCH_CLEAN_OUTPUT, output.content);
});
