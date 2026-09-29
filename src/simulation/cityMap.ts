export const MAP_SECTORS_PER_SIDE = 8;
export const SECTOR_TILES_PER_SIDE = 16;
export const MAP_TILES_PER_SIDE = MAP_SECTORS_PER_SIDE * SECTOR_TILES_PER_SIDE;
export const TOTAL_SECTOR_COUNT = MAP_SECTORS_PER_SIDE * MAP_SECTORS_PER_SIDE;
export const STARTING_SECTOR_COUNT = 15;
export const STARTING_BUDGET = 75_000;
export const BASE_SECTOR_PRICE = 8_000;
export const SECTOR_PRICE_STEP = 1_500;
export const ROAD_TILE_COST = 120;
export const RESIDENTIAL_ZONE_COST = 35;
export const COMMERCIAL_ZONE_COST = 50;
export const INDUSTRIAL_ZONE_COST = 65;

export type ServiceCategory = "electricity" | "water" | "sewage" | "waste";
export type ServiceBuildingKind =
  | "wind-turbine"
  | "power-plant"
  | "water-pump"
  | "water-tower"
  | "sewage-plant"
  | "landfill"
  | "recycling-center"
  | "incinerator";

export interface ServiceBuildingDefinition {
  label: string;
  category: ServiceCategory;
  cost: number;
  upkeep: number;
  electricityCapacity: number;
  waterCapacity: number;
  sewageCapacity: number;
  wasteCapacity: number;
  electricityConsumption: number;
  footprint: number;
}

export const SERVICE_BUILDING_DEFINITIONS: Record<
  ServiceBuildingKind,
  ServiceBuildingDefinition
> = {
  "wind-turbine": {
    label: "Windkraftanlage",
    category: "electricity",
    cost: 5_000,
    upkeep: 60,
    electricityCapacity: 40,
    waterCapacity: 0,
    sewageCapacity: 0,
    wasteCapacity: 0,
    electricityConsumption: 0,
    footprint: 2,
  },
  "power-plant": {
    label: "Kraftwerk",
    category: "electricity",
    cost: 20_000,
    upkeep: 250,
    electricityCapacity: 180,
    waterCapacity: 0,
    sewageCapacity: 0,
    wasteCapacity: 0,
    electricityConsumption: 0,
    footprint: 4,
  },
  "water-pump": {
    label: "Pumpwerk",
    category: "water",
    cost: 7_500,
    upkeep: 90,
    electricityCapacity: 0,
    waterCapacity: 90,
    sewageCapacity: 0,
    wasteCapacity: 0,
    electricityConsumption: 5,
    footprint: 3,
  },
  "water-tower": {
    label: "Wasserturm",
    category: "water",
    cost: 6_000,
    upkeep: 60,
    electricityCapacity: 0,
    waterCapacity: 45,
    sewageCapacity: 0,
    wasteCapacity: 0,
    electricityConsumption: 2,
    footprint: 2,
  },
  "sewage-plant": {
    label: "Klaeranlage",
    category: "sewage",
    cost: 12_000,
    upkeep: 180,
    electricityCapacity: 0,
    waterCapacity: 0,
    sewageCapacity: 150,
    wasteCapacity: 0,
    electricityConsumption: 8,
    footprint: 4,
  },
  landfill: {
    label: "Deponie",
    category: "waste",
    cost: 10_000,
    upkeep: 140,
    electricityCapacity: 0,
    waterCapacity: 0,
    sewageCapacity: 0,
    wasteCapacity: 130,
    electricityConsumption: 3,
    footprint: 4,
  },
  "recycling-center": {
    label: "Recyclinghof",
    category: "waste",
    cost: 15_000,
    upkeep: 170,
    electricityCapacity: 0,
    waterCapacity: 0,
    sewageCapacity: 0,
    wasteCapacity: 100,
    electricityConsumption: 10,
    footprint: 3,
  },
  incinerator: {
    label: "Verbrennungsanlage",
    category: "waste",
    cost: 25_000,
    upkeep: 320,
    electricityCapacity: 0,
    waterCapacity: 0,
    sewageCapacity: 0,
    wasteCapacity: 240,
    electricityConsumption: 25,
    footprint: 4,
  },
};

export type GameSpeed = 0 | 1 | 2 | 3;
export type SectorStatus = "owned" | "available" | "locked";
export type ZoneType = "residential" | "commercial" | "industrial";
export type BuildKind = "road" | ZoneType;
export type PurchaseFailureReason =
  "already-owned" | "not-adjacent" | "insufficient-budget" | "unknown-sector";
export type BuildFailureReason =
  | "unknown-tile"
  | "locked-sector"
  | "occupied"
  | "road-required"
  | "insufficient-budget";
export type DemolishFailureReason = "unknown-tile" | "empty-tile";
export type ServicePlacementFailureReason =
  | "unknown-tile"
  | "locked-sector"
  | "occupied"
  | "road-required"
  | "insufficient-budget";

export interface MapTile {
  column: number;
  row: number;
}

export interface ZonedTile extends MapTile {
  zone: ZoneType;
}

export interface ServiceBuilding extends MapTile {
  id: number;
  kind: ServiceBuildingKind;
}

export interface Sector {
  id: number;
  column: number;
  row: number;
  owned: boolean;
}

export interface GameState {
  cityName: string;
  budget: number;
  population: number;
  jobs: number;
  happiness: number;
  lastIncome: number;
  lastExpenses: number;
  day: number;
  speed: GameSpeed;
  purchasedSectorCount: number;
  sectors: Sector[];
  roadTiles: MapTile[];
  zoneTiles: ZonedTile[];
  serviceBuildings: ServiceBuilding[];
}

export interface SectorPurchaseInfo {
  status: SectorStatus;
  price: number;
}

export interface PurchaseResult {
  ok: boolean;
  state: GameState;
  reason?: PurchaseFailureReason;
}

export interface BuildResult {
  ok: boolean;
  state: GameState;
  placedCount: number;
  spent: number;
  reason?: BuildFailureReason;
}

export interface DemolishResult {
  ok: boolean;
  state: GameState;
  removedRoadCount: number;
  removedZoneCount: number;
  removedServiceCount: number;
  reason?: DemolishFailureReason;
}

export interface ServicePlacementResult {
  ok: boolean;
  state: GameState;
  building?: ServiceBuilding;
  reason?: ServicePlacementFailureReason;
}

export interface ZoneDemand {
  residential: number;
  commercial: number;
  industrial: number;
}

const STARTING_SECTOR_IDS = new Set(
  Array.from({ length: 4 }, (_, rowOffset) =>
    Array.from({ length: 4 }, (_, columnOffset) => {
      const column = columnOffset;
      const row = rowOffset + 4;
      return row * MAP_SECTORS_PER_SIDE + column;
    }),
  )
    .flat()
    .filter((id) => id !== 4 * MAP_SECTORS_PER_SIDE + 3),
);

export function createInitialGameState(): GameState {
  return {
    cityName: "Auenfeld",
    budget: STARTING_BUDGET,
    population: 0,
    jobs: 0,
    happiness: 72,
    lastIncome: 0,
    lastExpenses: 0,
    day: 1,
    speed: 1,
    purchasedSectorCount: 0,
    roadTiles: [],
    zoneTiles: [],
    serviceBuildings: [],
    sectors: Array.from({ length: TOTAL_SECTOR_COUNT }, (_, id) => ({
      id,
      column: id % MAP_SECTORS_PER_SIDE,
      row: Math.floor(id / MAP_SECTORS_PER_SIDE),
      owned: STARTING_SECTOR_IDS.has(id),
    })),
  };
}

export function buildTiles(
  state: GameState,
  kind: BuildKind,
  requestedTiles: MapTile[],
): BuildResult {
  const roadKeys = new Set(state.roadTiles.map(tileKey));
  const zoneKeys = new Set(state.zoneTiles.map(tileKey));
  const serviceKeys = getServiceOccupiedKeys(state);
  const requestedKeys = new Set<string>();
  const roadTiles = [...state.roadTiles];
  const zoneTiles = [...state.zoneTiles];
  const cost = getBuildCost(kind);
  let budget = state.budget;
  let placedCount = 0;
  let reason: BuildFailureReason | undefined;

  for (const tile of requestedTiles) {
    const key = tileKey(tile);
    if (requestedKeys.has(key)) continue;
    requestedKeys.add(key);

    if (!isTileOnMap(tile)) {
      reason = "unknown-tile";
      continue;
    }
    if (!isTileOwned(state, tile)) {
      reason = "locked-sector";
      continue;
    }
    if (roadKeys.has(key) || zoneKeys.has(key) || serviceKeys.has(key)) {
      reason = "occupied";
      continue;
    }
    if (kind !== "road" && !hasRoadAccess(tile, roadKeys)) {
      reason = "road-required";
      continue;
    }
    if (budget < cost) {
      reason = "insufficient-budget";
      break;
    }

    if (kind === "road") {
      roadTiles.push(tile);
      roadKeys.add(key);
    } else {
      zoneTiles.push({ ...tile, zone: kind });
      zoneKeys.add(key);
    }
    budget -= cost;
    placedCount += 1;
  }

  if (placedCount === 0) {
    return {
      ok: false,
      state,
      placedCount: 0,
      spent: 0,
      reason: reason ?? "unknown-tile",
    };
  }

  return {
    ok: true,
    state: { ...state, budget, roadTiles, zoneTiles },
    placedCount,
    spent: state.budget - budget,
  };
}

export function placeServiceBuilding(
  state: GameState,
  kind: ServiceBuildingKind,
  anchor: MapTile,
): ServicePlacementResult {
  const definition = SERVICE_BUILDING_DEFINITIONS[kind];
  const footprintTiles = getServiceFootprintTiles(kind, anchor);

  if (!footprintTiles.every(isTileOnMap)) {
    return { ok: false, state, reason: "unknown-tile" };
  }
  if (!footprintTiles.every((tile) => isTileOwned(state, tile))) {
    return { ok: false, state, reason: "locked-sector" };
  }

  const occupiedKeys = new Set([
    ...state.roadTiles.map(tileKey),
    ...state.zoneTiles.map(tileKey),
    ...getServiceOccupiedKeys(state),
  ]);
  if (footprintTiles.some((tile) => occupiedKeys.has(tileKey(tile)))) {
    return { ok: false, state, reason: "occupied" };
  }

  const roadKeys = new Set(state.roadTiles.map(tileKey));
  if (!footprintTiles.some((tile) => hasRoadAccess(tile, roadKeys))) {
    return { ok: false, state, reason: "road-required" };
  }
  if (state.budget < definition.cost) {
    return { ok: false, state, reason: "insufficient-budget" };
  }

  const building: ServiceBuilding = {
    id: Math.max(0, ...state.serviceBuildings.map((candidate) => candidate.id)) + 1,
    kind,
    ...anchor,
  };

  return {
    ok: true,
    building,
    state: {
      ...state,
      budget: state.budget - definition.cost,
      serviceBuildings: [...state.serviceBuildings, building],
    },
  };
}

export function demolishTiles(
  state: GameState,
  requestedTiles: MapTile[],
): DemolishResult {
  const requestedKeys = new Set<string>();
  let hasValidTile = false;

  for (const tile of requestedTiles) {
    if (!isTileOnMap(tile)) continue;
    hasValidTile = true;
    requestedKeys.add(tileKey(tile));
  }

  const roadTiles = state.roadTiles.filter((tile) => !requestedKeys.has(tileKey(tile)));
  const zoneTiles = state.zoneTiles.filter((tile) => !requestedKeys.has(tileKey(tile)));
  const serviceBuildings = state.serviceBuildings.filter(
    (building) =>
      !getServiceFootprintTiles(building.kind, building).some((tile) =>
        requestedKeys.has(tileKey(tile)),
      ),
  );
  const removedRoadCount = state.roadTiles.length - roadTiles.length;
  const removedZoneCount = state.zoneTiles.length - zoneTiles.length;
  const removedServiceCount = state.serviceBuildings.length - serviceBuildings.length;

  if (removedRoadCount === 0 && removedZoneCount === 0 && removedServiceCount === 0) {
    return {
      ok: false,
      state,
      removedRoadCount: 0,
      removedZoneCount: 0,
      removedServiceCount: 0,
      reason: hasValidTile ? "empty-tile" : "unknown-tile",
    };
  }

  return {
    ok: true,
    state: { ...state, roadTiles, zoneTiles, serviceBuildings },
    removedRoadCount,
    removedZoneCount,
    removedServiceCount,
  };
}

export function getSectorPrice(state: GameState): number {
  return BASE_SECTOR_PRICE + state.purchasedSectorCount * SECTOR_PRICE_STEP;
}

export function getSectorLabel(sector: Sector): string {
  return `${String.fromCharCode(65 + sector.column)}${sector.row + 1}`;
}

export function getSectorPurchaseInfo(
  state: GameState,
  sectorId: number,
): SectorPurchaseInfo {
  const sector = state.sectors[sectorId];
  const price = getSectorPrice(state);

  if (!sector) return { status: "locked", price };
  if (sector.owned) return { status: "owned", price: 0 };

  return {
    status: hasOwnedEdgeNeighbour(state, sector) ? "available" : "locked",
    price,
  };
}

export function purchaseSector(state: GameState, sectorId: number): PurchaseResult {
  const sector = state.sectors[sectorId];
  if (!sector) return { ok: false, state, reason: "unknown-sector" };
  if (sector.owned) return { ok: false, state, reason: "already-owned" };

  const purchaseInfo = getSectorPurchaseInfo(state, sectorId);
  if (purchaseInfo.status !== "available") {
    return { ok: false, state, reason: "not-adjacent" };
  }
  if (state.budget < purchaseInfo.price) {
    return { ok: false, state, reason: "insufficient-budget" };
  }

  return {
    ok: true,
    state: {
      ...state,
      budget: state.budget - purchaseInfo.price,
      purchasedSectorCount: state.purchasedSectorCount + 1,
      sectors: state.sectors.map((candidate) =>
        candidate.id === sectorId ? { ...candidate, owned: true } : candidate,
      ),
    },
  };
}

export function advanceSimulation(state: GameState): GameState {
  if (state.speed === 0) return state;

  const nextDay = state.day + state.speed;
  const residentialTiles = countZones(state, "residential");
  const commercialTiles = countZones(state, "commercial");
  const industrialTiles = countZones(state, "industrial");
  const electricityDemand = getElectricityDemand(state);
  const waterDemand = getWaterDemand(state);
  const sewageDemand = getSewageDemand(state);
  const wasteDemand = getWasteDemand(state);
  const hasElectricity = getElectricityCapacity(state) >= electricityDemand;
  const hasWater = getWaterCapacity(state) >= waterDemand;
  const hasSewage = getSewageCapacity(state) >= sewageDemand;
  const hasWasteCapacity = getWasteCapacity(state) >= wasteDemand;
  const hasCoreUtilities = hasElectricity && hasWater && hasSewage;
  const jobs = hasCoreUtilities ? commercialTiles * 4 + industrialTiles * 6 : 0;
  const populationCapacity = residentialTiles * 6;
  const populationTarget = Math.min(
    populationCapacity,
    jobs > 0 ? jobs * 2 : Math.min(populationCapacity, 4),
  );
  const population = hasCoreUtilities
    ? Math.min(populationTarget, state.population + state.speed * 2)
    : state.population;
  const happiness = clamp(
    72 +
      Math.min(commercialTiles, 8) -
      Math.min(Math.floor(industrialTiles / 2), 12) -
      (electricityDemand > 0 && !hasElectricity ? 18 : 0) -
      (waterDemand > 0 && !hasWater ? 20 : 0) -
      (sewageDemand > 0 && !hasSewage ? 22 : 0) -
      (wasteDemand > 0 && !hasWasteCapacity ? 12 : 0),
    35,
    95,
  );
  const previousMonth = Math.floor((state.day - 1) / 30);
  const nextMonth = Math.floor((nextDay - 1) / 30);

  if (nextMonth === previousMonth) {
    return { ...state, day: nextDay, population, jobs, happiness };
  }

  const elapsedMonths = nextMonth - previousMonth;
  const lastIncome =
    population * 12 +
    (hasCoreUtilities ? commercialTiles * 25 + industrialTiles * 35 : 0);
  const serviceUpkeep = state.serviceBuildings.reduce(
    (total, building) => total + SERVICE_BUILDING_DEFINITIONS[building.kind].upkeep,
    0,
  );
  const lastExpenses =
    state.roadTiles.length * 4 + state.zoneTiles.length * 2 + serviceUpkeep;

  return {
    ...state,
    day: nextDay,
    population,
    jobs,
    happiness,
    lastIncome,
    lastExpenses,
    budget: state.budget + (lastIncome - lastExpenses) * elapsedMonths,
  };
}

export function getBuildCost(kind: BuildKind): number {
  const costs: Record<BuildKind, number> = {
    road: ROAD_TILE_COST,
    residential: RESIDENTIAL_ZONE_COST,
    commercial: COMMERCIAL_ZONE_COST,
    industrial: INDUSTRIAL_ZONE_COST,
  };
  return costs[kind];
}

export function countZones(state: GameState, zone: ZoneType): number {
  return state.zoneTiles.filter((tile) => tile.zone === zone).length;
}

export function getElectricityDemand(state: GameState): number {
  const serviceConsumption = state.serviceBuildings.reduce(
    (total, building) =>
      total + SERVICE_BUILDING_DEFINITIONS[building.kind].electricityConsumption,
    0,
  );
  return (
    countZones(state, "residential") +
    countZones(state, "commercial") * 2 +
    countZones(state, "industrial") * 3 +
    serviceConsumption
  );
}

export function getElectricityCapacity(state: GameState): number {
  return state.serviceBuildings.reduce(
    (total, building) =>
      total + SERVICE_BUILDING_DEFINITIONS[building.kind].electricityCapacity,
    0,
  );
}

export function getWaterDemand(state: GameState): number {
  return (
    countZones(state, "residential") * 2 +
    countZones(state, "commercial") +
    countZones(state, "industrial") * 2
  );
}

export function getWaterCapacity(state: GameState): number {
  return state.serviceBuildings.reduce(
    (total, building) =>
      total + SERVICE_BUILDING_DEFINITIONS[building.kind].waterCapacity,
    0,
  );
}

export function getSewageDemand(state: GameState): number {
  return getWaterDemand(state);
}

export function getSewageCapacity(state: GameState): number {
  return state.serviceBuildings.reduce(
    (total, building) =>
      total + SERVICE_BUILDING_DEFINITIONS[building.kind].sewageCapacity,
    0,
  );
}

export function getWasteDemand(state: GameState): number {
  return (
    Math.ceil(state.population / 4) +
    countZones(state, "commercial") * 2 +
    countZones(state, "industrial") * 3
  );
}

export function getWasteCapacity(state: GameState): number {
  return state.serviceBuildings.reduce(
    (total, building) =>
      total + SERVICE_BUILDING_DEFINITIONS[building.kind].wasteCapacity,
    0,
  );
}

export function getUtilityDemand(state: GameState, category: ServiceCategory): number {
  if (category === "electricity") return getElectricityDemand(state);
  if (category === "water") return getWaterDemand(state);
  if (category === "sewage") return getSewageDemand(state);
  return getWasteDemand(state);
}

export function getUtilityCapacity(
  state: GameState,
  category: ServiceCategory,
): number {
  if (category === "electricity") return getElectricityCapacity(state);
  if (category === "water") return getWaterCapacity(state);
  if (category === "sewage") return getSewageCapacity(state);
  return getWasteCapacity(state);
}

export function getZoneDemand(state: GameState): ZoneDemand {
  const commercialTiles = countZones(state, "commercial");
  const industrialTiles = countZones(state, "industrial");
  const potentialJobs = commercialTiles * 4 + industrialTiles * 6;

  return {
    residential: clamp(45 + (potentialJobs - state.population) * 2, 0, 100),
    commercial: clamp(35 + state.population * 2 - commercialTiles * 7, 0, 100),
    industrial: clamp(45 + state.population - industrialTiles * 6, 0, 100),
  };
}

export function getSupplyIssues(state: GameState): ServiceCategory[] {
  const categories: ServiceCategory[] = ["electricity", "water", "sewage", "waste"];
  return categories.filter(
    (category) =>
      getUtilityDemand(state, category) > getUtilityCapacity(state, category),
  );
}

export function getServiceFootprintTiles(
  kind: ServiceBuildingKind,
  anchor: MapTile,
): MapTile[] {
  const footprint = SERVICE_BUILDING_DEFINITIONS[kind].footprint;
  return Array.from({ length: footprint * footprint }, (_, index) => ({
    column: anchor.column + (index % footprint),
    row: anchor.row + Math.floor(index / footprint),
  }));
}

function hasOwnedEdgeNeighbour(state: GameState, sector: Sector): boolean {
  const neighbourCoordinates = [
    [sector.column - 1, sector.row],
    [sector.column + 1, sector.row],
    [sector.column, sector.row - 1],
    [sector.column, sector.row + 1],
  ];

  return neighbourCoordinates.some(([column, row]) => {
    if (
      column < 0 ||
      row < 0 ||
      column >= MAP_SECTORS_PER_SIDE ||
      row >= MAP_SECTORS_PER_SIDE
    ) {
      return false;
    }

    return state.sectors[row * MAP_SECTORS_PER_SIDE + column]?.owned === true;
  });
}

function isTileOnMap(tile: MapTile): boolean {
  return (
    Number.isInteger(tile.column) &&
    Number.isInteger(tile.row) &&
    tile.column >= 0 &&
    tile.row >= 0 &&
    tile.column < MAP_TILES_PER_SIDE &&
    tile.row < MAP_TILES_PER_SIDE
  );
}

function isTileOwned(state: GameState, tile: MapTile): boolean {
  const sectorColumn = Math.floor(tile.column / SECTOR_TILES_PER_SIDE);
  const sectorRow = Math.floor(tile.row / SECTOR_TILES_PER_SIDE);
  return state.sectors[sectorRow * MAP_SECTORS_PER_SIDE + sectorColumn]?.owned === true;
}

function hasRoadAccess(tile: MapTile, roadKeys: Set<string>): boolean {
  for (let columnOffset = -3; columnOffset <= 3; columnOffset += 1) {
    for (let rowOffset = -3; rowOffset <= 3; rowOffset += 1) {
      if (Math.abs(columnOffset) + Math.abs(rowOffset) > 3) continue;
      if (
        roadKeys.has(
          tileKey({
            column: tile.column + columnOffset,
            row: tile.row + rowOffset,
          }),
        )
      ) {
        return true;
      }
    }
  }
  return false;
}

function getServiceOccupiedKeys(state: GameState): Set<string> {
  return new Set(
    state.serviceBuildings.flatMap((building) =>
      getServiceFootprintTiles(building.kind, building).map(tileKey),
    ),
  );
}

function tileKey(tile: MapTile): string {
  return `${tile.column}:${tile.row}`;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
