import type { RGB, HSL, HSB, CMYK, PaletteColor, ColorHarmony, ColorBlindnessType } from "@/types/color"

// ── ID Generation ──────────────────────────────────────────────

let idCounter = 0
export function generateId(): string {
  return `color-${Date.now()}-${idCounter++}`
}

// ── Color Conversions ──────────────────────────────────────────

export function hexToRgb(hex: string): RGB {
  const clean = hex.replace("#", "")
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  }
}

export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0")
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase()
}

export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360
  const s = hsl.s / 100
  const l = hsl.l / 100

  if (s === 0) {
    const v = Math.round(l * 255)
    return { r: v, g: v, b: v }
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t
    if (tt < 0) tt += 1
    if (tt > 1) tt -= 1
    if (tt < 1 / 6) return p + (q - p) * 6 * tt
    if (tt < 1 / 2) return q
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
    return p
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  }
}

export function rgbToHsb(rgb: RGB): HSB {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0

  if (d !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round((max === 0 ? 0 : d / max) * 100),
    b: Math.round(max * 100),
  }
}

export function hsbToRgb(hsb: HSB): RGB {
  const h = hsb.h / 360
  const s = hsb.s / 100
  const v = hsb.b / 100
  const i = Math.floor(h * 6)
  const f = h * 6 - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)

  let r = 0, g = 0, b = 0
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break
    case 1: r = q; g = v; b = p; break
    case 2: r = p; g = v; b = t; break
    case 3: r = p; g = q; b = v; break
    case 4: r = t; g = p; b = v; break
    case 5: r = v; g = p; b = q; break
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

export function rgbToCmyk(rgb: RGB): CMYK {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  const k = 1 - Math.max(r, g, b)

  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 }

  return {
    c: Math.round(((1 - r - k) / (1 - k)) * 100),
    m: Math.round(((1 - g - k) / (1 - k)) * 100),
    y: Math.round(((1 - b - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  }
}

// ── Contrast & Luminance ───────────────────────────────────────

export function relativeLuminance(rgb: RGB): number {
  const [rs, gs, bs] = [rgb.r, rgb.g, rgb.b].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hexToRgb(hex1))
  const l2 = relativeLuminance(hexToRgb(hex2))
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export function getContrastTextColor(hex: string): string {
  const lum = relativeLuminance(hexToRgb(hex))
  return lum > 0.179 ? "#000000" : "#FFFFFF"
}

export function meetsWCAG_AA(ratio: number, isLargeText = false): boolean {
  return isLargeText ? ratio >= 3 : ratio >= 4.5
}

export function meetsWCAG_AAA(ratio: number, isLargeText = false): boolean {
  return isLargeText ? ratio >= 4.5 : ratio >= 7
}

// ── Color Generation ───────────────────────────────────────────

export function generateRandomHex(): string {
  const h = Math.random() * 360
  const s = 40 + Math.random() * 50 // 40-90% saturation
  const l = 30 + Math.random() * 45 // 30-75% lightness
  return rgbToHex(hslToRgb({ h: Math.round(h), s: Math.round(s), l: Math.round(l) }))
}

export function generateRandomPalette(count: number): PaletteColor[] {
  // Generate colors with good distribution across the hue spectrum
  const baseHue = Math.random() * 360
  const colors: PaletteColor[] = []

  for (let i = 0; i < count; i++) {
    const hueShift = (360 / count) * i + (Math.random() * 40 - 20)
    const h = (baseHue + hueShift) % 360
    const s = 35 + Math.random() * 55
    const l = 25 + Math.random() * 55
    colors.push({
      id: generateId(),
      hex: rgbToHex(hslToRgb({ h: Math.round(h), s: Math.round(s), l: Math.round(l) })),
      locked: false,
    })
  }

  return colors
}

// ── Color Harmonies ────────────────────────────────────────────

function harmonyColors(baseHex: string, hueOffsets: number[]): string[] {
  const hsl = rgbToHsl(hexToRgb(baseHex))
  return hueOffsets.map((offset) => {
    const newH = ((hsl.h + offset) % 360 + 360) % 360
    const sVariation = Math.max(20, Math.min(100, hsl.s + (Math.random() * 20 - 10)))
    const lVariation = Math.max(20, Math.min(85, hsl.l + (Math.random() * 20 - 10)))
    return rgbToHex(hslToRgb({ h: Math.round(newH), s: Math.round(sVariation), l: Math.round(lVariation) }))
  })
}

export function generateHarmony(harmony: ColorHarmony, count: number, baseHex?: string): string[] {
  const base = baseHex || generateRandomHex()

  switch (harmony) {
    case "complementary": {
      const colors = [base, ...harmonyColors(base, [180])]
      // Fill remaining with variations
      while (colors.length < count) {
        const src = colors[colors.length % 2 === 0 ? 0 : 1]
        const hsl = rgbToHsl(hexToRgb(src))
        const l = Math.max(20, Math.min(85, hsl.l + (Math.random() * 30 - 15)))
        colors.push(rgbToHex(hslToRgb({ ...hsl, l: Math.round(l) })))
      }
      return colors.slice(0, count)
    }
    case "analogous": {
      const step = 30
      const offsets = Array.from({ length: count - 1 }, (_, i) => step * (i + 1) - step * Math.floor(count / 2))
      return [base, ...harmonyColors(base, offsets)].slice(0, count)
    }
    case "triadic": {
      const colors = [base, ...harmonyColors(base, [120, 240])]
      while (colors.length < count) {
        const src = colors[colors.length % 3]
        const hsl = rgbToHsl(hexToRgb(src))
        const l = Math.max(20, Math.min(85, hsl.l + (Math.random() * 30 - 15)))
        colors.push(rgbToHex(hslToRgb({ ...hsl, l: Math.round(l) })))
      }
      return colors.slice(0, count)
    }
    case "split-complementary": {
      const colors = [base, ...harmonyColors(base, [150, 210])]
      while (colors.length < count) {
        const src = colors[colors.length % 3]
        const hsl = rgbToHsl(hexToRgb(src))
        const l = Math.max(20, Math.min(85, hsl.l + (Math.random() * 30 - 15)))
        colors.push(rgbToHex(hslToRgb({ ...hsl, l: Math.round(l) })))
      }
      return colors.slice(0, count)
    }
    case "tetradic": {
      const colors = [base, ...harmonyColors(base, [90, 180, 270])]
      while (colors.length < count) {
        const src = colors[colors.length % 4]
        const hsl = rgbToHsl(hexToRgb(src))
        const l = Math.max(20, Math.min(85, hsl.l + (Math.random() * 30 - 15)))
        colors.push(rgbToHex(hslToRgb({ ...hsl, l: Math.round(l) })))
      }
      return colors.slice(0, count)
    }
    case "monochromatic": {
      const hsl = rgbToHsl(hexToRgb(base))
      const colors: string[] = []
      const lStep = 65 / (count - 1 || 1)
      for (let i = 0; i < count; i++) {
        const l = 15 + lStep * i
        const s = Math.max(20, Math.min(100, hsl.s + (Math.random() * 10 - 5)))
        colors.push(rgbToHex(hslToRgb({ h: hsl.h, s: Math.round(s), l: Math.round(l) })))
      }
      return colors
    }
    case "random":
    default:
      return generateRandomPalette(count).map((c) => c.hex)
  }
}

// ── Palette Adjustments ────────────────────────────────────────

export function adjustPaletteHue(colors: PaletteColor[], amount: number): PaletteColor[] {
  return colors.map((color) => {
    if (color.locked) return color
    const hsl = rgbToHsl(hexToRgb(color.hex))
    const newH = ((hsl.h + amount) % 360 + 360) % 360
    return { ...color, hex: rgbToHex(hslToRgb({ ...hsl, h: newH })) }
  })
}

export function adjustPaletteSaturation(colors: PaletteColor[], amount: number): PaletteColor[] {
  return colors.map((color) => {
    if (color.locked) return color
    const hsl = rgbToHsl(hexToRgb(color.hex))
    const newS = Math.max(0, Math.min(100, hsl.s + amount))
    return { ...color, hex: rgbToHex(hslToRgb({ ...hsl, s: Math.round(newS) })) }
  })
}

export function adjustPaletteBrightness(colors: PaletteColor[], amount: number): PaletteColor[] {
  return colors.map((color) => {
    if (color.locked) return color
    const hsl = rgbToHsl(hexToRgb(color.hex))
    const newL = Math.max(0, Math.min(100, hsl.l + amount))
    return { ...color, hex: rgbToHex(hslToRgb({ ...hsl, l: Math.round(newL) })) }
  })
}

export function adjustPaletteTemperature(colors: PaletteColor[], amount: number): PaletteColor[] {
  return colors.map((color) => {
    if (color.locked) return color
    const rgb = hexToRgb(color.hex)
    // Warm: increase red, decrease blue. Cool: increase blue, decrease red.
    const newR = Math.max(0, Math.min(255, rgb.r + amount * 2))
    const newB = Math.max(0, Math.min(255, rgb.b - amount * 2))
    return { ...color, hex: rgbToHex({ r: Math.round(newR), g: rgb.g, b: Math.round(newB) }) }
  })
}

// ── Gradient Between Colors ────────────────────────────────────

export function blendColors(hex1: string, hex2: string, ratio: number): string {
  const rgb1 = hexToRgb(hex1)
  const rgb2 = hexToRgb(hex2)
  return rgbToHex({
    r: Math.round(rgb1.r + (rgb2.r - rgb1.r) * ratio),
    g: Math.round(rgb1.g + (rgb2.g - rgb1.g) * ratio),
    b: Math.round(rgb1.b + (rgb2.b - rgb1.b) * ratio),
  })
}

// ── Color Blindness Simulation ─────────────────────────────────

// Using Brettel/Viénot color blindness simulation matrices
const colorBlindnessMatrices: Record<Exclude<ColorBlindnessType, "normal">, number[][]> = {
  protanopia: [
    [0.567, 0.433, 0.0],
    [0.558, 0.442, 0.0],
    [0.0, 0.242, 0.758],
  ],
  deuteranopia: [
    [0.625, 0.375, 0.0],
    [0.7, 0.3, 0.0],
    [0.0, 0.3, 0.7],
  ],
  tritanopia: [
    [0.95, 0.05, 0.0],
    [0.0, 0.433, 0.567],
    [0.0, 0.475, 0.525],
  ],
  achromatopsia: [
    [0.299, 0.587, 0.114],
    [0.299, 0.587, 0.114],
    [0.299, 0.587, 0.114],
  ],
}

export function simulateColorBlindness(hex: string, type: ColorBlindnessType): string {
  if (type === "normal") return hex
  const rgb = hexToRgb(hex)
  const matrix = colorBlindnessMatrices[type]
  return rgbToHex({
    r: Math.round(matrix[0][0] * rgb.r + matrix[0][1] * rgb.g + matrix[0][2] * rgb.b),
    g: Math.round(matrix[1][0] * rgb.r + matrix[1][1] * rgb.g + matrix[1][2] * rgb.b),
    b: Math.round(matrix[2][0] * rgb.r + matrix[2][1] * rgb.g + matrix[2][2] * rgb.b),
  })
}

// ── Color Name (approximate) ───────────────────────────────────

const namedColors: [string, string][] = [
  ["#FF0000", "Red"], ["#FF4500", "Orange Red"], ["#FF6347", "Tomato"],
  ["#FF7F50", "Coral"], ["#FFA500", "Orange"], ["#FFD700", "Gold"],
  ["#FFFF00", "Yellow"], ["#ADFF2F", "Green Yellow"], ["#7FFF00", "Chartreuse"],
  ["#00FF00", "Green"], ["#00FA9A", "Medium Spring Green"], ["#00FFFF", "Cyan"],
  ["#00CED1", "Dark Turquoise"], ["#1E90FF", "Dodger Blue"], ["#0000FF", "Blue"],
  ["#4B0082", "Indigo"], ["#8A2BE2", "Blue Violet"], ["#9400D3", "Dark Violet"],
  ["#FF00FF", "Magenta"], ["#FF1493", "Deep Pink"], ["#FF69B4", "Hot Pink"],
  ["#FFC0CB", "Pink"], ["#FFFFFF", "White"], ["#C0C0C0", "Silver"],
  ["#808080", "Gray"], ["#000000", "Black"], ["#800000", "Maroon"],
  ["#808000", "Olive"], ["#008000", "Dark Green"], ["#008080", "Teal"],
  ["#000080", "Navy"], ["#800080", "Purple"], ["#A52A2A", "Brown"],
  ["#DEB887", "Burlywood"], ["#D2691E", "Chocolate"], ["#F5DEB3", "Wheat"],
  ["#FAEBD7", "Antique White"], ["#FAF0E6", "Linen"], ["#FFF5EE", "Seashell"],
  ["#F0FFF0", "Honeydew"], ["#F0FFFF", "Azure"], ["#F5F5DC", "Beige"],
  ["#2F4F4F", "Dark Slate Gray"], ["#556B2F", "Dark Olive Green"],
  ["#8B4513", "Saddle Brown"], ["#B22222", "Firebrick"],
  ["#CD853F", "Peru"], ["#DAA520", "Goldenrod"],
  ["#4682B4", "Steel Blue"], ["#6A5ACD", "Slate Blue"],
]

export function getApproximateColorName(hex: string): string {
  const rgb = hexToRgb(hex)
  let minDist = Infinity
  let closestName = "Unknown"

  for (const [namedHex, name] of namedColors) {
    const namedRgb = hexToRgb(namedHex)
    const dist = Math.sqrt(
      Math.pow(rgb.r - namedRgb.r, 2) +
      Math.pow(rgb.g - namedRgb.g, 2) +
      Math.pow(rgb.b - namedRgb.b, 2)
    )
    if (dist < minDist) {
      minDist = dist
      closestName = name
    }
  }

  return closestName
}

// ── Shade Generation ──────────────────────────────────────────

export function generateShades(hex: string, count = 25): string[] {
  const hsl = rgbToHsl(hexToRgb(hex))
  const shades: string[] = []

  for (let i = 0; i < count; i++) {
    // Spread evenly from lightness ~97 down to ~3
    const l = Math.round(97 - (94 / (count - 1)) * i)
    shades.push(rgbToHex(hslToRgb({ h: hsl.h, s: hsl.s, l })))
  }

  return shades
}

// ── Hex Validation ─────────────────────────────────────────────

export function isValidHex(hex: string): boolean {
  return /^#?[0-9A-Fa-f]{6}$/.test(hex)
}

export function normalizeHex(hex: string): string {
  const clean = hex.replace("#", "").toUpperCase()
  if (clean.length === 3) {
    return `#${clean[0]}${clean[0]}${clean[1]}${clean[1]}${clean[2]}${clean[2]}`
  }
  return `#${clean}`
}
