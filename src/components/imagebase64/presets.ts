import { type Preset } from "@/components/shared/PresetsDrawer"

export const IMAGE_BASE64_PRESETS: Preset[] = [
  {
    name: "Data URI",
    category: "Output Format",
    description: "Full data:image/... URI string",
    content: JSON.stringify({ format: "datauri" }),
  },
  {
    name: "Raw Base64",
    category: "Output Format",
    description: "Base64 string without prefix",
    content: JSON.stringify({ format: "raw" }),
  },
  {
    name: "HTML img Tag",
    category: "Output Format",
    description: "Complete <img> element with src",
    content: JSON.stringify({ format: "html" }),
  },
  {
    name: "CSS Background",
    category: "Output Format",
    description: "CSS background-image property",
    content: JSON.stringify({ format: "css" }),
  },
]
