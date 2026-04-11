"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import type {
  BoardElement,
  Camera,
  Tool,
  Point,
  Bounds,
  ResizeHandle,
  ElementStyle,
  ConnectionSide,
  SmartGuide,
} from "@/types/board"
import {
  screenToWorld,
  pointInElement,
  elementsInSelectionBox,
  getResizeHandleAtPoint,
  getRotationHandleAtPoint,
  getArrowControlHandleAtPoint,
  resizeElement,
  createElement,
  getElementBounds,
  snapToGrid,
  getConnectionPointAtMouse,
  updateArrowConnections,
  computeSmartGuides,
  getGroupDescendantIds,
  syncAllGroupBounds,
} from "@/utils/board"

// ── Interaction State Machine ──────────────────────────────────

export type InteractionState =
  | { type: "idle" }
  | { type: "panning"; startX: number; startY: number; startCamX: number; startCamY: number }
  | { type: "drawing"; element: BoardElement }
  | { type: "selecting"; startWorld: Point }
  | { type: "moving"; startWorld: Point; elementSnapshots: Map<string, { x: number; y: number; points: Point[] }> }
  | { type: "resizing"; handle: ResizeHandle; elementId: string; startWorld: Point; snapshot: BoardElement }
  | { type: "connecting"; fromElementId: string; fromSide: ConnectionSide; arrow: BoardElement }
  | { type: "rotating"; elementId: string; startAngle: number; startRotation: number }
  | { type: "curving"; arrowId: string; startOffset: Point }

// ── Hook Parameters ────────────────────────────────────────────

interface CanvasInteractionParams {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  elements: BoardElement[]
  selectedIds: string[]
  camera: Camera
  tool: Tool
  gridEnabled: boolean
  gridSize: number
  defaultStyle: ElementStyle
  editingGroupId: string | null
  onElementsChange: (elements: BoardElement[]) => void
  onSelectionChange: (ids: string[]) => void
  onCameraChange: (camera: Camera) => void
  onToolChange: (tool: Tool) => void
  onEditText: (id: string) => void
  onCommitText: () => void
  onEditingGroupChange: (id: string | null) => void
}

// ── Hook Return ────────────────────────────────────────────────

interface CanvasInteractionReturn {
  interaction: InteractionState
  previewElement: BoardElement | null
  selectionBox: Bounds | null
  hoveredElementId: string | null
  activeConnectionPoint: { elementId: string; side: ConnectionSide } | null
  smartGuides: SmartGuide[]
  cursor: string
  handlers: {
    onMouseDown: (e: React.MouseEvent) => void
    onMouseMove: (e: React.MouseEvent) => void
    onMouseUp: (e: React.MouseEvent) => void
    onDoubleClick: (e: React.MouseEvent) => void
    onContextMenu: (e: React.MouseEvent) => void
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: (e: React.TouchEvent) => void
    onDragOver: (e: React.DragEvent) => void
    onDrop: (e: React.DragEvent) => void
  }
  contextMenuPosition: { x: number; y: number } | null
  closeContextMenu: () => void
}

export function useCanvasInteraction(params: CanvasInteractionParams): CanvasInteractionReturn {
  const {
    canvasRef,
    elements,
    selectedIds,
    camera,
    tool,
    gridEnabled,
    gridSize,
    defaultStyle,
    editingGroupId,
    onElementsChange,
    onSelectionChange,
    onCameraChange,
    onToolChange,
    onEditText,
    onCommitText,
    onEditingGroupChange,
  } = params

  const [interaction, setInteraction] = useState<InteractionState>({ type: "idle" })
  const [previewElement, setPreviewElement] = useState<BoardElement | null>(null)
  const [selectionBox, setSelectionBox] = useState<Bounds | null>(null)
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null)
  const [activeConnectionPoint, setActiveConnectionPoint] = useState<{
    elementId: string
    side: ConnectionSide
  } | null>(null)
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null)
  const [smartGuides, setSmartGuides] = useState<SmartGuide[]>([])

  const spaceHeldRef = useRef(false)
  const interactionRef = useRef(interaction)
  interactionRef.current = interaction

  // Touch support refs
  const touchRef = useRef<{
    startTouches: { x: number; y: number }[]
    startDist: number
    startMidpoint: { x: number; y: number }
    startCamera: Camera
    isTwoFinger: boolean
  } | null>(null)

  // ── Helpers ────────────────────────────────────────────────────

  const getWorldPoint = useCallback(
    (e: React.MouseEvent): Point => {
      const rect = canvasRef.current!.getBoundingClientRect()
      const screenX = e.clientX - rect.left
      const screenY = e.clientY - rect.top
      return screenToWorld(screenX, screenY, camera)
    },
    [camera, canvasRef]
  )

  const closeContextMenu = useCallback(() => {
    setContextMenuPosition(null)
  }, [])

  // ── Context Menu ───────────────────────────────────────────────

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const world = getWorldPoint(e)

      for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i]
        if (pointInElement(world.x, world.y, el, 6 / camera.zoom)) {
          if (!selectedIds.includes(el.id)) {
            onSelectionChange([el.id])
          }
          break
        }
      }

      setContextMenuPosition({ x: e.clientX, y: e.clientY })
    },
    [elements, camera, selectedIds, getWorldPoint, onSelectionChange]
  )

  // ── Mouse Down ─────────────────────────────────────────────────

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      closeContextMenu()
      const world = getWorldPoint(e)
      const rect = canvasRef.current!.getBoundingClientRect()
      const screenX = e.clientX - rect.left
      const screenY = e.clientY - rect.top

      onCommitText()

      // Middle mouse button or space held -> pan
      if (e.button === 1 || spaceHeldRef.current || tool === "hand") {
        setInteraction({
          type: "panning",
          startX: screenX,
          startY: screenY,
          startCamX: camera.x,
          startCamY: camera.y,
        })
        return
      }

      if (e.button !== 0) return

      // Check connection point (to start arrow drag)
      if (tool === "select") {
        const cp = getConnectionPointAtMouse(elements, world.x, world.y, camera)
        if (cp) {
          const baseArrow = createElement("arrow", cp.point.x, cp.point.y, defaultStyle)
          if (baseArrow.type === "arrow") {
            const arrow: BoardElement = {
              ...baseArrow,
              points: [{ ...cp.point }, { ...cp.point }],
              startConnection: { elementId: cp.elementId, side: cp.side },
            }
            setInteraction({ type: "connecting", fromElementId: cp.elementId, fromSide: cp.side, arrow })
            setPreviewElement(arrow)
          }
          return
        }
      }

      // Select tool
      if (tool === "select") {
        // Check rotation handle
        for (const id of selectedIds) {
          const el = elements.find((el) => el.id === id)
          if (el && !el.locked) {
            if (getRotationHandleAtPoint(world.x, world.y, el, camera)) {
              const center = {
                x: getElementBounds(el).x + getElementBounds(el).width / 2,
                y: getElementBounds(el).y + getElementBounds(el).height / 2,
              }
              const startAngle = Math.atan2(world.y - center.y, world.x - center.x)
              setInteraction({
                type: "rotating",
                elementId: id,
                startAngle,
                startRotation: el.rotation,
              })
              return
            }
          }
        }

        // Check arrow control point handle
        for (const id of selectedIds) {
          const el = elements.find((el) => el.id === id)
          if (el && el.type === "arrow" && !el.locked) {
            if (getArrowControlHandleAtPoint(world.x, world.y, el, camera)) {
              setInteraction({
                type: "curving",
                arrowId: id,
                startOffset: el.controlPointOffset || { x: 0, y: 0 },
              })
              return
            }
          }
        }

        // Check resize handles
        for (const id of selectedIds) {
          const el = elements.find((el) => el.id === id)
          if (el && !el.locked) {
            const handle = getResizeHandleAtPoint(world.x, world.y, el, camera)
            if (handle) {
              setInteraction({
                type: "resizing",
                handle,
                elementId: id,
                startWorld: world,
                snapshot: { ...el },
              })
              return
            }
          }
        }

        // Check if clicking on an element (group-aware)
        for (let i = elements.length - 1; i >= 0; i--) {
          const el = elements[i]
          if (el.type === "group") continue
          if (pointInElement(world.x, world.y, el, 6 / camera.zoom)) {
            let targetId = el.id
            if (el.groupId && el.groupId !== editingGroupId) {
              let gid: string | null = el.groupId
              while (gid) {
                const parent = elements.find((e) => e.id === gid)
                if (!parent) break
                targetId = parent.id
                if (parent.groupId && parent.groupId !== editingGroupId) {
                  gid = parent.groupId
                } else {
                  break
                }
              }
            }

            if (e.shiftKey) {
              const newIds = selectedIds.includes(targetId)
                ? selectedIds.filter((id) => id !== targetId)
                : [...selectedIds, targetId]
              onSelectionChange(newIds)
            } else if (!selectedIds.includes(targetId)) {
              onSelectionChange([targetId])
            }
            const ids = selectedIds.includes(targetId) ? selectedIds : [targetId]
            if (!selectedIds.includes(targetId)) {
              onSelectionChange([targetId])
            }
            // For group move: include all descendants
            const allMoveIds = new Set<string>()
            for (const id of ids) {
              allMoveIds.add(id)
              const elem = elements.find((e) => e.id === id)
              if (elem?.type === "group") {
                for (const did of getGroupDescendantIds(id, elements)) {
                  allMoveIds.add(did)
                }
              }
            }
            const snapshots = new Map<string, { x: number; y: number; points: Point[] }>()
            for (const id of allMoveIds) {
              const elem = elements.find((e) => e.id === id)
              if (elem && !elem.locked) {
                const pts =
                  elem.type === "line" || elem.type === "arrow" || elem.type === "draw"
                    ? [...elem.points]
                    : []
                snapshots.set(id, { x: elem.x, y: elem.y, points: pts })
              }
            }
            setInteraction({ type: "moving", startWorld: world, elementSnapshots: snapshots })
            return
          }
        }

        // Clicked on empty space -> start selection box
        if (!e.shiftKey) {
          onSelectionChange([])
        }
        setInteraction({ type: "selecting", startWorld: world })
        return
      }

      // Text tool
      if (tool === "text") {
        const newEl = createElement("text", world.x, world.y, defaultStyle)
        onElementsChange([...elements, newEl])
        onSelectionChange([newEl.id])
        onToolChange("select")
        setTimeout(() => onEditText(newEl.id), 50)
        return
      }

      // Sticky tool
      if (tool === "sticky") {
        const snappedX = gridEnabled ? snapToGrid(world.x, gridSize) : world.x
        const snappedY = gridEnabled ? snapToGrid(world.y, gridSize) : world.y
        const newEl = createElement("sticky", snappedX - 100, snappedY - 100, defaultStyle)
        onElementsChange([...elements, newEl])
        onSelectionChange([newEl.id])
        onToolChange("select")
        setTimeout(() => onEditText(newEl.id), 50)
        return
      }

      // Arrow tool - check for connection point at start
      if (tool === "arrow") {
        const cp = getConnectionPointAtMouse(elements, world.x, world.y, camera)
        const baseArrow = createElement("arrow", world.x, world.y, defaultStyle)
        if (baseArrow.type === "arrow") {
          let arrow: BoardElement
          if (cp) {
            arrow = {
              ...baseArrow,
              points: [{ ...cp.point }, { ...cp.point }],
              startConnection: { elementId: cp.elementId, side: cp.side },
            }
          } else {
            arrow = {
              ...baseArrow,
              points: [{ x: world.x, y: world.y }, { x: world.x, y: world.y }],
            }
          }
          setInteraction({ type: "drawing", element: arrow })
          setPreviewElement(arrow)
        }
        return
      }

      // Shape / Line / Draw tools
      const drawingElement = createElement(tool as BoardElement["type"], world.x, world.y, defaultStyle)
      setInteraction({ type: "drawing", element: drawingElement })
      setPreviewElement(drawingElement)
    },
    [
      tool,
      camera,
      elements,
      selectedIds,
      gridEnabled,
      gridSize,
      defaultStyle,
      getWorldPoint,
      onElementsChange,
      onSelectionChange,
      onToolChange,
      onEditText,
      onCommitText,
      closeContextMenu,
      editingGroupId,
      canvasRef,
    ]
  )

  // ── Mouse Move ─────────────────────────────────────────────────

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const world = getWorldPoint(e)
      const rect = canvasRef.current!.getBoundingClientRect()
      const screenX = e.clientX - rect.left
      const screenY = e.clientY - rect.top
      const current = interactionRef.current

      // Track hovered element for connection points
      if (current.type === "idle" && (tool === "select" || tool === "arrow")) {
        let foundHover: string | null = null
        for (let i = elements.length - 1; i >= 0; i--) {
          const el = elements[i]
          if (
            el.type === "line" ||
            el.type === "arrow" ||
            el.type === "draw" ||
            el.type === "text" ||
            el.type === "image"
          )
            continue
          const bounds = getElementBounds(el)
          const margin = 20 / camera.zoom
          if (
            world.x >= bounds.x - margin &&
            world.x <= bounds.x + bounds.width + margin &&
            world.y >= bounds.y - margin &&
            world.y <= bounds.y + bounds.height + margin
          ) {
            foundHover = el.id
            break
          }
        }
        setHoveredElementId(foundHover)

        const cp = getConnectionPointAtMouse(elements, world.x, world.y, camera)
        setActiveConnectionPoint(cp ? { elementId: cp.elementId, side: cp.side } : null)
      }

      switch (current.type) {
        case "panning": {
          const dx = screenX - current.startX
          const dy = screenY - current.startY
          onCameraChange({
            ...camera,
            x: current.startCamX + dx,
            y: current.startCamY + dy,
          })
          break
        }
        case "connecting": {
          const arrow = current.arrow
          if (arrow.type !== "arrow") break
          const points: [Point, Point] = [{ ...arrow.points[0] }, { ...arrow.points[1] }]
          const cp = getConnectionPointAtMouse(elements, world.x, world.y, camera, [current.fromElementId])
          if (cp) {
            points[1] = { ...cp.point }
            setActiveConnectionPoint({ elementId: cp.elementId, side: cp.side })
          } else {
            points[1] = { x: world.x, y: world.y }
            setActiveConnectionPoint(null)
          }
          const updated: BoardElement = { ...arrow, points }
          setInteraction({ ...current, arrow: updated })
          setPreviewElement(updated)
          break
        }
        case "rotating": {
          const el = elements.find((el) => el.id === current.elementId)
          if (!el) break
          const bounds = getElementBounds(el)
          const centerX = bounds.x + bounds.width / 2
          const centerY = bounds.y + bounds.height / 2
          const currentAngle = Math.atan2(world.y - centerY, world.x - centerX)
          let newRotation = current.startRotation + (currentAngle - current.startAngle)

          if (e.shiftKey) {
            const step = (Math.PI / 180) * 15
            newRotation = Math.round(newRotation / step) * step
          }

          onElementsChange(
            elements.map((el) => (el.id === current.elementId ? { ...el, rotation: newRotation } : el))
          )
          break
        }
        case "curving": {
          const el = elements.find((el) => el.id === current.arrowId)
          if (!el || el.type !== "arrow" || el.points.length < 2) break
          const start = el.points[0]
          const end = el.points[el.points.length - 1]
          const midX = (start.x + end.x) / 2
          const midY = (start.y + end.y) / 2
          const newOffset = { x: world.x - midX, y: world.y - midY }
          onElementsChange(
            elements.map((el) =>
              el.id === current.arrowId && el.type === "arrow" ? { ...el, controlPointOffset: newOffset } : el
            )
          )
          break
        }
        case "drawing": {
          const el = current.element
          if (el.type === "arrow") {
            let endPt: Point
            const cp = getConnectionPointAtMouse(elements, world.x, world.y, camera)
            if (cp) {
              endPt = { ...cp.point }
              setActiveConnectionPoint({ elementId: cp.elementId, side: cp.side })
            } else {
              if (e.shiftKey) {
                const start = el.points[0]
                const dx = world.x - start.x
                const dy = world.y - start.y
                const angle = Math.atan2(dy, dx)
                const step = Math.PI / 4
                const snappedAngle = Math.round(angle / step) * step
                const dist = Math.sqrt(dx * dx + dy * dy)
                endPt = {
                  x: start.x + dist * Math.cos(snappedAngle),
                  y: start.y + dist * Math.sin(snappedAngle),
                }
              } else {
                endPt = { x: world.x, y: world.y }
              }
              setActiveConnectionPoint(null)
            }
            const points: [Point, Point] = [{ ...el.points[0] }, endPt]
            const updated: BoardElement = { ...el, points }
            setInteraction({ type: "drawing", element: updated })
            setPreviewElement(updated)
          } else if (el.type === "line") {
            let endPt: Point
            if (e.shiftKey) {
              const start = el.points[0]
              const dx = world.x - start.x
              const dy = world.y - start.y
              const angle = Math.atan2(dy, dx)
              const step = Math.PI / 4
              const snappedAngle = Math.round(angle / step) * step
              const dist = Math.sqrt(dx * dx + dy * dy)
              endPt = {
                x: start.x + dist * Math.cos(snappedAngle),
                y: start.y + dist * Math.sin(snappedAngle),
              }
            } else {
              endPt = { x: world.x, y: world.y }
            }
            const points: [Point, Point] = [{ ...el.points[0] }, endPt]
            const updated: BoardElement = { ...el, points }
            setInteraction({ type: "drawing", element: updated })
            setPreviewElement(updated)
          } else if (el.type === "draw") {
            const points = [...el.points, { x: world.x, y: world.y }]
            const updated: BoardElement = { ...el, points }
            setInteraction({ type: "drawing", element: updated })
            setPreviewElement(updated)
          } else {
            let w = world.x - el.x
            let h = world.y - el.y

            if (e.shiftKey) {
              const size = Math.max(Math.abs(w), Math.abs(h))
              w = size * Math.sign(w)
              h = size * Math.sign(h)
            }

            if (gridEnabled) {
              w = snapToGrid(w, gridSize)
              h = snapToGrid(h, gridSize)
            }

            const updated = { ...el, width: w, height: h }
            setInteraction({ type: "drawing", element: updated })
            setPreviewElement(updated)
          }
          break
        }
        case "selecting": {
          const sx = Math.min(current.startWorld.x, world.x)
          const sy = Math.min(current.startWorld.y, world.y)
          const sw = Math.abs(world.x - current.startWorld.x)
          const sh = Math.abs(world.y - current.startWorld.y)
          setSelectionBox({ x: sx, y: sy, width: sw, height: sh })
          break
        }
        case "moving": {
          let dx = world.x - current.startWorld.x
          let dy = world.y - current.startWorld.y
          if (gridEnabled) {
            dx = snapToGrid(dx, gridSize)
            dy = snapToGrid(dy, gridSize)
          }
          const movedIds = new Set<string>()
          const offsetPoints = (
            el: BoardElement,
            snap: { x: number; y: number; points: Point[] },
            ddx: number,
            ddy: number
          ): BoardElement => {
            if (el.type === "line" || el.type === "arrow" || el.type === "draw") {
              return {
                ...el,
                points: snap.points.map((p) => ({ x: p.x + ddx, y: p.y + ddy })),
              } as BoardElement
            }
            return { ...el, x: snap.x + ddx, y: snap.y + ddy }
          }
          let newElements = elements.map((el) => {
            const snap = current.elementSnapshots.get(el.id)
            if (!snap) return el
            movedIds.add(el.id)
            return offsetPoints(el, snap, dx, dy)
          })
          // Update connected arrows when shapes are moved
          newElements = newElements.map((el) => {
            if (el.type !== "arrow") return el
            if (movedIds.has(el.id)) return el
            const hasStartConn = el.startConnection && movedIds.has(el.startConnection.elementId)
            const hasEndConn = el.endConnection && movedIds.has(el.endConnection.elementId)
            if (hasStartConn || hasEndConn) {
              return updateArrowConnections(el, newElements)
            }
            return el
          })

          // Compute smart guides
          const guides = computeSmartGuides(Array.from(movedIds), newElements, camera)
          setSmartGuides(guides)

          // Apply snap from smart guides
          if (guides.length > 0 && !gridEnabled) {
            const movingElIds = Array.from(movedIds)
            for (const guide of guides) {
              for (const mid of movingElIds) {
                const mel = newElements.find((e) => e.id === mid)
                if (!mel) continue
                const mb = getElementBounds(mel)
                if (guide.orientation === "vertical") {
                  const edges = [mb.x, mb.x + mb.width, mb.x + mb.width / 2]
                  for (const edge of edges) {
                    const diff = guide.position - edge
                    if (Math.abs(diff) < 5 / camera.zoom) {
                      newElements = newElements.map((e) => {
                        if (!movedIds.has(e.id)) return e
                        if (e.type === "line" || e.type === "arrow" || e.type === "draw") {
                          return {
                            ...e,
                            points: e.points.map((p) => ({ x: p.x + diff, y: p.y })),
                          } as BoardElement
                        }
                        return { ...e, x: e.x + diff }
                      })
                      break
                    }
                  }
                } else {
                  const edges = [mb.y, mb.y + mb.height, mb.y + mb.height / 2]
                  for (const edge of edges) {
                    const diff = guide.position - edge
                    if (Math.abs(diff) < 5 / camera.zoom) {
                      newElements = newElements.map((e) => {
                        if (!movedIds.has(e.id)) return e
                        if (e.type === "line" || e.type === "arrow" || e.type === "draw") {
                          return {
                            ...e,
                            points: e.points.map((p) => ({ x: p.x, y: p.y + diff })),
                          } as BoardElement
                        }
                        return { ...e, y: e.y + diff }
                      })
                      break
                    }
                  }
                }
                break // Only snap first moving element
              }
            }
          }

          onElementsChange(syncAllGroupBounds(newElements))
          break
        }
        case "resizing": {
          const dx = world.x - current.startWorld.x
          const dy = world.y - current.startWorld.y
          const updates = resizeElement(current.snapshot, current.handle, dx, dy)
          let newElements = elements.map((el) =>
            el.id === current.elementId ? ({ ...el, ...updates } as BoardElement) : el
          )
          newElements = newElements.map((el) => {
            if (el.type !== "arrow") return el
            const hasConn =
              el.startConnection?.elementId === current.elementId ||
              el.endConnection?.elementId === current.elementId
            if (hasConn) return updateArrowConnections(el, newElements)
            return el
          })
          onElementsChange(newElements)
          break
        }
      }
    },
    [camera, elements, gridEnabled, gridSize, tool, getWorldPoint, onCameraChange, onElementsChange, canvasRef]
  )

  // ── Mouse Up ───────────────────────────────────────────────────

  const handleMouseUp = useCallback(
    (_e: React.MouseEvent) => {
      const current = interactionRef.current

      switch (current.type) {
        case "connecting": {
          const arrow = current.arrow
          if (arrow.type !== "arrow") break
          const world = arrow.points[arrow.points.length - 1]
          const cp = getConnectionPointAtMouse(elements, world.x, world.y, camera, [current.fromElementId])
          let finalArrow: BoardElement = { ...arrow }
          if (cp && finalArrow.type === "arrow") {
            finalArrow = {
              ...finalArrow,
              endConnection: { elementId: cp.elementId, side: cp.side },
              points: [{ ...finalArrow.points[0] }, { ...cp.point }],
            }
          }
          if (finalArrow.type === "arrow") {
            const dx = finalArrow.points[0].x - finalArrow.points[1].x
            const dy = finalArrow.points[0].y - finalArrow.points[1].y
            if (Math.sqrt(dx * dx + dy * dy) > 5) {
              onElementsChange([...elements, finalArrow])
              onSelectionChange([finalArrow.id])
            }
          }
          setPreviewElement(null)
          setActiveConnectionPoint(null)
          break
        }
        case "drawing": {
          const el = current.element
          const bounds = getElementBounds(el)

          if (el.type === "arrow") {
            const lastPt = el.points[el.points.length - 1]
            const cp = getConnectionPointAtMouse(elements, lastPt.x, lastPt.y, camera)
            let finalArrow: BoardElement = { ...el }
            if (cp && finalArrow.type === "arrow") {
              finalArrow = {
                ...finalArrow,
                endConnection: { elementId: cp.elementId, side: cp.side },
                points: [{ ...finalArrow.points[0] }, { ...cp.point }],
              }
            }
            if (finalArrow.type === "arrow" && finalArrow.points.length >= 2) {
              const dx2 = finalArrow.points[0].x - finalArrow.points[1].x
              const dy2 = finalArrow.points[0].y - finalArrow.points[1].y
              if (Math.sqrt(dx2 * dx2 + dy2 * dy2) > 5) {
                onElementsChange([...elements, finalArrow])
                onSelectionChange([finalArrow.id])
              }
            }
            setPreviewElement(null)
            setActiveConnectionPoint(null)
            break
          }

          if (
            bounds.width > 2 ||
            bounds.height > 2 ||
            el.type === "draw" ||
            (el.type === "line" && el.points.length >= 2)
          ) {
            let normalized: BoardElement = { ...el }
            if (el.type !== "line" && el.type !== "draw") {
              if (el.width < 0) {
                normalized = { ...normalized, x: el.x + el.width, width: -el.width }
              }
              if (el.height < 0) {
                normalized = { ...normalized, y: el.y + el.height, height: -el.height }
              }
            }
            onElementsChange([...elements, normalized])
            onSelectionChange([normalized.id])

            if (
              normalized.type === "rectangle" ||
              normalized.type === "ellipse" ||
              normalized.type === "diamond"
            ) {
              onToolChange("select")
              setTimeout(() => onEditText(normalized.id), 50)
            }
          }
          setPreviewElement(null)
          break
        }
        case "selecting": {
          if (selectionBox) {
            const ids = elementsInSelectionBox(elements, selectionBox)
            onSelectionChange(ids)
            setSelectionBox(null)
          }
          break
        }
      }
      setInteraction({ type: "idle" })
      setSmartGuides([])
    },
    [elements, selectionBox, camera, onElementsChange, onSelectionChange, onToolChange, onEditText]
  )

  // ── Wheel (Zoom) ───────────────────────────────────────────────

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvasRef.current!.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      if (e.ctrlKey || e.metaKey) {
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9
        const newZoom = Math.max(0.1, Math.min(10, camera.zoom * zoomFactor))
        const worldBefore = screenToWorld(mouseX, mouseY, camera)
        const newCamera = { ...camera, zoom: newZoom }
        const worldAfter = screenToWorld(mouseX, mouseY, newCamera)
        newCamera.x += (worldAfter.x - worldBefore.x) * newZoom
        newCamera.y += (worldAfter.y - worldBefore.y) * newZoom
        onCameraChange(newCamera)
      } else {
        onCameraChange({
          ...camera,
          x: camera.x - e.deltaX,
          y: camera.y - e.deltaY,
        })
      }
    },
    [camera, onCameraChange, canvasRef]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.addEventListener("wheel", handleWheel, { passive: false })
    return () => canvas.removeEventListener("wheel", handleWheel)
  }, [handleWheel, canvasRef])

  // ── Space key for panning ──────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).tagName === "INPUT" ||
        (e.target as HTMLElement).tagName === "TEXTAREA"
      )
        return
      if (e.key === " ") {
        e.preventDefault()
        spaceHeldRef.current = true
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === " ") {
        spaceHeldRef.current = false
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  // Close context menu when clicking elsewhere
  useEffect(() => {
    if (!contextMenuPosition) return
    const handler = () => setContextMenuPosition(null)
    window.addEventListener("click", handler)
    return () => window.removeEventListener("click", handler)
  }, [contextMenuPosition])

  // ── Double Click (Edit Text) ───────────────────────────────────

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const world = getWorldPoint(e)

      // Check if double-clicking on a selected group to enter editing mode
      for (const id of selectedIds) {
        const el = elements.find((el) => el.id === id)
        if (el?.type === "group" && pointInElement(world.x, world.y, el, 6 / camera.zoom)) {
          onEditingGroupChange(el.id)
          onSelectionChange([])
          return
        }
      }

      for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i]
        if (el.type === "group") continue
        if (pointInElement(world.x, world.y, el, 6 / camera.zoom)) {
          if (el.type === "arrow") {
            onSelectionChange([el.id])
            onEditText(el.id)
            return
          }
          if (
            el.type === "text" ||
            el.type === "sticky" ||
            el.type === "rectangle" ||
            el.type === "ellipse" ||
            el.type === "diamond"
          ) {
            onSelectionChange([el.id])
            onEditText(el.id)
            return
          }
        }
      }

      // Double-click on empty space while editing a group -> exit group editing
      if (editingGroupId) {
        onEditingGroupChange(null)
      }
    },
    [elements, camera, selectedIds, getWorldPoint, onSelectionChange, onEditText, editingGroupId, onEditingGroupChange]
  )

  // ── Image Drag & Drop ─────────────────────────────────────────

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const files = e.dataTransfer.files
      if (files.length === 0) return

      const file = files[0]
      if (!file.type.startsWith("image/")) return

      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        const img = new Image()
        img.onload = () => {
          const rect = canvasRef.current!.getBoundingClientRect()
          const screenX = e.clientX - rect.left
          const screenY = e.clientY - rect.top
          const world = screenToWorld(screenX, screenY, camera)

          let w = img.naturalWidth
          let h = img.naturalHeight
          const maxDim = 800
          if (w > maxDim || h > maxDim) {
            const scale = maxDim / Math.max(w, h)
            w = Math.round(w * scale)
            h = Math.round(h * scale)
          }

          const newEl: BoardElement = {
            id: crypto.randomUUID().slice(0, 8),
            type: "image",
            x: world.x - w / 2,
            y: world.y - h / 2,
            width: w,
            height: h,
            rotation: 0,
            style: { ...defaultStyle, fillColor: "transparent", strokeColor: "transparent" },
            locked: false,
            visible: true,
            name: null,
            groupId: null,
            imageData: dataUrl,
          }
          onElementsChange([...elements, newEl])
          onSelectionChange([newEl.id])
        }
        img.src = dataUrl
      }
      reader.readAsDataURL(file)
    },
    [camera, elements, defaultStyle, onElementsChange, onSelectionChange, canvasRef]
  )

  // ── Touch Handlers ─────────────────────────────────────────────

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()
      const touches = e.touches

      if (touches.length === 1) {
        const touch = touches[0]
        const rect = canvasRef.current!.getBoundingClientRect()
        const screenX = touch.clientX - rect.left
        const screenY = touch.clientY - rect.top
        const world = screenToWorld(screenX, screenY, camera)

        touchRef.current = {
          startTouches: [{ x: touch.clientX, y: touch.clientY }],
          startDist: 0,
          startMidpoint: { x: touch.clientX, y: touch.clientY },
          startCamera: { ...camera },
          isTwoFinger: false,
        }

        if (tool === "select") {
          for (let i = elements.length - 1; i >= 0; i--) {
            const el = elements[i]
            if (el.type === "group") continue
            if (pointInElement(world.x, world.y, el, 6 / camera.zoom)) {
              let targetId = el.id
              if (el.groupId && el.groupId !== editingGroupId) {
                let gid: string | null = el.groupId
                while (gid) {
                  const parent = elements.find((e) => e.id === gid)
                  if (!parent) break
                  targetId = parent.id
                  if (parent.groupId && parent.groupId !== editingGroupId) {
                    gid = parent.groupId
                  } else {
                    break
                  }
                }
              }
              onSelectionChange([targetId])
              const allMoveIds = new Set<string>()
              allMoveIds.add(targetId)
              const tEl = elements.find((e) => e.id === targetId)
              if (tEl?.type === "group") {
                for (const did of getGroupDescendantIds(targetId, elements)) {
                  allMoveIds.add(did)
                }
              }
              const snapshots = new Map<string, { x: number; y: number; points: Point[] }>()
              for (const id of allMoveIds) {
                const elem = elements.find((e) => e.id === id)
                if (elem && !elem.locked) {
                  const pts =
                    elem.type === "line" || elem.type === "arrow" || elem.type === "draw"
                      ? [...elem.points]
                      : []
                  snapshots.set(id, { x: elem.x, y: elem.y, points: pts })
                }
              }
              setInteraction({ type: "moving", startWorld: world, elementSnapshots: snapshots })
              return
            }
          }
          onSelectionChange([])
        } else if (tool === "hand") {
          setInteraction({
            type: "panning",
            startX: screenX,
            startY: screenY,
            startCamX: camera.x,
            startCamY: camera.y,
          })
        }
      } else if (touches.length === 2) {
        const t0 = touches[0]
        const t1 = touches[1]
        const dx = t1.clientX - t0.clientX
        const dy = t1.clientY - t0.clientY
        const dist = Math.sqrt(dx * dx + dy * dy)
        const midX = (t0.clientX + t1.clientX) / 2
        const midY = (t0.clientY + t1.clientY) / 2

        touchRef.current = {
          startTouches: [
            { x: t0.clientX, y: t0.clientY },
            { x: t1.clientX, y: t1.clientY },
          ],
          startDist: dist,
          startMidpoint: { x: midX, y: midY },
          startCamera: { ...camera },
          isTwoFinger: true,
        }
        setInteraction({ type: "idle" })
      }
    },
    [camera, tool, elements, selectedIds, editingGroupId, onSelectionChange, canvasRef]
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()
      const touches = e.touches
      const ref = touchRef.current
      if (!ref) return

      if (touches.length === 1 && !ref.isTwoFinger) {
        const touch = touches[0]
        const rect = canvasRef.current!.getBoundingClientRect()
        const screenX = touch.clientX - rect.left
        const screenY = touch.clientY - rect.top
        const world = screenToWorld(screenX, screenY, camera)
        const current = interactionRef.current

        if (current.type === "panning") {
          const dx = screenX - current.startX
          const dy = screenY - current.startY
          onCameraChange({
            ...camera,
            x: current.startCamX + dx,
            y: current.startCamY + dy,
          })
        } else if (current.type === "moving") {
          let dx = world.x - current.startWorld.x
          let dy = world.y - current.startWorld.y
          if (gridEnabled) {
            dx = snapToGrid(dx, gridSize)
            dy = snapToGrid(dy, gridSize)
          }
          const newElements = elements.map((el) => {
            const snap = current.elementSnapshots.get(el.id)
            if (!snap) return el
            if (el.type === "line" || el.type === "arrow" || el.type === "draw") {
              return {
                ...el,
                points: snap.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
              } as BoardElement
            }
            return { ...el, x: snap.x + dx, y: snap.y + dy }
          })
          onElementsChange(newElements)
        }
      } else if (touches.length === 2 && ref.isTwoFinger) {
        const t0 = touches[0]
        const t1 = touches[1]
        const dx = t1.clientX - t0.clientX
        const dy = t1.clientY - t0.clientY
        const dist = Math.sqrt(dx * dx + dy * dy)
        const midX = (t0.clientX + t1.clientX) / 2
        const midY = (t0.clientY + t1.clientY) / 2

        const rect = canvasRef.current!.getBoundingClientRect()

        const scale = dist / ref.startDist
        const newZoom = Math.max(0.1, Math.min(10, ref.startCamera.zoom * scale))

        const panDx = midX - ref.startMidpoint.x
        const panDy = midY - ref.startMidpoint.y

        const midScreenX = midX - rect.left
        const midScreenY = midY - rect.top
        const worldBefore = screenToWorld(midScreenX, midScreenY, ref.startCamera)

        const newCam: Camera = {
          x: ref.startCamera.x + panDx,
          y: ref.startCamera.y + panDy,
          zoom: newZoom,
        }

        const worldAfter = screenToWorld(midScreenX, midScreenY, newCam)
        newCam.x += (worldAfter.x - worldBefore.x) * newZoom
        newCam.y += (worldAfter.y - worldBefore.y) * newZoom

        onCameraChange(newCam)
      }
    },
    [camera, elements, gridEnabled, gridSize, onCameraChange, onElementsChange, canvasRef]
  )

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()
      if (e.touches.length === 0) {
        const current = interactionRef.current
        if (current.type === "moving" || current.type === "panning") {
          setInteraction({ type: "idle" })
        }
        touchRef.current = null
      }
    },
    []
  )

  // ── Cursor ─────────────────────────────────────────────────────

  const getCursor = (): string => {
    if (spaceHeldRef.current || tool === "hand")
      return interaction.type === "panning" ? "grabbing" : "grab"
    if (interaction.type === "panning") return "grabbing"
    if (interaction.type === "connecting") return "crosshair"
    if (interaction.type === "rotating") return "grab"
    if (interaction.type === "curving") return "move"
    if (activeConnectionPoint) return "crosshair"
    if (tool === "select") return "default"
    if (tool === "text") return "text"
    return "crosshair"
  }

  return {
    interaction,
    previewElement,
    selectionBox,
    hoveredElementId,
    activeConnectionPoint,
    smartGuides,
    cursor: getCursor(),
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onDoubleClick: handleDoubleClick,
      onContextMenu: handleContextMenu,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
    contextMenuPosition,
    closeContextMenu,
  }
}
