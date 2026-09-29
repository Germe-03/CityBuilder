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

  it("rejects incomplete game states", () => {
    const incompleteState: Record<string, unknown> = { ...createInitialGameState() };
    delete incompleteState.sectors;

    expect(() =>
      parseSaveGame({
        schemaVersion: SAVEGAME_SCHEMA_VERSION,
        state: incompleteState,
      }),
    ).toThrow();
  });
});
