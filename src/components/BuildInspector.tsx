import { Building2, Coins, Factory, Grid3X3, House, Route, Store } from "lucide-react";

import {
  countZones,
  getBuildCost,
  getSupplyIssues,
  getZoneDevelopments,
  getZoneDevelopmentSummary,
  getZoneDemand,
  type BuildKind,
  type GameState,
  type ZoneType,
} from "../simulation/cityMap";
import type { BuildToolId } from "../store/gameStore";

interface BuildInspectorProps {
  activeTool: BuildToolId;
  state: GameState;
}

const currency = new Intl.NumberFormat("de-CH", {
  style: "currency",
  currency: "CHF",
  maximumFractionDigits: 0,
});

const zoneConfig: Record<
  ZoneType,
  { title: string; areaLabel: string; icon: typeof House; outputLabel: string }
> = {
  residential: {
    title: "Wohnzone",
    areaLabel: "Wohnflaeche",
    icon: House,
    outputLabel: "Kapazitaet",
  },
  commercial: {
    title: "Gewerbezone",
    areaLabel: "Gewerbeflaeche",
    icon: Store,
    outputLabel: "Arbeitsplaetze",
  },
  industrial: {
    title: "Industriezone",
    areaLabel: "Industrieflaeche",
    icon: Factory,
    outputLabel: "Arbeitsplaetze",
  },
};

export function BuildInspector({ activeTool, state }: BuildInspectorProps) {
  const isStreet = activeTool === "roads" || activeTool === "avenues";
  const isAvenue = activeTool === "avenues";
  const zone = isStreet ? null : activeTool;
  const config = zone ? zoneConfig[zone] : null;
  const Icon = isStreet ? Route : config!.icon;
  const title = isAvenue ? "Alleebau" : isStreet ? "Strassenbau" : config!.title;
  const kind: BuildKind = isAvenue ? "avenue" : isStreet ? "road" : zone!;
  const tileCount = isAvenue
    ? (state.avenueTiles ?? []).length
    : activeTool === "roads"
      ? state.roadTiles.length - (state.avenueTiles ?? []).length
      : countZones(state, zone!);
  const developments = zone
    ? getZoneDevelopments(state).filter((development) => development.tile.zone === zone)
    : [];
  const developmentSummary = zone ? getZoneDevelopmentSummary(state, zone) : null;
  const output = developments.reduce(
    (total, development) => total + development.level * (zone === "commercial" ? 4 : 6),
    0,
  );
  const demand = zone ? getZoneDemand(state)[zone] : 0;
  const supplyIssue = getSupplyIssues(state)[0];
  const issueLabels = {
    electricity: "Stromversorgung fehlt",
    water: "Wasserversorgung fehlt",
    sewage: "Abwasser ist ueberlastet",
    waste: "Muellentsorgung ist ueberlastet",
  } as const;

  return (
    <aside
      className={`sector-inspector build-inspector build-${activeTool}`}
      aria-label={title}
    >
      <div className="inspector-heading">
        <span className="inspector-icon">
          <Icon aria-hidden="true" />
        </span>
        <div>
          <small>Aktives Werkzeug</small>
          <h2>{title}</h2>
        </div>
        <span className="sector-status status-owned">Aktiv</span>
      </div>

      <dl className="sector-details build-details">
        <div>
          <dt>
            <Coins aria-hidden="true" />
            Kosten
          </dt>
          <dd>{currency.format(getBuildCost(kind))} / Kachel</dd>
        </div>
        <div>
          <dt>
            <Grid3X3 aria-hidden="true" />
            {isAvenue ? "Alleennetz" : isStreet ? "Strassennetz" : config!.areaLabel}
          </dt>
          <dd>{tileCount} Kacheln</dd>
        </div>
        {!isStreet && (
          <>
            <div>
              <dt>
                <Building2 aria-hidden="true" />
                Gebaeude
              </dt>
              <dd>{tileCount}</dd>
            </div>
            <div>
              <dt>{config!.outputLabel}</dt>
              <dd>{output}</dd>
            </div>
            <div>
              <dt>Ø Stufe</dt>
              <dd>
                {developmentSummary!.averageLevel} / {zone === "industrial" ? 3 : 5}
              </dd>
            </div>
            <div>
              <dt>Bodenwert</dt>
              <dd>{developmentSummary!.averageLandValue} / 100</dd>
            </div>
          </>
        )}
      </dl>

      <div className="inspector-result build-status">
        <Icon aria-hidden="true" />
        {isStreet
          ? isAvenue
            ? "Zwei Kacheln breit · Gerade Trasse"
            : "Geradliniger Trassenbau aktiv"
          : supplyIssue
            ? issueLabels[supplyIssue]
            : `Nachfrage: ${demand} %`}
      </div>
    </aside>
  );
}
