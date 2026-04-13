"use client"

import { useCallback, useRef, useState } from "react"
import { PlusIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import type {
  GradientStop,
  LinearGradient,
  RadialGradient,
  SweepGradient,
} from "@/types/shapemaker"

type GradientDef = LinearGradient | RadialGradient | SweepGradient

interface GradientStopsEditorProps {
  gradient: GradientDef | null
  onGradientChange: (gradient: GradientDef) => void
  onClear: () => void
}

const DEFAULT_STOPS: GradientStop[] = [
  { offset: 0, color: "#000000" },
  { offset: 1, color: "#ffffff" },
]

const DEFAULT_LINEAR: LinearGradient = {
  type: "linear",
  startPoint: { x: 0, y: 0 },
  endPoint: { x: 1, y: 0 },
  stops: DEFAULT_STOPS,
}

const DEFAULT_RADIAL: RadialGradient = {
  type: "radial",
  center: { x: 0.5, y: 0.5 },
  radius: 0.5,
  stops: DEFAULT_STOPS,
}

const DEFAULT_SWEEP: SweepGradient = {
  type: "sweep",
  center: { x: 0.5, y: 0.5 },
  startAngle: 0,
  endAngle: 360,
  stops: DEFAULT_STOPS,
}

type GradientType = "linear" | "radial" | "sweep"

const GRADIENT_TYPES: { value: GradientType; label: string }[] = [
  { value: "linear", label: "Linear" },
  { value: "radial", label: "Radial" },
  { value: "sweep", label: "Sweep" },
]

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

function interpolateColor(colorA: string, colorB: string, t: number): string {
  const a = hexToRgb(colorA)
  const b = hexToRgb(colorB)
  if (!a || !b) return colorA
  const r = Math.round(a.r + (b.r - a.r) * t)
  const g = Math.round(a.g + (b.g - a.g) * t)
  const bl = Math.round(a.b + (b.b - a.b) * t)
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${bl.toString(16).padStart(2, "0")}`
}

function buildCssGradient(stops: GradientStop[]): string {
  const sorted = [...stops].sort((a, b) => a.offset - b.offset)
  const parts = sorted.map((s) => `${s.color} ${Math.round(s.offset * 100)}%`)
  return `linear-gradient(to right, ${parts.join(", ")})`
}

function computeLinearAngleDeg(gradient: LinearGradient): number {
  const dx = gradient.endPoint.x - gradient.startPoint.x
  const dy = gradient.endPoint.y - gradient.startPoint.y
  return Math.round((Math.atan2(dy, dx) * 180) / Math.PI)
}

function keepExistingStops(existing: GradientStop[]): GradientStop[] {
  return existing.length >= 2 ? existing : DEFAULT_STOPS
}

function makeDefaultForType(type: GradientType, existing: GradientStop[]): GradientDef {
  const stops = keepExistingStops(existing)
  if (type === "linear") return { ...DEFAULT_LINEAR, stops }
  if (type === "radial") return { ...DEFAULT_RADIAL, stops }
  return { ...DEFAULT_SWEEP, stops }
}

export function GradientStopsEditor({
  gradient,
  onGradientChange,
  onClear,
}: GradientStopsEditorProps) {
  const [selectedStopIndex, setSelectedStopIndex] = useState<number | null>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const draggingIndexRef = useRef<number | null>(null)

  const currentGradient: GradientDef = gradient ?? DEFAULT_LINEAR
  const stops = currentGradient.stops
  const currentType = currentGradient.type

  const updateStops = useCallback(
    (newStops: GradientStop[]) => {
      const sorted = [...newStops].sort((a, b) => a.offset - b.offset)
      onGradientChange({ ...currentGradient, stops: sorted } as GradientDef)
    },
    [currentGradient, onGradientChange]
  )

  const handleTypeChange = useCallback(
    (type: GradientType) => {
      if (type === currentType) return
      onGradientChange(makeDefaultForType(type, stops))
      setSelectedStopIndex(null)
    },
    [currentType, stops, onGradientChange]
  )

  const handleStopColorChange = useCallback(
    (index: number, color: string) => {
      const newStops = stops.map((s, i) => (i === index ? { ...s, color } : s))
      updateStops(newStops)
    },
    [stops, updateStops]
  )

  const handleStopPositionChange = useCallback(
    (index: number, percent: number) => {
      const offset = Math.max(0, Math.min(1, percent / 100))
      const newStops = stops.map((s, i) => (i === index ? { ...s, offset } : s))
      updateStops(newStops)
    },
    [stops, updateStops]
  )

  const handleRemoveStop = useCallback(
    (index: number) => {
      if (stops.length <= 2) return
      const newStops = stops.filter((_, i) => i !== index)
      updateStops(newStops)
      setSelectedStopIndex(null)
    },
    [stops, updateStops]
  )

  const handleAddStop = useCallback(() => {
    const sorted = [...stops].sort((a, b) => a.offset - b.offset)
    const newOffset = 0.5
    let color = "#808080"
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].offset <= newOffset && sorted[i + 1].offset >= newOffset) {
        const range = sorted[i + 1].offset - sorted[i].offset
        const t = range > 0 ? (newOffset - sorted[i].offset) / range : 0.5
        color = interpolateColor(sorted[i].color, sorted[i + 1].color, t)
        break
      }
    }
    const newStop: GradientStop = { offset: newOffset, color }
    updateStops([...stops, newStop])
  }, [stops, updateStops])

  const handleBarMouseDown = useCallback(
    (e: React.MouseEvent<HTMLElement>, index: number) => {
      e.preventDefault()
      setSelectedStopIndex(index)
      draggingIndexRef.current = index

      const onMouseMove = (mv: MouseEvent) => {
        if (draggingIndexRef.current === null || !barRef.current) return
        const rect = barRef.current.getBoundingClientRect()
        const offset = Math.max(0, Math.min(1, (mv.clientX - rect.left) / rect.width))
        const updatedStops = stops.map((s, i) =>
          i === draggingIndexRef.current ? { ...s, offset } : s
        )
        onGradientChange({ ...currentGradient, stops: updatedStops } as GradientDef)
      }

      const onMouseUp = () => {
        draggingIndexRef.current = null
        window.removeEventListener("mousemove", onMouseMove)
        window.removeEventListener("mouseup", onMouseUp)
      }

      window.addEventListener("mousemove", onMouseMove)
      window.addEventListener("mouseup", onMouseUp)
    },
    [stops, currentGradient, onGradientChange]
  )

  const handleRadiusChange = useCallback(
    (value: number) => {
      if (currentGradient.type !== "radial") return
      onGradientChange({ ...currentGradient, radius: value })
    },
    [currentGradient, onGradientChange]
  )

  const handleSweepAngleChange = useCallback(
    (field: "startAngle" | "endAngle", value: number) => {
      if (currentGradient.type !== "sweep") return
      onGradientChange({ ...currentGradient, [field]: value })
    },
    [currentGradient, onGradientChange]
  )

  const cssGradient = buildCssGradient(stops)

  return (
    <div className="space-y-3">
      {/* Type selector */}
      <div className="flex gap-1">
        {GRADIENT_TYPES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => handleTypeChange(value)}
            className={[
              "flex-1 px-2 py-1 text-xs rounded border transition-colors",
              currentType === value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/30 text-muted-foreground border-border hover:text-foreground hover:border-foreground/30",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Gradient preview bar + stop handles */}
      <div className="relative">
        <div
          ref={barRef}
          className="h-6 w-full rounded border border-border"
          style={{ background: cssGradient }}
        />
        {/* Stop handles */}
        {stops.map((stop, index) => (
          <button
            key={index}
            onMouseDown={(e) => handleBarMouseDown(e, index)}
            onClick={() => setSelectedStopIndex(index)}
            className={[
              "absolute bottom-0 translate-x-[-50%] translate-y-[40%] w-3 h-3 rounded-full border-2 cursor-grab active:cursor-grabbing",
              selectedStopIndex === index
                ? "border-primary ring-2 ring-primary/50 ring-offset-1 ring-offset-background z-10"
                : "border-border",
            ].join(" ")}
            style={{
              left: `${stop.offset * 100}%`,
              backgroundColor: stop.color,
            }}
          />
        ))}
      </div>

      {/* Type-specific controls */}
      {currentGradient.type === "linear" && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-16 flex-shrink-0">Angle</span>
          <span className="text-xs font-mono text-foreground">
            {computeLinearAngleDeg(currentGradient)}°
          </span>
          <span className="text-xs text-muted-foreground">(from transform)</span>
        </div>
      )}

      {currentGradient.type === "radial" && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-16 flex-shrink-0">Radius</span>
          <input
            type="number"
            value={currentGradient.radius}
            onChange={(e) => handleRadiusChange(Number(e.target.value))}
            min={0}
            max={2}
            step={0.05}
            className="w-20 px-1.5 py-1 text-xs font-mono bg-muted/30 border border-border rounded outline-none focus:ring-1 focus:ring-ring text-center"
          />
        </div>
      )}

      {currentGradient.type === "sweep" && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-16 flex-shrink-0">Start°</span>
            <input
              type="number"
              value={currentGradient.startAngle}
              onChange={(e) => handleSweepAngleChange("startAngle", Number(e.target.value))}
              min={0}
              max={360}
              step={1}
              className="w-20 px-1.5 py-1 text-xs font-mono bg-muted/30 border border-border rounded outline-none focus:ring-1 focus:ring-ring text-center"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-16 flex-shrink-0">End°</span>
            <input
              type="number"
              value={currentGradient.endAngle}
              onChange={(e) => handleSweepAngleChange("endAngle", Number(e.target.value))}
              min={0}
              max={360}
              step={1}
              className="w-20 px-1.5 py-1 text-xs font-mono bg-muted/30 border border-border rounded outline-none focus:ring-1 focus:ring-ring text-center"
            />
          </div>
        </div>
      )}

      {/* Stops list */}
      <div className="space-y-1">
        {[...stops]
          .map((stop, index) => ({ stop, index }))
          .sort((a, b) => a.stop.offset - b.stop.offset)
          .map(({ stop, index }) => (
            <div
              key={index}
              className={[
                "flex items-center gap-1.5 px-1.5 py-1 rounded border transition-colors",
                selectedStopIndex === index
                  ? "border-primary/50 bg-primary/5"
                  : "border-transparent hover:border-border",
              ].join(" ")}
              onClick={() => setSelectedStopIndex(index)}
            >
              <input
                type="color"
                value={stop.color}
                onChange={(e) => handleStopColorChange(index, e.target.value)}
                className="w-5 h-5 rounded border border-border cursor-pointer p-0 bg-transparent flex-shrink-0"
              />
              <span className="text-xs font-mono text-foreground flex-shrink-0 w-12">
                {stop.color}
              </span>
              <input
                type="number"
                value={Math.round(stop.offset * 100)}
                onChange={(e) => handleStopPositionChange(index, Number(e.target.value))}
                min={0}
                max={100}
                step={1}
                className="w-14 px-1.5 py-0.5 text-xs font-mono bg-muted/30 border border-border rounded outline-none focus:ring-1 focus:ring-ring text-center"
              />
              <span className="text-xs text-muted-foreground">%</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveStop(index)
                }}
                disabled={stops.length <= 2}
                className="ml-auto p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Remove stop"
              >
                <XIcon className="w-3 h-3" />
              </button>
            </div>
          ))}
      </div>

      {/* Add stop + Clear */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddStop}
          className="flex-1 h-7 text-xs gap-1"
        >
          <PlusIcon className="w-3 h-3" />
          Add stop
        </Button>
        <button
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors underline-offset-2 hover:underline"
        >
          Remove gradient
        </button>
      </div>
    </div>
  )
}
