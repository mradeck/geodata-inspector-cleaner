# geodata-inspector-cleaner – Projektkontext

## Ziel

Lokale, datenschutzfreundliche Single-Page-App zur Inspektion und bewussten
Bereinigung räumlicher Auffälligkeiten in DXF- und GeoJSON-Dateien.

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
- Kein automatischer Versionssprung, Release oder Push ohne ausdrücklichen Auftrag.

## Standardbefehle

| Zweck | Kommando |
|---|---|
| Entwicklung | `npm run dev` |
| Typprüfung und Build | `npm run build` |
| Tests | `npm run test` |
| Vorschau | `npm run preview` |

## Entscheidungsdokumente

- Produkt und UX: `docs/PRODUCT-DESIGN.md`
- Architektur: `docs/ARCHITECTURE.md`
- Analyseverfahren: `docs/ANALYSIS-RULES.md`
- Umsetzungsplan: `docs/IMPLEMENTATION-PLAN.md`
- DWG-Strategie: `docs/ADR-001-DWG-STRATEGY.md`
