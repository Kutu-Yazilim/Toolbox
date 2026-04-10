import { type Preset } from "@/components/shared/PresetsDrawer"

export const IMAGE_RESIZER_PRESETS: Preset[] = [
  {
    name: "Full HD (1920x1080)",
    category: "Display",
    description: "Standard 1080p resolution",
    content: JSON.stringify({ width: 1920, height: 1080 }),
  },
  {
    name: "4K UHD (3840x2160)",
    category: "Display",
    description: "Ultra HD 4K resolution",
    content: JSON.stringify({ width: 3840, height: 2160 }),
  },
  {
    name: "Instagram Post (1080x1080)",
    category: "Social Media",
    description: "Square post for Instagram",
    content: JSON.stringify({ width: 1080, height: 1080 }),
  },
  {
    name: "Twitter Header (1500x500)",
    category: "Social Media",
    description: "Twitter/X profile banner",
    content: JSON.stringify({ width: 1500, height: 500 }),
  },
  {
    name: "YouTube Thumbnail (1280x720)",
    category: "Social Media",
    description: "Standard YouTube thumbnail",
    content: JSON.stringify({ width: 1280, height: 720 }),
  },
  {
    name: "App Icon (512x512)",
    category: "Icons",
    description: "Standard app icon size",
    content: JSON.stringify({ width: 512, height: 512 }),
  },
]
