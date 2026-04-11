"use client"

import { useMemo } from "react"
import type { BoardElement, Camera } from "@/types/board"
import { getElementBounds } from "@/utils/board"

// ── Props ──────────────────────────────────────────────────────

interface RulerOverlayProps {
  elements: BoardElement[]
  selectedIds: string[]
  hoveredId: string | null
  camera: Camera
  isInteracting: boolean
}

// ── Helpers ────────────────────────────────────────────────────

function worldToScreenCoords(
  worldX: number,
  worldY: number,
  camera: Camera
): { x: number; y: number } {
  return {
    x: (worldX + camera.x) * camera.zoom,
    y: (worldY + camera.y) * camera.zoom,
  }
}

const TOOLTIP_OFFSET_Y = -28

// ── Dimension Label ────────────────────────────────────────────

interface DimensionLabelProps {
  x: number
  y: number
  text: string
}

function DimensionLabel({ x, y, text }: DimensionLabelProps) {
  return (
    <div
      className="absolute font-mono text-[10px] bg-card/90 text-foreground px-2 py-0.5 rounded shadow-sm whitespace-nowrap"
      style={{
        left: x,
        top: y,
        transform: "translateX(-50%)",
      }}
    >
      {text}
    </div>
  )
}

// ── Component ──────────────────────────────────────────────────

export default function RulerOverlay({
  elements,
  selectedIds,
  hoveredId,
  camera,
  isInteracting,
}: RulerOverlayProps) {
  const elementMap = useMemo(() => {
    const map = new Map<string, BoardElement>()
    for (const el of elements) map.set(el.id, el)
    return map
  }, [elements])

  const hoveredElement = hoveredId ? elementMap.get(hoveredId) ?? null : null
  const selectedElements = selectedIds
    .map((id) => elementMap.get(id))
    .filter((el): el is BoardElement => el != null)

  // On hover (no selection): show W x H tooltip near hovered element
  const showHoverTooltip = hoveredElement && selectedIds.length === 0
  // On select: show info bar at bottom
  const showSelectionBar = selectedElements.length > 0 && !isInteracting
  // On interact: show live dimensions near element
  const showInteractDimensions = isInteracting && selectedElements.length > 0

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {showHoverTooltip && (() => {
        const bounds = getElementBounds(hoveredElement)
        const screen = worldToScreenCoords(
          bounds.x + bounds.width / 2,
          bounds.y,
          camera
        )
        return (
          <DimensionLabel
            x={screen.x}
            y={screen.y + TOOLTIP_OFFSET_Y}
            text={`${Math.round(bounds.width)} × ${Math.round(bounds.height)}`}
          />
        )
      })()}

      {showInteractDimensions && selectedElements.map((el) => {
        const bounds = getElementBounds(el)
        const screen = worldToScreenCoords(
          bounds.x + bounds.width / 2,
          bounds.y,
          camera
        )
        return (
          <DimensionLabel
            key={el.id}
            x={screen.x}
            y={screen.y + TOOLTIP_OFFSET_Y}
            text={`${Math.round(bounds.width)} × ${Math.round(bounds.height)}`}
          />
        )
      })}

      {showSelectionBar && (() => {
        const el = selectedElements[0]
        const bounds = getElementBounds(el)
        return (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[10px] bg-card/90 text-foreground px-3 py-1 rounded shadow-sm whitespace-nowrap flex gap-3">
            <span>X: {Math.round(bounds.x)}</span>
            <span>Y: {Math.round(bounds.y)}</span>
            <span>W: {Math.round(bounds.width)}</span>
            <span>H: {Math.round(bounds.height)}</span>
          </div>
        )
      })()}
    </div>
  )
}
