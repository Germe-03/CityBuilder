# CityGame Strategie und TODO

## Zielbild

Wir bauen ein browserbasiertes 3D-CityGame inspiriert von SimCity und Cities: Skylines. Der erste Fokus liegt nicht auf maximaler Komplexitaet, sondern auf einem kleinen, gut spielbaren Simulationskern: Stadt in einer perspektivischen 3D-Welt planen, bauen, wachsen lassen, Probleme erkennen und sinnvolle Entscheidungen treffen.

Langfristig soll daraus eine Web App werden, die im Browser fluessig laeuft, speichert, spaeter als PWA installierbar ist und modular erweitert werden kann.

## Design-Prinzipien

- Lesbare Simulation: Der Spieler soll verstehen, warum etwas passiert.
- Interessante Zielkonflikte: Wachstum, Finanzen, Zufriedenheit, Umwelt und Infrastruktur sollen sich gegenseitig beeinflussen.
- Schneller Einstieg: Erste Stadt innerhalb weniger Minuten spielbar.
- Tiefe durch Systeme: Komplexitaet entsteht durch Zusammenspiel einfacher Regeln.
- Web-first: Performance, responsive UI und Speichern im Browser sind von Anfang an wichtig.
- Echte 3D-Welt: Gelaende, Gebaeude und Infrastruktur werden raeumlich dargestellt und mit einer neigbaren Orbit-Kamera betrachtet.
- Erweiterbar: Daten fuer Gebaeude, Kosten, Regeln und Events sollen spaeter leicht anpassbar sein.

## Festgelegte Kartenstruktur

- Quadratische Karte mit einem Raster aus 8 x 8 Sektoren, insgesamt 64 Sektoren.
- Jeder Sektor besteht zunaechst aus 16 x 16 Baukacheln; die gesamte Karte umfasst damit 128 x 128 Kacheln.
- Zum Spielstart sind 15 zusammenhaengende Sektoren in der suedwestlichen Kartenecke freigeschaltet. Das entspricht 23,4 % und damit knapp einem Viertel der Karte.
- Die verbleibenden 49 Sektoren sind sichtbar, aber gesperrt und einzeln kaufbar.
- Kaufbar sind nur Sektoren, die eine gemeinsame Kante mit einem bereits eigenen Sektor haben. Diagonale Beruehrung reicht nicht aus.
- Sektorgrenzen werden im normalen Spiel dezent und im Kaufmodus deutlich dargestellt.

## Kern-Gameplay

1. Spieler startet mit einem freien Startsektor, der knapp ein Viertel der Karte umfasst, und einem Startbudget.
2. Der Rest der Karte ist sichtbar, aber in kleinere, noch gesperrte Sektoren unterteilt.
3. Spieler baut Strassen und weist Wohn-, Gewerbe- und Industriezonen aus.
4. Bewohner und Betriebe ziehen ein, wenn Bedarf und Infrastruktur passen.
5. Stadt generiert Einnahmen, verursacht Kosten und entwickelt Probleme.
6. Spieler kauft angrenzende Sektoren frei und erweitert damit schrittweise das bebaubare Stadtgebiet.
7. Spieler reagiert mit Infrastruktur, Services, Steuern, Policies und Ausbau.
8. Die Stadt erreicht Meilensteine und schaltet neue Systeme frei.

## Geplanter Feature-Scope

### MVP: Spielbare erste Version

- Quadratische Karte mit 128 x 128 Kacheln
- Perspektivische 3D-Kamera mit Ein-Finger-Rotation, Zwei-Finger-Pan und Pinch-Zoom
- Raeumliches Gelaende mit Hoehen, Vegetation, Licht und Schatten
- Kartensektoren: 8 x 8 Sektoren mit 15 freien Startsektoren und 49 Kaufsektoren
- Gesperrte Sektoren sind sichtbar, koennen aber weder bebaut noch veraendert werden
- Angrenzende Sektoren koennen gegen einen ansteigenden Kaufpreis freigeschaltet werden
- Baumodus fuer Strassen, Zonen und einfache Gebaeude
- Bulldozer zum Entfernen von Strassen, Zonen und Gebaeuden
- Zonen: Wohnen, Gewerbe und Industrie
- Grundsimulation fuer Bevoelkerung, Jobs, Nachfrage und Zufriedenheit
- Einfaches Budgetsystem mit Einnahmen, Ausgaben und Kontostand
- Infrastruktur-Grundlagen: Strassenanbindung, Strom, Wasser
- Zeitsteuerung: Pause, Normal, Schnell
- Speichern und Laden im Browser
- Basis-UI mit Bauleiste, Statusleiste und Inspektor
- Kurzer Onboarding-Flow oder Tutorial-Hinweise

### Version 0.2: Mehr Stadtleben

- Verkehr und Pendelwege
- Service-Gebaeude: Feuerwehr, Polizei, Gesundheit, Schule
- Verschmutzung, Laerm und einfache Umweltwerte
- Gebaeude-Level und Wachstum ueber Zeit
- Unterschiedliche Standortvorteile fuer Wohnen, Gewerbe und Industrie
- Meilensteine und Freischaltungen
- Ereignisse: Boom, Krise, Brand, Stromausfall
- Verbesserte Visuals fuer Stadtstatus und Problem-Hinweise

### Version 0.3: Tiefe und Langzeitmotivation

- Oeffentlicher Verkehr
- Stadtteile/Districts
- Policies pro Stadt oder Stadtteil
- Produktionsketten und Warenfluss
- Vertiefte Produktionsketten zwischen Gewerbe und Industrie
- Statistik-Dashboard und Diagramme
- Szenarien mit Zielen und Siegbedingungen
- Export/Import von Spielstaenden
- Optional: Teilen von Staedten oder asynchrone Challenges

## Nicht-Ziele fuer den Anfang

- Keine fotorealistische Grafik im MVP; der Stil bleibt klar, performant und niedrig-polyig
- Kein Multiplayer im MVP
- Keine realistische Verkehrssimulation im MVP
- Keine komplexe Wirtschaft mit dutzenden Ressourcen im MVP
- Keine mobile-first Spezialversion, aber responsive Grundbedienung

## Technische Strategie

### Empfohlener Tech Stack

- Sprache: TypeScript im Strict Mode
- Laufzeit und Paketverwaltung: aktuelle Node.js-LTS-Version mit npm
- Entwicklungsserver und Build: Vite
- Management-UI: React mit modularen CSS-Dateien und Lucide-Icons
- 3D-Rendering: Three.js mit WebGL, Perspective Camera und Orbit Controls
- App- und UI-State: Zustand mit kleinen, gezielten Selektoren
- Simulation: Framework-unabhaengiges TypeScript mit festem Simulations-Tick in einem Dedicated Web Worker
- Persistenz: IndexedDB ueber Dexie mit versionierten Savegames
- Laufzeitvalidierung fuer Savegames und Konfiguration: Zod
- Unit- und Simulationstests: Vitest
- Browser- und End-to-End-Tests: Playwright fuer Chromium, Firefox und WebKit
- Codequalitaet: ESLint und Prettier
- Deployment im MVP: statisches Hosting ohne Backend; spaeter optional Cloud-Saves und Accounts ueber eine API

### Architekturregeln

- Frontend als Web App mit klar getrennten Schichten:
  - `app`: React-Oberflaeche, Werkzeuge und Dialoge
  - `rendering`: Three.js-Szene, 3D-Kamera, Gelaende, Objekte und Overlays
  - `simulation`: reine Spielregeln ohne React-, Three.js- oder Browser-Abhaengigkeit
  - `worker`: Kommunikation zwischen UI und Simulation
  - `content`: datengetriebene Gebaeude-, Zonen- und Balancing-Werte
  - `persistence`: Savegame-Schema, Migrationen und IndexedDB
- React und Three.js erhalten nur Snapshots der Simulation und senden Spieleraktionen als Commands zurueck.
- Darstellung kann mit bis zu 60 FPS laufen; Simulations-Snapshots muessen deutlich seltener an die UI uebertragen werden.
- Simulation deterministisch halten, damit Bugs reproduzierbar bleiben.
- Spielregeln datengetrieben modellieren, z.B. Gebaeude, Kosten, Upkeep, Effekte.
- Sektoren als eigene Spieldaten modellieren: Grenzen, Besitzstatus, Kaufpreis und Nachbarschaften.
- Jede Kartenkachel verweist auf einen Sektor, damit Bau- und Kaufregeln eindeutig geprueft werden koennen.
- Savegames versionieren, damit spaetere Updates alte Staedte migrieren koennen.
- Performance frueh messen: grosse Maps, viele Gebaeude, schnelle Simulation.
- Tests fuer zentrale Regeln: Budget, Nachfrage, Wachstum, Save/Load.

## Erste User Stories

- Als Spieler moechte ich Strassen bauen, damit Gebiete erschlossen werden koennen.
- Als Spieler moechte ich die Stadt perspektivisch in 3D drehen, neigen und zoomen, damit ich Gelaende und Bauwerke raeumlich beurteilen kann.
- Als Spieler moechte ich Wohn-, Gewerbe- und Industriezonen platzieren, damit meine Stadt wachsen kann.
- Als Spieler moechte ich Strassen und Zonen mit einem Bulldozer entfernen, damit ich Fehlplanungen korrigieren und Quartiere umbauen kann.
- Als Spieler moechte ich neue Kartensektoren kaufen, damit ich meine Stadt schrittweise erweitern kann.
- Als Spieler moechte ich vor dem Kauf Preis, Flaeche und Grenzen eines Sektors sehen, damit ich eine bewusste Expansionsentscheidung treffen kann.
- Als Spieler moechte ich sehen, warum Menschen nicht einziehen, damit ich gezielt reagieren kann.
- Als Spieler moechte ich Einnahmen und Ausgaben sehen, damit ich nicht versehentlich pleitegehe.
- Als Spieler moechte ich mein Spiel speichern und laden, damit ich spaeter weiterspielen kann.
- Als Spieler moechte ich Probleme auf der Karte erkennen, damit ich schnell passende Massnahmen finde.

## Akzeptanzkriterien fuer den MVP

- Given eine leere Karte, when der Spieler Strassen und Wohnzonen baut, then koennen erste Bewohner einziehen.
- Given die geladene Stadt, when der Spieler die Karte zieht oder zoomt, then veraendert sich die perspektivische 3D-Kamera und die Welt bleibt vollstaendig bedienbar.
- Given eine neue Stadt, when die Karte geladen wird, then ist nur der Startsektor mit knapp einem Viertel der Gesamtflaeche bebaubar.
- Given ein gesperrter Sektor, when der Spieler dort bauen oder zonieren moechte, then wird die Aktion verhindert und der Sektor als nicht gekauft angezeigt.
- Given eine bebaute Kachel, when der Spieler sie mit dem Bulldozer markiert, then werden Strasse oder Zone samt Gebaeude sofort entfernt.
- Given genug Budget und ein an den Besitz angrenzender Sektor, when der Spieler den Kauf bestaetigt, then wird der Preis abgezogen und der Sektor sofort bebaubar.
- Given Gewerbe- und Industriezonen mit Strassenanbindung, when Zeit vergeht, then entstehen Arbeitsplaetze und periodische Steuereinnahmen.
- Given eine Stadt mit Bewohnern, when genug Jobs und Services vorhanden sind, then steigt die Zufriedenheit.
- Given laufende Gebaeude und Services, when ein Monat simuliert wird, then werden Einnahmen und Kosten korrekt berechnet.
- Given eine Stadt mit Strom- oder Wasserproblem, when der Spieler passende Infrastruktur baut, then verschwindet das Problem nach kurzer Simulationszeit.
- Given ein gespeicherter Spielstand, when der Spieler die App neu oeffnet und laedt, then ist die Stadt im gleichen Zustand wieder verfuegbar.

## Priorisierte TODO-Liste

### P0: Projektfundament

- [x] Tech Stack festlegen: TypeScript, Vite, React, Three.js, Zustand, Dexie, Vitest und Playwright
- [x] Projektstruktur fuer Web App erstellen
- [x] Entwicklungsserver und Build-Script einrichten
- [x] Basis-Testsetup einrichten
- [x] Datenmodell fuer Karte, Sektoren, Kacheln und erste Bauobjekte skizzieren
- [x] Erste interaktive 3D-Karte mit Gelaende und Vegetation rendern
- [x] Quadratische Karte mit 128 x 128 Kacheln und 8 x 8 Sektoren erzeugen
- [x] Zusammenhaengendes Startgebiet aus 15 Sektoren definieren
- [x] Restliche 49 Kaufsektoren sperren und ihre Grenzen rendern
- [x] Perspektivische 3D-Kamera mit Orbit, Pan und Zoom umsetzen

### P0: Bau- und Simulationskern

- [x] Strassenplatzierung implementieren
- [x] Wohn-, Gewerbe- und Industriezonen implementieren
- [x] Bulldozer fuer Strassen und Zonen implementieren
- [x] Gesperrte Sektoren fuer Bau- und Zonenaktionen blockieren
- [x] Kaufregel fuer angrenzende Sektoren implementieren
- [x] Sektorpreise und steigende Expansionskosten berechnen
- [x] Gebaeude automatisch aus Zonen entstehen lassen
- [x] Simulations-Tick implementieren
- [x] Bevoelkerung und Jobs berechnen
- [x] Nachfrage pro Zonentyp berechnen und als RCI-Anzeige darstellen
- [x] Budget mit Einnahmen, Kosten und Monatsabschluss implementieren
- [x] Strassenanbindung fuer Zonen pruefen
- [x] Infrastrukturstatus und Kapazitaet fuer Strom pruefen
- [x] Infrastrukturstatus fuer Wasser, Abwasser und Muell pruefen
- [x] Problemstatus fuer unterversorgte Zonen als Karten-Overlay anzeigen

### P0: UI und Spielbarkeit

- [x] Bauleiste mit Werkzeugauswahl erstellen
- [x] Statusleiste fuer Geld, Einwohner, Jobs, Zufriedenheit und Monatsbilanz erstellen
- [ ] Inspektor fuer ausgewaehlte Kachel/Gebaeude erstellen
- [x] Sektorauswahl mit Grenze, Flaeche, Preis und Kaufbestaetigung erstellen
- [x] Zeitsteuerung einbauen
- [x] Speichern und Laden inklusive gekaufter Sektoren via IndexedDB implementieren
- [x] Baumenue in Stadtplanung, Gebiete, Beduerfnisse, Einrichtungen und Werkzeuge gliedern
- [ ] Erste Tutorial-Hinweise einbauen
- [x] Tests fuer Sektorkauf und Sektorgrenzen schreiben
- [x] Tests fuer Strassen- und Zonenregeln schreiben
- [x] Unit- und Browsertests fuer den Bulldozer schreiben
- [x] MVP-Spielrunde testen: Starten, zonieren, bauen, Sektor kaufen, wachsen, speichern, laden

### Separates TODO: Oeffentliche Einrichtungen

#### Gemeinsames Service-System

- [x] Platzierungswerkzeug fuer oeffentliche Gebaeude entwickeln
- [x] Baukosten, laufenden Unterhalt und Kapazitaet modellieren
- [ ] Personalbedarf fuer oeffentliche Einrichtungen modellieren
- [x] Strassenanschluss als Voraussetzung fuer Service-Gebaeude pruefen
- [ ] Einzugsgebiet und Auslastung pro Einrichtung berechnen
- [x] Versorgungsansichten als Karten-Overlays darstellen
- [ ] Geografische Reichweiten einzelner Service-Gebaeude darstellen
- [x] Fehlende oder ueberlastete Versorgung an Gebaeuden sichtbar machen
- [x] Service-Gebaeude mit dem Bulldozer entfernbar machen
- [ ] Einrichtungen ueber Einwohnerzahl oder Meilensteine freischalten

#### Grundversorgung

- [x] Stromversorgung mit Kraftwerk und Windkraftanlage
- [ ] Stromnetz mit Leitungen und Umspannwerken
- [ ] Solaranlage als weitere erneuerbare Energiequelle
- [x] Wasserversorgung mit Pumpwerk und Wasserturm
- [ ] Physisches Wasserleitungsnetz
- [x] Abwasserbedarf und Klaeranlage
- [ ] Physisches Kanalnetz und Abwasser-Pumpstation
- [x] Muellentsorgung mit Deponie, Recyclinghof und Verbrennungsanlage
- [x] Strombedarf und Stromkapazitaet in Statusleiste und Inspektor anzeigen
- [x] Wasser-, Abwasser- und Muellkapazitaet in der Statusleiste anzeigen

#### Sicherheit und Gesundheit

- [ ] Feuerwehrwache mit Fahrzeugen, Reichweite und Brandreaktion
- [ ] Polizeiwache und Polizeipraesidium mit Sicherheitswirkung
- [ ] Klinik fuer kleine Quartiere
- [ ] Krankenhaus mit groesserer Kapazitaet und Rettungswagen
- [ ] Friedhof und spaeter Krematorium als langfristige Stadtfunktion

#### Bildung und Verwaltung

- [ ] Kindergarten und Primarschule
- [ ] Sekundarschule und Berufsschule
- [ ] Hochschule oder Universitaet
- [ ] Bibliothek als Bildungs- und Zufriedenheitsgebaeude
- [ ] Rathaus als Verwaltungszentrum und Voraussetzung fuer Stadt-Policies
- [ ] Stadtverwaltung fuer Budget-, Steuer- und Statistikfunktionen

#### Freizeit, Gruen und Mobilitaet

- [ ] Kleiner Park, Spielplatz und Stadtpark
- [ ] Sporthalle, Schwimmbad und Kulturzentrum
- [ ] Bushaltestelle und Busdepot
- [ ] Bahnhof und spaeter weitere OeV-Knoten

### P1: Erweiterung nach MVP

- [ ] Verkehrssystem als vereinfachtes Pendelmodell entwerfen
- [ ] Standortattraktivitaet fuer alle Zonentypen simulieren
- [ ] Service-Gebaeude mit Reichweite implementieren
- [ ] Verschmutzung und Laerm simulieren
- [ ] Meilensteine und Unlocks einbauen
- [ ] Ereignissystem fuer Krisen und Chancen erstellen
- [ ] Statistikansicht mit Zeitreihen umsetzen
- [ ] Balancing fuer Kosten, Wachstum und Nachfrage ueberarbeiten

### P2: Langfristige Features

- [ ] Districts/Stadtteile implementieren
- [ ] Policies entwerfen und anwenden
- [ ] Oeffentlichen Verkehr planen
- [ ] Produktionsketten und Warenfluesse modellieren
- [ ] Produktionsketten zwischen Gewerbe und Industrie verknuepfen
- [ ] Szenario-Modus mit Zielen erstellen
- [ ] Modding-/Config-System vorbereiten
- [ ] PWA-Unterstuetzung mit Offline-Faehigkeit pruefen

## Offene Entscheidungen

- Sollen Sektorpreise nur mit der Anzahl der Kaeufe steigen oder auch Lage, Flaeche und Ressourcen beruecksichtigen?
- Soll das Spiel eher sandbox-orientiert oder szenario-orientiert starten?
- Welche Komplexitaet soll die Wirtschaft im MVP haben?
- Welche Zielgruppe steht im Vordergrund: Casual-Spieler, Simulationsfans oder Lern-/Schulkontext?

## Naechster sinnvoller Schritt

Als naechstes folgen physische Wasser- und Abwassernetze sowie geografische Reichweiten fuer Service-Gebaeude. Danach werden die ersten oeffentlichen Einrichtungen mit Feuerwehr, Polizei und Gesundheitsversorgung spielbar.
