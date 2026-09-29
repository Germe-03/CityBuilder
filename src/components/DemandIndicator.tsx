import { AlertTriangle, TrendingUp } from "lucide-react";

import { getSupplyIssues, getZoneDemand, type GameState } from "../simulation/cityMap";

interface DemandIndicatorProps {
  state: GameState;
}

const issueLabels = {
  electricity: "Strom fehlt",
  water: "Wasser fehlt",
  sewage: "Abwasser ueberlastet",
  waste: "Muell ueberlastet",
} as const;

export function DemandIndicator({ state }: DemandIndicatorProps) {
  const demand = getZoneDemand(state);
  const issues = getSupplyIssues(state);

  return (
    <aside className="demand-indicator" aria-label="Zonennachfrage">
      <div className="demand-heading">
        <TrendingUp aria-hidden="true" />
        <strong>Nachfrage</strong>
      </div>
      <DemandRow
        label="W"
        name="Wohnen"
        value={demand.residential}
        tone="residential"
      />
      <DemandRow label="G" name="Gewerbe" value={demand.commercial} tone="commercial" />
      <DemandRow
        label="I"
        name="Industrie"
        value={demand.industrial}
        tone="industrial"
      />
      {issues.length > 0 && (
        <div className="growth-blocker">
          <AlertTriangle aria-hidden="true" />
          {issueLabels[issues[0]]}
        </div>
      )}
    </aside>
  );
}

interface DemandRowProps {
  label: string;
  name: string;
  value: number;
  tone: "residential" | "commercial" | "industrial";
}

function DemandRow({ label, name, value, tone }: DemandRowProps) {
  return (
    <div className="demand-row" title={`${name}: ${value} %`}>
      <span>{label}</span>
      <div className="demand-track">
        <i className={`demand-fill demand-${tone}`} style={{ width: `${value}%` }} />
      </div>
      <strong>{value}</strong>
    </div>
  );
}
