import { z } from "zod";

import type { GameState } from "../simulation/cityMap";

export const SAVEGAME_SCHEMA_VERSION = 1;

const mapTileSchema = z.object({
  column: z.number().int().nonnegative(),
  row: z.number().int().nonnegative(),
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
    "fire-station",
    "police-station",
    "clinic",
    "hospital",
    "elementary-school",
    "high-school",
  ]),
});

const cityLoanSchema = z.object({
  id: z.number().int().positive(),
  originalPrincipal: z.number().positive(),
  remainingBalance: z.number().nonnegative(),
  annualRate: z.number().nonnegative(),
  monthlyPayment: z.number().positive(),
  originalTermMonths: z.union([
    z.literal(12),
    z.literal(24),
    z.literal(48),
    z.literal(72),
  ]),
  remainingMonths: z.number().int().nonnegative(),
  startedDay: z.number().int().positive(),
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
  roadTiles: z.array(mapTileSchema),
  avenueTiles: z.array(mapTileSchema).default([]),
  zoneTiles: z.array(zoneTileSchema),
  serviceBuildings: z.array(serviceBuildingSchema),
  loans: z.array(cityLoanSchema).default([]),
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
