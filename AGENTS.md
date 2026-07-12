# geodata-inspector-cleaner – Projektkontext

## Projekt-Stammdaten

- **Projektname:** geodata-inspector-cleaner
- **Typ:** lokale Single-Page-App zur DXF-/GeoJSON-Inspektion
- **Aktuelle Release-Version:** `2607.01.0`
- **npm-kompatible Version:** `2607.1.0`
- **Repository:** privates GitHub-Repository `mradeck/geodata-inspector-cleaner`
- **Tech-Stack:** Vite 8, TypeScript strict, Leaflet, proj4, marked, Vitest
- **README:** `README.md`
- **Lernlog:** `docs/LERNLOG.md`
- **Copyright-/Lizenzübersicht:** `docs/COPYRIGHT-LICENSES.md`

## Ziel

Lokale, datenschutzfreundliche Single-Page-App zur Inspektion und bewussten
Bereinigung räumlicher Auffälligkeiten in DXF- und GeoJSON-Dateien.

## Versionsschema und Subversionen

Die sichtbare Release-Version folgt `JJMM.RR.P`:

- `JJMM`: zweistelliges Jahr und Monat, beispielsweise `2607` für Juli 2026.
- `RR`: zweistellig hochgezählte Hauptrelease-Nummer innerhalb des Monats,
  beginnend mit `01`.
- `P`: Subversion/Patchnummer, beginnend mit `0`.

Beispiele:

- `2607.01.0`: erster Hauptrelease im Juli 2026.
- `2607.01.1`: erster Hotfix beziehungsweise kleine Subversion dieses Releases.
- `2607.02.0`: nächster Funktionsrelease im selben Monat.
- `2608.01.0`: erster Funktionsrelease im Folgemonat.

Ein Funktionsrelease erhöht `RR` und setzt `P` auf `0`. Ein enger Bugfix,
Dokumentations- oder Packaging-Nachtrag ohne neue Hauptfunktion erhöht nur `P`.
Beim Monatswechsel beginnt `RR` wieder mit `01`. Versionssprünge erfolgen nie
automatisch, sondern nur auf ausdrücklichen Nutzerauftrag.

SemVer verbietet führende Nullen in numerischen Segmenten. Deshalb verwenden
`package.json` und `package-lock.json` für `2607.01.0` die npm-kompatible Form
`2607.1.0`. Das zusätzliche Feld `displayVersion`, die sichtbare App-Anzeige,
Berichte und Dokumentation verwenden die kanonische Form `2607.01.0`.

## Versionierungs-, Dokumentations- und Push-Regel

Versionssprünge, README-/Lernlog-/Dokumentationsupdates und Git-Pushes erfolgen
**nur auf ausdrückliche Ansage des Nutzers**. Normale Implementierungs-,
Recherche- oder Fehlerbehebungsaufgaben erhöhen die Version nicht automatisch.

Wenn ein GitHub-Push, Release-Stand oder explizites Dokumentationsupdate
beauftragt ist, sind Release-Stand und Dokumentation konsistent nachzuziehen.

Pflichtschritte vor jedem Push:

1. **Versionsnummer erhöhen**
   - kanonische Release-Version bestimmen,
   - `package.json` und `package-lock.json` npm-kompatibel aktualisieren,
   - `displayVersion`, sichtbare App-Version und Berichtsversion aktualisieren,
   - README, AGENTS und Versionshistorie konsistent halten.
2. **README aktualisieren**
   - neue/geänderte Funktionen,
   - relevante Bedienänderungen,
   - Datenschutz-, Daten- und Nutzerhinweise.
3. **Lernlog aktualisieren**
   - technische Erkenntnisse,
   - Fehlerbilder und Ursachen,
   - stabile Lösungen und bewusste Grenzen.
4. **Projektkontext prüfen**
   - Version, Release-Stand, Arbeitsregeln und projektspezifische Fallstricke in
     `AGENTS.md` abgleichen.
5. **Copyright-/Lizenzübersicht prüfen**
   - `docs/COPYRIGHT-LICENSES.md` gegen `package.json`, `package-lock.json` und
     externe Dienste wie OpenStreetMap prüfen,
   - neue/entfernte Bibliotheken, Versionen, Lizenzen, Notices und
     Attributionspflichten aktualisieren,
   - Abhängigkeiten mit GPL, AGPL, Non-Commercial- oder unklaren Bedingungen
     ausdrücklich kennzeichnen und vor einer Veröffentlichung klären.
6. **Verifizieren**
   - `npm run test`,
   - `npm run build`,
   - `npm audit`,
   - `git diff --check`,
   - Versionskonsistenz und Repository-Sichtbarkeit prüfen.
7. **Bewusst committen und pushen**
   - nur den bestätigten Arbeitsumfang stagen,
   - aussagekräftigen Release-Commit erstellen,
   - den beauftragten Branch pushen,
   - Push-Ergebnis und Remote-Commit verifizieren.

Merksätze:

- **Kein Versionssprung, Doku-Nachzug oder Git-Push ohne ausdrückliche Ansage.**
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
- Reale DXF-Referenzfixtures gelten als sensibel. Sie dürfen nur nach
  ausdrücklicher Freigabe in ein weiterhin privates Repository gepusht werden.
  Eine öffentliche Freigabe benötigt eine gesonderte Anonymisierungs- und
  Rechteprüfung.

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
