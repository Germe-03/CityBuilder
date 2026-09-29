# CityBuilder

Browserbasierte 3D-Stadtsimulation mit einer quadratischen Karte aus 64
freischaltbaren Sektoren und einem Startgebiet in der suedwestlichen Kartenecke.

Der aktuelle Vertikalschnitt umfasst Sektorkauf, direkten 3D-Strassenbau sowie
Wohn-, Gewerbe- und Industriezonen mit automatisch entstehenden Gebaeuden. Die
Simulation berechnet erste Einwohner-, Arbeitsplatz- und Budgeteffekte. Mit dem
Bulldozer lassen sich Strassen, Zonen und Einrichtungen direkt wieder entfernen.
Windkraftanlagen und Kraftwerke liefern Strom; Bedarf, Kapazitaet, Baukosten und
monatlicher Unterhalt wirken bereits auf die Simulation.

Die Grundversorgung umfasst ausserdem Pumpwerk, Wasserturm, Klaeranlage,
Deponie, Recyclinghof und Verbrennungsanlage. RCI-Nachfrage und farbige
Versorgungs-Overlays zeigen Wachstum und Engpaesse direkt auf der Karte.

Das Baumenue ist in Stadtplanung, Gebiete, Beduerfnisse, oeffentliche
Einrichtungen und Werkzeuge gegliedert. Versionierte Spielstaende werden ueber
IndexedDB automatisch oder manuell gespeichert und koennen geladen oder
geloescht werden.

Die Kamera unterstuetzt Trackpads direkt: Zwei-Finger-Wischen verschiebt die
Ansicht, Pinch zoomt und Ein-Finger-Ziehen dreht den Kamerawinkel.

## Entwicklung

```powershell
npm install
npm run dev
```

## Qualitaetspruefung

```powershell
npm run check
npm run test:e2e
```

## Architektur

- React rendert Statusleisten, Werkzeuge und Dialoge.
- Three.js rendert die perspektivische 3D-Welt, Gelaende, Strassen, Zonen, Gebaeude, Kraftwerke, Windraeder und Sektor-Overlays mit WebGL.
- Ein Web Worker besitzt den Simulationszustand und verarbeitet Commands.
- Reine TypeScript-Funktionen enthalten die testbaren Spielregeln.
