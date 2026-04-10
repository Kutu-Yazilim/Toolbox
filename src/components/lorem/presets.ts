import { type Preset } from "@/components/shared/PresetsDrawer"

export const LOREM_PRESETS: Preset[] = [
  {
    name: "1 Paragraph",
    category: "Paragraphs",
    description: "Single paragraph for card content",
    content: JSON.stringify({ mode: "paragraphs", count: 1 }),
  },
  {
    name: "3 Paragraphs",
    category: "Paragraphs",
    description: "Standard blog post placeholder",
    content: JSON.stringify({ mode: "paragraphs", count: 3 }),
  },
  {
    name: "5 Sentences",
    category: "Sentences",
    description: "Short description placeholder",
    content: JSON.stringify({ mode: "sentences", count: 5 }),
  },
  {
    name: "50 Words",
    category: "Words",
    description: "Compact text block",
    content: JSON.stringify({ mode: "words", count: 50 }),
  },
  {
    name: "10 Paragraphs",
    category: "Paragraphs",
    description: "Long-form content placeholder",
    content: JSON.stringify({ mode: "paragraphs", count: 10 }),
  },
]
