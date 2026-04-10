import { type Preset } from "@/components/shared/PresetsDrawer"

export const DECISION_MAKER_PRESETS: Preset[] = [
  {
    name: "What to Eat",
    category: "Daily",
    description: "Should I cook or order food?",
    content: JSON.stringify({ question: "Should I cook dinner tonight?" }),
  },
  {
    name: "Weekend Plans",
    category: "Planning",
    description: "Should I go out this weekend?",
    content: JSON.stringify({ question: "Should I go out this weekend?" }),
  },
  {
    name: "Exercise",
    category: "Health",
    description: "Should I work out today?",
    content: JSON.stringify({ question: "Should I work out today?" }),
  },
  {
    name: "New Purchase",
    category: "Finance",
    description: "Should I buy it?",
    content: JSON.stringify({ question: "Should I buy it?" }),
  },
  {
    name: "Career Move",
    category: "Life",
    description: "Should I take that opportunity?",
    content: JSON.stringify({ question: "Should I take that opportunity?" }),
  },
]
