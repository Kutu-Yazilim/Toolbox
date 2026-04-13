"use client"

import { useMemo, useCallback } from "react"
import type { Layer, ToolMode } from "@/types/shapemaker"
import { useShapeMakerState } from "./useShapeMakerState"
import { useShapeMakerHistory } from "./useShapeMakerHistory"
import { useShapeMakerClipboard } from "./useShapeMakerClipboard"
import { useShapeMakerKeyboard } from "./useShapeMakerKeyboard"
import { ShapeMakerCanvas } from "./ShapeMakerCanvas"
import { PropertiesPanel } from "./PropertiesPanel"
import { LayersPanel } from "./LayersPanel"
import { CodeExportPanel } from "./CodeExportPanel"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useFileImport } from "@/hooks/useFileImport"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { type Preset } from "@/components/shared/PresetsDrawer"
import { SHAPEMAKER_PRESETS } from "./presets"
import {
  MousePointerIcon,
  PenToolIcon,
  MinusIcon,
  SquareIcon,
  CircleIcon,
  Undo2Icon,
  Redo2Icon,
  GridIcon,
  MagnetIcon,
  CodeIcon,
  LayersIcon,
  SlidersHorizontalIcon,
  ZoomInIcon,
  ZoomOutIcon,
  MaximizeIcon,
  XIcon,
  SplineIcon,
  WavesIcon,
} from "lucide-react"
import { useState } from "react"

type RightPanel = "properties" | "layers" | "code" | null

const TOOL_DEFS: {
  mode: ToolMode
  icon: typeof MousePointerIcon
  label: string
  shortcut: string
}[] = [
  { mode: "select", icon: MousePointerIcon, label: "Select", shortcut: "V" },
  { mode: "pen", icon: PenToolIcon, label: "Pen", shortcut: "P" },
  { mode: "line", icon: MinusIcon, label: "Line", shortcut: "L" },
  { mode: "rectangle", icon: SquareIcon, label: "Rectangle", shortcut: "R" },
  { mode: "ellipse", icon: CircleIcon, label: "Ellipse", shortcut: "O" },
]

const CURVE_MODE_DEFS: {
  mode: "line" | "quadratic" | "cubic"
  icon: typeof MinusIcon
  label: string
  shortcut: string
}[] = [
  { mode: "line", icon: MinusIcon, label: "Straight", shortcut: "1" },
  { mode: "quadratic", icon: SplineIcon, label: "Quadratic", shortcut: "2" },
  { mode: "cubic", icon: WavesIcon, label: "Cubic", shortcut: "3" },
]

export function ShapeMaker() {
  const historyApi = useShapeMakerHistory()
  const clipboardApi = useShapeMakerClipboard()
  const state = useShapeMakerState(historyApi, clipboardApi)

  // Panels
  const [rightPanel, setRightPanel] = useState<RightPanel>("layers")

  // Undo/redo wrappers that apply restored state
  const handleUndo = useCallback(() => {
    const entry = historyApi.undo()
    if (entry) {
      state.setLayers(JSON.parse(JSON.stringify(entry.layers)))
      state.setActiveLayerId(entry.activeLayerId)
      state.setActivePathId(entry.activePathId)
      state.setInteractionState({ type: "idle" })
    }
  }, [historyApi, state])

  const handleRedo = useCallback(() => {
    const entry = historyApi.redo()
    if (entry) {
      state.setLayers(JSON.parse(JSON.stringify(entry.layers)))
      state.setActiveLayerId(entry.activeLayerId)
      state.setActivePathId(entry.activePathId)
      state.setInteractionState({ type: "idle" })
    }
  }, [historyApi, state])

  // Keyboard handler
  const handleKeyDown = useShapeMakerKeyboard({
    interactionState: state.interactionState,
    layers: state.layers,
    tool: state.tool,
    zoom: state.zoom,
    panX: state.panX,
    panY: state.panY,
    snapEnabled: state.snapEnabled,
    gridSize: state.gridSize,
    activePathId: state.activePathId,
    clipboard: clipboardApi.clipboard,
    setTool: state.setTool,
    setCurveMode: state.setCurveMode,
    setShowGrid: state.setShowGrid,
    setSnapEnabled: state.setSnapEnabled,
    setInteractionState: state.setInteractionState,
    dispatchActions: state.dispatchActions,
    handleNewPath: state.handleNewPath,
    handleClosePath: state.handleClosePath,
    handleDeleteSelectedPoint: state.handleDeleteSelectedPoint,
    undo: handleUndo,
    redo: handleRedo,
  })

  // File import (JSON)
  const { dropzoneProps: shapeDropzone, isDragging: isShapeDragging } = useFileImport({
    accept: [".json"],
    onImport: useCallback((content: string) => {
      try {
        const data = JSON.parse(content)
        if (Array.isArray(data) && data.length > 0 && data[0].paths !== undefined) {
          state.setLayers(data as Layer[])
          state.setActiveLayerId(data[0].id)
          state.setActivePathId(null)
        }
      } catch {
        // Invalid file
      }
    }, [state]),
  })

  // Presets
  const handleShapePresetSelect = useCallback((_preset: Preset) => {
    // Template presets -- for now act as a fresh start
  }, [])

  // Export options
  const shapeExportOptions = useMemo(() => [
    {
      label: "Export JSON",
      action: () => {
        const blob = new Blob([JSON.stringify(state.layers, null, 2)], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "shape.json"
        a.click()
        URL.revokeObjectURL(url)
      },
    },
  ], [state.layers])

  const shapeToolbarShortcuts = useMemo(() => [
    { key: "mod+shift+e", label: "Export JSON", action: () => shapeExportOptions[0].action() },
  ], [shapeExportOptions])

  return (
    <div
      className="h-full flex flex-col min-h-0"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      {...shapeDropzone}
    >
      {isShapeDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-lg">
          <span className="text-sm font-medium text-primary">Drop JSON file here</span>
        </div>
      )}
      <ToolToolbar
        title="Shape Maker"
        exportOptions={shapeExportOptions}
        presets={SHAPEMAKER_PRESETS}
        onPresetSelect={handleShapePresetSelect}
        shortcuts={shapeToolbarShortcuts}
      />
      {/* Canvas Toolbar */}
      <div className="flex items-center gap-1 px-2 h-10 border-b border-border flex-shrink-0 overflow-x-auto">
        {/* Drawing tools */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-border">
          {TOOL_DEFS.map((t) => (
            <button
              key={t.mode}
              onClick={() => state.setTool(t.mode)}
              title={`${t.label} (${t.shortcut})`}
              className={cn(
                "p-1.5 rounded transition-colors",
                state.tool === t.mode
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              <t.icon className="h-4 w-4" />
            </button>
          ))}
        </div>

        {/* Curve mode (visible when pen tool active) */}
        {state.tool === "pen" && (
          <div className="flex items-center gap-0.5 pr-2 border-r border-border">
            {CURVE_MODE_DEFS.map((c) => (
              <button
                key={c.mode}
                onClick={() => state.setCurveMode(c.mode)}
                title={`${c.label} (${c.shortcut})`}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  state.curveMode === c.mode
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <c.icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        )}

        {/* Path actions */}
        {state.tool === "pen" && state.activePathId && (
          <div className="flex items-center gap-0.5 pr-2 border-r border-border">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={state.handleClosePath}
              title="Close path (Enter)"
              className="text-muted-foreground"
            >
              <XIcon className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={state.handleNewPath}
              title="New path (Esc)"
              className="text-muted-foreground"
            >
              <PenToolIcon className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* View controls */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-border">
          <button
            onClick={() => state.setShowGrid((v) => !v)}
            title="Toggle grid (G)"
            className={cn(
              "p-1.5 rounded transition-colors",
              state.showGrid
                ? "text-foreground bg-muted/50"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <GridIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => state.setSnapEnabled((v) => !v)}
            title="Toggle snap (S)"
            className={cn(
              "p-1.5 rounded transition-colors",
              state.snapEnabled
                ? "text-foreground bg-muted/50"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <MagnetIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-border">
          <button
            onClick={() => state.setZoom(Math.max(0.1, state.zoom * 0.8))}
            title="Zoom out"
            className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <ZoomOutIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              state.setZoom(1)
              state.setPanX(0)
              state.setPanY(0)
            }}
            title="Reset view"
            className="px-1.5 py-0.5 rounded text-xs font-mono text-muted-foreground hover:text-foreground transition-colors min-w-[40px] text-center"
          >
            {(state.zoom * 100).toFixed(0)}%
          </button>
          <button
            onClick={() => state.setZoom(Math.min(10, state.zoom * 1.25))}
            title="Zoom in"
            className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <ZoomInIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              state.setZoom(1)
              state.setPanX(0)
              state.setPanY(0)
            }}
            title="Fit to view"
            className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <MaximizeIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-border">
          <button
            onClick={handleUndo}
            disabled={!historyApi.canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
          >
            <Undo2Icon className="h-4 w-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!historyApi.canRedo}
            title="Redo (Ctrl+Shift+Z)"
            className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
          >
            <Redo2Icon className="h-4 w-4" />
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Panel toggles */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() =>
              setRightPanel((p) => (p === "layers" ? null : "layers"))
            }
            title="Layers"
            className={cn(
              "p-1.5 rounded transition-colors",
              rightPanel === "layers"
                ? "text-foreground bg-muted/50"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LayersIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() =>
              setRightPanel((p) =>
                p === "properties" ? null : "properties",
              )
            }
            title="Properties"
            className={cn(
              "p-1.5 rounded transition-colors",
              rightPanel === "properties"
                ? "text-foreground bg-muted/50"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <SlidersHorizontalIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() =>
              setRightPanel((p) => (p === "code" ? null : "code"))
            }
            title="Export Code"
            className={cn(
              "p-1.5 rounded transition-colors",
              rightPanel === "code"
                ? "text-foreground bg-muted/50"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <CodeIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex min-h-0">
        {/* Canvas */}
        <ShapeMakerCanvas
          layers={state.layers}
          activeLayerId={state.activeLayerId}
          activePathId={state.activePathId}
          selectedPathIds={state.selectedPathIds}
          tool={state.tool}
          snapEnabled={state.snapEnabled}
          gridSize={state.gridSize}
          showGrid={state.showGrid}
          zoom={state.zoom}
          panX={state.panX}
          panY={state.panY}
          selectedPoint={state.selectedPoint}
          backgroundColor={state.backgroundColor}
          onUpdatePath={() => {}}
          onAddSegment={state.handleAddSegment}
          onSelectPoint={state.handleSelectPoint}
          onMovePoint={state.handleMovePoint}
          onPanChange={(x, y) => {
            state.setPanX(x)
            state.setPanY(y)
          }}
          onZoomChange={state.setZoom}
          onFinishShape={state.handleFinishShape}
          onSelectPath={(id) => state.setActivePathId(id)}
          onDragStart={() => historyApi.push(state.layers, state.activeLayerId, state.activePathId)}
          curveMode={state.curveMode}
          interactionState={state.interactionState}
          onInteractionStateChange={state.setInteractionState}
          onDispatchActions={state.dispatchActions}
        />

        {/* Right panel */}
        {rightPanel && (
          <div className="w-64 flex-shrink-0 border-l border-border overflow-hidden flex flex-col">
            {/* Panel tabs */}
            <div className="flex h-8 border-b border-border flex-shrink-0">
              <button
                onClick={() => setRightPanel("layers")}
                className={cn(
                  "flex-1 text-xs font-medium transition-colors",
                  rightPanel === "layers"
                    ? "text-foreground border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Layers
              </button>
              <button
                onClick={() => setRightPanel("properties")}
                className={cn(
                  "flex-1 text-xs font-medium transition-colors",
                  rightPanel === "properties"
                    ? "text-foreground border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Properties
              </button>
              <button
                onClick={() => setRightPanel("code")}
                className={cn(
                  "flex-1 text-xs font-medium transition-colors",
                  rightPanel === "code"
                    ? "text-foreground border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Code
              </button>
            </div>

            {/* Panel content */}
            <div className="flex-1 min-h-0">
              {rightPanel === "layers" && (
                <LayersPanel
                  layers={state.layers}
                  activeLayerId={state.activeLayerId}
                  activePathId={state.activePathId}
                  selectedPathIds={state.selectedPathIds}
                  onSelectLayer={state.setActiveLayerId}
                  onSelectPath={(id) => state.setActivePathId(id)}
                  onAddLayer={state.handleAddLayer}
                  onDeleteLayer={state.handleDeleteLayer}
                  onToggleLayerVisibility={state.handleToggleLayerVisibility}
                  onToggleLayerLock={state.handleToggleLayerLock}
                  onAddPath={state.handleAddPath}
                  onDeletePath={state.handleDeletePath}
                  onTogglePathVisibility={state.handleTogglePathVisibility}
                  onTogglePathLock={state.handleTogglePathLock}
                  onDuplicatePath={state.handleDuplicatePath}
                  onRenameLayer={state.handleRenameLayer}
                />
              )}
              {rightPanel === "properties" && (
                <PropertiesPanel
                  path={state.activePath}
                  interactionState={state.interactionState}
                  onUpdatePaint={state.handleUpdatePaint}
                  onUpdatePath={state.handleUpdatePath}
                  onUpdateTransform={state.handleUpdateTransform}
                />
              )}
              {rightPanel === "code" && (
                <CodeExportPanel
                  layers={state.layers}
                  canvasWidth={state.canvasWidth}
                  canvasHeight={state.canvasHeight}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
