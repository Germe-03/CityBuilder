import { Landmark, Route, Shapes, Trash2 } from "lucide-react";

import type { GameState } from "../simulation/cityMap";

interface BulldozerInspectorProps {
  state: GameState;
}

export function BulldozerInspector({ state }: BulldozerInspectorProps) {
  return (
    <aside className="sector-inspector demolish-inspector" aria-label="Bulldozer">
      <div className="inspector-heading">
        <span className="inspector-icon">
          <Trash2 aria-hidden="true" />
        </span>
        <div>
          <small>Aktives Werkzeug</small>
          <h2>Bulldozer</h2>
        </div>
        <span className="sector-status status-owned">Aktiv</span>
      </div>

      <dl className="sector-details build-details">
        <div>
          <dt>
            <Route aria-hidden="true" />
            Strassen
          </dt>
          <dd>{state.roadTiles.length}</dd>
        </div>
        <div>
          <dt>
            <Shapes aria-hidden="true" />
            Zonen
          </dt>
          <dd>{state.zoneTiles.length}</dd>
        </div>
        <div>
          <dt>
            <Landmark aria-hidden="true" />
            Einrichtungen
          </dt>
          <dd>{state.serviceBuildings.length}</dd>
        </div>
      </dl>

      <div className="inspector-result demolish-status">
        <Trash2 aria-hidden="true" />
        Strassen, Zonen und Einrichtungen entfernen
      </div>
    </aside>
  );
}
