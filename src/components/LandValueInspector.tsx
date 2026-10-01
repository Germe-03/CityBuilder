import { BadgeDollarSign, Building2, Factory, House, Store } from "lucide-react";

import {
  getClassDemand,
  getZoneDevelopmentSummary,
  type GameState,
  type ZoneType,
} from "../simulation/cityMap";

interface LandValueInspectorProps {
  state: GameState;
}

const zoneRows: Array<{
  zone: ZoneType;
  label: string;
  icon: typeof House;
}> = [
  { zone: "residential", label: "Wohnen", icon: House },
  { zone: "commercial", label: "Gewerbe", icon: Store },
  { zone: "industrial", label: "Industrie", icon: Factory },
];

export function LandValueInspector({ state }: LandValueInspectorProps) {
  return (
    <aside
      className="sector-inspector land-value-inspector"
      aria-label="Grundstueckswerte"
    >
      <div className="inspector-heading">
        <span className="inspector-icon">
          <BadgeDollarSign aria-hidden="true" />
        </span>
        <div>
          <small>Gebietsentwicklung</small>
          <h2>Grundstueckswerte</h2>
        </div>
        <span className="sector-status status-owned">Kartenansicht</span>
      </div>

      <div className="development-list">
        {zoneRows.map(({ zone, label, icon: Icon }) => {
          const summary = getZoneDevelopmentSummary(state, zone);
          const demand = getClassDemand(state, zone);
          return (
            <section className="development-row" key={zone}>
              <div className="development-heading">
                <Icon aria-hidden="true" />
                <strong>{label}</strong>
                <span>{summary.averageLandValue} / 100</span>
              </div>
              <div className="land-value-track" aria-label={`${label} Bodenwert`}>
                <i style={{ width: `${summary.averageLandValue}%` }} />
              </div>
              <div className="development-meta">
                <span>
                  <Building2 aria-hidden="true" /> Ø Stufe {summary.averageLevel}
                </span>
                <span>
                  Nachfrage {demand.basic} / {demand.middle} / {demand.premium}
                </span>
              </div>
            </section>
          );
        })}
      </div>

      <div className="land-value-legend" aria-label="Grundstueckswert Legende">
        <span>
          <i className="value-low" />
          Niedrig
        </span>
        <span>
          <i className="value-medium" />
          Mittel
        </span>
        <span>
          <i className="value-high" />
          Hoch
        </span>
      </div>
    </aside>
  );
}
