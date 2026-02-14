import { Button } from "@/components/ui/button"
import type { ColorHarmony } from "@/types/color"
import {
  SlidersHorizontalIcon,
  DownloadIcon,
  EyeIcon,
  ContrastIcon,
  PaletteIcon,
  UndoIcon,
  RedoIcon,
} from "lucide-react"

interface PaletteToolbarProps {
  harmony: ColorHarmony
  onGenerate: () => void
  onShowHarmony: () => void
  onShowAdjust: () => void
  onShowExport: () => void
  onShowContrast: () => void
  onShowBlindness: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
}

export function PaletteToolbar({
  harmony,
  onGenerate,
  onShowHarmony,
  onShowAdjust,
  onShowExport,
  onShowContrast,
  onShowBlindness,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: PaletteToolbarProps) {
  const harmonyLabels: Record<ColorHarmony, string> = {
    random: "Random",
    complementary: "Complementary",
    analogous: "Analogous",
    triadic: "Triadic",
    "split-complementary": "Split Comp.",
    tetradic: "Tetradic",
    monochromatic: "Monochromatic",
  }

  return (
    <div className="flex items-center justify-between gap-2 px-4 py-2 bg-card border-b border-border flex-wrap">
      {/* Left: Generate & Harmony */}
      <div className="flex items-center gap-2">
        <Button onClick={onGenerate} size="sm" className="gap-1.5">
          Generate
          <kbd className="ml-1 hidden sm:inline-flex h-5 items-center rounded border border-primary-foreground/30 px-1.5 text-[10px] font-mono">
            Space
          </kbd>
        </Button>

        <Button
          onClick={onShowHarmony}
          variant="outline"
          size="sm"
          className="gap-1.5"
        >
          <PaletteIcon className="size-4" />
          <span className="hidden sm:inline">{harmonyLabels[harmony]}</span>
        </Button>

        {/* Undo / Redo */}
        <div className="flex items-center border border-border rounded-md">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="rounded-r-none"
          >
            <UndoIcon className="size-3.5" />
          </Button>
          <div className="w-px h-4 bg-border" />
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="rounded-l-none"
          >
            <RedoIcon className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Right: Tools */}
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" onClick={onShowAdjust} className="gap-1.5">
          <SlidersHorizontalIcon className="size-4" />
          <span className="hidden sm:inline">Adjust</span>
        </Button>
        <Button variant="outline" size="sm" onClick={onShowContrast} className="gap-1.5">
          <ContrastIcon className="size-4" />
          <span className="hidden sm:inline">Contrast</span>
        </Button>
        <Button variant="outline" size="sm" onClick={onShowBlindness} className="gap-1.5">
          <EyeIcon className="size-4" />
          <span className="hidden sm:inline">Vision</span>
        </Button>
        <Button variant="outline" size="sm" onClick={onShowExport} className="gap-1.5">
          <DownloadIcon className="size-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </div>
    </div>
  )
}
