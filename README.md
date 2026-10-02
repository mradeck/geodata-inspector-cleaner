# Geodata Inspector & Cleaner

**English** · [Deutsch](README.de.md)

A local-first single-page app for inspecting and cleaning spatial outliers in DXF and GeoJSON files. It helps identify geometry far outside the actual project area that disrupts zoom-to-fit, bounds calculations, exports and GIS/CAD processing.

[Open the app](https://geodata-inspector-cleaner.netlify.app/)

**Version: 2610.3.12.** The source code is licensed under MIT. Real survey files, coordinate-based private regression fixtures and project screenshots are excluded from the repository and its published history.

## Features

- Local ASCII DXF and GeoJSON import with a common geometry model.
- Spatial cluster detection, extent inflation and distant drawing groups.
- Separate overview, main-area and disturbance previews.
- Manual main-area selection with OpenStreetMap plausibility checks.
- CRS analysis, configurable EPSG input (default EPSG:25832) and mixed 2D/3D warnings.
- Layer and entity-type filters, including DXF colors, line types, line weights and layer state.
- Duplicate detection using original DXF tags rather than approximate preview geometry.
- Hatch boundaries with closed polylines, interior rings, preserved metadata and reported curve approximations.
- Combined export with a reviewable selection of duplicates, outside areas and hatch outlines.
- Compact DXF output preserving native geometry and required resources, plus GeoJSON-to-DXF conversion.
- AutoCAD 2000 (AC1015) and AutoCAD 2018 (AC1032) output profiles where supported.
- Reimport checks for exported feature counts, clusters and bounds.
- German/English controls, persistent light/dark themes and integrated help.

## Workflow

1. Open the app and load a DXF or GeoJSON file.
2. Review the full extent, spatial clusters, warnings and CRS. Heuristic CRS candidates are suggestions, not proof of a coordinate reference system.
3. Inspect the main and disturbance areas. Confirm the intended main area explicitly where the result is ambiguous.
4. Review the combined export selection, including duplicates, outside-area geometry and hatch outlines. Some eligible items are preselected; inspect them before exporting.
5. Export a new cleaned file. The source file is never overwritten. The app checks the result by reimporting it before offering it for download.

The detailed [German manual](README.de.md) is also rendered by the in-app help page. The help navigation follows the selected UI language; the detailed manual remains German.

## Data handling and limits

Files are processed locally in the browser. OpenStreetMap tiles are requested only for the visible interactive map; the tile provider receives the usual network request information. No tile prefetch, bulk download or offline archive is implemented. Map attribution remains visible.

Cluster size alone does not establish which geometry is valid. Coordinate plausibility is checked separately, and ambiguous results require a user decision. The declared source CRS and manually entered analysis CRS remain distinct. Changing the analysis CRS does not silently reproject exported source coordinates.

The app is not a full CAD engine. Unsupported entities, protected references and incomplete compound objects must be reported rather than silently removed. Compact export retains required supported resources and blocks; the older structure-preserving path remains available internally for regression tests. Existing native geometry is not reconstructed from approximate map previews.

DWG import is a separate planned capability. Adding a DWG component requires a separate implementation and license decision; no GPL-based DWG dependency is included by this licensing change.

Real survey files are not distributed. Synthetic parser and cleaner tests remain in the repository. `.gitignore` prevents DXF/GeoJSON source files and the removed private-fixture directory from being committed accidentally.

## Development

```sh
npm ci
npm run dev
npm test
npm run build
```

The build runs TypeScript checks and Vite. The app uses Leaflet, proj4 and marked. The npm `private` flag prevents accidental package publication and is independent of GitHub repository visibility.

## Documentation

- [Detailed German manual](README.de.md)
- [Product and UX](docs/PRODUCT-DESIGN.en.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Analysis rules](docs/ANALYSIS-RULES.md)
- [Implementation plan](docs/IMPLEMENTATION-PLAN.md)
- [DWG strategy](docs/ADR-001-DWG-STRATEGY.md)
- [Technical learning log](docs/LERNLOG.md)
- [Third-party licenses and attribution](docs/COPYRIGHT-LICENSES.md)

The app extends the spatial outlier inspection developed for [Pointcloud Manager](https://pointcloud-manager.com/). It is a standalone tool with no dependency on the viewer's point-cloud state.

## License

[MIT](LICENSE) — Copyright © 2026 Michael Radeck.

Third-party library licenses and map-data attribution requirements remain in effect. The project license does not cover private survey data. See the [license inventory](docs/COPYRIGHT-LICENSES.md).
