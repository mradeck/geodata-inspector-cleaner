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
