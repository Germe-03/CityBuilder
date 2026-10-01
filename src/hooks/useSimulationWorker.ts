import { useCallback, useEffect, useRef } from "react";

import type {
  BuildKind,
  GameSpeed,
  GameState,
  LoanAmount,
  LoanTerm,
  MapTile,
  ServiceBuildingKind,
} from "../simulation/cityMap";
import { SERVICE_BUILDING_DEFINITIONS } from "../simulation/cityMap";
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
          occupied: "Diese Kachel ist bereits bebaut.",
          "road-required": "Diese Zone braucht eine Strasse in der Naehe.",
          "invalid-avenue": "Eine Allee benoetigt zwei benachbarte freie Kacheln.",
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
          "protected-road":
            "Die regionale Hauptstrasse ist Teil der Aussenverbindung und kann nicht entfernt werden.",
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
          occupied: "Die benoetigte Flaeche ist bereits bebaut.",
          "road-required": "Die Einrichtung braucht eine Strasse in der Naehe.",
          "insufficient-budget": "Das Budget reicht fuer dieses Gebaeude nicht aus.",
        } as const;
        store.showNotice(failureMessages[event.reason ?? "unknown-tile"], "warning");
        return;
      }

      if (event.type === "loan-result") {
        if (event.ok) {
          store.showNotice(
            `Kredit ueber CHF ${event.amount.toLocaleString("de-CH")} aufgenommen.`,
            "success",
          );
          return;
        }
        const failureMessages = {
          "invalid-offer": "Dieses Kreditangebot ist nicht verfuegbar.",
          "loan-limit": "Es koennen hoechstens drei Kredite gleichzeitig laufen.",
        } as const;
        store.showNotice(failureMessages[event.reason ?? "invalid-offer"], "warning");
        return;
      }
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
    takeLoan: useCallback(
      (amount: LoanAmount, term: LoanTerm) => send({ type: "take-loan", amount, term }),
      [send],
    ),
    loadState: useCallback(
      (state: GameState) => send({ type: "replace-state", state }),
      [send],
    ),
    reset: useCallback(() => send({ type: "reset" }), [send]),
  };
}
