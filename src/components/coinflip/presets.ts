import { type Preset } from "@/components/shared/PresetsDrawer"

export const COIN_FLIP_PRESETS: Preset[] = [
  {
    name: "Quick Decision",
    category: "Usage",
    description: "Heads = Yes, Tails = No",
    content: JSON.stringify({ info: "decision" }),
  },
  {
    name: "Who Goes First",
    category: "Usage",
    description: "Heads = Player 1, Tails = Player 2",
    content: JSON.stringify({ info: "first" }),
  },
  {
    name: "Left or Right",
    category: "Usage",
    description: "Heads = Left, Tails = Right",
    content: JSON.stringify({ info: "direction" }),
  },
]
