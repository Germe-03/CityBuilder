import { MapPinned, ShoppingCart, X } from "lucide-react";
import { useEffect, useRef } from "react";

import {
  getSectorLabel,
  getSectorPurchaseInfo,
  type GameState,
} from "../simulation/cityMap";

interface PurchaseDialogProps {
  state: GameState;
  sectorId: number;
  onCancel: () => void;
  onConfirm: () => void;
}

const currency = new Intl.NumberFormat("de-CH", {
  style: "currency",
  currency: "CHF",
  maximumFractionDigits: 0,
});

export function PurchaseDialog({
  state,
  sectorId,
  onCancel,
  onConfirm,
}: PurchaseDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const sector = state.sectors[sectorId];
  const purchaseInfo = getSectorPurchaseInfo(state, sectorId);

  useEffect(() => {
    confirmRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onCancel}>
      <section
        className="purchase-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchase-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="dialog-close icon-button"
          onClick={onCancel}
          aria-label="Dialog schliessen"
        >
          <X aria-hidden="true" />
        </button>
        <span className="dialog-icon">
          <MapPinned aria-hidden="true" />
        </span>
        <small>Gebietserweiterung</small>
        <h2 id="purchase-title">Sektor {getSectorLabel(sector)} kaufen?</h2>
        <dl className="purchase-summary">
          <div>
            <dt>Kaufpreis</dt>
            <dd>{currency.format(purchaseInfo.price)}</dd>
          </div>
          <div>
            <dt>Budget danach</dt>
            <dd>{currency.format(state.budget - purchaseInfo.price)}</dd>
          </div>
        </dl>
        <div className="dialog-actions">
          <button type="button" className="secondary-button" onClick={onCancel}>
            Abbrechen
          </button>
          <button
            ref={confirmRef}
            type="button"
            className="primary-button"
            onClick={onConfirm}
          >
            <ShoppingCart aria-hidden="true" />
            Kaufen
          </button>
        </div>
      </section>
    </div>
  );
}
