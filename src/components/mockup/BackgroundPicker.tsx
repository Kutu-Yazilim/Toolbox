import { cn } from "@/lib/utils"
import type { MockupBackground } from "@/types/mockup"

interface BackgroundPickerProps {
  background: MockupBackground
  onChange: (bg: Partial<MockupBackground>) => void
}

const SOLID_PRESETS = [
  { name: "White", value: "#ffffff" },
  { name: "Light Gray", value: "#f5f5f5" },
  { name: "Dark Gray", value: "#2c2c2e" },
  { name: "Black", value: "#000000" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Pink", value: "#ec4899" },
  { name: "Green", value: "#22c55e" },
]

const GRADIENT_PRESETS = [
  { name: "Ocean", from: "#667eea", to: "#764ba2" },
  { name: "Sunset", from: "#f093fb", to: "#f5576c" },
  { name: "Lime", from: "#11998e", to: "#38ef7d" },
  { name: "Warm", from: "#ff9a9e", to: "#fecfef" },
]

export function BackgroundPicker({ background, onChange }: BackgroundPickerProps) {
  return (
    <div className="space-y-3">
      <label className="text-xs font-medium text-muted-foreground">Background</label>

      {/* Type selector */}
      <div className="flex gap-1 bg-muted rounded-lg p-1">
        {(["solid", "gradient", "transparent"] as const).map((type) => (
          <button
            key={type}
            onClick={() => onChange({ type })}
            className={cn(
              "flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors capitalize",
              background.type === type
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Solid presets */}
      {background.type === "solid" && (
        <div className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            {SOLID_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => onChange({ color: p.value })}
                title={p.name}
                className={cn(
                  "size-7 rounded-full border-2 transition-transform hover:scale-110",
                  background.color === p.value ? "border-primary ring-2 ring-primary/30" : "border-border"
                )}
                style={{ backgroundColor: p.value }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={background.color}
              onChange={(e) => onChange({ color: e.target.value })}
              className="size-7 rounded cursor-pointer border-0 p-0"
            />
            <input
              type="text"
              value={background.color}
              onChange={(e) => {
                if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                  onChange({ color: e.target.value })
                }
              }}
              className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-mono"
              placeholder="#ffffff"
            />
          </div>
        </div>
      )}

      {/* Gradient presets */}
      {background.type === "gradient" && (
        <div className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            {GRADIENT_PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => onChange({ gradientFrom: p.from, gradientTo: p.to })}
                title={p.name}
                className={cn(
                  "size-7 rounded-full border-2 transition-transform hover:scale-110",
                  background.gradientFrom === p.from && background.gradientTo === p.to
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border"
                )}
                style={{
                  background: `linear-gradient(135deg, ${p.from}, ${p.to})`,
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={background.gradientFrom}
              onChange={(e) => onChange({ gradientFrom: e.target.value })}
              className="size-7 rounded cursor-pointer border-0 p-0"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="color"
              value={background.gradientTo}
              onChange={(e) => onChange({ gradientTo: e.target.value })}
              className="size-7 rounded cursor-pointer border-0 p-0"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground w-10">Angle</label>
            <input
              type="range"
              min={0}
              max={360}
              step={15}
              value={background.gradientAngle}
              onChange={(e) => onChange({ gradientAngle: Number(e.target.value) })}
              className="flex-1 h-1 accent-primary"
            />
            <span className="text-xs text-muted-foreground w-8 text-right">{background.gradientAngle}°</span>
          </div>
        </div>
      )}

      {background.type === "transparent" && (
        <p className="text-xs text-muted-foreground">
          Export will have a transparent background.
        </p>
      )}
    </div>
  )
}
