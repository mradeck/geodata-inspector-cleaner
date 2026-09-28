import { describe, expect, it, vi } from "vitest";
import { saveWithPicker } from "./saveFile";

describe('explicit save destination', () => {
  it('asks for a fresh destination each time and waits for the write to close', async () => {
    const stream = {write:vi.fn().mockResolvedValue(undefined),close:vi.fn().mockResolvedValue(undefined),abort:vi.fn()};
    const picker = vi.fn().mockResolvedValue({createWritable:async()=>stream});
    expect(await saveWithPicker(picker,'drawing.dxf','DXF content')).toBe(true);
    expect(await saveWithPicker(picker,'report.json','{}')).toBe(true);
    expect(picker.mock.calls).toEqual([[{suggestedName:'drawing.dxf'}],[{suggestedName:'report.json'}]]);
    expect(stream.write.mock.calls).toEqual([['DXF content'],['{}']]);
    expect(stream.close).toHaveBeenCalledTimes(2);
  });
  it('does not download or report success when the picker is cancelled', async () => {
    expect(await saveWithPicker(async()=>{throw new DOMException('Cancelled','AbortError');},'x.dxf','x')).toBe(false);
  });
  it('aborts failed writes and propagates errors without a silent download fallback', async () => {
    const error = new Error('disk full');
    const stream={write:vi.fn().mockRejectedValue(error),close:vi.fn(),abort:vi.fn().mockResolvedValue(undefined)};
    await expect(saveWithPicker(async()=>({createWritable:async()=>stream}),'x.dxf','x')).rejects.toBe(error);
    expect(stream.abort).toHaveBeenCalledOnce();expect(stream.close).not.toHaveBeenCalled();
  });
});
