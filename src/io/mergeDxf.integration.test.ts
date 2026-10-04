import { it, expect } from "vitest";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { mergeDxf } from "./mergeDxf";
import { parseDxf } from "./parseDxf";
it.skipIf(!process.env.DXF_MERGE_TEST_DIR)("merges externally generated native CAD fixtures for independent validation",async()=>{
 const dir=process.env.DXF_MERGE_TEST_DIR!;
 const a=await readFile(join(dir,'day1.dxf'),'utf8'), b=await readFile(join(dir,'day2.dxf'),'utf8');
 const out=mergeDxf(a,b);
 expect(parseDxf(out,'combined.dxf').dxfDuplicates!.entities.length).toBe(parseDxf(a,'a.dxf').dxfDuplicates!.entities.length+parseDxf(b,'b.dxf').dxfDuplicates!.entities.length);
 await writeFile(join(dir,'combined.dxf'),out);
});
