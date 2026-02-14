import { cn } from "@/lib/utils"
import type { ColorHarmony } from "@/types/color"
import { ShuffleIcon } from "lucide-react"

interface HarmonySelectorProps {
  activeHarmony: ColorHarmony
  onChange: (harmony: ColorHarmony) => void
  onClose: () => void
}

const harmonies: { value: ColorHarmony; label: string; description: string }[] = [
  { value: "random", label: "Random", description: "Random colors with good distribution" },
  { value: "complementary", label: "Complementary", description: "Opposite colors on the wheel" },
  { value: "analogous", label: "Analogous", description: "Adjacent colors on the wheel" },
  { value: "triadic", label: "Triadic", description: "Three evenly spaced colors" },
  { value: "split-complementary", label: "Split Comp.", description: "Base + two adjacent complements" },
  { value: "tetradic", label: "Tetradic", description: "Four evenly spaced colors" },
  { value: "monochromatic", label: "Monochromatic", description: "Variations of one hue" },
]

export function HarmonySelector({ activeHarmony, onChange, onClose }: HarmonySelectorProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Color Harmony</h2>
          <p className="text-sm text-muted-foreground mt-1">Choose how colors relate to each other</p>
        </div>

        <div className="p-3 flex flex-col gap-1">
          {harmonies.map((h) => (
            <button
              key={h.value}
              onClick={() => {
                onChange(h.value)
                onClose()
              }}
              className={cn(
                "flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left transition-colors",
                activeHarmony === h.value
                  ? "bg-primary/10 text-foreground"
                  : "hover:bg-muted text-foreground"
              )}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                {h.value === "random" ? (
                  <ShuffleIcon className="size-4" />
                ) : (
                  <HarmonyIcon type={h.value} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{h.label}</div>
                <div className="text-xs text-muted-foreground">{h.description}</div>
              </div>
              {activeHarmony === h.value && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function HarmonyIcon({ type }: { type: ColorHarmony }) {
  const size = 20
  const center = size / 2
  const r = 7

  const getPoints = (): number[][] => {
    switch (type) {
      case "complementary":
        return [[0, 180]]
      case "analogous":
        return [[-30, 0, 30]]
      case "triadic":
        return [[0, 120, 240]]
      case "split-complementary":
        return [[0, 150, 210]]
      case "tetradic":
        return [[0, 90, 180, 270]]
      case "monochromatic":
        return [[0]]
      default:
        return [[0]]
    }
  }

  const angles = getPoints()[0]

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={center} cy={center} r={r} fill="none" stroke="currentColor" strokeWidth={1} opacity={0.3} />
      {angles.map((angle, i) => {
        const rad = ((angle - 90) * Math.PI) / 180
        const x = center + r * Math.cos(rad)
        const y = center + r * Math.sin(rad)
        return <circle key={i} cx={x} cy={y} r={2} fill="currentColor" />
      })}
    </svg>
  )
}
