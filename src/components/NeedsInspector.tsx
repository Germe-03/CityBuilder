import {
  AlertTriangle,
  CheckCircle2,
  Droplets,
  HeartPulse,
  Recycle,
  Smile,
  TrendingUp,
  Waves,
  Zap,
} from "lucide-react";

import {
  getSupplyIssues,
  getUtilityCapacity,
  getUtilityDemand,
  getZoneDemand,
  type GameState,
  type ServiceCategory,
} from "../simulation/cityMap";

interface NeedsInspectorProps {
  state: GameState;
}

const utilityRows: Array<{
  category: ServiceCategory;
  label: string;
  icon: typeof Zap;
  unit: string;
}> = [
  { category: "electricity", label: "Strom", icon: Zap, unit: "MW" },
  { category: "water", label: "Wasser", icon: Droplets, unit: "m3" },
  { category: "sewage", label: "Abwasser", icon: Waves, unit: "m3" },
  { category: "waste", label: "Muell", icon: Recycle, unit: "t" },
];

export function NeedsInspector({ state }: NeedsInspectorProps) {
  const demand = getZoneDemand(state);
  const issues = getSupplyIssues(state);

  return (
    <aside className="sector-inspector needs-inspector" aria-label="Beduerfnisse">
      <div className="inspector-heading">
        <span className="inspector-icon">
          <HeartPulse aria-hidden="true" />
        </span>
        <div>
          <small>Stadtstatus</small>
          <h2>Beduerfnisse</h2>
        </div>
        <span
          className={`sector-status ${issues.length === 0 ? "status-owned" : "status-available"}`}
        >
          {issues.length === 0 ? "Versorgt" : `${issues.length} Engpass`}
        </span>
      </div>

      <section className="needs-section" aria-labelledby="zone-demand-heading">
        <h3 id="zone-demand-heading">
          <TrendingUp aria-hidden="true" />
          Gebietsbedarf
        </h3>
        <NeedBar label="Wohnen" value={demand.residential} tone="residential" />
        <NeedBar label="Gewerbe" value={demand.commercial} tone="commercial" />
        <NeedBar label="Industrie" value={demand.industrial} tone="industrial" />
      </section>

      <section className="needs-section" aria-labelledby="supply-heading">
        <h3 id="supply-heading">
          <HeartPulse aria-hidden="true" />
          Grundversorgung
        </h3>
        <div className="supply-list">
          {utilityRows.map(({ category, label, icon: Icon, unit }) => {
            const capacity = getUtilityCapacity(state, category);
            const utilityDemand = getUtilityDemand(state, category);
            const supplied = capacity >= utilityDemand;
            return (
              <div className="supply-row" key={category}>
                <Icon aria-hidden="true" />
                <span>
                  <strong>{label}</strong>
                  <small>
                    {capacity} / {utilityDemand} {unit}
                  </small>
                </span>
                {supplied ? (
                  <CheckCircle2 aria-label="Versorgt" className="supply-ok" />
                ) : (
                  <AlertTriangle aria-label="Engpass" className="supply-warning" />
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="happiness-summary">
        <Smile aria-hidden="true" />
        <span>
          <small>Zufriedenheit</small>
          <strong>{state.happiness} %</strong>
        </span>
      </div>
    </aside>
  );
}

interface NeedBarProps {
  label: string;
  value: number;
  tone: "residential" | "commercial" | "industrial";
}

function NeedBar({ label, value, tone }: NeedBarProps) {
  return (
    <div className="need-bar-row">
      <span>{label}</span>
      <div className="need-bar-track">
        <i className={`demand-fill demand-${tone}`} style={{ width: `${value}%` }} />
      </div>
      <strong>{value} %</strong>
    </div>
  );
}
