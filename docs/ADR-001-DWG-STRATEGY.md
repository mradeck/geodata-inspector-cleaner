# ADR-001: Strategie für DWG-Unterstützung

**Status:** offen – Entscheidung nach Prototyp und Lizenzfestlegung  
**Datum:** 12. Juli 2026

## Kontext

DWG ist im Gegensatz zu ASCII-DXF und GeoJSON ein proprietäres binäres CAD-
Format. Eine reine Browser-SPA kann eine lokale Desktop-Konverteranwendung nicht
direkt starten. Gleichzeitig unterscheiden sich verfügbare Lösungen erheblich
bei Formatabdeckung, Lizenz, Betriebssystemunterstützung und Eignung für eine
öffentliche Webanwendung.

Die Analyse-Engine wird deshalb bewusst formatneutral entwickelt. DWG muss
später nur einen Adapter liefern, der das normalisierte Geometriemodell füllt.

## Bewertete Optionen

### Option A – Benutzer konvertiert DWG vorab nach DXF

**Ablauf:** Die SPA erklärt den notwendigen Schritt und verweist auf ein lokal
installiertes Konvertierungswerkzeug. Anschließend wird DXF analysiert.

**Vorteile:**

- SPA bleibt vollständig lokal und statisch
- kein Server und keine nativen Binärdateien
- geringstes Implementierungs- und Sicherheitsrisiko
- die eigentliche Analyse bleibt unverändert

**Nachteile:**

- zusätzlicher manueller Schritt
- Konvertierungsqualität und -einstellungen liegen außerhalb der App
- weniger komfortabel
- Konverterlizenz muss trotzdem verständlich kommuniziert werden

**Einordnung:** empfohlener erster DWG-Weg.

### Option B – Desktop-App mit lokalem Konverter-Sidecar

Eine Electron- oder Tauri-Variante könnte einen installierten oder mitgelieferten
Konverter starten und das erzeugte DXF anschließend lokal analysieren.

**Vorteile:**

- komfortabler lokaler Workflow
- keine CAD-Datei muss hochgeladen werden
- Fortschritt und Fehler können integriert angezeigt werden

**Nachteile:**

- keine reine SPA mehr
- Binärdateien, Signierung und Updates für mehrere Plattformen
- Lizenz- und Weitergaberechte des Konverters müssen geklärt werden
- externe Prozesse benötigen starke Eingabevalidierung und Isolation

`ezdxf` dokumentiert beispielsweise einen Adapter für den installierten ODA File
Converter. Dieser arbeitet über temporäre DXF-Dateien und weist ausdrücklich auf
das Sicherheitsrisiko externer Programmausführung hin:

- [ezdxf: ODA File Converter Support](https://ezdxf.readthedocs.io/en/stable/addons/odafc.html)

Die Open Design Alliance stellt einen DWG-/DXF-Konverter für Windows, macOS und
Linux bereit. Die Nutzungs- und Weitergabebedingungen müssen vor einer
Integration separat geprüft werden:

- [ODA File Converter](https://www.opendesign.com/guestfiles/oda_file_converter)
- [ODA FAQ zu Viewer und File Converter](https://www.opendesign.com/faq/question/what-are-oda-viewer-and-oda-file-converter)

### Option C – GNU LibreDWG

GNU LibreDWG ist eine freie C-Bibliothek zum Lesen und Schreiben von DWG. Die
Werkzeuge können unter anderem DWG nach DXF, JSON oder GeoJSON lesen.

**Vorteile:**

- Open Source
- direkter DWG-Zugriff
- Kommandozeilenprogramme und Bibliothek
- grundsätzlich als native oder möglicherweise WASM-basierte Komponente
  evaluierbar

**Nachteile:**

- GPLv3+ beeinflusst die Lizenz- und Distributionsstrategie des Gesamtprodukts
- Format- und Entitätsabdeckung muss mit realen Dateien geprüft werden
- WASM-Build, Speicherverhalten und Browserintegration sind eigene Projekte
- vollständige AutoCAD-Kompatibilität darf nicht ungeprüft versprochen werden

Primärquellen:

- [GNU LibreDWG](https://www.gnu.org/software/libredwg/)
- [GNU LibreDWG Manual](https://www.gnu.org/software/libredwg/manual/LibreDWG.html)
- [LibreDWG-Programme und Ausgabeformate](https://www.gnu.org/software/libredwg/manual/html_node/Programs.html)

**Einordnung:** technisch ernsthaft zu evaluieren, aber erst nach bewusster
GPL-Entscheidung. Nicht beiläufig als npm-/WASM-Abhängigkeit aufnehmen.

### Option D – ODA Drawings SDK oder Drawings inWeb

Die Open Design Alliance bietet kommerzielle SDKs für DWG/DXF und Webszenarien.

**Vorteile:**

- professionelle Formatabdeckung
- native Visualisierung und Konvertierung
- kommerzieller Support

**Nachteile:**

- Lizenzkosten und Vertragsprüfung
- stärkere Herstellerbindung
- komplexere Integration
- möglicherweise Server- oder spezielle Deploymentarchitektur

Primärquellen:

- [ODA Drawings SDK](https://www.opendesign.com/products/drawings)
- [ODA Exchange und Lizenzstufen](https://www.opendesign.com/products/exchange)

### Option E – Autodesk RealDWG

Autodesk RealDWG bietet offiziellen DWG-/DXF-Zugriff für C++ und .NET.

**Vorteile:**

- Hersteller-SDK
- hohe Kompatibilität mit AutoCAD-DWG
- professioneller Supportweg

**Nachteile:**

- kommerzielle Lizenzierung
- derzeit klar desktop-/Windows- und C++/.NET-orientiert
- nicht als einfacher Browserbaustein geeignet
- deutlich größere Betriebs- und Integrationsarchitektur

Primärquelle:

- [Autodesk RealDWG API](https://aps.autodesk.com/developer/overview/realdwg-api)

### Option F – serverseitiger Konvertierungsdienst

DWG wird hochgeladen, in einer isolierten Serverumgebung konvertiert und als
normalisiertes Ergebnis an die SPA zurückgegeben.

**Vorteile:**

- reine Weboberfläche bleibt möglich
- Konverter und Versionen zentral kontrollierbar
- große native SDKs laufen nicht beim Benutzer

**Nachteile:**

- sensible CAD-Daten verlassen das Gerät
- Datenschutz, Auftragsverarbeitung und Löschkonzept
- Infrastruktur-, Skalierungs- und Sicherheitskosten
- Upload großer Dateien
- Konverterlizenz muss Web-/SaaS-Nutzung erlauben

**Einordnung:** nur als bewusstes Opt-in-Angebot, nicht als stiller Standardweg.

## Vorläufige Entscheidung

1. Die erste SPA unterstützt DXF und GeoJSON direkt.
2. Für DWG wird zunächst eine dokumentierte Vorabkonvertierung nach DXF
   angeboten.
3. Das Kernmodell bleibt konverterunabhängig.
4. Parallel wird ein begrenzter Machbarkeitsvergleich durchgeführt:
   - LibreDWG CLI auf einem realen Testkorpus,
   - ODA File Converter als vom Benutzer installierte Abhängigkeit,
   - Kosten und Deploymentbedingungen kommerzieller SDKs.
5. Keine DWG-Bibliothek wird vor der Lizenzentscheidung fest eingebaut.

## Entscheidungskriterien für die endgültige Wahl

- erforderliche DWG-Versionen
- benötigte Entitäten, Blocks, XREFs, Layouts und Proxyobjekte
- reine Analyse oder auch verlustarmer Export
- öffentliches Open-Source-Projekt oder kommerzielles Produkt
- lokale SPA, Desktop-App oder optionaler Serverdienst
- Windows-only oder Windows und macOS
- zulässige Lizenz und Budget
- gemessene Konvertierungsqualität am Referenzkorpus
- Sicherheitsmodell für nicht vertrauenswürdige CAD-Dateien

## Konsequenz für die aktuelle Entwicklung

Alle UI-, Analyse- und Renderingfunktionen arbeiten nur gegen das normalisierte
`GeoDataset`. DWG-spezifische Typen oder SDK-Klassen dürfen nicht in die
Analysearchitektur durchsickern. So kann die DWG-Entscheidung später geändert
werden, ohne die App neu zu entwerfen.
