import { type Preset } from "@/components/shared/PresetsDrawer"

export const PLACEHOLDER_PRESETS: Preset[] = [
  {
    name: "Instagram Post",
    category: "Social Media",
    description: "1080x1080 square post",
    content: JSON.stringify({ width: 1080, height: 1080, bgColor: "#cccccc", textColor: "#666666" }),
  },
  {
    name: "Facebook Cover",
    category: "Social Media",
    description: "820x312 cover photo",
    content: JSON.stringify({ width: 820, height: 312, bgColor: "#cccccc", textColor: "#666666" }),
  },
  {
    name: "YouTube Thumbnail",
    category: "Social Media",
    description: "1280x720 video thumbnail",
    content: JSON.stringify({ width: 1280, height: 720, bgColor: "#cccccc", textColor: "#666666" }),
  },
  {
    name: "App Icon",
    category: "Icons",
    description: "512x512 app icon",
    content: JSON.stringify({ width: 512, height: 512, bgColor: "#4f46e5", textColor: "#ffffff" }),
  },
  {
    name: "Banner (728x90)",
    category: "Ads",
    description: "Standard leaderboard banner",
    content: JSON.stringify({ width: 728, height: 90, bgColor: "#1e293b", textColor: "#94a3b8" }),
  },
  {
    name: "OG Image (1200x630)",
    category: "Social Media",
    description: "Open Graph sharing image",
    content: JSON.stringify({ width: 1200, height: 630, bgColor: "#0f172a", textColor: "#e2e8f0" }),
  },
]
