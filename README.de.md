# geodata-inspector-cleaner

[English](README.md) · **Deutsch**

Lokale Single-Page-App zur Inspektion und kontrollierten Bereinigung von DXF-
und GeoJSON-Dateien. Der Schwerpunkt liegt auf Geometrie, die weit außerhalb
des eigentlichen Projektbereichs liegt und dadurch Folgeprozesse wie „Zoom all",
Bounds-Berechnungen, Exporte und GIS-/CAD-Weiterverarbeitung unbrauchbar macht.

**Live-Anwendung:** [geodata-inspector-cleaner.netlify.app](https://geodata-inspector-cleaner.netlify.app/)

Der Sprachbutton verwendet mitgelieferte SVG-Flaggen für eine einheitliche Anzeige unter Windows, macOS und Linux.

## Projektstatus

**Version 2610.3.18 – gezielte Reparatur von Einpunkt-Polylinien.** Der
aktuelle Stand demonstriert bereits:

- lokalen Dateiimport für ASCII-DXF und GeoJSON,
- eine vereinheitlichte interne Geometriestruktur,
- räumliche Clustererkennung ohne quadratischen Vollvergleich,
- Erkennung entfernter Zeichnungsgruppen,
- Gegenüberstellung von Gesamt-Ausdehnung und empfohlenem Fokusbereich,
- vorsichtige CRS-Plausibilitätsanalyse mit manuell pflegbarem EPSG-Feld und
  `EPSG:25832` als Standard,
- Z=0-Hinweise bei gemischten 2D-/3D-Daten,
- getrennte Übersicht- und Fokusvorschau,
- eigene Vorschau für den vermuteten Störbereich mit vorsichtiger
  `prüfen`-/`Entfernung empfohlen`-Kennzeichnung,
- OpenStreetMap-Plausibilitätsansicht für georeferenzierte Cluster,
- DXF-/GeoJSON-Geometrieüberlagerung auf OSM mit Haupt-/Störbereichsgrenzen,
- explizite Hauptbereichswahl aus dem Kartenkontext,
- einen gemeinsamen DXF-/GeoJSON-Export mit prüfbarer Vorauswahl,
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
- ein **Über**-Menü mit zweisprachiger „Über mich“-Ansicht, transparenter
  Pointcloud-Manager-Demoverlinkung und integrierter Copyright-/Lizenzübersicht,
- die vollständige Release-Version direkt neben dem App-Titel und zusätzlich in
  Browser-Tab und Statuszeile,
- eine standardmäßig eingeklappte, bedarfsgerecht rendernde
  Störbereichsvorschau,
- eine an die Browserhöhe gebundene Startansicht ohne äußeren vertikalen
  Scrollbalken sowie theme-spezifisch lesbare Vorschauraster,
- einen reproduzierbaren Demo-Datensatz.

Die Quelldatei wird niemals überschrieben. Der Cleaner erzeugt eine neue Datei
mit dem Suffix `-cleaned` und prüft sie vor dem Download durch einen internen
Kontrollimport.

## Hilfe, Sprache und Darstellung

Der frühere **Konzept**-Button in der Kopfleiste ist durch **Hilfe** ersetzt.
Die Hilfeseite rendert den Inhalt dieser `README.de.md` direkt als formatiertes
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

Das Kopfmenü **Über** enthält wie im Pointcloud Manager die Einträge **Über
mich** und **Copyright**. „Über mich“ öffnet eine zweisprachige Kurzvorstellung
von Michael Radeck. Die Texte wurden aus dem Pointcloud Manager übernommen und
um den Bezug zum Geodata Inspector & Cleaner ergänzt. Verlinkt sind
Multikopterschule XMS, DroneMediaMunich, XING und Crew United. Der dort ebenfalls
verlinkte [Pointcloud Manager](https://stable-v53--pointcloud-manager.netlify.app/)
ist ausdrücklich als reduzierte Online-Version mit Funktionslimits und
Upgrade-/Upsell-Hinweisen gekennzeichnet.

**Copyright** öffnet die versionierte
[`docs/COPYRIGHT-LICENSES.md`](docs/COPYRIGHT-LICENSES.md) direkt in einem
App-Dialog. Die Datei bleibt damit die gemeinsame Quelle für Release-Stand,
Bibliothekslizenzen, OpenStreetMap-Pflichten und die Sicherheitsgrenze des
Markdown-Renderers.

Am unteren Rand findest du **Weitere Apps**: Geoid Forge, DXF Coordinate Forge,
[PointCloud Manager](https://www.pointcloud-manager.com) und GPS / UTM Converter.
Die kompakte Fußzeile bleibt im App-Viewport sichtbar und verlinkt außerdem
**Impressum**, **Ko-fi** und **Lizenzen / Copyright**. Der Lizenzlink öffnet dieselbe
gepflegte Übersicht wie das Über-Menü; keine zweite Lizenzliste.

**Hilfe / Bugreport / Kontakt** öffnet ein Fenster mit der Anwenderhilfe sowie
E-Mail-Links an **michael.radeck@email.de**. Der Bugreport bereitet einen Betreff
mit App-Version und eine Vorlage für Reproduktionsschritte, erwartetes/tatsächliches
Verhalten sowie Browser/Betriebssystem vor. Ein eingerichtetes E-Mail-Programm ist
erforderlich. Die App versendet nichts selbst und hängt keine Quelldateien,
Koordinaten oder Prüfberichte automatisch an. Sensible Projektdaten bitte vor
dem freiwilligen Teilen entfernen. Externe Apps, Impressum und Ko-fi werden erst
beim Anklicken geöffnet; es gibt weder eingebettete Spenden-Widgets noch neue Tracker.
Beschriftungen, Hilfe-Link und E-Mail-Vorlage folgen der DE-/EN-Sprachwahl.

## Versionsanzeige und kompakte Störbereichsvorschau

Die kanonische Version steht nun wie beim Pointcloud Manager direkt neben dem
App-Titel, beispielsweise `v2609.3.10`. Browser-Tab und untere Statuszeile zeigen
denselben Stand. Die Anzeige wird zentral aus `package.json` bezogen und nicht
als unabhängiger Versionswert gepflegt.

Die dritte Vorschau **Vermuteter Störbereich** ist standardmäßig eingeklappt,
damit die Hauptbereichsprüfung und die große OSM-Karte schneller erreichbar
bleiben. Die Kopfzeile zeigt weiterhin Ausdehnung, Featurezahl und die fachliche
Kennzeichnung **PRÜFEN** beziehungsweise **ENTFERNUNG EMPFOHLEN**. Mit
**Einblenden** wird die Detailansicht geöffnet; erst dann werden Canvas und
Störbereichskarte in ihrer sichtbaren Größe neu gerendert. Erneutes Anklicken
oder **Einklappen** schließt sie wieder. Die Entscheidung betrifft nur die
Darstellung und verändert weder Analyse noch Exportauswahl.

Im geschlossenen Zustand belegt die Störbereichsvorschau ausschließlich ihre
Kopfzeile; es bleibt keine leere Canvas- oder Grid-Fläche stehen. Die rechte
Seitenleiste hält die Cleaner-Karte dauerhaft erreichbar und scrollt längere
Befundlisten in einem eigenen Bereich. Die frühere Roadmap-Kachel wurde aus der
Seitenleiste entfernt; die DWG-Strategie bleibt weiterhin im Abschnitt
**Dokumentation** verlinkt.

### Startansicht und Vorschauraster

Die App-Hülle belegt exakt die verfügbare Browserhöhe. Kopfzeile, Arbeitsbereich
und Statuszeile bleiben dadurch gemeinsam im Viewport; die leere Startansicht
erzeugt keinen äußeren vertikalen Scrollbalken mehr. Nach einem Import scrollen
lange Analyseergebnisse weiterhin innerhalb der mittleren Bühne, Seitenleisten
bei Bedarf in ihrem eigenen Bereich. Die langen Hilfe- und Konzeptseiten bleiben
unabhängig davon normal scrollbar.

Das technische Raster der leeren Vorschau verwendet getrennte Theme-Werte. Im
hellen Interface sind die Linien nun mit einem zurückhaltenden dunklen Grünton
sichtbar. Im dunklen Interface wurde der bisher sehr schwache helle Grünton
leicht angehoben. Das Raster dient nur der räumlichen Orientierung und verändert
keine Geometrie oder Analyse.

## CRS / EPSG für die Analyse festlegen

Im linken Abschnitt **02 · Analyse** steht wie im Pointcloud Manager ein
manuell pflegbares Feld **CRS / EPSG**. Der Startwert ist `EPSG:25832`. Zulässig
sind unter anderem `25832`, `EPSG 25832` und `EPSG:25832`; die App normalisiert
diese Schreibweisen auf `EPSG:25832`. Direkt angeboten werden derzeit
`EPSG:25832`, `EPSG:25833`, `EPSG:31468`, `EPSG:4326` und `EPSG:3857`.

Eine Eingabe wird nach kurzer Tipp-Pause, mit **Enter** oder beim Verlassen des
Feldes übernommen. Danach laufen Clusterbewertung, CRS-Plausibilitätsprüfung,
CRS-gestützte Hauptbereichswahl und alle OSM-Vorschauen erneut. Wenn die Datei
ein eindeutig lesbares CRS deklariert und das Feld noch nicht manuell bearbeitet
wurde, übernimmt die App diesen Wert; andernfalls bleibt `EPSG:25832` der
Standard. Ein leeres Feld fällt auf Dateimetadaten beziehungsweise die vorsichtige
Koordinatenheuristik zurück.

Die Eingabe ist eine **Analyse- und Exportvorgabe**, keine Reprojektion. XY-/Z-
Koordinaten werden nicht verändert. Beim Cleaner-Export wird der normalisierte
Code lediglich als CRS-Metadatum beziehungsweise DXF-Kommentar übernommen. Ein
formal gültiger, aber für die Kartenvorschau nicht registrierter EPSG-Code bleibt
im Bericht sichtbar; die OSM-Projektion wird dafür nicht erfunden.

Weil ein anderes CRS zu einer anderen räumlichen Bewertung führen kann, setzt
jede CRS-Änderung eine bereits manuell bestätigte Hauptbereichswahl zurück. Der
korrekte grüne Bereich muss danach erneut auf der Karte geprüft und bestätigt
werden. So kann keine Cleaner-Freigabe unbemerkt unter einer geänderten
CRS-Annahme weiterverwendet werden.

## Ein gemeinsamer Export für alle Prüfungen

1. DXF oder GeoJSON laden. Die Quelldatei bleibt unverändert.
2. Standard ist Datenerhalt: Messpunkte, Namen, Codes und Höhenbeschriftungen
   bleiben ausgewählt. Geometrische Z-Werte bleiben erhalten. Nur exakte
   Duplikate auf demselben Layer und geeignete Einpunkt-Reparaturen sind vorausgewählt.
3. Entfernte Bereiche, Duplikate auf anderen Layern und Schraffurumrisse bewusst
   auswählen; räumliche Entfernung allein ist kein nachgewiesener Fehler.
4. Rechts unten alle Aktionen und die tatsächliche Exportbilanz prüfen. Die
   optionale Auswahl **Nur Geometrie** entfernt Beschriftungen und zusätzliche
   CAD-Verwaltungsdaten, aber keine geometrischen Höhen. Ohne diese Option
   bleibt die Originalstruktur erhalten. Exportkarte und Einpunkt-Karte zeigen
   geplante Änderungen vor dem Speichern.
5. Einmal exportieren und den Speicherort wählen. Es gibt keine separaten
   DXF-Downloads für Duplikate oder Schraffuren und keine zusätzliche
   Hauptbereichsbestätigung. Der erfolgreiche DXF-Export wird zum neuen
   Arbeitsstand; beim Abbrechen bleibt die Auswahl erhalten.

Die Quellobjekte sind bis zum Export unverändert. Deshalb zeigt das Inventar
weiterhin die geladenen Zahlen; die Exportbilanz zeigt das geplante Ergebnis.
Der Kopfbutton **Prüfbericht** speichert auf Wunsch die Auswahl und nach dem
Export das angewendete Änderungsprotokoll. Kein zweiter automatischer Download.

### DXF-Struktur und Duplikate

Der gemeinsame DXF-Export erzeugt eine schlanke AutoCAD-2018-DXF aus nativen
Geometriedaten. Er enthält nur ausgewählte Geometrien, benötigte Layer,
Linienarten, Textstile und tatsächlich verwendete Blockdefinitionen. Ungenutzte
CAD-Verwaltungsdaten, Erweiterungswörterbücher, Anwendungsdaten und Vorschaubilder
entfallen. Koordinaten, Z, Kreisbögen, Polylinienbreiten und Extrusionsrichtungen
werden nicht aus der vereinfachten Vorschau rekonstruiert. Keine Reprojektion.
Die Versionswahl gilt weiterhin für die separate GeoJSON→DXF-Konvertierung.

Duplikate werden anhand originaler Tags verglichen, einschließlich Z und
Eigenschaften; Handles dienen der Identifikation. Gleicher-Layer- und zusätzliche
layerübergreifende Kopien werden getrennt angezeigt. Layerübergreifende Treffer
können fachlich unterschiedliche Bedeutungen haben und lassen sich abwählen.

Nur teilweise ausgewählte Verbundobjekte (INSERT mit Attributen) bleiben als
Ganzes erhalten und werden in der Bilanz genannt. Nicht unterstützte ausgewählte
Geometrien sperren den kompakten Export mit Angabe des Objekttyps, statt still
zu verschwinden. Unterstützt sind unter anderem native Linien, Kreise, Bögen,
Ellipsen, Splines, Polylinien, Flächen, Texte sowie INSERTs mit benötigten Blöcken.

### Schraffurumrisse

Die Erzeugung gilt ausschließlich für Schraffuren, die nach den gewählten
Löschungen noch vorhanden sind. Alle Außen-/Innenringe werden als geschlossene
LWPOLYLINE auf dem Original-Layer erzeugt. Vollständig durch Umrisse abgedeckte
Schraffuren werden im Export ersetzt. Bei
abgeschalteter Option werden keine zusätzlichen Polylinien erzeugt.
Identische bereits vorhandene/geplante Umrisse werden nicht erneut angelegt.
Linien und Kreisbögen bleiben exakt; Ellipsen und Splines werden mit einer
Abtasttoleranz von 0,001 Zeichnungseinheiten angenähert und gekennzeichnet.
Unvollständige oder offene Ränder werden mit Grund ausgelassen; die Schraffur
bleibt vollständig erhalten. Nur ENTITIES ab R14, keine Blockdefinitionen.

Beispieldatei: Zwei Schraffur-Duplikate sind vorausgewählt. Nach Entfernen bleiben
32 Schraffuren, die durch 33 unterschiedliche Umrisse einschließlich
Innenring ersetzt werden (rund 12 kB). Der echte Pointcloud-Manager-Importer liest daraus 33 unterschiedliche
Shapes. Kein normalisierender Zweitexport erzeugt zusätzliche Kopien.
Der ausgewählte Außenbereich einschließlich Layout-/Schriftfeldobjekten entfällt.

### Speicherort und Abbruch

In unterstützten Browsern öffnet der Export direkt die native Speichern-unter-
Auswahl. Pro Datei wird neu gefragt; keine gespeicherten Dateihandles. Abbruch
verändert weder Quelldatei noch Arbeitsstand. Fehler öffnen einen Dialog mit
erneutem Versuch. Bietet der Browser keine native Auswahl an, erklärt die App
diese Einschränkung und bietet einen ausdrücklich beschrifteten normalen
Download als Ersatz an; dessen Ziel bestimmt der Browser.

### GeoJSON

Bereichs- und Layer-/Typauswahl werden beim gemeinsamen GeoJSON-Export angewendet.
Alternativ ist die Umwandlung nach DXF mit AC1015 oder AC1032 möglich. Koordinaten
bleiben unverändert. Die normalisierte GeoJSON→DXF-Konvertierung repräsentiert
keine komplexen CAD-Objektstrukturen; der direkte DXF-Pfad erhält diese hingegen.

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

Aktuell **2610.3.18**, öffentlicher MIT-Stand mit bereinigter Historie. Das Schema
lautet `JJMM.R.P`: Jahr/Monat, Release-Linie, Subversion. Derselbe Wert steht in
`package.json`, `package-lock.json`, `displayVersion`, App und Prüfberichten.
Bei neuen Runden wird auch der aktuelle Monat geprüft. Frühere Einträge mit
Juli-Präfix bleiben in der Historie als damals veröffentlichte Stände erhalten.

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
| `2610.3.18` | 2026-10-03 | Einpunkt-LWPOLYLINE-Prüfung mit expliziter Auswahl, Punktabgleich und unveränderter Originalreparatur. |
| `2610.3.12` | 2026-10-02 | Bereinigtes öffentliches MIT-Repository; bestehende Netlify-Site neu verknüpft. |
| `2610.3.11` | 2026-10-02 | MIT-Lizenz und Ausschluss privater Vermessungsdaten. |
| `2609.3.10` | 2026-09-28 | Schlanker Standardexport: native Geometrie und benötigte Ressourcen; vollständig abgedeckte Schraffuren durch Umrisse ersetzen. |
| `2609.3.9` | 2026-09-28 | Außenbereiche mit Layout-/Plankopfobjekten einschließlich zugehöriger Verwaltungsverweise korrekt löschen; Export und erneuten Import geprüft. |
| `2609.3.8` | 2026-09-28 | Außenbereiche automatisch ausgewählt; eigene synchronisierte Export-Schalter mit Duplikat- und Schraffurzahlen. |
| `2609.3.7` | 28. September 2026 | Gemeinsamer Exportplan: Duplikate/Bereiche vorausgewählt, Umrisse aktivierbar; ein DXF-Export mit Originalstruktur und direkter Speicherortwahl. |
| `2609.3.6` | 28. September 2026 | Speicherortabfrage je Export; Abbruch und Schreibfehler behandelt, expliziter Download-Ersatz bei fehlender Browserunterstützung. |
| `2609.3.5` | 28. September 2026 | Doppelte Konturen beim nachgeschalteten Cleaner-Export verhindert; mit tatsächlichem Pointcloud-Manager-Importer geprüft. |
| `2609.3.4` | 28. September 2026 | Schraffur-Duplikate trotz IDBUFFER-Mitgliedslisten direkt löschbar; zugehörige Listenverweise kontrolliert entfernen und protokollieren. |
| `2609.3.3` | 28. September 2026 | Versionsmonat korrigiert; geschlossene Schraffurumrisse auf Original-Layern einschließlich Innenringen, Kurvenunterstützung und strukturerhaltendem DXF-Export. |

| `2607.03.3` | 22. September 2026 | Kompakte Fußzeile mit weiteren Apps, Hilfe-/Bugreport-/Kontaktfenster, bestehender Lizenzübersicht, Impressum und Ko-fi; DE/EN und beide Themes. |
| `2607.03.2` | 19. September 2026 | Duplikatbereinigung aktualisiert den aktiven Datensatz und alle Objektzahlen, Layer, Karten und Befunde automatisch; weitere Bereinigung ohne erneuten Import. |
| `2607.03.1` | 19. September 2026 | Automatischer DXF-Duplikatcheck, getrennte Treffer für gleiche und unterschiedliche Layer, optionale Löschliste mit Handles und eigenem strukturerhaltenden Export samt Protokoll. |
| `2607.03.0` | 13. Juli 2026 | Neue Release-Linie mit viewportgerechter Startansicht und Theme-Rastern, manuellem CRS-/EPSG-Analysefeld samt sicherer Neuanalyse sowie kompakter Störbereichs-Summary, scrollbar stabilisierten Befunden und bereinigter rechter Seitenleiste; konsolidiert 2607.02.1 bis 2607.02.3. |
| `2607.02.3` | 13. Juli 2026 | Geschlossene Störbereichsvorschau auf die reine Kopfzeile reduziert, rechte Befundliste als eigener Scrollbereich stabilisiert und Roadmap-Kachel aus der Seitenleiste entfernt. |
| `2607.02.2` | 13. Juli 2026 | Manuell pflegbares, zweisprachiges CRS-/EPSG-Analysefeld mit `EPSG:25832` als Standard, normalisierten Eingabeformen, automatischer Neuanalyse und sicherem Zurücksetzen früherer Cleaner-Bestätigungen. |
| `2607.02.1` | 13. Juli 2026 | Startansicht exakt an die Browserhöhe gebunden, äußerer vertikaler Scrollbalken entfernt und Vorschauraster in hellem sowie dunklem Theme gezielt kontrastiert. |
| `2607.02.0` | 13. Juli 2026 | Neue Release-Linie mit vollständiger Versionsnummer neben dem App-Titel sowie standardmäßig eingeklappter, bedarfsgerecht gerenderter Störbereichsvorschau; enthält zusätzlich den zuvor lokalen Über-/Copyright-Stand aus 2607.01.4. |
| `2607.01.4` | 13. Juli 2026 | Über-Menü mit Über-mich- und Copyright-Eintrag, In-App-Rendering der Lizenzübersicht sowie transparent gekennzeichneter Link zur reduzierten Pointcloud-Manager-Onlineversion. |
| `2607.01.3` | 13. Juli 2026 | README-basierte Hilfeseite statt Konzept-Schaltfläche, übernommene und zweisprachig ergänzte „Über mich“-Information sowie lokal gespeicherter Hell-/Dunkelmodus für App und Hilfe. |
| `2607.01.2` | 13. Juli 2026 | DXF-Zielformate AC1015/AutoCAD 2000 und AC1032/AutoCAD 2018 mit gespeicherter Auswahl sowie vollständigem OEM-kompatiblem DXF-Gerüst aus dem Pointcloud-Manager. |
| `2607.01.1` | 12. Juli 2026 | Cleaner mit normalisiertem DXF-Export, Haupt-/Störbereichskarten, CRS-gestützter Hauptbereichswahl, Layer-/Objekttypfilter und DXF-Layermetadaten, GeoJSON→DXF-Konvertierung, Inter-Typografie und lokal sichtbarer Patchversion. |
| `2607.01.0` | 12. Juli 2026 | Erster main-Release mit DXF-/GeoJSON-Analyse, Cluster- und CRS-Prüfung, drei Vorschaufenstern, OSM-Geometrieüberlagerung, DE/EN-Oberfläche und realen privaten Regressionsfixtures. |

## Private Testdaten

Echte Vermessungsdateien, deren Manifest, Referenztests mit exakten Koordinaten
und daraus erzeugte Screenshots gehören nicht zum Repository.
Parser- und Cleaner-Regressionen verwenden weiterhin synthetische Testfälle.
`.gitignore` verhindert das versehentliche Einchecken von DXF-/GeoJSON-Dateien.

## Herkunft der Idee

Das Projekt extrahiert und erweitert die beim DXF-/GeoJSON-Import des
`pointcloud-manager` entstandene „Nirvana“-Prüfung. Es ist bewusst eine
eigenständige Anwendung: keine Punktwolkenwerkzeuge, kein Messeditor und keine
Abhängigkeit vom Viewer-Zustand des Ursprungsprojekts.

## Lizenz

Der Projektquellcode steht unter der [MIT-Lizenz](LICENSE).
Copyright © 2026 Michael Radeck.

Lizenzen und Attributionspflichten der verwendeten Bibliotheken und Kartendaten
bleiben bestehen; siehe [Copyright- und Lizenzübersicht](docs/COPYRIGHT-LICENSES.md).
Die realen Vermessungsfixtures unter `test-data/dxf/real-world` sind hiervon
nicht umfasst und benötigen eine separate Freigabe für die öffentliche Weitergabe.
Eine mögliche Verwendung von GNU LibreDWG (GPLv3+) benötigt weiterhin eine
eigene Lizenz- und Distributionsentscheidung.

## Löschung von Layout-/Plankopfobjekten ab 2609.3.9

Ausgewählte CAD-Objekte werden mit ihren eigenen Erweiterungsdaten entfernt.
Bekannte Verwaltungsverweise (Blockreferenzlisten, Zeichenreihenfolge, aktives
Ansichtsfenster, Feldlisten und benannter Blockhierarchieindex) werden gezielt
bereinigt. Unbekannte eingehende Verweise und uneindeutige Kennungen bleiben
gesperrt. Die Exportbilanz unterscheidet CAD-Objekte von Vorschauobjekten:
ein Plankopf mit 25 Attributen zählt als ein CAD-Objekt und 26 Vorschauobjekte.
Nach erfolgreichem Export zeigt die Oberfläche den neuen Arbeitsstand; null
weitere Löschungen oder Umrisse sind dann das erwartete Ergebnis.

## Ungültige DXF-Linien reparieren

Vermessungsexporte, unter anderem aus Emlid, können Einpunkt-LWPOLYLINE enthalten
und „Invalid Line String size“ verursachen. **Ungültige DXF-Linien** prüft Originaltags.
**In Punkte umwandeln** ist für geeignete Linien vorausgewählt. Alternativ **Linien
löschen** oder **Unverändert behalten**, rechts unten für alle oder einzeln je Zeile.
Die ausdrückliche Löschwahl entfernt Linien auch ohne vorhandene Punktkopie.

Im gemeinsamen Export stehen die tatsächlichen Umwandlungen, Löschungen und
wiederverwendeten Punkte. Erhaltene POINTs mit exakt gleichen XYZ im selben
Zeichenbereich werden auch auf anderen Layern wiederverwendet. Andernfalls wird
ein POINT mit originalen XYZ auf dem Layer der Linie erzeugt. Mehrere Umwandlungen
am selben Standort erzeugen nur einen Punkt. Außenbereiche und ausdrücklich gesetzte
Layerfilter haben Vorrang; entfernte Geometrie wird nicht wiederhergestellt.
Alle Layer-/Typkategorien bleiben standardmäßig ausgewählt.

Alle Schritte laufen über **DXF exportieren · Daten erhalten** rechts unten.
Der kompakte Geometrieexport ist nur noch eine ausdrückliche Option. Nach dem Speichern
wird neu analysiert. Der optionale **Prüfbericht** enthält Änderungen und Koordinaten
und bleibt lokal.

Ungültige XYZ/Zähler, abweichende Extrusion, Breiten/Bögen/Dicke, uneindeutige Handles
und eingehende Referenzen sperren die Bearbeitung. Die Regel akzeptiert zunächst
nur ASCII-Dateien und Einpunkt-LWPOLYLINE; weitere Geometriefehler brauchen eigene Regeln.

## Punktbegleiter und Kartenkontrolle ab 2610.3.18

Messpunkte, Beschriftungen und Blöcke sind getrennte Filterkategorien. Wird ein
POINT abgewählt, folgen eindeutig zugeordnete TEXT-/MTEXT-Begleiter automatisch.
Zuordnung über direkte Punkt-Handle-Verweise oder exakt gleiche XY-Anker im selben
Zeichenbereich. Überlebt eine Punktkopie am Anker, bleiben gemeinsame Begleiter.
Versetzte oder unklare Texte werden nicht dem nächstgelegenen Punkt zugeschlagen;
die Anzahl unzugeordneter Texte ist sichtbar. Referenzschutz bleibt wirksam.

**Exportauswahl auf der Karte** bietet Zoom und Verschieben sowie einen
zuschaltbaren OSM-Hintergrund. Grün bedeutet behalten, Rot entfernen und Blau umwandeln.
Objekte anklicken, um eine manuelle Abwahl zu setzen oder zurückzunehmen; weitere
Filter gelten zusätzlich. **Kartenauswahl zurücksetzen** hebt nur diese manuellen
Abwahlen auf. Layer-, Bereichs-, Duplikat- und Reparaturauswahl aktualisieren die
Karte anhand des tatsächlichen Exportplans. Tooltips nennen Typ, Handle, Layer,
XYZ und Aktion. Begleittexte sind an ihren Einfügepunkten dargestellt.

Die eigene **Einpunkt-Linien**-Karte zeigt ausschließlich erkannte Einpunkt-Linien,
beim Laden mit Zoom auf genau diese Objekte. Aktionen kommen aus der Reparaturliste;
**Zoom auf alle** passt den Ausschnitt jederzeit erneut ein. Ungültige Koordinaten
können nicht kartiert werden; die Befundliste bleibt dafür maßgeblich.

## OSM in den ersten beiden Vorschauen ab 2610.3.18

Exportauswahl und Einpunkt-Karte besitzen je einen unabhängigen Schalter
**OSM-Hintergrund anzeigen**, anfangs eingeschaltet. Das eingestellte CRS/EPSG
wird für die Darstellung nach WGS84/Web Mercator umgerechnet; Quell- und
Exportkoordinaten bleiben unverändert. Beim Umschalten wird der zugehörige
Objektausschnitt erneut eingepasst, in der Einpunkt-Karte ausschließlich die Befunde.
Bei fehlender oder nicht darstellbarer Projektion bleibt die vollständige lokale
XY-Ansicht mit Hinweis sichtbar. CRS-Widersprüche werden ausdrücklich angezeigt.
Sichtbare Kartenkacheln werden online geladen; OSM sieht Ausschnitt und IP-Adresse,
keine hochgeladene DXF. Attribution bleibt sichtbar. ALKIS ist nicht eingebunden.

## Heller Standard und kompakte Exportkachel

Hell ist das Standarddesign; eine ausdrücklich gespeicherte Dunkelwahl bleibt
erhalten. Die Exportdetails sind bei jeder neu geladenen Datei geschlossen.
Kurzbilanz und Exportbutton bleiben sichtbar. **Exportdetails und Auswahl**
öffnet alle Optionen. Das Einklappen ändert keine Auswahl oder Exportaktion.
