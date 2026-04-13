"use client"

import { useCallback } from "react"
import type {
  Layer,
  ToolMode,
  SelectedPoint,
  InteractionState,
  InteractionAction,
  ClipboardEntry,
} from "@/types/shapemaker"
import { processEvent } from "@/utils/shapemakerInteraction"

export interface KeyboardDeps {
  interactionState: InteractionState
  layers: Layer[]
  tool: ToolMode
  zoom: number
  panX: number
  panY: number
  snapEnabled: boolean
  gridSize: number
  activePathId: string | null
  clipboard: ClipboardEntry | null
  setTool: (tool: ToolMode) => void
  setCurveMode: (mode: "line" | "quadratic" | "cubic") => void
  setShowGrid: (fn: (v: boolean) => boolean) => void
  setSnapEnabled: (fn: (v: boolean) => boolean) => void
  setInteractionState: (state: InteractionState) => void
  dispatchActions: (actions: InteractionAction[]) => void
  handleNewPath: () => void
  handleClosePath: () => void
  handleDeleteSelectedPoint: () => void
  undo: () => void
  redo: () => void
}

export function useShapeMakerKeyboard(deps: KeyboardDeps) {
  const {
    interactionState,
    layers,
    tool,
    zoom,
    panX,
    panY,
    snapEnabled,
    gridSize,
    activePathId,
    clipboard,
    setTool,
    setCurveMode,
    setShowGrid,
    setSnapEnabled,
    setInteractionState,
    dispatchActions,
    handleNewPath,
    handleClosePath,
    handleDeleteSelectedPoint,
    undo,
    redo,
  } = deps

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return

      const mod = e.ctrlKey || e.metaKey

      // Route through state machine when a shape is selected
      if (interactionState.type === "shape-selected") {
        const result = processEvent(
          interactionState,
          {
            type: "keydown",
            key: e.key,
            ctrlKey: e.ctrlKey,
            metaKey: e.metaKey,
            shiftKey: e.shiftKey,
          },
          {
            layers,
            tool,
            zoom,
            panX,
            panY,
            snapEnabled,
            gridSize,
            hitTest: { type: "none" },
            activePathId,
          },
        )
        if (result.actions.length > 0 || result.newState !== interactionState) {
          setInteractionState(result.newState)
          dispatchActions(result.actions)
          e.preventDefault()
          return
        }
      }

      // Global Ctrl+V paste fallback (idle state)
      if (mod && e.key === "v" && interactionState.type === "idle" && clipboard) {
        dispatchActions([{ type: "paste" }])
        e.preventDefault()
        return
      }

      if (!mod && (e.key === "v" || e.key === "V")) {
        setTool("select")
      } else if (e.key === "p" || e.key === "P") {
        setTool("pen")
      } else if (e.key === "l" || e.key === "L") {
        setTool("line")
      } else if (e.key === "r" || e.key === "R") {
        setTool("rectangle")
      } else if (e.key === "o" || e.key === "O") {
        setTool("ellipse")
      } else if (e.key === "g" || e.key === "G") {
        setShowGrid((v) => !v)
      } else if (e.key === "s" || e.key === "S") {
        if (!mod) setSnapEnabled((v) => !v)
      } else if (e.key === "Escape") {
        if (interactionState.type !== "idle") {
          setInteractionState({ type: "idle" })
        }
        handleNewPath()
      } else if (e.key === "Enter") {
        handleClosePath()
      } else if (e.key === "Delete" || e.key === "Backspace") {
        handleDeleteSelectedPoint()
      } else if (mod && e.key === "z") {
        e.preventDefault()
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
      } else if (mod && e.key === "y") {
        e.preventDefault()
        redo()
      } else if (e.key === "1") {
        setCurveMode("line")
      } else if (e.key === "2") {
        setCurveMode("quadratic")
      } else if (e.key === "3") {
        setCurveMode("cubic")
      }
    },
    [
      interactionState,
      layers,
      tool,
      zoom,
      panX,
      panY,
      snapEnabled,
      gridSize,
      activePathId,
      clipboard,
      setTool,
      setCurveMode,
      setShowGrid,
      setSnapEnabled,
      setInteractionState,
      dispatchActions,
      handleNewPath,
      handleClosePath,
      handleDeleteSelectedPoint,
      undo,
      redo,
    ],
  )

  return handleKeyDown
}
