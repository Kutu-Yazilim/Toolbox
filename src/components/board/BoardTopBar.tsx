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
} from "lucide-react"

interface BoardTopBarProps {
  camera: Camera
  gridEnabled: boolean
  canUndo: boolean
  canRedo: boolean
  onCameraChange: (camera: Camera) => void
  onToggleGrid: () => void
  onUndo: () => void
  onRedo: () => void
  onExportPng: () => void
  onSaveKutud: () => void
  onLoadKutud: (file: File) => void
  onFitToScreen: () => void
}

export function BoardTopBar({
  camera,
  gridEnabled,
  canUndo,
  canRedo,
  onCameraChange,
  onToggleGrid,
  onUndo,
  onRedo,
  onExportPng,
  onSaveKutud,
  onLoadKutud,
  onFitToScreen,
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
        <div className="w-px h-5 bg-border" />
        <Button variant="ghost" size="icon-xs" onClick={onFitToScreen} title="Fit to screen">
          <MaximizeIcon className="size-3.5" />
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
        <Button variant="ghost" size="icon-xs" onClick={onExportPng} title="Export as PNG" className="rounded-l-none">
          <ImageIcon className="size-3.5" />
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
