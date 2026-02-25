import { useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { getContrastTextColor, hexToRgb, rgbToHsl, getApproximateColorName } from "@/utils/colorUtils"
import type { PaletteColor } from "@/types/color"
import { ColorEditor } from "./ColorEditor"
import {
  LockIcon,
  LockOpenIcon,
  XIcon,
  CopyIcon,
  CheckIcon,
  GripVerticalIcon,
  PlusIcon,
} from "lucide-react"

interface ColorColumnProps {
  color: PaletteColor
  index: number
  total: number
  onLock: () => void
  onRemove: () => void
  onUpdate: (hex: string) => void
  onAddBefore: () => void
  onAddAfter: () => void
  onDragStart: (index: number) => void
  onDragOver: (index: number) => void
  onDragEnd: () => void
  canRemove: boolean
}

interface AddButtonProps {
  onClick: () => void
  title: string
  side: "left" | "right"
}

function AddButton({ onClick, title, side }: AddButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "absolute top-1/2 -translate-y-1/2 z-30 w-7 h-7 rounded-full bg-card border border-border shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:!opacity-100 hover:scale-110 transition-all text-foreground",
        side === "left" ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2"
      )}
      title={title}
    >
      <PlusIcon className="size-3.5" />
    </button>
  )
}

export function ColorColumn({
  color,
  index,
  total,
  onLock,
  onRemove,
  onUpdate,
  onAddBefore,
  onAddAfter,
  onDragStart,
  onDragOver,
  onDragEnd,
  canRemove,
}: ColorColumnProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [copied, setCopied] = useState(false)
  const columnRef = useRef<HTMLDivElement>(null)

  const textColor = getContrastTextColor(color.hex)
  const rgb = hexToRgb(color.hex)
  const hsl = rgbToHsl(rgb)
  const colorName = getApproximateColorName(color.hex)

  const copyHex = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(color.hex)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const btnClass = cn(
    "p-2 rounded-lg transition-all duration-200",
    "hover:scale-110 active:scale-95",
    "backdrop-blur-sm"
  )

  return (
    <div className="relative flex-1 flex items-center group" style={{ minWidth: 0 }}>
      {/* Add button before - only show for first column */}
      {index === 0 && (
        <AddButton
          side="left"
          onClick={onAddBefore}
          title="Add color before"
        />
      )}

      {/* Main color column */}
      <div
        ref={columnRef}
        className="flex-1 h-full flex flex-col items-center justify-end relative cursor-default select-none"
        style={{ backgroundColor: color.hex }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move"
          onDragStart(index)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = "move"
          onDragOver(index)
        }}
        onDrop={(e) => {
          e.preventDefault()
          onDragEnd()
        }}
        onDragEnd={onDragEnd}
      >
        {/* Action buttons - shown on hover */}
        <div
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 transition-opacity duration-200",
            isHovered || showEditor ? "opacity-100" : "opacity-0"
          )}
          style={{ color: textColor }}
        >
          {/* Drag handle */}
          <button
            className={cn(btnClass, "cursor-grab active:cursor-grabbing")}
            style={{ color: textColor, backgroundColor: `${textColor}15` }}
            title="Drag to reorder"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <GripVerticalIcon className="size-5" />
          </button>

          {/* Lock/Unlock */}
          <button
            onClick={(e) => { e.stopPropagation(); onLock() }}
            className={btnClass}
            style={{ color: textColor, backgroundColor: color.locked ? `${textColor}25` : `${textColor}15` }}
            title={color.locked ? "Unlock color" : "Lock color"}
          >
            {color.locked ? <LockIcon className="size-5" /> : <LockOpenIcon className="size-5" />}
          </button>

          {/* Copy */}
          <button
            onClick={copyHex}
            className={btnClass}
            style={{ color: textColor, backgroundColor: `${textColor}15` }}
            title="Copy hex"
          >
            {copied ? <CheckIcon className="size-5" /> : <CopyIcon className="size-5" />}
          </button>

          {/* Remove */}
          {canRemove && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove() }}
              className={btnClass}
              style={{ color: textColor, backgroundColor: `${textColor}15` }}
              title="Remove color"
            >
              <XIcon className="size-5" />
            </button>
          )}
        </div>

        {/* Color info at bottom */}
        <div
          className="w-full px-3 pb-4 flex flex-col items-center gap-1.5 relative z-10"
          style={{ color: textColor }}
        >
          {/* Color name */}
          <span className="text-xs opacity-60 font-medium truncate max-w-full">
            {colorName}
          </span>

          {/* Hex value - clickable to edit */}
          <button
            onClick={() => setShowEditor(!showEditor)}
            className="text-lg font-bold tracking-wider hover:scale-105 transition-transform"
            title="Click to edit color"
          >
            {color.hex}
          </button>

          {/* RGB & HSL */}
          <div className="flex flex-col items-center gap-0.5 text-[11px] opacity-50 font-mono">
            <span>rgb({rgb.r}, {rgb.g}, {rgb.b})</span>
            <span>hsl({hsl.h}°, {hsl.s}%, {hsl.l}%)</span>
          </div>

          {/* Lock indicator */}
          {color.locked && (
            <div className="mt-1 opacity-60">
              <LockIcon className="size-3.5" />
            </div>
          )}
        </div>

        {/* Color editor popup */}
        {showEditor && (
          <ColorEditor
            hex={color.hex}
            onChange={onUpdate}
            onClose={() => setShowEditor(false)}
            textColor={textColor}
          />
        )}
      </div>

      {/* Add button after */}
      <AddButton
        side="right"
        onClick={onAddAfter}
        title={index === total - 1 ? "Add color after" : "Add color between"}
      />
    </div>
  )
}
