# Lernlog

Technische Erkenntnisse, Fehlerbilder und belastbare Lösungen des Projekts.
Das Lernlog wird vor jedem beauftragten Git-Push aktualisiert.

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
