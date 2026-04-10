import { type Preset } from "@/components/shared/PresetsDrawer"

export const RPS_PRESETS: Preset[] = [
  {
    name: "Best of 3",
    category: "Game Mode",
    description: "Quick best-of-3 series",
    content: JSON.stringify({ bestOfMode: 3 }),
  },
  {
    name: "Best of 5",
    category: "Game Mode",
    description: "Standard best-of-5 series",
    content: JSON.stringify({ bestOfMode: 5 }),
  },
  {
    name: "Best of 7",
    category: "Game Mode",
    description: "Extended best-of-7 series",
    content: JSON.stringify({ bestOfMode: 7 }),
  },
  {
    name: "Unlimited",
    category: "Game Mode",
    description: "Play without a series limit",
    content: JSON.stringify({ bestOfMode: 0 }),
  },
]
