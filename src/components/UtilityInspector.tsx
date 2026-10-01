import {
  CircleDollarSign,
  Droplets,
  Factory,
  Flame,
  Gauge,
  Landmark,
  Recycle,
  Trash2,
  Waves,
  Wind,
  Zap,
} from "lucide-react";

import {
  getUtilityCapacity,
  getUtilityCoverage,
  getUtilityDemand,
  SERVICE_BUILDING_DEFINITIONS,
  type GameState,
  type ServiceBuildingDefinition,
  type ServiceBuildingKind,
} from "../simulation/cityMap";
import type { UtilityToolId } from "../store/gameStore";

interface UtilityInspectorProps {
  activeTool: UtilityToolId;
  state: GameState;
  selectedKind: ServiceBuildingKind;
  onSelectKind: (kind: ServiceBuildingKind) => void;
}

const currency = new Intl.NumberFormat("de-CH", {
  style: "currency",
  currency: "CHF",
  maximumFractionDigits: 0,
});

const utilityConfig = {
  electricity: {
    title: "Stromversorgung",
    icon: Zap,
    unit: "MW",
    options: ["wind-turbine", "power-plant"],
  },
  water: {
    title: "Wasserversorgung",
    icon: Droplets,
    unit: "m3",
    options: ["water-pump", "water-tower"],
  },
  sewage: {
    title: "Abwasser",
    icon: Waves,
    unit: "m3",
    options: ["sewage-plant"],
  },
  waste: {
    title: "Muellentsorgung",
    icon: Recycle,
    unit: "t",
    options: ["landfill", "recycling-center", "incinerator"],
  },
} satisfies Record<
  UtilityToolId,
  {
    title: string;
    icon: typeof Zap;
    unit: string;
    options: ServiceBuildingKind[];
  }
>;

const serviceIcons: Partial<Record<ServiceBuildingKind, typeof Zap>> = {
  "wind-turbine": Wind,
  "power-plant": Factory,
  "water-pump": Droplets,
  "water-tower": Landmark,
  "sewage-plant": Waves,
  landfill: Trash2,
  "recycling-center": Recycle,
  incinerator: Flame,
};

export function UtilityInspector({
  activeTool,
  state,
  selectedKind,
  onSelectKind,
}: UtilityInspectorProps) {
  const config = utilityConfig[activeTool];
  const demand = getUtilityDemand(state, activeTool);
  const capacity = getUtilityCapacity(state, activeTool);
  const reserve = capacity - demand;
  const coverage = getUtilityCoverage(state, activeTool);
  const supplied = reserve >= 0 && coverage.coveragePercent === 100;
  const Icon = config.icon;

  return (
    <aside
      className={`sector-inspector utility-inspector utility-${activeTool}`}
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
          className={`sector-status ${supplied ? "status-owned" : "status-power-low"}`}
        >
          {supplied ? "Versorgt" : "Unterversorgt"}
        </span>
      </div>

      <dl className="sector-details utility-details">
        <div>
          <dt>
            <Icon aria-hidden="true" />
            Bedarf
          </dt>
          <dd>
            {demand} {config.unit}
          </dd>
        </div>
        <div>
          <dt>
            <Gauge aria-hidden="true" />
            Kapazitaet
          </dt>
          <dd>
            {capacity} {config.unit}
          </dd>
        </div>
        <div>
          <dt>Reserve</dt>
          <dd className={supplied ? "power-positive" : "power-negative"}>
            {reserve > 0 ? "+" : ""}
            {reserve} {config.unit}
          </dd>
        </div>
        {activeTool !== "waste" && (
          <div>
            <dt>Strassennetz</dt>
            <dd>
              {coverage.suppliedZoneCount} / {coverage.relevantZoneCount} Gebiete
            </dd>
          </div>
        )}
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
                  {currency.format(definition.cost)} · {getServiceCapacity(definition)}{" "}
                  {config.unit}
                </small>
              </span>
            </button>
          );
        })}
      </div>

      <div className="inspector-result utility-status">
        <CircleDollarSign aria-hidden="true" />
        {activeTool === "waste"
          ? "Strassenanschluss und freie Flaeche erforderlich"
          : "Versorgung folgt automatisch dem verbundenen Strassennetz"}
      </div>
    </aside>
  );
}

function getServiceCapacity(definition: ServiceBuildingDefinition): number {
  if (definition.category === "electricity") return definition.electricityCapacity;
  if (definition.category === "water") return definition.waterCapacity;
  if (definition.category === "sewage") return definition.sewageCapacity;
  return definition.wasteCapacity;
}
