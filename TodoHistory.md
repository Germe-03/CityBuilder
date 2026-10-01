# CityBuilder TODO-Historie

Hier werden abgeschlossene Aufgaben aus der aktiven [TODO.md](TODO.md) gesammelt.

## Abgeschlossen bis 30. September 2026

### Projektfundament

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

### Bau- und Simulationskern

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

### UI und Spielbarkeit

- [x] Bauleiste mit Werkzeugauswahl erstellen
- [x] Statusleiste fuer Geld, Einwohner, Jobs, Zufriedenheit und Monatsbilanz erstellen
- [x] Sektorauswahl mit Grenze, Flaeche, Preis und Kaufbestaetigung erstellen
- [x] Zeitsteuerung einbauen
- [x] Speichern und Laden inklusive gekaufter Sektoren via IndexedDB implementieren
- [x] Baumenue in Stadtplanung, Gebiete, Beduerfnisse, Einrichtungen und Werkzeuge gliedern
- [x] Tests fuer Sektorkauf und Sektorgrenzen schreiben
- [x] Tests fuer Strassen- und Zonenregeln schreiben
- [x] Unit- und Browsertests fuer den Bulldozer schreiben
- [x] MVP-Spielrunde testen: Starten, zonieren, bauen, Sektor kaufen, wachsen, speichern, laden

### Oeffentliche Einrichtungen: Gemeinsames Service-System

- [x] Platzierungswerkzeug fuer oeffentliche Gebaeude entwickeln
- [x] Baukosten, laufenden Unterhalt und Kapazitaet modellieren
- [x] Strassenanschluss als Voraussetzung fuer Service-Gebaeude pruefen
- [x] Versorgungsansichten als Karten-Overlays darstellen
- [x] Fehlende oder ueberlastete Versorgung an Gebaeuden sichtbar machen
- [x] Service-Gebaeude mit dem Bulldozer entfernbar machen

### Oeffentliche Einrichtungen: Grundversorgung

- [x] Stromversorgung mit Kraftwerk und Windkraftanlage
- [x] Wasserversorgung mit Pumpwerk und Wasserturm
- [x] Abwasserbedarf und Klaeranlage
- [x] Muellentsorgung mit Deponie, Recyclinghof und Verbrennungsanlage
- [x] Strombedarf und Stromkapazitaet in Statusleiste und Inspektor anzeigen
- [x] Wasser-, Abwasser- und Muellkapazitaet in der Statusleiste anzeigen

### Region und Aussenverbindung

- [x] Regionale Hauptstrasse vom Kartenrand bis in das Startgebiet bauen
- [x] Sichtbaren Uebergang von der regionalen Hauptstrasse zum staedtischen Strassennetz darstellen
- [x] Regionale Hauptstrasse vor dem Bulldozer und vor Ueberbauung schuetzen
- [x] Zusammenhaengende Aussenverbindung fuer Zuzug, Arbeitsplaetze und Warenverkehr pruefen
- [x] Animierte Fahrzeuge fuer Zuzug und Warenlieferungen darstellen
- [x] Unit- und Browsertests fuer funktionierende, geschuetzte und unterbrochene Aussenverbindungen schreiben

### Oeffentliche Dienste und Gebietsentwicklung

- [x] Strassengebundene Einzugsgebiete, Kapazitaet, Auslastung und Reaktionszeit fuer oeffentliche Einrichtungen berechnen
- [x] Geografische Service-Reichweiten als Karten-Overlay darstellen
- [x] Feuerwehrwache mit Einsatzfahrzeug, Reichweite, Brandrisiko und Unterhalt umsetzen
- [x] Polizeiwache mit Sicherheitswirkung, Kapazitaet und Reichweite umsetzen
- [x] Klinik und Krankenhaus mit unterschiedlichen Kapazitaeten sowie Rettungswagen umsetzen
- [x] Primar- und Sekundarschule als platzierbare Einrichtungen mit Kosten, Unterhalt und Einzugsgebiet umsetzen
- [x] Fehlende Schulplaetze in der Beduerfnisuebersicht und auf der Karte anzeigen
- [x] Bildung auf moderne Industrie, hochwertiges Gewerbe und Grundstueckswerte wirken lassen
- [x] Wohn- und Gewerbegebiete mit fuenf sichtbaren Entwicklungsstufen modellieren
- [x] Industriegebiete mit drei sichtbaren Entwicklungsstufen modellieren
- [x] Kapazitaet und Arbeitsplaetze anhand der Gebaeudestufe skalieren
- [x] Wohn- und Gewerbeklassen sowie industrielle Technologiestufen aus Grundstueckswert und Nachfrage bestimmen
- [x] Grundstueckswerte anhand von Erreichbarkeit, Versorgung, Bildung, Sicherheit und Verschmutzung berechnen
- [x] Grundstueckswerte als eigene Kartenansicht darstellen
- [x] Klassenspezifische Nachfrage fuer Wohnen, Gewerbe und Industrie berechnen und anzeigen
- [x] Unit- und Browsertests fuer Dienste, Reichweiten, Grundstueckswerte, Klassen und Gebaeudestufen schreiben

### Pausenmodus, Versorgungsnetze und Alleenbasis

- [x] Fahrzeugbewegungen an die Simulationsgeschwindigkeit koppeln und in der Pause vollstaendig anhalten
- [x] Strom, Wasser und Abwasser automatisch ueber zusammenhaengende Strassennetze verteilen
- [x] Nicht angeschlossene oder durch eine Strassenunterbrechung abgetrennte Gebiete als unversorgt markieren
- [x] Wachstum, Arbeitsplaetze, Zufriedenheit und Grundstueckswerte von der lokalen Netzversorgung abhaengig machen
- [x] Basis-Allee als eigenes Bauwerkzeug mit zwei Kacheln Breite, eigenen Kosten und eigener 3D-Darstellung umsetzen
- [x] Strasse und Allee im Baumenue eindeutig auswaehlbar machen
- [x] Unit- und Browsertests fuer Netzunterbrechungen, Pausenverkehr und Alleenbreite ergaenzen

### Teilversorgung und Kredite

- [x] Strom, Wasser und Abwasser bei Kapazitaetsengpaessen teilweise statt nach dem Alles-oder-nichts-Prinzip verteilen
- [x] Wachstum, Arbeitsplaetze und Zufriedenheit anhand der tatsaechlich versorgten Gebiete berechnen
- [x] Kreditangebote mit vier Kredithoehen und vier Laufzeiten umsetzen
- [x] Zinssatz anhand von Kredithoehe und Laufzeit berechnen
- [x] Monatsrate, Restschuld und verbleibende Laufzeit bei jedem Monatsabschluss fortschreiben
- [x] Bis zu drei parallele Kredite inklusive Speicherung in alten und neuen Spielstaenden unterstuetzen
- [x] Finanzansicht fuer Kreditangebot und laufende Kredite erstellen
- [x] Unit- und Browsertests fuer Teilversorgung, Zinsen, Tilgung und Kreditaufnahme ergaenzen

### Vollstaendige Karte und gerader Strassenbau

- [x] Gebietskauf, Sektorpreise und gesperrte Kartenflaechen aus dem Spiel entfernen
- [x] Die gesamten 128 x 128 Kacheln ab Spielbeginn bebaubar machen
- [x] Alte Spielstaende ohne fortbestehende Gebietssperren laden
- [x] Strassen und Alleen beim Ziehen auf eine feste horizontale oder vertikale Achse ausrichten
- [x] Baeume auf bebauten Strassen-, Zonen- und Gebaeudeflaechen dynamisch ausblenden
- [x] Unit- und Browsertests fuer die vollstaendige Karte und geradlinige Trassen ergaenzen
