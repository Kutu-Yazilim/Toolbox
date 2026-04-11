"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import type { BoardElement, Camera, Bounds, ConnectionSide, SmartGuide } from "@/types/board"
import { renderBoard } from "@/utils/board"

interface RendererState {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  elements: BoardElement[]
  camera: Camera
  selectedIds: string[]
  gridEnabled: boolean
  gridSize: number
  selectionBox: Bounds | null
  previewElement: BoardElement | null
  hoveredElementId: string | null
  activeConnectionPoint: { elementId: string; side: ConnectionSide } | null
  smartGuides: SmartGuide[]
}

export function useCanvasRenderer(state: RendererState) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })

  const {
    canvasRef,
    elements,
    camera,
    selectedIds,
    gridEnabled,
    gridSize,
    selectionBox,
    previewElement,
    hoveredElementId,
    activeConnectionPoint,
    smartGuides,
  } = state

  // Resize observer
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCanvasSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = canvasSize.width * dpr
    canvas.height = canvasSize.height * dpr
    ctx.scale(dpr, dpr)

    renderBoard(
      ctx,
      elements,
      camera,
      selectedIds,
      canvasSize.width,
      canvasSize.height,
      gridEnabled,
      gridSize,
      selectionBox,
      previewElement,
      hoveredElementId,
      activeConnectionPoint,
      smartGuides
    )
  }, [
    canvasRef,
    elements,
    camera,
    selectedIds,
    canvasSize,
    gridEnabled,
    gridSize,
    selectionBox,
    previewElement,
    hoveredElementId,
    activeConnectionPoint,
    smartGuides,
  ])

  const requestRender = useCallback(() => {
    // The actual rendering is driven by the useEffect above via state dependencies
  }, [])

  return {
    containerRef,
    canvasSize,
    requestRender,
  }
}
