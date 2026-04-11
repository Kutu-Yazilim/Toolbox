"use client"

import { useState } from "react"
import { getContrastTextColor, generateShades } from "@/utils/colorUtils"

interface ShadeGridProps {
  hex: string
  onSelectColor?: (hex: string) => void
}

const SHADE_COUNT = 12

export function ShadeGrid({ hex, onSelectColor }: ShadeGridProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const shades = generateShades(hex, SHADE_COUNT)

  const handleClick = (shade: string, index: number) => {
    navigator.clipboard.writeText(shade)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 1500)
    onSelectColor?.(shade)
  }

  return (
    <div className="bg-muted/50 rounded-xl p-3">
      <div className="flex gap-0.5 h-10 rounded-lg overflow-hidden">
        {shades.map((shade, i) => (
          <button
            key={i}
            className="flex-1 transition-all hover:flex-[2] group relative"
            style={{ backgroundColor: shade }}
            onClick={() => handleClick(shade, i)}
            title={shade}
          >
            <span
              className="absolute inset-0 flex items-center justify-center text-[8px] font-mono opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: getContrastTextColor(shade) }}
            >
              {copiedIndex === i ? "\u2713" : ""}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
