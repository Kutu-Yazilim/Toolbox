import { type Preset } from "@/components/shared/PresetsDrawer"

export const FAVICON_PRESETS: Preset[] = [
  {
    name: "All Standard Sizes",
    category: "Favicon Sizes",
    description: "16, 32, 48, 180, 192, 512px",
    content: JSON.stringify({ sizes: "all" }),
  },
  {
    name: "Browser Only",
    category: "Favicon Sizes",
    description: "16x16 and 32x32 for browsers",
    content: JSON.stringify({ sizes: "browser" }),
  },
  {
    name: "Apple Touch Icon",
    category: "Favicon Sizes",
    description: "180x180 for iOS devices",
    content: JSON.stringify({ sizes: "apple" }),
  },
  {
    name: "Android Chrome",
    category: "Favicon Sizes",
    description: "192x192 and 512x512 for Android",
    content: JSON.stringify({ sizes: "android" }),
  },
]
