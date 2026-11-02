# Geodata Inspector & Cleaner

**English** · [Deutsch](README.de.md)

A local-first single-page app for inspecting and deliberately cleaning DXF and
GeoJSON files. It focuses on geometry that lies far outside the actual project
area and therefore breaks downstream steps such as “zoom all”, bounds
calculations, exports and further GIS/CAD processing.

**Live app:** [geodata-inspector-cleaner.netlify.app](https://geodata-inspector-cleaner.netlify.app/)

The language button uses bundled SVG flags for consistent display on Windows,
macOS and Linux.

This English README is also the English in-app help. It matches the content of
the German [README.de.md](README.de.md), which the help page shows when German
is selected.

## Project status

**Version 26.23.3 – shared design, round 3.** The source code is licensed under
MIT. Real survey files, coordinate-based private regression fixtures and project
screenshots are excluded from the repository and its published history. The
current version already provides:

- local file import for ASCII DXF and GeoJSON,
- a unified internal geometry model,
- spatial cluster detection without a quadratic all-pairs comparison,
- detection of distant drawing groups,
- a comparison of the full extent with the recommended focus area,
- a careful CRS plausibility check with a manually editable EPSG field and
  `EPSG:25832` as the default,
- Z=0 hints for mixed 2D/3D data,
- separate overview and focus previews,
- a dedicated preview of the suspected disturbance area with a careful
  `review` / `removal recommended` label,
- an OpenStreetMap plausibility view for georeferenced clusters,
- DXF/GeoJSON geometry overlaid on OSM with main and disturbance area outlines,
- explicit main-area selection from the map context,
- one combined DXF/GeoJSON export with a reviewable preselection,
- layer and entity-type filters with DXF colour, line type, line weight and
  layer state,
- GeoJSON-to-DXF conversion that keeps the layer structure,
- selectable DXF target formats AutoCAD 2000 (`AC1015`) and AutoCAD 2018
  (`AC1032`), with the choice stored locally,
- an automatic reimport check of feature count, cluster count and bounds,
- instant German/English switching with the choice stored locally,
- an interface button for automatic, light or dark mode, stored locally,
- an integrated help page that renders this README as readable HTML,
- an **About** menu with a bilingual “About me” view, a transparently labelled
  link to the Pointcloud Manager demo and an integrated copyright/licence
  overview,
- the full release version right next to the app title and also in the browser
  tab and the footer,
- a disturbance-area preview that is collapsed by default and renders only
  when needed,
- a start view bound to the browser height without an outer vertical scroll
  bar, and preview grids that stay readable in both themes,
- a reproducible demo dataset.

The source file is never overwritten. The cleaner creates a new file with the
suffix `-cleaned` and checks it by reimporting it internally before download.

## Help, language and appearance

On the right of the header you first find **Inspection report**, followed in a
fixed order by **About**, **Help** as a round “(i)” button, the interface button
and the language button. Help opens in a new tab. The help page renders this
English `README.md` as formatted HTML when English is selected and the German
`README.de.md` when German is selected. Operating notes, export limits, version
information and screenshots therefore stay tied to one editorial source per
language. The product/UX concept is still versioned and linked from the
documentation section of this README, but it is no longer the primary user
help.

The language button switches the interface between German and English
immediately and stores the choice locally in the browser. The help and concept
pages follow this choice and have their own language button; switching changes
the displayed text at once.

The interface button cycles the whole interface through automatic (follows the
system setting), light and dark. The choice also applies to the help and concept
pages and is stored locally under `gic.theme`. No settings are sent to a server.

As in Pointcloud Manager, the **About** menu contains **About me** and
**Copyright**. “About me” opens a short bilingual introduction of Michael
Radeck. The text was taken from Pointcloud Manager and extended with the
connection to Geodata Inspector & Cleaner. It links to Multikopterschule XMS,
DroneMediaMunich, XING and Crew United. The
[Pointcloud Manager](https://stable-v53--pointcloud-manager.netlify.app/) linked
there is explicitly labelled as a reduced online version with feature limits and
upgrade/upsell notices.

**Copyright** opens the versioned
[`docs/COPYRIGHT-LICENSES.md`](docs/COPYRIGHT-LICENSES.md) directly in an app
dialog. This file stays the single source for release status, library licences,
OpenStreetMap obligations and the security boundary of the Markdown renderer.

At the bottom you find **More apps**: GeoTIFF Inspector,
[MeasureMap](https://measuremap-viewer-editor.netlify.app/), [Geoid-TIFF 2 PGM Converter](https://geoid-tiff2pgm-converter.netlify.app/),
DXF Coordinate Forge, [PointCloud Manager](https://www.pointcloud-manager.com),
GPS / UTM Converter, SkyCheck and michael-radeck.de. The compact footer stays
visible in the app viewport and also links **Imprint**, **Ko-fi** and
**Licenses / Copyright**. The licence link opens the same maintained overview as
the About menu; there is no second licence list.

**Help / bug report / contact** opens a window with the user help and e-mail
links to **michael.radeck@email.de**. The bug report prepares a subject with the
app version and a template for reproduction steps, expected/actual behaviour and
browser/operating system. An e-mail program must be set up. The app sends
nothing itself and never attaches source files, coordinates or inspection
reports automatically. Please remove sensitive project data before sharing it
voluntarily. External apps, the imprint and Ko-fi open only when clicked; there
are no embedded donation widgets and no new trackers. Labels, the help link and
the e-mail template follow the DE/EN language choice.

## Version display and compact disturbance preview

As in Pointcloud Manager, the canonical version is shown right next to the app
title, for example `v26.23.3`. The browser tab and the footer show
the same value. The display comes centrally from `package.json` and is not
maintained as a separate version value.

The third preview, **Suspected disturbance area**, is collapsed by default so
that the main-area review and the large OSM map stay quickly reachable. Its
header still shows the extent, the feature count and the label **REVIEW** or
**REMOVAL RECOMMENDED**. **Show** opens the detail view; only then are the
canvas and the disturbance map rendered at their visible size. Clicking again or
**Collapse** closes it. This only affects the display and changes neither the
analysis nor the export selection.

When closed, the disturbance preview occupies only its header; no empty canvas
or grid area remains. The right sidebar keeps the cleaner card permanently
reachable and scrolls longer finding lists in a separate area. The former
roadmap tile was removed from the sidebar; the DWG strategy is still linked in
the **Documentation** section.

### Start view and preview grid

The app shell takes exactly the available browser height. Header, workspace and
footer therefore stay together in the viewport; the empty start view no
longer produces an outer vertical scroll bar. After an import, long analysis
results scroll inside the central stage, and the sidebars scroll in their own
area when needed. The long help and concept pages remain normally scrollable.

The technical grid of the empty preview uses separate theme values. In the
light interface the lines are visible in a restrained dark tone; in the dark
interface the previously very faint light tone was raised slightly. The grid is
only for spatial orientation and changes neither geometry nor analysis.

## Setting the CRS / EPSG for the analysis

In the left section **02 · Analysis** there is, as in Pointcloud Manager, a
manually editable **CRS / EPSG** field. The default is `EPSG:25832`. Accepted
forms include `25832`, `EPSG 25832` and `EPSG:25832`; the app normalises them to
`EPSG:25832`. The list currently offers `EPSG:25832`, `EPSG:25833`,
`EPSG:31468`, `EPSG:4326` and `EPSG:3857` directly.

An entry is applied after a short typing pause, with **Enter** or when the field
loses focus. Cluster assessment, CRS plausibility check, CRS-based main-area
selection and all OSM previews then run again. If the file declares a clearly
readable CRS and the field has not been edited manually, the app uses that
value; otherwise `EPSG:25832` stays the default. An empty field falls back to the
file metadata or the careful coordinate heuristic.

The entry is an **analysis and export setting, not a reprojection**. XY/Z
coordinates are not changed. On cleaner export the normalised code is only
written as CRS metadata or as a DXF comment. A formally valid EPSG code that is
not registered for the map preview stays visible in the report; no OSM
projection is invented for it.

Because a different CRS can lead to a different spatial assessment, every CRS
change resets a main-area selection that was already confirmed manually. The
correct green area must then be reviewed and confirmed on the map again. This
prevents a cleaner approval from being reused unnoticed under a changed CRS
assumption.

## One combined export for all checks

1. Load a DXF or GeoJSON. The source file stays unchanged.
2. The default is to keep data: survey points, names, codes and height labels
   stay selected. Geometric Z values are kept. Only exact duplicates on the
   same layer and eligible single-vertex repairs are preselected.
3. Select distant areas, duplicates on other layers and hatch outlines
   deliberately; spatial distance alone is not proof of an error.
4. Review all actions and the actual export balance at the bottom right. The
   optional **Geometry only** setting removes labels and additional CAD
   management data, but no geometric heights. Without this option the original
   structure is kept. The export map and the single-vertex map show the planned
   changes before saving.
5. Export once and choose where to save. There are no separate DXF downloads for
   duplicates or hatches and no additional main-area confirmation. A successful
   DXF export becomes the new working dataset; if you cancel, the selection is
   kept.

The source objects stay unchanged until export. The inventory therefore still
shows the loaded counts; the export balance shows the planned result. The
header button **Inspection report** optionally saves the selection and, after
export, the applied change log. There is no second automatic download.

### DXF structure and duplicates

The combined DXF export writes a lean AutoCAD 2018 DXF from native geometry
data. It contains only the selected geometry, the required layers, line types,
text styles and the block definitions actually used. Unused CAD management data,
extension dictionaries, application data and preview images are dropped.
Coordinates, Z, arcs, polyline widths and extrusion directions are not
reconstructed from the simplified preview. There is no reprojection. The version
choice still applies to the separate GeoJSON→DXF conversion.

Duplicates are compared using the original tags, including Z and properties;
handles serve for identification. Same-layer copies and additional cross-layer
copies are shown separately. Cross-layer matches can carry different meanings
and can be deselected.

Compound objects that are only partly selected (INSERT with attributes) are kept
as a whole and named in the balance. Unsupported selected geometry blocks the
compact export and names the entity type instead of disappearing silently.
Supported are, among others, native lines, circles, arcs, ellipses, splines,
polylines, faces, texts and INSERTs with their required blocks.

### Hatch outlines

Outlines are generated only for hatches that still exist after the selected
deletions. All outer and inner rings are written as closed LWPOLYLINEs on the
original layer. Hatches fully covered by outlines are replaced in the export.
With the option switched off, no additional polylines are created. Identical
outlines that already exist or are already planned are not created again. Lines
and arcs stay exact; ellipses and splines are approximated with a sampling
tolerance of 0.001 drawing units and marked as such. Incomplete or open
boundaries are skipped with a reason; the hatch is kept completely. Only
ENTITIES from R14 onwards, no block definitions.

Example file: two hatch duplicates are preselected. After removing them,
32 hatches remain and are replaced by 33 distinct outlines including an inner
ring (about 12 kB). The real Pointcloud Manager importer reads 33 distinct shapes
from it. No normalising second export creates extra copies. The selected outside
area including layout/title-block objects is dropped.

### Save location and cancelling

In supported browsers the export opens the native “Save as” dialog directly. It
asks again for every file; no file handles are stored. Cancelling changes
neither the source file nor the working dataset. Errors open a dialog with a
retry option. If the browser offers no native picker, the app explains this
limitation and offers a clearly labelled normal download instead; the browser
then decides where the file goes.

### GeoJSON

Area and layer/type selection are applied in the combined GeoJSON export.
Alternatively the data can be converted to DXF with AC1015 or AC1032.
Coordinates stay unchanged. The normalised GeoJSON→DXF conversion does not
represent complex CAD object structures; the direct DXF path keeps them.

## Quick start

The published web app can be used directly in the browser at
[https://geodata-inspector-cleaner.netlify.app/](https://geodata-inspector-cleaner.netlify.app/).
For local development:

```bash
npm install
npm run dev
```

The app runs at <http://127.0.0.1:5174> by default.

## Quality checks

```bash
npm run test
npm run build
```

The build runs the TypeScript checks and Vite. The app uses Leaflet, proj4,
marked and the self-hosted Inter font. The npm `private` flag prevents accidental
package publication and is independent of GitHub repository visibility.

## Versioning

Currently **26.23.3**, a public MIT release with cleaned history. The scheme is
`Year.Push.Iteration`: two-digit year, running number of the GitHub push to
`main` within the year, and the local iteration. Every push to `main` increases
the push number and resets the iteration to 1; local work rounds before that
increase the iteration. The same value appears in `package.json`,
`package-lock.json`, `displayVersion`, the app, the footer, the contact e-mail
subject and inspection reports. Up to `2611.3.25` the scheme `JJMM.R.P`
(year/month, release line, subversion) was used; those entries remain in the
history as the versions that were published at the time.

## Guiding principles

1. **Local first:** geodata does not leave the browser.
2. **Inspect before clean:** explain and visualise first, then decide.
3. **No silent loss:** unsupported CAD entities and approximations are reported.
4. **CRS honesty:** a coordinate heuristic is not proof of an EPSG code.
5. **Reversible decisions:** cleanups are handled as an explicit selection and report.
6. **Format-neutral core:** analysis and preview work on a shared model,
   regardless of whether the source is DXF, GeoJSON or, later, DWG.

Geometry is still processed locally. The optional OSM preview, however, fetches
visible raster tiles online; the map provider can therefore see the displayed
area and the IP address. No tiles are prefetched or collected for offline use.

## Documentation

- [Product and UX concept (German)](docs/PRODUCT-DESIGN.md)
- [Product and UX concept (English)](docs/PRODUCT-DESIGN.en.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Analysis and quality rules](docs/ANALYSIS-RULES.md)
- [Implementation plan](docs/IMPLEMENTATION-PLAN.md)
- [ADR: DWG strategy](docs/ADR-001-DWG-STRATEGY.md)
- [Technical learning log](docs/LERNLOG.md)
- [Copyright and licence overview](docs/COPYRIGHT-LICENSES.md)

## Version history

| Version | Date | Content |
|---|---|---|
| `26.23.3` | 2026-11-02 | Favicon: “accent-blue diamond with white dots” variant (more legible at 16 px). |
| `26.23.2` | 2026-11-02 | Favicon from the brand mark (SVG, 32 px PNG, Apple touch icon) on all pages; the third bar under the footer is gone, status messages now appear below the drop zone. |
| `26.23.1` | 2026-11-02 | Design round 3: header order Inspection report · About · Help as “(i)” · interface · language, English help, self-hosted Inter font, new MeasureMap link. |
| `26.22.1` | 2026-11-02 | Version scheme changed to `Year.Push.Iteration` (last `2611.3.25`); help and concept pages show content again in the production build. |
| `2611.3.25` | 2026-11-02 | Shared design: neutral colour scheme, interface button automatic/light/dark, two footer bars with GeoTIFF Inspector, version and source code. |
| `2610.3.24` | 2026-10-08 | Accept DXF comments in geometry-only export. |
| `2610.3.23` | 2026-10-08 | Unfiltered CRS selection with names and a separate custom entry. |
| `2610.3.22` | 2026-10-04 | Footer buttons as in MeasureMap, links synchronised in both directions and English “Imprint”. |
| `2610.3.21` | 2026-10-03 | Add DXF and GeoJSON in any order; multiple selection, explicit reset, merge native CAD resources. |
| `2610.3.20` | 2026-10-03 | Add GeoJSON to existing data; shared map and export, original DXF objects kept. |
| `2610.3.19` | 2026-10-03 | Respect the GeoJSON source CRS and actually transform to EPSG:25832 on import; Z kept. |
| `2610.3.18` | 2026-10-03 | Single-vertex LWPOLYLINE check with explicit selection, point matching and unchanged original repair. |
| `2610.3.12` | 2026-10-02 | Cleaned public MIT repository; existing Netlify site relinked. |
| `2610.3.11` | 2026-10-02 | MIT licence and exclusion of private survey data. |
| `2609.3.10` | 2026-09-28 | Lean default export: native geometry and required resources; fully covered hatches replaced by outlines. |
| `2609.3.9` | 2026-09-28 | Outside areas with layout/title-block objects including their management references deleted correctly; export and reimport checked. |
| `2609.3.8` | 2026-09-28 | Outside areas selected automatically; separate synchronised export switches with duplicate and hatch counts. |
| `2609.3.7` | 28 September 2026 | Combined export plan: duplicates/areas preselected, outlines can be enabled; one DXF export with original structure and direct save-location choice. |
| `2609.3.6` | 28 September 2026 | Save-location prompt per export; cancel and write errors handled, explicit download fallback without browser support. |
| `2609.3.5` | 28 September 2026 | Duplicate outlines in the subsequent cleaner export prevented; checked with the actual Pointcloud Manager importer. |
| `2609.3.4` | 28 September 2026 | Hatch duplicates deletable despite IDBUFFER member lists; the related list references removed and logged in a controlled way. |
| `2609.3.3` | 28 September 2026 | Version month corrected; closed hatch outlines on original layers including inner rings, curve support and structure-preserving DXF export. |
| `2607.03.3` | 22 September 2026 | Compact footer with more apps, help/bug report/contact window, existing licence overview, imprint and Ko-fi; DE/EN and both themes. |
| `2607.03.2` | 19 September 2026 | Duplicate cleanup updates the active dataset and all object counts, layers, maps and findings automatically; further cleanup without reimport. |
| `2607.03.1` | 19 September 2026 | Automatic DXF duplicate check, separate hits for same and different layers, optional deletion list with handles and its own structure-preserving export with log. |
| `2607.03.0` | 13 July 2026 | New release line with viewport-fitted start view and theme grids, manual CRS/EPSG analysis field with safe reanalysis, compact disturbance summary, stable scrolling findings and a cleaned-up right sidebar; consolidates 2607.02.1 to 2607.02.3. |
| `2607.02.3` | 13 July 2026 | Closed disturbance preview reduced to its header, right finding list stabilised as its own scroll area and roadmap tile removed from the sidebar. |
| `2607.02.2` | 13 July 2026 | Manually editable bilingual CRS/EPSG analysis field with `EPSG:25832` as default, normalised input forms, automatic reanalysis and safe reset of earlier cleaner confirmations. |
| `2607.02.1` | 13 July 2026 | Start view bound exactly to the browser height, outer vertical scroll bar removed and preview grid contrast tuned for light and dark themes. |
| `2607.02.0` | 13 July 2026 | New release line with the full version number next to the app title and a disturbance preview that is collapsed by default and rendered on demand; also contains the previously local About/Copyright state from 2607.01.4. |
| `2607.01.4` | 13 July 2026 | About menu with About me and Copyright, in-app rendering of the licence overview and a transparently labelled link to the reduced Pointcloud Manager online version. |
| `2607.01.3` | 13 July 2026 | README-based help page instead of the concept button, adopted and bilingually extended “About me” information and a locally stored light/dark mode for app and help. |
| `2607.01.2` | 13 July 2026 | DXF target formats AC1015/AutoCAD 2000 and AC1032/AutoCAD 2018 with stored choice and the complete OEM-compatible DXF skeleton from Pointcloud Manager. |
| `2607.01.1` | 12 July 2026 | Cleaner with normalised DXF export, main/disturbance area maps, CRS-based main-area selection, layer/entity-type filters with DXF layer metadata, GeoJSON→DXF conversion, Inter typography and locally visible patch version. |
| `2607.01.0` | 12 July 2026 | First main release with DXF/GeoJSON analysis, cluster and CRS check, three preview windows, OSM geometry overlay, DE/EN interface and real private regression fixtures. |

## Private test data

Real survey files, their manifest, reference tests with exact coordinates and
screenshots made from them do not belong in the repository. Parser and cleaner
regressions keep using synthetic test cases. `.gitignore` prevents DXF/GeoJSON
files from being committed accidentally.

## Origin of the idea

The project extracts and extends the “nirvana” check that was developed for the
DXF/GeoJSON import of [Pointcloud Manager](https://pointcloud-manager.com/). It
is deliberately a standalone application: no point-cloud tools, no measurement
editor and no dependency on the viewer state of the original project.

## License

The project source code is licensed under the [MIT License](LICENSE).
Copyright © 2026 Michael Radeck.

The licences and attribution requirements of the libraries, the Inter font and
the map data remain in effect; see the
[copyright and licence overview](docs/COPYRIGHT-LICENSES.md). Real survey
fixtures under `test-data/dxf/real-world` are not covered and would need a
separate approval for public distribution. Any use of GNU LibreDWG (GPLv3+)
still needs its own licence and distribution decision.

## Deleting layout/title-block objects since 2609.3.9

Selected CAD objects are removed together with their own extension data. Known
management references (block reference lists, draw order, active viewport,
field lists and the named block hierarchy index) are cleaned up specifically.
Unknown incoming references and ambiguous identifiers stay locked. The export
balance distinguishes CAD objects from preview objects: a title block with
25 attributes counts as one CAD object and 26 preview objects. After a
successful export the interface shows the new working state; zero further
deletions or outlines are then the expected result.

## Repair single-vertex DXF lines

Survey exports (including Emlid) can contain LWPOLYLINE entities with one vertex,
causing “Invalid Line String size”. **Invalid DXF lines** checks the original
tags. **Convert to points** is preselected for eligible lines. Alternatively
choose **Delete lines** or **Keep unchanged**, at the bottom right for all of
them or per row. The explicit delete choice removes lines even without an
existing point copy.

The combined export lists the actual conversions, deletions and reused points.
Retained POINTs with exactly the same XYZ in the same drawing space are reused,
even on other layers. Otherwise a POINT with the original XYZ is created on the
line's layer. Several conversions at the same position create only one point.
Outside areas and explicitly set layer filters take precedence; removed geometry
is never recreated. All layer/type categories stay selected by default.

All steps run through **Export DXF · preserve data** at the bottom right. The
compact geometry export is only an explicit option. After saving, the data is
reanalysed. The optional **Inspection report** contains the changes and
coordinates and stays local.

Invalid XYZ/counts, nonstandard extrusion, widths/bulges/thickness, ambiguous
handles and incoming references block the repair. The rule currently accepts
only ASCII files and single-vertex LWPOLYLINE; other geometry errors need their
own rules.

## Point companions and map review since 2610.3.18

Survey points, annotations and blocks are separate filter categories. When a
POINT is deselected, clearly assigned TEXT/MTEXT companions follow
automatically. They are assigned through direct point-handle references or an
exactly identical XY anchor in the same drawing space. If a point copy survives
at the anchor, shared companions stay. Offset or ambiguous texts are not
attached to the nearest point; the number of unassigned texts is visible.
Reference protection stays in effect.

**Export selection on the map** offers zoom and pan and a switchable OSM
background. Green means keep, red remove and blue convert. Click objects to set
or undo a manual deselection; other filters apply additionally. **Reset map
exclusions** only clears these manual deselections. Layer, area, duplicate and
repair selections update the map from the actual export plan. Tooltips show
type, handle, layer, XYZ and action. Companion texts are shown at their
insertion points.

The dedicated **Single-vertex lines** map shows only the detected single-vertex
lines and zooms to exactly these objects on load. Actions come from the repair
list; **Zoom to all** fits the view again at any time. Invalid coordinates cannot
be mapped; the finding list stays authoritative for them.

## OSM in the first two previews since 2610.3.18

The export selection map and the single-vertex map each have an independent
**Show OSM background** switch, enabled initially. The selected CRS/EPSG is
converted to WGS84/Web Mercator for display only; source and export coordinates
stay unchanged. Toggling refits the related object extent, in the single-vertex
map only the findings. If the projection is missing or cannot be displayed, the
complete local XY view stays visible with a notice. CRS contradictions are shown
explicitly. Visible map tiles are loaded online; OSM sees the area and the IP
address, not an uploaded DXF. Attribution stays visible. ALKIS is not included.

## Light default and compact export panel

Light was made the default design in 2610.3.18; an explicitly saved dark choice
is kept. Since 2611.3.25 the interface button also offers automatic, which
follows the system setting. Export details are closed for every newly loaded
file. The short balance and the export button stay visible. **Export details and
selection** opens all options. Collapsing changes no selection or export action.

## GeoJSON coordinates (2610.3.19)

GeoJSON without a CRS declaration uses WGS84 in longitude/latitude order
(RFC 7946). On load, XY are now actually transformed to EPSG:25832 for analysis
and DXF export; Z and properties are kept. Supported legacy CRS declarations take
precedence; unknown CRS or invalid geographic coordinates stop the import. The
file overview shows source and target. Existing EPSG:25832 coordinates stay
unchanged. Import resets an earlier manual analysis setting to the working CRS.
The analysis field itself still does not transform coordinates. GeoJSON exports
keep the existing legacy format with an explicit EPSG:25832 CRS member and are
not RFC 7946 interchange files. Existing limitations with polygon holes in
preview/export are still reported.

## Adding GeoJSON (2610.3.20)

Another GeoJSON is added to the existing data in EPSG:25832. Existing geometry
stays in the map and the combined export. For DXF, original CAD objects are kept;
new geometry and missing layers are added with unique handles. A different
working CRS prevents the addition without replacing existing data. Checks and
cleanup selections are rebuilt for the combined dataset. Since 2610.3.21 loading
a DXF also adds to the existing dataset.

## Loading survey files together (2610.3.21)

Every further DXF or GeoJSON is added, regardless of the order. Several files
can be selected or dropped at once; they are imported one after another. The
inventory shows the loaded file names. **New session · clear data** deliberately
starts over. Geometry and Z stay in the combined map and export; checks and
cleanup selections are rebuilt after adding. GeoJSON is transformed to
EPSG:25832. DXF without a CRS declaration uses the current analysis setting;
contradictory declared CRS or DXF units abort the addition without replacing
existing data. Native blocks, annotations and resources are taken over with
reassigned handles and references. Name conflicts receive a suffix (for example
`Survey__2`); equivalent definitions can be shared. The existing layer 0 and
active viewport stay authoritative. Unsupported non-empty DXF sections stop the
addition instead of silently losing content.

## 2610.3.22 · 2026-10-04 · Footer

Footer links now use rounded buttons as in MeasureMap. The shared project and
resource links are synchronised between both apps; the English legal link reads
“Imprint”.

## 2610.3.23 · 2026-10-08 · CRS selection

The CRS selection shows all five built-in map coordinate systems with EPSG code
and name, regardless of the current value. GK4 can be selected directly as
EPSG:31468. A custom EPSG entry remains possible; unregistered codes do not get a
map projection from it. A change restarts the analysis without transforming
source coordinates.

## 2610.3.24 · 2026-10-08 · DXF comments

Geometry-only export accepts valid DXF comments before the first SECTION, for
example from LibreDWG. These comments previously blocked the export by mistake.
Geometry and Z values are kept.

Export errors are also shown directly above the export button. Unsupported
objects such as layout VIEWPORTs still block the compact export; switch off
“Geometry only” to keep them in the normal export.

## 2611.3.25 · 2026-11-02 · Shared design

The app now uses the shared look of Michael Radeck's public apps:

- **Colour scheme:** neutral grey/blue in the light and dark interface. The
  earlier greenish scheme is replaced; green, amber and red remain as status
  colours (keep, review, remove).
- **Interface button** at the top right: cycles through *automatic* (half
  circle, follows the system setting), *light* (sun) and *dark* (moon). The
  choice is stored locally in the browser and applied before the first paint.
- **Language button:** flag and code DE/EN; on the first visit the browser
  language applies.
- **Two footer bars:** “More apps” (now including GeoTIFF Inspector) and author,
  year and version with data sources, source code, help / bug report / contact,
  licenses / copyright, imprint and Ko-fi.

Analysis, cleaning and export are unchanged.

## 26.22.1 · 2026-11-02 · Version scheme and help page

The version now follows `Year.Push.Iteration`: two-digit year, running number of
the GitHub push to `main` in that year, and the local iteration (previously
`JJMM.R.P`, last `2611.3.25`). The help and concept pages showed no content in
the published version because they accidentally started the main app as well;
they now load independently again. Analysis, cleaning and export are unchanged.

## 26.23.2 · 2026-11-02 · Favicon and two footer bars

- **Favicon:** the browser tab now shows the brand mark of the header (rotated
  rounded square with three dots, blue on white), as SVG plus a 32 px PNG and an
  Apple touch icon, on the app, help and concept pages.
- **Footer:** only the two footer bars remain. The former third line under them
  (“Ready · data remains on this device” and the version) is gone; the version
  stays in the header and the footer. Status messages such as “Reading …”, read
  errors, an invalid CRS or a saved file now appear directly below the drop zone
  in the input panel.

Analysis, cleaning and export are unchanged.

## 26.23.1 · 2026-11-02 · Header, English help and font

- **Header:** on the right first **Inspection report**, then **About** (About
  me, Copyright), **Help** as a round “(i)” button, the interface button and the
  language button. The former text button “Help” is gone.
- **Help in English:** with English selected, the help page shows this English
  `README.md`, which now matches the content of the German version. The language
  button on the help and concept pages switches the text immediately; the
  concept page now also has the interface button.
- **Font:** Inter (SIL Open Font License 1.1) is shipped with the app. No request
  is made to Google Fonts or other font services.
- **MeasureMap** is now linked at <https://measuremap-viewer-editor.netlify.app/>.

Analysis, cleaning and export are unchanged.
