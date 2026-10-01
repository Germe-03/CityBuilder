# CityGame Strategie und TODO

Abgeschlossene Aufgaben stehen in der [TodoHistory.md](TodoHistory.md).

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

- Quadratische Karte mit 128 x 128 Baukacheln.
- Die gesamte Kartenflaeche ist ab Spielbeginn frei bebaubar.
- Es gibt keine kaufbaren oder gesperrten Kartensektoren.

## Kern-Gameplay

1. Spieler startet mit der vollstaendig bebaubaren Karte und einem Startbudget.
2. Spieler baut Strassen und weist Wohn-, Gewerbe- und Industriezonen aus.
3. Bewohner und Betriebe ziehen ein, wenn Bedarf und Infrastruktur passen.
4. Stadt generiert Einnahmen, verursacht Kosten und entwickelt Probleme.
5. Spieler reagiert mit Infrastruktur, Services, Steuern, Policies und Ausbau.
6. Die Stadt erreicht Meilensteine und schaltet neue Systeme frei.

## Geplanter Feature-Scope

### MVP: Spielbare erste Version

- Quadratische Karte mit 128 x 128 Kacheln
- Perspektivische 3D-Kamera mit Ein-Finger-Rotation, Zwei-Finger-Pan und Pinch-Zoom
- Raeumliches Gelaende mit Hoehen, Vegetation, Licht und Schatten
- Vollstaendig bebaubare Karte ohne Gebietskauf oder Flaechensperren
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
- Savegames versionieren, damit spaetere Updates alte Staedte migrieren koennen.
- Performance frueh messen: grosse Maps, viele Gebaeude, schnelle Simulation.
- Tests fuer zentrale Regeln: Budget, Nachfrage, Wachstum, Save/Load.

## Erste User Stories

- Als Spieler moechte ich Strassen bauen, damit Gebiete erschlossen werden koennen.
- Als Spieler moechte ich die Stadt perspektivisch in 3D drehen, neigen und zoomen, damit ich Gelaende und Bauwerke raeumlich beurteilen kann.
- Als Spieler moechte ich Wohn-, Gewerbe- und Industriezonen platzieren, damit meine Stadt wachsen kann.
- Als Spieler moechte ich Strassen und Zonen mit einem Bulldozer entfernen, damit ich Fehlplanungen korrigieren und Quartiere umbauen kann.
- Als Spieler moechte ich sehen, warum Menschen nicht einziehen, damit ich gezielt reagieren kann.
- Als Spieler moechte ich Einnahmen und Ausgaben sehen, damit ich nicht versehentlich pleitegehe.
- Als Spieler moechte ich mein Spiel speichern und laden, damit ich spaeter weiterspielen kann.
- Als Spieler moechte ich Probleme auf der Karte erkennen, damit ich schnell passende Massnahmen finde.

## Akzeptanzkriterien fuer den MVP

- Given eine leere Karte, when der Spieler Strassen und Wohnzonen baut, then koennen erste Bewohner einziehen.
- Given die geladene Stadt, when der Spieler die Karte zieht oder zoomt, then veraendert sich die perspektivische 3D-Kamera und die Welt bleibt vollstaendig bedienbar.
- Given eine neue Stadt, when die Karte geladen wird, then ist die gesamte Kartenflaeche sofort bebaubar.
- Given eine bebaute Kachel, when der Spieler sie mit dem Bulldozer markiert, then werden Strasse oder Zone samt Gebaeude sofort entfernt.
- Given Gewerbe- und Industriezonen mit Strassenanbindung, when Zeit vergeht, then entstehen Arbeitsplaetze und periodische Steuereinnahmen.
- Given eine Stadt mit Bewohnern, when genug Jobs und Services vorhanden sind, then steigt die Zufriedenheit.
- Given laufende Gebaeude und Services, when ein Monat simuliert wird, then werden Einnahmen und Kosten korrekt berechnet.
- Given eine Stadt mit Strom- oder Wasserproblem, when der Spieler passende Infrastruktur baut, then verschwindet das Problem nach kurzer Simulationszeit.
- Given ein gespeicherter Spielstand, when der Spieler die App neu oeffnet und laedt, then ist die Stadt im gleichen Zustand wieder verfuegbar.

## Priorisierte TODO-Liste

### P0: UI und Spielbarkeit

- [ ] Inspektor fuer ausgewaehlte Kachel/Gebaeude erstellen
- [ ] Erste Tutorial-Hinweise einbauen

### Separates TODO: Oeffentliche Einrichtungen

#### Gemeinsames Service-System

- [ ] Personalbedarf fuer oeffentliche Einrichtungen modellieren
- [ ] Einrichtungen ueber Einwohnerzahl oder Meilensteine freischalten

#### Grundversorgung

- [ ] Solaranlage als weitere erneuerbare Energiequelle
- [ ] Umspannwerke und Abwasser-Pumpstationen als optionale Kapazitaetsausbauten planen

#### Sicherheit und Gesundheit

- [ ] Polizeipraesidium als groessere Ausbaustufe der Polizeiwache umsetzen
- [ ] Friedhof und spaeter Krematorium als langfristige Stadtfunktion

#### Bildung und Verwaltung

- [ ] Kindergarten ergaenzen
- [ ] Berufsschule ergaenzen
- [ ] Hochschule oder Universitaet
- [ ] Bibliothek als Bildungs- und Zufriedenheitsgebaeude
- [ ] Personalbedarf und detaillierte Auslastung pro Schule berechnen
- [ ] OeV-Erreichbarkeit fuer Schulen beruecksichtigen
- [ ] Schulbudget auf Kapazitaet, Bildungsqualitaet und Gebaeudeentwicklung wirken lassen
- [ ] Rathaus als Verwaltungszentrum und Voraussetzung fuer Stadt-Policies
- [ ] Stadtverwaltung fuer Budget-, Steuer- und Statistikfunktionen

#### Freizeit, Gruen und Mobilitaet

- [ ] Kleiner Park, Spielplatz und Stadtpark
- [ ] Sporthalle, Schwimmbad und Kulturzentrum
- [ ] Bushaltestelle und Busdepot
- [ ] Tramhaltestelle, Tramdepot und Gleise
- [ ] Bahnhof, Bahnstrecken und Umsteigeknoten
- [ ] Regional- und Fernverkehrszuege als Aussenverbindung
- [ ] Flughafen mit Terminal, Startbahn und Flugverbindungen

#### Oeffentlicher Verkehr

- [ ] Gemeinsames Linien- und Haltestellensystem fuer Bus, Tram und Zug entwickeln
- [ ] Linien durch Anklicken einer geordneten Folge von Haltestellen erstellen und bearbeiten
- [ ] Buslinien auf dem bestehenden Strassennetz fahren lassen
- [ ] Tramgleise auf Strassen oder eigenem Gleiskoerper bauen lassen
- [ ] Zugstrecken mit Bahnhof, Bahnsteigen, Weichen und regionaler Aussenverbindung modellieren
- [ ] Flughafen erst ab einem passenden Stadtmeilenstein freischalten
- [ ] Fahrzeuge, Takt, Kapazitaet, Fahrpreis und Betriebskosten pro Linie berechnen
- [ ] Fahrgastnachfrage aus Wohnort, Arbeitsplatz, Bildung, Freizeit und Umsteigezeit ableiten
- [ ] Fusswege und Umstiege zwischen Bus, Tram, Zug und Flughafen beruecksichtigen
- [ ] OeV-Abdeckung, Auslastung und nicht bediente Nachfrage als Kartenansichten darstellen
- [ ] Linienfarben, Liniennamen und Fahrplaninformationen im OeV-Menue anzeigen
- [ ] OeV-Budget und Ticketpreise durch den Spieler einstellbar machen
- [ ] Stau, Parkplatzbedarf und Umweltbelastung durch gut genutzten OeV reduzieren
- [ ] Fahrzeuge und wartende Fahrgaeste sichtbar in der 3D-Welt darstellen
- [ ] Tests fuer Linienerstellung, Routenfindung, Umstiege, Kapazitaet und Aussenverbindungen schreiben

### Separates TODO: Zonenentwicklung und Grundstueckswerte

#### Gebaeudestufen

- [ ] Energieverbrauch, Wasserbedarf und Steuereinnahmen je Gebaeudestufe skalieren

#### Soziale und technologische Klassen

- [ ] Moderne Industrie mit geringerer Umweltverschmutzung ausstatten
- [ ] Klassenwechsel schrittweise statt unmittelbar ausfuehren
- [ ] Klassen und Entwicklungsstufen im Gebaeudeinspektor klar anzeigen

#### Grundstueckswerte und Nachfrage

- [ ] Parks und Laerm als weitere Einfluesse auf den Grundstueckswert modellieren

### Separates TODO: Steuern und Servicebudgets

- [ ] Steuersaetze fuer Wohnen, Gewerbe und Industrie durch den Spieler einstellbar machen
- [ ] Optional unterschiedliche Steuersaetze pro Einkommens- oder Technologieklasse erlauben
- [ ] Steuerhoehe auf Nachfrage, Zufriedenheit, Wachstum und Abwanderung wirken lassen
- [ ] Monatliche Einnahmen transparent nach Zonentyp und Klasse aufschluesseln
- [ ] Budgets fuer Feuerwehr, Polizei, Gesundheit, Bildung, Abfall und weitere Dienste einstellbar machen
- [ ] Servicebudget auf Personal, Fahrzeuge, Kapazitaet, Reichweite und Reaktionszeit wirken lassen
- [ ] Mindestbudget und Warnungen fuer nicht funktionsfaehige Dienste definieren
- [ ] Eigenen Finanz- und Budgetbildschirm mit Einnahmen, Ausgaben und Prognose erstellen
- [ ] Tests fuer Steuerfolgen, Budgetgrenzen und Servicequalitaet schreiben

### Separates TODO: Region und Aussenverbindung

- [ ] Spaetere weitere Aussenverbindungen fuer Bahn, Schiff oder Flughafen vorbereiten

### Separates TODO: Strassenhierarchie und Alleen

- [ ] Mehrere Strassentypen mit unterschiedlichen Kosten, Kapazitaeten, Geschwindigkeiten, Laermwerten und Unterhaltskosten modellieren
- [ ] Bestehende kleine Stadtstrasse als guenstige Erschliessungsstrasse beibehalten
- [ ] Allee Stufe 1 mit zwei Fahrspuren pro Fahrtrichtung umsetzen
- [ ] Allee Stufe 2 mit drei Fahrspuren pro Fahrtrichtung umsetzen
- [ ] Allee Stufe 3 mit drei Fahrspuren pro Fahrtrichtung und integrierter Tramlinie umsetzen
- [ ] Alleen mit Mittelstreifen, Baeumen, Gehwegen, Beleuchtung und klaren Fahrbahnmarkierungen darstellen
- [ ] Strassen direkt auf eine hoehere Stufe ausbauen, ohne angrenzende Zonen neu zeichnen zu muessen
- [ ] Ausbaukosten und voruebergehende Baustelleneffekte beim Hochstufen berechnen
- [ ] Rueckbau auf eine kleinere Strassenstufe mit Kapazitaetspruefung ermoeglichen
- [ ] Kreuzungen, Abbiegespuren und Uebergaenge zwischen kleiner Strasse und Alleen erzeugen
- [ ] Allee Stufe 3 erst nach Freischaltung des Tramsystems verfuegbar machen
- [ ] Tramhaltestellen im Mittelstreifen oder am Fahrbahnrand platzierbar machen
- [ ] Verkehrsfluss, Grundstueckswert und Zonenattraktivitaet durch Strassentyp und Erreichbarkeit beeinflussen
- [ ] Tests fuer Bau, Ausbau, Rueckbau, Kapazitaet und Tramkompatibilitaet schreiben

### Separates TODO: Stadtspezialisierungen

#### Gemeinsames Spezialisierungssystem

- [ ] Stadtspezialisierungen als spaetere strategische Ausrichtung der gesamten Stadt modellieren
- [ ] Voraussetzungen, Freischalt-Meilensteine und drei Entwicklungsstufen pro Spezialisierung definieren
- [ ] Fortschritt durch passende Gebaeude, Arbeitsplaetze, Besucher, Waren und Servicequalitaet berechnen
- [ ] Einzigartige Gebaeude, optische Merkmale und wirtschaftliche Boni je Spezialisierung festlegen
- [ ] Jede Spezialisierung mit Zielkonflikten wie Verkehr, Laerm, Verschmutzung, Kriminalitaet oder hohen Kosten ausbalancieren
- [ ] Mehrere Spezialisierungen erlauben, aber konkurrierende Boni und begrenzte Stadtressourcen beruecksichtigen
- [ ] Spezialisierungsansicht mit Fortschritt, Effekten, Voraussetzungen und aktuellen Problemen erstellen
- [ ] Spezialisierungen in Budget, Nachfrage, Grundstueckswerte, Aussenverbindungen und Stadtzufriedenheit integrieren
- [ ] Spezialisierungsfortschritt im Spielstand speichern und laden
- [ ] Tests fuer Freischaltungen, Stufenaufstiege, Boni und negative Auswirkungen schreiben

#### 1. Gluecksspiel und Unterhaltung

- [ ] Casino, Spielhalle, Resort-Hotel und Veranstaltungsarena als besondere Gebaeude planen
- [ ] Hohe Tourismus- und Steuereinnahmen durch Besucher und Unterhaltung erzeugen
- [ ] Abhaengigkeit von Hotels, Polizei, oeffentlichem Verkehr und einer leistungsfaehigen Aussenverbindung modellieren
- [ ] Zusaetzlichen Verkehr, Laerm, Kriminalitaetsrisiko und soziale Folgekosten als Nachteile simulieren

#### 2. Tourismus

- [ ] Hotels, Sehenswuerdigkeiten, Museum, Stadtpark und Kongresszentrum planen
- [ ] Besucherzahlen aus Attraktivitaet, Sicherheit, Sauberkeit, Verkehrsanbindung und Freizeitangebot berechnen
- [ ] Einnahmen fuer Gewerbe und Stadtbudget sowie neue Arbeitsplaetze erzeugen
- [ ] Saisonale Schwankungen, Ueberlastung und steigende Grundstueckspreise als Herausforderungen modellieren

#### 3. Bildung und Forschung

- [ ] Universitaetscampus, Forschungszentrum und Technologiepark planen
- [ ] Bildung und Forschung mit modernen Industriebetrieben und hochwertigem Gewerbe verknuepfen
- [ ] Gut ausgebildete Arbeitskraefte, Innovation und geringe Umweltbelastung als Vorteile modellieren
- [ ] Hohe Baukosten, laufende Bildungsbudgets und Fachkraeftebedarf als Voraussetzungen festlegen

#### 4. Logistik und Warenwirtschaft

- [ ] Lagerhaeuser, Verteilzentrum, Gueterbahnhof und spaeter ein Frachtterminal planen
- [ ] Warenfluss, Industrieproduktion und regionale Exporte durch gute Logistik steigern
- [ ] Strassen-, Bahn- und Aussenverbindungen als zentrale Voraussetzungen verwenden
- [ ] Schwerverkehr, Laerm, Flaechenbedarf und Verschmutzung als Nachteile simulieren

#### 5. Gruene Stadt

- [ ] Erneuerbare Energie, Recycling, emissionsarme Gebaeude und grosse Gruenanlagen als Schwerpunkt planen
- [ ] Gesundheit, Zufriedenheit, Attraktivitaet und sauberes Gewerbe durch geringe Umweltbelastung staerken
- [ ] Energieeffizienz und niedrigen Ressourcenverbrauch als messbare Spezialisierungsziele verwenden
- [ ] Hohe Anfangsinvestitionen, Flaechenbedarf und strengere Umweltauflagen ausbalancieren

#### 6. Finanz- und Geschaeftszentrum

- [ ] Banken, Firmenzentralen, Messegebaeude und hochwertige Gewerbehochhaeuser planen
- [ ] Hohe Gewerbesteuern, gut bezahlte Arbeitsplaetze und steigende Grundstueckswerte erzeugen
- [ ] Bildung, schnelle Verkehrsverbindungen und verlaessliche Stadtservices als Voraussetzungen festlegen
- [ ] Hohe Bodenpreise, Pendlerverkehr und Anfaelligkeit fuer Wirtschaftskrisen als Risiken modellieren

### Separates TODO: Detaillierte Grafik und Stadtleben

- [ ] Wohn-, Gewerbe- und Industriegebaeude fuer jede Stufe und Klasse visuell unterscheiden
- [ ] Fassaden, Daecher, Fenster, Schilder, Schornsteine und weitere kleine Details ergaenzen
- [ ] Strassen mit Fahrspuren, Kreuzungen, Markierungen, Gehwegen und Strassenbeleuchtung aufwerten
- [ ] Fussgaenger und einfache Alltagswege als sichtbares Stadtleben einfuehren
- [ ] Parkplaetze, Lieferverkehr, Baustellen und Servicefahrzeuge darstellen
- [ ] Tag-Nacht-Zyklus und beleuchtete Fenster vorbereiten
- [ ] Detailgrad und Sichtweite fuer eine stabile Browser-Performance abstufen
- [ ] Desktop- und Mobiltests fuer Framerate, Lesbarkeit und nicht ueberlappende Darstellung ergaenzen

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

- Soll das Spiel eher sandbox-orientiert oder szenario-orientiert starten?
- Welche Komplexitaet soll die Wirtschaft im MVP haben?
- Welche Zielgruppe steht im Vordergrund: Casual-Spieler, Simulationsfans oder Lern-/Schulkontext?

## Naechster sinnvoller Schritt

Als naechstes bieten sich ein Inspektor fuer einzelne Gebaeude sowie einstellbare Budgets fuer Feuerwehr, Polizei, Gesundheit und Bildung an. Danach koennen Kapazitaet, Geschwindigkeit, Laerm und Kreuzungen der unterschiedlichen Strassentypen vertieft werden.
