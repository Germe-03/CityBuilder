import { create } from "zustand";

import {
  createInitialGameState,
  SERVICE_BUILDING_DEFINITIONS,
  type GameState,
  type ServiceBuildingKind,
} from "../simulation/cityMap";

export type BuildToolId =
  "roads" | "avenues" | "residential" | "commercial" | "industrial";
export type UtilityToolId = "electricity" | "water" | "sewage" | "waste";
export type CivicToolId = "fire" | "police" | "health" | "education";
export type ToolId =
  | "needs"
  | "land-value"
  | "finances"
  | BuildToolId
  | UtilityToolId
  | CivicToolId
  | "bulldozer";

interface Notice {
  id: number;
  tone: "success" | "warning" | "info";
  message: string;
}

interface GameStore {
  snapshot: GameState;
  connected: boolean;
  activeTool: ToolId;
  selectedServiceBuildingKind: ServiceBuildingKind;
  notice: Notice | null;
  setSnapshot: (snapshot: GameState) => void;
  setConnected: (connected: boolean) => void;
  setActiveTool: (tool: ToolId) => void;
  selectServiceBuildingKind: (kind: ServiceBuildingKind) => void;
  showNotice: (message: string, tone?: Notice["tone"]) => void;
  dismissNotice: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  snapshot: createInitialGameState(),
  connected: false,
  activeTool: "needs",
  selectedServiceBuildingKind: "wind-turbine",
  notice: null,
  setSnapshot: (snapshot) => set({ snapshot }),
  setConnected: (connected) => set({ connected }),
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
  if (tool === "fire") return "fire-station";
  if (tool === "police") return "police-station";
  if (tool === "health") return "clinic";
  if (tool === "education") return "elementary-school";
  return null;
}
