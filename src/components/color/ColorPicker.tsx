"use client"

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
import { useColorHistory } from "./useColorHistory"
import { useColorNames } from "./useColorNames"
import { usePaletteDrag } from "./usePaletteDrag"
import { useColorStore } from "./useColorStore"
import { ColorPickerModal } from "./ColorPickerModal"
import { PalettesDrawer } from "./PalettesDrawer"
import { ImageExtractorModal } from "./ImageExtractorModal"
import { GradientEditor } from "./GradientEditor"
import type { SavedPalette } from "./colorTypes"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useShareableUrl } from "@/hooks/useShareableUrl"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { type Preset } from "@/components/shared/PresetsDrawer"
import { COLOR_PICKER_PRESETS } from "./presets"

const MAX_COLORS = 30
const COLORS_PER_ROW = 10
const MIN_COLORS = 2
const DEFAULT_COLOR_COUNT = 5
const MAX_HISTORY = 50

function getInitialColors(): PaletteColor[] {
  if (typeof window === "undefined") return generateRandomPalette(DEFAULT_COLOR_COUNT)
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
  const [savedColors, setSavedColors] = useLocalStorage<string[]>("color-picker-saved", [])
  const [colors, setColors] = useState<PaletteColor[]>(getInitialColors)
  const [harmony, setHarmony] = useState<ColorHarmony>("random")

  // Hooks replacing inline logic
  const { pushState, undo: undoHistory, redo: redoHistory, canUndo, canRedo } = useColorHistory<PaletteColor[]>()
  const { getName, preloadNames } = useColorNames()
  const { handleDragStart, handleDragOver, handleDrop, handleDragEnd, dragOverIndex } = usePaletteDrag(colors, setColors)
  const { palettes, savePalette, deletePalette, updatePalette, loaded } = useColorStore()

  // Dialogs
  const [showExport, setShowExport] = useState(false)
  const [showAdjust, setShowAdjust] = useState(false)
  const [showHarmony, setShowHarmony] = useState(false)
  const [showContrast, setShowContrast] = useState(false)
  const [showBlindness, setShowBlindness] = useState(false)
  const [detailHex, setDetailHex] = useState<string | null>(null)

  // New dialog/drawer states
  const [palettesOpen, setPalettesOpen] = useState(false)
  const [extractOpen, setExtractOpen] = useState(false)
  const [gradientMode, setGradientMode] = useState(false)
  const [colorPickerHex, setColorPickerHex] = useState<{ id: string; hex: string } | null>(null)

  const paletteRef = useRef<HTMLDivElement>(null)

  // Preload color names when colors change
  useEffect(() => {
    preloadNames(colors.map(c => c.hex))
  }, [colors, preloadNames])

  // Push to history when colors change
  useEffect(() => {
    pushState(colors)
  }, [colors, pushState])

  const undo = useCallback(() => {
    const state = undoHistory()
    if (state) setColors(state)
  }, [undoHistory])

  const redo = useCallback(() => {
    const state = redoHistory()
    if (state) setColors(state)
  }, [redoHistory])

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

  // Harmony change
  const handleHarmonyChange = (newHarmony: ColorHarmony) => {
    setHarmony(newHarmony)
  }

  // Apply adjusted colors
  const handleApplyAdjust = (adjusted: PaletteColor[]) => {
    setColors(adjusted)
  }

  // Palette save/load handlers
  const handleSavePalette = (name: string) => {
    savePalette({
      id: crypto.randomUUID(),
      name,
      colors: colors.map(c => c.hex),
      harmony,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  }

  const handleLoadPalette = (palette: SavedPalette) => {
    const newColors = palette.colors.map(hex => ({ id: generateId(), hex, locked: false }))
    setColors(newColors)
    pushState(newColors)
    setPalettesOpen(false)
  }

  const handleRenamePalette = (id: string, name: string) => {
    const palette = palettes.find(p => p.id === id)
    if (palette) {
      updatePalette({ ...palette, name, updatedAt: Date.now() })
    }
  }

  // Image extraction handlers
  const handleUseAsPalette = (hexes: string[]) => {
    const newColors = hexes.map(hex => ({ id: generateId(), hex, locked: false }))
    setColors(newColors)
    pushState(newColors)
    setExtractOpen(false)
  }

  const handleAddToPalette = (hexes: string[]) => {
    const newColors = [...colors, ...hexes.map(hex => ({ id: generateId(), hex, locked: false }))]
    setColors(newColors.slice(0, MAX_COLORS))
    pushState(newColors.slice(0, MAX_COLORS))
    setExtractOpen(false)
  }

  // Gradient to palette handler
  const handleGradientToPalette = (gradientColors: string[]) => {
    const newColors = gradientColors.map(hex => ({ id: generateId(), hex, locked: false }))
    setColors(newColors)
    pushState(newColors)
    setGradientMode(false)
  }

  // Color picker modal handler
  const handleColorPickerApply = (hex: string) => {
    if (colorPickerHex) {
      updateColor(colorPickerHex.id, hex)
      setColorPickerHex(null)
    }
  }

  // Chunk colors into rows of COLORS_PER_ROW
  const colorRows = useMemo(() => {
    const rows: PaletteColor[][] = []
    for (let i = 0; i < colors.length; i += COLORS_PER_ROW) {
      rows.push(colors.slice(i, i + COLORS_PER_ROW))
    }
    return rows
  }, [colors])

  // Persist color hex values to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      setSavedColors(colors.map(c => c.hex))
    }, 500)
    return () => clearTimeout(timer)
  }, [colors, setSavedColors])

  // Shareable URL
  const shareableHexes = useMemo(() => colors.map(c => c.hex), [colors])
  const { shareUrl } = useShareableUrl("color-picker", shareableHexes, useCallback((hexes: string[]) => {
    setColors(hexes.map(hex => ({ id: generateId(), hex, locked: false })))
  }, []))

  // Preset handling
  const handlePresetSelect = useCallback((preset: Preset) => {
    const hexes = JSON.parse(preset.content) as string[]
    setColors(hexes.map(hex => ({ id: generateId(), hex, locked: false })))
  }, [])

  // Copy value: hex values joined
  const copyValue = useMemo(() => colors.map(c => c.hex).join(", "), [colors])

  // Export options
  const exportOptions = useMemo(() => [
    {
      label: "Copy Hex Values",
      action: () => navigator.clipboard.writeText(colors.map(c => c.hex).join(", ")),
    },
    {
      label: "Copy CSS Variables",
      action: () => {
        const css = colors.map((c, i) => `  --color-${i + 1}: ${c.hex};`).join("\n")
        navigator.clipboard.writeText(`:root {\n${css}\n}`)
      },
    },
    {
      label: "Copy JSON Array",
      action: () => navigator.clipboard.writeText(JSON.stringify(colors.map(c => c.hex))),
    },
  ], [colors])

  // ToolToolbar shortcuts (separate from existing keyboard handler)
  const toolbarShortcuts = useMemo(() => [
    { key: "mod+shift+c", label: "Copy Hex Values", action: () => navigator.clipboard.writeText(copyValue) },
    { key: "mod+shift+s", label: "Share URL", action: () => { shareUrl() } },
  ], [copyValue, shareUrl])

  useKeyboardShortcuts(toolbarShortcuts)

  return (
    <div className="h-full flex flex-col min-h-0">
      <ToolToolbar
        title="Color Palette"
        copyValue={copyValue}
        onShare={shareUrl}
        exportOptions={exportOptions}
        presets={COLOR_PICKER_PRESETS}
        onPresetSelect={handlePresetSelect}
        shortcuts={toolbarShortcuts}
      />
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
        canUndo={canUndo}
        canRedo={canRedo}
        onPalettesOpen={() => setPalettesOpen(true)}
        onExtractOpen={() => setExtractOpen(true)}
        onGradientToggle={() => setGradientMode(prev => !prev)}
        gradientMode={gradientMode}
      />

      {/* Palette rows or Gradient editor */}
      <div ref={paletteRef} className="flex-1 flex flex-col overflow-hidden">
        {gradientMode ? (
          <div className="flex-1 overflow-y-auto p-4">
            <GradientEditor
              initialColors={colors.map(c => c.hex)}
              onToPalette={handleGradientToPalette}
            />
          </div>
        ) : (
          colorRows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex-1 flex overflow-hidden min-h-0">
              {row.map((color, colIndex) => {
                const globalIndex = rowIndex * COLORS_PER_ROW + colIndex
                return (
                  <ColorColumn
                    key={color.id}
                    color={color}
                    index={globalIndex}
                    total={colors.length}
                    apiColorName={getName(color.hex) ?? undefined}
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
                    onOpenColorPicker={() => setColorPickerHex({ id: color.id, hex: color.hex })}
                  />
                )
              })}
            </div>
          ))
        )}
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
      <PalettesDrawer
        open={palettesOpen}
        onClose={() => setPalettesOpen(false)}
        palettes={palettes}
        onSave={handleSavePalette}
        onLoad={handleLoadPalette}
        onDelete={deletePalette}
        onRename={handleRenamePalette}
      />
      {extractOpen && (
        <ImageExtractorModal
          onUseAsPalette={handleUseAsPalette}
          onAddToPalette={handleAddToPalette}
          onClose={() => setExtractOpen(false)}
        />
      )}
      {colorPickerHex && (
        <ColorPickerModal
          hex={colorPickerHex.hex}
          onApply={handleColorPickerApply}
          onClose={() => setColorPickerHex(null)}
        />
      )}
    </div>
  )
}
