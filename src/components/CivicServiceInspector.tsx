import {
  Building2,
  CircleDollarSign,
  Clock3,
  Flame,
  GraduationCap,
  Hospital,
  School,
  Shield,
  Stethoscope,
  Users,
} from "lucide-react";

import {
  getCivicCoverage,
  SERVICE_BUILDING_DEFINITIONS,
  type CivicServiceCategory,
  type GameState,
  type ServiceBuildingKind,
} from "../simulation/cityMap";
import type { CivicToolId } from "../store/gameStore";

interface CivicServiceInspectorProps {
  activeTool: CivicToolId;
  state: GameState;
  selectedKind: ServiceBuildingKind;
  onSelectKind: (kind: ServiceBuildingKind) => void;
}

const currency = new Intl.NumberFormat("de-CH", {
  style: "currency",
  currency: "CHF",
  maximumFractionDigits: 0,
});

const civicConfig = {
  fire: {
    title: "Feuerwehr",
    icon: Flame,
    options: ["fire-station"],
  },
  police: {
    title: "Polizei",
    icon: Shield,
    options: ["police-station"],
  },
  health: {
    title: "Gesundheit",
    icon: Hospital,
    options: ["clinic", "hospital"],
  },
  education: {
    title: "Bildung",
    icon: GraduationCap,
    options: ["elementary-school", "high-school"],
  },
} satisfies Record<
  CivicToolId,
  {
    title: string;
    icon: typeof Flame;
    options: ServiceBuildingKind[];
  }
>;

const serviceIcons: Partial<Record<ServiceBuildingKind, typeof Flame>> = {
  "fire-station": Flame,
  "police-station": Shield,
  clinic: Stethoscope,
  hospital: Hospital,
  "elementary-school": School,
  "high-school": GraduationCap,
};

export function CivicServiceInspector({
  activeTool,
  state,
  selectedKind,
  onSelectKind,
}: CivicServiceInspectorProps) {
  const config = civicConfig[activeTool];
  const coverage = getCivicCoverage(state, activeTool as CivicServiceCategory);
  const Icon = config.icon;
  const covered = coverage.coveragePercent >= 80;

  return (
    <aside
      className={`sector-inspector utility-inspector civic-inspector civic-${activeTool}`}
      aria-label={config.title}
    >
      <div className="inspector-heading">
        <span className="inspector-icon">
          <Icon aria-hidden="true" />
        </span>
        <div>
          <small>Oeffentliche Einrichtung</small>
          <h2>{config.title}</h2>
        </div>
        <span
          className={`sector-status ${covered ? "status-owned" : "status-available"}`}
        >
          {coverage.coveragePercent} %
        </span>
      </div>

      <dl className="sector-details utility-details civic-details">
        <div>
          <dt>
            <Building2 aria-hidden="true" />
            Einrichtungen
          </dt>
          <dd>{coverage.buildingCount}</dd>
        </div>
        <div>
          <dt>
            <Users aria-hidden="true" />
            Kapazitaet
          </dt>
          <dd>
            {coverage.capacity} / {coverage.demand}
          </dd>
        </div>
        <div>
          <dt>
            <Clock3 aria-hidden="true" />
            Reaktionszeit
          </dt>
          <dd>
            {coverage.averageResponseMinutes === null
              ? "-"
              : `${coverage.averageResponseMinutes} min`}
          </dd>
        </div>
      </dl>

      <div
        className="service-options"
        role="group"
        aria-label={`${config.title} waehlen`}
      >
        {config.options.map((kind) => {
          const definition = SERVICE_BUILDING_DEFINITIONS[kind];
          const OptionIcon = serviceIcons[kind] ?? Icon;
          const selected = selectedKind === kind;
          return (
            <button
              key={kind}
              type="button"
              className={selected ? "service-option is-selected" : "service-option"}
              onClick={() => onSelectKind(kind)}
              aria-pressed={selected}
            >
              <OptionIcon aria-hidden="true" />
              <span>
                <strong>{definition.label}</strong>
                <small>
                  {currency.format(definition.cost)} · Reichweite{" "}
                  {definition.serviceRange}
                </small>
              </span>
            </button>
          );
        })}
      </div>

      <div className="inspector-result utility-status">
        <CircleDollarSign aria-hidden="true" />
        Unterhalt wird monatlich verrechnet
      </div>
    </aside>
  );
}
