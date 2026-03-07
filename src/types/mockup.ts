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

// Device catalog - dimensions are in CSS pixels for preview rendering
export const DEVICE_CATALOG: DeviceSpec[] = [
  {
    id: "iphone-16-pro",
    name: "iPhone 16 Pro",
    category: "phone",
    frame: { width: 280, height: 572 },
    screen: { x: 12, y: 12, width: 256, height: 548, borderRadius: 38 },
    style: {
      bezelColor: "#1a1a1a",
      bezelWidth: { top: 12, right: 12, bottom: 12, left: 12 },
      borderRadius: 44,
      hasNotch: false,
      hasDynamicIsland: true,
      hasHomeButton: false,
    },
    colorVariants: [
      { name: "Black Titanium", color: "#1a1a1a" },
      { name: "White Titanium", color: "#f0ede8" },
      { name: "Natural Titanium", color: "#9a9692" },
      { name: "Desert Titanium", color: "#c2a672" },
    ],
  },
  {
    id: "iphone-16",
    name: "iPhone 16",
    category: "phone",
    frame: { width: 280, height: 572 },
    screen: { x: 12, y: 12, width: 256, height: 548, borderRadius: 38 },
    style: {
      bezelColor: "#1a1a1a",
      bezelWidth: { top: 12, right: 12, bottom: 12, left: 12 },
      borderRadius: 44,
      hasNotch: false,
      hasDynamicIsland: true,
      hasHomeButton: false,
    },
    colorVariants: [
      { name: "Black", color: "#1a1a1a" },
      { name: "White", color: "#f5f5f0" },
      { name: "Pink", color: "#f2c8cc" },
      { name: "Teal", color: "#b0d4ce" },
      { name: "Ultramarine", color: "#7a8db5" },
    ],
  },
  {
    id: "iphone-15",
    name: "iPhone 15",
    category: "phone",
    frame: { width: 280, height: 572 },
    screen: { x: 12, y: 12, width: 256, height: 548, borderRadius: 38 },
    style: {
      bezelColor: "#1a1a1a",
      bezelWidth: { top: 12, right: 12, bottom: 12, left: 12 },
      borderRadius: 44,
      hasNotch: false,
      hasDynamicIsland: true,
      hasHomeButton: false,
    },
    colorVariants: [
      { name: "Black", color: "#2c2c2e" },
      { name: "Blue", color: "#7d9fc0" },
      { name: "Green", color: "#c6d5b8" },
      { name: "Yellow", color: "#f0e2b0" },
      { name: "Pink", color: "#f2c8cc" },
    ],
  },
  {
    id: "galaxy-s24",
    name: "Galaxy S24",
    category: "phone",
    frame: { width: 268, height: 560 },
    screen: { x: 10, y: 10, width: 248, height: 540, borderRadius: 30 },
    style: {
      bezelColor: "#1a1a1a",
      bezelWidth: { top: 10, right: 10, bottom: 10, left: 10 },
      borderRadius: 36,
      hasNotch: false,
      hasDynamicIsland: false,
      hasHomeButton: false,
    },
    colorVariants: [
      { name: "Onyx Black", color: "#1a1a1a" },
      { name: "Marble Gray", color: "#b0afad" },
      { name: "Cobalt Violet", color: "#6a5d8e" },
      { name: "Amber Yellow", color: "#e0c878" },
    ],
  },
  {
    id: "ipad-pro-13",
    name: "iPad Pro 13\"",
    category: "tablet",
    frame: { width: 440, height: 600 },
    screen: { x: 16, y: 16, width: 408, height: 568, borderRadius: 16 },
    style: {
      bezelColor: "#1a1a1a",
      bezelWidth: { top: 16, right: 16, bottom: 16, left: 16 },
      borderRadius: 24,
      hasNotch: false,
      hasDynamicIsland: false,
      hasHomeButton: false,
    },
    colorVariants: [
      { name: "Space Black", color: "#1a1a1a" },
      { name: "Silver", color: "#e3e4e5" },
    ],
  },
  {
    id: "ipad-air-11",
    name: "iPad Air 11\"",
    category: "tablet",
    frame: { width: 380, height: 540 },
    screen: { x: 14, y: 14, width: 352, height: 512, borderRadius: 14 },
    style: {
      bezelColor: "#2c2c2e",
      bezelWidth: { top: 14, right: 14, bottom: 14, left: 14 },
      borderRadius: 22,
      hasNotch: false,
      hasDynamicIsland: false,
      hasHomeButton: false,
    },
    colorVariants: [
      { name: "Space Gray", color: "#2c2c2e" },
      { name: "Starlight", color: "#f0ede8" },
      { name: "Purple", color: "#b8a9d4" },
      { name: "Blue", color: "#7d9fc0" },
    ],
  },
  {
    id: "macbook-pro-16",
    name: "MacBook Pro 16\"",
    category: "laptop",
    frame: { width: 640, height: 400 },
    screen: { x: 40, y: 24, width: 560, height: 350, borderRadius: 8 },
    style: {
      bezelColor: "#1a1a1a",
      bezelWidth: { top: 24, right: 40, bottom: 26, left: 40 },
      borderRadius: 12,
      hasNotch: false,
      hasDynamicIsland: false,
      hasHomeButton: false,
    },
    colorVariants: [
      { name: "Space Black", color: "#1a1a1a" },
      { name: "Silver", color: "#e3e4e5" },
    ],
  },
  {
    id: "macbook-air-15",
    name: "MacBook Air 15\"",
    category: "laptop",
    frame: { width: 600, height: 380 },
    screen: { x: 36, y: 22, width: 528, height: 332, borderRadius: 8 },
    style: {
      bezelColor: "#2c2c2e",
      bezelWidth: { top: 22, right: 36, bottom: 26, left: 36 },
      borderRadius: 12,
      hasNotch: false,
      hasDynamicIsland: false,
      hasHomeButton: false,
    },
    colorVariants: [
      { name: "Midnight", color: "#2c2c2e" },
      { name: "Starlight", color: "#f0ede8" },
      { name: "Space Gray", color: "#7a7a7d" },
      { name: "Silver", color: "#e3e4e5" },
    ],
  },
]
