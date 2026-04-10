import { type Preset } from "@/components/shared/PresetsDrawer"

export const IMAGE_COMPRESSOR_PRESETS: Preset[] = [
  {
    name: "High Quality JPEG",
    category: "Quality",
    description: "Minimal compression, best quality",
    content: JSON.stringify({ quality: 92, format: "jpeg" }),
  },
  {
    name: "Balanced JPEG",
    category: "Quality",
    description: "Good balance of size and quality",
    content: JSON.stringify({ quality: 75, format: "jpeg" }),
  },
  {
    name: "Maximum Compression",
    category: "Quality",
    description: "Smallest file size, lower quality",
    content: JSON.stringify({ quality: 40, format: "jpeg" }),
  },
  {
    name: "WebP Optimized",
    category: "Format",
    description: "Modern format with great compression",
    content: JSON.stringify({ quality: 80, format: "webp" }),
  },
  {
    name: "Lossless PNG",
    category: "Format",
    description: "No quality loss, larger file",
    content: JSON.stringify({ quality: 100, format: "png" }),
  },
]
