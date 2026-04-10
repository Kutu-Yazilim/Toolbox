import { type Preset } from "@/components/shared/PresetsDrawer"

export const ICON_EDITOR_PRESETS: Preset[] = [
  {
    name: "Dark Icon",
    category: "Standard",
    description: "Black icon on transparent background",
    content: JSON.stringify({ icon: "Home", size: 48, color: "#000000", strokeWidth: 2, bgTransparent: true }),
  },
  {
    name: "Light Icon",
    category: "Standard",
    description: "White icon on transparent background",
    content: JSON.stringify({ icon: "Home", size: 48, color: "#ffffff", strokeWidth: 2, bgTransparent: true }),
  },
  {
    name: "Blue Accent",
    category: "Branded",
    description: "Blue icon for UI elements",
    content: JSON.stringify({ icon: "Settings", size: 32, color: "#3b82f6", strokeWidth: 1.5, bgTransparent: true }),
  },
  {
    name: "App Icon Style",
    category: "Export",
    description: "Large icon with colored background",
    content: JSON.stringify({ icon: "Star", size: 256, color: "#ffffff", strokeWidth: 1.5, bgTransparent: false, bgColor: "#8b5cf6" }),
  },
  {
    name: "Thin Stroke",
    category: "Style",
    description: "Delicate thin-stroke style",
    content: JSON.stringify({ icon: "Heart", size: 64, color: "#ec4899", strokeWidth: 1, bgTransparent: true }),
  },
]
