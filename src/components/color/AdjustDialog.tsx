"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  adjustPaletteHue,
  adjustPaletteSaturation,
  adjustPaletteBrightness,
  adjustPaletteTemperature,
  getContrastTextColor,
} from "@/utils/colorUtils"
import type { PaletteColor } from "@/types/color"
import { XIcon, RotateCcwIcon } from "lucide-react"

interface AdjustDialogProps {
  colors: PaletteColor[]
  onApply: (colors: PaletteColor[]) => void
  onClose: () => void
}

export function AdjustDialog({ colors, onApply, onClose }: AdjustDialogProps) {
  const [hue, setHue] = useState(0)
  const [saturation, setSaturation] = useState(0)
  const [brightness, setBrightness] = useState(0)
  const [temperature, setTemperature] = useState(0)

  const getPreview = useCallback((): PaletteColor[] => {
    let preview = colors
    if (hue !== 0) preview = adjustPaletteHue(preview, hue)
    if (saturation !== 0) preview = adjustPaletteSaturation(preview, saturation)
    if (brightness !== 0) preview = adjustPaletteBrightness(preview, brightness)
    if (temperature !== 0) preview = adjustPaletteTemperature(preview, temperature)
    return preview
  }, [colors, hue, saturation, brightness, temperature])

  const preview = getPreview()

  const reset = () => {
    setHue(0)
    setSaturation(0)
    setBrightness(0)
    setTemperature(0)
  }

  const apply = () => {
    onApply(getPreview())
    onClose()
  }

  const sliderClass = "w-full h-2 rounded-full appearance-none cursor-pointer bg-muted [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:shadow-md"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Adjust Palette</h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-xs" onClick={reset} title="Reset adjustments">
              <RotateCcwIcon className="size-4" />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={onClose}>
              <XIcon className="size-4" />
            </Button>
          </div>
        </div>

        {/* Preview bar */}
        <div className="flex h-20 mx-6 mt-4 rounded-lg overflow-hidden border border-border">
          {preview.map((c) => (
            <div
              key={c.id}
              className="flex-1 flex items-end justify-center pb-1.5"
              style={{ backgroundColor: c.hex }}
            >
              <span
                className="text-[10px] font-mono font-medium"
                style={{ color: getContrastTextColor(c.hex) }}
              >
                {c.hex}
              </span>
            </div>
          ))}
        </div>

        {/* Sliders */}
        <div className="px-6 py-4 flex flex-col gap-5">
          {/* Hue */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Hue</label>
              <span className="text-xs text-muted-foreground font-mono">{hue > 0 ? `+${hue}` : hue}°</span>
            </div>
            <input
              type="range"
              min={-180}
              max={180}
              value={hue}
              onChange={(e) => setHue(parseInt(e.target.value))}
              className={sliderClass}
              style={{
                background: `linear-gradient(to right, hsl(0,80%,50%), hsl(60,80%,50%), hsl(120,80%,50%), hsl(180,80%,50%), hsl(240,80%,50%), hsl(300,80%,50%), hsl(360,80%,50%))`,
              }}
            />
          </div>

          {/* Saturation */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Saturation</label>
              <span className="text-xs text-muted-foreground font-mono">{saturation > 0 ? `+${saturation}` : saturation}%</span>
            </div>
            <input
              type="range"
              min={-50}
              max={50}
              value={saturation}
              onChange={(e) => setSaturation(parseInt(e.target.value))}
              className={sliderClass}
              style={{
                background: `linear-gradient(to right, hsl(0,0%,60%), hsl(0,100%,50%))`,
              }}
            />
          </div>

          {/* Brightness */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Brightness</label>
              <span className="text-xs text-muted-foreground font-mono">{brightness > 0 ? `+${brightness}` : brightness}%</span>
            </div>
            <input
              type="range"
              min={-50}
              max={50}
              value={brightness}
              onChange={(e) => setBrightness(parseInt(e.target.value))}
              className={sliderClass}
              style={{
                background: `linear-gradient(to right, #000, #fff)`,
              }}
            />
          </div>

          {/* Temperature */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Temperature</label>
              <span className="text-xs text-muted-foreground font-mono">{temperature > 0 ? `+${temperature}` : temperature}</span>
            </div>
            <input
              type="range"
              min={-30}
              max={30}
              value={temperature}
              onChange={(e) => setTemperature(parseInt(e.target.value))}
              className={sliderClass}
              style={{
                background: `linear-gradient(to right, #4A90D9, #fff, #FF6B35)`,
              }}
            />
          </div>
        </div>

        {/* Original vs Adjusted comparison */}
        <div className="mx-6 mb-4">
          <p className="text-xs text-muted-foreground mb-2">Original</p>
          <div className="flex h-8 rounded-md overflow-hidden border border-border">
            {colors.map((c) => (
              <div key={c.id} className="flex-1" style={{ backgroundColor: c.hex }} />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={apply}>Apply</Button>
        </div>
      </div>
    </div>
  )
}
