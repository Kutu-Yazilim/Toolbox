import { type Preset } from "@/components/shared/PresetsDrawer"

export const DICE_ROLLER_PRESETS: Preset[] = [
  {
    name: "Standard d6",
    category: "Common",
    description: "Single six-sided die",
    content: JSON.stringify({ diceType: 6, diceCount: 1, modifier: 0 }),
  },
  {
    name: "2d6 (Board Games)",
    category: "Common",
    description: "Two six-sided dice",
    content: JSON.stringify({ diceType: 6, diceCount: 2, modifier: 0 }),
  },
  {
    name: "d20 (D&D Attack)",
    category: "RPG",
    description: "Standard D&D attack roll",
    content: JSON.stringify({ diceType: 20, diceCount: 1, modifier: 0 }),
  },
  {
    name: "2d6+3 (Greatsword)",
    category: "RPG",
    description: "Greatsword damage roll",
    content: JSON.stringify({ diceType: 6, diceCount: 2, modifier: 3 }),
  },
  {
    name: "4d6 (Ability Score)",
    category: "RPG",
    description: "D&D ability score generation",
    content: JSON.stringify({ diceType: 6, diceCount: 4, modifier: 0 }),
  },
  {
    name: "d100 (Percentile)",
    category: "Common",
    description: "Percentage roll",
    content: JSON.stringify({ diceType: 100, diceCount: 1, modifier: 0 }),
  },
]
