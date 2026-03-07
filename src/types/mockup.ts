export interface DeviceScreen {
  x: number
  y: number
  width: number
  height: number
  borderRadius: number
}

export interface DeviceFrame {
  width: number
  height: number
}

export interface DeviceStyle {
  bezelColor: string
  bezelWidth: { top: number; right: number; bottom: number; left: number }
  borderRadius: number
  hasNotch: boolean
  hasDynamicIsland: boolean
  hasHomeButton: boolean
}

export interface DeviceColorVariant {
  name: string
  color: string
  slug: string
}

export interface DeviceFrameImage {
  /** Native resolution of the frame image (px) */
  nativeWidth: number
  nativeHeight: number
  /** Screen cutout coordinates at native resolution */
  nativeScreen: {
    x: number
    y: number
    width: number
    height: number
  }
}

export type DeviceCategory = "phone" | "tablet" | "laptop"

export interface DeviceSpec {
  id: string
  name: string
  category: DeviceCategory
  frame: DeviceFrame
  screen: DeviceScreen
  style: DeviceStyle
  colorVariants: DeviceColorVariant[]
  /** Frame image metadata for realistic device rendering */
  frameImage?: DeviceFrameImage
}

export interface MockupBackground {
  type: "solid" | "gradient" | "transparent"
  color: string
  gradientFrom: string
  gradientTo: string
  gradientAngle: number
}

export interface MockupTransform {
  perspective: number
  rotateX: number
  rotateY: number
}

export type Orientation = "portrait" | "landscape"
export type ExportScale = 1 | 2 | 3

export function getFrameImagePath(deviceId: string, variantSlug: string): string {
  return `/device-frames/${deviceId}/${variantSlug}.png`
}

// Device catalog - dimensions are in CSS pixels for preview rendering
export const DEVICE_CATALOG: DeviceSpec[] = [
  {
    id: "iphone-16-pro",
    name: "iPhone 16 Pro",
    category: "phone",
    frame: { width: 280, height: 552 },
    screen: { x: 12, y: 12, width: 256, height: 528, borderRadius: 38 },
    style: {
      bezelColor: "#1a1a1a",
      bezelWidth: { top: 12, right: 12, bottom: 12, left: 12 },
      borderRadius: 44,
      hasNotch: false,
      hasDynamicIsland: true,
      hasHomeButton: false,
    },
    colorVariants: [
      { name: "Black Titanium", color: "#1a1a1a", slug: "black-titanium" },
      { name: "White Titanium", color: "#f0ede8", slug: "white-titanium" },
      { name: "Natural Titanium", color: "#9a9692", slug: "natural-titanium" },
    ],
    frameImage: {
      nativeWidth: 1419,
      nativeHeight: 2796,
      nativeScreen: { x: 120, y: 120, width: 1179, height: 2556 },
    },
  },
  {
    id: "iphone-16",
    name: "iPhone 16",
    category: "phone",
    frame: { width: 280, height: 552 },
    screen: { x: 12, y: 12, width: 256, height: 528, borderRadius: 38 },
    style: {
      bezelColor: "#1a1a1a",
      bezelWidth: { top: 12, right: 12, bottom: 12, left: 12 },
      borderRadius: 44,
      hasNotch: false,
      hasDynamicIsland: true,
      hasHomeButton: false,
    },
    colorVariants: [
      { name: "Black", color: "#1a1a1a", slug: "black" },
      { name: "Blue", color: "#7d9fc0", slug: "blue" },
      { name: "Pink", color: "#f2c8cc", slug: "pink" },
      { name: "Green", color: "#c6d5b8", slug: "green" },
    ],
    frameImage: {
      nativeWidth: 1419,
      nativeHeight: 2796,
      nativeScreen: { x: 120, y: 120, width: 1179, height: 2556 },
    },
  },
  {
    id: "iphone-15",
    name: "iPhone 15",
    category: "phone",
    frame: { width: 280, height: 552 },
    screen: { x: 12, y: 12, width: 256, height: 528, borderRadius: 38 },
    style: {
      bezelColor: "#1a1a1a",
      bezelWidth: { top: 12, right: 12, bottom: 12, left: 12 },
      borderRadius: 44,
      hasNotch: false,
      hasDynamicIsland: true,
      hasHomeButton: false,
    },
    colorVariants: [
      { name: "Black", color: "#2c2c2e", slug: "black" },
      { name: "Blue", color: "#7d9fc0", slug: "blue" },
      { name: "Green", color: "#c6d5b8", slug: "green" },
      { name: "Yellow", color: "#f0e2b0", slug: "yellow" },
      { name: "Pink", color: "#f2c8cc", slug: "pink" },
    ],
    frameImage: {
      nativeWidth: 1419,
      nativeHeight: 2796,
      nativeScreen: { x: 120, y: 120, width: 1179, height: 2556 },
    },
  },
  {
    id: "galaxy-s24",
    name: "Galaxy S24",
    category: "phone",
    frame: { width: 268, height: 508 },
    screen: { x: 10, y: 10, width: 248, height: 488, borderRadius: 30 },
    style: {
      bezelColor: "#1a1a1a",
      bezelWidth: { top: 10, right: 10, bottom: 10, left: 10 },
      borderRadius: 36,
      hasNotch: false,
      hasDynamicIsland: false,
      hasHomeButton: false,
    },
    colorVariants: [
      { name: "Titanium Gray", color: "#8a8a8a", slug: "titanium-gray" },
    ],
    frameImage: {
      nativeWidth: 1245,
      nativeHeight: 2359,
      nativeScreen: { x: 149, y: 167, width: 942, height: 2024 },
    },
  },
  {
    id: "ipad-pro-13",
    name: "iPad Pro 13\"",
    category: "tablet",
    frame: { width: 440, height: 569 },
    screen: { x: 16, y: 16, width: 408, height: 537, borderRadius: 16 },
    style: {
      bezelColor: "#1a1a1a",
      bezelWidth: { top: 16, right: 16, bottom: 16, left: 16 },
      borderRadius: 24,
      hasNotch: false,
      hasDynamicIsland: false,
      hasHomeButton: false,
    },
    colorVariants: [
      { name: "Space Black", color: "#1a1a1a", slug: "space-black" },
    ],
    frameImage: {
      nativeWidth: 1320,
      nativeHeight: 1706,
      nativeScreen: { x: 69, y: 65, width: 1181, height: 1575 },
    },
  },
  {
    id: "ipad-air-11",
    name: "iPad Air 11\"",
    category: "tablet",
    frame: { width: 380, height: 522 },
    screen: { x: 14, y: 14, width: 352, height: 494, borderRadius: 14 },
    style: {
      bezelColor: "#2c2c2e",
      bezelWidth: { top: 14, right: 14, bottom: 14, left: 14 },
      borderRadius: 22,
      hasNotch: false,
      hasDynamicIsland: false,
      hasHomeButton: false,
    },
    colorVariants: [
      { name: "Space Gray", color: "#2c2c2e", slug: "space-gray" },
    ],
    frameImage: {
      nativeWidth: 1140,
      nativeHeight: 1568,
      nativeScreen: { x: 83, y: 83, width: 974, height: 1402 },
    },
  },
  {
    id: "macbook-pro-16",
    name: "MacBook Pro 16\"",
    category: "laptop",
    frame: { width: 640, height: 422 },
    screen: { x: 40, y: 24, width: 560, height: 372, borderRadius: 8 },
    style: {
      bezelColor: "#1a1a1a",
      bezelWidth: { top: 24, right: 40, bottom: 26, left: 40 },
      borderRadius: 12,
      hasNotch: false,
      hasDynamicIsland: false,
      hasHomeButton: false,
    },
    colorVariants: [
      { name: "Silver", color: "#e3e4e5", slug: "silver" },
    ],
    frameImage: {
      nativeWidth: 1920,
      nativeHeight: 1265,
      nativeScreen: { x: 195, y: 138, width: 1529, height: 988 },
    },
  },
  {
    id: "macbook-air-15",
    name: "MacBook Air 15\"",
    category: "laptop",
    frame: { width: 600, height: 391 },
    screen: { x: 36, y: 22, width: 528, height: 343, borderRadius: 8 },
    style: {
      bezelColor: "#2c2c2e",
      bezelWidth: { top: 22, right: 36, bottom: 26, left: 36 },
      borderRadius: 12,
      hasNotch: false,
      hasDynamicIsland: false,
      hasHomeButton: false,
    },
    colorVariants: [
      { name: "Midnight", color: "#2c2c2e", slug: "midnight" },
    ],
    frameImage: {
      nativeWidth: 1800,
      nativeHeight: 1174,
      nativeScreen: { x: 184, y: 121, width: 1431, height: 930 },
    },
  },
]
