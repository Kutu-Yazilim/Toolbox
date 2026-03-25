"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { SearchIcon } from "lucide-react"
import { TOOLS, CATEGORIES } from "@/config/toolRegistry"
import { cn } from "@/lib/utils"

type CommandPaletteProps = {
  isOpen: boolean
  onClose: () => void
  recentToolIds: string[]
  onSelect: (toolId: string) => void
}

const MAX_RESULTS = 10

function getCategoryLabel(categoryId: string): string {
  return CATEGORIES.find((c) => c.id === categoryId)?.label ?? categoryId
}

export function CommandPalette({
  isOpen,
  onClose,
  recentToolIds,
  onSelect,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("")
  const [highlightIndex, setHighlightIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const results = useMemo(() => {
    if (!query.trim()) {
      const recentTools = recentToolIds
        .map((id) => TOOLS.find((t) => t.id === id))
        .filter(Boolean)
      return recentTools.slice(0, 5)
    }
    const q = query.toLowerCase()
    return TOOLS.filter(
      (t) =>
        t.label.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    ).slice(0, MAX_RESULTS)
  }, [query, recentToolIds])

  useEffect(() => {
    if (isOpen) {
      setQuery("")
      setHighlightIndex(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [isOpen])

  useEffect(() => {
    setHighlightIndex(0)
  }, [query])

  // Scroll highlighted item into view
  useEffect(() => {
    if (!listRef.current) return
    const highlighted = listRef.current.children[
      query.trim() ? highlightIndex : highlightIndex + 1
    ] as HTMLElement | undefined
    highlighted?.scrollIntoView({ block: "nearest" })
  }, [highlightIndex, query])

  const selectTool = useCallback(
    (toolId: string, path: string) => {
      onSelect(toolId)
      router.push(path)
      onClose()
    },
    [router, onClose, onSelect]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setHighlightIndex((prev) => Math.min(prev + 1, results.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setHighlightIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === "Enter") {
        e.preventDefault()
        const tool = results[highlightIndex]
        if (tool) selectTool(tool.id, tool.path)
      } else if (e.key === "Escape") {
        onClose()
      }
    },
    [results, highlightIndex, selectTool, onClose]
  )

  if (!isOpen) return null

  const showRecentHeader = !query.trim() && results.length > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <SearchIcon className="size-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tools..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto p-1.5">
          {showRecentHeader && (
            <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
              Recent
            </div>
          )}
          {results.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              No tools found.
            </div>
          )}
          {results.map((tool, index) => {
            if (!tool) return null
            const ToolIcon = tool.icon
            return (
              <button
                key={tool.id}
                type="button"
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-left transition-colors",
                  index === highlightIndex
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:bg-accent/50"
                )}
                onMouseEnter={() => setHighlightIndex(index)}
                onClick={() => selectTool(tool.id, tool.path)}
              >
                <ToolIcon className="size-4 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate font-medium">
                  {tool.label}
                </span>
                <span className="text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5 shrink-0">
                  {getCategoryLabel(tool.categoryId)}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
