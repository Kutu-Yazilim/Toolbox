import { type Preset } from "@/components/shared/PresetsDrawer"

export const MOCKUP_PRESETS: Preset[] = [
  {
    name: "iPhone Dark",
    category: "Phone",
    description: "iPhone 16 Pro in dark titanium",
    content: JSON.stringify({ deviceId: "iphone-16-pro", orientation: "portrait", colorVariant: "#1a1a1a", variantSlug: "black-titanium", background: { type: "solid", color: "#f5f5f5" } }),
  },
  {
    name: "iPhone Landscape",
    category: "Phone",
    description: "iPhone 16 Pro landscape mode",
    content: JSON.stringify({ deviceId: "iphone-16-pro", orientation: "landscape", colorVariant: "#1a1a1a", variantSlug: "black-titanium", background: { type: "solid", color: "#ffffff" } }),
  },
  {
    name: "Gradient Background",
    category: "Styled",
    description: "Device on purple gradient backdrop",
    content: JSON.stringify({ background: { type: "gradient", color: "#f5f5f5", gradientFrom: "#667eea", gradientTo: "#764ba2", gradientAngle: 135 } }),
  },
  {
    name: "Dark Background",
    category: "Styled",
    description: "Device on dark background",
    content: JSON.stringify({ background: { type: "solid", color: "#1a1a1a" } }),
  },
  {
    name: "3D Perspective",
    category: "Transform",
    description: "Angled 3D mockup view",
    content: JSON.stringify({ transform: { perspective: 1200, rotateX: 5, rotateY: -15 } }),
  },
]
