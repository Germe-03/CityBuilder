import { describe, expect, it } from "vitest";

import {
  parseSaveGame,
  SAVEGAME_SCHEMA_VERSION,
} from "../src/persistence/savegameSchema";
import { createInitialGameState } from "../src/simulation/cityMap";

describe("savegame schema", () => {
  it("loads a complete versioned game state", () => {
    const state = {
      ...createInitialGameState(),
      budget: 42_500,
      day: 18,
      roadTiles: [{ column: 8, row: 88 }],
      serviceBuildings: [
        { id: 1, kind: "fire-station" as const, column: 10, row: 90 },
        { id: 2, kind: "elementary-school" as const, column: 14, row: 90 },
      ],
    };

    expect(parseSaveGame({ schemaVersion: SAVEGAME_SCHEMA_VERSION, state })).toEqual(
      state,
    );
  });

  it("rejects savegames from unsupported versions", () => {
    expect(() =>
      parseSaveGame({ schemaVersion: 99, state: createInitialGameState() }),
    ).toThrow("Unsupported savegame version");
  });

  it("loads older saves without avenue and loan metadata", () => {
    const legacyState: Record<string, unknown> = { ...createInitialGameState() };
    delete legacyState.avenueTiles;
    delete legacyState.loans;

    const parsed = parseSaveGame({
      schemaVersion: SAVEGAME_SCHEMA_VERSION,
      state: legacyState,
    });
    expect(parsed.avenueTiles).toEqual([]);
    expect(parsed.loans).toEqual([]);
  });

  it("loads old sector metadata without keeping purchase restrictions", () => {
    const legacyState: Record<string, unknown> = {
      ...createInitialGameState(),
      purchasedSectorCount: 4,
      sectors: Array.from({ length: 64 }, (_, id) => ({
        id,
        column: id % 8,
        row: Math.floor(id / 8),
        owned: id < 19,
      })),
    };

    const parsed = parseSaveGame({
      schemaVersion: SAVEGAME_SCHEMA_VERSION,
      state: legacyState,
    });
    expect(parsed).not.toHaveProperty("purchasedSectorCount");
    expect(parsed).not.toHaveProperty("sectors");
  });
});
