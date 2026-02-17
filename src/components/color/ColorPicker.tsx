import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import type { PaletteColor, ColorHarmony } from "@/types/color"
import {
  generateRandomPalette,
  generateRandomHex,
  generateHarmony,
  generateId,
  blendColors,
} from "@/utils/colorUtils"
import { ColorColumn } from "./ColorColumn"
import { PaletteToolbar } from "./PaletteToolbar"
import { ExportDialog } from "./ExportDialog"
import { AdjustDialog } from "./AdjustDialog"
import { HarmonySelector } from "./HarmonySelector"
import { ContrastChecker } from "./ContrastChecker"
import { ColorBlindnessView } from "./ColorBlindnessView"
import { ColorDetailPanel } from "./ColorDetailPanel"
import { fetchColorNames } from "@/services/colorApi"

const MAX_COLORS = 30
const COLORS_PER_ROW = 10
const MIN_COLORS = 2
const DEFAULT_COLOR_COUNT = 5
const MAX_HISTORY = 50

function getInitialColors(): PaletteColor[] {
  // Check URL hash for shared palette
  const hash = window.location.hash
  if (hash.startsWith("#colors=")) {
    const hexes = hash
      .slice(8)
      .split("-")
      .map((h) => `#${h.toUpperCase()}`)
      .filter((h) => /^#[0-9A-F]{6}$/.test(h))
    if (hexes.length >= 2) {
      return hexes.map((hex) => ({ id: generateId(), hex, locked: false }))
    }
  }
  return generateRandomPalette(DEFAULT_COLOR_COUNT)
}

export function ColorPicker() {
  const [colors, setColors] = useState<PaletteColor[]>(getInitialColors)
  const [harmony, setHarmony] = useState<ColorHarmony>("random")
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Dialogs
  const [showExport, setShowExport] = useState(false)
  const [showAdjust, setShowAdjust] = useState(false)
  const [showHarmony, setShowHarmony] = useState(false)
  const [showContrast, setShowContrast] = useState(false)
  const [showBlindness, setShowBlindness] = useState(false)
  const [detailHex, setDetailHex] = useState<string | null>(null)

  // History (undo/redo)
  const [history, setHistory] = useState<PaletteColor[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const skipHistoryRef = useRef(false)

  // API color names (hex -> name)
  const [colorNames, setColorNames] = useState<Record<string, string>>({})

  const paletteRef = useRef<HTMLDivElement>(null)

  // Fetch color names from API when palette colors change
  useEffect(() => {
    let cancelled = false

    // Only fetch names for hexes we don't already have cached
    const hexesToFetch = colors
      .map(c => c.hex.toUpperCase())
      .filter(hex => !colorNames[hex])

    if (hexesToFetch.length === 0) return

    // Small debounce to avoid hammering API during rapid generation
    const timer = setTimeout(() => {
      fetchColorNames(hexesToFetch).then(names => {
        if (!cancelled && Object.keys(names).length > 0) {
          setColorNames(prev => ({ ...prev, ...names }))
        }
      })
    }, 150)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [colors, colorNames])

  // Push to history when colors change
  useEffect(() => {
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false
      return
    }
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push(colors)
      if (newHistory.length > MAX_HISTORY) newHistory.shift()
      return newHistory
    })
    setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1))
  }, [colors])

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      skipHistoryRef.current = true
      setHistoryIndex((prev) => prev - 1)
      setColors(history[historyIndex - 1])
    }
  }, [history, historyIndex])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      skipHistoryRef.current = true
      setHistoryIndex((prev) => prev + 1)
      setColors(history[historyIndex + 1])
    }
  }, [history, historyIndex])

  // Generate new palette (respecting locked colors)
  const generate = useCallback(() => {
    setColors((prev) => {
      const lockedColors = prev.filter((c) => c.locked)
      const lockedHexes = lockedColors.map((c) => c.hex)

      if (harmony === "random" || lockedHexes.length === 0) {
        // For random or no locked: generate new colors for unlocked slots
        if (lockedColors.length === 0) {
          if (harmony === "random") {
            return generateRandomPalette(prev.length)
          }
          const hexes = generateHarmony(harmony, prev.length)
          return hexes.map((hex) => ({ id: generateId(), hex, locked: false }))
        }

        // Some colors locked: generate harmony based on first locked color
        const baseHex = lockedHexes[0]
        const newHexes = harmony === "random"
          ? Array.from({ length: prev.length }, () => generateRandomHex())
          : generateHarmony(harmony, prev.length, baseHex)

        let newIndex = 0
        return prev.map((color) => {
          if (color.locked) {
            newIndex++
            return color
          }
          const hex = newHexes[newIndex] || generateRandomHex()
          newIndex++
          return { ...color, id: generateId(), hex }
        })
      }

      // Harmony with locked colors
      const baseHex = lockedHexes[0]
      const newHexes = generateHarmony(harmony, prev.length, baseHex)
      let newIndex = 0
      return prev.map((color) => {
        if (color.locked) {
          newIndex++
          return color
        }
        const hex = newHexes[newIndex] || generateRandomHex()
        newIndex++
        return { ...color, id: generateId(), hex }
      })
    })
  }, [harmony])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if focus is in an input
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return
      }

      // Any dialog open? Don't handle shortcuts
      if (showExport || showAdjust || showHarmony || showContrast || showBlindness || detailHex) {
        if (e.key === "Escape") {
          setShowExport(false)
          setShowAdjust(false)
          setShowHarmony(false)
          setShowContrast(false)
          setShowBlindness(false)
          setDetailHex(null)
        }
        return
      }

      switch (e.key) {
        case " ":
          e.preventDefault()
          generate()
          break
        case "z":
        case "Z":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            if (e.shiftKey) {
              redo()
            } else {
              undo()
            }
          }
          break
        case "y":
        case "Y":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            redo()
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [generate, undo, redo, showExport, showAdjust, showHarmony, showContrast, showBlindness, detailHex])

  // Lock/unlock a color
  const toggleLock = (id: string) => {
    setColors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, locked: !c.locked } : c))
    )
  }

  // Remove a color
  const removeColor = (id: string) => {
    if (colors.length <= MIN_COLORS) return
    setColors((prev) => prev.filter((c) => c.id !== id))
  }

  // Update a color's hex
  const updateColor = (id: string, hex: string) => {
    setColors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, hex } : c))
    )
  }

  // Add a color at a specific position
  const addColorAt = (index: number) => {
    if (colors.length >= MAX_COLORS) return

    let newHex: string
    if (index > 0 && index < colors.length) {
      // Blend between adjacent colors (gradient)
      newHex = blendColors(colors[index - 1].hex, colors[index].hex, 0.5)
    } else if (index === 0 && colors.length > 0) {
      // Add before first - generate a complementary-ish color
      newHex = blendColors(colors[0].hex, generateRandomHex(), 0.5)
    } else {
      newHex = generateRandomHex()
    }

    const newColor: PaletteColor = {
      id: generateId(),
      hex: newHex,
      locked: false,
    }

    setColors((prev) => {
      const next = [...prev]
      next.splice(index, 0, newColor)
      return next
    })
  }

  // Drag and drop reordering
  const handleDragStart = (index: number) => {
    setDragIndex(index)
  }

  const handleDragOver = (index: number) => {
    setDragOverIndex(index)
  }

  const handleDragEnd = () => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      setColors((prev) => {
        const next = [...prev]
        const [removed] = next.splice(dragIndex, 1)
        next.splice(dragOverIndex, 0, removed)
        return next
      })
    }
    setDragIndex(null)
    setDragOverIndex(null)
  }

  // Harmony change
  const handleHarmonyChange = (newHarmony: ColorHarmony) => {
    setHarmony(newHarmony)
  }

  // Apply adjusted colors
  const handleApplyAdjust = (adjusted: PaletteColor[]) => {
    setColors(adjusted)
  }

  // Chunk colors into rows of COLORS_PER_ROW
  const colorRows = useMemo(() => {
    const rows: PaletteColor[][] = []
    for (let i = 0; i < colors.length; i += COLORS_PER_ROW) {
      rows.push(colors.slice(i, i + COLORS_PER_ROW))
    }
    return rows
  }, [colors])

  return (
    <div className="h-full flex flex-col min-h-0">
      <PaletteToolbar
        harmony={harmony}
        onGenerate={generate}
        onShowHarmony={() => setShowHarmony(true)}
        onShowAdjust={() => setShowAdjust(true)}
        onShowExport={() => setShowExport(true)}
        onShowContrast={() => setShowContrast(true)}
        onShowBlindness={() => setShowBlindness(true)}
        onUndo={undo}
        onRedo={redo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
      />

      {/* Palette rows */}
      <div ref={paletteRef} className="flex-1 flex flex-col overflow-hidden">
        {colorRows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex-1 flex overflow-hidden min-h-0">
            {row.map((color, colIndex) => {
              const globalIndex = rowIndex * COLORS_PER_ROW + colIndex
              return (
                <ColorColumn
                  key={color.id}
                  color={color}
                  index={globalIndex}
                  total={colors.length}
                  apiColorName={colorNames[color.hex.toUpperCase()]}
                  onLock={() => toggleLock(color.id)}
                  onRemove={() => removeColor(color.id)}
                  onUpdate={(hex) => updateColor(color.id, hex)}
                  onAddBefore={() => addColorAt(globalIndex)}
                  onAddAfter={() => addColorAt(globalIndex + 1)}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  canRemove={colors.length > MIN_COLORS}
                  onShowDetail={() => setDetailHex(color.hex)}
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* Hint bar */}
      <div className="flex items-center justify-center gap-4 h-7 text-[10px] text-muted-foreground border-t border-border flex-shrink-0">
        <span>Press <kbd className="px-1 py-px rounded border border-border bg-muted font-mono text-[9px]">Space</kbd> to generate</span>
        <span className="hidden sm:inline">Click hex to edit</span>
        <span className="hidden md:inline">Drag to reorder</span>
        <span className="hidden lg:inline"><kbd className="px-1 py-px rounded border border-border bg-muted font-mono text-[9px]">Ctrl+Z</kbd> / <kbd className="px-1 py-px rounded border border-border bg-muted font-mono text-[9px]">Ctrl+Y</kbd> undo/redo</span>
      </div>

      {/* Dialogs */}
      {showExport && (
        <ExportDialog
          colors={colors}
          onClose={() => setShowExport(false)}
          paletteRef={paletteRef}
        />
      )}
      {showAdjust && (
        <AdjustDialog
          colors={colors}
          onApply={handleApplyAdjust}
          onClose={() => setShowAdjust(false)}
        />
      )}
      {showHarmony && (
        <HarmonySelector
          activeHarmony={harmony}
          onChange={handleHarmonyChange}
          onClose={() => setShowHarmony(false)}
        />
      )}
      {showContrast && (
        <ContrastChecker
          colors={colors}
          onClose={() => setShowContrast(false)}
        />
      )}
      {showBlindness && (
        <ColorBlindnessView
          colors={colors}
          onClose={() => setShowBlindness(false)}
        />
      )}
      {detailHex && (
        <ColorDetailPanel
          hex={detailHex}
          onClose={() => setDetailHex(null)}
          onSelectColor={(hex) => {
            setDetailHex(hex)
          }}
        />
      )}
    </div>
  )
}
