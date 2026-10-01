export const MAP_SECTORS_PER_SIDE = 8;
export const SECTOR_TILES_PER_SIDE = 16;
export const MAP_TILES_PER_SIDE = MAP_SECTORS_PER_SIDE * SECTOR_TILES_PER_SIDE;
export const STARTING_BUDGET = 75_000;
export const ROAD_TILE_COST = 120;
export const AVENUE_TILE_COST = 260;
export const RESIDENTIAL_ZONE_COST = 35;
export const COMMERCIAL_ZONE_COST = 50;
export const INDUSTRIAL_ZONE_COST = 65;
export const LOAN_AMOUNTS = [10_000, 25_000, 50_000, 100_000] as const;
export const LOAN_TERMS = [12, 24, 48, 72] as const;
export const MAX_ACTIVE_LOANS = 3;

export type ServiceCategory = "electricity" | "water" | "sewage" | "waste";
export type CivicServiceCategory = "fire" | "police" | "health" | "education";
export type ServiceBuildingCategory = ServiceCategory | CivicServiceCategory;
export type ServiceBuildingKind =
  | "wind-turbine"
  | "power-plant"
  | "water-pump"
  | "water-tower"
  | "sewage-plant"
  | "landfill"
  | "recycling-center"
  | "incinerator"
  | "fire-station"
  | "police-station"
  | "clinic"
  | "hospital"
  | "elementary-school"
  | "high-school";

export interface ServiceBuildingDefinition {
  label: string;
  category: ServiceBuildingCategory;
  cost: number;
  upkeep: number;
  electricityCapacity: number;
  waterCapacity: number;
  sewageCapacity: number;
  wasteCapacity: number;
  electricityConsumption: number;
  footprint: number;
  serviceRange?: number;
  serviceCapacity?: number;
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
  "fire-station": {
    label: "Feuerwehrwache",
    category: "fire",
    cost: 14_000,
    upkeep: 220,
    electricityCapacity: 0,
    waterCapacity: 0,
    sewageCapacity: 0,
    wasteCapacity: 0,
    electricityConsumption: 6,
    footprint: 3,
    serviceRange: 28,
    serviceCapacity: 80,
  },
  "police-station": {
    label: "Polizeiwache",
    category: "police",
    cost: 16_000,
    upkeep: 240,
    electricityCapacity: 0,
    waterCapacity: 0,
    sewageCapacity: 0,
    wasteCapacity: 0,
    electricityConsumption: 7,
    footprint: 3,
    serviceRange: 30,
    serviceCapacity: 100,
  },
  clinic: {
    label: "Klinik",
    category: "health",
    cost: 12_000,
    upkeep: 180,
    electricityCapacity: 0,
    waterCapacity: 0,
    sewageCapacity: 0,
    wasteCapacity: 0,
    electricityConsumption: 5,
    footprint: 3,
    serviceRange: 22,
    serviceCapacity: 70,
  },
  hospital: {
    label: "Krankenhaus",
    category: "health",
    cost: 30_000,
    upkeep: 500,
    electricityCapacity: 0,
    waterCapacity: 0,
    sewageCapacity: 0,
    wasteCapacity: 0,
    electricityConsumption: 12,
    footprint: 4,
    serviceRange: 36,
    serviceCapacity: 200,
  },
  "elementary-school": {
    label: "Primarschule",
    category: "education",
    cost: 11_000,
    upkeep: 160,
    electricityCapacity: 0,
    waterCapacity: 0,
    sewageCapacity: 0,
    wasteCapacity: 0,
    electricityConsumption: 4,
    footprint: 3,
    serviceRange: 22,
    serviceCapacity: 100,
  },
  "high-school": {
    label: "Sekundarschule",
    category: "education",
    cost: 22_000,
    upkeep: 340,
    electricityCapacity: 0,
    waterCapacity: 0,
    sewageCapacity: 0,
    wasteCapacity: 0,
    electricityConsumption: 8,
    footprint: 4,
    serviceRange: 32,
    serviceCapacity: 180,
  },
};

export type GameSpeed = 0 | 1 | 2 | 3;
export type LoanAmount = (typeof LOAN_AMOUNTS)[number];
export type LoanTerm = (typeof LOAN_TERMS)[number];
export type LoanFailureReason = "invalid-offer" | "loan-limit";
export type ZoneType = "residential" | "commercial" | "industrial";
export type BuildKind = "road" | "avenue" | ZoneType;
export type CardinalAxis = "horizontal" | "vertical";
export type BuildFailureReason =
  | "unknown-tile"
  | "occupied"
  | "road-required"
  | "invalid-avenue"
  | "insufficient-budget";
export type DemolishFailureReason = "unknown-tile" | "empty-tile" | "protected-road";
export type ServicePlacementFailureReason =
  "unknown-tile" | "occupied" | "road-required" | "insufficient-budget";

export interface MapTile {
  column: number;
  row: number;
}

export const REGIONAL_ROAD_TILES: readonly MapTile[] = Object.freeze(
  Array.from({ length: 8 }, (_, column) => Object.freeze({ column, row: 88 })),
);
export const REGIONAL_ROAD_ENTRY_TILE: MapTile = REGIONAL_ROAD_TILES[0]!;
export const REGIONAL_ROAD_CONNECTION_TILE: MapTile =
  REGIONAL_ROAD_TILES[REGIONAL_ROAD_TILES.length - 1]!;

export interface ZonedTile extends MapTile {
  zone: ZoneType;
}

export interface ServiceBuilding extends MapTile {
  id: number;
  kind: ServiceBuildingKind;
}

export interface CityLoan {
  id: number;
  originalPrincipal: number;
  remainingBalance: number;
  annualRate: number;
  monthlyPayment: number;
  originalTermMonths: LoanTerm;
  remainingMonths: number;
  startedDay: number;
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
  roadTiles: MapTile[];
  avenueTiles: MapTile[];
  zoneTiles: ZonedTile[];
  serviceBuildings: ServiceBuilding[];
  loans: CityLoan[];
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

export interface LoanResult {
  ok: boolean;
  state: GameState;
  loan?: CityLoan;
  reason?: LoanFailureReason;
}

export interface DebtSummary {
  activeLoanCount: number;
  totalRemainingBalance: number;
  monthlyPayment: number;
}

export interface ZoneDemand {
  residential: number;
  commercial: number;
  industrial: number;
}

export interface OutsideConnectionSummary {
  connected: boolean;
  connectedRoadCount: number;
  connectedZoneCount: number;
  residential: number;
  commercial: number;
  industrial: number;
}

export type ZoneClass = "basic" | "middle" | "premium";

export interface ClassDemand {
  basic: number;
  middle: number;
  premium: number;
}

export interface CivicCoverageSummary {
  category: CivicServiceCategory;
  buildingCount: number;
  capacity: number;
  demand: number;
  coveragePercent: number;
  coveredZoneCount: number;
  relevantZoneCount: number;
  averageResponseMinutes: number | null;
  coveredZoneKeys: string[];
}

export interface UtilityCoverageSummary {
  category: ServiceCategory;
  networkCount: number;
  suppliedZoneCount: number;
  relevantZoneCount: number;
  coveragePercent: number;
  suppliedZoneKeys: string[];
}

export interface ZoneDevelopment {
  tile: ZonedTile;
  level: number;
  maxLevel: number;
  landValue: number;
  classification: ZoneClass;
  demand: number;
  fireRisk: number;
}

export interface ZoneDevelopmentSummary {
  zone: ZoneType;
  averageLevel: number;
  averageLandValue: number;
  levels: number[];
  classes: Record<ZoneClass, number>;
}

const utilityCoverageCache = new WeakMap<
  GameState,
  Map<ServiceCategory, UtilityCoverageSummary>
>();
const zoneDevelopmentCache = new WeakMap<GameState, ZoneDevelopment[]>();

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
    roadTiles: [],
    avenueTiles: [],
    zoneTiles: [],
    serviceBuildings: [],
    loans: [],
  };
}

export function getDominantCardinalAxis(
  start: MapTile,
  current: MapTile,
): CardinalAxis {
  return Math.abs(current.column - start.column) >= Math.abs(current.row - start.row)
    ? "horizontal"
    : "vertical";
}

export function getStraightLineTiles(
  start: MapTile,
  current: MapTile,
  axis: CardinalAxis,
): MapTile[] {
  const target =
    axis === "horizontal"
      ? { column: current.column, row: start.row }
      : { column: start.column, row: current.row };
  const startValue = axis === "horizontal" ? start.column : start.row;
  const targetValue = axis === "horizontal" ? target.column : target.row;
  const minimum = Math.min(startValue, targetValue);
  const maximum = Math.max(startValue, targetValue);

  return Array.from({ length: maximum - minimum + 1 }, (_, offset) =>
    axis === "horizontal"
      ? { column: minimum + offset, row: start.row }
      : { column: start.column, row: minimum + offset },
  );
}

export function getLoanAnnualRate(amount: LoanAmount, term: LoanTerm): number {
  const amountPremium: Record<LoanAmount, number> = {
    10_000: 0,
    25_000: 0.4,
    50_000: 0.9,
    100_000: 1.6,
  };
  const termPremium: Record<LoanTerm, number> = {
    12: 0,
    24: 0.5,
    48: 1.2,
    72: 2,
  };
  return roundToOne(3.5 + amountPremium[amount] + termPremium[term]);
}

export function getLoanMonthlyPayment(amount: LoanAmount, term: LoanTerm): number {
  const monthlyRate = getLoanAnnualRate(amount, term) / 100 / 12;
  const payment =
    monthlyRate === 0
      ? amount / term
      : (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term));
  return Math.ceil(payment);
}

export function takeLoan(
  state: GameState,
  amount: LoanAmount,
  term: LoanTerm,
): LoanResult {
  if (!LOAN_AMOUNTS.includes(amount) || !LOAN_TERMS.includes(term)) {
    return { ok: false, state, reason: "invalid-offer" };
  }
  const loans = state.loans ?? [];
  if (loans.length >= MAX_ACTIVE_LOANS) {
    return { ok: false, state, reason: "loan-limit" };
  }

  const loan: CityLoan = {
    id: Math.max(0, ...loans.map((candidate) => candidate.id)) + 1,
    originalPrincipal: amount,
    remainingBalance: amount,
    annualRate: getLoanAnnualRate(amount, term),
    monthlyPayment: getLoanMonthlyPayment(amount, term),
    originalTermMonths: term,
    remainingMonths: term,
    startedDay: state.day,
  };
  return {
    ok: true,
    loan,
    state: {
      ...state,
      budget: state.budget + amount,
      loans: [...loans, loan],
    },
  };
}

export function getDebtSummary(state: GameState): DebtSummary {
  const loans = state.loans ?? [];
  return {
    activeLoanCount: loans.length,
    totalRemainingBalance: roundMoney(
      loans.reduce((total, loan) => total + loan.remainingBalance, 0),
    ),
    monthlyPayment: roundMoney(
      loans.reduce((total, loan) => total + loan.monthlyPayment, 0),
    ),
  };
}

export function buildTiles(
  state: GameState,
  kind: BuildKind,
  requestedTiles: MapTile[],
): BuildResult {
  const roadKeys = new Set(state.roadTiles.map(tileKey));
  const regionalRoadKeys = new Set(REGIONAL_ROAD_TILES.map(tileKey));
  const zoneKeys = new Set(state.zoneTiles.map(tileKey));
  const serviceKeys = getServiceOccupiedKeys(state);
  const requestedKeys = new Set<string>();
  const roadTiles = [...state.roadTiles];
  const avenueTiles = [...(state.avenueTiles ?? [])];
  const zoneTiles = [...state.zoneTiles];
  const cost = getBuildCost(kind);
  let budget = state.budget;
  let placedCount = 0;
  let reason: BuildFailureReason | undefined;

  if (kind === "avenue") {
    const uniqueTiles = requestedTiles.filter((tile) => {
      const key = tileKey(tile);
      if (requestedKeys.has(key)) return false;
      requestedKeys.add(key);
      return true;
    });
    if (
      uniqueTiles.length !== 2 ||
      manhattanDistance(uniqueTiles[0], uniqueTiles[1]) !== 1
    ) {
      return {
        ok: false,
        state,
        placedCount: 0,
        spent: 0,
        reason: "invalid-avenue",
      };
    }

    for (const tile of uniqueTiles) {
      const key = tileKey(tile);
      if (!isTileOnMap(tile)) reason = "unknown-tile";
      else if (
        roadKeys.has(key) ||
        regionalRoadKeys.has(key) ||
        zoneKeys.has(key) ||
        serviceKeys.has(key)
      ) {
        reason = "occupied";
      }
      if (reason) {
        return { ok: false, state, placedCount: 0, spent: 0, reason };
      }
    }

    const totalCost = cost * uniqueTiles.length;
    if (budget < totalCost) {
      return {
        ok: false,
        state,
        placedCount: 0,
        spent: 0,
        reason: "insufficient-budget",
      };
    }
    return {
      ok: true,
      state: {
        ...state,
        budget: budget - totalCost,
        roadTiles: [...roadTiles, ...uniqueTiles],
        avenueTiles: [...avenueTiles, ...uniqueTiles],
      },
      placedCount: uniqueTiles.length,
      spent: totalCost,
    };
  }

  for (const tile of requestedTiles) {
    const key = tileKey(tile);
    if (requestedKeys.has(key)) continue;
    requestedKeys.add(key);

    if (!isTileOnMap(tile)) {
      reason = "unknown-tile";
      continue;
    }
    if (
      roadKeys.has(key) ||
      regionalRoadKeys.has(key) ||
      zoneKeys.has(key) ||
      serviceKeys.has(key)
    ) {
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
    state: { ...state, budget, roadTiles, avenueTiles, zoneTiles },
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
  const occupiedKeys = new Set([
    ...state.roadTiles.map(tileKey),
    ...REGIONAL_ROAD_TILES.map(tileKey),
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
  let includesProtectedRoad = false;

  for (const tile of requestedTiles) {
    if (!isTileOnMap(tile)) continue;
    hasValidTile = true;
    requestedKeys.add(tileKey(tile));
    if (isRegionalRoadTile(tile)) includesProtectedRoad = true;
  }

  const roadTiles = state.roadTiles.filter((tile) => !requestedKeys.has(tileKey(tile)));
  const avenueTiles = (state.avenueTiles ?? []).filter(
    (tile) => !requestedKeys.has(tileKey(tile)),
  );
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
      reason: includesProtectedRoad
        ? "protected-road"
        : hasValidTile
          ? "empty-tile"
          : "unknown-tile",
    };
  }

  return {
    ok: true,
    state: { ...state, roadTiles, avenueTiles, zoneTiles, serviceBuildings },
    removedRoadCount,
    removedZoneCount,
    removedServiceCount,
  };
}

export function isRegionalRoadTile(tile: MapTile): boolean {
  return REGIONAL_ROAD_TILES.some(
    (regionalTile) => tileKey(regionalTile) === tileKey(tile),
  );
}

export function getOutsideConnectedRoadTiles(state: GameState): MapTile[] {
  return traceOutsideRoadNetwork(state).tiles;
}

export function hasOutsideRoadConnection(state: GameState): boolean {
  return getOutsideConnectedRoadTiles(state).length > 0;
}

export function isZoneConnectedToOutside(state: GameState, tile: MapTile): boolean {
  const connectedRoadKeys = new Set(getOutsideConnectedRoadTiles(state).map(tileKey));
  return hasRoadAccess(tile, connectedRoadKeys);
}

export function getOutsideConnectionSummary(
  state: GameState,
): OutsideConnectionSummary {
  const connectedRoads = getOutsideConnectedRoadTiles(state);
  const connectedRoadKeys = new Set(connectedRoads.map(tileKey));
  const connectedZones = state.zoneTiles.filter((tile) =>
    hasRoadAccess(tile, connectedRoadKeys),
  );

  return {
    connected: connectedRoads.length > 0,
    connectedRoadCount: connectedRoads.length,
    connectedZoneCount: connectedZones.length,
    residential: connectedZones.filter((tile) => tile.zone === "residential").length,
    commercial: connectedZones.filter((tile) => tile.zone === "commercial").length,
    industrial: connectedZones.filter((tile) => tile.zone === "industrial").length,
  };
}

export function getOutsideRoadRoute(state: GameState, zone?: ZoneType): MapTile[] {
  const network = traceOutsideRoadNetwork(state);
  if (network.tiles.length === 0) return [];

  const relevantZones = zone
    ? state.zoneTiles.filter((tile) => tile.zone === zone)
    : state.zoneTiles;
  const zoneRoadKeys = new Set(
    network.tiles
      .filter((road) =>
        relevantZones.some(
          (tile) =>
            Math.abs(road.column - tile.column) + Math.abs(road.row - tile.row) <= 3,
        ),
      )
      .map(tileKey),
  );
  const candidates =
    zoneRoadKeys.size > 0
      ? network.tiles.filter((tile) => zoneRoadKeys.has(tileKey(tile)))
      : network.tiles;
  const target = candidates.reduce((farthest, tile) =>
    (network.distance.get(tileKey(tile)) ?? 0) >
    (network.distance.get(tileKey(farthest)) ?? 0)
      ? tile
      : farthest,
  );
  const route: MapTile[] = [];
  let currentKey: string | null = tileKey(target);

  while (currentKey) {
    const tile = network.roadByKey.get(currentKey);
    if (!tile) break;
    route.push(tile);
    currentKey = network.parent.get(currentKey) ?? null;
  }

  return route.reverse();
}

export function getCivicCoverage(
  state: GameState,
  category: CivicServiceCategory,
): CivicCoverageSummary {
  const buildings = state.serviceBuildings.filter(
    (building) => SERVICE_BUILDING_DEFINITIONS[building.kind].category === category,
  );
  const coveredDistances = new Map<string, number>();

  for (const building of buildings) {
    const roadNetwork = traceServiceRoadNetwork(state, building);
    for (const zone of state.zoneTiles) {
      let shortestDistance = Number.POSITIVE_INFINITY;
      for (const road of roadNetwork.tiles) {
        const approachDistance = manhattanDistance(zone, road);
        if (approachDistance > 3) continue;
        shortestDistance = Math.min(
          shortestDistance,
          (roadNetwork.distance.get(tileKey(road)) ?? 0) + approachDistance,
        );
      }
      if (!Number.isFinite(shortestDistance)) continue;
      const key = tileKey(zone);
      coveredDistances.set(
        key,
        Math.min(
          coveredDistances.get(key) ?? Number.POSITIVE_INFINITY,
          shortestDistance,
        ),
      );
    }
  }

  const relevantZones = getRelevantServiceZones(state, category);
  const coveredRelevantZones = relevantZones.filter((zone) =>
    coveredDistances.has(tileKey(zone)),
  );
  const capacity = buildings.reduce(
    (total, building) =>
      total + (SERVICE_BUILDING_DEFINITIONS[building.kind].serviceCapacity ?? 0),
    0,
  );
  const demand = getCivicServiceDemand(state, category);
  const spatialCoverage =
    relevantZones.length === 0
      ? buildings.length > 0
        ? 100
        : 0
      : (coveredRelevantZones.length / relevantZones.length) * 100;
  const capacityCoverage =
    demand === 0 ? (buildings.length > 0 ? 100 : 0) : (capacity / demand) * 100;
  const responseDistances = coveredRelevantZones
    .map((zone) => coveredDistances.get(tileKey(zone)))
    .filter((distance): distance is number => distance !== undefined);
  const averageDistance =
    responseDistances.length === 0
      ? null
      : responseDistances.reduce((total, distance) => total + distance, 0) /
        responseDistances.length;

  return {
    category,
    buildingCount: buildings.length,
    capacity,
    demand,
    coveragePercent: Math.round(
      clamp(Math.min(spatialCoverage, capacityCoverage), 0, 100),
    ),
    coveredZoneCount: coveredRelevantZones.length,
    relevantZoneCount: relevantZones.length,
    averageResponseMinutes:
      averageDistance === null ? null : Math.round(4 + averageDistance * 0.7),
    coveredZoneKeys: [...coveredDistances.keys()],
  };
}

export function isZoneCoveredByCivicService(
  state: GameState,
  tile: MapTile,
  category: CivicServiceCategory,
): boolean {
  return getCivicCoverage(state, category).coveredZoneKeys.includes(tileKey(tile));
}

export function getCivicServiceDemand(
  state: GameState,
  category: CivicServiceCategory,
): number {
  const residential = countZones(state, "residential");
  const commercial = countZones(state, "commercial");
  const industrial = countZones(state, "industrial");
  if (category === "fire") return residential * 2 + commercial * 3 + industrial * 4;
  if (category === "police") {
    return residential + commercial * 3 + Math.ceil(state.population / 2);
  }
  if (category === "health") {
    return residential * 2 + industrial + Math.ceil(state.population / 2);
  }
  return residential * 5;
}

export function getClassDemand(state: GameState, zone: ZoneType): ClassDemand {
  const baseDemand = getZoneDemand(state)[zone];
  const fire = getCivicCoverage(state, "fire").coveragePercent;
  const police = getCivicCoverage(state, "police").coveragePercent;
  const health = getCivicCoverage(state, "health").coveragePercent;
  const education = getCivicCoverage(state, "education").coveragePercent;

  if (zone === "residential") {
    return {
      basic: Math.round(clamp(baseDemand + 25 - education * 0.2, 0, 100)),
      middle: Math.round(
        clamp(baseDemand - 10 + (fire + police + health + education) * 0.09, 0, 100),
      ),
      premium: Math.round(
        clamp(
          baseDemand - 38 + police * 0.22 + health * 0.18 + education * 0.28,
          0,
          100,
        ),
      ),
    };
  }
  if (zone === "commercial") {
    return {
      basic: Math.round(clamp(baseDemand + 20 - education * 0.12, 0, 100)),
      middle: Math.round(
        clamp(baseDemand - 8 + police * 0.18 + education * 0.12, 0, 100),
      ),
      premium: Math.round(
        clamp(baseDemand - 35 + police * 0.25 + education * 0.25, 0, 100),
      ),
    };
  }
  return {
    basic: Math.round(clamp(baseDemand + 18 - education * 0.12, 0, 100)),
    middle: Math.round(clamp(baseDemand - 10 + education * 0.3 + fire * 0.08, 0, 100)),
    premium: Math.round(
      clamp(baseDemand - 42 + education * 0.48 + fire * 0.12, 0, 100),
    ),
  };
}

export function getZoneDevelopments(state: GameState): ZoneDevelopment[] {
  const cached = zoneDevelopmentCache.get(state);
  if (cached) return cached;
  const outsideRoadKeys = new Set(getOutsideConnectedRoadTiles(state).map(tileKey));
  const fireCoverage = getCivicCoverage(state, "fire");
  const policeCoverage = getCivicCoverage(state, "police");
  const healthCoverage = getCivicCoverage(state, "health");
  const educationCoverage = getCivicCoverage(state, "education");
  const civicCoverage = {
    fire: new Set(fireCoverage.coveredZoneKeys),
    police: new Set(policeCoverage.coveredZoneKeys),
    health: new Set(healthCoverage.coveredZoneKeys),
    education: new Set(educationCoverage.coveredZoneKeys),
  };
  const zoneDemand = getZoneDemand(state);
  const classDemands = {
    residential: getClassDemand(state, "residential"),
    commercial: getClassDemand(state, "commercial"),
    industrial: getClassDemand(state, "industrial"),
  };
  const utilityCoverage = {
    electricity: new Set(getUtilityCoverage(state, "electricity").suppliedZoneKeys),
    water: new Set(getUtilityCoverage(state, "water").suppliedZoneKeys),
    sewage: new Set(getUtilityCoverage(state, "sewage").suppliedZoneKeys),
  };
  const hasWasteCapacity = getWasteCapacity(state) >= getWasteDemand(state);

  const developments = state.zoneTiles.map((tile) => {
    const key = tileKey(tile);
    const utilityScore =
      (utilityCoverage.electricity.has(key) ? 4 : 0) +
      (utilityCoverage.water.has(key) ? 4 : 0) +
      (utilityCoverage.sewage.has(key) ? 4 : 0) +
      (hasWasteCapacity ? 4 : 0);
    const connectedToOutside = hasRoadAccess(tile, outsideRoadKeys);
    const industrialNeighbours = state.zoneTiles.filter(
      (candidate) =>
        candidate.zone === "industrial" && manhattanDistance(candidate, tile) <= 6,
    ).length;
    const pollutionPenalty =
      tile.zone === "industrial" ? 0 : Math.min(industrialNeighbours * 3, 18);
    const serviceScore =
      (civicCoverage.fire.has(key) ? 7 : 0) +
      (civicCoverage.police.has(key) ? 9 : 0) +
      (civicCoverage.health.has(key) ? 8 : 0) +
      (civicCoverage.education.has(key) ? 11 : 0);
    const demand = zoneDemand[tile.zone];
    const landValue = Math.round(
      clamp(
        24 +
          utilityScore +
          (connectedToOutside ? 10 : 0) +
          serviceScore +
          (tile.zone === "industrial" ? educationCoverage.coveragePercent * 0.1 : 0) +
          (demand - 50) * 0.16 -
          pollutionPenalty,
        0,
        100,
      ),
    );
    const maxLevel = tile.zone === "industrial" ? 3 : 5;
    const thresholds = tile.zone === "industrial" ? [52, 76] : [42, 57, 72, 87];
    const valueLevel =
      1 + thresholds.filter((threshold) => landValue >= threshold).length;
    const timeLevel = Math.min(maxLevel, 1 + Math.floor((state.day - 1) / 30));
    const demandLevel = demand >= 70 ? maxLevel : demand >= 45 ? maxLevel - 1 : 1;
    const level = clamp(Math.min(valueLevel, timeLevel, demandLevel), 1, maxLevel);
    const desiredClass: ZoneClass =
      landValue >= 74 ? "premium" : landValue >= 48 ? "middle" : "basic";
    const classification =
      classDemands[tile.zone][desiredClass] >= 35
        ? desiredClass
        : desiredClass === "premium" && classDemands[tile.zone].middle >= 35
          ? "middle"
          : "basic";
    const baseFireRisk =
      tile.zone === "industrial" ? 42 : tile.zone === "commercial" ? 28 : 18;
    const fireRisk = Math.round(
      clamp(baseFireRisk + level * 4 - (civicCoverage.fire.has(key) ? 28 : 0), 2, 100),
    );

    return {
      tile,
      level,
      maxLevel,
      landValue,
      classification,
      demand,
      fireRisk,
    };
  });
  zoneDevelopmentCache.set(state, developments);
  return developments;
}

export function getZoneDevelopment(state: GameState, tile: ZonedTile): ZoneDevelopment {
  return (
    getZoneDevelopments(state).find(
      (development) => tileKey(development.tile) === tileKey(tile),
    ) ?? {
      tile,
      level: 1,
      maxLevel: tile.zone === "industrial" ? 3 : 5,
      landValue: 0,
      classification: "basic",
      demand: 0,
      fireRisk: 100,
    }
  );
}

export function getZoneDevelopmentSummary(
  state: GameState,
  zone: ZoneType,
): ZoneDevelopmentSummary {
  const developments = getZoneDevelopments(state).filter(
    (development) => development.tile.zone === zone,
  );
  const classes: Record<ZoneClass, number> = { basic: 0, middle: 0, premium: 0 };
  for (const development of developments) classes[development.classification] += 1;

  return {
    zone,
    averageLevel:
      developments.length === 0
        ? 0
        : roundToOne(
            developments.reduce((total, development) => total + development.level, 0) /
              developments.length,
          ),
    averageLandValue:
      developments.length === 0
        ? 0
        : Math.round(
            developments.reduce(
              (total, development) => total + development.landValue,
              0,
            ) / developments.length,
          ),
    levels: Array.from(
      { length: zone === "industrial" ? 3 : 5 },
      (_, index) =>
        developments.filter((development) => development.level === index + 1).length,
    ),
    classes,
  };
}

export function getZoneClassLabel(zone: ZoneType, classification: ZoneClass): string {
  if (zone === "industrial") {
    if (classification === "premium") return "Modern";
    if (classification === "middle") return "Weiterentwickelt";
    return "Konventionell";
  }
  if (zone === "commercial") {
    if (classification === "premium") return "Hochwertig";
    if (classification === "middle") return "Mittel";
    return "Einfach";
  }
  if (classification === "premium") return "Wohlhabend";
  if (classification === "middle") return "Mittelstand";
  return "Einkommensschwach";
}

export function advanceSimulation(state: GameState): GameState {
  if (state.speed === 0) return state;

  const nextDay = state.day + state.speed;
  const residentialTiles = countZones(state, "residential");
  const commercialTiles = countZones(state, "commercial");
  const industrialTiles = countZones(state, "industrial");
  const outsideConnection = getOutsideConnectionSummary(state);
  const outsideRoadKeys = new Set(getOutsideConnectedRoadTiles(state).map(tileKey));
  const developments = getZoneDevelopments(state);
  const connectedDevelopments = developments.filter((development) =>
    hasRoadAccess(development.tile, outsideRoadKeys),
  );
  const electricityCoverage = getUtilityCoverage(state, "electricity");
  const waterCoverage = getUtilityCoverage(state, "water");
  const sewageCoverage = getUtilityCoverage(state, "sewage");
  const electricityZoneKeys = new Set(electricityCoverage.suppliedZoneKeys);
  const waterZoneKeys = new Set(waterCoverage.suppliedZoneKeys);
  const sewageZoneKeys = new Set(sewageCoverage.suppliedZoneKeys);
  const suppliedDevelopments = connectedDevelopments.filter((development) => {
    const key = tileKey(development.tile);
    return (
      electricityZoneKeys.has(key) && waterZoneKeys.has(key) && sewageZoneKeys.has(key)
    );
  });
  const electricityDemand = getElectricityDemand(state);
  const waterDemand = getWaterDemand(state);
  const sewageDemand = getSewageDemand(state);
  const wasteDemand = getWasteDemand(state);
  const hasWasteCapacity = getWasteCapacity(state) >= wasteDemand;
  const electricityPenalty =
    electricityDemand > 0
      ? Math.round((100 - electricityCoverage.coveragePercent) * 0.18)
      : 0;
  const waterPenalty =
    waterDemand > 0 ? Math.round((100 - waterCoverage.coveragePercent) * 0.2) : 0;
  const sewagePenalty =
    sewageDemand > 0 ? Math.round((100 - sewageCoverage.coveragePercent) * 0.22) : 0;
  const jobs = suppliedDevelopments.reduce(
    (total, development) =>
      total +
      (development.tile.zone === "commercial"
        ? development.level * 4
        : development.tile.zone === "industrial"
          ? development.level * 6
          : 0),
    0,
  );
  const populationCapacity = suppliedDevelopments.reduce(
    (total, development) =>
      total + (development.tile.zone === "residential" ? development.level * 6 : 0),
    0,
  );
  const populationTarget = Math.min(
    populationCapacity,
    jobs > 0 ? jobs * 2 : Math.min(populationCapacity, 4),
  );
  const population = Math.min(populationTarget, state.population + state.speed * 2);
  const civicCoverageAverage =
    (["fire", "police", "health", "education"] as const).reduce(
      (total, category) => total + getCivicCoverage(state, category).coveragePercent,
      0,
    ) / 4;
  const happiness = Math.round(
    clamp(
      72 +
        Math.min(commercialTiles, 8) -
        Math.min(Math.floor(industrialTiles / 2), 12) -
        electricityPenalty -
        waterPenalty -
        sewagePenalty -
        (wasteDemand > 0 && !hasWasteCapacity ? 12 : 0) -
        Math.min(
          (residentialTiles +
            commercialTiles +
            industrialTiles -
            outsideConnection.connectedZoneCount) *
            2,
          18,
        ) +
        (state.zoneTiles.length > 0 ? civicCoverageAverage * 0.12 - 8 : 0),
      35,
      95,
    ),
  );
  const previousMonth = Math.floor((state.day - 1) / 30);
  const nextMonth = Math.floor((nextDay - 1) / 30);

  if (nextMonth === previousMonth) {
    return { ...state, day: nextDay, population, jobs, happiness };
  }

  const elapsedMonths = nextMonth - previousMonth;
  const commercialIncome = suppliedDevelopments
    .filter((development) => development.tile.zone === "commercial")
    .reduce((total, development) => total + development.level * 25, 0);
  const industrialIncome = suppliedDevelopments
    .filter((development) => development.tile.zone === "industrial")
    .reduce((total, development) => total + development.level * 35, 0);
  const lastIncome = population * 12 + commercialIncome + industrialIncome;
  const serviceUpkeep = state.serviceBuildings.reduce(
    (total, building) => total + SERVICE_BUILDING_DEFINITIONS[building.kind].upkeep,
    0,
  );
  const baseExpenses =
    state.roadTiles.length * 4 +
    (state.avenueTiles ?? []).length * 6 +
    state.zoneTiles.length * 2 +
    serviceUpkeep;
  const loanAdvance = advanceLoanPayments(state.loans ?? [], elapsedMonths);
  const monthlyLoanPayment = loanAdvance.totalPaid / elapsedMonths;
  const lastExpenses = roundMoney(baseExpenses + monthlyLoanPayment);

  return {
    ...state,
    day: nextDay,
    population,
    jobs,
    happiness,
    lastIncome,
    lastExpenses,
    loans: loanAdvance.loans,
    budget: roundMoney(
      state.budget +
        (lastIncome - baseExpenses) * elapsedMonths -
        loanAdvance.totalPaid,
    ),
  };
}

export function getBuildCost(kind: BuildKind): number {
  const costs: Record<BuildKind, number> = {
    road: ROAD_TILE_COST,
    avenue: AVENUE_TILE_COST,
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

export function getUtilityCoverage(
  state: GameState,
  category: ServiceCategory,
): UtilityCoverageSummary {
  const cached = utilityCoverageCache.get(state)?.get(category);
  if (cached) return cached;

  if (category === "waste") {
    const supplied = getWasteCapacity(state) >= getWasteDemand(state);
    return cacheUtilityCoverage(state, {
      category,
      networkCount: state.serviceBuildings.filter(
        (building) => SERVICE_BUILDING_DEFINITIONS[building.kind].category === category,
      ).length,
      suppliedZoneCount: supplied ? state.zoneTiles.length : 0,
      relevantZoneCount: state.zoneTiles.length,
      coveragePercent:
        state.zoneTiles.length === 0 ? (supplied ? 100 : 0) : supplied ? 100 : 0,
      suppliedZoneKeys: supplied ? state.zoneTiles.map(tileKey) : [],
    });
  }

  const suppliedZoneKeys = new Set<string>();
  const roadComponents = getRoadComponents(state);
  let networkCount = 0;

  for (const component of roadComponents) {
    const componentKeys = new Set(component.map(tileKey));
    const sources = state.serviceBuildings.filter((building) => {
      const definition = SERVICE_BUILDING_DEFINITIONS[building.kind];
      return (
        definition.category === category &&
        getServiceFootprintTiles(building.kind, building).some((tile) =>
          hasRoadAccess(tile, componentKeys),
        )
      );
    });
    if (sources.length === 0) continue;
    networkCount += 1;

    const connectedZones = state.zoneTiles.filter((zone) =>
      hasRoadAccess(zone, componentKeys),
    );
    const capacity = sources.reduce(
      (total, building) =>
        total +
        getDefinitionCapacity(SERVICE_BUILDING_DEFINITIONS[building.kind], category),
      0,
    );
    const buildingDemand =
      category === "electricity"
        ? state.serviceBuildings
            .filter((building) =>
              getServiceFootprintTiles(building.kind, building).some((tile) =>
                hasRoadAccess(tile, componentKeys),
              ),
            )
            .reduce(
              (total, building) =>
                total +
                SERVICE_BUILDING_DEFINITIONS[building.kind].electricityConsumption,
              0,
            )
        : 0;
    let availableCapacity = Math.max(0, capacity - buildingDemand);
    for (const zone of connectedZones) {
      const demand = getZoneUtilityDemand(zone.zone, category);
      if (availableCapacity < demand) continue;
      suppliedZoneKeys.add(tileKey(zone));
      availableCapacity -= demand;
    }
  }

  const relevantZoneCount = state.zoneTiles.length;
  const suppliedZoneCount = suppliedZoneKeys.size;
  return cacheUtilityCoverage(state, {
    category,
    networkCount,
    suppliedZoneCount,
    relevantZoneCount,
    coveragePercent:
      relevantZoneCount === 0
        ? networkCount > 0
          ? 100
          : 0
        : Math.round((suppliedZoneCount / relevantZoneCount) * 100),
    suppliedZoneKeys: [...suppliedZoneKeys],
  });
}

export function isZoneSuppliedByUtility(
  state: GameState,
  tile: MapTile,
  category: ServiceCategory,
): boolean {
  return getUtilityCoverage(state, category).suppliedZoneKeys.includes(tileKey(tile));
}

export function getZoneDemand(state: GameState): ZoneDemand {
  const commercialTiles = countZones(state, "commercial");
  const industrialTiles = countZones(state, "industrial");
  const outsideConnection = getOutsideConnectionSummary(state);
  const potentialJobs =
    outsideConnection.commercial * 4 + outsideConnection.industrial * 6;
  const connectionModifier = outsideConnection.connected ? 0 : -30;

  return {
    residential: clamp(
      45 + connectionModifier + (potentialJobs - state.population) * 2,
      0,
      100,
    ),
    commercial: clamp(35 + state.population * 2 - commercialTiles * 7, 0, 100),
    industrial: clamp(
      45 + connectionModifier + state.population - industrialTiles * 6,
      0,
      100,
    ),
  };
}

export function getSupplyIssues(state: GameState): ServiceCategory[] {
  const categories: ServiceCategory[] = ["electricity", "water", "sewage", "waste"];
  return categories.filter((category) => {
    if (getUtilityDemand(state, category) > getUtilityCapacity(state, category)) {
      return true;
    }
    if (category === "waste") return false;
    const coverage = getUtilityCoverage(state, category);
    return coverage.suppliedZoneCount < coverage.relevantZoneCount;
  });
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

function getDefinitionCapacity(
  definition: ServiceBuildingDefinition,
  category: Exclude<ServiceCategory, "waste">,
): number {
  if (category === "electricity") return definition.electricityCapacity;
  if (category === "water") return definition.waterCapacity;
  return definition.sewageCapacity;
}

function getZoneUtilityDemand(
  zone: ZoneType,
  category: Exclude<ServiceCategory, "waste">,
): number {
  if (category === "electricity") {
    if (zone === "residential") return 1;
    if (zone === "commercial") return 2;
    return 3;
  }
  if (zone === "commercial") return 1;
  return 2;
}

function getRoadComponents(state: GameState): MapTile[][] {
  const roadByKey = new Map(state.roadTiles.map((tile) => [tileKey(tile), tile]));
  const visited = new Set<string>();
  const components: MapTile[][] = [];

  for (const road of state.roadTiles) {
    const roadKey = tileKey(road);
    if (visited.has(roadKey)) continue;
    const queue = [road];
    const component: MapTile[] = [];
    visited.add(roadKey);

    for (let index = 0; index < queue.length; index += 1) {
      const current = queue[index];
      component.push(current);
      for (const neighbour of orthogonalNeighbours(current)) {
        const neighbourKey = tileKey(neighbour);
        const next = roadByKey.get(neighbourKey);
        if (!next || visited.has(neighbourKey)) continue;
        visited.add(neighbourKey);
        queue.push(next);
      }
    }
    components.push(component);
  }

  return components;
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

function traceOutsideRoadNetwork(state: GameState): {
  tiles: MapTile[];
  roadByKey: Map<string, MapTile>;
  parent: Map<string, string | null>;
  distance: Map<string, number>;
} {
  const roadByKey = new Map(state.roadTiles.map((tile) => [tileKey(tile), tile]));
  const seeds = orthogonalNeighbours(REGIONAL_ROAD_CONNECTION_TILE).filter((tile) =>
    roadByKey.has(tileKey(tile)),
  );
  const queue = [...seeds];
  const tiles: MapTile[] = [];
  const parent = new Map<string, string | null>();
  const distance = new Map<string, number>();

  for (const seed of seeds) {
    const key = tileKey(seed);
    parent.set(key, null);
    distance.set(key, 0);
  }

  for (let index = 0; index < queue.length; index += 1) {
    const tile = queue[index];
    const key = tileKey(tile);
    tiles.push(tile);

    for (const neighbour of orthogonalNeighbours(tile)) {
      const neighbourKey = tileKey(neighbour);
      if (!roadByKey.has(neighbourKey) || parent.has(neighbourKey)) continue;
      parent.set(neighbourKey, key);
      distance.set(neighbourKey, (distance.get(key) ?? 0) + 1);
      queue.push(roadByKey.get(neighbourKey)!);
    }
  }

  return { tiles, roadByKey, parent, distance };
}

function traceServiceRoadNetwork(
  state: GameState,
  building: ServiceBuilding,
): {
  tiles: MapTile[];
  distance: Map<string, number>;
} {
  const definition = SERVICE_BUILDING_DEFINITIONS[building.kind];
  const maximumDistance = definition.serviceRange ?? 0;
  if (maximumDistance <= 0) return { tiles: [], distance: new Map() };

  const footprint = getServiceFootprintTiles(building.kind, building);
  const roadByKey = new Map(state.roadTiles.map((tile) => [tileKey(tile), tile]));
  const seeds = state.roadTiles.filter((road) =>
    footprint.some((tile) => manhattanDistance(tile, road) <= 3),
  );
  const queue = [...seeds];
  const tiles: MapTile[] = [];
  const distance = new Map<string, number>();
  for (const seed of seeds) distance.set(tileKey(seed), 0);

  for (let index = 0; index < queue.length; index += 1) {
    const tile = queue[index];
    const key = tileKey(tile);
    const tileDistance = distance.get(key) ?? 0;
    tiles.push(tile);
    if (tileDistance >= maximumDistance) continue;

    for (const neighbour of orthogonalNeighbours(tile)) {
      const neighbourKey = tileKey(neighbour);
      if (!roadByKey.has(neighbourKey) || distance.has(neighbourKey)) continue;
      distance.set(neighbourKey, tileDistance + 1);
      queue.push(roadByKey.get(neighbourKey)!);
    }
  }

  return { tiles, distance };
}

function getRelevantServiceZones(
  state: GameState,
  category: CivicServiceCategory,
): ZonedTile[] {
  if (category === "health" || category === "education") {
    return state.zoneTiles.filter((tile) => tile.zone === "residential");
  }
  return state.zoneTiles;
}

function manhattanDistance(first: MapTile, second: MapTile): number {
  return Math.abs(first.column - second.column) + Math.abs(first.row - second.row);
}

function orthogonalNeighbours(tile: MapTile): MapTile[] {
  return [
    { column: tile.column - 1, row: tile.row },
    { column: tile.column + 1, row: tile.row },
    { column: tile.column, row: tile.row - 1 },
    { column: tile.column, row: tile.row + 1 },
  ].filter(isTileOnMap);
}

function getServiceOccupiedKeys(state: GameState): Set<string> {
  return new Set(
    state.serviceBuildings.flatMap((building) =>
      getServiceFootprintTiles(building.kind, building).map(tileKey),
    ),
  );
}

function advanceLoanPayments(
  currentLoans: CityLoan[],
  elapsedMonths: number,
): { loans: CityLoan[]; totalPaid: number } {
  let loans = currentLoans.map((loan) => ({ ...loan }));
  let totalPaid = 0;

  for (let month = 0; month < elapsedMonths; month += 1) {
    loans = loans
      .map((loan) => {
        const interest = loan.remainingBalance * (loan.annualRate / 100 / 12);
        const amountDue = loan.remainingBalance + interest;
        const payment =
          loan.remainingMonths <= 1
            ? amountDue
            : Math.min(loan.monthlyPayment, amountDue);
        totalPaid += payment;
        return {
          ...loan,
          remainingBalance: roundMoney(Math.max(0, amountDue - payment)),
          remainingMonths: Math.max(0, loan.remainingMonths - 1),
        };
      })
      .filter((loan) => loan.remainingMonths > 0 && loan.remainingBalance > 0);
  }

  return { loans, totalPaid: roundMoney(totalPaid) };
}

function cacheUtilityCoverage(
  state: GameState,
  coverage: UtilityCoverageSummary,
): UtilityCoverageSummary {
  const stateCache = utilityCoverageCache.get(state) ?? new Map();
  stateCache.set(coverage.category, coverage);
  utilityCoverageCache.set(state, stateCache);
  return coverage;
}

function tileKey(tile: MapTile): string {
  return `${tile.column}:${tile.row}`;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function roundToOne(value: number): number {
  return Math.round(value * 10) / 10;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
