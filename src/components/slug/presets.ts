import { type Preset } from "@/components/shared/PresetsDrawer"

export const SLUG_PRESETS: Preset[] = [
  {
    name: "Blog Post Title",
    category: "Content",
    description: "Typical article heading",
    content: "How to Build a REST API with Express.js & TypeScript (2024 Guide)",
  },
  {
    name: "Product Name",
    category: "E-commerce",
    description: "Product with special characters",
    content: 'Apple MacBook Pro 16" - M3 Max (Space Black)',
  },
  {
    name: "Turkish Characters",
    category: "International",
    description: "Text with Turkish special characters",
    content: "Turkce karakterler: cigsou CIGSOU",
  },
  {
    name: "Mixed Special Chars",
    category: "Edge Cases",
    description: "Various special characters and symbols",
    content: "Hello! @World #2024 - Special & Chars (test) [v2.0]",
  },
]
