import { type Preset } from "@/components/shared/PresetsDrawer"

export const NUMBER_BASE_PRESETS: Preset[] = [
  {
    name: "255 (Max Byte)",
    category: "Common Values",
    description: "Maximum value of a single byte",
    content: "255",
  },
  {
    name: "1024 (1 KB)",
    category: "Common Values",
    description: "Bytes in a kilobyte",
    content: "1024",
  },
  {
    name: "65535 (Max 16-bit)",
    category: "Common Values",
    description: "Maximum unsigned 16-bit integer",
    content: "65535",
  },
  {
    name: "2147483647 (Max 32-bit signed)",
    category: "Common Values",
    description: "Maximum signed 32-bit integer",
    content: "2147483647",
  },
  {
    name: "42 (Meaning of Life)",
    category: "Fun",
    description: "The answer to everything",
    content: "42",
  },
]
