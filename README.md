# Geodata Inspector & Cleaner

**English** · [Deutsch](README.de.md)

A local-first single-page app for inspecting and cleaning spatial outliers in DXF and GeoJSON files. It helps identify geometry far outside the actual project area that disrupts zoom-to-fit, bounds calculations, exports and GIS/CAD processing.

[Open the app](https://geodata-inspector-cleaner.netlify.app/)

**Version: 2610.3.24.** The source code is licensed under MIT. Real survey files, coordinate-based private regression fixtures and project screenshots are excluded from the repository and its published history.

The language button uses bundled SVG flags for consistent display on Windows, macOS and Linux.

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
4. Review the combined export selection, including duplicates, outside-area geometry and hatch outlines. All valid categories are retained; only exact same-layer duplicates and eligible singleton repairs are preselected.
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

## Repair single-vertex DXF lines

Survey exports (including Emlid) can contain LWPOLYLINE entities with one vertex,
causing “Invalid Line String size”. **Invalid DXF lines** checks source tags.
Eligible lines are preselected for **Convert to points**. Choose **Delete lines**
or **Keep unchanged** instead, globally in the bottom-right export panel or per row.
Deletion is explicit and can remove a line even without a matching point copy.

The common export lists the actual conversion, deletion and reused-point counts.
Existing retained POINTs with exactly matching XYZ in the same drawing space are
reused, even across layers. Otherwise a POINT is created on the original line’s
layer with the original XYZ. Multiple conversions at the same position produce
only one point. Outside-area and explicit layer filters take precedence; removed
geometry is never recreated. All point, annotation and block categories are retained by default.

All selected operations run together through the bottom-right **Export DXF**
button. Source data is retained by default; compact geometry-only export is opt-in. After saving, the working dataset is reanalyzed. The optional
**Inspection report** contains the changes and coordinates and stays local.

Invalid XYZ/counts, nonstandard extrusion, width/bulge/thickness, ambiguous handles
and incoming references block repair. This rule currently accepts only ASCII input
and single-vertex LWPOLYLINE. Other degenerate geometry requires separate rules.

## Survey data and selection maps (2610.3.18)

Points, annotations and blocks have separate filters and start retained. Spatial
outliers and cross-layer matches require explicit selection; hatch generation is
also opt-in. **Geometry only** removes labels and CAD metadata on request while
preserving geometric XYZ. Text, MTEXT and block attributes are omitted in that mode.

When a POINT is removed, companions linked by a direct point handle or exact XY
anchor in the same drawing space follow it. Shared labels remain while another
point copy survives. Offset or ambiguous annotations are counted and left
independent; there is no nearest-neighbour deletion. Reference protection remains.

The **Export selection map** reflects the actual export plan: green
retained, red removed, blue converted. Click objects to toggle manual exclusions;
other filters still apply. Reset only clears map exclusions. Tooltips identify
objects and XYZ. Labels appear at their insertion points. The dedicated singleton
map fits only the detected single-vertex lines on load, with a Zoom to all button.
Both maps have an independently switchable OSM background, enabled initially. The selected CRS/EPSG is used only for display projection; export XYZ stays unchanged. If projection fails, all geometry remains in the local XY view with a warning. Visible OSM tiles are fetched online with attribution; the provider receives the viewed area and IP address, not DXF uploads. Findings with invalid coordinates remain in
the report but cannot appear on the map.

## Default appearance and compact export panel

The default theme is light; an explicitly saved dark preference is still respected.
Export details start collapsed on each newly loaded dataset. The compact count
and export button remain visible. Open **Export details and selection** to review
all options; collapsing the panel never changes the selected operations.

## GeoJSON coordinates (2610.3.19)

GeoJSON without a CRS declaration uses WGS84 longitude/latitude (RFC 7946). Import now actually transforms XY to EPSG:25832 for analysis and DXF export, retaining Z and properties. Supported legacy CRS declarations take precedence; unsupported declarations or invalid geographic coordinates stop import. The inventory shows source and target CRS. Existing EPSG:25832 coordinates are unchanged. Import resets any previous manual analysis CRS to the working CRS. The manual analysis field itself still does not transform coordinates. GeoJSON exports retain the existing legacy format with an explicit EPSG:25832 CRS member; they are not RFC 7946 interchange files. Existing polygon-hole preview/export limitations remain reported.

## Adding GeoJSON (2610.3.20)

Loading another GeoJSON adds it to the existing data in EPSG:25832. Existing geometry stays in the map and joint export. For DXF, original CAD entities are preserved; only new geometry and missing layers are appended with unique handles. An incompatible working CRS stops the addition without replacing existing data. Checks and cleanup selections are rebuilt for the combined dataset. Since 2610.3.21, DXF imports also add to the existing dataset.

## Combine survey files (2610.3.21)

Every subsequent DXF or GeoJSON is added, regardless of import order. Multiple files can be selected or dropped together; imports run sequentially. The inventory lists the loaded files. **New session · clear data** explicitly starts over. Geometry and Z remain in the common map and export; checks and cleanup selections are rebuilt after additions. GeoJSON is transformed to EPSG:25832. DXF without a declaration uses the current analysis CRS; incompatible declared CRS or DXF units are rejected without replacing existing data. Native DXF blocks, annotations and resources are merged with remapped handles and references. Conflicting resource names receive a suffix (e.g. `Survey__2`); equivalent definitions can be shared. The existing layer 0 and active viewport remain authoritative. Unsupported nonempty DXF sections stop addition rather than silently losing content.

## 2610.3.22 · 2026-10-04 · Footer

Footer links now use rounded buttons matching MeasureMap. The shared project and resource links are synchronized between both apps; the English legal link reads “Imprint”.

## 2610.3.23 · 2026-10-08 · CRS selection

All five built-in map coordinate systems are now available in an unfiltered CRS dropdown, with EPSG codes and names. Select GK4 / EPSG:31468 for appropriate Gauss-Kruger zone 4 data. Custom EPSG input remains available; unregistered codes do not add map projection support. Changing the selection reruns analysis without transforming source coordinates.

## 2610.3.24 · 2026-10-08 · DXF comments

Geometry-only export now accepts valid DXF comments before the first SECTION, including files written by LibreDWG. Previously these comments incorrectly blocked export. Geometry and Z values are preserved.

Export preparation errors are also shown directly above the export button. Unsupported objects such as layout VIEWPORTs continue to block compact export; turn off geometry-only mode to retain them in the normal export.
