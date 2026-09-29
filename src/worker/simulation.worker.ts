/// <reference lib="webworker" />

import {
  advanceSimulation,
  buildTiles,
  createInitialGameState,
  demolishTiles,
  placeServiceBuilding,
  purchaseSector,
} from "../simulation/cityMap";
import type { SimulationCommand, SimulationEvent } from "../simulation/protocol";

const workerScope = self as unknown as DedicatedWorkerGlobalScope;
let state = createInitialGameState();

function emit(event: SimulationEvent): void {
  workerScope.postMessage(event);
}

function emitSnapshot(): void {
  emit({ type: "snapshot", state });
}

workerScope.onmessage = (message: MessageEvent<SimulationCommand>) => {
  const command = message.data;

  switch (command.type) {
    case "initialize":
      emitSnapshot();
      break;
    case "purchase-sector": {
      const result = purchaseSector(state, command.sectorId);
      state = result.state;
      emit({
        type: "purchase-result",
        ok: result.ok,
        sectorId: command.sectorId,
        reason: result.reason,
        state,
      });
      break;
    }
    case "build-tiles": {
      const result = buildTiles(state, command.kind, command.tiles);
      state = result.state;
      emit({
        type: "build-result",
        ok: result.ok,
        kind: command.kind,
        placedCount: result.placedCount,
        reason: result.reason,
        state,
      });
      break;
    }
    case "demolish-tiles": {
      const result = demolishTiles(state, command.tiles);
      state = result.state;
      emit({
        type: "demolish-result",
        ok: result.ok,
        removedRoadCount: result.removedRoadCount,
        removedZoneCount: result.removedZoneCount,
        removedServiceCount: result.removedServiceCount,
        reason: result.reason,
        state,
      });
      break;
    }
    case "place-service-building": {
      const result = placeServiceBuilding(state, command.kind, command.anchor);
      state = result.state;
      emit({
        type: "service-placement-result",
        ok: result.ok,
        kind: command.kind,
        building: result.building,
        reason: result.reason,
        state,
      });
      break;
    }
    case "set-speed":
      state = { ...state, speed: command.speed };
      emitSnapshot();
      break;
    case "replace-state":
      state = command.state;
      emitSnapshot();
      break;
    case "reset":
      state = createInitialGameState();
      emitSnapshot();
      break;
  }
};

setInterval(() => {
  const nextState = advanceSimulation(state);
  if (nextState !== state) {
    state = nextState;
    emitSnapshot();
  }
}, 800);
