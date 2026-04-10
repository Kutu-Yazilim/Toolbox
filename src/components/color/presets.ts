import { type Preset } from "@/components/shared/PresetsDrawer"

export const COLOR_PICKER_PRESETS: Preset[] = [
  {
    name: "Material Blue",
    category: "Material Design",
    description: "Google Material blue palette",
    content: JSON.stringify(["#E3F2FD", "#90CAF9", "#42A5F5", "#1E88E5", "#1565C0"]),
  },
  {
    name: "Tailwind Emerald",
    category: "Tailwind",
    description: "Tailwind CSS emerald shades",
    content: JSON.stringify(["#D1FAE5", "#6EE7B7", "#34D399", "#10B981", "#059669"]),
  },
  {
    name: "Warm Sunset",
    category: "Themes",
    description: "Warm sunset color scheme",
    content: JSON.stringify(["#FFF7ED", "#FDBA74", "#F97316", "#EA580C", "#9A3412"]),
  },
  {
    name: "Monochrome",
    category: "Neutral",
    description: "Grayscale palette",
    content: JSON.stringify(["#F8FAFC", "#94A3B8", "#64748B", "#334155", "#0F172A"]),
  },
  {
    name: "Pastel Rainbow",
    category: "Themes",
    description: "Soft pastel rainbow colors",
    content: JSON.stringify(["#FCA5A5", "#FDBA74", "#FDE68A", "#86EFAC", "#93C5FD", "#C4B5FD"]),
  },
  {
    name: "Neon",
    category: "Themes",
    description: "Vibrant neon colors",
    content: JSON.stringify(["#FF006E", "#FB5607", "#FFBE0B", "#06D6A0", "#118AB2"]),
  },
]
