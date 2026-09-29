import { Check, Grid3X3, LockKeyhole, MapPinned, ShoppingCart } from "lucide-react";

import {
  SECTOR_TILES_PER_SIDE,
  getSectorLabel,
  getSectorPurchaseInfo,
  type GameState,
} from "../simulation/cityMap";

interface SectorInspectorProps {
  state: GameState;
  selectedSectorId: number | null;
  onRequestPurchase: (sectorId: number) => void;
}

const currency = new Intl.NumberFormat("de-CH", {
  style: "currency",
  currency: "CHF",
  maximumFractionDigits: 0,
});

export function SectorInspector({
  state,
  selectedSectorId,
  onRequestPurchase,
}: SectorInspectorProps) {
  const sector =
    selectedSectorId === null ? undefined : state.sectors[selectedSectorId];

  if (!sector) {
    return (
      <aside
        className="sector-inspector inspector-empty"
        aria-label="Sektorinformationen"
      >
        <MapPinned aria-hidden="true" />
        <h2>Sektor auswaehlen</h2>
      </aside>
    );
  }

  const purchaseInfo = getSectorPurchaseInfo(state, sector.id);
  const statusLabels = {
    owned: "In Besitz",
    available: "Kaufbar",
    locked: "Nicht erschlossen",
  } as const;

  return (
    <aside className="sector-inspector" aria-label={`Sektor ${getSectorLabel(sector)}`}>
      <div className="inspector-heading">
        <span className="inspector-icon">
          <MapPinned aria-hidden="true" />
        </span>
        <div>
          <small>Sektor</small>
          <h2>{getSectorLabel(sector)}</h2>
        </div>
        <span className={`sector-status status-${purchaseInfo.status}`}>
          {statusLabels[purchaseInfo.status]}
        </span>
      </div>

      <dl className="sector-details">
        <div>
          <dt>
            <Grid3X3 aria-hidden="true" />
            Flaeche
          </dt>
          <dd>{SECTOR_TILES_PER_SIDE * SECTOR_TILES_PER_SIDE} Kacheln</dd>
        </div>
        <div>
          <dt>Position</dt>
          <dd>
            {sector.column + 1} / {sector.row + 1}
          </dd>
        </div>
        <div>
          <dt>Kaufpreis</dt>
          <dd>
            {purchaseInfo.status === "owned"
              ? "-"
              : currency.format(purchaseInfo.price)}
          </dd>
        </div>
      </dl>

      {purchaseInfo.status === "available" && (
        <button
          type="button"
          className="primary-button purchase-button"
          onClick={() => onRequestPurchase(sector.id)}
          disabled={state.budget < purchaseInfo.price}
        >
          <ShoppingCart aria-hidden="true" />
          {state.budget < purchaseInfo.price ? "Budget reicht nicht" : "Sektor kaufen"}
        </button>
      )}
      {purchaseInfo.status === "owned" && (
        <div className="inspector-result">
          <Check aria-hidden="true" />
          Teil der Stadt
        </div>
      )}
      {purchaseInfo.status === "locked" && (
        <div className="inspector-result is-locked">
          <LockKeyhole aria-hidden="true" />
          Gemeinsame Grenze erforderlich
        </div>
      )}
    </aside>
  );
}
