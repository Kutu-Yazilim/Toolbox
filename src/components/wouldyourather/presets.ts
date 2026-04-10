import { type Preset } from "@/components/shared/PresetsDrawer"

export const WYR_PRESETS: Preset[] = [
  {
    name: "Funny Questions",
    category: "Category Filter",
    description: "Light-hearted humorous prompts",
    content: JSON.stringify({ filter: "funny" }),
  },
  {
    name: "Deep Questions",
    category: "Category Filter",
    description: "Philosophical and thought-provoking",
    content: JSON.stringify({ filter: "deep" }),
  },
  {
    name: "Impossible Choices",
    category: "Category Filter",
    description: "Truly difficult decisions",
    content: JSON.stringify({ filter: "impossible" }),
  },
  {
    name: "Absurd Scenarios",
    category: "Category Filter",
    description: "Wild and silly hypotheticals",
    content: JSON.stringify({ filter: "absurd" }),
  },
  {
    name: "All Categories",
    category: "Category Filter",
    description: "Show all prompts",
    content: JSON.stringify({ filter: "all" }),
  },
]
