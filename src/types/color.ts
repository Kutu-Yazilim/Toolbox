export interface RGB {
  r: number
  g: number
  b: number
}

export interface HSL {
  h: number
  s: number
  l: number
}

export interface HSB {
  h: number
  s: number
  b: number
}

export interface CMYK {
  c: number
  m: number
  y: number
  k: number
}

export interface PaletteColor {
  id: string
  hex: string
  locked: boolean
}

export type ColorHarmony =
  | "random"
  | "complementary"
  | "analogous"
  | "triadic"
  | "split-complementary"
  | "tetradic"
  | "monochromatic"

export type ColorBlindnessType =
  | "normal"
  | "protanopia"
  | "deuteranopia"
  | "tritanopia"
  | "achromatopsia"

export type ExportFormat =
  | "png"
  | "pdf"
  | "json"
  | "dart"
  | "css"
  | "scss"
  | "tailwind"
  | "svg"
  | "url"
