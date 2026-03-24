import { useState, useMemo, useCallback } from "react"
import { CopyIcon, CheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RGB = { r: number; g: number; b: number }
type HSL = { h: number; s: number; l: number }
type HSB = { h: number; s: number; b: number }
type CMYK = { c: number; m: number; y: number; k: number }

type FormatResult = {
  label: string
  value: string
}

// ---------------------------------------------------------------------------
// Conversion functions (pure, outside component)
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): RGB | null {
  const clean = hex.replace(/^#/, "")
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  }
}

function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0")
      .toUpperCase()
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`
}

function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

function hslToRgb(hsl: HSL): RGB {
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

function rgbToHsb(rgb: RGB): HSB {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  const brightness = max
  const saturation = max === 0 ? 0 : d / max
  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(saturation * 100),
    b: Math.round(brightness * 100),
  }
}

function rgbToCmyk(rgb: RGB): CMYK {
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

function parseColor(input: string): RGB | null {
  const trimmed = input.trim()

  // Try HEX
  const hexMatch = trimmed.match(/^#?([0-9a-fA-F]{6})$/)
  if (hexMatch) return hexToRgb(hexMatch[1])

  // Try RGB
  const rgbMatch = trimmed.match(
    /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i,
  )
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10)
    const g = parseInt(rgbMatch[2], 10)
    const b = parseInt(rgbMatch[3], 10)
    if (r <= 255 && g <= 255 && b <= 255) return { r, g, b }
    return null
  }

  // Try HSL
  const hslMatch = trimmed.match(
    /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/i,
  )
  if (hslMatch) {
    const h = parseInt(hslMatch[1], 10)
    const s = parseInt(hslMatch[2], 10)
    const l = parseInt(hslMatch[3], 10)
    if (h <= 360 && s <= 100 && l <= 100) return hslToRgb({ h, s, l })
    return null
  }

  return null
}

// ---------------------------------------------------------------------------
// Format output helpers
// ---------------------------------------------------------------------------

function getAllFormats(rgb: RGB): FormatResult[] {
  const hsl = rgbToHsl(rgb)
  const hsb = rgbToHsb(rgb)
  const cmyk = rgbToCmyk(rgb)
  return [
    { label: "HEX", value: rgbToHex(rgb) },
    { label: "RGB", value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
    { label: "HSL", value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
    { label: "HSB", value: `hsb(${hsb.h}, ${hsb.s}%, ${hsb.b}%)` },
    {
      label: "CMYK",
      value: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`,
    },
  ]
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_INPUT = "#3B82F6"

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ColorFormatConverter() {
  const [input, setInput] = useState(DEFAULT_INPUT)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  const parsed = useMemo(() => parseColor(input), [input])
  const formats = useMemo(() => (parsed ? getAllFormats(parsed) : null), [parsed])
  const hexForPreview = useMemo(() => (parsed ? rgbToHex(parsed) : null), [parsed])

  const hasInput = input.trim().length > 0

  const handleCopy = useCallback(
    (value: string, idx: number) => {
      navigator.clipboard.writeText(value)
      setCopiedIdx(idx)
      setTimeout(() => setCopiedIdx(null), 1500)
    },
    [],
  )

  return (
    <div className="flex h-full flex-col">
      {/* Top section */}
      <div className="flex-shrink-0 border-b border-border p-4">
        <div className="flex items-center gap-4">
          {/* Color swatch */}
          <div
            className="h-12 w-12 flex-shrink-0 rounded-lg border border-border"
            style={{
              backgroundColor: hexForPreview ?? "transparent",
            }}
          />
          {/* Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. #3B82F6, rgb(59,130,246), hsl(217,91%,60%)"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-muted-foreground"
          />
        </div>
        {/* Error message */}
        {hasInput && !parsed && (
          <p className="mt-2 text-sm text-destructive">
            Unable to parse color. Supported formats: HEX, RGB, HSL.
          </p>
        )}
      </div>

      {/* Bottom section */}
      <div className="flex-1 overflow-y-auto p-4">
        {!hasInput && (
          <p className="text-sm text-muted-foreground">
            Enter a color to see all formats
          </p>
        )}
        {formats && (
          <div className="space-y-3">
            {formats.map((f, idx) => (
              <div
                key={f.label}
                className="flex items-center justify-between rounded-lg border border-border bg-background/50 px-4 py-3"
              >
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {f.label}
                  </p>
                  <p className="mt-0.5 font-mono text-sm text-foreground">
                    {f.value}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => handleCopy(f.value, idx)}
                >
                  {copiedIdx === idx ? (
                    <CheckIcon className="h-4 w-4 text-green-400" />
                  ) : (
                    <CopyIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
