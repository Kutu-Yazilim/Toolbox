// Color API service - fetches data from free color APIs
// thecolorapi.com: color identification, schemes
// api.color.pizza: creative color names

import {
  rgbToLab,
  rgbToLch,
  rgbToLuv,
  rgbToHwb,
  rgbToXyz,
  rgbToHex,
  hslToRgb,
  getContrastRatio,
} from "@/utils/colorUtils"

export interface ColorApiResponse {
  hex: { value: string; clean: string }
  rgb: { r: number; g: number; b: number; value: string }
  hsl: { h: number; s: number; l: number; value: string }
  hsv: { h: number; s: number; v: number; value: string }
  cmyk: { c: number; m: number; y: number; k: number; value: string }
  XYZ: { X: number; Y: number; Z: number; value: string }
  name: { value: string; closest_named_hex: string; exact_match_name: boolean; distance: number }
  contrast: { value: string }
}

export interface ColorSchemeResponse {
  mode: string
  count: string
  colors: ColorApiResponse[]
  seed: ColorApiResponse
}

export interface ColorPizzaColor {
  name: string
  hex: string
  rgb: { r: number; g: number; b: number }
  hsl: { h: number; s: number; l: number }
  lab: { l: number; a: number; b: number }
  luminance: number
  luminanceWCAG: number
  bestContrast: string
  requestedHex: string
  distance: number
}

export interface ColorPizzaResponse {
  paletteTitle: string
  colors: ColorPizzaColor[]
}

const COLOR_API_BASE = "https://www.thecolorapi.com"
const COLOR_PIZZA_BASE = "https://api.color.pizza/v1"

export async function fetchColorInfo(hex: string): Promise<ColorApiResponse | null> {
  try {
    const clean = hex.replace("#", "")
    const res = await fetch(`${COLOR_API_BASE}/id?hex=${clean}`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function fetchColorScheme(
  hex: string,
  mode: string,
  count: number = 5
): Promise<ColorSchemeResponse | null> {
  try {
    const clean = hex.replace("#", "")
    const res = await fetch(`${COLOR_API_BASE}/scheme?hex=${clean}&mode=${mode}&count=${count}`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function fetchColorName(hex: string): Promise<ColorPizzaColor | null> {
  try {
    const clean = hex.replace("#", "")
    const res = await fetch(`${COLOR_PIZZA_BASE}/?values=${clean}`)
    if (!res.ok) return null
    const data: ColorPizzaResponse = await res.json()
    return data.colors?.[0] ?? null
  } catch {
    return null
  }
}

/**
 * Batch-fetch color names for multiple hex values in a single API call.
 * Returns a map of uppercase hex (with #) -> name.
 */
export async function fetchColorNames(hexes: string[]): Promise<Record<string, string>> {
  const result: Record<string, string> = {}
  if (hexes.length === 0) return result

  try {
    const values = hexes.map(h => h.replace("#", "")).join(",")
    const res = await fetch(`${COLOR_PIZZA_BASE}/?values=${values}`)
    if (!res.ok) return result
    const data: ColorPizzaResponse = await res.json()

    for (const color of data.colors) {
      const key = color.requestedHex.toUpperCase()
      result[key] = color.name
    }
  } catch {
    // Silently fail — the caller will use fallback names
  }

  return result
}

export type SchemeMode =
  | "analogic"
  | "complement"
  | "analogic-complement"
  | "triad"
  | "quad"
  | "monochrome"
  | "monochrome-dark"
  | "monochrome-light"

export interface ColorDetailData {
  // Names
  creativeName: string
  standardName: string
  exactMatch: boolean

  // Full conversions (from API)
  conversions: {
    hex: string
    rgb: string
    hsl: string
    cmyk: string
    lab: string
    xyz: string
    lch: string
    luv: string
    hwb: string
  }

  // Harmonies (colors from scheme API)
  harmonies: {
    analogous: string[]
    complementary: string[]
    splitComplementary: string[]
    triadic: string[]
    tetradic: string[]
    square: string[]
  }

  // Similar colors from color.pizza
  similarColors: Array<{ name: string; hex: string }>

  // Accessibility
  accessibility: {
    contrastOnWhite: number
    contrastOnBlack: number
    wcagWhite: { rating: string; score: string }
    wcagBlack: { rating: string; score: string }
    colorBlindSimilarity: number
    colorBlindRating: string
  }
}

function getWcagRating(ratio: number): { rating: string; score: string } {
  if (ratio >= 7) return { rating: "EXCELLENT", score: "5/5" }
  if (ratio >= 4.5) return { rating: "GOOD", score: "4/5" }
  if (ratio >= 3) return { rating: "GOOD", score: "3/5" }
  if (ratio >= 2) return { rating: "POOR", score: "2/5" }
  return { rating: "VERY POOR", score: "1/5" }
}

function calculateColorBlindSimilarity(hex: string): { similarity: number; rating: string } {
  // Calculate how similar the color appears across different color blindness types
  const clean = hex.replace("#", "")
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)

  // Simulate deuteranopia (most common)
  const simR = Math.round(0.625 * r + 0.375 * g)
  const simG = Math.round(0.7 * r + 0.3 * g)
  const simB = Math.round(0.3 * g + 0.7 * b)

  // Calculate distance between original and simulated
  const dist = Math.sqrt(
    Math.pow(r - simR, 2) + Math.pow(g - simG, 2) + Math.pow(b - simB, 2)
  )
  const maxDist = Math.sqrt(3 * 255 * 255)
  const similarity = Math.round((1 - dist / maxDist) * 100)

  let rating: string
  if (similarity < 50) rating = "EXCELLENT"
  else if (similarity < 65) rating = "GOOD"
  else if (similarity < 80) rating = "POOR"
  else rating = "VERY POOR"

  return { similarity, rating }
}

export async function fetchFullColorDetail(hex: string): Promise<ColorDetailData | null> {
  try {
    const clean = hex.replace("#", "")

    // Fetch all data in parallel
    const [colorInfo, pizzaName, analogic, complement, triad, quad] = await Promise.all([
      fetchColorInfo(clean),
      fetchColorName(clean),
      fetchColorScheme(clean, "analogic", 3),
      fetchColorScheme(clean, "complement", 2),
      fetchColorScheme(clean, "triad", 3),
      fetchColorScheme(clean, "quad", 4),
    ])

    if (!colorInfo) return null

    const rgb = { r: colorInfo.rgb.r, g: colorInfo.rgb.g, b: colorInfo.rgb.b }
    const lab = rgbToLab(rgb)
    const lch = rgbToLch(rgb)
    const luv = rgbToLuv(rgb)
    const hwb = rgbToHwb(rgb)
    const xyz = rgbToXyz(rgb)

    // Build harmonies
    const analogousColors = analogic?.colors.map(c => c.hex.value) ?? []
    const complementaryColors = complement?.colors.map(c => c.hex.value) ?? []
    const triadicColors = triad?.colors.map(c => c.hex.value) ?? []
    const tetradicColors = quad?.colors.map(c => c.hex.value) ?? []

    // Generate split complementary and square locally using hue offsets
    const hsl = { h: colorInfo.hsl.h, s: colorInfo.hsl.s, l: colorInfo.hsl.l }

    const splitComp = [150, 210].map(offset => {
      const newH = ((hsl.h + offset) % 360 + 360) % 360
      return rgbToHex(hslToRgb({ h: newH, s: hsl.s, l: hsl.l }))
    })

    const square = [90, 180, 270].map(offset => {
      const newH = ((hsl.h + offset) % 360 + 360) % 360
      return rgbToHex(hslToRgb({ h: newH, s: hsl.s, l: hsl.l }))
    })

    // Find similar colors by fetching nearby hex values
    const similarShifts = [
      { h: -5, s: 0, l: -3 },
      { h: 5, s: -5, l: 0 },
      { h: -3, s: 5, l: 2 },
      { h: 8, s: -3, l: -5 },
    ]

    const similarHexes = similarShifts.map(shift => {
      const newH = ((hsl.h + shift.h) % 360 + 360) % 360
      const newS = Math.max(0, Math.min(100, hsl.s + shift.s))
      const newL = Math.max(0, Math.min(100, hsl.l + shift.l))
      return rgbToHex(hslToRgb({ h: newH, s: newS, l: newL }))
    })

    // Fetch names for similar colors
    const similarNamePromises = similarHexes.map(h => fetchColorName(h))
    const similarNames = await Promise.all(similarNamePromises)

    const similarColors = similarHexes.map((h, i) => ({
      name: similarNames[i]?.name ?? "Similar",
      hex: h,
    }))

    // Accessibility
    const contrastOnWhite = getContrastRatio(`#${clean}`, "#FFFFFF")
    const contrastOnBlack = getContrastRatio(`#${clean}`, "#000000")
    const cbData = calculateColorBlindSimilarity(`#${clean}`)

    return {
      creativeName: pizzaName?.name ?? colorInfo.name.value,
      standardName: colorInfo.name.value,
      exactMatch: colorInfo.name.exact_match_name,

      conversions: {
        hex: clean.toUpperCase(),
        rgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`,
        hsl: `${colorInfo.hsl.h}, ${colorInfo.hsl.s}, ${colorInfo.hsl.l}`,
        cmyk: `${colorInfo.cmyk.c}, ${colorInfo.cmyk.m}, ${colorInfo.cmyk.y}, ${colorInfo.cmyk.k}`,
        lab: `${lab.l}, ${lab.a}, ${lab.b}`,
        xyz: `${xyz.x}, ${xyz.y}, ${xyz.z}`,
        lch: `${lch.l}, ${lch.c}, ${lch.h}`,
        luv: `${luv.l}, ${luv.u}, ${luv.v}`,
        hwb: `${hwb.h}, ${hwb.w}, ${hwb.b}`,
      },

      harmonies: {
        analogous: [`#${clean}`, ...analogousColors],
        complementary: [`#${clean}`, ...complementaryColors],
        splitComplementary: [`#${clean}`, ...splitComp],
        triadic: [`#${clean}`, ...triadicColors],
        tetradic: [`#${clean}`, ...tetradicColors],
        square: [`#${clean}`, ...square],
      },

      similarColors,

      accessibility: {
        contrastOnWhite: Math.round(contrastOnWhite * 100) / 100,
        contrastOnBlack: Math.round(contrastOnBlack * 100) / 100,
        wcagWhite: getWcagRating(contrastOnWhite),
        wcagBlack: getWcagRating(contrastOnBlack),
        colorBlindSimilarity: cbData.similarity,
        colorBlindRating: cbData.rating,
      },
    }
  } catch {
    return null
  }
}
