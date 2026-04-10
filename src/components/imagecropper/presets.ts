import { type Preset } from "@/components/shared/PresetsDrawer"

export const IMAGE_CROPPER_PRESETS: Preset[] = [
  {
    name: "Square (1:1)",
    category: "Aspect Ratio",
    description: "Instagram posts, profile pictures",
    content: JSON.stringify({ ratioIndex: 1 }),
  },
  {
    name: "Widescreen (16:9)",
    category: "Aspect Ratio",
    description: "YouTube, presentations",
    content: JSON.stringify({ ratioIndex: 2 }),
  },
  {
    name: "Classic Photo (4:3)",
    category: "Aspect Ratio",
    description: "Traditional photo format",
    content: JSON.stringify({ ratioIndex: 3 }),
  },
  {
    name: "DSLR (3:2)",
    category: "Aspect Ratio",
    description: "Standard DSLR photo ratio",
    content: JSON.stringify({ ratioIndex: 4 }),
  },
  {
    name: "Free Crop",
    category: "Aspect Ratio",
    description: "No aspect ratio constraint",
    content: JSON.stringify({ ratioIndex: 0 }),
  },
]
