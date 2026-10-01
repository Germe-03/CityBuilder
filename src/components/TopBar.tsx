import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Database,
  FastForward,
  Landmark,
  Pause,
  Play,
  Smile,
  TrendingUp,
  Users,
  Zap,
  Droplets,
  Recycle,
  Waves,
} from "lucide-react";

import {
  getElectricityCapacity,
  getElectricityDemand,
  getSupplyIssues,
  getUtilityCapacity,
  getUtilityDemand,
  type GameSpeed,
  type GameState,
} from "../simulation/cityMap";

interface TopBarProps {
  state: GameState;
  connected: boolean;
  onSetSpeed: (speed: GameSpeed) => void;
  onOpenSavegames: () => void;
}

const currency = new Intl.NumberFormat("de-CH", {
  style: "currency",
  currency: "CHF",
  maximumFractionDigits: 0,
});

export function TopBar({ state, connected, onSetSpeed, onOpenSavegames }: TopBarProps) {
  const electricityDemand = getElectricityDemand(state);
  const electricityCapacity = getElectricityCapacity(state);
  const supplyIssues = getSupplyIssues(state);

  return (
    <header className="topbar">
      <div className="city-identity">
        <span className="city-mark">
          <Building2 aria-hidden="true" />
        </span>
        <span>
          <strong>{state.cityName}</strong>
          <small className={connected ? "status-online" : "status-connecting"}>
            {connected ? "Simulation aktiv" : "Simulation startet"}
          </small>
        </span>
      </div>

      <div className="city-stats" aria-label="Stadtstatus">
        <StatusItem
          icon={Landmark}
          label="Budget"
          value={currency.format(state.budget)}
        />
        <StatusItem
          icon={Users}
          label="Einwohner"
          value={state.population.toLocaleString("de-CH")}
        />
        <StatusItem
          icon={BriefcaseBusiness}
          label="Arbeitsplaetze"
          value={state.jobs.toLocaleString("de-CH")}
        />
        <StatusItem
          icon={Zap}
          label="Strom"
          value={`${electricityCapacity} / ${electricityDemand} MW`}
          warning={supplyIssues.includes("electricity")}
        />
        <StatusItem
          icon={Droplets}
          label="Wasser"
          value={`${getUtilityCapacity(state, "water")} / ${getUtilityDemand(state, "water")} m3`}
          warning={supplyIssues.includes("water")}
        />
        <StatusItem
          icon={Waves}
          label="Abwasser"
          value={`${getUtilityCapacity(state, "sewage")} / ${getUtilityDemand(state, "sewage")} m3`}
          warning={supplyIssues.includes("sewage")}
        />
        <StatusItem
          icon={Recycle}
          label="Muell"
          value={`${getUtilityCapacity(state, "waste")} / ${getUtilityDemand(state, "waste")} t`}
          warning={supplyIssues.includes("waste")}
        />
        <StatusItem icon={Smile} label="Zufriedenheit" value={`${state.happiness} %`} />
        <StatusItem
          icon={TrendingUp}
          label="Monatsbilanz"
          value={currency.format(state.lastIncome - state.lastExpenses)}
        />
        <StatusItem icon={CalendarDays} label="Tag" value={state.day.toString()} />
      </div>

      <div className="speed-control" aria-label="Simulationsgeschwindigkeit">
        <button
          type="button"
          className="icon-button savegame-button"
          onClick={onOpenSavegames}
          aria-label="Speicherstaende"
          title="Speicherstaende"
        >
          <Database aria-hidden="true" />
        </button>
        <SpeedButton
          label="Pause"
          active={state.speed === 0}
          onClick={() => onSetSpeed(0)}
          icon={Pause}
        />
        <SpeedButton
          label="Normal"
          active={state.speed === 1}
          onClick={() => onSetSpeed(1)}
          icon={Play}
        />
        <SpeedButton
          label="Schnell"
          active={state.speed === 3}
          onClick={() => onSetSpeed(3)}
          icon={FastForward}
        />
      </div>
    </header>
  );
}

interface StatusItemProps {
  icon: typeof Landmark;
  label: string;
  value: string;
  warning?: boolean;
}

function StatusItem({ icon: Icon, label, value, warning = false }: StatusItemProps) {
  return (
    <div className={warning ? "status-item is-warning" : "status-item"}>
      <Icon aria-hidden="true" />
      <span>
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
    </div>
  );
}

interface SpeedButtonProps {
  icon: typeof Pause;
  label: string;
  active: boolean;
  onClick: () => void;
}

function SpeedButton({ icon: Icon, label, active, onClick }: SpeedButtonProps) {
  return (
    <button
      type="button"
      className={active ? "speed-button is-active" : "speed-button"}
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
    >
      <Icon aria-hidden="true" />
    </button>
  );
}
