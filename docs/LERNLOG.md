# Lernlog

Technische Erkenntnisse, Fehlerbilder und belastbare Lösungen des Projekts.
Das Lernlog wird zum Abschluss jeder Feature-/Bugfix-Runde und zusätzlich vor
jedem beauftragten Git-Push aktualisiert.

## Release-Prüfung 2610.3.18

Nutzer hat den Push des gesamten lokalen Standes 2610.3.16–2610.3.18 freigegeben.
161 Tests bestanden, 8 optionale Tests übersprungen; Produktionsbuild,
Diff-Prüfung und Versionskonsistenz erfolgreich. Lizenzübersicht aktuell,
keine neuen Abhängigkeiten. Audit: vier bestehende Entwicklungsbefunde,
keine Produktionsbefunde. Öffentlicher main-Stand 0b26b06 als Grundlage.
Private Reparaturvorlage und reale Vermessungsdateien bleiben außerhalb des Commits.

## 3. Oktober 2026 – Helles Interface und kompakte Exportkachel 2610.3.18

Theme-Fallback von dunkel auf hell geändert; gespeicherte Wahl bleibt erhalten.
HTML startet ebenfalls hell. Exportdetails in initial geschlossenes details-Element
verschoben; Kurzbilanz und Exportbutton bleiben außerhalb. Bei neuem Datensatz
zuklappen, bei Auswahländerungen den Öffnungszustand erhalten. Kachelhöhe begrenzt,
damit die Befunde Platz behalten. Keine neuen Abhängigkeiten oder Lizenzänderungen.
161 Tests bestanden, 8 optionale Tests übersprungen; Build und Diff erfolgreich.
Browsertest im hellen Design: initial zugeklappt, Auf-/Zuklappen funktionsfähig,
Exportbutton außerhalb der Details. Audit weiterhin vier Entwicklungsbefunde,
keine Produktionsbefunde. Repository unverändert öffentlich.

## 3. Oktober 2026 – OSM in Auswahlkarten 2610.3.17

Lokale XY-Ansichten reichten dem Nutzer zur räumlichen Orientierung nicht aus.
Export- und Einpunkt-Karte besitzen nun eigene OSM-Schalter, standardmäßig an.
Bestehende CRS-Projektion und Kachelprovider wiederverwendet. Originalkoordinaten
bleiben unverändert; fehlende/nicht projizierbare Geometrie führt zur vollständigen
lokalen Ansicht mit Hinweis statt stillem Auslassen. Beim Umschalten neu einpassen;
Einpunkt-Karte bleibt auf ihre eigenen Befunde beschränkt. Kacheln erst nach Fit
laden, Attribution und Datenschutzhinweis anzeigen. Keine neuen Abhängigkeiten.
Verifiziert: 161 Tests bestanden, 8 optionale Tests übersprungen; Build und Diff
fehlerfrei. Browser mit synthetischen UTM-Daten: Kacheln/Attribution sichtbar,
Schalter unabhängig, Umwandlungsmarker und objektbezogenes Fit erhalten.
Audit unverändert: vier Entwicklungsbefunde, keine Produktionsbefunde. Öffentliches
Repository unverändert; kein Push ohne erneuten Auftrag.

## 3. Oktober 2026 – Datenerhalt und Kartenkontrolle 2610.3.16

Ursache des Datenverlusts: buildDefaultSelection wählte point-Kategorien pauschal
ab, classifyFeature ordnete auch Beschriftungsanker dort ein. Das war keine
Fehlererkennung. Jetzt alle Kategorien erhalten; Annotationen und Blöcke getrennt.
Keine automatisch abgewählten Außenbereiche; Cross-Layer und Schraffuren opt-in.
Standardexport strukturerhaltend; Geometrie-only ausdrücklich optional, Z bleibt.
Punktbegleiter über direkte Handle-Verweise/exakte XY-Anker; überlebende Punktkopien
schützen gemeinsame Labels. Keine Nächstpunkt-Heuristik für versetzte Beschriftungen.
Lokale interaktive Exportkarte aus tatsächlichen Aktionen, inklusive Begleitern;
eigene Einpunktkarte mit Auto-Fit nur auf Befunde. Private Original-Wacker-Datei
in den durchsuchten Verzeichnissen nicht vorhanden; Pfad beim Nutzer erfragt.
158 Tests erfolgreich, 8 optionale Tests übersprungen; Build und Diff-Prüfung
bestanden. Synthetischer Browsertest: Punktfilter und direkter Kartenklick entfernen
POINT + zugeordnetes MTEXT; Reset behält beide wieder. Einpunktkarte mit Auto-Fit
und Aktionsfarben geprüft. Audit: vier bestehende Entwicklungsbefunde, keine
Produktionsbefunde. Keine neuen Abhängigkeiten; Repository weiterhin öffentlich.

## Release-Prüfung 2610.3.15

Push vom Nutzer freigegeben. 152 Tests und Produktionsbuild erfolgreich,
8 optionale Tests übersprungen. Versionen und Diff geprüft; Lizenzübersicht
aktuell. Audit unverändert: vier Entwicklungsbefunde, keine Produktionsbefunde.
Öffentlicher main-Stand e014302 als Grundlage; private Reparaturvorlage bleibt lokal.

## 3. Oktober 2026 – Windows-Sprachflaggen 2610.3.15

Flaggen-Emojis können unter Windows als Länderbuchstaben erscheinen; dadurch
wirkte der deutsche Sprachbutton wie „DE DE“. Lokale SVG-Grafiken ersetzen
Emojis in Hauptseite, Hilfe und Konzeptseite. Sprachkürzel und zugänglicher
Buttonname bleiben erhalten; die Grafik ist dekorativ. Vite bündelt beide
Flaggen ohne externe Requests oder zusätzliche Abhängigkeiten.
152 Tests bestanden, 8 optionale Tests übersprungen; Build und Diff-Prüfung
erfolgreich. SVG-Flagge in der lokalen Browseransicht sichtbar. Kein nativer
Windows-Test verfügbar. Audit unverändert: vier Entwicklungsbefunde, keine
Produktionsbefunde; Repository öffentlich.

## Release-Prüfung 2610.3.14

Push vom Nutzer freigegeben. 152 Tests erfolgreich, 8 optionale Tests übersprungen;
Produktionsbuild, Diff-Prüfung und Versionskonsistenz erfolgreich. Keine neuen
Abhängigkeiten; Lizenzübersicht geprüft. npm audit: vier bestehende Befunde in
Entwicklungsabhängigkeiten, keine Produktionsbefunde. Öffentlicher main-Stand
bfa920c als Grundlage. Nur Implementierung, synthetische Tests und Dokumentation;
die lokal bereitgestellte Reparaturvorlage bleibt außerhalb des Commits.

## 3. Oktober 2026 – Gemeinsame Einpunkt-Umwandlung 2610.3.14

Nutzerkorrektur: Umwandlung in POINT vorauswählen, alternativ löschen, Bilanz und
Auswahl rechts unten; separaten Download entfernen. Pro-Zeile-Aktionen bleiben
synchron mit der globalen Auswahl. Ohne Punktkopie jetzt Umwandlung möglich;
ausdrückliche Löschwahl darf den Standort verwerfen. Geometrie-/Referenzsperren bleiben.
Erst reguläre Filter anwenden, dann auf neu geprüfter Quelle konvertieren. Nur
erhaltene Punkte wiederverwenden, Mehrfachkonvertierungen deduplizieren. Default-
Punktfilter auf betroffenen Layern öffnen. Audit mit tatsächlich ausgeführten Aktionen.
152 Tests bestanden (8 optionale übersprungen), inklusive Filterpriorität, fehlender
Punktkopie, gleichem XYZ, gemischter Auswahl, XYZ/Layer-Erhalt und erneutem Import.
Keine neuen Abhängigkeiten oder Lizenzänderungen. Browserprüfung bestätigt globale
Umwandlungs-/Löschwahl, vorausgewählte Umwandlung und synchronisierte Zeilen. Build
und Diff-Prüfung erfolgreich; npm audit weiterhin 4 Entwicklungsbefunde (2 mittel,
2 hoch), keine Produktionsbefunde. Repository-Sichtbarkeit öffentlich.

## 3. Oktober 2026 – Einpunkt-Polylinien 2610.3.13

Grundlage ist der öffentliche, bereinigte Stand 2610.3.12 von origin/main.
Die ältere lokale Kopie wurde auf einen neuen Arbeitsbranch dieses Standes
umgestellt, ohne die alte Historie in den öffentlichen Stand zu übernehmen.

Originaltags liefern Einpunkt-LWPOLYLINE-Befunde unabhängig vom Vorschauparser.
Entfernung nur bei exakt gleicher erhaltener XYZ-Punktkopie, gültigem Zähler,
Standardextrusion und ohne Breiten-/Bogen-/Dickenbesonderheiten. Alle eingehenden
Verweise einschließlich IDBUFFER und 391–399 sperren. Andere Zeichnungsbereiche
zählen nicht als Punktkopie. Keine Toleranz, keine erfundene zweite Koordinate.

Eigene Originalreparatur mit leerer Auswahl und separatem Speicherbutton.
Gemeinsame Cleaner-Optionen werden dabei nicht angewendet. Quelle erneut prüfen,
ausschließlich Textbereiche entfernen und Restentitäten exakt vergleichen.
Erst nach erfolgreichem Speichern neu analysieren; bei Dateiwechsel während des
Dialogs keinen neueren Datensatz ersetzen. Protokoll optional im Prüfbericht.
ASCII-only ist bewusst sichtbar begrenzt. Tests enthalten nur synthetische Daten.
Keine neuen Abhängigkeiten oder Lizenzänderungen.

Verifiziert: 145 Tests bestanden, 8 optionale Tests übersprungen; Produktionsbuild
und Diff-Prüfung erfolgreich. Synthetische UI-Prüfung in DE/EN und Hell/Dunkel:
leere Auswahl, freigegebene/gesperrte Zeilen und synchronisierte Befundanzeige.
Der native Speicherdialog wurde geöffnet; sein abschließender Klick war durch
die Codex-Automatisierung nicht bedienbar. Export und Kontrollimport sind
automatisiert geprüft. npm audit: 4 bestehende Entwicklungsabhängigkeitsbefunde
(2 mittel, 2 hoch), keine Produktionsbefunde. Repository weiterhin öffentlich.

## 2. Oktober 2026 – Öffentlicher Stand 2610.3.12

Auf Nutzerauftrag wurde ein unabhängiges öffentliches Repository unter dem
bisherigen Namen angelegt. Es enthält ausschließlich die bereinigte Historie
und den MIT-lizenzierten Quellcode. Das frühere Repository bleibt unter
`geodata-inspector-cleaner-private` privat; seine sechs Issues bleiben erhalten.
Die bestehende Netlify-Site wurde mit dem neuen Repository verbunden, ihre
öffentliche Website-Adresse bleibt erhalten. Keine neuen Abhängigkeiten.

## 2. Oktober 2026 – Projektlizenz 2610.3.11

Auf ausdrücklichen Nutzerwunsch ist der Projektquellcode unter MIT lizenziert.
LICENSE, npm-Metadaten, README und Lizenzübersicht stimmen überein.
Der Nutzer hat die Veröffentlichung echter Vermessungsdateien ausgeschlossen
und ausdrücklich ihre Entfernung aus GitHub beauftragt. DXF-Dateien, Manifest,
Referenztests mit exakten Koordinaten und Projektscreenshots werden deshalb
auch aus der Git-Historie entfernt. Synthetische Regressionstests bleiben bestehen.
Die MIT-Lizenz umfasst ausschließlich den verteilten Quellcode, keine privaten
Vermessungsdaten. `.gitignore` verhindert das erneute Einchecken solcher Dateien.

## 28. September 2026 – Schlanke DXF 2609.3.10

Nutzerziel ist eine minimale Shape-Datei, nicht die vollständige CAD-Struktur.
Der Standardexport schreibt deshalb ein neues AC1032-Dokument aus nativen
Geometrie-Tags mit nur benötigten Layern, Linienarten, Textstilen und Blöcken.
Keine Rundung oder Rückkonvertierung der Vorschaugeometrie. Neue Handles und
konsistente Eigentümer, keine alten Extension-Dictionaries, XData oder Proxys.
Vollständig vorhandene Außen-/Innenumrisse ersetzen HATCHs. Nicht unterstützte
beibehaltene Geometrie führt zu sichtbarer Sperre statt stillem Datenverlust.

Private Originaldatei: 33 LWPOLYLINEs, 12.257 Byte, ein Cluster. Vollständiger
Koordinaten-/Bulge-/Layer-/Z-/OCS-Vergleich mit den 33 Referenzumrissen identisch.
Unabhängige ezdxf-Prüfung ohne Fehler oder Reparaturen. Keine neuen Bibliotheken.
123 Tests und Build bestanden, Browser-Bilanz und Reimport geprüft; tatsächlicher
Pointcloud-Manager-Importer erkennt 33 eindeutige Shapes. Audit unverändert vier
Entwicklungsbefunde, keine Produktionsbefunde. Repository privat.
Push-Abnahme: 123 Tests inklusive lokaler DXF-Referenzen, Build, Versions- und
Diff-Prüfung erneut erfolgreich. Keine privaten DXF-Dateien eingecheckt.

## 28. September 2026 – Außenbereich tatsächlich entfernen 2609.3.9

Die 3.8-Ausgabe hatte korrekt zwei HATCH-Duplikate entfernt und 33 Umrisse
erzeugt, behielt aber drei VIEWPORTs und einen INSERT mit 25 ATTRIBs. Der
pauschale Referenzschutz blockierte auch normale Eigentümer-/Verwaltungsdaten.
Die bisherigen Tests prüften Umrisse und Duplikate, nicht das Verschwinden des
Außenbereichs; dies war eine Lücke in der Abnahme.

Eigene OBJECTS-Erweiterungsdaten rekursiv anhand Owner entfernen; bekannte
BLKREFS-, SORTENTSTABLE-, LAYOUT-, FIELDLIST- und benannte
ASEBlockHierarchyIndexRecord-Verweise gezielt bereinigen. Shared Resources,
Blockdefinitionen und unbekannte externe Verweise nicht pauschal löschen.
Synthetische Regressionen prüfen Kaskade, Referenzreparatur, unveränderte
Fremddaten, unbekannte Verweise und doppelte Handles.

Beide privaten Dateien opt-in prüfen: Original → gemeinsamer Export sowie
reale v3.8-Ausgabe → Außenbereich löschen → erneuter Import. Erwartung: nur
noch ein Cluster, 65 Vorschau-/CAD-Objekte (32 HATCH, 33 LWPOLYLINE), keine
weiteren Umrisse beim Folgeexport. Externe Prüfung mit ezdxf: 0 Fehler,
unverändert vier bereits vorhandene IDBUFFER-Owner-Hinweise. Keine neuen
Abhängigkeiten oder Lizenzen. Beispieldateien bleiben außerhalb des Repositorys.

Abnahme: 116 Tests inklusive Original, tatsächlicher v3.8-Ausgabe und HBF-Datei; Build und Diff-Prüfung erfolgreich. Browser-Reimport: ein Bereich, kein Außenbereich mehr. Pointcloud-Manager-Importer: 33 Shapes, 33 eindeutig. Kein Verweis auf die 44 entfernten Entity-/Metadaten-Handles verbleibt. Audit weiterhin vier Entwicklungsbefunde, keine Produktionsbefunde; Repository privat.

## 28. September 2026 – Sichtbare Exportauswahl 2609.3.8

- Nur empfohlene Löschbereiche vorauszuwählen entsprach nicht dem Nutzerwunsch: jetzt sind alle erkannten Nicht-Hauptbereiche angehakt, auch bei unklarer Empfehlung.
- Exportübersicht enthält synchronisierte Checkboxen mit erkannten/ausgewählten Duplikaten und erkannten Schraffuren/tatsächlich geplanten neuen Umrissen.
- Bereichsliste scrollt separat, damit die beiden Aktionsschalter sichtbar bleiben. Referenzschutz bleibt erhalten und wird in der Bilanz ausgewiesen.
- Keine neuen Abhängigkeiten oder Lizenzänderungen.
- Push-Prüfung: 105 Tests einschließlich beider lokalen DXF-Referenzen und Produktionsbuild erfolgreich; Repository privat. Vier bestehende Audit-Befunde betreffen Entwicklungsabhängigkeiten, keine Produktionsabhängigkeiten.

## 28. September 2026 – Gemeinsamer Exportplan 2609.3.7

Nutzerwunsch: Auswahl/Prüfung von Ausführung trennen, weniger Klicks. Duplikat-
und HATCH-Panels exportieren keine Dateien mehr. Löschbare Duplikate werden
vorausgewählt, empfohlene Löschbereiche ebenfalls; geeignete Schraffurumrisse
sind aktiv. Bereichscheckboxen und Layer-/Typfilter bleiben änderbar. Keine
Hauptbereichsbestätigung als zusätzliche Exportfreigabe. Bei mehrdeutiger
Bereichsanalyse werden nicht pauschal alle Nicht-Hauptbereiche gelöscht.

Der zentrale DXF-Plan wird vorab aus der unveränderten Quelle erstellt und
bilanziert: Entfernen (mit IDBUFFER-Bereinigung), anschließend Umrisse aus
verbliebenen HATCHs, Kontrollimport. sourceEntityId ordnet Vorschaugeometrien
auch bei fehlenden Handles und INSERT-Attributen der vollständigen Entität zu.
Referenzierte/partiell gewählte Verbundobjekte bleiben mit sichtbarem Hinweis
bestehen. Kein normalisierter Zweitexport; Originalversion und übrige CAD-
Strukturen bleiben erhalten. GeoJSON nutzt weiterhin die normalisierte
Konvertierung mit expliziter Featureauswahl, ohne Hauptbereichs-Sperre.

Der Button nennt aktive Umrisse. Ein Klick öffnet direkt die native Zielwahl;
keine zusätzliche vorgeschaltete Bestätigung bei unterstützter API. Abbruch
übernimmt nichts. Prüfbericht optional über den Kopfbutton, kein automatischer
zweiter Download. Erfolgreiche DXF-Ausgabe wird neu analysiert und übernommen.

Private Beispieldatei: zwei Duplikate entfernt, 32 HATCHs behalten, 33 eindeutige
LWPOLYLINEs erzeugt. Vier referenzierte Layout-/Schriftfeldobjekte bleiben
sichtbar bilanziert erhalten. Echter Pointcloud-Manager-DXFReader: 33 Shapes,
33 eindeutig. ezdxf: 0 Fehler, unverändert vier bereits vorhandene IDBUFFER-
Owner-Hinweise. Keine Bibliotheks- oder Lizenzänderung.

104 Tests inklusive privater HBF-/HATCH-Fixtures, Build und Diff-Check bestanden.
Browser: automatische Duplikatwahl, Umrissschalter mit sofortigem Button-/
Bilanzwechsel, Bereichsauswahl, DE/EN und Hell/Dunkel geprüft. Betriebssystem-
Speicherfenster nicht automatisiert bedient. Repository privat; Versions- und
Lizenzcheck konsistent, Audit unverändert vier Entwicklungsbefunde (2 moderat,
2 hoch).

## 28. September 2026 – Speicherortwahl 2609.3.6

Bisher setzte downloadText nur einen Blob-Link; der Host/Browser wählte seinen
Download-Ordner. Jetzt zentraler modaler Speicherdialog mit frischer Nutzeraktion
für showSaveFilePicker (auch nach langen Exportberechnungen). Kein persistiertes
Handle; pro Datei neue Zielwahl. Fehlende API wird erklärt, normaler Download
nur über ausdrücklich beschrifteten Ersatzbutton. Schreibfehler bleiben im
Dialog; kein automatischer Fallback. Datensatzübernahme erst nach erfolgreichem
Speichern/ausdrücklich ausgelöstem Download, nicht bei Abbruch. JSON-Protokolle
werden separat angeboten. Tests für Zielwahl, Abbruch und fehlerhaften Schreibpfad.
Keine Bibliotheks- oder Lizenzänderung.

98 Tests einschließlich privater DXF-Regressionsfälle und Build bestanden.
Dialog sowie Abbruch in Hell/Dunkel im Browser geprüft; native Dateiauswahl
und Schreibpfad durch isolierte Tests mit simuliertem Dateihandle abgedeckt.
Der Betriebssystem-Speicherdialog wurde nicht automatisiert bedient.
Versions-/Lizenz-/Diff-Check bestanden, Repository privat. Audit unverändert
vier Entwicklungsbefunde (2 moderat, 2 hoch).

## 28. September 2026 – Bugfix 2609.3.5

Die zuvor angenommene Erklärung für den Pointcloud-Manager war unvollständig:
Sein tatsächlicher DXFReader ignoriert HATCH. Die zusätzliche lokale Datei
plfanzflaechen01_schraffuren-umrisse-cleaned.dxf belegt den Fehler im normalen
Cleaner: HATCH-Vorschauen werden ebenso wie erzeugte Umrisse als POLYLINE
exportiert. Damit entstehen aus 34 HATCHs und 33 Umrissen 67 Polylinien.

Korrektur: Der Import hält alle HATCH-Ränder für den Abgleich bereit. Im
normalisierten DXF-Export entfallen nur HATCH-Vorschauen, deren sämtliche Ränder
exakt und in gleicher Reihenfolge durch ausgewählte geschlossene Polylinien auf
demselben Layer abgedeckt sind (inklusive Z). Keine Toleranz, keine pauschale
Polylinien-Deduplizierung. Nicht gewählte, offene oder abweichende Ränder reichen
nicht. Die separate Bilanz steht im Ergebnis und in DXF-Kommentaren.

Mit dem unveränderten DXFReader.ts aus dem lokalen Pointcloud-Manager getestet:
Original 0 Shapes; Umrisse 33/33 eindeutig; bisheriger Cleaner 67/33 eindeutig;
korrigierter Cleaner 33/33 eindeutig. 95 Tests inklusive beider privater Fixtures
und Build bestanden. Keine neue Abhängigkeit oder Lizenzänderung. Repository
privat; Audit unverändert vier Entwicklungsbefunde (2 moderat, 2 hoch).

## 28. September 2026 – Bugfix 2609.3.4

Die zwei echten HATCH-Kopien E7A2 und E7AB der privaten Pflanzflächen-Datei
waren wegen IDBUFFER-Mitgliedsverweisen gesperrt. Dieselben Verweise stehen
auch im strukturerhaltenden Umriss-Export; bloßes Neuimportieren dieser Datei
entfernt sie nicht. Der normalisierte Cleaner rekonstruiert Geometrien und
verwirft solche Objektlisten, was eine abweichende Duplikatbilanz erklären kann.
Schraffuren und zusätzliche Umrisse sind unterschiedliche Objekttypen.

Die Bereinigung entfernt jetzt mit ausgewählten Duplikaten ausschließlich ihre
Mitgliedsverweise in AcDbIdBuffer innerhalb OBJECTS. Owner, Reactor-Gruppen,
unbekannte Unterklassen und andere Referenzen bleiben gesperrt. Übrige
Entitäten bleiben bytegleich; entfernte Listenverweise werden kontrolliert und
im Exportprotokoll gezählt. Kein pauschales Entfernen von CAD-Spezialobjekten.

93 Tests einschließlich privater HATCH-/HBF-Regression und Build bestanden.
Browserprüfung: Original sofort auswählbar, 38 → 36 native Objekte, zwei
Duplikate entfernt, Arbeitsstand ohne Neuimport aktualisiert. Version 2609.3.4
in Paket, Lockfile und UI konsistent. Keine Bibliotheksänderung; Lizenzen
unverändert, Repository privat. Audit weiterhin vier Entwicklungsbefunde
(2 moderat, 2 hoch), keine neuen Laufzeitabhängigkeiten.

## 28. September 2026 – Version 2609.3.3

Der Nutzer korrigiert den bislang festgehaltenen Juli-Präfix ausdrücklich auf
2609.3.3. Die Version wird identisch angezeigt und in package/lock geführt;
Versionsregeln prüfen künftig den aktuellen Monat statt die alte Linie blind
fortzuführen. Diese Runde enthält zugleich die Schraffur-Umrissfunktion.

HATCH-Ränder aus Gruppe 91/92 werden separat von Ursprung, Saatpunkten und
Schraffurmuster gelesen. Jeder Innen-/Außenring wird geschlossen auf dem Quelllayer
ausgegeben. Native Kreisbögen werden als Bulge erhalten; Ellipsen und rationale
Splines werden gekennzeichnet segmentiert. Clockwise-DXF-Bogenwinkel werden als
Komplementärwinkel behandelt. OCS und Elevation bleiben erhalten. Der Export
hängt nur neue Entitäten an und aktualisiert den HANDSEED, ohne Originalentitäten
oder DATAflor-spezifische Objektstrukturen neu zu schreiben.

Die HATCH-Vorschau verwendet jetzt Randpunkte statt Ursprung und Saatpunkten,
damit keine künstlichen Ferncluster entstehen. LWPOLYLINE-Vorschauen berücksichtigen
Bulge und OCS. Nach Export aktualisiert derselbe Workflow wie bei Duplikaten den
Datensatz und sämtliche Ansichten. Keine neuen Bibliotheken oder Dienste.

Validierung mit der privaten Beispieldatei: 34 HATCHs, 35 Ränder, davon zwei
identisch. 33 neue LWPOLYLINEs decken alle Ränder ab. Modell-/Pflanzflächen-Layer:
34 → 67; Analyse einschließlich Layout/Schriftfeld: 63 → 96. Die native
Entitätszählung fasst INSERT-Attribute zusammen und steigt von 38 auf 71.
Keine Schraffur ausgelassen. Erneuter Export ist gesperrt, weil alle Ränder
abgedeckt sind. Unabhängiger ezdxf-Vergleich: sämtliche Randkoordinaten identisch,
alle neuen Polylinien geschlossen, Original-Layer erhalten. Audit: keine Fehler;
dieselben vier IDBUFFER-Owner-Reparaturhinweise in Quelle und Ausgabe. Diese
bereits vorhandenen CAD-Spezialobjekte bleiben in der exportierten Datei erhalten.

87 Tests einschließlich HATCH- und bisheriger privater HBF-Regression bestanden;
Build, Versions-/Lizenzcheck und Diff-Check bestanden. Browser: DE/EN, Hell/Dunkel,
Export, unmittelbare Zählungsaktualisierung und Wiederholungssperre geprüft.
Repository weiterhin privat; keine neuen Abhängigkeiten. npm audit unverändert:
vier Entwicklungsbefunde (2 moderat, 2 hoch), keine Produktionsbefunde.
Ein tatsächlicher Import in DATAflor AutoCAD OEM wurde nicht durchgeführt.

## 22. September 2026 – Subversion 2607.03.3

Die Fußzeile bietet weitere Apps (Geoid Forge, DXF Coordinate Forge,
PointCloud Manager und GPS / UTM Converter), Hilfe/Bugreport/Kontakt,
Lizenzen/Copyright, Impressum und Ko-fi. Die App-Hülle bleibt viewportgebunden;
eine automatische Footer-Zeile ersetzt die feste 32-px-Statuszeile. Lange
Analyse-Inhalte scrollen weiterhin innerhalb ihrer Panels.

Der Kontaktbereich verwendet ein natives `dialog` für Tastaturfokus und Escape.
Hilfe-Link, Beschriftungen und E-Mail-Vorlage folgen der zentralen DE-/EN-Wahl.
Der Bugreport enthält nur feste Vorlagenfelder und die zentrale App-Version;
Dateinamen, Geometrien und Berichte werden nicht automatisch übernommen.
`mailto:` öffnet das E-Mail-Programm, die Anwendung selbst versendet nichts.
Der Lizenzlink nutzt den vorhandenen Dialog und dieselbe Markdown-Quelle.
Externe Links sind reine Verweise, keine eingebetteten Dienste oder Tracker.

Keine neuen Abhängigkeiten. Lockfile-Lizenzen gegen die vorhandene Übersicht
geprüft: keine GPL-/AGPL-/Non-Commercial- oder unklaren Einträge. Der npm-Audit
meldet unverändert vier Entwicklungsbefunde (2 moderat, 2 hoch); Aktualisierungen
dieser Werkzeuge sind nicht Teil des Footer-Auftrags. Die bestehende Release-Linie
wird als 2607.03.3 fortgeführt, das Repository bleibt privat.

Verifikation: 78 Tests bestanden, ein optionaler privater Fixture-Test ohne
Umgebungsvariable übersprungen; Typprüfung, Produktionsbuild und Diff-Check
bestanden. `npm audit --omit=dev`: keine Befunde. Browserprüfung für DE/EN,
Hell/Dunkel, E-Mail-URLs, Kontakt- und Lizenzdialog sowie Footer innerhalb des
720-px-Viewports. Es wurde keine Test-E-Mail versendet.

## 19. September 2026 – Subversion 2607.03.2

Fehler mit der HBF-Datei reproduziert: Der Duplikat-Export meldete 638 verbleibende
Objekte, während die Layerübersicht weiterhin 1285 zeigte. Ursache war ein rein
lokaler Download im DuplicatePanel ohne Rückmeldung an den aktiven App-Datensatz.

Nach dem validierten Export wird die erzeugte DXF jetzt eingelesen und über einen
verbindlichen Callback zum aktiven Arbeitsstand. Analyse, Layerübersicht, Karten,
Befunde, Prüfbericht und räumlicher Cleaner verwenden denselben neuen Datensatz.
Die bisherige Hauptbereichsbestätigung, Hervorhebungen und Löschliste werden
verworfen, da beim Reimport IDs neu vergeben werden. Die letzte gültige
CRS-Analysevorgabe bleibt erhalten; eine noch ungültige Eingabe oder ausstehende
Eingabe-Verzögerung darf keine alten Zahlen auf dem neuen Datensatz hinterlassen.
Die Originaldatei bleibt unverändert. Keine neuen Abhängigkeiten oder Dienste.

Mit der Originaldatei im Browser verifiziert: 1285 → 638 → 608 in Inventar,
Layerübersicht und Duplikatcheck; Hauptbereichsbestätigung zurückgesetzt.
75 Tests, Build und Diff-Check bestanden. Audit unverändert mit vier bestehenden
Entwicklungsabhängigkeitsbefunden; Repository weiterhin privat.

## 19. September 2026 – Subversion 2607.03.1

Die HBF-Bereinigung ist als automatische DXF-Prüfung mit optionaler Löschliste
integriert. Der Vergleich verwendet die vollständigen Originaltags und erhält
POLYLINE/VERTEX/SEQEND sowie INSERT/ATTRIB/SEQEND als atomare Objekte. Vorschau-
Polygone oder bloße Textanker reichen für eine sichere Duplikatentscheidung nicht.
Interne Owner-Handles dürfen vereinheitlicht werden; externe Referenzen und
mehrdeutige Handles sperren die Löschung. Der Export schneidet nur bestätigte
Entitätsbereiche aus dem Quelltext. ASCII/UTF-8, BOM und Zeilenenden bleiben
bestehen; unsicher dekodierte Zeichen und unvollständige Strukturen sperren ihn.

Die Zählung erfolgt in zwei Stufen: gleiche-Layer-Kopien und anschließend
zusätzliche Vertreter auf anderen Layern. Damit überschneiden sich die
Löschkandidaten nicht, und nach Auswahl beider Kategorien bleibt mindestens ein
Exemplar jeder identischen Gruppe erhalten. A bezeichnet die erste Fundstelle,
nicht eine fachlich bevorzugte Layerbedeutung. Der Duplikat-Export ist bewusst
ein eigener Workflow; der normalisierte räumliche Cleaner bleibt separat.

Validierung: privater HBF-Test über lokale Umgebungsvariable, ohne neue Geodaten
im Repository: 1285 → 638 → 608; finale Ausgabe bytegleich mit der früheren
manuellen Bereinigung. Unabhängiger ezdxf-Audit: 0 Fehler, 0 Reparaturen.
Browserprüfung: Einzel-/Sammelauswahl, DE/EN, Hell/Dunkel und Auswahlbilanz.
Keine neuen Bibliotheken oder externen Dienste.

Der vorgeschriebene npm-Audit meldet vier bereits im unveränderten Lockfile
bestehende Entwicklungsabhängigkeitsbefunde: @vitest/mocker, vitest, nanoid und
postcss (2 moderat, 2 hoch). Abhängigkeitsupdates sind nicht Teil dieser
Feature-Runde. Produktionsabhängigkeiten weisen im Audit keine Befunde auf.
Die bestehende Release-Linie wird ohne neue RR-Freigabe als 2607.03.1 fortgeführt.

## 13. Juli 2026 – Release 2607.03.0

Release `2607.03.0` konsolidiert die drei lokal verifizierten Subversionen der
vorherigen Release-Linie:

- `2607.02.1`: exakt viewportgebundene Startansicht und getrennt abgestimmte
  Vorschauraster für helles und dunkles Theme,
- `2607.02.2`: manuell pflegbares CRS-/EPSG-Feld mit `EPSG:25832` als Standard,
  transparenter Quellenherkunft, automatischer Neuanalyse und sicherem
  Zurücksetzen früherer Cleaner-Freigaben,
- `2607.02.3`: auf die Summary reduzierte geschlossene Störbereichsvorschau,
  intern scrollbare Befundliste und Entfernung der Roadmap-Kachel aus der
  rechten Seitenleiste.

Der Release verändert keine Abhängigkeiten und führt keine neue externe
Datenübertragung ein. Geometrie bleibt lokal; nur sichtbar angeforderte
OpenStreetMap-Kacheln verwenden weiterhin den dokumentierten Onlinepfad.

## 13. Juli 2026 – Subversion 2607.02.3

### Ein geschlossenes `details` kann trotz verborgenem Inhalt groß bleiben

**Fehlerbild:** Der Inhalt der Störbereichsvorschau war mit
`:not([open]) > .disturbance-preview-content { display: none; }` korrekt
verborgen. Trotzdem blieb darunter eine mehrere hundert Pixel hohe leere Fläche.

**Ursache:** `.disturbance-preview-card { display: block; }` stand vor der
allgemeinen `.preview-card`-Regel. Bei gleicher Spezifität gewann die spätere
Regel und setzte das `details` wieder auf Grid mit
`grid-template-rows: 54px minmax(340px, 1fr) auto`. Die unsichtbare Inhaltszeile
blieb dadurch als Mindesthöhe im Grid bestehen; zusätzlich streckte das
Elterngrid den Eintrag auf seine Zeilenhöhe.

**Stabile Lösung:** Die spezifischere Regel
`.preview-card.disturbance-preview-card` setzt `display: block`, `min-height: 0`
und `align-self: start`. Das Vorschau-Elterngrid verwendet ebenfalls
`align-items: start`. Im Browsertest ist der geschlossene Rahmen damit 56 px
hoch – 54 px Summary plus Rahmen – und wächst nur im geöffneten Zustand wieder
auf die Karten-/Canvas-Höhe.

### Befunde brauchen einen eigenen Flex-Scrollbereich

**Fehlerbild:** Bei vielen Befunden wurde die erste Karte am unteren Rand
abgeschnitten, während Cleaner und Roadmap in derselben rechten Seitenleiste
zusätzlichen Platz beanspruchten.

**Ursache:** `.findings-list` besaß zwar `overflow: auto`, war aber kein
definierter wachsender Flex-Abschnitt. Ohne `flex: 1` und `min-height: 0` schrumpfte
die Liste innerhalb der Spalte, ohne eine belastbare Scrollbox zu bilden.

**Stabile Lösung:** Überschrift und Cleaner sind feste Flex-Kinder; die
Befundliste erhält `flex: 1 1 auto`, `min-height: 0`, `overflow-y: auto`,
`scrollbar-gutter: stable` und einen dezenten Scrollbar. Die rechte Seitenleiste
selbst bleibt ohne äußeren Überlauf. Bei 1280×720 wurden 168 px sichtbare
Befundhöhe und 587 px scrollbarer Inhalt gemessen; Cleaner und Statuszeile
bleiben vollständig sichtbar. Die Roadmap-Kachel wurde aus der knappen
Seitenleiste entfernt, ihr ADR bleibt über die Dokumentation erreichbar.

## 13. Juli 2026 – Subversion 2607.02.2

### Ein manuelles CRS darf nicht als Dateimetadatum ausgegeben werden

**Problem:** Die Analyse konnte bisher nur ein in DXF/GeoJSON deklariertes CRS
oder eine grobe Koordinatenheuristik verwenden. Ein einfaches Überschreiben von
`GeoDataset.declaredCrs` durch ein neues Eingabefeld hätte zwar die Karte
aktualisiert, im Prüfbericht aber fälschlich behauptet, der EPSG-Code stamme aus
der Quelldatei.

**Stabile Lösung:** Die normalisierte Benutzervorgabe liegt separat in
`InspectionReport.analysisCrs`; `GeoDataset.declaredCrs` bleibt unverändert. Die
CRS-Bewertung führt zusätzlich die Herkunft `input`, `metadata`, `heuristic` oder
`missing`. Kartenkopf, Befundtext und JSON-Prüfbericht können damit transparent
zwischen manueller Vorgabe und Dateimetadaten unterscheiden. Der Cleaner darf
die Vorgabe als CRS-Hinweis in DXF/GeoJSON übernehmen, führt aber ausdrücklich
keine Reprojektion der Koordinaten durch.

### CRS-Wechsel invalidiert räumliche Freigaben

**Problem:** Ein anderes Quell-CRS kann denselben XY-Wertebereich an eine völlig
andere Kartenlage projizieren und dadurch ändern, welcher Cluster innerhalb des
plausiblen Einsatzgebiets liegt. Eine zuvor bestätigte Cleaner-Auswahl dürfte
deshalb nach einem CRS-Wechsel nicht still weiter als manuelle Freigabe gelten.

**Stabile Lösung:** Jede tatsächlich geänderte CRS-Vorgabe leert bevorzugten
Hauptbereich und Hervorhebung, startet Cluster-/Kartenanalyse neu und sperrt den
Export wieder bis zur erneuten manuellen Bestätigung. Eingaben wie `25832`,
`EPSG 25832` und `EPSG:25832` werden gleich normalisiert. Eine 350-ms-Verzögerung
vermeidet Neuberechnungen für jeden einzelnen Tastenanschlag; Enter und Blur
übernehmen sofort. Ungültige Eingaben bleiben sichtbar markiert und ersetzen
kein zuvor gültiges Analyseergebnis. Label, Hilfetext, Fehlermeldung und
Placeholder werden über die zentralen DE-/EN-Kataloge umgeschaltet.

### Neue Felder gegen den tatsächlichen Scrollcontainer prüfen

**Problem:** Der äußere Viewport blieb zwar scrollbarfrei, bei 1280×720 ragte
das CRS-Feld zunächst wenige Pixel unter das sichtbare Ende der intern
scrollenden linken Seitenleiste. Eine reine Prüfung von `body.scrollHeight`
hätte das nicht erkannt.

**Stabile Lösung:** Dropzone und Abstand des Analyseabschnitts wurden moderat
verdichtet. Der Browsertest vergleicht zusätzlich die Bounding-Box des Feldes
mit der sichtbaren Seitenleisten-Box. Das Feld ist nun bei 1280×720 vollständig
sichtbar, während längere Inventar- und Analyseinformationen weiterhin
innerhalb der Seitenleiste scrollen.

## 13. Juli 2026 – Subversion 2607.02.1

### Ein `min-height` kann trotz Grid einen äußeren Scrollbalken erzwingen

**Fehlerbild:** Die App-Hülle besaß bereits die Zeilen Kopf, Arbeitsbereich und
Status. Die leere Vorschau forderte zusätzlich `min-height: calc(100vh - 190px)`.
Zusammen mit Bühnen-Padding, Überschrift und den festen Kopf-/Statuszeilen wurde
die Hülle bei einem 900-px-Viewport 930 px hoch. Der Browser zeigte deshalb
einen äußeren Scrollbalken, obwohl alle sichtbaren Elemente scheinbar in die
Ansicht passten.

**Stabile Lösung:** `body` und `.app-shell` sind exakt `100vh` hoch und unterbinden
äußeres Überlaufen. Die Bühne ist eine vertikale Flexbox; die leere Vorschau
nimmt nur den tatsächlich verbleibenden Raum ein. Lange Ergebnisansichten
scrollen weiterhin in `.stage`, Seitenleisten in ihrem eigenen Container. Weil
Hilfe und Konzept dieselbe Basis-CSS importieren, hebt `concept.css` die feste
Höhe dort ausdrücklich mit `height:auto`, `min-height:100vh` und `overflow:auto`
auf. Der Browsertest vergleicht `scrollHeight === clientHeight` und prüft die
Dokumentseite separat auf erhaltene Scrollbarkeit.

### Rasterkontrast muss relativ zum Theme definiert werden

**Problem:** Ein einzelnes fast transparentes hellgrünes Raster funktionierte
auf dem dunklen Hintergrund gerade noch, verschwand auf der hellen Fläche aber
nahezu vollständig. Eine pauschale stärkere Deckkraft hätte umgekehrt das
dunkle Theme zu dominant gemacht.

**Stabile Lösung:** `--empty-grid-line` und `--empty-grid-accent` besitzen
getrennte Dark-/Light-Werte. Dunkel verwendet eine etwas präsentere helle Linie,
hell eine dezente dunkle Grünlinie. Beide bleiben bei 32 px Abstand und dienen
nur als technische Orientierung. Die visuelle Browserprüfung bei 1440×900
bestätigte sichtbare Raster in beiden Themes ohne zusätzlichen Scrollraum.

## 13. Juli 2026 – Release 2607.02.0

### Eine Versionsanzeige muss sichtbar und trotzdem platzsparend sein

**Problem:** Die Version stand zwar in der unteren Statuszeile, war beim ersten
Blick auf die App aber nicht so präsent wie im Pointcloud Manager. Eine große
Versionszeichenfolge im eigentlichen Titel würde die ohnehin dichte Kopfleiste
unnötig verbreitern oder umbrechen.

**Stabile Lösung:** App-Name und Version besitzen in der Marke getrennte,
nicht umbrechende Spans. Die vollständige kanonische Version wird kleiner und
zurückhaltend direkt neben `Geodata Inspector` angezeigt. `syncAppIdentity()`
setzt Header und Browser-Tab gemeinsam aus `APP_VERSION`; Statuszeile und
Prüfbericht lesen dieselbe zentrale Quelle. Der statische HTML-Fallback wird im
Versionskonsistenztest gegen `displayVersion` geprüft.

### Verborgene Karten und Canvas-Flächen erst beim Öffnen rendern

**Problem:** Eine per CSS versteckte Vorschau besitzt beim Rendern keine
verlässliche Breite und Höhe. Canvas würde dadurch zunächst nur 1×1 Pixel groß,
Leaflet berechnete Zoom und Bounds gegen einen unsichtbaren Container. Reines
Ein-/Ausblenden könnte deshalb beim ersten Öffnen eine leere oder falsch
zentrierte Störbereichsvorschau zeigen.

**Stabile Lösung:** Die Störbereichskarte ist ein natives, standardmäßig
geschlossenes `details`-Element. Solange es geschlossen ist, überspringen
Canvas- und Detailkartenpfad die teure Darstellung. Beim `toggle` nach `open`
wartet die App einen Layout-Frame ab und rendert Canvas sowie Leaflet-Detailkarte
mit den dann realen Abmessungen neu. Ausdehnung, Featurezahl und fachlicher
Prüfstatus bleiben auch im geschlossenen Summary sichtbar; Analyse- und
Exportzustand werden durch das Disclosure nicht verändert.

## 13. Juli 2026 – Subversion 2607.01.4

### Lizenzinformationen brauchen eine einzige redaktionelle Quelle

**Problem:** Eine separat in HTML gepflegte Copyright-Tabelle würde mit
`docs/COPYRIGHT-LICENSES.md` früher oder später auseinanderlaufen. Gerade die
bei jedem Release vorgeschriebene Prüfung von Paketversionen, Lizenzen und
OpenStreetMap-Pflichten darf nicht zwei unabhängige Darstellungen aktualisieren
müssen.

**Stabile Lösung:** Das neue Kopfmenü **Über** folgt dem Pointcloud-Manager-
Muster und enthält **Über mich** sowie **Copyright**. Der Copyright-Dialog lädt
die versionierte Markdown-Datei bei Bedarf per dynamischem Import und rendert
sie mit dem bereits verwendeten `marked`. Dadurch bleibt `marked` außerhalb des
initialen Hauptbundles und die Markdown-Datei ist zugleich Repository- und
In-App-Quelle. Externe Links werden als neue, von der App getrennte Tabs mit
`noopener` geöffnet.

### Eine eingeschränkte Demo muss am Link selbst eingeordnet werden

**Erkenntnis:** Ein bloßer Link mit dem Produktnamen kann den Eindruck erwecken,
die verlinkte Anwendung bilde den vollständigen Pointcloud Manager ab.

**Stabile Lösung:** Der Über-mich-Text kennzeichnet die verlinkte Netlify-Version
in Deutsch und Englisch ausdrücklich als reduzierte Online-Version mit
Funktionslimits und Upgrade-/Upsell-Hinweisen. Damit ist die Einschränkung vor
dem Öffnen sichtbar und nicht erst innerhalb der Zielanwendung.

## 13. Juli 2026 – Subversion 2607.01.3

### Anwenderhilfe und Produktkonzept haben unterschiedliche Aufgaben

**Problem:** Die bisherige Kopfaktion öffnete das ausführliche Produkt- und
UX-Konzept. Dieses Dokument erklärt Ziele, Architekturentscheidungen und
Erfolgskriterien, ist aber keine schnell auffindbare Bedienhilfe für Import,
Hauptbereichsbestätigung, Objektfilter, DXF-Version und Exportgrenzen.

**Stabile Lösung:** Die primäre Kopfaktion heißt jetzt **Hilfe** und rendert die
versionierte `README.md` über `help.html` mit `marked`. Damit sind Repository-
Dokumentation und In-App-Hilfe dieselbe redaktionelle Quelle. Das Produktkonzept
bleibt als Entscheidungsdokument erhalten und ist aus der README erreichbar.
Wie beim Konzept werden ausschließlich fest in den Build eingebundene Dateien
gerendert; importierte Nutzerinhalte gelangen nicht in den Markdown-Renderer.

### Ein Theme braucht gemeinsame Zustands- und Farbregeln

**Problem:** Ein nur optisch invertierter Einzelbildschirm würde spätestens bei
Kartenflächen, Tabellen, deaktivierten Buttons und Dokumentseiten inkonsistent.
Außerdem wäre nach einem Reload unklar, welches Design aktiv sein sollte.

**Stabile Lösung:** `src/theme.ts` verwaltet `dark` und `light` zentral, setzt
`data-theme` sowie `color-scheme` am Dokument und speichert die Wahl fehlertolerant
unter `gic.theme`. Hauptansicht und Hilfeseite nutzen dieselbe Schicht. Die
CSS-Farbvariablen bilden Text, Flächen, Linien und Statusfarben ab; zusätzliche
Light-Theme-Regeln erhalten die semantische Trennung von Hauptbereich, Warnung,
Cleaner und Kartenseitenleiste. Tests sichern den dunklen Default und die
Normalisierung gespeicherter Werte, die Browserprüfung beide Designs und die
Persistenz nach Reload.

### Übernommene Projekttexte müssen in den Zielkontext eingeordnet werden

**Erkenntnis:** Die „Über mich“-Texte aus dem Pointcloud Manager beschreiben den
fachlichen Hintergrund vollständig, nennen die neue App aber naturgemäß noch
nicht. Eine wortlose Kopie würde deshalb wie ein Fremdkörper wirken.

**Stabile Lösung:** Die drei deutschen und englischen Ausgangsabsätze sowie die
vier Profil-/Projektlinks wurden übernommen. Ein vierter, ebenfalls
zweisprachiger Absatz erklärt den Bezug des Geodata Inspector & Cleaner zu
nachvollziehbaren CAD-/Geodaten-Workflows. Der Dialog lässt sich über
Schließen-Schaltfläche, OK, Klick auf die Überlagerung und Escape verlassen und
gibt den Fokus an das auslösende Element zurück.

## 13. Juli 2026 – Subversion 2607.01.2

### Ein anderer `$ACADVER`-Stempel allein schafft keine CAD-Kompatibilität

**Problem:** Der bisherige normalisierte Export deklarierte AC1015, enthielt aber
nur ein minimales Tabellen- und Entity-Gerüst. Tolerante Reader können solche
Dateien öffnen; strenge AutoCAD-/OEM-Programme verlangen jedoch zusätzliche
Symboltabellen, Handles, Subclass-Marker, Blockdefinitionen und das
Named-Object-Dictionary. Eine reine Auswahl zwischen Versionsstrings hätte das
eigentliche Kompatibilitätsproblem deshalb nicht gelöst.

**Stabile Lösung:** Der Cleaner übernimmt die gehärtete Exportstruktur des
Pointcloud-Managers. Beide wählbaren Profile enthalten fortlaufende Handles,
`$HANDSEED`, Standardtabellen einschließlich APPID/DIMSTYLE/BLOCK_RECORD,
`*Model_Space` und `*Paper_Space`, BLOCKS, PlotStyle-Sentinel sowie eine
OBJECTS-Sektion mit Root- und ACAD_GROUP-Dictionary.

### AC1015 bleibt der sichere Default, AC1032 die moderne Option

**Erkenntnis:** Das im Pointcloud-Manager gegen DATAFLOR GREENXPERT geprüfte
AC1015-Profil lässt sich in strengen OEM-Workflows öffnen und weiterkopieren.
AC1032 ist für moderne AutoCAD-Workflows sinnvoll, kann in älteren OEM-Ketten
aber Folgeoperationen verhindern.

**Stabile Lösung:** Die UI bietet AutoCAD 2000 (`AC1015`) und AutoCAD 2018
(`AC1032`) mit erklärendem Kompatibilitätshinweis. AC1015 ist Default; eine
explizite AC1032-Auswahl wird lokal gespeichert. Die Struktur bleibt zwischen
beiden Profilen identisch, während `$ACADVER` und das Cleaning-Protokoll das
gewählte Ziel eindeutig kennzeichnen. Beide Varianten werden nach Erzeugung
erneut importiert und validiert.

### Symbolnamen müssen normalisiert und kollisionsfrei sein

**Erkenntnis:** Umlaute, verbotene Zeichen oder nach der Transliterierung
identische Layernamen können bei strengen CAD-Readern doppelte beziehungsweise
ungültige LAYER-Records erzeugen.

**Stabile Lösung:** Layernamen werden groß-/kleinschreibungserhaltend nach ASCII
transliteriert und auf 255 Zeichen begrenzt. Kollisionen erhalten deterministische
`_2`, `_3`, …-Suffixe; Tabelle und Entities verwenden dieselbe Namensabbildung.

## 12. Juli 2026 – Subversion 2607.01.1

### Lokale Versionen müssen den tatsächlich laufenden Stand kennzeichnen

**Problem:** Mehrere abgeschlossene Feature-Runden liefen weiter unter
`2607.01.0`. Auf dem lokalen Dev-Server war dadurch nicht erkennbar, ob bereits
der neue Cleaner oder noch ein älterer Build aktiv war.

**Stabile Regel:** Jede abgeschlossene und verifizierte Feature-Runde sowie jeder
Bugfix erhöht `P` in `JJMM.RR.P`. Eine zusammengehörige Nutzeranforderung zählt
als eine Runde; reine Analyse und unfertige Arbeit nicht. Commit, Push und das
Eröffnen einer neuen `RR`-Linie bleiben davon getrennt und benötigen weiterhin
einen ausdrücklichen Auftrag.

**Technische Absicherung:** UI und Prüfbericht lesen `displayVersion` zentral aus
`package.json`. Dadurch können sichtbare App-Version und Berichtsversion nicht
mehr unabhängig von der Paketversion vergessen werden.

### Bereinigte DXF besser neu erzeugen als strukturell zerschneiden

**Erkenntnis:** Ein Herausschneiden einzelner Entity-Textbereiche kann veraltete
Header-Extents, Layerverweise oder abhängige DXF-Strukturen zurücklassen.

**Stabile Lösung:** Der Cleaner adaptiert den DXF-Exporter des
Pointcloud-Managers und erzeugt eine normalisierte Datei mit neuen Extents,
Einheiten, Layern, Farben und Cleaning-Protokoll. Ein Kontrollimport verifiziert
Featurezahl, Einzelcluster und Ergebnis-Bounds vor dem Download. Das reale
200-Feature-Referenz-DXF wird reproduzierbar auf den korrekten 99-Feature-Bereich
reduziert.

### Räumliches Cleaning und Objektfilter sind getrennte Entscheidungen

**Erkenntnis:** Ein korrekt gewählter Projektbereich kann weiterhin redundante
`POINT`-Objekte oder unerwünschte Layer enthalten.

**Stabile Lösung:** Eine Matrix aus Layer und Geometrietyp übernimmt das Muster
des Pointcloud-Managers. Einzelpunkte sind zunächst abgewählt; jede Kombination
kann separat oder über Sammelaktionen geschaltet werden. Export und Protokoll
unterscheiden räumlich entfernte Features von zusätzlich objektgefilterten
Features. DXF-Farbe, ACI, Linientyp, Linienstärke und Statusflags werden für die
Inspektion aus der Layer-Tabelle gelesen.

### GeoJSON-zu-DXF darf keine Reprojektion vortäuschen

**Problem:** GeoJSON kann sowohl projizierte Meterkoordinaten als auch
geografische Gradwerte enthalten. Ein pauschales `$INSUNITS = 6` würde Gradwerte
fälschlich als Meter deklarieren.

**Stabile Lösung:** GeoJSON kann nach derselben Hauptbereichs- und Filterprüfung
als DXF exportiert werden. Koordinaten bleiben unverändert. Deklarierte
projizierte CRS werden metrisch ausgegeben; EPSG:4326, CRS84 und nicht deklarierte
CRS werden als einheitenlos markiert und erhalten einen ausdrücklichen
Keine-Reprojektion-Kommentar.

## 12. Juli 2026 – Release 2607.01.0

### Mehrheitsentscheidungen sind bei CAD-Dateien nicht zuverlässig

**Beobachtung:** Der reale unbereinigte DXF-Fall enthält zwei räumliche Cluster
mit 101 und 99 Features. Der minimal größere Cluster ist nicht der
Projektbereich, sondern enthält entfernte Planinhalte.

**Ursache:** Featurezahl und Vertexzahl sind nur schwache Indikatoren. Ein
Plankopf mit vielen Textankern kann die eigentliche Planregion knapp überholen.

**Stabile Lösung:** Unterhalb einer Dominanz von 60 % wird kein Cluster
automatisch zum Entfernen empfohlen. Die OSM-Plausibilitätsprüfung und eine
explizite Hauptbereichswahl ersetzen in diesem Fall die reine Mehrheitsregel.

### CRS-Transformierbarkeit ist nicht gleich CRS-Plausibilität

**Beobachtung:** Stark falsche EPSG:25832-Koordinaten können mathematisch noch
nach WGS84 transformiert werden.

**Ursache:** Eine Projektion prüft nicht automatisch, ob das Ergebnis innerhalb
des fachlichen Einsatzgebiets der UTM-Zone liegt.

**Stabile Lösung:** Jeder Cluster wird getrennt transformiert und anschließend
gegen das plausible CRS-Einsatzgebiet geprüft. Technisch darstellbare, aber
fachlich unplausible Cluster bleiben rot markiert und erhalten weiterhin den
Status `CRS-unplausibel`.

### „Zoom all“ darf nicht in die Kartenprüfung zurückkehren

**Beobachtung:** Würden alle weltweit getrennten Cluster in den initialen
OSM-Fit einbezogen, wäre die Hauptregion erneut kaum sichtbar.

**Stabile Lösung:** Die Karte fokussiert zunächst den kartografisch plausiblen
Cluster. Über „Auf Karte zeigen“ kann jeder transformierbare Cluster einzeln
betrachtet werden. Plausible Geometrie ist grün, ihr Ausdehnungsrahmen blau;
der vermutete Störbereich ist rot.

### Analyse und Visualisierung brauchen unterschiedliche Punktbudgets

**Beobachtung:** Die vollständige DXF-Geometrie auf Leaflet zu zeichnen kann bei
sehr vertexreichen Dateien die Interaktion blockieren.

**Stabile Lösung:** Die Analyse verarbeitet alle Punkte. Nur die
OSM-Überlagerung wird global auf 100.000 Stützpunkte ausgedünnt; erster und
letzter Punkt jedes Features bleiben erhalten. Die kartenlosen Canvas-Ansichten
verwenden lokale Ursprünge und Float64-Weltkoordinaten.

### Ein separates Störfenster darf keine Löschfreigabe vortäuschen

**Beobachtung:** In einem 50/50-Fall ist der Nicht-Hauptcluster nicht automatisch
falsch.

**Stabile Lösung:** Die dritte Vorschau zeigt Nicht-Hauptcluster im eigenen
Maßstab, unterscheidet aber `PRÜFEN` von `ENTFERNUNG EMPFOHLEN`. Zusätzlich
werden für Gesamt-, Fokus- und Störansicht die vollständigen XY-Min-/Max-Werte
in Metern angezeigt.

### Direkte Markdown-Links sind keine robuste Dokumentationsoberfläche

**Fehlerbild:** Beim direkten Öffnen von `PRODUCT-DESIGN.md` zeigte ein Browser
UTF-8 als Mojibake, beispielsweise `AusreiÃŸern`. Außerdem blieb das Dokument
bei englischer App-Sprache deutsch.

**Ursache:** Die rohe Markdown-Antwort besaß keine zuverlässige HTML-/Charset-
Darstellung und keine Sprachkopplung.

**Stabile Lösung:** `concept.html` deklariert UTF-8 ausdrücklich und rendert die
deutsche oder englische Markdown-Quelle mit `marked`. Es werden ausschließlich
vertrauenswürdige, zur Buildzeit gebündelte Projektdokumente gerendert, keine
vom Anwender importierten Markdown-Inhalte.

### Internationalisierung muss dynamische Inhalte einschließen

**Beobachtung:** Ein reiner Austausch statischer DOM-Texte reicht nicht für
Analysebefunde, Kartenhinweise, Canvas-Beschriftungen und Prüfberichte.

**Stabile Lösung:** Typgeprüfte DE-/EN-Kataloge besitzen exakte Schlüsselparität.
Alle dynamischen Ausgaben verwenden dieselbe Übersetzungs- und Locale-Schicht.
Die Auswahl wird lokal unter `gic.lang` gespeichert.

### Reale Fixtures sind entscheidend, aber sensibel

**Erkenntnis:** Der reale Fast-50/50-Fall deckt Fehlentscheidungen auf, die ein
synthetischer „ein kleiner Ausreißer“-Datensatz nicht zeigt.

**Regel:** Prüfsummen und erwartete Bounds machen die Tests reproduzierbar. Die
Dateien gelten dennoch als nicht anonymisiert und dürfen nur nach ausdrücklicher
Freigabe in einem privaten Repository gespeichert werden. Eine spätere
öffentliche Veröffentlichung benötigt eine gesonderte Rechte- und
Anonymisierungsprüfung.

### Versionsformat und npm-SemVer unterscheiden sich

**Entscheidung:** Die kanonische Release-Version verwendet `JJMM.RR.P`, beginnend
mit `2607.01.0`. npm erlaubt keine führende Null im numerischen Minor-Segment.
Deshalb speichern `package.json` und Lockfile `2607.1.0`; `displayVersion`, UI,
Dokumentation und Berichtsexport bleiben bei `2607.01.0`.

## 2026-10-03 · 2610.3.19 · GeoJSON wirklich reprojizieren

Ursache: GeoJSON ohne CRS lieferte Gradkoordinaten, während das Analysefeld
EPSG:25832 vorgab. Import nun getrennt vom koordinatentreuen Parser: RFC-7946-
Default WGS84 oder unterstützte explizite Quelle nach EPSG:25832 transformieren.
Z bleibt unverändert, alte manuelle CRS-Vorgabe wird zurückgesetzt. Herkunft
und Ziel sichtbar; unbekannte CRS nicht still ersetzen. Synthetische Tests
für Quelle, Z, UTM-Identität und DXF-/GeoJSON-Roundtrip; private Datei nur lokal.

## 2026-10-03 · 2610.3.20 · GeoJSON hinzuladen

GeoJSON-Laden ergänzt bestehende Daten statt sie zu ersetzen. Reine GeoJSON
erhält eindeutige Feature-IDs; bei DXF werden nur neue Geometrie und Layer
eingefügt, vorhandene Entitäten bleiben bytegleich. Quell-DXF, Prüfungen,
Karten und gemeinsamer Export nutzen den kombinierten Stand. CRS-Konflikte
brechen vor Übernahme ab. Synthetische Tests für mehrfaches Hinzufügen,
Handle-/ID-Eindeutigkeit, Layer, Originalerhalt und gemeinsamen Export.

## 2026-10-03 · 2610.3.21 · Hinzufügen für beide Formate

Die Formatabfrage aus .20 ließ DXF weiterhin ersetzen. Durch gemeinsamen
appendDataset-Einstieg ersetzt: GeoJSON/DXF in jeder Reihenfolge, mehrfach
und über Mehrfachauswahl/Drop ergänzen. Neues Reset-Element, Quelldateiliste.
Native DXF-Ressourcen, Blöcke, Layouts und Dictionary-Verweise berücksichtigen,
Handles kollisionsfrei neu zuordnen. Prüfung mit synthetischen Tagen inklusive
gleichnamiger Blöcke/Layer und Layouts sowie unabhängigem ezdxf-Audit.

## 2610.3.22 · 2026-10-04 · Footer

Footer mit MeasureMap abgeglichen: Link-Pills, fehlende öffentliche Projekt-/Quellenlinks beidseitig ergänzt, englisches Imprint. Eigene Hilfe-/Quellcode-Aktionen bleiben app-spezifisch.

## 2610.3.23 · 2026-10-08 · CRS-Auswahl

Native datalist filtert nach dem bereits eingetragenen Wert; dadurch sah die Liste wie eine Beschränkung auf 25832 aus. Durch select mit allen fünf integrierten CRS ersetzt. Eigene Eingabe separat erreichbar, Synchronisierung bei Import/Export und Sprachwechsel. Keine Änderung der Erkennung oder Koordinaten.

Prüfung: 179 Tests bestanden, 10 optionale Tests übersprungen; Typprüfung und Produktionsbuild erfolgreich. Browser: GK4-Auswahl und eigene Eingabe mit Normalisierung geprüft. npm audit: 5 Befunde in Entwicklungsabhängigkeiten (2 moderat, 3 hoch), Produktionsabhängigkeiten ohne Befund; keine Abhängigkeiten geändert. Repository öffentlich.
