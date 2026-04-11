"use client"

import { useEffect, useRef, useCallback } from "react"
import type { BoardElement, Camera, Bounds } from "@/types/board"
import { getElementBounds } from "@/utils/board"

// ── Constants ──────────────────────────────────────────────────

const MINIMAP_WIDTH = 150
const MINIMAP_HEIGHT = 100
const MINIMAP_PADDING = 10
const VIEWPORT_STROKE_COLOR = "rgba(59, 130, 246, 0.8)"
const VIEWPORT_FILL_COLOR = "rgba(59, 130, 246, 0.15)"
const VIEWPORT_LINE_WIDTH = 1.5
const ELEMENT_MIN_SIZE = 2
const ELEMENT_MAX_SIZE = 4
const DEFAULT_ELEMENT_COLOR = "#6B7280"

// ── Props ──────────────────────────────────────────────────────

interface MinimapProps {
  elements: BoardElement[]
  camera: Camera
  canvasWidth: number
  canvasHeight: number
  onNavigate: (worldX: number, worldY: number) => void
}

// ── Helpers ────────────────────────────────────────────────────

function getWorldBounds(elements: BoardElement[]): Bounds {
  if (elements.length === 0) {
    return { x: 0, y: 0, width: 1000, height: 1000 }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const el of elements) {
    const b = getElementBounds(el)
    minX = Math.min(minX, b.x)
    minY = Math.min(minY, b.y)
    maxX = Math.max(maxX, b.x + b.width)
    maxY = Math.max(maxY, b.y + b.height)
  }

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

function getElementColor(el: BoardElement): string {
  if (el.style.fillColor && el.style.fillColor !== "transparent") {
    return el.style.fillColor
  }
  if (el.style.strokeColor) {
    return el.style.strokeColor
  }
  return DEFAULT_ELEMENT_COLOR
}

// ── Component ──────────────────────────────────────────────────

export default function Minimap({
  elements,
  camera,
  canvasWidth,
  canvasHeight,
  onNavigate,
}: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDraggingRef = useRef(false)

  const visibleElements = elements.filter((el) => el.visible)

  const worldBounds = getWorldBounds(visibleElements)

  // Expand world bounds to include viewport
  const viewportWorldX = -camera.x
  const viewportWorldY = -camera.y
  const viewportWorldW = canvasWidth / camera.zoom
  const viewportWorldH = canvasHeight / camera.zoom

  const totalMinX = Math.min(worldBounds.x, viewportWorldX) - MINIMAP_PADDING
  const totalMinY = Math.min(worldBounds.y, viewportWorldY) - MINIMAP_PADDING
  const totalMaxX = Math.max(worldBounds.x + worldBounds.width, viewportWorldX + viewportWorldW) + MINIMAP_PADDING
  const totalMaxY = Math.max(worldBounds.y + worldBounds.height, viewportWorldY + viewportWorldH) + MINIMAP_PADDING
  const totalW = totalMaxX - totalMinX
  const totalH = totalMaxY - totalMinY

  const scale = Math.min(MINIMAP_WIDTH / totalW, MINIMAP_HEIGHT / totalH)

  const toMinimapX = useCallback(
    (wx: number) => (wx - totalMinX) * scale,
    [totalMinX, scale]
  )
  const toMinimapY = useCallback(
    (wy: number) => (wy - totalMinY) * scale,
    [totalMinY, scale]
  )

  const minimapToWorld = useCallback(
    (mx: number, my: number): { wx: number; wy: number } => ({
      wx: mx / scale + totalMinX,
      wy: my / scale + totalMinY,
    }),
    [scale, totalMinX, totalMinY]
  )

  // Draw minimap
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT)

    // Draw elements
    for (const el of visibleElements) {
      const b = getElementBounds(el)
      const rx = toMinimapX(b.x)
      const ry = toMinimapY(b.y)
      const rw = Math.max(b.width * scale, ELEMENT_MIN_SIZE)
      const rh = Math.max(b.height * scale, ELEMENT_MIN_SIZE)

      ctx.fillStyle = getElementColor(el)
      ctx.fillRect(rx, ry, Math.min(rw, ELEMENT_MAX_SIZE * 10), Math.min(rh, ELEMENT_MAX_SIZE * 10))
    }

    // Draw viewport rectangle
    const vx = toMinimapX(viewportWorldX)
    const vy = toMinimapY(viewportWorldY)
    const vw = viewportWorldW * scale
    const vh = viewportWorldH * scale

    ctx.fillStyle = VIEWPORT_FILL_COLOR
    ctx.fillRect(vx, vy, vw, vh)
    ctx.strokeStyle = VIEWPORT_STROKE_COLOR
    ctx.lineWidth = VIEWPORT_LINE_WIDTH
    ctx.strokeRect(vx, vy, vw, vh)
  }, [visibleElements, camera, canvasWidth, canvasHeight, scale, toMinimapX, toMinimapY, viewportWorldX, viewportWorldY, viewportWorldW, viewportWorldH])

  const handleNavigate = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const { wx, wy } = minimapToWorld(mx, my)
      onNavigate(wx, wy)
    },
    [minimapToWorld, onNavigate]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      isDraggingRef.current = true
      handleNavigate(e)
    },
    [handleNavigate]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDraggingRef.current) return
      handleNavigate(e)
    },
    [handleNavigate]
  )

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false
  }, [])

  return (
    <div className="absolute bottom-4 right-4 rounded-lg border bg-card/80 backdrop-blur shadow-sm overflow-hidden">
      <canvas
        ref={canvasRef}
        width={MINIMAP_WIDTH}
        height={MINIMAP_HEIGHT}
        className="block cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  )
}
