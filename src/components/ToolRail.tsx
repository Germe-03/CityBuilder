import {
  Activity,
  BadgeDollarSign,
  Building2,
  ChevronRight,
  Droplets,
  Factory,
  Flame,
  GraduationCap,
  HeartPulse,
  Hospital,
  House,
  Landmark,
  Map,
  Recycle,
  Route,
  Settings2,
  Shield,
  Store,
  Trash2,
  Waves,
  WalletCards,
  Zap,
} from "lucide-react";
import { useState } from "react";

import type { ToolId } from "../store/gameStore";

interface ToolRailProps {
  activeTool: ToolId;
  onSelectTool: (tool: ToolId) => void;
}

type MenuCategoryId = "planning" | "zones" | "needs" | "facilities" | "manage";

interface MenuTool {
  id?: ToolId;
  label: string;
  icon: typeof Map;
  planned?: boolean;
  danger?: boolean;
}

interface MenuCategory {
  id: MenuCategoryId;
  label: string;
  shortLabel: string;
  description: string;
  icon: typeof Map;
  tools: MenuTool[];
}

const categories: MenuCategory[] = [
  {
    id: "planning",
    label: "Stadtplanung",
    shortLabel: "Planen",
    description: "Strassennetz und Hauptachsen planen",
    icon: Map,
    tools: [
      { id: "roads", label: "Strassen", icon: Route },
      { id: "avenues", label: "Alleen", icon: Route },
    ],
  },
  {
    id: "zones",
    label: "Gebiete",
    shortLabel: "Gebiete",
    description: "Nutzung fuer neue Quartiere festlegen",
    icon: Building2,
    tools: [
      { id: "residential", label: "Wohngebiet", icon: House },
      { id: "commercial", label: "Gewerbegebiet", icon: Store },
      { id: "industrial", label: "Industriegebiet", icon: Factory },
      { id: "land-value", label: "Grundstueckswerte", icon: BadgeDollarSign },
    ],
  },
  {
    id: "needs",
    label: "Beduerfnisse",
    shortLabel: "Bedarf",
    description: "Nachfrage und Grundversorgung steuern",
    icon: Activity,
    tools: [
      { id: "needs", label: "Uebersicht", icon: HeartPulse },
      { id: "electricity", label: "Strom", icon: Zap },
      { id: "water", label: "Wasser", icon: Droplets },
      { id: "sewage", label: "Abwasser", icon: Waves },
      { id: "waste", label: "Muell", icon: Recycle },
    ],
  },
  {
    id: "facilities",
    label: "Oeffentliche Einrichtungen",
    shortLabel: "Dienste",
    description: "Sicherheit, Gesundheit und Bildung ausbauen",
    icon: Landmark,
    tools: [
      { id: "police", label: "Polizei", icon: Shield },
      { id: "fire", label: "Feuerwehr", icon: Flame },
      { id: "health", label: "Gesundheit", icon: Hospital },
      { id: "education", label: "Bildung", icon: GraduationCap },
      { label: "Rathaus", icon: Landmark, planned: true },
    ],
  },
  {
    id: "manage",
    label: "Werkzeuge",
    shortLabel: "Werkzeuge",
    description: "Stadt untersuchen oder Gebautes entfernen",
    icon: Settings2,
    tools: [
      { id: "finances", label: "Finanzen", icon: WalletCards },
      { id: "bulldozer", label: "Bulldozer", icon: Trash2, danger: true },
    ],
  },
];

export function ToolRail({ activeTool, onSelectTool }: ToolRailProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<MenuCategoryId>(() =>
    getCategoryForTool(activeTool),
  );

  const selectedCategory =
    categories.find((category) => category.id === selectedCategoryId) ?? categories[0];

  return (
    <nav className="tool-menu" aria-label="Stadtmenue">
      <div className="tool-menu-heading">
        <span>Baumenue</span>
        <strong>{selectedCategory.label}</strong>
      </div>

      <div className="tool-categories" role="tablist" aria-label="Menuebereiche">
        {categories.map(({ id, label, shortLabel, icon: Icon }) => {
          const selected = selectedCategory.id === id;
          const containsActiveTool = getCategoryForTool(activeTool) === id;
          return (
            <button
              key={id}
              type="button"
              className={`tool-category${selected ? " is-selected" : ""}${containsActiveTool ? " has-active-tool" : ""}`}
              onClick={() => setSelectedCategoryId(id)}
              role="tab"
              aria-label={label}
              aria-selected={selected}
              aria-controls="tool-options"
            >
              <Icon aria-hidden="true" />
              <span className="category-label-long">{label}</span>
              <span className="category-label-short" aria-hidden="true">
                {shortLabel}
              </span>
              <ChevronRight aria-hidden="true" className="category-chevron" />
            </button>
          );
        })}
      </div>

      <section
        id="tool-options"
        className="tool-options"
        role="tabpanel"
        aria-label={selectedCategory.label}
      >
        <div className="tool-options-heading">
          <strong>{selectedCategory.label}</strong>
          <small>{selectedCategory.description}</small>
        </div>
        <div className="tool-option-list">
          {selectedCategory.tools.map(({ id, label, icon: Icon, planned, danger }) => (
            <button
              key={label}
              type="button"
              className={`menu-tool${id === activeTool ? " is-active" : ""}${danger ? " is-danger" : ""}`}
              onClick={() => id && onSelectTool(id)}
              disabled={planned}
              aria-label={planned ? `${label} - geplant` : label}
              aria-pressed={id ? activeTool === id : undefined}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
              {planned && <small>Geplant</small>}
            </button>
          ))}
        </div>
      </section>
    </nav>
  );
}

function getCategoryForTool(tool: ToolId): MenuCategoryId {
  if (tool === "roads" || tool === "avenues") {
    return "planning";
  }
  if (
    tool === "residential" ||
    tool === "commercial" ||
    tool === "industrial" ||
    tool === "land-value"
  ) {
    return "zones";
  }
  if (
    tool === "needs" ||
    tool === "electricity" ||
    tool === "water" ||
    tool === "sewage" ||
    tool === "waste"
  ) {
    return "needs";
  }
  if (
    tool === "fire" ||
    tool === "police" ||
    tool === "health" ||
    tool === "education"
  ) {
    return "facilities";
  }
  return "manage";
}
