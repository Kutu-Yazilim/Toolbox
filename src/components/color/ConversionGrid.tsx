"use client"

import { useState } from "react"
import { CopyIcon, CheckIcon } from "lucide-react"
import {
  hexToRgb,
  rgbToHsl,
  rgbToCmyk,
  rgbToLab,
  rgbToXyz,
  rgbToLch,
  rgbToLuv,
  rgbToHwb,
} from "@/utils/colorUtils"
import type { ColorDetailData } from "@/services/colorApi"

interface ConversionGridProps {
  data: ColorDetailData | null
  hex: string
}

const CONVERSION_FORMATS = [
  "HEX", "RGB", "HSL", "CMYK", "LAB", "LCH", "XYZ", "LUV", "HWB",
] as const

type ConversionKey = Lowercase<(typeof CONVERSION_FORMATS)[number]>

export function ConversionGrid({ data, hex }: ConversionGridProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = (value: string, field: string) => {
    navigator.clipboard.writeText(value)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 1500)
  }

  if (data) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {CONVERSION_FORMATS.map((label) => {
          const key = label.toLowerCase() as ConversionKey
          const value = data.conversions[key]
          return (
            <ConversionCard
              key={key}
              label={label}
              value={value}
              onCopy={() => copyToClipboard(value, key)}
              copied={copiedField === key}
            />
          )
        })}
      </div>
    )
  }

  return <FallbackConversions hex={hex} />
}

function ConversionCard({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string
  value: string
  onCopy: () => void
  copied: boolean
}) {
  return (
    <button
      onClick={onCopy}
      className="flex flex-col gap-1 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left group"
      title={`Copy ${label}`}
    >
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span className="text-xs font-bold text-foreground font-mono truncate w-full">
        {copied ? "Copied!" : value}
      </span>
    </button>
  )
}

function FallbackConversions({ hex }: { hex: string }) {
  const rgb = hexToRgb(hex)
  const hsl = rgbToHsl(rgb)
  const cmyk = rgbToCmyk(rgb)
  const lab = rgbToLab(rgb)
  const xyz = rgbToXyz(rgb)
  const lch = rgbToLch(rgb)
  const luv = rgbToLuv(rgb)
  const hwb = rgbToHwb(rgb)

  const fallbackValues: Record<ConversionKey, string> = {
    hex: hex.replace("#", "").toUpperCase(),
    rgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`,
    hsl: `${hsl.h}, ${hsl.s}, ${hsl.l}`,
    cmyk: `${cmyk.c}, ${cmyk.m}, ${cmyk.y}, ${cmyk.k}`,
    lab: `${lab.l}, ${lab.a}, ${lab.b}`,
    lch: `${lch.l}, ${lch.c}, ${lch.h}`,
    xyz: `${xyz.x}, ${xyz.y}, ${xyz.z}`,
    luv: `${luv.l}, ${luv.u}, ${luv.v}`,
    hwb: `${hwb.h}, ${hwb.w}, ${hwb.b}`,
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {CONVERSION_FORMATS.map((label) => {
        const key = label.toLowerCase() as ConversionKey
        return (
          <ConversionCard
            key={key}
            label={label}
            value={fallbackValues[key]}
            onCopy={() => {}}
            copied={false}
          />
        )
      })}
    </div>
  )
}
