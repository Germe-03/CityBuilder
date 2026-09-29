import { create } from "zustand";

import {
  createInitialGameState,
  SERVICE_BUILDING_DEFINITIONS,
  type GameState,
  type ServiceBuildingKind,
} from "../simulation/cityMap";

export type BuildToolId = "roads" | "residential" | "commercial" | "industrial";
export type UtilityToolId = "electricity" | "water" | "sewage" | "waste";
export type ToolId =
  "inspect" | "sectors" | "needs" | BuildToolId | UtilityToolId | "bulldozer";

interface Notice {
  id: number;
  tone: "success" | "warning" | "info";
  message: string;
}

interface GameStore {
  snapshot: GameState;
  connected: boolean;
  selectedSectorId: number | null;
  activeTool: ToolId;
  selectedServiceBuildingKind: ServiceBuildingKind;
  notice: Notice | null;
  setSnapshot: (snapshot: GameState) => void;
  setConnected: (connected: boolean) => void;
  selectSector: (sectorId: number | null) => void;
  setActiveTool: (tool: ToolId) => void;
  selectServiceBuildingKind: (kind: ServiceBuildingKind) => void;
  showNotice: (message: string, tone?: Notice["tone"]) => void;
  dismissNotice: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  snapshot: createInitialGameState(),
  connected: false,
  selectedSectorId: null,
  activeTool: "sectors",
  selectedServiceBuildingKind: "wind-turbine",
  notice: null,
  setSnapshot: (snapshot) => set({ snapshot }),
  setConnected: (connected) => set({ connected }),
  selectSector: (selectedSectorId) => set({ selectedSectorId }),
  setActiveTool: (activeTool) =>
    set((state) => {
      const defaultKind = getDefaultServiceKind(activeTool);
      const currentCategory =
        SERVICE_BUILDING_DEFINITIONS[state.selectedServiceBuildingKind].category;
      return {
        activeTool,
        selectedServiceBuildingKind:
          defaultKind && currentCategory !== activeTool
            ? defaultKind
            : state.selectedServiceBuildingKind,
      };
    }),
  selectServiceBuildingKind: (selectedServiceBuildingKind) =>
    set({ selectedServiceBuildingKind }),
  showNotice: (message, tone = "info") =>
    set({ notice: { id: Date.now(), message, tone } }),
  dismissNotice: () => set({ notice: null }),
}));

function getDefaultServiceKind(tool: ToolId): ServiceBuildingKind | null {
  if (tool === "electricity") return "wind-turbine";
  if (tool === "water") return "water-pump";
  if (tool === "sewage") return "sewage-plant";
  if (tool === "waste") return "landfill";
  return null;
}
