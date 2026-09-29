import { useCallback, useEffect, useRef } from "react";

import type {
  BuildKind,
  GameSpeed,
  GameState,
  MapTile,
  ServiceBuildingKind,
} from "../simulation/cityMap";
import { getSectorLabel, SERVICE_BUILDING_DEFINITIONS } from "../simulation/cityMap";
import type { SimulationCommand, SimulationEvent } from "../simulation/protocol";
import { useGameStore } from "../store/gameStore";

export function useSimulationWorker() {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const worker = new Worker(
      new URL("../worker/simulation.worker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = worker;

    worker.onmessage = (message: MessageEvent<SimulationEvent>) => {
      const event = message.data;
      const store = useGameStore.getState();

      if (event.type === "snapshot") {
        store.setSnapshot(event.state);
        store.setConnected(true);
        return;
      }

      store.setSnapshot(event.state);
      store.setConnected(true);

      if (event.type === "build-result") {
        if (event.ok) return;

        const failureMessages = {
          "unknown-tile": "Diese Kachel liegt ausserhalb der Karte.",
          "locked-sector": "Dieser Sektor muss zuerst gekauft werden.",
          occupied: "Diese Kachel ist bereits bebaut.",
          "road-required": "Diese Zone braucht eine Strasse in der Naehe.",
          "insufficient-budget": "Das Budget reicht fuer diese Bauaktion nicht aus.",
        } as const;
        store.showNotice(failureMessages[event.reason ?? "unknown-tile"], "warning");
        return;
      }

      if (event.type === "demolish-result") {
        if (event.ok) {
          const removedCount =
            event.removedRoadCount + event.removedZoneCount + event.removedServiceCount;
          store.showNotice(
            `${removedCount} ${removedCount === 1 ? "Objekt" : "Objekte"} entfernt.`,
            "success",
          );
          return;
        }

        const failureMessages = {
          "unknown-tile": "Diese Kachel liegt ausserhalb der Karte.",
          "empty-tile": "Auf dieser Kachel gibt es nichts zu entfernen.",
        } as const;
        store.showNotice(failureMessages[event.reason ?? "empty-tile"], "warning");
        return;
      }

      if (event.type === "service-placement-result") {
        const definition = SERVICE_BUILDING_DEFINITIONS[event.kind];
        if (event.ok) {
          store.showNotice(`${definition.label} gebaut.`, "success");
          return;
        }

        const failureMessages = {
          "unknown-tile": "Das Gebaeude passt an dieser Stelle nicht auf die Karte.",
          "locked-sector": "Alle Gebaeudekacheln muessen in deinem Gebiet liegen.",
          occupied: "Die benoetigte Flaeche ist bereits bebaut.",
          "road-required": "Die Einrichtung braucht eine Strasse in der Naehe.",
          "insufficient-budget": "Das Budget reicht fuer dieses Gebaeude nicht aus.",
        } as const;
        store.showNotice(failureMessages[event.reason ?? "unknown-tile"], "warning");
        return;
      }

      const sector = event.state.sectors[event.sectorId];

      if (event.ok) {
        store.showNotice(
          `Sektor ${getSectorLabel(sector)} wurde erschlossen.`,
          "success",
        );
        return;
      }

      const failureMessages = {
        "already-owned": "Dieser Sektor gehoert bereits zur Stadt.",
        "not-adjacent": "Der Sektor braucht eine gemeinsame Grenze mit deinem Gebiet.",
        "insufficient-budget": "Das Budget reicht fuer diesen Sektor nicht aus.",
        "unknown-sector": "Der ausgewaehlte Sektor ist nicht verfuegbar.",
      } as const;
      store.showNotice(failureMessages[event.reason ?? "unknown-sector"], "warning");
    };

    worker.onerror = () => {
      const store = useGameStore.getState();
      store.setConnected(false);
      store.showNotice("Die Simulation konnte nicht gestartet werden.", "warning");
    };

    worker.postMessage({ type: "initialize" } satisfies SimulationCommand);

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const send = useCallback((command: SimulationCommand) => {
    workerRef.current?.postMessage(command);
  }, []);

  return {
    purchaseSector: useCallback(
      (sectorId: number) => send({ type: "purchase-sector", sectorId }),
      [send],
    ),
    buildTiles: useCallback(
      (kind: BuildKind, tiles: MapTile[]) => send({ type: "build-tiles", kind, tiles }),
      [send],
    ),
    demolishTiles: useCallback(
      (tiles: MapTile[]) => send({ type: "demolish-tiles", tiles }),
      [send],
    ),
    placeServiceBuilding: useCallback(
      (kind: ServiceBuildingKind, anchor: MapTile) =>
        send({ type: "place-service-building", kind, anchor }),
      [send],
    ),
    setSpeed: useCallback(
      (speed: GameSpeed) => send({ type: "set-speed", speed }),
      [send],
    ),
    loadState: useCallback(
      (state: GameState) => send({ type: "replace-state", state }),
      [send],
    ),
    reset: useCallback(() => send({ type: "reset" }), [send]),
  };
}
