import { type Preset } from "@/components/shared/PresetsDrawer"

export const RANDOM_PICKER_PRESETS: Preset[] = [
  {
    name: "What to Eat",
    category: "Food",
    description: "Random meal picker",
    content: JSON.stringify({
      items: "Pizza\nSushi\nTacos\nBurger\nPasta\nRamen\nSalad\nCurry",
    }),
  },
  {
    name: "Movie Genre",
    category: "Entertainment",
    description: "Pick a movie genre",
    content: JSON.stringify({
      items: "Action\nComedy\nDrama\nHorror\nSci-Fi\nRomance\nThriller\nAnimation",
    }),
  },
  {
    name: "Weekend Activity",
    category: "Planning",
    description: "What to do this weekend",
    content: JSON.stringify({
      items: "Hiking\nMuseum\nMovies\nCooking\nGaming\nReading\nBiking\nBeach",
    }),
  },
  {
    name: "Team Member",
    category: "Work",
    description: "Pick who presents next",
    content: JSON.stringify({
      items: "Alice\nBob\nCharlie\nDiana\nEve\nFrank",
    }),
  },
]
