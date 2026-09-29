import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { BuildInspector } from "./components/BuildInspector";
import { BulldozerInspector } from "./components/BulldozerInspector";
import { NeedsInspector } from "./components/NeedsInspector";
import { PurchaseDialog } from "./components/PurchaseDialog";
import { SaveGameDialog } from "./components/SaveGameDialog";
import { SectorInspector } from "./components/SectorInspector";
import { ToolRail } from "./components/ToolRail";
import { TopBar } from "./components/TopBar";
import { UtilityInspector } from "./components/UtilityInspector";
import { useSimulationWorker } from "./hooks/useSimulationWorker";
import { loadAutosave, saveAutosave } from "./persistence/savegameRepository";
import { CityMapCanvas } from "./rendering/CityMapCanvas";
import { useGameStore } from "./store/gameStore";
import type { BuildToolId, ToolId, UtilityToolId } from "./store/gameStore";

export default function App() {
  const snapshot = useGameStore((store) => store.snapshot);
  const connected = useGameStore((store) => store.connected);
  const selectedSectorId = useGameStore((store) => store.selectedSectorId);
  const activeTool = useGameStore((store) => store.activeTool);
  const selectedServiceBuildingKind = useGameStore(
    (store) => store.selectedServiceBuildingKind,
  );
  const notice = useGameStore((store) => store.notice);
  const selectSector = useGameStore((store) => store.selectSector);
  const setActiveTool = useGameStore((store) => store.setActiveTool);
  const selectServiceBuildingKind = useGameStore(
    (store) => store.selectServiceBuildingKind,
  );
  const showNotice = useGameStore((store) => store.showNotice);
  const dismissNotice = useGameStore((store) => store.dismissNotice);
  const [purchaseSectorId, setPurchaseSectorId] = useState<number | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [autosaveReady, setAutosaveReady] = useState(false);
  const latestSnapshotRef = useRef(snapshot);
  const autosaveCheckedRef = useRef(false);
  const simulation = useSimulationWorker();

  const cancelPurchase = useCallback(() => setPurchaseSectorId(null), []);
  const confirmPurchase = useCallback(() => {
    if (purchaseSectorId === null) return;
    simulation.purchaseSector(purchaseSectorId);
    setPurchaseSectorId(null);
  }, [purchaseSectorId, simulation]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(dismissNotice, 4200);
    return () => window.clearTimeout(timeout);
  }, [dismissNotice, notice]);

  useEffect(() => {
    latestSnapshotRef.current = snapshot;
  }, [snapshot]);

  useEffect(() => {
    if (!connected || autosaveCheckedRef.current) return;
    autosaveCheckedRef.current = true;

    void loadAutosave()
      .then((savedState) => {
        if (!savedState) return;
        simulation.loadState(savedState);
        showNotice("Automatischer Spielstand geladen.", "success");
      })
      .catch(() => {
        showNotice(
          "Der automatische Spielstand konnte nicht geladen werden.",
          "warning",
        );
      })
      .finally(() => setAutosaveReady(true));
  }, [connected, showNotice, simulation]);

  useEffect(() => {
    if (!connected || !autosaveReady) return;

    const save = () => {
      void saveAutosave(latestSnapshotRef.current).catch(() => undefined);
    };
    const interval = window.setInterval(save, 10_000);
    const saveWhenHidden = () => {
      if (document.visibilityState === "hidden") save();
    };
    document.addEventListener("visibilitychange", saveWhenHidden);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", saveWhenHidden);
    };
  }, [autosaveReady, connected]);

  const handleLoadGame = useCallback(
    (state: typeof snapshot) => {
      simulation.loadState(state);
      selectSector(null);
      setActiveTool("needs");
    },
    [selectSector, setActiveTool, simulation],
  );

  return (
    <div className="game-shell">
      <TopBar
        state={snapshot}
        connected={connected}
        onSetSpeed={simulation.setSpeed}
        onOpenSavegames={() => setSaveDialogOpen(true)}
      />
      <ToolRail key={activeTool} activeTool={activeTool} onSelectTool={setActiveTool} />
      <main className="map-stage">
        <CityMapCanvas
          state={snapshot}
          selectedSectorId={selectedSectorId}
          activeTool={activeTool}
          selectedServiceBuildingKind={selectedServiceBuildingKind}
          onSelectSector={selectSector}
          onBuildTiles={simulation.buildTiles}
          onDemolishTiles={simulation.demolishTiles}
          onPlaceServiceBuilding={simulation.placeServiceBuilding}
        />
      </main>
      {activeTool === "needs" ? (
        <NeedsInspector state={snapshot} />
      ) : isUtilityTool(activeTool) ? (
        <UtilityInspector
          activeTool={activeTool}
          state={snapshot}
          selectedKind={selectedServiceBuildingKind}
          onSelectKind={selectServiceBuildingKind}
        />
      ) : activeTool === "bulldozer" ? (
        <BulldozerInspector state={snapshot} />
      ) : isBuildTool(activeTool) ? (
        <BuildInspector activeTool={activeTool} state={snapshot} />
      ) : (
        <SectorInspector
          state={snapshot}
          selectedSectorId={selectedSectorId}
          onRequestPurchase={setPurchaseSectorId}
        />
      )}

      {notice && (
        <div
          className={`notice notice-${notice.tone}`}
          role="status"
          aria-live="polite"
        >
          {notice.tone === "success" ? (
            <CheckCircle2 aria-hidden="true" />
          ) : notice.tone === "warning" ? (
            <AlertTriangle aria-hidden="true" />
          ) : (
            <Info aria-hidden="true" />
          )}
          <span>{notice.message}</span>
          <button type="button" onClick={dismissNotice} aria-label="Hinweis schliessen">
            <X aria-hidden="true" />
          </button>
        </div>
      )}

      {purchaseSectorId !== null && (
        <PurchaseDialog
          state={snapshot}
          sectorId={purchaseSectorId}
          onCancel={cancelPurchase}
          onConfirm={confirmPurchase}
        />
      )}

      {saveDialogOpen && (
        <SaveGameDialog
          state={snapshot}
          onClose={() => setSaveDialogOpen(false)}
          onLoad={handleLoadGame}
          onFeedback={showNotice}
        />
      )}
    </div>
  );
}

function isBuildTool(tool: ToolId): tool is BuildToolId {
  return (
    tool === "roads" ||
    tool === "residential" ||
    tool === "commercial" ||
    tool === "industrial"
  );
}

function isUtilityTool(tool: ToolId): tool is UtilityToolId {
  return (
    tool === "electricity" || tool === "water" || tool === "sewage" || tool === "waste"
  );
}
