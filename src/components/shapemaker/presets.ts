import { type Preset } from "@/components/shared/PresetsDrawer"

export const SHAPEMAKER_PRESETS: Preset[] = [
  {
    name: "Star",
    category: "Shapes",
    description: "Five-pointed star path",
    content: JSON.stringify({ template: "star" }),
  },
  {
    name: "Heart",
    category: "Shapes",
    description: "Heart shape using cubic bezier curves",
    content: JSON.stringify({ template: "heart" }),
  },
  {
    name: "Arrow",
    category: "Shapes",
    description: "Right-pointing arrow",
    content: JSON.stringify({ template: "arrow" }),
  },
  {
    name: "Rounded Rectangle",
    category: "UI Elements",
    description: "Rectangle with rounded corners",
    content: JSON.stringify({ template: "rounded-rect" }),
  },
]
