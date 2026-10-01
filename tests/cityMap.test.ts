import { describe, expect, it } from "vitest";

import {
  AVENUE_TILE_COST,
  COMMERCIAL_ZONE_COST,
  INDUSTRIAL_ZONE_COST,
  MAP_SECTORS_PER_SIDE,
  MAP_TILES_PER_SIDE,
  REGIONAL_ROAD_CONNECTION_TILE,
  REGIONAL_ROAD_ENTRY_TILE,
  REGIONAL_ROAD_TILES,
  RESIDENTIAL_ZONE_COST,
  ROAD_TILE_COST,
  SERVICE_BUILDING_DEFINITIONS,
  STARTING_BUDGET,
  advanceSimulation,
  buildTiles,
  createInitialGameState,
  demolishTiles,
  getCivicCoverage,
  getClassDemand,
  getOutsideConnectedRoadTiles,
  getOutsideConnectionSummary,
  getOutsideRoadRoute,
  getElectricityCapacity,
  getElectricityDemand,
  getDebtSummary,
  getDominantCardinalAxis,
  getLoanAnnualRate,
  getLoanMonthlyPayment,
  getSewageCapacity,
  getSewageDemand,
  getStraightLineTiles,
  getSupplyIssues,
  getUtilityCoverage,
  getWasteCapacity,
  getWasteDemand,
  getWaterCapacity,
  getWaterDemand,
  getZoneDemand,
  getZoneDevelopment,
  getZoneDevelopmentSummary,
  hasOutsideRoadConnection,
  isZoneConnectedToOutside,
  placeServiceBuilding,
  takeLoan,
  type GameState,
  type ZonedTile,
  type ZoneType,
} from "../src/simulation/cityMap";

describe("city map", () => {
  it("creates a fully available 128 x 128 tile map", () => {
    expect(MAP_SECTORS_PER_SIDE).toBe(8);
    expect(MAP_TILES_PER_SIDE).toBe(128);
  });

  it("locks a dragged road to its dominant cardinal direction", () => {
    const start = { column: 20, row: 30 };
    const roughHorizontalTarget = { column: 28, row: 33 };
    const axis = getDominantCardinalAxis(start, roughHorizontalTarget);

    expect(axis).toBe("horizontal");
    expect(getStraightLineTiles(start, roughHorizontalTarget, axis)).toEqual(
      Array.from({ length: 9 }, (_, offset) => ({
        column: 20 + offset,
        row: 30,
      })),
    );
  });

  it("keeps a vertical road on its starting column", () => {
    const start = { column: 42, row: 70 };
    const roughVerticalTarget = { column: 39, row: 61 };
    const axis = getDominantCardinalAxis(start, roughVerticalTarget);

    expect(axis).toBe("vertical");
    expect(getStraightLineTiles(start, roughVerticalTarget, axis)).toEqual(
      Array.from({ length: 10 }, (_, offset) => ({
        column: 42,
        row: 61 + offset,
      })),
    );
  });

  it("provides a protected regional road from the map edge into the starting area", () => {
    const state = createInitialGameState();

    expect(REGIONAL_ROAD_TILES).toHaveLength(8);
    expect(REGIONAL_ROAD_ENTRY_TILE).toEqual({ column: 0, row: 88 });
    expect(REGIONAL_ROAD_CONNECTION_TILE).toEqual({ column: 7, row: 88 });
    const buildResult = buildTiles(state, "road", [REGIONAL_ROAD_ENTRY_TILE]);
    expect(buildResult.ok).toBe(false);
    expect(buildResult.reason).toBe("occupied");

    const demolishResult = demolishTiles(state, [REGIONAL_ROAD_ENTRY_TILE]);
    expect(demolishResult.ok).toBe(false);
    expect(demolishResult.reason).toBe("protected-road");
    expect(demolishResult.state).toBe(state);
  });

  it("connects zones to the outside world through a contiguous city road", () => {
    const state = {
      ...createInitialGameState(),
      roadTiles: Array.from({ length: 8 }, (_, offset) => ({
        column: 8 + offset,
        row: 88,
      })),
      zoneTiles: [
        { column: 15, row: 89, zone: "residential" as const },
        { column: 14, row: 89, zone: "industrial" as const },
      ],
    };

    const summary = getOutsideConnectionSummary(state);

    expect(hasOutsideRoadConnection(state)).toBe(true);
    expect(getOutsideConnectedRoadTiles(state)).toHaveLength(8);
    expect(summary).toMatchObject({
      connected: true,
      connectedZoneCount: 2,
      residential: 1,
      industrial: 1,
    });
    expect(isZoneConnectedToOutside(state, state.zoneTiles[0])).toBe(true);
    expect(getOutsideRoadRoute(state, "industrial")).toEqual(state.roadTiles);
  });

  it("detects an interrupted road between the regional entry and city zones", () => {
    const connectedState = {
      ...createInitialGameState(),
      roadTiles: Array.from({ length: 8 }, (_, offset) => ({
        column: 8 + offset,
        row: 88,
      })),
      zoneTiles: [
        { column: 15, row: 89, zone: "residential" as const },
        { column: 14, row: 89, zone: "commercial" as const },
      ],
    };
    const interruptedState = demolishTiles(connectedState, [
      { column: 10, row: 88 },
    ]).state;

    expect(getOutsideConnectionSummary(interruptedState)).toMatchObject({
      connected: true,
      connectedRoadCount: 2,
      connectedZoneCount: 0,
    });
    expect(isZoneConnectedToOutside(interruptedState, stateTile(15, 89))).toBe(false);
    const simulated = advanceSimulation({
      ...interruptedState,
      speed: 3,
      serviceBuildings: [
        { id: 1, kind: "wind-turbine", column: 20, row: 90 },
        { id: 2, kind: "water-pump", column: 23, row: 90 },
        { id: 3, kind: "sewage-plant", column: 27, row: 90 },
      ],
    });
    expect(simulated.population).toBe(0);
    expect(simulated.jobs).toBe(0);

    const disconnectedState = demolishTiles(interruptedState, [
      { column: 8, row: 88 },
    ]).state;
    expect(hasOutsideRoadConnection(disconnectedState)).toBe(false);
    expect(getOutsideRoadRoute(disconnectedState)).toEqual([]);
  });

  it("builds roads across the whole map and deducts their cost", () => {
    const state = createInitialGameState();
    const result = buildTiles(state, "road", [
      { column: 0, row: 0 },
      { column: 127, row: 127 },
    ]);

    expect(result.ok).toBe(true);
    expect(result.placedCount).toBe(2);
    expect(result.state.roadTiles).toEqual([
      { column: 0, row: 0 },
      { column: 127, row: 127 },
    ]);
    expect(result.state.budget).toBe(STARTING_BUDGET - 2 * ROAD_TILE_COST);
  });

  it("builds an avenue as two road tiles with avenue costs", () => {
    const state = createInitialGameState();
    const result = buildTiles(state, "avenue", [
      { column: 8, row: 90 },
      { column: 8, row: 91 },
    ]);

    expect(result.ok).toBe(true);
    expect(result.placedCount).toBe(2);
    expect(result.state.roadTiles).toHaveLength(2);
    expect(result.state.avenueTiles).toEqual(result.state.roadTiles);
    expect(result.spent).toBe(AVENUE_TILE_COST * 2);

    const blocked = buildTiles(
      {
        ...state,
        roadTiles: [{ column: 8, row: 91 }],
      },
      "avenue",
      [
        { column: 8, row: 90 },
        { column: 8, row: 91 },
      ],
    );
    expect(blocked.ok).toBe(false);
    expect(blocked.placedCount).toBe(0);
    expect(blocked.state.roadTiles).toEqual([{ column: 8, row: 91 }]);
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

  it("places a wind turbine on empty land near a road", () => {
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

  it("places fire, police, health and education buildings with upkeep", () => {
    const stateWithRoad = {
      ...createInitialGameState(),
      roadTiles: Array.from({ length: 22 }, (_, offset) => ({
        column: 8 + offset,
        row: 88,
      })),
    };
    const fire = placeServiceBuilding(stateWithRoad, "fire-station", {
      column: 9,
      row: 90,
    });
    const police = placeServiceBuilding(fire.state, "police-station", {
      column: 13,
      row: 90,
    });
    const clinic = placeServiceBuilding(police.state, "clinic", {
      column: 17,
      row: 90,
    });
    const school = placeServiceBuilding(clinic.state, "elementary-school", {
      column: 21,
      row: 90,
    });

    expect([fire.ok, police.ok, clinic.ok, school.ok]).toEqual([
      true,
      true,
      true,
      true,
    ]);
    expect(school.state.serviceBuildings.map((building) => building.kind)).toEqual([
      "fire-station",
      "police-station",
      "clinic",
      "elementary-school",
    ]);
    expect(school.state.budget).toBe(
      STARTING_BUDGET -
        SERVICE_BUILDING_DEFINITIONS["fire-station"].cost -
        SERVICE_BUILDING_DEFINITIONS["police-station"].cost -
        SERVICE_BUILDING_DEFINITIONS.clinic.cost -
        SERVICE_BUILDING_DEFINITIONS["elementary-school"].cost,
    );
  });

  it("limits public service coverage to connected roads within range", () => {
    const state: GameState = {
      ...createInitialGameState(),
      roadTiles: Array.from({ length: 33 }, (_, offset) => ({
        column: 8 + offset,
        row: 88,
      })),
      zoneTiles: [
        { column: 12, row: 89, zone: "residential" },
        { column: 38, row: 89, zone: "residential" },
      ],
      serviceBuildings: [{ id: 1, kind: "fire-station", column: 10, row: 90 }],
    };

    expect(getCivicCoverage(state, "fire")).toMatchObject({
      buildingCount: 1,
      coveredZoneCount: 2,
      relevantZoneCount: 2,
      coveragePercent: 100,
    });

    const interrupted = demolishTiles(state, [{ column: 23, row: 88 }]).state;
    const coverage = getCivicCoverage(interrupted, "fire");
    expect(coverage.coveredZoneCount).toBe(1);
    expect(coverage.coveragePercent).toBe(50);
    expect(coverage.averageResponseMinutes).not.toBeNull();
  });

  it("develops housing and commerce to level 5 and industry to level 3", () => {
    const residential = createHighValueState("residential");
    const commercial = createHighValueState("commercial");
    const industrial = createHighValueState("industrial");
    const residentialDevelopment = getZoneDevelopment(
      residential.state,
      residential.target,
    );
    const commercialDevelopment = getZoneDevelopment(
      commercial.state,
      commercial.target,
    );
    const industrialDevelopment = getZoneDevelopment(
      industrial.state,
      industrial.target,
    );

    expect(residentialDevelopment).toMatchObject({
      level: 5,
      maxLevel: 5,
      classification: "premium",
    });
    expect(commercialDevelopment).toMatchObject({
      level: 5,
      maxLevel: 5,
      classification: "premium",
    });
    expect(industrialDevelopment).toMatchObject({
      level: 3,
      maxLevel: 3,
      classification: "premium",
    });
    expect(residentialDevelopment.fireRisk).toBeLessThan(20);
    expect(getZoneDevelopmentSummary(residential.state, "residential")).toMatchObject({
      averageLevel: 5,
      classes: { premium: 1 },
    });
    expect(getClassDemand(industrial.state, "industrial").premium).toBeGreaterThan(35);
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
      roadTiles: [
        { column: 8, row: 88 },
        ...Array.from({ length: 20 }, (_, offset) => ({
          column: 8 + offset,
          row: 87,
        })),
      ],
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

  it("supplies electricity, water and sewage only through connected roads", () => {
    const state: GameState = {
      ...createInitialGameState(),
      roadTiles: Array.from({ length: 20 }, (_, offset) => ({
        column: 8 + offset,
        row: 88,
      })),
      zoneTiles: [
        { column: 12, row: 89, zone: "residential" },
        { column: 26, row: 89, zone: "commercial" },
      ],
      serviceBuildings: [
        { id: 1, kind: "power-plant", column: 9, row: 90 },
        { id: 2, kind: "water-pump", column: 13, row: 90 },
        { id: 3, kind: "sewage-plant", column: 17, row: 90 },
      ],
    };

    for (const category of ["electricity", "water", "sewage"] as const) {
      expect(getUtilityCoverage(state, category)).toMatchObject({
        networkCount: 1,
        suppliedZoneCount: 2,
        relevantZoneCount: 2,
        coveragePercent: 100,
      });
    }

    const interrupted = demolishTiles(state, [{ column: 23, row: 88 }]).state;
    for (const category of ["electricity", "water", "sewage"] as const) {
      expect(getUtilityCoverage(interrupted, category)).toMatchObject({
        suppliedZoneCount: 1,
        relevantZoneCount: 2,
        coveragePercent: 50,
      });
    }
    expect(getSupplyIssues(interrupted)).toEqual([
      "electricity",
      "water",
      "sewage",
      "waste",
    ]);
  });

  it("partially supplies a connected network and allows covered homes to grow", () => {
    const state: GameState = {
      ...createInitialGameState(),
      roadTiles: Array.from({ length: 50 }, (_, offset) => ({
        column: 8 + offset,
        row: 88,
      })),
      zoneTiles: Array.from({ length: 50 }, (_, offset) => ({
        column: 8 + offset,
        row: 89,
        zone: "residential" as const,
      })),
      serviceBuildings: [
        { id: 1, kind: "wind-turbine", column: 9, row: 90 },
        { id: 2, kind: "water-pump", column: 13, row: 90 },
        { id: 3, kind: "sewage-plant", column: 18, row: 90 },
      ],
    };

    expect(getUtilityCoverage(state, "electricity")).toMatchObject({
      suppliedZoneCount: 27,
      relevantZoneCount: 50,
      coveragePercent: 54,
    });
    expect(getUtilityCoverage(state, "water")).toMatchObject({
      suppliedZoneCount: 45,
      relevantZoneCount: 50,
      coveragePercent: 90,
    });
    expect(getSupplyIssues(state)).toEqual(["electricity", "water"]);
    expect(advanceSimulation(state).population).toBeGreaterThan(0);
  });

  it("offers loans with amount- and term-dependent rates", () => {
    expect(getLoanAnnualRate(10_000, 12)).toBe(3.5);
    expect(getLoanAnnualRate(100_000, 72)).toBe(7.1);
    expect(getLoanMonthlyPayment(25_000, 24)).toBeGreaterThan(1_000);

    const state = createInitialGameState();
    const result = takeLoan(state, 25_000, 24);

    expect(result.ok).toBe(true);
    expect(result.state.budget).toBe(STARTING_BUDGET + 25_000);
    expect(result.state.loans).toHaveLength(1);
    expect(getDebtSummary(result.state)).toMatchObject({
      activeLoanCount: 1,
      totalRemainingBalance: 25_000,
      monthlyPayment: getLoanMonthlyPayment(25_000, 24),
    });
  });

  it("pays loan interest and principal at the monthly close", () => {
    const borrowed = takeLoan(
      { ...createInitialGameState(), day: 28, speed: 3 },
      10_000,
      12,
    ).state;
    const payment = borrowed.loans[0].monthlyPayment;
    const next = advanceSimulation(borrowed);

    expect(next.loans[0].remainingMonths).toBe(11);
    expect(next.loans[0].remainingBalance).toBeLessThan(10_000);
    expect(next.lastExpenses).toBe(payment);
    expect(next.budget).toBe(STARTING_BUDGET + 10_000 - payment);
  });

  it("limits the city to three simultaneous loans", () => {
    let state = createInitialGameState();
    for (let index = 0; index < 3; index += 1) {
      state = takeLoan(state, 10_000, 12).state;
    }

    const fourth = takeLoan(state, 25_000, 24);
    expect(fourth.ok).toBe(false);
    expect(fourth.reason).toBe("loan-limit");
    expect(fourth.state).toBe(state);
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
      roadTiles: [
        { column: 8, row: 88 },
        ...Array.from({ length: 21 }, (_, offset) => ({
          column: 8 + offset,
          row: 87,
        })),
      ],
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

function stateTile(column: number, row: number) {
  return { column, row };
}

function createHighValueState(zone: ZoneType): {
  state: GameState;
  target: ZonedTile;
} {
  const target: ZonedTile = { column: 30, row: 89, zone };
  const supportingZones: ZonedTile[] =
    zone === "residential"
      ? Array.from({ length: 15 }, (_, offset) => ({
          column: 34 + offset,
          row: 89,
          zone: "commercial" as const,
        }))
      : [];

  return {
    target,
    state: {
      ...createInitialGameState(),
      day: 200,
      population: zone === "residential" ? 0 : 40,
      roadTiles: Array.from({ length: 63 }, (_, offset) => ({
        column: 8 + offset,
        row: 88,
      })),
      zoneTiles: [target, ...supportingZones],
      serviceBuildings: [
        { id: 1, kind: "power-plant", column: 50, row: 89 },
        { id: 2, kind: "water-pump", column: 55, row: 89 },
        { id: 3, kind: "sewage-plant", column: 59, row: 89 },
        { id: 4, kind: "landfill", column: 64, row: 89 },
        { id: 5, kind: "fire-station", column: 10, row: 90 },
        { id: 6, kind: "police-station", column: 14, row: 90 },
        { id: 7, kind: "clinic", column: 18, row: 90 },
        { id: 8, kind: "elementary-school", column: 22, row: 90 },
      ],
    },
  };
}
