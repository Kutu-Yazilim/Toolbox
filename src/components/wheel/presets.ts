import { type Preset } from "@/components/shared/PresetsDrawer"

export const WHEEL_PRESETS: Preset[] = [
  {
    name: "Yes / No / Maybe",
    category: "Quick Decisions",
    description: "Simple three-way decision",
    content: JSON.stringify({ options: ["Yes", "No", "Maybe"] }),
  },
  {
    name: "Team Lunch",
    category: "Food",
    description: "Where to eat for lunch",
    content: JSON.stringify({ options: ["Pizza", "Sushi", "Tacos", "Burgers", "Salad", "Ramen"] }),
  },
  {
    name: "Rock Paper Scissors",
    category: "Games",
    description: "Classic RPS choices",
    content: JSON.stringify({ options: ["Rock", "Paper", "Scissors"] }),
  },
  {
    name: "Weekday Picker",
    category: "Planning",
    description: "Pick a day of the week",
    content: JSON.stringify({ options: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] }),
  },
  {
    name: "Priority Levels",
    category: "Work",
    description: "Task priority assignment",
    content: JSON.stringify({ options: ["Critical", "High", "Medium", "Low", "Backlog"] }),
  },
]
