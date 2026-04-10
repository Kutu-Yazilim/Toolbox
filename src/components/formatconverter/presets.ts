import { type Preset } from "@/components/shared/PresetsDrawer"

export const FORMAT_CONVERTER_PRESETS: Preset[] = [
  {
    name: "Convert to PNG",
    category: "Lossless",
    description: "Best for graphics and transparency",
    content: JSON.stringify({ format: "png" }),
  },
  {
    name: "Convert to JPEG",
    category: "Lossy",
    description: "Best for photos, smaller files",
    content: JSON.stringify({ format: "jpeg" }),
  },
  {
    name: "Convert to WebP",
    category: "Modern",
    description: "Great compression, wide support",
    content: JSON.stringify({ format: "webp" }),
  },
  {
    name: "Convert to AVIF",
    category: "Modern",
    description: "Best compression, newer format",
    content: JSON.stringify({ format: "avif" }),
  },
]
