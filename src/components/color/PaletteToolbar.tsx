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
    <div className="flex items-center justify-between px-3 h-9 border-b border-border flex-shrink-0">
      {/* Left: Generate & Harmony */}
      <div className="flex items-center gap-1.5">
        <Button onClick={onGenerate} size="xs">
          <span className="text-[11px]">Generate</span>
        </Button>

        <div className="w-px h-4 bg-border mx-0.5" />

        <Button
          onClick={onShowHarmony}
          variant="ghost"
          size="xs"
          title="Color harmony"
        >
          <PaletteIcon className="h-3 w-3" />
          <span className="hidden sm:inline text-[10px]">{harmonyLabels[harmony]}</span>
        </Button>

        <div className="w-px h-4 bg-border mx-0.5" />

        {/* Undo / Redo */}
        <Button
          variant="ghost"
          size="xs"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <UndoIcon className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          <RedoIcon className="h-3 w-3" />
        </Button>
      </div>

      {/* Right: Tools */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="xs" onClick={onShowAdjust} title="Adjust colors">
          <SlidersHorizontalIcon className="h-3 w-3" />
          <span className="hidden sm:inline text-[10px]">Adjust</span>
        </Button>
        <Button variant="ghost" size="xs" onClick={onShowContrast} title="Contrast checker">
          <ContrastIcon className="h-3 w-3" />
          <span className="hidden sm:inline text-[10px]">Contrast</span>
        </Button>
        <Button variant="ghost" size="xs" onClick={onShowBlindness} title="Color blindness view">
          <EyeIcon className="h-3 w-3" />
          <span className="hidden sm:inline text-[10px]">Vision</span>
        </Button>
        <div className="w-px h-4 bg-border mx-0.5" />
        <Button variant="ghost" size="xs" onClick={onShowExport} title="Export palette">
          <DownloadIcon className="h-3 w-3" />
          <span className="hidden sm:inline text-[10px]">Export</span>
        </Button>
      </div>
    </div>
  )
}
