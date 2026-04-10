import { type Preset } from "@/components/shared/PresetsDrawer"

export const COLOR_PICKER_PRESETS: Preset[] = [
  {
    name: "Web Safe Colors",
    category: "Reference",
    description: "Common web-safe color palette",
    content: JSON.stringify({ info: "web-safe" }),
  },
  {
    name: "Material Design",
    category: "Reference",
    description: "Google Material Design colors",
    content: JSON.stringify({ info: "material" }),
  },
  {
    name: "Tailwind CSS",
    category: "Reference",
    description: "Tailwind CSS color palette",
    content: JSON.stringify({ info: "tailwind" }),
  },
]
