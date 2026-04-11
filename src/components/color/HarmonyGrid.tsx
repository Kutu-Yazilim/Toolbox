"use client"

import type { ColorDetailData } from "@/services/colorApi"

interface HarmonyGridProps {
  harmonies: ColorDetailData["harmonies"]
  onSelectColor?: (hex: string) => void
}

const HARMONY_TYPES = [
  { key: "analogous", label: "Analogous" },
  { key: "complementary", label: "Complementary" },
  { key: "splitComplementary", label: "Split Complementary" },
  { key: "triadic", label: "Triadic" },
  { key: "tetradic", label: "Tetradic" },
  { key: "square", label: "Square" },
] as const

type HarmonyKey = (typeof HARMONY_TYPES)[number]["key"]

export function HarmonyGrid({ harmonies, onSelectColor }: HarmonyGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {HARMONY_TYPES.map(({ key, label }) => (
        <HarmonyCard
          key={key}
          label={label}
          colors={harmonies[key as HarmonyKey]}
          onSelect={onSelectColor}
        />
      ))}
    </div>
  )
}

function HarmonyCard({
  label,
  colors,
  onSelect,
}: {
  label: string
  colors: string[]
  onSelect?: (hex: string) => void
}) {
  return (
    <div className="p-3 rounded-xl bg-muted/50">
      <span className="text-[11px] font-medium text-foreground mb-2 block">{label}</span>
      <div className="flex gap-1">
        {colors.slice(0, 5).map((color, i) => (
          <button
            key={i}
            className="w-8 h-8 rounded-md shadow-sm hover:scale-110 transition-transform border border-black/5"
            style={{ backgroundColor: color }}
            onClick={() => onSelect?.(color)}
            title={color}
          />
        ))}
      </div>
    </div>
  )
}
