"use client"

import { cn } from "@/lib/utils"
import type { Tool } from "@/types/board"
import {
  MousePointerIcon,
  HandIcon,
  SquareIcon,
  CircleIcon,
  DiamondIcon,
  MinusIcon,
  ArrowRightIcon,
  PencilIcon,
  TypeIcon,
  StickyNoteIcon,
} from "lucide-react"

interface BoardToolbarProps {
  activeTool: Tool
  onToolChange: (tool: Tool) => void
}

const tools: { tool: Tool; icon: React.ReactNode; label: string; shortcut: string }[] = [
  { tool: "select", icon: <MousePointerIcon className="size-4" />, label: "Select", shortcut: "V" },
  { tool: "hand", icon: <HandIcon className="size-4" />, label: "Hand (Pan)", shortcut: "H" },
  { tool: "rectangle", icon: <SquareIcon className="size-4" />, label: "Rectangle", shortcut: "R" },
  { tool: "ellipse", icon: <CircleIcon className="size-4" />, label: "Ellipse", shortcut: "O" },
  { tool: "diamond", icon: <DiamondIcon className="size-4" />, label: "Diamond", shortcut: "D" },
  { tool: "line", icon: <MinusIcon className="size-4" />, label: "Line", shortcut: "L" },
  { tool: "arrow", icon: <ArrowRightIcon className="size-4" />, label: "Arrow", shortcut: "A" },
  { tool: "draw", icon: <PencilIcon className="size-4" />, label: "Freehand Draw", shortcut: "P" },
  { tool: "text", icon: <TypeIcon className="size-4" />, label: "Text", shortcut: "T" },
  { tool: "sticky", icon: <StickyNoteIcon className="size-4" />, label: "Sticky Note", shortcut: "S" },
]

export function BoardToolbar({ activeTool, onToolChange }: BoardToolbarProps) {
  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 md:bottom-auto md:left-3 md:top-1/2 md:-translate-y-1/2 md:translate-x-0 z-20 flex flex-row md:flex-col gap-1 bg-card border border-border rounded-lg shadow-lg p-1.5">
      {tools.map((t) => (
        <button
          key={t.tool}
          onClick={() => onToolChange(t.tool)}
          className={cn(
            "flex items-center justify-center w-9 h-9 rounded-md transition-colors relative group",
            activeTool === t.tool
              ? "bg-primary text-primary-foreground"
              : "text-foreground hover:bg-muted"
          )}
          title={`${t.label} (${t.shortcut})`}
        >
          {t.icon}

          {/* Tooltip */}
          <div className="hidden md:block absolute left-full ml-2 px-2 py-1 bg-foreground text-background text-xs rounded whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            {t.label}
            <span className="ml-1.5 opacity-60">{t.shortcut}</span>
          </div>
        </button>
      ))}
    </div>
  )
}
