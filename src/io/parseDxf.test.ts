import { describe, expect, it } from "vitest";
import { parseDxf } from "./parseDxf";

describe("parseDxf", () => {
  it("liest Linien, Polylinien und entfernte Textanker", () => {
    const dxf = [
      "0", "SECTION", "2", "ENTITIES",
      "0", "LINE", "8", "Plan", "10", "704700", "20", "5389400", "30", "425", "11", "704720", "21", "5389420", "31", "425",
      "0", "LWPOLYLINE", "8", "Grenze", "70", "1", "10", "704700", "20", "5389400", "10", "704800", "20", "5389400", "10", "704800", "20", "5389500",
      "0", "MTEXT", "8", "Plankopf", "10", "-400000", "20", "-20000000", "30", "0",
      "0", "ENDSEC", "0", "EOF",
    ].join("\n");

    const dataset = parseDxf(dxf, "plan.dxf");

    expect(dataset.features).toHaveLength(3);
    expect(dataset.features[1]?.kind).toBe("polygon");
    expect(dataset.features[2]?.points[0]?.y).toBe(-20_000_000);
    expect(dataset.warnings.some((warning) => warning.code === "dxf.approximated.MTEXT")).toBe(true);
  });

  it("übernimmt einen expliziten CRS-Kommentar", () => {
    const dxf = [
      "999", "CRS EPSG:25832",
      "0", "SECTION", "2", "ENTITIES",
      "0", "POINT", "10", "704700", "20", "5389400",
      "0", "ENDSEC", "0", "EOF",
    ].join("\n");

    expect(parseDxf(dxf, "plan.dxf").declaredCrs).toBe("EPSG:25832");
  });

  it("liest Farbe, Linientyp, Linienstärke und Statusflags der verwendeten Layer", () => {
    const dxf = [
      "0", "SECTION", "2", "TABLES", "0", "TABLE", "2", "LAYER",
      "0", "LAYER", "2", "Vermessung", "70", "5", "62", "-3", "420", "3368601", "6", "DASHED", "370", "25", "290", "0",
      "0", "ENDTAB", "0", "ENDSEC",
      "0", "SECTION", "2", "ENTITIES", "0", "POINT", "8", "Vermessung", "10", "1", "20", "2", "0", "ENDSEC", "0", "EOF",
    ].join("\n");

    expect(parseDxf(dxf, "metadata.dxf").layerMetadata).toEqual([{
      name: "Vermessung",
      color: "#336699",
      aciColor: 3,
      trueColor: 3_368_601,
      lineType: "DASHED",
      lineWeight: 25,
      flags: 5,
      isOff: true,
      isFrozen: true,
      isLocked: true,
      isPlottable: false,
    }]);
  });
});
