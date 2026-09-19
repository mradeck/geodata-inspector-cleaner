# Analyse- und Qualitätsregeln

**Status:** Arbeitsgrundlage; Schwellen sind konfigurierbar und müssen anhand
realer Dateien kalibriert werden.

## 1. Ausgangspunkt aus dem Pointcloud Manager

Der bestehende „Nirvana-Check“ verwendet:

- Median der Shape-Lagen als Referenz, wenn keine Punktwolke vorhanden ist,
- Punktwolken-Bounds als Referenz, wenn eine Wolke geladen ist,
- 1.000 m Distanzschwelle,
- Z=0-Toleranz von 1 mm,
- Unterdrückung der Z=0-Warnung bei reinen 2D-Dateien,
- Schutz vor Fehlwarnungen bei realen Projekthöhen nahe null.

Diese Regeln bleiben eine wertvolle Basis, reichen für eine eigenständige
Inspektionsanwendung aber nicht aus. Insbesondere kann ein einzelner Median
mehrere legitime Projektteile oder einen entitätsreichen Plankopf nicht erklären.

## 2. Räumliche Repräsentation eines Features

Für jedes Feature werden berechnet:

- Bounds
- Bounds-Mittelpunkt als räumlicher Repräsentant
- Vertexzahl
- Median-Z
- vollständige Z=0-Eigenschaft
- Layer und Quellentitätstyp

Ein INSERT oder Textobjekt kann im Prototyp nur über seinen Einfüge-/Ankerpunkt
repräsentiert sein. Das ist im Befund als Näherung auszuweisen.

## 3. Clusterbildung

Der Prototyp verbindet Feature-Repräsentanten, wenn ihr Abstand kleiner oder
gleich dem konfigurierten Clusterabstand ist. Ein räumliches Grid begrenzt die
Kandidatensuche auf Nachbarzellen. Union-Find bildet transitive Gruppen.

Standardwert: **1.000 m**.

Dieser Wert bedeutet nicht, dass jede Geometrie außerhalb von 1 km falsch ist.
Er steuert zunächst nur, welche räumlich getrennten Gruppen die App zeigt.

## 4. Hauptcluster

Der Hauptcluster-Kandidat wird zunächst nach Featurezahl, dann nach Vertexzahl
gewählt. Diese Entscheidung ist nur dann hinreichend eindeutig, wenn der Anteil
des Kandidaten mindestens 60 % der Features umfasst.

Bei geringerer Dominanz gilt der Datensatz als mehrdeutig:

- kein entferntes Cluster wird automatisch zum Entfernen empfohlen,
- die Vorschau zeigt alle Gruppen gleichrangig,
- der Benutzer muss Hauptbereich oder gültige Cluster explizit wählen.

### Separate Störbereichsvorschau

Die Störbereichsvorschau ist keine zusätzliche Heuristik, sondern eine
Darstellung der vorhandenen Clusterentscheidung:

- bei eindeutiger Dominanz oder manuell bestätigtem Hauptbereich zeigt sie die
  zur Entfernung empfohlenen Nicht-Hauptcluster,
- bei einer mehrdeutigen automatischen Wahl zeigt sie die Nicht-Hauptcluster
  nur mit dem Status `prüfen`,
- bei nur einem Cluster bleibt die Vorschau leer und meldet, dass kein separater
  Störbereich erkannt wurde.

Dadurch kann der Anwender die fragliche Geometrie im eigenen Maßstab prüfen,
ohne dass die Darstellung bereits eine Löschfreigabe suggeriert.

Spätere Versionen sollen ergänzende Scores berücksichtigen:

- abgedeckte Geometrielänge oder -fläche
- Layersemantik
- Entitätstypen
- räumliche Dichte
- optionale Referenz-Bounds
- manuell gewählter Hauptbereich

## 5. Extent-Inflation

```text
Inflationsfaktor = größte Gesamt-Ausdehnung / größte Fokus-Ausdehnung
```

Ein hoher Faktor zeigt, wie stark entfernte Inhalte „Zoom all“ und
Bounds-basierte Folgeprozesse beeinflussen. Der Faktor allein entscheidet nicht
über die fachliche Gültigkeit.

## 6. Z=0-Analyse

Ein Feature gilt als vollständig auf Z=0, wenn alle seine Z-Werte innerhalb
einer Toleranz von 0,001 m liegen.

Die Warnung wird nur aktiviert, wenn:

- zugleich Features mit echten Höhen existieren und
- der Median dieser echten Höhen mindestens 20 m von null entfernt liegt.

Damit werden reine 2D-Pläne und Küstenprojekte nahe Normalnull nicht pauschal
als fehlerhaft eingestuft.

## 7. CRS-Plausibilität

Die Heuristik liefert Kandidaten, keine automatische EPSG-Zuweisung:

- `|X| ≤ 180` und `|Y| ≤ 90`: geografische Längen-/Breitengrade plausibel
- typische sechsstellige X- und siebenstellige Y-Werte: projiziertes metrisches
  System plausibel, beispielsweise UTM; Zone bleibt unbekannt
- Millionenpräfix im Rechtswert: Gauß-Krüger-Familie möglich
- andere Werte: lokales oder unbekanntes Koordinatensystem

Nur explizite Metadaten dürfen als „deklariert“ erscheinen. Selbst dann soll
eine Plausibilitätsprüfung Widersprüche melden.

### Manuelle Analysevorgabe

Das Feld **CRS / EPSG** beginnt mit `EPSG:25832` und akzeptiert normalisierbare
Schreibweisen wie `25832`, `EPSG 25832` oder `EPSG:25832`. Die Herkunft bleibt
fachlich getrennt:

1. eine manuell bearbeitete Eingabe gilt als `input`,
2. andernfalls gilt ein aus der Datei gelesenes CRS als `metadata`,
3. ohne beides bleibt nur `heuristic` beziehungsweise `missing`.

Die Benutzervorgabe darf Clusterwahl und Kartenprojektion genauso unterstützen
wie ein deklariertes CRS, wird im Prüfbericht aber niemals als Dateimetadatum
bezeichnet. Sie verändert keine Koordinaten und löst keine Reprojektion aus.
Jede tatsächliche Änderung startet die räumliche Prüfung erneut und verwirft
eine vorhandene manuelle Hauptbereichsbestätigung. Der Cleaner bleibt gesperrt,
bis der Hauptbereich unter der neuen CRS-Annahme erneut bestätigt wurde.

### Kartenbasierte Clusterprüfung

Ein deklariertes CRS wird pro Cluster angewendet, nicht pauschal nur auf die
Gesamt-Bounds. Ein Cluster gilt für die OSM-Vorschau als kartierbar, wenn:

1. alle Bounds-Ecken endlich nach WGS84 transformiert werden,
2. die Breite innerhalb des Web-Mercator-Bereichs liegt und
3. der Mittelpunkt innerhalb des plausiblen Einsatzgebiets des CRS liegt.

Eine formell mögliche Transformation ist kein Beweis für eine korrekte Lage.
Beim private-project-Rohfixture ist der 101-Feature-Cluster minimal größer, liegt
nach EPSG:25832-Transformation aber außerhalb des plausiblen UTM-32-Gebiets.
Der 99-Feature-Cluster liegt dagegen kartierbar im tatsächlichen Projektbereich.

Die Kartenwahl ist eine explizite Benutzerentscheidung. Erst danach dürfen die
anderen Cluster als Entfernungskandidaten empfohlen werden.

Transformierbare Feature-Geometrien werden zusätzlich über OSM dargestellt.
Kartografisch plausible Geometrie erscheint grün und erhält einen blauen
Ausdehnungsrahmen; CRS-unplausible Störbereiche erscheinen rot. Auch ein
Cluster außerhalb des plausiblen CRS-Einsatzgebiets darf
gezielt über „Auf Karte zeigen“ betrachtet werden, sofern seine transformierten
Koordinaten technisch im Web-Mercator-Bereich liegen; sein Status bleibt dabei
unverändert `CRS-unplausibel`.

## 8. Geplante zusätzliche Prüfungen

| Prüfung | Zweck | Priorität |
|---|---|---:|
| BLOCK/INSERT-Ausdehnung | echte Plankopf-Bounds statt nur Einfügepunkt | hoch |
| ungültige Zahlen | NaN, Infinity, fehlende Pflichtwerte | hoch |
| doppelte Geometrie | identische oder fast identische Elemente | mittel |
| Nullsegmente | aufeinanderfolgende gleiche Vertices | mittel |
| Selbstschnitt | ungültige Polygonringe | mittel |
| extreme Z-Spanne | fehlerhafte Einzelhöhe | mittel |
| Einheiten-Plausibilität | mm/m/ft-Verwechslungen | mittel |
| gemischte CRS-Cluster | Daten aus unterschiedlichen Systemen | hoch |
| Paperspace vs. Modelspace | Plankopf korrekt vom Modell trennen | hoch |
| XREF-Inventar | fehlende oder entfernte Referenzen erkennen | später |

## 9. Kalibrierung

Schwellen dürfen nicht allein anhand synthetischer Tests festgelegt werden. Für
eine belastbare Version wird ein anonymisierter Referenzkorpus benötigt:

- korrekte Einzelcluster
- korrekte Mehrclusterdateien
- Dateien mit Plankopf-Ausreißern
- große Projektgebiete über 1 km
- lokale Koordinatensysteme
- UTM, Gauß-Krüger und WGS84
- 2D-, 2,5D- und 3D-Dateien
- Block-, Text-, Bogen-, Spline- und Hatch-lastige DXFs

Jede neue Regel benötigt positive und negative Referenzfälle, damit die Zahl
der Fehlalarme sichtbar bleibt.

## Exakte DXF-Duplikate (2607.03.1)

Der zusätzliche Check vergleicht vollständige Originalentitäten in ENTITIES.
Handle-Code 5 wird ignoriert, interne Owner-Handles (330) werden pro Objekt
kanonisiert. Alle anderen Tags bleiben relevant; für die zweite Kategorie werden
zusätzlich Layer-Tags (8) ignoriert. Keine Rundung, keine Toleranz, keine
Richtungsumkehr oder zyklische Umordnung. POLYLINE/VERTEX/SEQEND und
INSERT/ATTRIB/SEQEND sind atomare Objekte. Externe Referenzen verhindern die
Löschung betroffener Handles. Die Auswahl ist zunächst leer; die Befunde werden
nicht zu räumlichen Löschvorschlägen addiert. Ein eigener Export entfernt nur
explizit ausgewählte Entitätsbereiche und verifiziert die unveränderten
verbleibenden Inhalte.
