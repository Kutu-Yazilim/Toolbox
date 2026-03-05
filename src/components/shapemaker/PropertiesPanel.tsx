import { useState } from "react"
import type { PaintStyle, ShapePath } from "@/types/shapemaker"
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react"

type Props = {
  path: ShapePath | null
  onUpdatePaint: (paint: Partial<PaintStyle>) => void
  onUpdatePath: (updates: Partial<ShapePath>) => void
}

function Section({
  title,
  defaultOpen = true,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
      >
        {open ? (
          <ChevronDownIcon className="h-3 w-3" />
        ) : (
          <ChevronRightIcon className="h-3 w-3" />
        )}
        {title}
      </button>
      {open && <div className="px-3 pb-3 space-y-2">{children}</div>}
    </div>
  )
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-16 flex-shrink-0">
        {label}
      </span>
      <div className="flex-1 flex items-center gap-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-6 h-6 rounded border border-border cursor-pointer p-0 bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2 py-1 text-xs font-mono bg-muted/30 border border-border rounded outline-none focus:ring-1 focus:ring-ring min-w-0"
        />
      </div>
    </div>
  )
}

function NumberInput({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-16 flex-shrink-0">
        {label}
      </span>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="flex-1 h-1.5 accent-primary"
      />
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-14 px-1.5 py-1 text-xs font-mono bg-muted/30 border border-border rounded outline-none focus:ring-1 focus:ring-ring text-center"
      />
    </div>
  )
}

function SelectInput({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-16 flex-shrink-0">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-2 py-1 text-xs bg-muted/30 border border-border rounded outline-none focus:ring-1 focus:ring-ring"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function PropertiesPanel({ path, onUpdatePaint, onUpdatePath }: Props) {
  if (!path) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground p-4 text-center">
        Select a path to edit its properties
      </div>
    )
  }

  const paint = path.paint

  return (
    <div className="h-full overflow-y-auto">
      {/* Path info */}
      <Section title="Path">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-16 flex-shrink-0">
            Name
          </span>
          <input
            type="text"
            value={path.name}
            onChange={(e) => onUpdatePath({ name: e.target.value })}
            className="flex-1 px-2 py-1 text-xs bg-muted/30 border border-border rounded outline-none focus:ring-1 focus:ring-ring min-w-0"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-16 flex-shrink-0">Points</span>
          <span>{path.segments.length}</span>
        </div>
      </Section>

      {/* Style */}
      <Section title="Style">
        <SelectInput
          label="Mode"
          value={paint.paintingStyle}
          options={[
            { value: "fill", label: "Fill" },
            { value: "stroke", label: "Stroke" },
            { value: "fillAndStroke", label: "Fill & Stroke" },
          ]}
          onChange={(v) =>
            onUpdatePaint({
              paintingStyle: v as PaintStyle["paintingStyle"],
            })
          }
        />
      </Section>

      {/* Fill */}
      {(paint.paintingStyle === "fill" ||
        paint.paintingStyle === "fillAndStroke") && (
        <Section title="Fill">
          <ColorInput
            label="Color"
            value={paint.fillColor}
            onChange={(v) => onUpdatePaint({ fillColor: v })}
          />
          <NumberInput
            label="Opacity"
            value={paint.fillOpacity}
            onChange={(v) => onUpdatePaint({ fillOpacity: v })}
            min={0}
            max={1}
            step={0.05}
          />
        </Section>
      )}

      {/* Stroke */}
      {(paint.paintingStyle === "stroke" ||
        paint.paintingStyle === "fillAndStroke") && (
        <Section title="Stroke">
          <ColorInput
            label="Color"
            value={paint.strokeColor}
            onChange={(v) => onUpdatePaint({ strokeColor: v })}
          />
          <NumberInput
            label="Opacity"
            value={paint.strokeOpacity}
            onChange={(v) => onUpdatePaint({ strokeOpacity: v })}
            min={0}
            max={1}
            step={0.05}
          />
          <NumberInput
            label="Width"
            value={paint.strokeWidth}
            onChange={(v) => onUpdatePaint({ strokeWidth: v })}
            min={0.5}
            max={50}
            step={0.5}
          />
          <SelectInput
            label="Cap"
            value={paint.strokeCap}
            options={[
              { value: "butt", label: "Butt" },
              { value: "round", label: "Round" },
              { value: "square", label: "Square" },
            ]}
            onChange={(v) =>
              onUpdatePaint({ strokeCap: v as PaintStyle["strokeCap"] })
            }
          />
          <SelectInput
            label="Join"
            value={paint.strokeJoin}
            options={[
              { value: "miter", label: "Miter" },
              { value: "round", label: "Round" },
              { value: "bevel", label: "Bevel" },
            ]}
            onChange={(v) =>
              onUpdatePaint({ strokeJoin: v as PaintStyle["strokeJoin"] })
            }
          />
        </Section>
      )}

      {/* Effects */}
      <Section title="Effects" defaultOpen={false}>
        <NumberInput
          label="Blur"
          value={paint.blurRadius}
          onChange={(v) => onUpdatePaint({ blurRadius: v })}
          min={0}
          max={50}
          step={0.5}
        />
        {paint.blurRadius > 0 && (
          <>
            <ColorInput
              label="Shadow"
              value={paint.shadowColor}
              onChange={(v) => onUpdatePaint({ shadowColor: v })}
            />
            <NumberInput
              label="Offset X"
              value={paint.shadowOffset.x}
              onChange={(v) =>
                onUpdatePaint({
                  shadowOffset: { ...paint.shadowOffset, x: v },
                })
              }
              min={-50}
              max={50}
              step={1}
            />
            <NumberInput
              label="Offset Y"
              value={paint.shadowOffset.y}
              onChange={(v) =>
                onUpdatePaint({
                  shadowOffset: { ...paint.shadowOffset, y: v },
                })
              }
              min={-50}
              max={50}
              step={1}
            />
          </>
        )}
      </Section>
    </div>
  )
}
