import type {
  BuildFailureReason,
  BuildKind,
  DemolishFailureReason,
  GameSpeed,
  GameState,
  LoanAmount,
  LoanFailureReason,
  LoanTerm,
  MapTile,
  ServiceBuilding,
  ServiceBuildingKind,
  ServicePlacementFailureReason,
} from "./cityMap";

export type SimulationCommand =
  | { type: "initialize" }
  | { type: "build-tiles"; kind: BuildKind; tiles: MapTile[] }
  | { type: "demolish-tiles"; tiles: MapTile[] }
  | {
      type: "place-service-building";
      kind: ServiceBuildingKind;
      anchor: MapTile;
    }
  | { type: "set-speed"; speed: GameSpeed }
  | { type: "take-loan"; amount: LoanAmount; term: LoanTerm }
  | { type: "replace-state"; state: GameState }
  | { type: "reset" };

export type SimulationEvent =
  | { type: "snapshot"; state: GameState }
  | {
      type: "build-result";
      ok: boolean;
      kind: BuildKind;
      placedCount: number;
      reason?: BuildFailureReason;
      state: GameState;
    }
  | {
      type: "demolish-result";
      ok: boolean;
      removedRoadCount: number;
      removedZoneCount: number;
      removedServiceCount: number;
      reason?: DemolishFailureReason;
      state: GameState;
    }
  | {
      type: "service-placement-result";
      ok: boolean;
      kind: ServiceBuildingKind;
      building?: ServiceBuilding;
      reason?: ServicePlacementFailureReason;
      state: GameState;
    }
  | {
      type: "loan-result";
      ok: boolean;
      amount: LoanAmount;
      term: LoanTerm;
      reason?: LoanFailureReason;
      state: GameState;
    };
