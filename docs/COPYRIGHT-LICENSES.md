# Copyright- und Lizenzübersicht

**Release:** 2607.02.0

**Prüfstand:** 13. Juli 2026

**Repository:** privat

Diese Übersicht dokumentiert die direkt verwendeten Bibliotheken, relevante
Build-Komponenten und externe Kartendienste. Sie ersetzt keine individuelle
Rechtsberatung. Vor jedem beauftragten Git-Push wird sie gegen `package.json`,
`package-lock.json` und die externen Nutzungsbedingungen geprüft.

## Projektlizenz

Für `geodata-inspector-cleaner` ist noch keine eigene Distributionslizenz
festgelegt. Das Repository bleibt deshalb privat. Die Aufnahme einer
DWG-Komponente, insbesondere einer GPL-lizenzierten Lösung wie GNU LibreDWG,
bedarf vorab einer eigenen Lizenz- und Distributionsentscheidung.

Die realen DXF-Referenzfixtures sind nicht als anonymisiert oder zur
öffentlichen Weitergabe freigegeben klassifiziert. Sie sind keine
Open-Source-Testdaten und dürfen nicht aus dem privaten Projektkontext
veröffentlicht werden.

## Direkte Laufzeitabhängigkeiten

| Komponente | Version | Lizenz | Verwendung und Pflicht |
|---|---:|---|---|
| [Leaflet](https://github.com/Leaflet/Leaflet/blob/main/LICENSE) | 1.9.4 | BSD-2-Clause | Interaktive OSM-Karte; Copyright- und Lizenzhinweise bei Weitergabe beibehalten. |
| [proj4js](https://github.com/proj4js/proj4js/blob/main/LICENSE.md) | 2.20.9 | MIT | CRS-Transformation; Copyright- und Lizenzhinweis beibehalten. |
| [marked](https://github.com/markedjs/marked/blob/master/LICENSE.md) | 18.0.6 | MIT plus mitgeführte Markdown-BSD-Hinweise | Rendering der fest eingebauten Konzept-, README-Hilfe- und Copyright-Dokumente; Notices bei Weitergabe beibehalten. |

Relevante indirekte Laufzeitkomponenten:

| Komponente | Version | Lizenz | Herkunft |
|---|---:|---|---|
| `mgrs` | 1.0.0 | MIT | Abhängigkeit von `proj4` |
| `wkt-parser` | 1.5.5 | MIT | Abhängigkeit von `proj4` |

## Entwicklungs- und Buildwerkzeuge

| Komponente | Version | Lizenz |
|---|---:|---|
| TypeScript | 7.0.2 | Apache-2.0 |
| Vite | 8.1.4 | MIT |
| Vitest | 4.1.10 | MIT |
| `@types/leaflet` | 1.9.21 | MIT |
| `@types/node` | 24.13.3 | MIT |
| lightningcss | 1.32.0 | MPL-2.0, nur Buildpfad |

Der vollständige Lockfile-Scan für diesen Release fand keine GPL-, AGPL-,
Non-Commercial- oder unbekannt lizenzierte Fremdabhängigkeit. Die Anwendung
selbst besitzt bewusst noch keine öffentliche Lizenz.

## OpenStreetMap

Die interaktive Karte verwendet standardmäßig
`https://tile.openstreetmap.org/{z}/{x}/{y}.png`. Die Oberfläche zeigt dauerhaft
`© OpenStreetMap contributors` mit Link zur
[Copyright- und Lizenzseite](https://www.openstreetmap.org/copyright/attribution-guide/).
OpenStreetMap-Daten stehen unter der ODbL; sichtbare Attribution und ein Hinweis
auf die Lizenz sind erforderlich.

Die [offizielle Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/)
wird wie folgt berücksichtigt:

- nur sichtbare, interaktiv angeforderte Viewport-Kacheln,
- kein Bulk-Download, Prefetch oder Offline-Archiv,
- HTTPS-Endpunkt,
- Browser-Referer und normaler Browser-Cache bleiben erhalten,
- Attribution wird nicht verdeckt,
- Kachelprovider kann über `VITE_OSM_TILE_URL` ausgetauscht werden.

Die öffentlichen OSM-Tiles besitzen keine Verfügbarkeitsgarantie und sind nicht
als kostenloser Hochlastdienst zugesichert. Für eine produktive öffentliche
Bereitstellung muss Nutzungslast und gegebenenfalls ein alternativer Provider
erneut bewertet werden.

## Marked-Sicherheitsgrenze

`marked` bereinigt HTML nicht selbst. In diesem Projekt rendert die Bibliothek
ausschließlich versionierte, zur Buildzeit importierte Projekt-Markdown-Dateien.
DXF-, GeoJSON- oder andere Benutzerinhalte werden nicht als Markdown/HTML an
`marked` übergeben. Sollte später fremdes Markdown unterstützt werden, ist vor
der Aktivierung eine Sanitizing-Schicht verpflichtend.

## Release-Prüfung 2607.02.0

- direkte Abhängigkeiten gegen `package.json` und Lockfile abgeglichen,
- vollständigen npm-Lizenzscan geprüft,
- keine GPL-/AGPL-/Non-Commercial-Abhängigkeit gefunden,
- OpenStreetMap-Attribution im Leaflet-Viewport sichtbar,
- kein Tile-Prefetch oder Offline-Download implementiert,
- README-Hilfe rendert weiterhin ausschließlich eine zur Buildzeit eingebundene
  und versionierte Projektdatei; keine fremden Markdown-Inhalte,
- der Copyright-Dialog rendert diese Datei per dynamischem Import als einzige
  redaktionelle Lizenzquelle; keine zweite HTML-Lizenzliste,
- Versionsanzeige und Störbereichs-Disclosure verwenden ausschließlich
  vorhandenen Projektcode und Browser-APIs; keine neue Abhängigkeit,
- Theme- und Sprachwahl verwenden nur lokalen Browser-Speicher und übertragen
  keine Daten an externe Dienste,
- `npm audit` ohne bekannte Schwachstellen.
