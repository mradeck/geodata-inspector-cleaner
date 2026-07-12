# Umsetzungsplan

**Status:** initialer Backlog  
**Planungsprinzip:** erst nachvollziehbare Analyse, dann verlustbewusste
Bereinigung, danach zusätzliche Formate.

## Phase 0 – Projekt- und Designbasis

- [x] eigenständiges Vite-/TypeScript-Projekt
- [x] normalisiertes Geometriemodell
- [x] erste DXF-/GeoJSON-Adapter
- [x] Clusteranalyse als pure Logik
- [x] Gesamt- und Fokusvorschau
- [x] Produkt-, Architektur- und Analysedokumente
- [x] DWG-Entscheidungsdokument
- [x] Unit-Tests für Kernfälle

## Phase 1 – belastbarer Inspector-MVP

### Parserinventar

- [ ] DXF-Version, Units, EXTMIN/EXTMAX und relevante Headerfelder lesen
- [ ] Modelspace und Paperspace unterscheiden
- [ ] BLOCKS und INSERT-Transformationen expandieren
- [ ] ARC, CIRCLE, ELLIPSE und SPLINE für Bounds ausreichend abbilden
- [ ] TEXT, MTEXT, DIMENSION, LEADER und MLEADER inventarisieren
- [ ] HATCH-Grenzen und Löcher erfassen
- [ ] XREFs und Proxy-Objekte melden
- [ ] binäre DXF-Dateien eindeutig ablehnen oder konvertieren
- [ ] vollständige Verlust- und Näherungsbilanz

### Analyse

- [ ] Multi-Skalen-Clusterung evaluieren
- [ ] manuell wählbaren Hauptbereich ergänzen
- [ ] optionale Referenz-Bounds importieren
- [ ] Cluster nach Layern und Entitätstypen aufschlüsseln
- [ ] Entfernungs- und Extent-Wirkung pro Cluster berechnen
- [ ] ungültige Koordinaten und extreme Z-Werte prüfen
- [ ] gemischte CRS-Anzeichen erkennen

### UX

- [ ] gekoppelte Auswahl zwischen Befundliste und Vorschau
- [ ] Zoom, Pan und Box-Zoom
- [ ] Cluster einzeln isolieren
- [ ] Layer-/Entitätstypfilter
- [ ] Vorher-/Nachher-Bounds vergleichen
- [ ] Analysebericht als JSON und Markdown exportieren
- [ ] barrierearme Tastaturbedienung

## Phase 2 – Cleaning und Export

- [ ] `CleaningPlan` als getrenntes, serialisierbares Modell
- [ ] Gruppen- und Einzelentscheidung
- [ ] Undo/Redo innerhalb einer Sitzung
- [ ] bereinigter GeoJSON-Export mit Property-Erhalt
- [ ] DXF-Roundtrip-Strategie implementieren
- [ ] Quellversion und Layerstruktur möglichst erhalten
- [ ] Änderungsprotokoll mit IDs, Gründen und Bounds-Wirkung
- [ ] automatischer Reimport des Ergebnisses zur Validierung
- [ ] Vergleich der Entity- und Layerzahlen vor/nach Export

## Phase 3 – Performance und robuste Dateiverarbeitung

- [ ] Parser und Analyse in Web Worker verschieben
- [ ] Fortschritt und Abbruch
- [ ] Streaming-Parser für große ASCII-DXF-Dateien
- [ ] WebGL-Renderpfad ab definierter Elementzahl
- [ ] Geometrievereinfachung nur für die Vorschau
- [ ] Speicherbudgets und Größenlimits
- [ ] Performance-Benchmarks mit Referenzdateien

## Phase 4 – CRS und GIS-Vertiefung

- [ ] `proj4` nur nach bestätigter CRS-Auswahl integrieren
- [ ] CRS-Metadaten aus DXF-Header/XDATA prüfen
- [ ] GeoJSON-RFC-7946-Regeln deutlich ausweisen
- [ ] definierte Reprojektion in ein Ziel-CRS
- [ ] Achsenreihenfolge und Einheiten dokumentieren
- [ ] optional OSM-Hintergrund erst nach sicherem CRS

## Phase 5 – DWG

- [ ] Testkorpus repräsentativer DWG-Versionen erstellen
- [ ] Lizenzziel des Gesamtprojekts festlegen
- [ ] Entscheidung zwischen externer Konvertierung, Desktop-Sidecar,
  LibreDWG oder kommerziellem SDK treffen
- [ ] Konverter in einer isolierten Schnittstelle anbinden
- [ ] Konvertierungsverluste ausweisen
- [ ] DWG → normalisiertes Modell → Analyse validieren
- [ ] DWG-Ausgabe nur bei ausdrücklich gewählter, rechtlich und technisch
  belastbarer Lösung

## Vorgeschlagene Meilensteine

| Meilenstein | Ergebnis | Grobe menschliche Arbeit |
|---|---|---:|
| M0 Designprototyp | aktueller Stand | 3–6 Tage |
| M1 Inspector-MVP | belastbare Analyse und Vorschau | 3–5 Wochen |
| M2 Cleaner | GeoJSON- und sicherer DXF-Export | 2–4 Wochen |
| M3 Large-file | Worker, Streaming, WebGL-Pfad | 2–5 Wochen |
| M4 DWG-Prototyp | ein gewählter Konvertierungspfad | 2–6 Wochen plus Lizenzklärung |

Die Angaben beziehen sich auf eine erfahrene menschliche Vollzeitkraft. Reale
CAD-Testdateien und fachliche Abnahmen sind ein wesentlicher Teil des Aufwands.

## Definition of Done für einen öffentlich nutzbaren MVP

- keine still verworfenen Entitäten
- dokumentierte Grenzen je DXF-Version und Entitätstyp
- deterministische Analyse
- belastbare Tests mit realen positiven und negativen Fällen
- bestätigte Vorschau vor jeder Bereinigung
- Reimportprüfung für erzeugte Dateien
- Datenschutz- und Lizenzdokumentation
- getestete aktuelle Chromium-, Firefox- und Safari-Versionen
