"use client"

import { Button } from "@/components/ui/button"
import { type PolygonPreset } from "@/utils/shapemakerPolygon"

interface PolygonConfigProps {
  sides: number
  isStar: boolean
  innerRadius: number
  preset: PolygonPreset | null
  onSidesChange: (sides: number) => void
  onStarToggle: (isStar: boolean) => void
  onInnerRadiusChange: (radius: number) => void
  onPresetSelect: (preset: PolygonPreset) => void
}

type PresetGroup = {
  label: string
  presets: { id: PolygonPreset; label: string }[]
}

const PRESET_GROUPS: PresetGroup[] = [
  {
    label: "Regular",
    presets: [
      { id: "triangle", label: "Tri" },
      { id: "square", label: "Sq" },
      { id: "pentagon", label: "Pent" },
      { id: "hexagon", label: "Hex" },
      { id: "octagon", label: "Oct" },
    ],
  },
  {
    label: "Stars",
    presets: [
      { id: "star-5", label: "5★" },
      { id: "star-6", label: "6★" },
      { id: "star-8", label: "8★" },
    ],
  },
  {
    label: "Custom",
    presets: [
      { id: "arrow", label: "Arrow" },
      { id: "cross", label: "Cross" },
      { id: "chevron", label: "Chev" },
      { id: "badge", label: "Badge" },
    ],
  },
]

const PRESET_SIDES: Record<PolygonPreset, number> = {
  triangle: 3,
  square: 4,
  pentagon: 5,
  hexagon: 6,
  octagon: 8,
  "star-5": 5,
  "star-6": 6,
  "star-8": 8,
  arrow: 3,
  cross: 4,
  chevron: 3,
  badge: 5,
}

const PRESET_IS_STAR: Record<PolygonPreset, boolean> = {
  triangle: false,
  square: false,
  pentagon: false,
  hexagon: false,
  octagon: false,
  "star-5": true,
  "star-6": true,
  "star-8": true,
  arrow: false,
  cross: false,
  chevron: false,
  badge: false,
}

export function PolygonConfig({
  sides,
  isStar,
  innerRadius,
  preset,
  onSidesChange,
  onStarToggle,
  onInnerRadiusChange,
  onPresetSelect,
}: PolygonConfigProps) {
  function handlePresetClick(p: PolygonPreset) {
    onPresetSelect(p)
    onSidesChange(PRESET_SIDES[p])
    onStarToggle(PRESET_IS_STAR[p])
  }

  return (
    <div className="flex flex-col gap-3 w-52 p-3 bg-popover border border-border rounded-lg shadow-md text-popover-foreground">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Sides</label>
          <span className="text-xs font-mono tabular-nums">{sides}</span>
        </div>
        <input
          type="range"
          min={3}
          max={12}
          value={sides}
          onChange={(e) => onSidesChange(Number(e.target.value))}
          className="w-full accent-primary"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="polygon-star-toggle"
          type="checkbox"
          checked={isStar}
          onChange={(e) => onStarToggle(e.target.checked)}
          className="accent-primary"
        />
        <label htmlFor="polygon-star-toggle" className="text-xs font-medium select-none cursor-pointer">
          Star
        </label>
      </div>

      {isStar && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">Inner radius</label>
            <span className="text-xs font-mono tabular-nums">{innerRadius}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={90}
            value={innerRadius}
            onChange={(e) => onInnerRadiusChange(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
      )}

      <div className="border-t border-border" />

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">Presets</span>
        {PRESET_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground/60">{group.label}</span>
            <div className="flex flex-wrap gap-1">
              {group.presets.map(({ id, label }) => (
                <Button
                  key={id}
                  variant={preset === id ? "default" : "outline"}
                  size="xs"
                  onClick={() => handlePresetClick(id)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
