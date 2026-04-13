"use client"

import { useState } from "react"
import type { PaintStyle, ShapePath, BoundingBox, InteractionState, GradientDef, Layer, PathSegment } from "@/types/shapemaker"
import { computeBoundingBox } from "@/utils/shapemakerTransform"
import { GradientStopsEditor } from "./GradientStopsEditor"
import {
  ChevronDownIcon,
  ChevronRightIcon,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
} from "lucide-react"

type PaintMode = "solid" | "gradient"

type Props = {
  path: ShapePath | null
  interactionState: InteractionState
  selectedPathIds: string[]
  layers: Layer[]
  onUpdatePaint: (paint: Partial<PaintStyle>) => void
  onUpdatePath: (updates: Partial<ShapePath>) => void
  onUpdateTransform: (pathId: string, bbox: BoundingBox, changes: { x?: number; y?: number; width?: number; height?: number; rotation?: number }) => void
  onAlignPaths: (direction: AlignDirection) => void
}

type AlignDirection = "left" | "center-h" | "right" | "top" | "center-v" | "bottom"

function alignPaths(
  layers: Layer[],
  selectedPathIds: string[],
  direction: AlignDirection,
): { pathId: string; segments: PathSegment[] }[] {
  const selectedPaths: { pathId: string; segments: PathSegment[]; bbox: BoundingBox }[] = []
  for (const layer of layers) {
    for (const path of layer.paths) {
      if (selectedPathIds.includes(path.id)) {
        const bbox = computeBoundingBox(path.segments)
        selectedPaths.push({ pathId: path.id, segments: path.segments, bbox })
      }
    }
  }

  if (selectedPaths.length < 2) return []

  let target: number
  switch (direction) {
    case "left":
      target = Math.min(...selectedPaths.map((p) => p.bbox.x))
      break
    case "center-h": {
      const minX = Math.min(...selectedPaths.map((p) => p.bbox.x))
      const maxX = Math.max(...selectedPaths.map((p) => p.bbox.x + p.bbox.width))
      target = (minX + maxX) / 2
      break
    }
    case "right":
      target = Math.max(...selectedPaths.map((p) => p.bbox.x + p.bbox.width))
      break
    case "top":
      target = Math.min(...selectedPaths.map((p) => p.bbox.y))
      break
    case "center-v": {
      const minY = Math.min(...selectedPaths.map((p) => p.bbox.y))
      const maxY = Math.max(...selectedPaths.map((p) => p.bbox.y + p.bbox.height))
      target = (minY + maxY) / 2
      break
    }
    case "bottom":
      target = Math.max(...selectedPaths.map((p) => p.bbox.y + p.bbox.height))
      break
  }

  return selectedPaths.map(({ pathId, segments, bbox }) => {
    let dx = 0
    let dy = 0
    switch (direction) {
      case "left":
        dx = target - bbox.x
        break
      case "center-h":
        dx = target - (bbox.x + bbox.width / 2)
        break
      case "right":
        dx = target - (bbox.x + bbox.width)
        break
      case "top":
        dy = target - bbox.y
        break
      case "center-v":
        dy = target - (bbox.y + bbox.height / 2)
        break
      case "bottom":
        dy = target - (bbox.y + bbox.height)
        break
    }
    const moved = segments.map((seg) => translateSegmentPoint(seg, dx, dy))
    return { pathId, segments: moved }
  })
}

function translateSegmentPoint(seg: PathSegment, dx: number, dy: number): PathSegment {
  switch (seg.type) {
    case "moveTo":
      return { ...seg, point: { x: seg.point.x + dx, y: seg.point.y + dy } }
    case "lineTo":
      return { ...seg, point: { x: seg.point.x + dx, y: seg.point.y + dy } }
    case "quadraticBezierTo":
      return {
        ...seg,
        controlPoint: { x: seg.controlPoint.x + dx, y: seg.controlPoint.y + dy },
        endPoint: { x: seg.endPoint.x + dx, y: seg.endPoint.y + dy },
      }
    case "cubicTo":
      return {
        ...seg,
        controlPoint1: { x: seg.controlPoint1.x + dx, y: seg.controlPoint1.y + dy },
        controlPoint2: { x: seg.controlPoint2.x + dx, y: seg.controlPoint2.y + dy },
        endPoint: { x: seg.endPoint.x + dx, y: seg.endPoint.y + dy },
      }
    case "arcToPoint":
      return { ...seg, endPoint: { x: seg.endPoint.x + dx, y: seg.endPoint.y + dy } }
    case "close":
      return seg
  }
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

export function PropertiesPanel({ path, interactionState, selectedPathIds, layers, onUpdatePaint, onUpdatePath, onUpdateTransform, onAlignPaths }: Props) {
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(false)
  const [paintMode, setPaintMode] = useState<PaintMode>(() =>
    path?.paint.gradient ? "gradient" : "solid"
  )

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

      {/* Paint Mode */}
      <Section title="Paint Mode">
        <div className="flex gap-1">
          <button
            onClick={() => {
              setPaintMode("solid")
              onUpdatePaint({ gradient: null })
            }}
            className={[
              "flex-1 px-2 py-1 text-xs rounded border transition-colors",
              paintMode === "solid"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/30 text-muted-foreground border-border hover:text-foreground hover:border-foreground/30",
            ].join(" ")}
          >
            Solid
          </button>
          <button
            onClick={() => setPaintMode("gradient")}
            className={[
              "flex-1 px-2 py-1 text-xs rounded border transition-colors",
              paintMode === "gradient"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/30 text-muted-foreground border-border hover:text-foreground hover:border-foreground/30",
            ].join(" ")}
          >
            Gradient
          </button>
        </div>
        {paintMode === "gradient" && (
          <GradientStopsEditor
            gradient={paint.gradient ?? null}
            onGradientChange={(gradient: GradientDef) => onUpdatePaint({ gradient })}
            onClear={() => {
              onUpdatePaint({ gradient: null })
              setPaintMode("solid")
            }}
          />
        )}
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

      {/* Alignment (multi-select) */}
      {selectedPathIds.length > 1 && (
        <Section title="Align">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onAlignPaths("left")}
              title="Align left"
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <AlignStartVertical className="h-4 w-4" />
            </button>
            <button
              onClick={() => onAlignPaths("center-h")}
              title="Align center horizontal"
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <AlignCenterVertical className="h-4 w-4" />
            </button>
            <button
              onClick={() => onAlignPaths("right")}
              title="Align right"
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <AlignEndVertical className="h-4 w-4" />
            </button>
            <div className="w-px h-5 bg-border mx-1" />
            <button
              onClick={() => onAlignPaths("top")}
              title="Align top"
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <AlignStartHorizontal className="h-4 w-4" />
            </button>
            <button
              onClick={() => onAlignPaths("center-v")}
              title="Align center vertical"
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <AlignCenterHorizontal className="h-4 w-4" />
            </button>
            <button
              onClick={() => onAlignPaths("bottom")}
              title="Align bottom"
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <AlignEndHorizontal className="h-4 w-4" />
            </button>
          </div>
        </Section>
      )}
    </div>
  )
}

export { alignPaths }
export type { AlignDirection }
