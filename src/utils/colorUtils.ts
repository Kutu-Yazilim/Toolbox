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

// ── Extended Color Conversions (LAB, XYZ, LCH, LUV, HWB) ─────

export interface XYZ { x: number; y: number; z: number }
export interface LAB { l: number; a: number; b: number }
export interface LCH { l: number; c: number; h: number }
export interface LUV { l: number; u: number; v: number }
export interface HWB { h: number; w: number; b: number }

// D65 illuminant reference values
const REF_X = 95.047
const REF_Y = 100.0
const REF_Z = 108.883

export function rgbToXyz(rgb: RGB): XYZ {
  let r = rgb.r / 255
  let g = rgb.g / 255
  let b = rgb.b / 255

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92

  r *= 100; g *= 100; b *= 100

  return {
    x: Math.round(r * 0.4124564 + g * 0.3575761 + b * 0.1804375),
    y: Math.round(r * 0.2126729 + g * 0.7151522 + b * 0.0721750),
    z: Math.round(r * 0.0193339 + g * 0.1191920 + b * 0.9503041),
  }
}

export function rgbToLab(rgb: RGB): LAB {
  const xyz = rgbToXyz(rgb)
  let x = xyz.x / REF_X
  let y = xyz.y / REF_Y
  let z = xyz.z / REF_Z

  const epsilon = 0.008856
  const kappa = 903.3

  x = x > epsilon ? Math.cbrt(x) : (kappa * x + 16) / 116
  y = y > epsilon ? Math.cbrt(y) : (kappa * y + 16) / 116
  z = z > epsilon ? Math.cbrt(z) : (kappa * z + 16) / 116

  return {
    l: Math.round(116 * y - 16),
    a: Math.round(500 * (x - y)),
    b: Math.round(200 * (y - z)),
  }
}

export function rgbToLch(rgb: RGB): LCH {
  const lab = rgbToLab(rgb)
  const c = Math.sqrt(lab.a * lab.a + lab.b * lab.b)
  let h = Math.atan2(lab.b, lab.a) * (180 / Math.PI)
  if (h < 0) h += 360

  return {
    l: lab.l,
    c: Math.round(c),
    h: Math.round(h),
  }
}

export function rgbToLuv(rgb: RGB): LUV {
  const xyz = rgbToXyz(rgb)
  const yr = xyz.y / REF_Y
  const epsilon = 0.008856
  const kappa = 903.3

  const denom = xyz.x + 15 * xyz.y + 3 * xyz.z
  const denomR = REF_X + 15 * REF_Y + 3 * REF_Z

  if (denom === 0) return { l: 0, u: 0, v: 0 }

  const uPrime = (4 * xyz.x) / denom
  const vPrime = (9 * xyz.y) / denom
  const uPrimeR = (4 * REF_X) / denomR
  const vPrimeR = (9 * REF_Y) / denomR

  const L = yr > epsilon ? 116 * Math.cbrt(yr) - 16 : kappa * yr

  return {
    l: Math.round(L),
    u: Math.round(13 * L * (uPrime - uPrimeR)),
    v: Math.round(13 * L * (vPrime - vPrimeR)),
  }
}

export function rgbToHwb(rgb: RGB): HWB {
  const hsl = rgbToHsl(rgb)
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  const w = Math.min(r, g, b)
  const bk = 1 - Math.max(r, g, b)

  return {
    h: hsl.h,
    w: Math.round(w * 100),
    b: Math.round(bk * 100),
  }
}

// ── Color Psychology Data ──────────────────────────────────────

export interface ColorPsychologyData {
  description: string
  psychology: string[]
  meaning: string[]
  applications: string[]
}

export function getColorPsychology(hex: string): ColorPsychologyData {
  const rgb = hexToRgb(hex)
  const hsl = rgbToHsl(rgb)
  const { h, s, l } = hsl

  // Determine intensity modifiers
  const isVibrant = s > 60
  const isDark = l < 35
  const isLight = l > 70
  const isPastel = s < 50 && l > 60
  const isNeutral = s < 10

  // Base psychology by hue range
  let psych: ColorPsychologyData

  if (isNeutral) {
    if (l > 90) {
      psych = {
        description: "Pure and pristine shade embodying clarity, simplicity, and infinite possibility.",
        psychology: ["Creates Space", "Purifies", "Simplifies", "Refreshes"],
        meaning: ["Purity", "Clarity", "Simplicity", "Innocence", "Peace"],
        applications: ["Minimalist Design", "Healthcare", "Branding", "Typography", "Web Design"],
      }
    } else if (l > 60) {
      psych = {
        description: "Soft neutral tone conveying elegance, balance, and timeless sophistication.",
        psychology: ["Balances", "Soothes", "Neutralizes", "Grounds"],
        meaning: ["Balance", "Neutrality", "Sophistication", "Maturity", "Calm"],
        applications: ["UI Design", "Corporate", "Fashion", "Architecture", "Print"],
      }
    } else if (l > 30) {
      psych = {
        description: "Medium neutral shade suggesting stability, formality, and grounded composure.",
        psychology: ["Stabilizes", "Formalizes", "Grounds", "Balances"],
        meaning: ["Stability", "Formality", "Strength", "Wisdom", "Resilience"],
        applications: ["Corporate Design", "UI Elements", "Typography", "Architecture", "Print"],
      }
    } else {
      psych = {
        description: "Deep, commanding shade projecting power, elegance, and profound mystery.",
        psychology: ["Empowers", "Protects", "Commands", "Intensifies"],
        meaning: ["Power", "Elegance", "Mystery", "Authority", "Sophistication"],
        applications: ["Luxury Branding", "Fashion", "Typography", "Film", "Product Design"],
      }
    }
  } else if (h < 15 || h >= 345) {
    // Red
    psych = {
      description: isVibrant
        ? "Bold, energetic shade radiating passion, urgency, and unstoppable vitality."
        : "Warm, grounded red tone evoking comfort, heritage, and subtle strength.",
      psychology: ["Energizes", "Stimulates", "Excites", "Increases Heart Rate", "Draws Attention"],
      meaning: ["Passion", "Energy", "Love", "Power", "Urgency"],
      applications: ["Food & Beverage", "Sports Branding", "Sale Promotions", "Entertainment", "Automotive"],
    }
  } else if (h < 45) {
    // Orange
    psych = {
      description: isVibrant
        ? "Vibrant, enthusiastic shade bursting with warmth, creativity, and joyful confidence."
        : "Earthy, approachable tone carrying warmth, comfort, and natural friendliness.",
      psychology: ["Inspires Creativity", "Encourages", "Warms", "Uplifts", "Motivates"],
      meaning: ["Creativity", "Warmth", "Enthusiasm", "Adventure", "Friendliness"],
      applications: ["Food Industry", "Youth Brands", "Entertainment", "Creative Agencies", "E-commerce"],
    }
  } else if (h < 70) {
    // Yellow
    psych = {
      description: isVibrant
        ? "Bright, optimistic shade sparking joy, intellect, and radiant positivity."
        : "Gentle, warm tone whispering hope, softness, and delicate cheerfulness.",
      psychology: ["Uplifts Mood", "Stimulates Intellect", "Grabs Attention", "Inspires Optimism"],
      meaning: ["Happiness", "Optimism", "Intellect", "Energy", "Warmth"],
      applications: ["Retail", "Food Packaging", "Children's Products", "Signage", "Creative Design"],
    }
  } else if (h < 150) {
    // Green
    psych = {
      description: isDark
        ? "Deep, lush shade embodying growth, wealth, and natural sophistication."
        : isLight
          ? "Fresh, rejuvenating tone reflecting renewal, health, and organic harmony."
          : "Balanced, natural shade promoting growth, harmony, and restorative peace.",
      psychology: ["Restores Balance", "Soothes", "Promotes Growth", "Encourages Harmony", "Refreshes"],
      meaning: ["Growth", "Nature", "Health", "Balance", "Renewal"],
      applications: ["Health & Wellness", "Organic Products", "Finance", "Environmental", "Logos"],
    }
  } else if (h < 195) {
    // Teal / Cyan
    psych = {
      description: isVibrant
        ? "Vivid aquatic shade mirroring the open sea, evokes wanderlust, exploration, and boundless inspiration."
        : "Calm, sophisticated tone blending serenity with clarity and refined communication.",
      psychology: ["Awakens Curiosity", "Soothes", "Stimulates Innovation", "Imparts Calm", "Encourages Flow"],
      meaning: ["Freedom", "Movement", "Discovery", "Depth", "Openness"],
      applications: ["Travel Design", "Product Packaging", "Creative Direction", "Logos", "Environmental Graphics"],
    }
  } else if (h < 260) {
    // Blue
    psych = {
      description: isDark
        ? "Deep, authoritative shade commanding trust, loyalty, and unwavering confidence."
        : isLight
          ? "Airy, serene tone reflecting tranquility, clarity, and gentle reassurance."
          : "Steadfast, reliable shade inspiring trust, stability, and calm intelligence.",
      psychology: ["Builds Trust", "Calms", "Enhances Focus", "Inspires Confidence", "Promotes Loyalty"],
      meaning: ["Trust", "Stability", "Intelligence", "Loyalty", "Depth"],
      applications: ["Corporate Branding", "Technology", "Finance", "Healthcare", "Social Media"],
    }
  } else if (h < 290) {
    // Purple / Indigo
    psych = {
      description: isVibrant
        ? "Majestic, creative shade radiating luxury, imagination, and artistic brilliance."
        : "Subtle, mysterious tone weaving wisdom, introspection, and quiet dignity.",
      psychology: ["Inspires Imagination", "Elevates", "Mystifies", "Encourages Contemplation"],
      meaning: ["Royalty", "Luxury", "Creativity", "Wisdom", "Mystery"],
      applications: ["Luxury Brands", "Beauty Products", "Art & Culture", "Spiritual", "Fashion"],
    }
  } else if (h < 345) {
    // Pink / Magenta
    psych = {
      description: isVibrant
        ? "Bold, expressive shade pulsing with energy, romance, and daring individuality."
        : isPastel
          ? "Soft, tender tone radiating gentleness, warmth, and nurturing compassion."
          : "Warm, playful shade celebrating romance, creativity, and joyful expression.",
      psychology: ["Nurtures", "Inspires Romance", "Softens", "Energizes", "Comforts"],
      meaning: ["Love", "Compassion", "Playfulness", "Femininity", "Tenderness"],
      applications: ["Beauty & Cosmetics", "Fashion", "Wedding Design", "Children's Products", "Branding"],
    }
  } else {
    psych = {
      description: "Distinctive shade with a unique character, blending multiple color influences.",
      psychology: ["Intrigues", "Balances", "Inspires"],
      meaning: ["Uniqueness", "Complexity", "Balance"],
      applications: ["Creative Design", "Branding", "Art"],
    }
  }

  // Modify description based on lightness/saturation
  if (isPastel && !isNeutral) {
    psych.description = psych.description.replace(/Bold|Vibrant|Vivid|Deep|Majestic/, "Soft, delicate")
    psych.psychology = [...psych.psychology.slice(0, 3), "Softens", "Comforts"]
  }

  return psych
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
