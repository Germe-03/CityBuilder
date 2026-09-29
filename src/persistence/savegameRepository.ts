import Dexie, { type EntityTable } from "dexie";

import type { GameState } from "../simulation/cityMap";
import { parseSaveGame, SAVEGAME_SCHEMA_VERSION } from "./savegameSchema";

export const AUTOSAVE_ID = "autosave";

type SaveGameKind = "autosave" | "manual";

interface StoredSaveGame {
  id: string;
  kind: SaveGameKind;
  name: string;
  savedAt: number;
  cityName: string;
  day: number;
  population: number;
  schemaVersion: number;
  state: GameState;
}

export interface SaveGameSummary {
  id: string;
  kind: SaveGameKind;
  name: string;
  savedAt: number;
  cityName: string;
  day: number;
  population: number;
}

class CityBuilderDatabase extends Dexie {
  savegames!: EntityTable<StoredSaveGame, "id">;

  constructor() {
    super("citybuilder");
    this.version(1).stores({
      savegames: "id, kind, savedAt, cityName",
    });
  }
}

let database: CityBuilderDatabase | null = null;

function getDatabase(): CityBuilderDatabase {
  database ??= new CityBuilderDatabase();
  return database;
}

export async function listSaveGames(): Promise<SaveGameSummary[]> {
  const rows = await getDatabase().savegames.orderBy("savedAt").reverse().toArray();
  return rows.map(toSummary);
}

export async function createManualSave(
  state: GameState,
  name: string,
): Promise<SaveGameSummary> {
  const id = createSaveId();
  const row = createStoredSave(id, "manual", name, state);
  await getDatabase().savegames.put(row);
  return toSummary(row);
}

export async function saveAutosave(state: GameState): Promise<void> {
  await getDatabase().savegames.put(
    createStoredSave(AUTOSAVE_ID, "autosave", "Automatischer Spielstand", state),
  );
}

export async function loadSaveGame(id: string): Promise<GameState> {
  const row = await getDatabase().savegames.get(id);
  if (!row) throw new Error("Savegame not found");
  return parseSaveGame(row);
}

export async function loadAutosave(): Promise<GameState | null> {
  const row = await getDatabase().savegames.get(AUTOSAVE_ID);
  return row ? parseSaveGame(row) : null;
}

export async function deleteSaveGame(id: string): Promise<void> {
  await getDatabase().savegames.delete(id);
}

function createStoredSave(
  id: string,
  kind: SaveGameKind,
  name: string,
  state: GameState,
): StoredSaveGame {
  return {
    id,
    kind,
    name: name.trim() || state.cityName,
    savedAt: Date.now(),
    cityName: state.cityName,
    day: state.day,
    population: state.population,
    schemaVersion: SAVEGAME_SCHEMA_VERSION,
    state,
  };
}

function toSummary(row: StoredSaveGame): SaveGameSummary {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    savedAt: row.savedAt,
    cityName: row.cityName,
    day: row.day,
    population: row.population,
  };
}

function createSaveId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `save-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}
