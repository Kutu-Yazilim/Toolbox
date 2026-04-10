import { type Preset } from "@/components/shared/PresetsDrawer"

export const BOX_SHADOW_PRESETS: Preset[] = [
  {
    name: "Subtle Lift",
    category: "Elevation",
    description: "Gentle shadow for cards",
    content: JSON.stringify([{ x: 0, y: 2, blur: 8, spread: 0, color: "#00000020", inset: false }]),
  },
  {
    name: "Medium Elevation",
    category: "Elevation",
    description: "Standard elevated card shadow",
    content: JSON.stringify([{ x: 0, y: 4, blur: 16, spread: -2, color: "#00000030", inset: false }]),
  },
  {
    name: "Heavy Drop",
    category: "Elevation",
    description: "Prominent floating effect",
    content: JSON.stringify([{ x: 0, y: 12, blur: 32, spread: -4, color: "#00000040", inset: false }]),
  },
  {
    name: "Inner Glow",
    category: "Effects",
    description: "Inset shadow for pressed effect",
    content: JSON.stringify([{ x: 0, y: 2, blur: 8, spread: 0, color: "#00000030", inset: true }]),
  },
  {
    name: "Neon Blue",
    category: "Effects",
    description: "Glowing blue neon shadow",
    content: JSON.stringify([{ x: 0, y: 0, blur: 20, spread: 2, color: "#3b82f680", inset: false }, { x: 0, y: 0, blur: 40, spread: 4, color: "#3b82f640", inset: false }]),
  },
  {
    name: "Layered Depth",
    category: "Layered",
    description: "Multi-layer realistic shadow",
    content: JSON.stringify([{ x: 0, y: 1, blur: 3, spread: 0, color: "#00000020", inset: false }, { x: 0, y: 4, blur: 12, spread: 0, color: "#00000015", inset: false }, { x: 0, y: 12, blur: 24, spread: 0, color: "#00000010", inset: false }]),
  },
]
