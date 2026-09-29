import { describe, expect, it } from "vitest";

import {
  BASE_SECTOR_PRICE,
  COMMERCIAL_ZONE_COST,
  INDUSTRIAL_ZONE_COST,
  MAP_SECTORS_PER_SIDE,
  MAP_TILES_PER_SIDE,
  RESIDENTIAL_ZONE_COST,
  ROAD_TILE_COST,
  SERVICE_BUILDING_DEFINITIONS,
  STARTING_BUDGET,
  STARTING_SECTOR_COUNT,
  advanceSimulation,
  buildTiles,
  createInitialGameState,
  demolishTiles,
  getSectorPurchaseInfo,
  getElectricityCapacity,
  getElectricityDemand,
  getSewageCapacity,
  getSewageDemand,
  getSupplyIssues,
  getWasteCapacity,
  getWasteDemand,
  getWaterCapacity,
  getWaterDemand,
  getZoneDemand,
  placeServiceBuilding,
  purchaseSector,
} from "../src/simulation/cityMap";

describe("city map", () => {
  it("creates an 8 x 8 sector map with 128 x 128 tiles", () => {
    const state = createInitialGameState();

    expect(MAP_SECTORS_PER_SIDE).toBe(8);
    expect(MAP_TILES_PER_SIDE).toBe(128);
    expect(state.sectors).toHaveLength(64);
    expect(state.sectors.filter((sector) => sector.owned)).toHaveLength(
      STARTING_SECTOR_COUNT,
    );
  });

  it("starts with exactly 15 connected sectors", () => {
    const state = createInitialGameState();
    const ownedIds = new Set(
      state.sectors.filter((sector) => sector.owned).map((sector) => sector.id),
    );
    const visited = new Set<number>();
    const queue = [ownedIds.values().next().value as number];

    while (queue.length > 0) {
      const current = queue.shift();
      if (current === undefined || visited.has(current)) continue;
      visited.add(current);

      const sector = state.sectors[current];
      const neighbours = [
        [sector.column - 1, sector.row],
        [sector.column + 1, sector.row],
        [sector.column, sector.row - 1],
        [sector.column, sector.row + 1],
      ];

      for (const [column, row] of neighbours) {
        const neighbour = state.sectors.find(
          (candidate) => candidate.column === column && candidate.row === row,
        );
        if (neighbour && ownedIds.has(neighbour.id)) queue.push(neighbour.id);
      }
    }

    expect(visited.size).toBe(STARTING_SECTOR_COUNT);
  });

  it("anchors the starting area in the south-west corner", () => {
    const state = createInitialGameState();
    const owned = state.sectors.filter((sector) => sector.owned);

    expect(owned).toHaveLength(STARTING_SECTOR_COUNT);
    expect(owned.every((sector) => sector.column <= 3 && sector.row >= 4)).toBe(true);
    expect(state.sectors[7 * MAP_SECTORS_PER_SIDE].owned).toBe(true);
    expect(state.sectors[4 * MAP_SECTORS_PER_SIDE + 3].owned).toBe(false);
    expect(state.sectors[3 * MAP_SECTORS_PER_SIDE + 3].owned).toBe(false);
  });

  it("allows buying an orthogonally adjacent sector", () => {
    const state = createInitialGameState();
    const available = state.sectors.find(
      (sector) => getSectorPurchaseInfo(state, sector.id).status === "available",
    );

    expect(available).toBeDefined();
    const result = purchaseSector(state, available!.id);

    expect(result.ok).toBe(true);
    expect(result.state.budget).toBe(STARTING_BUDGET - BASE_SECTOR_PRICE);
    expect(result.state.sectors[available!.id].owned).toBe(true);
    expect(result.state.purchasedSectorCount).toBe(1);
  });

  it("rejects a sector without an owned edge neighbour", () => {
    const state = createInitialGameState();
    const locked = state.sectors.find(
      (sector) => getSectorPurchaseInfo(state, sector.id).status === "locked",
    );

    expect(locked).toBeDefined();
    const result = purchaseSector(state, locked!.id);

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("not-adjacent");
    expect(result.state).toBe(state);
  });

  it("does not buy a sector when the budget is too low", () => {
    const state = { ...createInitialGameState(), budget: 0 };
    const available = state.sectors.find(
      (sector) => getSectorPurchaseInfo(state, sector.id).status === "available",
    );
    const result = purchaseSector(state, available!.id);

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("insufficient-budget");
    expect(result.state.budget).toBe(0);
  });

  it("increases the price after each purchase", () => {
    const state = createInitialGameState();
    const first = state.sectors.find(
      (sector) => getSectorPurchaseInfo(state, sector.id).status === "available",
    );
    const afterFirstPurchase = purchaseSector(state, first!.id).state;
    const next = afterFirstPurchase.sectors.find(
      (sector) =>
        getSectorPurchaseInfo(afterFirstPurchase, sector.id).status === "available",
    );

    expect(getSectorPurchaseInfo(afterFirstPurchase, next!.id).price).toBeGreaterThan(
      BASE_SECTOR_PRICE,
    );
  });

  it("builds roads only on owned tiles and deducts their cost", () => {
    const state = createInitialGameState();
    const result = buildTiles(state, "road", [{ column: 8, row: 88 }]);

    expect(result.ok).toBe(true);
    expect(result.placedCount).toBe(1);
    expect(result.state.roadTiles).toEqual([{ column: 8, row: 88 }]);
    expect(result.state.budget).toBe(STARTING_BUDGET - ROAD_TILE_COST);

    const lockedResult = buildTiles(state, "road", [{ column: 0, row: 0 }]);
    expect(lockedResult.ok).toBe(false);
    expect(lockedResult.reason).toBe("locked-sector");
    expect(lockedResult.state).toBe(state);
  });

  it("creates residential, commercial and industrial zones near roads", () => {
    const stateWithRoads = buildTiles(createInitialGameState(), "road", [
      { column: 8, row: 88 },
      { column: 14, row: 88 },
      { column: 20, row: 88 },
    ]).state;
    const residential = buildTiles(stateWithRoads, "residential", [
      { column: 9, row: 88 },
    ]);
    const commercial = buildTiles(residential.state, "commercial", [
      { column: 15, row: 88 },
    ]);
    const industrial = buildTiles(commercial.state, "industrial", [
      { column: 21, row: 88 },
    ]);

    expect(industrial.ok).toBe(true);
    expect(industrial.state.zoneTiles).toEqual([
      { column: 9, row: 88, zone: "residential" },
      { column: 15, row: 88, zone: "commercial" },
      { column: 21, row: 88, zone: "industrial" },
    ]);
    expect(industrial.state.budget).toBe(
      STARTING_BUDGET -
        3 * ROAD_TILE_COST -
        RESIDENTIAL_ZONE_COST -
        COMMERCIAL_ZONE_COST -
        INDUSTRIAL_ZONE_COST,
    );

    const overlapResult = buildTiles(industrial.state, "residential", [
      { column: 8, row: 88 },
    ]);
    expect(overlapResult.ok).toBe(false);
    expect(overlapResult.reason).toBe("occupied");
  });

  it("requires road access before land can be zoned", () => {
    const state = createInitialGameState();
    const result = buildTiles(state, "residential", [{ column: 24, row: 88 }]);

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("road-required");
    expect(result.state).toBe(state);
  });

  it("places a wind turbine on owned, empty land near a road", () => {
    const stateWithRoad = buildTiles(createInitialGameState(), "road", [
      { column: 8, row: 88 },
    ]).state;

    const result = placeServiceBuilding(stateWithRoad, "wind-turbine", {
      column: 9,
      row: 88,
    });

    expect(result.ok).toBe(true);
    expect(result.state.serviceBuildings).toEqual([
      { id: 1, kind: "wind-turbine", column: 9, row: 88 },
    ]);
    expect(result.state.budget).toBe(
      stateWithRoad.budget - SERVICE_BUILDING_DEFINITIONS["wind-turbine"].cost,
    );
    expect(getElectricityCapacity(result.state)).toBe(40);
  });

  it("requires road access and prevents overlap for service buildings", () => {
    const state = createInitialGameState();
    const withoutRoad = placeServiceBuilding(state, "wind-turbine", {
      column: 24,
      row: 88,
    });

    expect(withoutRoad.ok).toBe(false);
    expect(withoutRoad.reason).toBe("road-required");

    const stateWithRoad = buildTiles(state, "road", [{ column: 8, row: 88 }]).state;
    const first = placeServiceBuilding(stateWithRoad, "wind-turbine", {
      column: 9,
      row: 88,
    });
    const overlap = placeServiceBuilding(first.state, "power-plant", {
      column: 9,
      row: 88,
    });

    expect(overlap.ok).toBe(false);
    expect(overlap.reason).toBe("occupied");
  });

  it("calculates electricity demand from all three zone types", () => {
    const state = {
      ...createInitialGameState(),
      zoneTiles: [
        { column: 9, row: 88, zone: "residential" as const },
        { column: 10, row: 88, zone: "commercial" as const },
        { column: 11, row: 88, zone: "industrial" as const },
      ],
    };

    expect(getElectricityDemand(state)).toBe(6);
    expect(getElectricityCapacity(state)).toBe(0);
  });

  it("calculates water, sewage, waste and RCI demand", () => {
    const state = {
      ...createInitialGameState(),
      population: 8,
      zoneTiles: [
        { column: 9, row: 88, zone: "residential" as const },
        { column: 10, row: 88, zone: "commercial" as const },
        { column: 11, row: 88, zone: "industrial" as const },
      ],
      serviceBuildings: [
        { id: 1, kind: "wind-turbine" as const, column: 16, row: 88 },
        { id: 2, kind: "water-pump" as const, column: 18, row: 88 },
        { id: 3, kind: "sewage-plant" as const, column: 21, row: 88 },
        { id: 4, kind: "landfill" as const, column: 25, row: 88 },
      ],
    };

    expect(getWaterDemand(state)).toBe(5);
    expect(getWaterCapacity(state)).toBe(90);
    expect(getSewageDemand(state)).toBe(5);
    expect(getSewageCapacity(state)).toBe(150);
    expect(getWasteDemand(state)).toBe(7);
    expect(getWasteCapacity(state)).toBe(130);
    expect(getSupplyIssues(state)).toEqual([]);
    expect(
      Object.values(getZoneDemand(state)).every((value) => value >= 0 && value <= 100),
    ).toBe(true);
  });

  it("demolishes roads, zones and service buildings without changing the budget", () => {
    const road = { column: 8, row: 88 };
    const zone = { column: 9, row: 88 };
    const stateWithRoad = buildTiles(createInitialGameState(), "road", [road]).state;
    const stateWithZone = buildTiles(stateWithRoad, "residential", [zone]).state;
    const stateWithService = placeServiceBuilding(stateWithZone, "wind-turbine", {
      column: 10,
      row: 89,
    }).state;

    const result = demolishTiles(stateWithService, [
      road,
      zone,
      { column: 11, row: 90 },
    ]);

    expect(result.ok).toBe(true);
    expect(result.removedRoadCount).toBe(1);
    expect(result.removedZoneCount).toBe(1);
    expect(result.removedServiceCount).toBe(1);
    expect(result.state.roadTiles).toEqual([]);
    expect(result.state.zoneTiles).toEqual([]);
    expect(result.state.serviceBuildings).toEqual([]);
    expect(result.state.budget).toBe(stateWithService.budget);
  });

  it("reports an empty tile when there is nothing to demolish", () => {
    const state = createInitialGameState();
    const result = demolishTiles(state, [{ column: 8, row: 88 }]);

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("empty-tile");
    expect(result.state).toBe(state);
  });

  it("stops growth and jobs while zoned buildings are without electricity", () => {
    const state = {
      ...createInitialGameState(),
      zoneTiles: [
        { column: 9, row: 88, zone: "residential" as const },
        { column: 10, row: 88, zone: "commercial" as const },
      ],
    };

    const next = advanceSimulation(state);

    expect(getElectricityDemand(next)).toBe(3);
    expect(next.population).toBe(0);
    expect(next.jobs).toBe(0);
    expect(next.happiness).toBeLessThan(state.happiness);
  });

  it("grows population and applies a monthly city balance", () => {
    const state = {
      ...createInitialGameState(),
      day: 28,
      speed: 3 as const,
      roadTiles: [{ column: 8, row: 88 }],
      zoneTiles: [
        { column: 9, row: 88, zone: "residential" as const },
        { column: 10, row: 88, zone: "residential" as const },
        { column: 11, row: 88, zone: "commercial" as const },
        { column: 12, row: 88, zone: "industrial" as const },
      ],
      serviceBuildings: [
        { id: 1, kind: "wind-turbine" as const, column: 16, row: 88 },
        { id: 2, kind: "water-pump" as const, column: 18, row: 88 },
        { id: 3, kind: "sewage-plant" as const, column: 21, row: 88 },
        { id: 4, kind: "landfill" as const, column: 25, row: 88 },
      ],
    };

    const next = advanceSimulation(state);

    expect(next.day).toBe(31);
    expect(next.population).toBeGreaterThan(0);
    expect(next.jobs).toBe(10);
    expect(next.lastIncome).toBeGreaterThan(0);
    expect(next.lastExpenses).toBeGreaterThan(0);
    expect(next.budget).toBe(STARTING_BUDGET + next.lastIncome - next.lastExpenses);
  });
});
