# Architektur

**Status:** initiale Zielarchitektur  
**Datum:** 12. Juli 2026

## 1. Grundentscheidung

Die erste Version ist eine statisch auslieferbare, lokale SPA mit Vite und
strengem TypeScript. Dateien werden im Browser gelesen und verlassen das Gerät
nicht.

Die Architektur trennt fünf Schichten:

```mermaid
flowchart TB
    UI["UI und Interaktionszustand"]
    Render["2D-Vorschau"]
    Analyze["Formatneutrale Analyse"]
    Model["Normalisiertes Geometriemodell"]
    Import["DXF-/GeoJSON-Adapter"]
    Export["Bericht und formatbezogene Exporte"]

    Import --> Model
    Model --> Analyze
    Analyze --> UI
    Model --> Render
    Analyze --> Render
    UI --> Export
    Model --> Export
```

## 2. Normalisiertes Modell

Alle Importer liefern `GeoDataset` mit:

- Quelldatei und Format
- optional deklariertem CRS
- normalisierten Features
- Layername und Quellentitätstyp
- 64-Bit-JavaScript-Koordinaten
- Importwarnungen und Verlustbilanz

Analyse und Vorschau kennen keine DXF-Group-Codes oder GeoJSON-Struktur. Dadurch
kann später ein DWG-Konverter denselben Modellvertrag bedienen.

## 3. Koordinatenpräzision

JavaScript-Zahlen bleiben im Kern `Number`/Float64. Erst der Renderer berechnet
pro View eine lokale Transformation:

```text
Bildschirmkoordinate = (Weltkoordinate - View-Ursprung) × Maßstab
```

Dadurch bleiben große Vermessungskoordinaten stabil. Eine frühe Umwandlung in
`Float32` ist zu vermeiden.

## 4. Analyse-Engine

Die Engine ist rein funktional und unabhängig von DOM und Canvas. Sie erzeugt:

- Feature-Statistiken
- räumliche Cluster
- Hauptcluster-Kandidat
- vollständige und fokussierte Bounds
- Ausdehnungsfaktor
- Z-Statistik
- CRS-Plausibilitäten
- Befunde mit betroffenen Feature-IDs
- Empfehlungen, aber keine Mutation der Quelldaten

Für die Clusterbildung wird ein räumliches Grid mit Union-Find verwendet. Damit
müssen nicht alle Featurepaare miteinander verglichen werden. Das Ziel ist ein
annähernd linearer Pfad für typische, lokal dichte Zeichnungen.

## 5. Rendering

Der Prototyp verwendet Canvas 2D:

- geringe Abhängigkeiten
- gute Eignung für eine 2D-Diagnoseansicht
- einfache lokale Origin-Verschiebung
- Übersicht und Fokus können mit demselben Renderer erzeugt werden

Für sehr große Dateien bleibt ein WebGL-Renderer als spätere Ausbaustufe offen.
Die normalisierte Daten- und Analyseebene darf davon nicht abhängen.

## 6. Verarbeitung großer Dateien

Mittelfristig werden Parser und Analyse in Web Worker verschoben. Zielpfad:

```text
File/Blob
  → Parser-Worker
  → normalisierte Chunks und laufendes Inventar
  → Analyse-Worker
  → Render-Batches und Befunde
  → UI
```

Für sehr große ASCII-DXF-Dateien ist ein Streaming-Parser sinnvoll. Der
Prototyp liest zunächst den gesamten Text, dokumentiert diese Grenze aber
explizit.

## 7. Cleaning und Roundtrip

Analyse und Bereinigung sind getrennt:

1. `InspectionReport` beschreibt den unveränderten Datensatz.
2. `CleaningPlan` speichert explizite Entscheidungen.
3. Eine Vorschau zeigt die daraus entstehenden Bounds.
4. Ein formatbezogener Exporter erzeugt die Zieldatei.
5. `CleaningAudit` dokumentiert entfernte, transformierte und unveränderte Inhalte.

Bei DXF ist ein „Textzeilen löschen“-Ansatz riskant, weil BLOCKS, INSERTs,
Handles, Owner-Beziehungen und referenzierte Objekte zusammenhängen können.
Der DXF-Exporter braucht deshalb vor Freigabe eine klare Roundtrip-Strategie und
Referenztests.

## 8. Sicherheit und Datenschutz

- keine Dateiübertragung im Standardbetrieb
- keine dynamische Codeausführung aus CAD-Inhalten
- Texte werden nur als Text behandelt, nicht als HTML gerendert
- externe Links verwenden feste, geprüfte URLs
- potenzielle native DWG-Konverter werden nie mit frei manipulierbaren
  Kommandozeilenargumenten gestartet
- Größen- und Laufzeitlimits schützen vor absichtlich problematischen Dateien

## 9. Erweiterungspunkte

- zusätzliche DXF-Entitäten und BLOCK-Expansion
- Referenzdatei oder manuell gesetzte Projekt-Bounds
- räumliche Multi-Skalen-Clusterung
- Duplikat- und Near-Duplicate-Erkennung
- Selbstschnitt-, Nullsegment- und Ringvalidierung
- CRS-Transformation mit `proj4`
- WebGL-Vorschau
- PWA-/Desktop-Verpackung
- DWG-Konvertierungsadapter
