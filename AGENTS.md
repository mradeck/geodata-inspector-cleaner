# geodata-inspector-cleaner – Projektkontext

## Projekt-Stammdaten

- **Projektname:** geodata-inspector-cleaner
- **Typ:** lokale Single-Page-App zur DXF-/GeoJSON-Inspektion
- **Aktuelle Release-Version:** `2609.3.8`
- **npm-kompatible Version:** `2609.3.8`
- **Repository:** privates GitHub-Repository `mradeck/geodata-inspector-cleaner`
- **Tech-Stack:** Vite 8, TypeScript strict, Leaflet, proj4, marked, Vitest
- **README:** `README.md`
- **Lernlog:** `docs/LERNLOG.md`
- **Copyright-/Lizenzübersicht:** `docs/COPYRIGHT-LICENSES.md`

## Ziel

Lokale, datenschutzfreundliche Single-Page-App zur Inspektion und bewussten
Bereinigung räumlicher Auffälligkeiten in DXF- und GeoJSON-Dateien.

## Versionsschema und Subversionen

Die sichtbare und npm-kompatible Version folgt `JJMM.R.P`, ohne führende Null
im Release-Segment. `JJMM` ist das aktuelle Jahr/Monat; `R` bezeichnet die
Release-Linie und `P` die Subversion. Bei jeder abgeschlossenen Feature-/Bugfix-
Runde `P` erhöhen und den Kalendermonat ausdrücklich prüfen. Eine anderslautende
konkrete Versionsvorgabe des Nutzers hat Vorrang. Kein starrer alter Monatspräfix.

Für die Runde vom 28. September 2026 ist die vom Nutzer ausdrücklich gewünschte
Ausgangsversion **2609.3.3** vorgegeben; der anschließende Bugfix hat **2609.3.4**. Sie korrigiert zugleich den veralteten Juli-
Präfix und enthält die Schraffur-Umrissfunktion. `displayVersion`, package/lock,
HTML-Fallbacks und Dokumentation müssen übereinstimmen. Historische Versionen
bleiben als tatsächlich veröffentlichte Stände dokumentiert.

## Versionierungs-, Dokumentations- und Push-Regel

Jede vollständig umgesetzte und verifizierte Feature-Runde beziehungsweise jeder
Bugfix erhöht die lokale Subversion `P` vor der Übergabe automatisch. Dabei
werden `package.json`, `package-lock.json`, `displayVersion`, sichtbare
Dev-Server-Version, Berichtsversion, README, Lernlog und Versionshistorie
konsistent nachgezogen. So ist am lokalen Dev-Server unmittelbar erkennbar,
welcher Arbeitsstand aktiv ist.

Git-Commits, GitHub-Pushes und das Eröffnen einer neuen Release-Linie `RR`
erfolgen weiterhin **nur auf ausdrückliche Ansage des Nutzers**.

Wenn ein GitHub-Push, Release-Stand oder explizites Dokumentationsupdate
beauftragt ist, sind Release-Stand und Dokumentation konsistent nachzuziehen.

Pflichtschritte zum Abschluss jeder Feature-/Bugfix-Runde:

1. **Subversion erhöhen**
   - kanonische Release-Version bestimmen,
   - `package.json` und `package-lock.json` npm-kompatibel aktualisieren,
   - `displayVersion`, sichtbare App-Version und Berichtsversion aktualisieren,
   - README, AGENTS und Versionshistorie konsistent halten.
2. **README und Lernlog aktualisieren**
   - neue/geänderte Funktionen,
   - relevante Bedienänderungen,
   - Datenschutz-, Daten- und Nutzerhinweise.
3. **Projektkontext prüfen**
   - Version, Release-Stand, Arbeitsregeln und projektspezifische Fallstricke in
     `AGENTS.md` abgleichen.
4. **Copyright-/Lizenzübersicht prüfen**
   - `docs/COPYRIGHT-LICENSES.md` gegen `package.json`, `package-lock.json` und
     externe Dienste wie OpenStreetMap prüfen,
   - neue/entfernte Bibliotheken, Versionen, Lizenzen, Notices und
     Attributionspflichten aktualisieren,
   - Abhängigkeiten mit GPL, AGPL, Non-Commercial- oder unklaren Bedingungen
     ausdrücklich kennzeichnen und vor einer Veröffentlichung klären.
5. **Verifizieren**
   - `npm run test`,
   - `npm run build`,
   - `npm audit`,
   - `git diff --check`,
   - Versionskonsistenz und Repository-Sichtbarkeit prüfen.

Zusätzliche Pflichtschritte nur bei ausdrücklich beauftragtem Push:

6. **Bewusst committen und pushen**
   - nur den bestätigten Arbeitsumfang stagen,
   - aussagekräftigen Release-Commit erstellen,
   - den beauftragten Branch pushen,
   - Push-Ergebnis und Remote-Commit verifizieren.

Merksätze:

- **Jede abgeschlossene Feature-/Bugfix-Runde endet mit einer lokal sichtbaren Patchversion.**
- **Keine neue `RR`-Release-Linie und kein Git-Push ohne ausdrückliche Ansage.**
- **Kein Push ohne Versionssprung und aktualisierte Kerndokumentation.**
- **`push git` beziehungsweise `git push` meint den vollständigen
  Release-Ablauf einschließlich Lizenzcheck, Verifikation, Commit und Push.**

## Arbeitsregeln

- Quelldateien werden standardmäßig ausschließlich lokal im Browser verarbeitet.
- Keine Geometrie wird ohne ausdrückliche Benutzerentscheidung entfernt oder verändert.
- Analyseergebnisse unterscheiden Beobachtung, Empfehlung und angewendete Änderung.
- Koordinatensysteme werden nur dann als sicher erkannt bezeichnet, wenn die Datei
  sie eindeutig deklariert. Heuristiken werden immer als Kandidaten ausgewiesen.
- Reinigungs-Exporte brauchen ein nachvollziehbares Änderungsprotokoll.
- Neue Parser müssen Verluste, nicht unterstützte Entitäten und Näherungen melden.
- Reine Analysealgorithmen bleiben DOM- und Rendering-unabhängig und werden getestet.
- Große Weltkoordinaten werden erst beim Rendering um einen lokalen Ursprung verschoben.
- OSM-Kacheln nur interaktiv und viewportbezogen laden; sichtbare Attribution
  beibehalten, kein Prefetch/Offline-Download und Kartenprovider konfigurierbar halten.
- Sichtbare und barrierefreie UI-Texte in beiden zentralen Sprachkatalogen
  (`src/i18n/de.ts`, `src/i18n/en.ts`) ergänzen; Katalog-Parität testen.
- Die Anwenderhilfe rendert `README.md` über `help.html`; Bedienänderungen müssen
  deshalb in der README so beschrieben sein, dass sie auch innerhalb der App als
  Hilfe verständlich bleiben. Das Produktkonzept bleibt separat versioniert.
- Das Kopfmenü `Über` rendert Copyright-/Lizenzinformationen dynamisch aus
  `docs/COPYRIGHT-LICENSES.md`. Diese Datei ist die einzige redaktionelle Quelle;
  der Dialog darf keine abweichende zweite Lizenzliste pflegen. Externe Demo-
  Links müssen Funktionslimits und Upgrade-/Upsell-Hinweise transparent benennen.
- Die kompakte Fußzeile teilt den vorhandenen Copyright-Dialog. Hilfe, Bugreport
  und Kontakt verwenden ein natives Dialogfenster und lokale `mailto:`-Links
  ohne automatische Datei-/Koordinatenanhänge. Externe Apps, Impressum und Ko-fi
  sind reine Links ohne Embed, Prefetch oder zusätzliche Laufzeitbibliothek.
- Hell-/Dunkelwahl wird ausschließlich lokal unter `gic.theme` gespeichert.
  Neue Oberflächen müssen in beiden Themes auf Kontrast und Lesbarkeit geprüft
  werden; Hauptansicht und Hilfeseite verwenden dieselbe Theme-Schicht.
- Die Störbereichsvorschau ist ein standardmäßig geschlossenes `details`-
  Element. Solange sie geschlossen ist, werden ihr Canvas und ihre Leaflet-Karte
  nicht gerendert; beim Öffnen müssen beide nach dem Layout-Frame mit der
  sichtbaren Größe neu aufgebaut werden. Analyse und Export bleiben unabhängig
  vom Offen-/Geschlossen-Zustand. Der geschlossene Zustand darf ausschließlich
  die Summary-Kopfzeile belegen; die spezifische
  `.preview-card.disturbance-preview-card`-Regel muss das allgemeine
  Preview-Grid deshalb überschreiben und darf sich im Elterngrid nicht strecken.
- Die rechte Seitenleiste scrollt nicht als Ganzes: Überschrift und Cleaner
  bleiben stehen, ausschließlich `.findings-list` wächst mit `flex: 1` und
  scrollt intern. Die DWG-Roadmap bleibt in der Dokumentation, erhält aber keine
  separate Kachel in der knappen Seitenleiste.
- Die Versionsnummer neben dem App-Titel, im Browser-Tab, in der Statuszeile und
  in Exportberichten stammt zentral aus `displayVersion`; keine zweite
  handgepflegte Laufzeitkonstante einführen.
- Die Haupt-App bindet `body` und `.app-shell` an `100vh` und hält den äußeren
  Viewport scrollbarfrei; `.stage` und `.sidebar` übernehmen langes Material
  intern. `concept.css` muss diese Regel für Hilfe-/Konzeptseiten mit
  `height:auto` und `overflow:auto` aufheben, damit Dokumente scrollbar bleiben.
- Das Raster der leeren Vorschau nutzt `--empty-grid-line` und
  `--empty-grid-accent` mit getrennten Werten für helles und dunkles Theme.
  Theme-Kontrast immer visuell prüfen, nicht nur die Variablendefinition.
- Das Analysefeld `CRS / EPSG` verwendet `EPSG:25832` als Standard, normalisiert
  Pointcloud-Manager-kompatible Schreibweisen und hält die manuelle Vorgabe in
  `InspectionReport.analysisCrs` getrennt von `GeoDataset.declaredCrs`. Eine
  Änderung muss Cluster-/Kartenanalyse neu ausführen und eine frühere manuelle
  Hauptbereichsbestätigung verwerfen. Exporter dürfen den Wert als CRS-Hinweis
  übernehmen, aber niemals stillschweigend Koordinaten reprojizieren.
- Reale DXF-Referenzfixtures gelten als sensibel. Sie dürfen nur nach
  ausdrücklicher Freigabe in ein weiterhin privates Repository gepusht werden.
  Eine öffentliche Freigabe benötigt eine gesonderte Anonymisierungs- und
  Rechteprüfung.

## DXF-Duplikatprüfung

- `src/duplicates/dxfDuplicates.ts` vergleicht originale Tags, niemals die
  approximierten `GeoFeature.points`. Klassische Polylinien und INSERT-Attribute
  bleiben zusammenhängende Sequenzen; Handle-Referenzen werden konservativ geprüft.
- Der DXF-Export ist ein gemeinsamer, strukturerhaltender Workflow. Die Auswahl
  startet gemäß Nutzerwunsch mit allen löschbaren Duplikaten. Nach erfolgreichem Export wird die bereinigte DXF als aktiver
  Datensatz neu analysiert; alle Ansichten und der nachfolgende Cleaner müssen
  diesen Stand nutzen. Alte Feature-IDs, Löschliste und Hauptbereichsbestätigung
  verwerfen, gültige CRS-Vorgabe beibehalten.
- Der Export darf nur bekannte, nicht gesperrte Kandidaten entfernen und
  muss den exakten Inhalt aller übrigen Entitäten beim Kontrollimport vergleichen.
- Den privaten HBF-Test optional mit `DXF_DUPLICATE_FIXTURE=/absoluter/pfad.dxf`
  aktivieren. Die Datei nicht in das Repository kopieren. Erwartung: 1285 Objekte,
  647 gleiche-Layer- und 30 zusätzliche Cross-Layer-Duplikate, 608 verbleibend.
- Die Version 2609.3.3 wurde für die September-Runde ausdrücklich vorgegeben.

IDBUFFER-Mitgliedsverweise (330 nach AcDbIdBuffer in OBJECTS) sind gezielt
entfernbar und im Exportbericht zu zählen. Owner-/Reactor- und unbekannte
Referenzen bleiben gesperrt. Übrige Entitäten bytegleich prüfen.

## Schraffurumrisse

- `src/hatches` erzeugt geschlossene LWPOLYLINE-Ränder aus HATCH-Boundary-Daten.
  Ursprung und Saatpunkte sind keine Randgeometrie. Schraffuren bleiben erhalten.
- OCS, Elevation, Layer und Owner erhalten; neue eindeutige Handles vergeben.
- Alle Innenringe übernehmen. Bei ungültigem Teilrand gesamte Schraffur auslassen
  und den Grund im UI/Protokoll nennen. Ellipsen-/Spline-Näherungen kennzeichnen.
- Ausgabe reimportieren und direkt als aktuellen Arbeitsstand übernehmen.
- Private Beispieldatei nur lokal über `HATCH_FIXTURE` testen; nicht einchecken.

Der normalisierte DXF-Cleaner unterdrückt eine HATCH-Vorschau nur, wenn alle
Ränder exakt durch ausgewählte geschlossene Polylinien desselben Layers
abgedeckt sind. Keine allgemeine Geometriededuplizierung. Eigene Bilanz und
Regression mit Original → Umrisse → Cleaner → Pointcloud-Manager prüfen.

Speichern zentral über saveTextFile: pro Datei frische Nutzeraktion, keine
persistierten Handles. Export-Callbacks abwarten; bei Abbruch keine
Datensatzübernahme. Protokolle separat anbieten.

## Gemeinsamer Export ab 2609.3.7

Nutzerwunsch hat Vorrang vor früherer Leer-/Bestätigungsvorgabe: löschbare
Duplikate und alle Nicht-Hauptbereiche vorauswählen; geeignete Umrisse aktiv.
Panels verändern nur Auswahl. Ausschließlich rechts unten exportieren.
DXF aus Originalquelle filtern, dann Umrisse aus verbliebenen HATCHs erzeugen.
Kein normalisierter Zweitexport. Geschützte/partielle Verbundobjekte behalten
und vorab bilanzieren. Quellzuordnung über sourceEntityId, nicht Vorschau-ID.
Prüfbericht optional, keine automatische zweite Datei. Nativen Speicherdialog
direkt öffnen; Vorschau-Exportplan steht bereits vor dem Klick bereit.

## Standardbefehle

| Zweck | Kommando |
|---|---|
| Entwicklung | `npm run dev` |
| Typprüfung und Build | `npm run build` |
| Tests | `npm run test` |
| Vorschau | `npm run preview` |

Der Entwicklungsserver läuft standardmäßig unter `http://127.0.0.1:5174`.

## Versionshistorie

| Version | Datum | Änderungen |
|---|---|---|
| `2609.3.8` | 2026-09-28 | Außenbereiche automatisch ausgewählt; eigene synchronisierte Export-Schalter mit Duplikat- und Schraffurzahlen. |
| `2609.3.7` | 2026-09-28 | Gemeinsamer DXF-Exportplan, automatische Vorauswahl, keine einzelnen Aktionsdownloads. |
| `2609.3.6` | 2026-09-28 | Speicherortwahl pro Datei, kein stiller Download-Fallback. |
| `2609.3.5` | 2026-09-28 | Normalisierter Cleaner exportiert vollständig durch ausgewählte Polylinien abgedeckte HATCH-Vorschauen nicht doppelt. |
| `2609.3.4` | 2026-09-28 | IDBUFFER-Mitgliedslisten beim Duplikatlöschen gezielt bereinigen; Schraffurkopien direkt auswählbar. |
| `2609.3.3` | 2026-09-28 | Monatspräfix gemäß Nutzer korrigiert; geschlossene Schraffurumrisse auf Quelllayern mit Innenringen, nativen Kreisbögen, gekennzeichneten Kurvennäherungen und aktualisiertem Arbeitsstand. |

| `2607.03.3` | 2026-09-22 | Weitere Apps, Hilfe/Bugreport/Kontakt, bestehende Lizenzübersicht, Impressum und Ko-fi in kompakter DE-/EN-Fußzeile. |
| `2607.03.2` | 2026-09-19 | Bereinigte DXF nach Duplikat-Export automatisch als Arbeitsstand übernehmen; Objektzahlen, Layer, Karten und Befunde neu berechnen. |
| `2607.03.1` | 2026-09-19 | Automatischer DXF-Duplikatcheck mit optionaler Löschliste, getrennten Layer-Kategorien, strukturerhaltendem Export und Kontrollimport. |
| `2607.03.0` | 2026-07-13 | Neue Release-Linie mit viewportgerechter Startansicht, Theme-Rastern, manuellem CRS-/EPSG-Analysefeld und verdichteter Ergebnis-GUI; konsolidiert 2607.02.1 bis 2607.02.3. |
| `2607.02.3` | 2026-07-13 | Geschlossene Störbereichsvorschau auf Summary-Höhe begrenzt, Befundliste intern scrollbar gemacht und Roadmap-Kachel aus der rechten Seitenleiste entfernt. |
| `2607.02.2` | 2026-07-13 | Manuell pflegbares CRS-/EPSG-Feld mit Default 25832, normalisierter Eingabe, automatischer Neuanalyse und zurückgesetzter Cleaner-Bestätigung bei CRS-Wechsel. |
| `2607.02.1` | 2026-07-13 | Startansicht an die Browserhöhe gebunden, äußerer vertikaler Scrollbalken entfernt und Vorschauraster für helles/dunkles Theme gezielt verstärkt. |
| `2607.02.0` | 2026-07-13 | Neue Release-Linie mit vollständiger Version neben App-Titel und im Browser-Tab sowie standardmäßig eingeklappter, bedarfsgerecht gerenderter Störbereichsvorschau; schließt 2607.01.4 ein. |
| `2607.01.4` | 2026-07-13 | Über-Menü mit Über-mich- und Copyright-Eintrag, dynamisch gerenderter Lizenzübersicht und transparent gekennzeichnetem Link zur reduzierten Pointcloud-Manager-Onlineversion. |
| `2607.01.3` | 2026-07-13 | README-basierte Hilfeseite statt Konzept-Schaltfläche, zweisprachige „Über mich“-Ansicht aus dem Pointcloud Manager und lokal gespeicherter Hell-/Dunkelmodus für Hauptansicht und Hilfe. |
| `2607.01.2` | 2026-07-13 | Wählbare DXF-Zielformate AC1015/AutoCAD 2000 und AC1032/AutoCAD 2018 mit gespeicherter Auswahl; vollständiges, OEM-gehärtetes DXF-Gerüst aus dem Pointcloud-Manager mit Handles, Subclass-Markern, Standardtabellen, BLOCKS und OBJECTS. |
| `2607.01.1` | 2026-07-12 | CRS-gestützte Hauptbereichswahl, Karten für Haupt-/Störbereich, normalisierter Cleaner-Export auf Basis des Pointcloud-Manager-Exporters, Layer-/Objekttypfilter mit DXF-Metadaten, GeoJSON→DXF-Konvertierung, Inter-Typografie und lokal sichtbares Patch-Versioning. |
| `2607.01.0` | 2026-07-12 | Erster main-Release mit lokalem DXF-/GeoJSON-Import, Cluster-/CRS-/Z-Analyse, drei Diagnosevorschauen, OSM-Geometrieüberlagerung, manueller Hauptbereichswahl, DE/EN-Umschaltung, lokalisierten Konzeptseiten und realen privaten Regressionsfixtures. |

## Entscheidungsdokumente

- Produkt und UX: `docs/PRODUCT-DESIGN.md`
- Product and UX (English): `docs/PRODUCT-DESIGN.en.md`
- Architektur: `docs/ARCHITECTURE.md`
- Analyseverfahren: `docs/ANALYSIS-RULES.md`
- Umsetzungsplan: `docs/IMPLEMENTATION-PLAN.md`
- DWG-Strategie: `docs/ADR-001-DWG-STRATEGY.md`
- Lernlog: `docs/LERNLOG.md`
- Copyright und Lizenzen: `docs/COPYRIGHT-LICENSES.md`
