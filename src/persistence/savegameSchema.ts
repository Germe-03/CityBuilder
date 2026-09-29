import { z } from "zod";

import { TOTAL_SECTOR_COUNT, type GameState } from "../simulation/cityMap";

export const SAVEGAME_SCHEMA_VERSION = 1;

const mapTileSchema = z.object({
  column: z.number().int().nonnegative(),
  row: z.number().int().nonnegative(),
});

const sectorSchema = z.object({
  id: z.number().int().nonnegative(),
  column: z.number().int().nonnegative(),
  row: z.number().int().nonnegative(),
  owned: z.boolean(),
});

const zoneTileSchema = mapTileSchema.extend({
  zone: z.enum(["residential", "commercial", "industrial"]),
});

const serviceBuildingSchema = mapTileSchema.extend({
  id: z.number().int().positive(),
  kind: z.enum([
    "wind-turbine",
    "power-plant",
    "water-pump",
    "water-tower",
    "sewage-plant",
    "landfill",
    "recycling-center",
    "incinerator",
  ]),
});

export const gameStateSchema = z.object({
  cityName: z.string().min(1).max(80),
  budget: z.number().finite(),
  population: z.number().int().nonnegative(),
  jobs: z.number().int().nonnegative(),
  happiness: z.number().min(0).max(100),
  lastIncome: z.number().finite(),
  lastExpenses: z.number().finite(),
  day: z.number().int().positive(),
  speed: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  purchasedSectorCount: z.number().int().nonnegative(),
  sectors: z.array(sectorSchema).length(TOTAL_SECTOR_COUNT),
  roadTiles: z.array(mapTileSchema),
  zoneTiles: z.array(zoneTileSchema),
  serviceBuildings: z.array(serviceBuildingSchema),
});

export interface SaveGameEnvelope {
  schemaVersion: number;
  state: unknown;
}

export function parseSaveGame(envelope: SaveGameEnvelope): GameState {
  if (envelope.schemaVersion !== SAVEGAME_SCHEMA_VERSION) {
    throw new Error(`Unsupported savegame version: ${envelope.schemaVersion}`);
  }

  return gameStateSchema.parse(envelope.state) as GameState;
}
