import { type Preset } from "@/components/shared/PresetsDrawer"

export const RANDOM_NUMBER_PRESETS: Preset[] = [
  {
    name: "1 to 10",
    category: "Quick Range",
    description: "Simple 1-10 range",
    content: JSON.stringify({ min: 1, max: 10, mode: "single" }),
  },
  {
    name: "1 to 100",
    category: "Quick Range",
    description: "Standard percentage range",
    content: JSON.stringify({ min: 1, max: 100, mode: "single" }),
  },
  {
    name: "Lottery (1-49, 6 numbers)",
    category: "Lottery",
    description: "6 unique numbers from 1-49",
    content: JSON.stringify({ min: 1, max: 49, mode: "batch", batchCount: 6, noRepeat: true, sortOutput: true }),
  },
  {
    name: "PIN Code (0-9, 4 digits)",
    category: "Codes",
    description: "Random 4-digit PIN",
    content: JSON.stringify({ min: 0, max: 9, mode: "batch", batchCount: 4, noRepeat: false, sortOutput: false }),
  },
  {
    name: "Coin Flip (0 or 1)",
    category: "Quick Range",
    description: "Binary random outcome",
    content: JSON.stringify({ min: 0, max: 1, mode: "single" }),
  },
]
