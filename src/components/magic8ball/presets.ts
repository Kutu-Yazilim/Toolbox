import { type Preset } from "@/components/shared/PresetsDrawer"

export const MAGIC_8BALL_PRESETS: Preset[] = [
  {
    name: "Career Decision",
    category: "Life",
    description: "Should I change jobs?",
    content: JSON.stringify({ question: "Should I change jobs?" }),
  },
  {
    name: "Weekend Plans",
    category: "Fun",
    description: "Should I go out this weekend?",
    content: JSON.stringify({ question: "Should I go out this weekend?" }),
  },
  {
    name: "Food Choice",
    category: "Fun",
    description: "Should I order takeout?",
    content: JSON.stringify({ question: "Should I order takeout?" }),
  },
  {
    name: "Productivity",
    category: "Life",
    description: "Will I be productive today?",
    content: JSON.stringify({ question: "Will I be productive today?" }),
  },
]
