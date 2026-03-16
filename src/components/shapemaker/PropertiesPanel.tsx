import { useState } from "react"
import type { PaintStyle, ShapePath, BoundingBox, InteractionState } from "@/types/shapemaker"
import { computeBoundingBox } from "@/utils/shapemakerTransform"
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react"

type Props = {
  path: ShapePath | null
  interactionState: InteractionState
  onUpdatePaint: (paint: Partial<PaintStyle>) => void
  onUpdatePath: (updates: Partial<ShapePath>) => void
  onUpdateTransform: (pathId: string, bbox: BoundingBox, changes: { x?: number; y?: number; width?: number; height?: number; rotation?: number }) => void
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

export function PropertiesPanel({ path, interactionState, onUpdatePaint, onUpdatePath, onUpdateTransform }: Props) {
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(false)

  if (!path) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground p-4 text-center">
        Select a path to edit its properties
      </div>
    )
  }

  const isShapeMode = interactionState.type === "shape-selected" && interactionState.mode === "shape"
  const bbox = path ? computeBoundingBox(path.segments) : null
  const paint = path.paint

  return (
    <div className="h-full overflow-y-auto">
      {/* Transform */}
      {isShapeMode && bbox && (
        <Section title="Transform">
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground w-4 flex-shrink-0">X</span>
              <input
                type="number"
                value={Math.round(bbox.x)}
                onChange={(e) => onUpdateTransform(path.id, bbox, { x: Number(e.target.value) })}
                className="flex-1 px-1.5 py-1 text-xs font-mono bg-muted/30 border border-border rounded outline-none focus:ring-1 focus:ring-ring text-center min-w-0"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground w-4 flex-shrink-0">Y</span>
              <input
                type="number"
                value={Math.round(bbox.y)}
                onChange={(e) => onUpdateTransform(path.id, bbox, { y: Number(e.target.value) })}
                className="flex-1 px-1.5 py-1 text-xs font-mono bg-muted/30 border border-border rounded outline-none focus:ring-1 focus:ring-ring text-center min-w-0"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground w-4 flex-shrink-0">W</span>
              <input
                type="number"
                value={Math.round(bbox.width)}
                min={1}
                onChange={(e) => {
                  const newW = Number(e.target.value)
                  if (lockAspectRatio && bbox.width > 0) {
                    const ratio = bbox.height / bbox.width
                    onUpdateTransform(path.id, bbox, { width: newW, height: Math.max(1, Math.round(newW * ratio)) })
                  } else {
                    onUpdateTransform(path.id, bbox, { width: newW })
                  }
                }}
                className="flex-1 px-1.5 py-1 text-xs font-mono bg-muted/30 border border-border rounded outline-none focus:ring-1 focus:ring-ring text-center min-w-0"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground w-4 flex-shrink-0">H</span>
              <input
                type="number"
                value={Math.round(bbox.height)}
                min={1}
                onChange={(e) => {
                  const newH = Number(e.target.value)
                  if (lockAspectRatio && bbox.height > 0) {
                    const ratio = bbox.width / bbox.height
                    onUpdateTransform(path.id, bbox, { height: newH, width: Math.max(1, Math.round(newH * ratio)) })
                  } else {
                    onUpdateTransform(path.id, bbox, { height: newH })
                  }
                }}
                className="flex-1 px-1.5 py-1 text-xs font-mono bg-muted/30 border border-border rounded outline-none focus:ring-1 focus:ring-ring text-center min-w-0"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1 flex-1">
              <span className="text-xs text-muted-foreground w-4 flex-shrink-0">R</span>
              <input
                type="number"
                value={Math.round((path.transform.rotation * 180) / Math.PI)}
                onChange={(e) => onUpdateTransform(path.id, bbox, { rotation: (Number(e.target.value) * Math.PI) / 180 })}
                className="flex-1 px-1.5 py-1 text-xs font-mono bg-muted/30 border border-border rounded outline-none focus:ring-1 focus:ring-ring text-center min-w-0"
              />
              <span className="text-xs text-muted-foreground flex-shrink-0">deg</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={lockAspectRatio}
                onChange={(e) => setLockAspectRatio(e.target.checked)}
                className="rounded border-border accent-primary"
              />
              Lock aspect ratio
            </label>
          </div>
        </Section>
      )}

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
