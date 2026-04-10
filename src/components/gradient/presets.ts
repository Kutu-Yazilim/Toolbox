import { type Preset } from "@/components/shared/PresetsDrawer"

export const GRADIENT_PRESETS: Preset[] = [
  {
    name: "Sunset",
    category: "Nature",
    description: "Warm orange to purple gradient",
    content: JSON.stringify({ type: "linear", angle: 135, stops: [{ color: "#f97316", position: 0 }, { color: "#ec4899", position: 50 }, { color: "#8b5cf6", position: 100 }] }),
  },
  {
    name: "Ocean",
    category: "Nature",
    description: "Deep blue sea gradient",
    content: JSON.stringify({ type: "linear", angle: 180, stops: [{ color: "#0ea5e9", position: 0 }, { color: "#2563eb", position: 50 }, { color: "#1e3a5f", position: 100 }] }),
  },
  {
    name: "Forest",
    category: "Nature",
    description: "Lush green gradient",
    content: JSON.stringify({ type: "linear", angle: 160, stops: [{ color: "#22c55e", position: 0 }, { color: "#15803d", position: 50 }, { color: "#14532d", position: 100 }] }),
  },
  {
    name: "Aurora",
    category: "Vibrant",
    description: "Purple aurora borealis",
    content: JSON.stringify({ type: "linear", angle: 135, stops: [{ color: "#667eea", position: 0 }, { color: "#764ba2", position: 100 }] }),
  },
  {
    name: "Night Sky",
    category: "Dark",
    description: "Deep indigo night gradient",
    content: JSON.stringify({ type: "linear", angle: 180, stops: [{ color: "#0f0c29", position: 0 }, { color: "#302b63", position: 50 }, { color: "#24243e", position: 100 }] }),
  },
  {
    name: "Peach Radial",
    category: "Soft",
    description: "Soft peach radial gradient",
    content: JSON.stringify({ type: "radial", angle: 0, stops: [{ color: "#ffecd2", position: 0 }, { color: "#fcb69f", position: 100 }] }),
  },
]
