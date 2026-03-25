"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { BoardElement, ElementStyle, FontFamily } from "@/types/board"
import { STROKE_COLORS, FILL_COLORS, STICKY_COLORS } from "@/types/board"
import {
  Trash2Icon,
  CopyIcon,
  ArrowUpToLineIcon,
  ArrowDownToLineIcon,
  LockIcon,
  LockOpenIcon,
  RotateCcwIcon,
  AlignLeftIcon,
  AlignCenterHorizontalIcon,
  AlignRightIcon,
  AlignStartVerticalIcon,
  AlignCenterVerticalIcon,
  AlignEndVerticalIcon,
  AlignHorizontalSpaceBetweenIcon,
  AlignVerticalSpaceBetweenIcon,
  BoldIcon,
  ItalicIcon,
  GroupIcon,
  UngroupIcon,
} from "lucide-react"

const FONT_FAMILIES: { label: string; value: FontFamily }[] = [
  { label: "Sans-serif", value: "sans-serif" },
  { label: "Serif", value: "serif" },
  { label: "Monospace", value: "monospace" },
  { label: "Cursive", value: "cursive" },
]

const TEXT_COLORS = [
  "#1e1e1e", "#e03131", "#2f9e44", "#1971c2",
  "#f08c00", "#6741d9", "#0c8599", "#e8590c",
  "#ffffff", "#868e96",
]

interface BoardPropertiesProps {
  selectedElements: BoardElement[]
  onUpdateElements: (updates: Partial<BoardElement>) => void
  onDeleteElements: () => void
  onDuplicateElements: () => void
  onBringToFront: () => void
  onSendToBack: () => void
  onAlignElements: (direction: "left" | "center" | "right" | "top" | "middle" | "bottom") => void
  onDistributeElements: (axis: "horizontal" | "vertical") => void
  onGroupSelected: () => void
  onUngroupSelected: () => void
}

export function BoardProperties({
  selectedElements,
  onUpdateElements,
  onDeleteElements,
  onDuplicateElements,
  onBringToFront,
  onSendToBack,
  onAlignElements,
  onDistributeElements,
  onGroupSelected,
  onUngroupSelected,
}: BoardPropertiesProps) {
  if (selectedElements.length === 0) return null

  const firstEl = selectedElements[0]
  const style = firstEl.style
  const isMultiple = selectedElements.length > 1
  const hasText = firstEl.type === "text" || firstEl.type === "sticky" || firstEl.type === "rectangle" || firstEl.type === "ellipse" || firstEl.type === "diamond"
  const isSticky = firstEl.type === "sticky"
  const isArrow = firstEl.type === "arrow"
  const isGroupEl = firstEl.isGroup === true
  const hasGroupSelection = selectedElements.some((el) => el.isGroup)
  const hasRotation = firstEl.type !== "line" && firstEl.type !== "arrow" && firstEl.type !== "draw" && firstEl.type !== "group"

  const updateStyle = (updates: Partial<ElementStyle>) => {
    onUpdateElements({ style: { ...style, ...updates } })
  }

  const rotationDegrees = Math.round((firstEl.rotation * 180) / Math.PI)

  return (
    <div className="absolute left-0 right-0 bottom-0 md:left-auto md:right-3 md:top-16 md:bottom-auto z-20 bg-card border border-border rounded-t-lg md:rounded-lg shadow-lg p-3 w-full md:w-52 max-h-60 md:max-h-[calc(100vh-250px)] overflow-y-auto flex flex-col gap-3">
      {/* Selection info */}
      <div className="text-xs text-muted-foreground font-medium">
        {isMultiple
          ? `${selectedElements.length} elements selected`
          : isGroupEl
            ? "Group"
            : firstEl.type.charAt(0).toUpperCase() + firstEl.type.slice(1)}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon-xs" onClick={onDuplicateElements} title="Duplicate">
          <CopyIcon className="size-3" />
        </Button>
        <Button variant="outline" size="icon-xs" onClick={onBringToFront} title="Bring to front">
          <ArrowUpToLineIcon className="size-3" />
        </Button>
        <Button variant="outline" size="icon-xs" onClick={onSendToBack} title="Send to back">
          <ArrowDownToLineIcon className="size-3" />
        </Button>
        <Button
          variant="outline"
          size="icon-xs"
          onClick={() => onUpdateElements({ locked: !firstEl.locked })}
          title={firstEl.locked ? "Unlock" : "Lock"}
        >
          {firstEl.locked ? <LockIcon className="size-3" /> : <LockOpenIcon className="size-3" />}
        </Button>
        <Button variant="destructive" size="icon-xs" onClick={onDeleteElements} title="Delete">
          <Trash2Icon className="size-3" />
        </Button>
      </div>

      {/* Group/Ungroup */}
      {(isMultiple || hasGroupSelection) && (
        <div className="flex items-center gap-1">
          {isMultiple && (
            <Button variant="outline" size="icon-xs" onClick={onGroupSelected} title="Group (Ctrl+G)">
              <GroupIcon className="size-3" />
            </Button>
          )}
          {hasGroupSelection && (
            <Button variant="outline" size="icon-xs" onClick={onUngroupSelected} title="Ungroup (Ctrl+Shift+G)">
              <UngroupIcon className="size-3" />
            </Button>
          )}
        </div>
      )}

      {/* Group info */}
      {isGroupEl && !isMultiple && (
        <div className="text-[10px] text-muted-foreground">
          Group ({firstEl.childIds?.length ?? 0} children) - double-click to edit
        </div>
      )}

      {/* Rotation */}
      {hasRotation && !isMultiple && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">
            Rotation ({rotationDegrees}°)
          </label>
          <div className="flex items-center gap-1">
            <input
              type="range"
              min={-180}
              max={180}
              value={rotationDegrees}
              onChange={(e) => {
                const deg = parseInt(e.target.value)
                onUpdateElements({ rotation: (deg * Math.PI) / 180 })
              }}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer bg-muted [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
            />
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => onUpdateElements({ rotation: 0 })}
              title="Reset rotation"
              disabled={firstEl.rotation === 0}
            >
              <RotateCcwIcon className="size-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Arrow-specific: Bidirectional toggle */}
      {isArrow && !isMultiple && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">Arrow Style</label>
          <div className="flex gap-1">
            <button
              onClick={() => onUpdateElements({ bidirectional: false })}
              className={cn(
                "flex-1 h-7 rounded border text-[10px] font-medium transition-colors",
                !firstEl.bidirectional
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted border-border hover:bg-accent"
              )}
            >
              One-way
            </button>
            <button
              onClick={() => onUpdateElements({ bidirectional: true })}
              className={cn(
                "flex-1 h-7 rounded border text-[10px] font-medium transition-colors",
                firstEl.bidirectional
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted border-border hover:bg-accent"
              )}
            >
              Both
            </button>
          </div>
        </div>
      )}

      {/* Arrow-specific: Reset curve */}
      {isArrow && !isMultiple && firstEl.controlPointOffset && (firstEl.controlPointOffset.x !== 0 || firstEl.controlPointOffset.y !== 0) && (
        <div className="flex flex-col gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-[10px] h-7"
            onClick={() => onUpdateElements({ controlPointOffset: { x: 0, y: 0 } })}
          >
            Reset Curve
          </Button>
        </div>
      )}

      {/* Stroke color */}
      {firstEl.type !== "text" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">Stroke</label>
          <div className="flex flex-wrap gap-1">
            {STROKE_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => updateStyle({ strokeColor: color })}
                className={cn(
                  "w-5 h-5 rounded border-2 transition-transform hover:scale-110",
                  style.strokeColor === color ? "border-primary scale-110" : "border-border"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Fill color */}
      {firstEl.type !== "text" && firstEl.type !== "line" && firstEl.type !== "arrow" && firstEl.type !== "draw" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">
            {isSticky ? "Note Color" : "Fill"}
          </label>
          <div className="flex flex-wrap gap-1">
            {(isSticky ? STICKY_COLORS : FILL_COLORS).map((color) => (
              <button
                key={color}
                onClick={() => updateStyle({ fillColor: color })}
                className={cn(
                  "w-5 h-5 rounded border-2 transition-transform hover:scale-110",
                  style.fillColor === color ? "border-primary scale-110" : "border-border",
                  color === "transparent" && "bg-[repeating-conic-gradient(#ddd_0%_25%,transparent_0%_50%)] bg-[length:8px_8px]"
                )}
                style={color !== "transparent" ? { backgroundColor: color } : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Stroke width */}
      {firstEl.type !== "text" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">Stroke Width</label>
          <div className="flex gap-1">
            {[1, 2, 3, 5, 8].map((w) => (
              <button
                key={w}
                onClick={() => updateStyle({ strokeWidth: w })}
                className={cn(
                  "flex-1 h-7 rounded border text-xs font-medium transition-colors",
                  style.strokeWidth === w
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted border-border hover:bg-accent"
                )}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stroke style */}
      {firstEl.type !== "text" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">Stroke Style</label>
          <div className="flex gap-1">
            {(["solid", "dashed", "dotted"] as const).map((s) => (
              <button
                key={s}
                onClick={() => updateStyle({ strokeStyle: s })}
                className={cn(
                  "flex-1 h-7 rounded border text-[10px] font-medium transition-colors",
                  style.strokeStyle === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted border-border hover:bg-accent"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Border radius for rectangles */}
      {firstEl.type === "rectangle" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">Corner Radius</label>
          <input
            type="range"
            min={0}
            max={40}
            value={style.borderRadius}
            onChange={(e) => updateStyle({ borderRadius: parseInt(e.target.value) })}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-muted [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
          />
        </div>
      )}

      {/* Opacity */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-medium text-muted-foreground uppercase">
          Opacity ({Math.round(style.opacity * 100)}%)
        </label>
        <input
          type="range"
          min={0.1}
          max={1}
          step={0.05}
          value={style.opacity}
          onChange={(e) => updateStyle({ opacity: parseFloat(e.target.value) })}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-muted [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
        />
      </div>

      {/* Text styling */}
      {hasText && (
        <>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-medium text-muted-foreground uppercase">Font Family</label>
            <select
              value={style.fontFamily}
              onChange={(e) => updateStyle({ fontFamily: e.target.value })}
              className="h-7 rounded border border-border bg-muted px-2 text-[10px] font-medium cursor-pointer outline-none"
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-medium text-muted-foreground uppercase">Font Size</label>
            <div className="flex gap-1">
              {[12, 14, 16, 20, 24, 32].map((s) => (
                <button
                  key={s}
                  onClick={() => updateStyle({ fontSize: s })}
                  className={cn(
                    "flex-1 h-7 rounded border text-[10px] font-medium transition-colors",
                    style.fontSize === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted border-border hover:bg-accent"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-medium text-muted-foreground uppercase">Style</label>
            <div className="flex gap-1">
              <button
                onClick={() => updateStyle({ fontWeight: style.fontWeight === "bold" ? "normal" : "bold" })}
                className={cn(
                  "flex-1 h-7 rounded border text-[10px] font-medium transition-colors flex items-center justify-center",
                  style.fontWeight === "bold"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted border-border hover:bg-accent"
                )}
                title="Bold"
              >
                <BoldIcon className="size-3" />
              </button>
              <button
                onClick={() => updateStyle({ fontStyle: style.fontStyle === "italic" ? "normal" : "italic" })}
                className={cn(
                  "flex-1 h-7 rounded border text-[10px] font-medium transition-colors flex items-center justify-center",
                  style.fontStyle === "italic"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted border-border hover:bg-accent"
                )}
                title="Italic"
              >
                <ItalicIcon className="size-3" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-medium text-muted-foreground uppercase">Text Color</label>
            <div className="flex flex-wrap gap-1">
              {TEXT_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => updateStyle({ textColor: color })}
                  className={cn(
                    "w-5 h-5 rounded border-2 transition-transform hover:scale-110",
                    (style.textColor || "#1e1e1e") === color ? "border-primary scale-110" : "border-border"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-medium text-muted-foreground uppercase">Text Align</label>
            <div className="flex gap-1">
              {(["left", "center", "right"] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => updateStyle({ textAlign: a })}
                  className={cn(
                    "flex-1 h-7 rounded border text-[10px] font-medium capitalize transition-colors",
                    style.textAlign === a
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted border-border hover:bg-accent"
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Align & Distribute (show when 2+ elements selected) */}
      {isMultiple && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">Align</label>
          <div className="flex gap-1">
            <Button variant="outline" size="icon-xs" onClick={() => onAlignElements("left")} title="Align left">
              <AlignLeftIcon className="size-3" />
            </Button>
            <Button variant="outline" size="icon-xs" onClick={() => onAlignElements("center")} title="Align center">
              <AlignCenterHorizontalIcon className="size-3" />
            </Button>
            <Button variant="outline" size="icon-xs" onClick={() => onAlignElements("right")} title="Align right">
              <AlignRightIcon className="size-3" />
            </Button>
            <Button variant="outline" size="icon-xs" onClick={() => onAlignElements("top")} title="Align top">
              <AlignStartVerticalIcon className="size-3" />
            </Button>
            <Button variant="outline" size="icon-xs" onClick={() => onAlignElements("middle")} title="Align middle">
              <AlignCenterVerticalIcon className="size-3" />
            </Button>
            <Button variant="outline" size="icon-xs" onClick={() => onAlignElements("bottom")} title="Align bottom">
              <AlignEndVerticalIcon className="size-3" />
            </Button>
          </div>
          {selectedElements.length >= 3 && (
            <>
              <label className="text-[10px] font-medium text-muted-foreground uppercase mt-1">Distribute</label>
              <div className="flex gap-1">
                <Button variant="outline" size="icon-xs" onClick={() => onDistributeElements("horizontal")} title="Distribute horizontal">
                  <AlignHorizontalSpaceBetweenIcon className="size-3" />
                </Button>
                <Button variant="outline" size="icon-xs" onClick={() => onDistributeElements("vertical")} title="Distribute vertical">
                  <AlignVerticalSpaceBetweenIcon className="size-3" />
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
