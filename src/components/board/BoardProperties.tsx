import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { BoardElement, ElementStyle } from "@/types/board"
import { STROKE_COLORS, FILL_COLORS, STICKY_COLORS } from "@/types/board"
import {
  Trash2Icon,
  CopyIcon,
  ArrowUpToLineIcon,
  ArrowDownToLineIcon,
  LockIcon,
  LockOpenIcon,
} from "lucide-react"

interface BoardPropertiesProps {
  selectedElements: BoardElement[]
  onUpdateElements: (updates: Partial<BoardElement>) => void
  onDeleteElements: () => void
  onDuplicateElements: () => void
  onBringToFront: () => void
  onSendToBack: () => void
}

export function BoardProperties({
  selectedElements,
  onUpdateElements,
  onDeleteElements,
  onDuplicateElements,
  onBringToFront,
  onSendToBack,
}: BoardPropertiesProps) {
  if (selectedElements.length === 0) return null

  const firstEl = selectedElements[0]
  const style = firstEl.style
  const isMultiple = selectedElements.length > 1
  const hasText = firstEl.type === "text" || firstEl.type === "sticky" || firstEl.type === "rectangle" || firstEl.type === "ellipse" || firstEl.type === "diamond"
  const isSticky = firstEl.type === "sticky"

  const updateStyle = (updates: Partial<ElementStyle>) => {
    onUpdateElements({ style: { ...style, ...updates } })
  }

  return (
    <div className="absolute left-0 right-0 bottom-0 md:left-auto md:right-3 md:top-16 md:bottom-auto z-20 bg-card border border-border rounded-t-lg md:rounded-lg shadow-lg p-3 w-full md:w-52 max-h-60 md:max-h-[calc(100vh-250px)] overflow-y-auto flex flex-col gap-3">
      {/* Selection info */}
      <div className="text-xs text-muted-foreground font-medium">
        {isMultiple ? `${selectedElements.length} elements selected` : firstEl.type.charAt(0).toUpperCase() + firstEl.type.slice(1)}
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
    </div>
  )
}
