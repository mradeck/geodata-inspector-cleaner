# geodata-inspector-cleaner

Lokale Single-Page-App zur Inspektion und kontrollierten Bereinigung von DXF-
und GeoJSON-Dateien. Der Schwerpunkt liegt auf Geometrie, die weit außerhalb
des eigentlichen Projektbereichs liegt und dadurch Folgeprozesse wie „Zoom all",
Bounds-Berechnungen, Exporte und GIS-/CAD-Weiterverarbeitung unbrauchbar macht.

## Projektstatus

**Version 2607.01.0 – erster main-Release und früher Technikprototyp.** Der
aktuelle Stand demonstriert bereits:

- lokalen Dateiimport für ASCII-DXF und GeoJSON,
- eine vereinheitlichte interne Geometriestruktur,
- räumliche Clustererkennung ohne quadratischen Vollvergleich,
- Erkennung entfernter Zeichnungsgruppen,
- Gegenüberstellung von Gesamt-Ausdehnung und empfohlenem Fokusbereich,
- vorsichtige CRS-Plausibilitätsanalyse,
- Z=0-Hinweise bei gemischten 2D-/3D-Daten,
- getrennte Übersicht- und Fokusvorschau,
- eigene Vorschau für den vermuteten Störbereich mit vorsichtiger
  `prüfen`-/`Entfernung empfohlen`-Kennzeichnung,
- OpenStreetMap-Plausibilitätsansicht für georeferenzierte Cluster,
- DXF-/GeoJSON-Geometrieüberlagerung auf OSM mit Haupt-/Störbereichsgrenzen,
- explizite Hauptbereichswahl aus dem Kartenkontext,
- sofortige Deutsch-/Englisch-Umschaltung mit lokal gespeicherter Auswahl,
- einen reproduzierbaren Demo-Datensatz.

Der Prototyp schreibt die Quelldatei noch nicht zurück. Die Bereinigung und der
verlustbewusste Export sind als eigene, nachgelagerte Meilensteine geplant.

## Schnellstart

```bash
npm install
npm run dev
```

Die Anwendung läuft standardmäßig unter <http://127.0.0.1:5174>.

## Qualitätsprüfung

```bash
npm run test
npm run build
```

## Versionierung

Die sichtbare Release-Version verwendet `JJMM.RR.P`, aktuell `2607.01.0`:

- `JJMM`: Jahr und Monat,
- `RR`: zweistellige Releasefolge innerhalb des Monats,
- `P`: Subversion/Hotfix.

Funktionsreleases erhöhen `RR`, kleine Nachträge `P`; im neuen Monat beginnt die
Folge wieder bei `01.0`. Wegen der SemVer-Regeln ohne führende Nullen steht in
`package.json` und `package-lock.json` technisch `2607.1.0`. Die App,
Dokumentation und exportierten Prüfberichte verwenden `2607.01.0`.

## Leitprinzipien

1. **Local first:** Geodaten verlassen den Browser nicht.
2. **Inspect before clean:** Zuerst erklären und visualisieren, dann entscheiden.
3. **No silent loss:** Nicht unterstützte CAD-Entitäten und Näherungen werden bilanziert.
4. **CRS honesty:** Eine Koordinatenheuristik ist kein sicherer EPSG-Nachweis.
5. **Reversible decisions:** Bereinigungen werden als explizite Auswahl und Bericht geführt.
6. **Format-neutral core:** Analyse und Vorschau arbeiten auf einem gemeinsamen Modell,
   unabhängig davon, ob die Quelle DXF, GeoJSON oder später DWG ist.

Die Geometrie wird weiterhin lokal verarbeitet. Die optionale OSM-Vorschau
ruft jedoch sichtbare Rasterkacheln online ab; der Kartenanbieter kann dadurch
den angezeigten Ausschnitt und die IP-Adresse erkennen. Es werden keine Kacheln
vorgeladen oder für Offline-Nutzung gesammelt.

## Dokumentation

- [Produkt- und UX-Konzept](docs/PRODUCT-DESIGN.md)
- [Product and UX concept (English)](docs/PRODUCT-DESIGN.en.md)
- [Architektur](docs/ARCHITECTURE.md)
- [Analyse- und Qualitätsregeln](docs/ANALYSIS-RULES.md)
- [Umsetzungsplan](docs/IMPLEMENTATION-PLAN.md)
- [ADR: DWG-Strategie](docs/ADR-001-DWG-STRATEGY.md)
- [Lernlog](docs/LERNLOG.md)
- [Copyright- und Lizenzübersicht](docs/COPYRIGHT-LICENSES.md)

## Versionshistorie

| Version | Datum | Inhalt |
|---|---|---|
| `2607.01.0` | 12. Juli 2026 | Erster main-Release mit DXF-/GeoJSON-Analyse, Cluster- und CRS-Prüfung, drei Vorschaufenstern, OSM-Geometrieüberlagerung, DE/EN-Oberfläche und realen privaten Regressionsfixtures. |


## Herkunft der Idee

Das Projekt extrahiert und erweitert die beim DXF-/GeoJSON-Import des
`pointcloud-manager` entstandene „Nirvana“-Prüfung. Es ist bewusst eine
eigenständige Anwendung: keine Punktwolkenwerkzeuge, kein Messeditor und keine
Abhängigkeit vom Viewer-Zustand des Ursprungsprojekts.

## Lizenz

Noch nicht festgelegt. Das Repository bleibt bis zur Lizenz- und
DWG-Strategieentscheidung privat. Insbesondere eine mögliche Verwendung von GNU
LibreDWG würde wegen GPLv3+ die Lizenzarchitektur beeinflussen und darf nicht
beiläufig als Abhängigkeit aufgenommen werden.
