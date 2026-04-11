"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import type { Camera } from "@/types/board"
import {
  UndoIcon,
  RedoIcon,
  ZoomInIcon,
  ZoomOutIcon,
  MaximizeIcon,
  GridIcon,
  UploadIcon,
  ImageIcon,
  FileIcon,
  FileCodeIcon,
  EyeOffIcon,
  LayersIcon,
  MapIcon,
  FileJsonIcon,
  KeyboardIcon,
} from "lucide-react"

interface BoardTopBarProps {
  camera: Camera
  gridEnabled: boolean
  gridSize: number
  canUndo: boolean
  canRedo: boolean
  transparentBg: boolean
  layersPanelOpen: boolean
  minimapOpen: boolean
  onCameraChange: (camera: Camera) => void
  onToggleGrid: () => void
  onGridSizeChange: (size: number) => void
  onUndo: () => void
  onRedo: () => void
  onExportPng: () => void
  onExportSvg: () => void
  onExportJson: () => void
  onSaveKutud: () => void
  onLoadKutud: (file: File) => void
  onFitToScreen: () => void
  onToggleTransparentBg: () => void
  onToggleLayers: () => void
  onToggleMinimap: () => void
}

const GRID_SIZES = [10, 20, 40, 80] as const

export function BoardTopBar({
  camera,
  gridEnabled,
  gridSize,
  canUndo,
  canRedo,
  transparentBg,
  layersPanelOpen,
  minimapOpen,
  onCameraChange,
  onToggleGrid,
  onGridSizeChange,
  onUndo,
  onRedo,
  onExportPng,
  onExportSvg,
  onExportJson,
  onSaveKutud,
  onLoadKutud,
  onFitToScreen,
  onToggleTransparentBg,
  onToggleLayers,
  onToggleMinimap,
}: BoardTopBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const zoomIn = () => {
    const newZoom = Math.min(10, camera.zoom * 1.2)
    onCameraChange({ ...camera, zoom: newZoom })
  }

  const zoomOut = () => {
    const newZoom = Math.max(0.1, camera.zoom / 1.2)
    onCameraChange({ ...camera, zoom: newZoom })
  }

  const resetZoom = () => {
    onCameraChange({ ...camera, zoom: 1 })
  }

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center justify-center gap-1 md:gap-2 scale-90 md:scale-100 origin-top">
      {/* Undo/Redo */}
      <div className="flex items-center bg-card border border-border rounded-lg shadow-sm">
        <Button variant="ghost" size="icon-xs" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)" className="rounded-r-none">
          <UndoIcon className="size-3.5" />
        </Button>
        <div className="w-px h-5 bg-border" />
        <Button variant="ghost" size="icon-xs" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)" className="rounded-l-none">
          <RedoIcon className="size-3.5" />
        </Button>
      </div>

      {/* Zoom controls */}
      <div className="flex items-center bg-card border border-border rounded-lg shadow-sm">
        <Button variant="ghost" size="icon-xs" onClick={zoomOut} title="Zoom out" className="rounded-r-none">
          <ZoomOutIcon className="size-3.5" />
        </Button>
        <button
          onClick={resetZoom}
          className="px-2 h-6 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors min-w-[50px] text-center"
          title="Reset zoom"
        >
          {Math.round(camera.zoom * 100)}%
        </button>
        <Button variant="ghost" size="icon-xs" onClick={zoomIn} title="Zoom in" className="rounded-l-none">
          <ZoomInIcon className="size-3.5" />
        </Button>
      </div>

      {/* View controls */}
      <div className="flex items-center bg-card border border-border rounded-lg shadow-sm">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onToggleGrid}
          title={gridEnabled ? "Hide grid" : "Show grid"}
          className={gridEnabled ? "text-primary" : ""}
        >
          <GridIcon className="size-3.5" />
        </Button>
        {gridEnabled && (
          <>
            <div className="w-px h-5 bg-border" />
            <select
              value={gridSize}
              onChange={(e) => onGridSizeChange(Number(e.target.value))}
              className="h-6 px-1 text-[10px] bg-transparent border-none outline-none cursor-pointer text-muted-foreground hover:text-foreground"
              title="Grid size"
            >
              {GRID_SIZES.map((s) => (
                <option key={s} value={s}>{s}px</option>
              ))}
            </select>
          </>
        )}
        <div className="w-px h-5 bg-border" />
        <Button variant="ghost" size="icon-xs" onClick={onFitToScreen} title="Fit to screen">
          <MaximizeIcon className="size-3.5" />
        </Button>
        <div className="w-px h-5 bg-border" />
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onToggleLayers}
          title={layersPanelOpen ? "Hide layers" : "Show layers"}
          className={layersPanelOpen ? "text-primary" : ""}
        >
          <LayersIcon className="size-3.5" />
        </Button>
        <div className="w-px h-5 bg-border" />
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onToggleMinimap}
          title={minimapOpen ? "Hide minimap" : "Show minimap"}
          className={minimapOpen ? "text-primary" : ""}
        >
          <MapIcon className="size-3.5" />
        </Button>
      </div>

      {/* File operations */}
      <div className="flex items-center bg-card border border-border rounded-lg shadow-sm">
        <Button variant="ghost" size="icon-xs" onClick={onSaveKutud} title="Save as .kutud" className="rounded-r-none">
          <FileIcon className="size-3.5" />
        </Button>
        <div className="w-px h-5 bg-border" />
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => fileInputRef.current?.click()}
          title="Open .kutud file"
        >
          <UploadIcon className="size-3.5" />
        </Button>
        <div className="w-px h-5 bg-border" />
        <Button variant="ghost" size="icon-xs" onClick={onExportPng} title="Export as PNG">
          <ImageIcon className="size-3.5" />
        </Button>
        <div className="w-px h-5 bg-border" />
        <Button variant="ghost" size="icon-xs" onClick={onExportSvg} title="Export as SVG">
          <FileCodeIcon className="size-3.5" />
        </Button>
        <div className="w-px h-5 bg-border" />
        <Button variant="ghost" size="icon-xs" onClick={onExportJson} title="Export as JSON">
          <FileJsonIcon className="size-3.5" />
        </Button>
        <div className="w-px h-5 bg-border" />
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onToggleTransparentBg}
          title={transparentBg ? "Use white background for export" : "Use transparent background for export"}
          className={`rounded-l-none ${transparentBg ? "text-primary" : ""}`}
        >
          <EyeOffIcon className="size-3.5" />
        </Button>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="flex items-center bg-card border border-border rounded-lg shadow-sm">
        <Button variant="ghost" size="icon-xs" title="Keyboard shortcuts (?)" className="text-muted-foreground">
          <KeyboardIcon className="size-3.5" />
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".kutud"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            onLoadKutud(file)
            e.target.value = ""
          }
        }}
      />
    </div>
  )
}
