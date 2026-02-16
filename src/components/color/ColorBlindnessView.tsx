import { simulateColorBlindness, getContrastTextColor } from "@/utils/colorUtils"
import type { PaletteColor, ColorBlindnessType } from "@/types/color"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

interface ColorBlindnessViewProps {
  colors: PaletteColor[]
  onClose: () => void
}

const types: { value: ColorBlindnessType; label: string; description: string; prevalence: string }[] = [
  { value: "normal", label: "Normal Vision", description: "Full color perception", prevalence: "~92% of population" },
  { value: "protanopia", label: "Protanopia", description: "Red-blind (no red cones)", prevalence: "~1.3% of males" },
  { value: "deuteranopia", label: "Deuteranopia", description: "Green-blind (no green cones)", prevalence: "~1.2% of males" },
  { value: "tritanopia", label: "Tritanopia", description: "Blue-blind (no blue cones)", prevalence: "~0.001% of population" },
  { value: "achromatopsia", label: "Achromatopsia", description: "Complete color blindness", prevalence: "~0.003% of population" },
]

export function ColorBlindnessView({ colors, onClose }: ColorBlindnessViewProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">Color Blindness Simulation</h2>
            <p className="text-sm text-muted-foreground">See how your palette appears to people with color vision deficiencies</p>
          </div>
          <Button variant="ghost" size="icon-xs" onClick={onClose}>
            <XIcon className="size-4" />
          </Button>
        </div>

        {/* Simulations */}
        <div className="flex-1 overflow-auto p-6 flex flex-col gap-4">
          {types.map((type) => (
            <div key={type.value} className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-sm font-medium">{type.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">{type.description}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{type.prevalence}</span>
              </div>
              <div className="flex h-14 rounded-lg overflow-hidden border border-border">
                {colors.map((c) => {
                  const simulated = simulateColorBlindness(c.hex, type.value)
                  return (
                    <div
                      key={c.id}
                      className="flex-1 flex items-end justify-center pb-1"
                      style={{ backgroundColor: simulated }}
                    >
                      <span
                        className="text-[10px] font-mono"
                        style={{ color: getContrastTextColor(simulated) }}
                      >
                        {simulated}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
