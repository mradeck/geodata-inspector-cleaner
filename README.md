# geodata-inspector-cleaner

Lokale Single-Page-App zur Inspektion und kontrollierten Bereinigung von DXF-
und GeoJSON-Dateien. Der Schwerpunkt liegt auf Geometrie, die weit außerhalb
des eigentlichen Projektbereichs liegt und dadurch Folgeprozesse wie „Zoom all",
Bounds-Berechnungen, Exporte und GIS-/CAD-Weiterverarbeitung unbrauchbar macht.

**Live-Anwendung:** [geodata-inspector-cleaner.netlify.app](https://geodata-inspector-cleaner.netlify.app/)

## Projektstatus

**Version 2607.01.3 – lokaler Entwicklungsstand mit aktivem Cleaner.** Der
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
- kontrollierten DXF-/GeoJSON-Cleaning-Export nach manueller Bestätigung,
- Layer- und Objekttypfilter mit DXF-Farbe, Linientyp, Linienstärke und
  Layerstatus,
- GeoJSON-zu-DXF-Konvertierung mit beibehaltener Layerstruktur,
- wählbaren DXF-Zielformaten AutoCAD 2000 (`AC1015`) und AutoCAD 2018
  (`AC1032`) mit lokal gespeicherter Vorauswahl,
- automatische Reimport-Prüfung von Feature-Anzahl, Clusterzahl und Bounds,
- sofortige Deutsch-/Englisch-Umschaltung mit lokal gespeicherter Auswahl,
- ein dauerhaft gespeichertes helles oder dunkles Interface,
- eine integrierte Hilfeseite, die diese README-Dokumentation als lesbares HTML
  darstellt,
- eine zweisprachige „Über mich“-Ansicht mit Hintergrund und Projektlinks von
  Michael Radeck,
- einen reproduzierbaren Demo-Datensatz.

Die Quelldatei wird niemals überschrieben. Der Cleaner erzeugt eine neue Datei
mit dem Suffix `-cleaned` und prüft sie vor dem Download durch einen internen
Kontrollimport.

## Hilfe, Sprache und Darstellung

Der frühere **Konzept**-Button in der Kopfleiste ist durch **Hilfe** ersetzt.
Die Hilfeseite rendert den Inhalt dieser `README.md` direkt als formatiertes
HTML. Dadurch bleiben Bedienhinweise, Exportgrenzen, Versionsangaben und
Screenshots an einer einzigen redaktionellen Quelle gebunden. Das weiterhin
versionierte Produkt-/UX-Konzept ist über den Dokumentationsabschnitt dieser
README erreichbar, aber nicht mehr die primäre Anwenderhilfe.

Die Sprachschaltfläche wechselt die Bedienoberfläche unmittelbar zwischen
Deutsch und Englisch und speichert die Auswahl lokal im Browser. Die Hilfe-
Navigation folgt dieser Auswahl; die eigentliche README-Fachdokumentation wird
derzeit in ihrer gepflegten deutschen Originalfassung angezeigt.

Über die Sonnen-/Mondsymbol-Schaltfläche lässt sich die gesamte Oberfläche
zwischen hellem und dunklem Design umstellen. Die Wahl gilt auch für die
Hilfeseite und bleibt unter `gic.theme` lokal gespeichert. Es werden dafür keine
Einstellungen an einen Server übertragen.

**Über mich** öffnet eine zweisprachige Kurzvorstellung von Michael Radeck. Die
Texte wurden aus dem Pointcloud Manager übernommen und um den Bezug zum Geodata
Inspector & Cleaner ergänzt. Verlinkt sind Multikopterschule XMS,
DroneMediaMunich, XING und Crew United.

## Störbereich entfernen und bereinigte Datei speichern

Der Cleaner arbeitet absichtlich in zwei getrennten Schritten: Die App schlägt
zunächst einen Hauptbereich vor, entfernt aber noch nichts. Erst die ausdrückliche
Bestätigung durch den Anwender schaltet den Export frei.

1. DXF oder GeoJSON laden beziehungsweise das Beispiel öffnen.
2. Den grünen Projektbereich, seinen blauen Bounds-Rahmen und den roten
   Störbereich in den Vorschauen und auf der OSM-Karte prüfen.
3. Im Kartenabschnitt beim korrekten Cluster auf **Hauptbereich bestätigen**
   klicken. Bei einem CRS-gestützten Vorschlag ist dieser Schritt ebenfalls
   zwingend; die CRS-Heuristik allein darf keine Geometrie löschen.
4. Unterhalb der Karten in der **Objekt- und Layerübersicht** festlegen, welche
   Kombinationen aus Layer und Geometrietyp erhalten bleiben. Einzelpunkte sind
   wie im Pointcloud-Manager zunächst abgewählt.
5. Im Abschnitt **04 · Cleaner** die Bilanz „behalten / entfernen“ prüfen.
6. **Bereinigte DXF speichern** beziehungsweise **Bereinigtes GeoJSON
   speichern** wählen.
7. Die erzeugte Datei in CAD/GIS öffnen und dort insbesondere **Zoom all**, die
   Lage, die Layer und die Geometrieanzahl kontrollieren.

Die App benennt die neue Datei beispielsweise
`bestandsplan-cleaned.dxf`. Die ursprüngliche Datei bleibt byteweise
unangetastet und kann jederzeit erneut analysiert werden.

### 1. Projekt- und Störbereich im Kartenkontext prüfen


### 2. Hauptbereich bestätigen und Export freigeben


### Was die bereinigte DXF technisch enthält

Der DXF-Export übernimmt die in `pointcloud-manager` bewährte Exportstrategie
und passt sie an das formatneutrale Feature-Modell dieser App an. Es wird keine
potenziell beschädigte Teilkopie der Quell-DXF geschrieben, sondern eine neue,
normalisierte ASCII-DXF erzeugt:

- Maßeinheit Meter über `$INSUNITS = 6` für deklarierte projizierte CRS;
  geografische oder nicht deklarierte GeoJSON-Koordinatensysteme werden beim
  DXF-Export sicherheitshalber als einheitenlos markiert,
- neu berechnete `$EXTMIN`- und `$EXTMAX`-Werte des bestätigten Hauptbereichs,
- CRS-Hinweis als DXF-Kommentar, sofern ein CRS deklariert ist,
- nachvollziehbares Cleaning-Protokoll mit Quelldatei, Anzahl der behaltenen und
  entfernten Features sowie den bestätigten Bounds,
- bereinigte, CAD-taugliche Layernamen,
- ACI-Farbe und True-Color je Layer,
- Punkte als `POINT`, offene Linien als `POLYLINE` und geschlossene Flächen als
  geschlossene `POLYLINE`,
- ausschließlich Features des manuell bestätigten Hauptclusters.

### DXF-Version und CAD-Kompatibilität auswählen

Im Cleaner gilt die DXF-Versionsauswahl sowohl für bereinigte DXF-Dateien als
auch für GeoJSON→DXF-Konvertierungen:

- **AutoCAD 2000 (`AC1015`)** ist der Default. Dieses Profil ist für strenge
  AutoCAD-OEM-Programme ausgelegt und entspricht der im Pointcloud-Manager
  getesteten Variante, die beispielsweise in DATAFLOR GREENXPERT nicht nur
  geöffnet, sondern auch weiterkopiert werden kann.
- **AutoCAD 2018 (`AC1032`)** richtet sich an moderne AutoCAD-Workflows und
  kennzeichnet die Datei ausdrücklich als aktuelleres Format mit offiziellem
  TrueColor-Support.

Die Wahl wird lokal im Browser gespeichert. Beide Profile verwenden dasselbe
vollständige, vom Pointcloud-Manager übernommene DXF-Gerüst: fortlaufende
Handles, Subclass-Marker, alle erwarteten Standardsymboltabellen,
`*Model_Space`/`*Paper_Space`, `BLOCKS`, PlotStyle-Sentinel und das
Named-Object-`DICTIONARY` in `OBJECTS`. Es wird also nicht lediglich der
`$ACADVER`-Text ausgetauscht. Nach dem Export durchläuft jede Variante den
internen Kontrollimport.

### GeoJSON als DXF exportieren

Nach einem GeoJSON-Import bietet der Cleaner zusätzlich **Als DXF exportieren**
an. Hauptbereichs- und Layer-/Typentscheidung gelten genauso wie beim normalen
Cleaning-Export. Werden Objekte entfernt, heißt die Ausgabe `*-cleaned.dxf`;
bei einer reinen Formatkonvertierung `*-converted.dxf`.

Die Konvertierung übernimmt die Koordinaten unverändert und führt keine
stillschweigende Reprojektion durch. Ein projiziertes CRS wie `EPSG:25832` wird
als metrische DXF ausgegeben. `EPSG:4326`, CRS84 oder ein fehlendes CRS führen zu
einer einheitenlosen DXF mit entsprechendem Kommentar. Vor der Weitergabe ist
die Lage deshalb im Ziel-CAD zu prüfen.

Danach liest die App den erzeugten Text mit dem eigenen Importer erneut ein. Der
Download wird nur angeboten, wenn Feature-Anzahl, genau ein räumlicher Cluster
und die Bounds des bestätigten Bereichs übereinstimmen. Das reale Referenzpaar
ist als Regressionstest abgedeckt: Aus der unbereinigten Datei mit 200 Features
entsteht der bestätigte 99-Feature-Projektbereich mit denselben Bounds wie in der
bereitgestellten, bereits gefilterten Kontroll-Datei.

### Bewusste Grenzen des normalisierten Exports

Der Export ist geometrisch und für robuste CAD-Bounds optimiert, aber kein
verlustfreier DXF-Roundtrip. Der Importer hat komplexe CAD-Entitäten bereits für
Analyse und Vorschau vereinheitlicht. Dadurch gelten insbesondere:

- `TEXT`, `MTEXT`, Blockattribute und vergleichbare Beschriftungselemente werden
  derzeit nur über ihren analysierten Ankerpunkt als `POINT` ausgegeben.
- Kreise, Bögen, Ellipsen und Splines werden entsprechend der beim Import
  gemeldeten Näherung als Polylinien exportiert.
- Blockstruktur, Layout-/Paper-Space-Inhalte, Linientypdetails, Hatch-Muster,
  XData, Handles und sonstige nicht in das interne Feature-Modell übernommene
  CAD-Semantik werden nicht rekonstruiert.
- Übersprungene oder angenäherte Entitäten stehen als Importwarnungen in der
  Oberfläche und im Prüfbericht. Diese Warnungen sind vor dem Export fachlich zu
  bewerten.

Für den konkreten Anwendungsfall „entfernten Plankopf beseitigen, damit Zoom all
wieder den Projektbereich zeigt“ ist die Normalisierung ein Sicherheitsgewinn:
veraltete globale Extents und Referenzen auf entfernte Entity-Strukturen werden
nicht in die neue Datei mitgeschleppt. Wenn ein Projekt jedoch vollständig
editierbare Texte, Blöcke oder native Kurven benötigt, muss die Ausgabe zusätzlich
in den vorgesehenen CAD-Anwendungen geprüft oder später um einen
entitätserhaltenden Exportpfad erweitert werden.

## Schnellstart

Die veröffentlichte Web-App ist unter
[https://geodata-inspector-cleaner.netlify.app/](https://geodata-inspector-cleaner.netlify.app/)
direkt im Browser nutzbar. Für lokale Entwicklung:

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

Die sichtbare Release-Version verwendet `JJMM.RR.P`, aktuell `2607.01.3`:

- `JJMM`: Jahr und Monat,
- `RR`: zweistellige Releasefolge innerhalb des Monats,
- `P`: Subversion/Hotfix.

Eine bewusst eröffnete größere Release-Linie erhöht `RR` und setzt `P` auf `0`.
Jede abgeschlossene lokale Feature-Runde und jeder Bugfix erhöht anschließend
`P`, sodass der aktive Stand direkt im lokalen Dev-Server erkennbar ist. Wegen
der SemVer-Regeln ohne führende Nullen steht in `package.json` und
`package-lock.json` technisch `2607.1.3`. Die App, Dokumentation und exportierten
Prüfberichte verwenden `2607.01.3`.

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
| `2607.01.3` | 13. Juli 2026 | README-basierte Hilfeseite statt Konzept-Schaltfläche, übernommene und zweisprachig ergänzte „Über mich“-Information sowie lokal gespeicherter Hell-/Dunkelmodus für App und Hilfe. |
| `2607.01.2` | 13. Juli 2026 | DXF-Zielformate AC1015/AutoCAD 2000 und AC1032/AutoCAD 2018 mit gespeicherter Auswahl sowie vollständigem OEM-kompatiblem DXF-Gerüst aus dem Pointcloud-Manager. |
| `2607.01.1` | 12. Juli 2026 | Cleaner mit normalisiertem DXF-Export, Haupt-/Störbereichskarten, CRS-gestützter Hauptbereichswahl, Layer-/Objekttypfilter und DXF-Layermetadaten, GeoJSON→DXF-Konvertierung, Inter-Typografie und lokal sichtbarer Patchversion. |
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
