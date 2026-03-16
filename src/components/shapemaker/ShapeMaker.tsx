import { useState, useCallback, useRef } from "react"
import type {
  Point,
  Layer,
  ShapePath,
  PathSegment,
  PaintStyle,
  ToolMode,
  SelectedPoint,
  HistoryEntry,
  InteractionState,
  ClipboardEntry,
  InteractionAction,
  BoundingBox,
} from "@/types/shapemaker"
import { DEFAULT_PAINT, DEFAULT_TRANSFORM } from "@/types/shapemaker"
import { translateSegments, scaleSegments } from "@/utils/shapemakerTransform"
import { copyToClipboard, pasteFromClipboard, duplicatePath, duplicatePathWithOffset } from "@/utils/shapemakerClipboard"
import { processEvent } from "@/utils/shapemakerInteraction"
import { ShapeMakerCanvas } from "./ShapeMakerCanvas"
import { PropertiesPanel } from "./PropertiesPanel"
import { LayersPanel } from "./LayersPanel"
import { CodeExportPanel } from "./CodeExportPanel"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
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

let idCounter = 0
function uid(prefix = "id") {
  return `${prefix}_${++idCounter}_${Date.now().toString(36)}`
}

function createLayer(name: string): Layer {
  return {
    id: uid("layer"),
    name,
    paths: [],
    visible: true,
    locked: false,
  }
}

function createPath(name: string): ShapePath {
  return {
    id: uid("path"),
    name,
    segments: [],
    closed: false,
    paint: { ...DEFAULT_PAINT },
    visible: true,
    locked: false,
    transform: { ...DEFAULT_TRANSFORM },
  }
}

type RightPanel = "properties" | "layers" | "code" | null

export function ShapeMaker() {
  // Canvas state
  const [canvasWidth] = useState(400)
  const [canvasHeight] = useState(400)
  const [backgroundColor] = useState("#ffffff")

  // Layers
  const initialLayer = useRef(createLayer("Layer 1")).current
  const [layers, setLayers] = useState<Layer[]>([initialLayer])
  const [activeLayerId, setActiveLayerId] = useState(initialLayer.id)
  const [activePathId, setActivePathId] = useState<string | null>(null)

  // Tool
  const [tool, setTool] = useState<ToolMode>("pen")
  const [curveMode, setCurveMode] = useState<"line" | "quadratic" | "cubic">(
    "line"
  )

  // View
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [showGrid, setShowGrid] = useState(true)
  const [snapEnabled, setSnapEnabled] = useState(true)
  const [gridSize] = useState(20)

  // Selection
  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint | null>(null)

  // Interaction state machine
  const [interactionState, setInteractionState] = useState<InteractionState>({ type: "idle" })
  const [clipboard, setClipboard] = useState<ClipboardEntry | null>(null)

  // Panels
  const [rightPanel, setRightPanel] = useState<RightPanel>("layers")

  // History (undo/redo)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)

  // ─── Helpers ────────────────────────────────────────────────

  const pushHistory = useCallback(() => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIdx + 1)
      newHistory.push({
        layers: JSON.parse(JSON.stringify(layers)),
        activeLayerId,
        activePathId,
      })
      // Keep max 50 entries
      if (newHistory.length > 50) newHistory.shift()
      return newHistory
    })
    setHistoryIdx((prev) => Math.min(prev + 1, 49))
  }, [layers, activeLayerId, activePathId, historyIdx])

  const undo = useCallback(() => {
    if (historyIdx < 0) return
    const entry = history[historyIdx]
    if (entry) {
      setLayers(JSON.parse(JSON.stringify(entry.layers)))
      setActiveLayerId(entry.activeLayerId)
      setActivePathId(entry.activePathId)
      setHistoryIdx((prev) => prev - 1)
      setInteractionState({ type: "idle" })
    }
  }, [history, historyIdx])

  const redo = useCallback(() => {
    if (historyIdx >= history.length - 1) return
    const entry = history[historyIdx + 1]
    if (entry) {
      setLayers(JSON.parse(JSON.stringify(entry.layers)))
      setActiveLayerId(entry.activeLayerId)
      setActivePathId(entry.activePathId)
      setHistoryIdx((prev) => prev + 1)
      setInteractionState({ type: "idle" })
    }
  }, [history, historyIdx])

  const getActivePath = useCallback((): ShapePath | null => {
    if (!activePathId) return null
    const layer = layers.find((l) => l.id === activeLayerId)
    return layer?.paths.find((p) => p.id === activePathId) ?? null
  }, [layers, activeLayerId, activePathId])

  const updateActivePath = useCallback(
    (updater: (path: ShapePath) => ShapePath) => {
      setLayers((prev) =>
        prev.map((layer) => {
          if (layer.id !== activeLayerId) return layer
          return {
            ...layer,
            paths: layer.paths.map((p) => {
              if (p.id !== activePathId) return p
              return updater(p)
            }),
          }
        })
      )
    },
    [activeLayerId, activePathId]
  )

  // ─── Path operations ───────────────────────────────────────

  const pathCounter = useRef(0)

  const handleAddSegment = useCallback(
    (point: Point) => {
      pushHistory()

      // If no active path, create one
      if (!activePathId) {
        const newPath = createPath(`Path ${++pathCounter.current}`)
        newPath.segments = [{ type: "moveTo", point }]

        setLayers((prev) =>
          prev.map((layer) => {
            if (layer.id !== activeLayerId) return layer
            return { ...layer, paths: [...layer.paths, newPath] }
          })
        )
        setActivePathId(newPath.id)
        return
      }

      // Add segment to active path based on curve mode
      setLayers((prev) =>
        prev.map((layer) => {
          if (layer.id !== activeLayerId) return layer
          return {
            ...layer,
            paths: layer.paths.map((p) => {
              if (p.id !== activePathId) return p

              let newSeg: PathSegment

              if (p.segments.length === 0) {
                newSeg = { type: "moveTo", point }
              } else if (curveMode === "quadratic") {
                // Get the last point
                const lastPoint = getLastPoint(p.segments)
                const dx = point.x - lastPoint.x
                const dy = point.y - lastPoint.y
                const dist = Math.sqrt(dx * dx + dy * dy)
                const offset = dist * 0.3
                // Perpendicular offset for natural curve shape
                const midX = (lastPoint.x + point.x) / 2 + (-dy / (dist || 1)) * offset
                const midY = (lastPoint.y + point.y) / 2 + (dx / (dist || 1)) * offset
                newSeg = {
                  type: "quadraticBezierTo",
                  controlPoint: { x: midX, y: midY },
                  endPoint: point,
                }
              } else if (curveMode === "cubic") {
                const lastPoint = getLastPoint(p.segments)
                const dx = point.x - lastPoint.x
                const dy = point.y - lastPoint.y
                const dist = Math.sqrt(dx * dx + dy * dy)
                const offset = dist * 0.25
                // Perpendicular offsets in opposite directions for S-curve
                const perpX = -dy / (dist || 1)
                const perpY = dx / (dist || 1)
                newSeg = {
                  type: "cubicTo",
                  controlPoint1: {
                    x: lastPoint.x + dx * 0.33 + perpX * offset,
                    y: lastPoint.y + dy * 0.33 + perpY * offset,
                  },
                  controlPoint2: {
                    x: lastPoint.x + dx * 0.66 - perpX * offset,
                    y: lastPoint.y + dy * 0.66 - perpY * offset,
                  },
                  endPoint: point,
                }
              } else {
                newSeg = { type: "lineTo", point }
              }

              return {
                ...p,
                segments: [...p.segments, newSeg],
              }
            }),
          }
        })
      )
    },
    [activePathId, activeLayerId, curveMode, pushHistory]
  )

  const handleSelectPoint = useCallback((sp: SelectedPoint | null) => {
    setSelectedPoint(sp)
  }, [])

  const handleMovePoint = useCallback(
    (sp: SelectedPoint, newPos: Point) => {
      setLayers((prev) =>
        prev.map((layer) => {
          return {
            ...layer,
            paths: layer.paths.map((p) => {
              if (p.id !== sp.pathId) return p
              const segs = [...p.segments]
              const seg = { ...segs[sp.segmentIndex] }

              if (
                (seg.type === "moveTo" || seg.type === "lineTo") &&
                sp.pointType === "point"
              ) {
                ;(seg as any).point = newPos
              } else if (seg.type === "quadraticBezierTo") {
                if (sp.pointType === "controlPoint1") {
                  ;(seg as any).controlPoint = newPos
                } else if (sp.pointType === "endPoint") {
                  ;(seg as any).endPoint = newPos
                }
              } else if (seg.type === "cubicTo") {
                if (sp.pointType === "controlPoint1") {
                  ;(seg as any).controlPoint1 = newPos
                } else if (sp.pointType === "controlPoint2") {
                  ;(seg as any).controlPoint2 = newPos
                } else if (sp.pointType === "endPoint") {
                  ;(seg as any).endPoint = newPos
                }
              } else if (
                seg.type === "arcToPoint" &&
                sp.pointType === "endPoint"
              ) {
                ;(seg as any).endPoint = newPos
              }

              segs[sp.segmentIndex] = seg
              return { ...p, segments: segs }
            }),
          }
        })
      )
    },
    []
  )

  const handleFinishShape = useCallback(
    (start: Point, end: Point) => {
      pushHistory()

      const w = Math.abs(end.x - start.x)
      const h = Math.abs(end.y - start.y)
      if (w < 2 && h < 2) return

      const newPath = createPath(`Path ${++pathCounter.current}`)
      const minX = Math.min(start.x, end.x)
      const minY = Math.min(start.y, end.y)
      const maxX = Math.max(start.x, end.x)
      const maxY = Math.max(start.y, end.y)

      if (tool === "rectangle") {
        newPath.segments = [
          { type: "moveTo", point: { x: minX, y: minY } },
          { type: "lineTo", point: { x: maxX, y: minY } },
          { type: "lineTo", point: { x: maxX, y: maxY } },
          { type: "lineTo", point: { x: minX, y: maxY } },
          { type: "close" },
        ]
      } else if (tool === "ellipse") {
        // Approximate ellipse with 4 cubic bezier curves
        const cx = (minX + maxX) / 2
        const cy = (minY + maxY) / 2
        const rx = (maxX - minX) / 2
        const ry = (maxY - minY) / 2
        const k = 0.5522847498 // kappa for cubic bezier circle approx
        const kx = rx * k
        const ky = ry * k

        newPath.segments = [
          { type: "moveTo", point: { x: cx, y: minY } },
          {
            type: "cubicTo",
            controlPoint1: { x: cx + kx, y: minY },
            controlPoint2: { x: maxX, y: cy - ky },
            endPoint: { x: maxX, y: cy },
          },
          {
            type: "cubicTo",
            controlPoint1: { x: maxX, y: cy + ky },
            controlPoint2: { x: cx + kx, y: maxY },
            endPoint: { x: cx, y: maxY },
          },
          {
            type: "cubicTo",
            controlPoint1: { x: cx - kx, y: maxY },
            controlPoint2: { x: minX, y: cy + ky },
            endPoint: { x: minX, y: cy },
          },
          {
            type: "cubicTo",
            controlPoint1: { x: minX, y: cy - ky },
            controlPoint2: { x: cx - kx, y: minY },
            endPoint: { x: cx, y: minY },
          },
          { type: "close" },
        ]
      } else if (tool === "line") {
        newPath.segments = [
          { type: "moveTo", point: start },
          { type: "lineTo", point: end },
        ]
        newPath.paint = {
          ...newPath.paint,
          paintingStyle: "stroke",
        }
      }

      newPath.closed =
        tool === "rectangle" || tool === "ellipse"

      setLayers((prev) =>
        prev.map((layer) => {
          if (layer.id !== activeLayerId) return layer
          return { ...layer, paths: [...layer.paths, newPath] }
        })
      )
      setActivePathId(newPath.id)
    },
    [tool, activeLayerId, pushHistory]
  )

  const handleClosePath = useCallback(() => {
    if (!activePathId) return
    pushHistory()
    updateActivePath((p) => ({
      ...p,
      closed: true,
      segments: [...p.segments, { type: "close" as const }],
    }))
    // Start new path on next click
    setActivePathId(null)
    setSelectedPoint(null)
  }, [activePathId, pushHistory, updateActivePath])

  const handleNewPath = useCallback(() => {
    setActivePathId(null)
    setSelectedPoint(null)
  }, [])

  const handleDeleteSelectedPoint = useCallback(() => {
    if (!selectedPoint) return
    pushHistory()
    setLayers((prev) =>
      prev.map((layer) => ({
        ...layer,
        paths: layer.paths.map((p) => {
          if (p.id !== selectedPoint.pathId) return p
          const segs = [...p.segments]
          segs.splice(selectedPoint.segmentIndex, 1)
          return { ...p, segments: segs }
        }),
      }))
    )
    setSelectedPoint(null)
  }, [selectedPoint, pushHistory])

  // ─── Layer operations ──────────────────────────────────────

  const handleAddLayer = useCallback(() => {
    pushHistory()
    const layer = createLayer(`Layer ${layers.length + 1}`)
    setLayers((prev) => [...prev, layer])
    setActiveLayerId(layer.id)
    setActivePathId(null)
  }, [layers.length, pushHistory])

  const handleDeleteLayer = useCallback(
    (id: string) => {
      if (layers.length <= 1) return
      pushHistory()
      setLayers((prev) => prev.filter((l) => l.id !== id))
      if (activeLayerId === id) {
        const remaining = layers.filter((l) => l.id !== id)
        setActiveLayerId(remaining[0].id)
        setActivePathId(null)
      }
    },
    [layers, activeLayerId, pushHistory]
  )

  const handleToggleLayerVisibility = useCallback((id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
    )
  }, [])

  const handleToggleLayerLock = useCallback((id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l))
    )
  }, [])

  const handleRenameLayer = useCallback((id: string, name: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, name } : l))
    )
  }, [])

  // ─── Path list operations ─────────────────────────────────

  const handleAddPath = useCallback(
    (layerId: string) => {
      pushHistory()
      const path = createPath(`Path ${++pathCounter.current}`)
      setLayers((prev) =>
        prev.map((l) => {
          if (l.id !== layerId) return l
          return { ...l, paths: [...l.paths, path] }
        })
      )
      setActiveLayerId(layerId)
      setActivePathId(path.id)
    },
    [pushHistory]
  )

  const handleDeletePath = useCallback(
    (layerId: string, pathId: string) => {
      pushHistory()
      setLayers((prev) =>
        prev.map((l) => {
          if (l.id !== layerId) return l
          return { ...l, paths: l.paths.filter((p) => p.id !== pathId) }
        })
      )
      if (activePathId === pathId) {
        setActivePathId(null)
        setSelectedPoint(null)
      }
    },
    [activePathId, pushHistory]
  )

  const handleTogglePathVisibility = useCallback(
    (layerId: string, pathId: string) => {
      setLayers((prev) =>
        prev.map((l) => {
          if (l.id !== layerId) return l
          return {
            ...l,
            paths: l.paths.map((p) =>
              p.id === pathId ? { ...p, visible: !p.visible } : p
            ),
          }
        })
      )
    },
    []
  )

  const handleTogglePathLock = useCallback(
    (layerId: string, pathId: string) => {
      setLayers((prev) =>
        prev.map((l) => {
          if (l.id !== layerId) return l
          return {
            ...l,
            paths: l.paths.map((p) =>
              p.id === pathId ? { ...p, locked: !p.locked } : p
            ),
          }
        })
      )
    },
    []
  )

  const handleDuplicatePath = useCallback(
    (layerId: string, pathId: string) => {
      pushHistory()
      setLayers((prev) =>
        prev.map((l) => {
          if (l.id !== layerId) return l
          const original = l.paths.find((p) => p.id === pathId)
          if (!original) return l
          const dup: ShapePath = {
            ...JSON.parse(JSON.stringify(original)),
            id: uid("path"),
            name: `${original.name} copy`,
          }
          return { ...l, paths: [...l.paths, dup] }
        })
      )
    },
    [pushHistory]
  )

  // ─── Properties ────────────────────────────────────────────

  const handleUpdatePaint = useCallback(
    (updates: Partial<PaintStyle>) => {
      pushHistory()
      updateActivePath((p) => ({
        ...p,
        paint: { ...p.paint, ...updates },
      }))
    },
    [pushHistory, updateActivePath]
  )

  const handleUpdatePath = useCallback(
    (updates: Partial<ShapePath>) => {
      updateActivePath((p) => ({ ...p, ...updates }))
    },
    [updateActivePath]
  )

  // ─── Action dispatcher ─────────────────────────────────────

  const dispatchActions = useCallback(
    (actions: InteractionAction[]) => {
      for (const action of actions) {
        switch (action.type) {
          case "select-shape":
            setActivePathId(action.pathId)
            setSelectedPoint(null)
            break

          case "move-shape":
            setLayers((prev) =>
              prev.map((layer) => ({
                ...layer,
                paths: layer.paths.map((p) =>
                  p.id === action.pathId ? { ...p, segments: action.segments } : p
                ),
              }))
            )
            break

          case "set-rotation":
            setLayers((prev) =>
              prev.map((layer) => ({
                ...layer,
                paths: layer.paths.map((p) =>
                  p.id === action.pathId
                    ? { ...p, transform: { ...p.transform, rotation: action.rotation } }
                    : p
                ),
              }))
            )
            break

          case "bake-resize":
            setLayers((prev) =>
              prev.map((layer) => ({
                ...layer,
                paths: layer.paths.map((p) => {
                  if (p.id !== action.pathId) return p
                  return {
                    ...p,
                    segments: scaleSegments(
                      action.originalSegments,
                      action.anchor,
                      action.scaleX,
                      action.scaleY,
                    ),
                  }
                }),
              }))
            )
            break

          case "move-node":
            handleMovePoint(action.selectedPoint, action.newPos)
            break

          case "delete-shape":
            setLayers((prev) =>
              prev.map((layer) => ({
                ...layer,
                paths: layer.paths.filter((p) => p.id !== action.pathId),
              }))
            )
            setActivePathId(null)
            break

          case "copy": {
            const path = getActivePath()
            if (path) {
              setClipboard(copyToClipboard([path]))
            }
            break
          }

          case "paste": {
            if (!clipboard) break
            const { paths: pastedPaths, updatedClipboard } = pasteFromClipboard(clipboard)
            setClipboard(updatedClipboard)
            if (pastedPaths.length > 0) {
              pushHistory()
              setLayers((prev) =>
                prev.map((layer) => {
                  if (layer.id !== activeLayerId) return layer
                  return { ...layer, paths: [...layer.paths, ...pastedPaths] }
                })
              )
              setActivePathId(pastedPaths[0].id)
              setInteractionState({ type: "shape-selected", pathId: pastedPaths[0].id, mode: "shape" })
            }
            break
          }

          case "duplicate": {
            const srcPath = getActivePath()
            if (!srcPath) break
            const dup = duplicatePathWithOffset(srcPath, 10, 10)
            setLayers((prev) =>
              prev.map((layer) => {
                if (layer.id !== activeLayerId) return layer
                return { ...layer, paths: [...layer.paths, dup] }
              })
            )
            setActivePathId(dup.id)
            setInteractionState({ type: "shape-selected", pathId: dup.id, mode: "shape" })
            break
          }

          case "duplicate-and-drag": {
            // Clone stays in place; user drags the original
            const srcForClone = findPathInLayers(layers, action.pathId)
            if (!srcForClone) break
            const clone = duplicatePath(srcForClone)
            setLayers((prev) =>
              prev.map((layer) => {
                if (layer.id !== activeLayerId) return layer
                return { ...layer, paths: [...layer.paths, clone] }
              })
            )
            break
          }

          case "nudge": {
            const targetPath = getActivePath()
            if (!targetPath) break
            setLayers((prev) =>
              prev.map((layer) => ({
                ...layer,
                paths: layer.paths.map((p) => {
                  if (p.id !== targetPath.id) return p
                  return { ...p, segments: translateSegments(p.segments, action.delta.x, action.delta.y) }
                }),
              }))
            )
            break
          }

          case "add-segment":
            handleAddSegment(action.point)
            break

          case "close-path":
            handleClosePath()
            break

          case "new-path":
            handleNewPath()
            break

          case "finish-drawing-shape":
            handleFinishShape(action.start, action.end)
            break

          case "push-history":
            pushHistory()
            break

          case "set-cursor":
            // Handled by canvas component, noop here
            break

          case "resize-shape":
            setLayers((prev) =>
              prev.map((layer) => ({
                ...layer,
                paths: layer.paths.map((p) =>
                  p.id === action.pathId
                    ? { ...p, segments: action.newSegments, transform: action.newTransform }
                    : p
                ),
              }))
            )
            break

          case "delete-node":
            setLayers((prev) =>
              prev.map((layer) => ({
                ...layer,
                paths: layer.paths.map((p) => {
                  if (p.id !== action.selectedPoint.pathId) return p
                  const segs = [...p.segments]
                  segs.splice(action.selectedPoint.segmentIndex, 1)
                  return { ...p, segments: segs }
                }),
              }))
            )
            setSelectedPoint(null)
            break
        }
      }
    },
    [
      activeLayerId,
      clipboard,
      getActivePath,
      handleAddSegment,
      handleClosePath,
      handleFinishShape,
      handleMovePoint,
      handleNewPath,
      layers,
      pushHistory,
    ]
  )

  // ─── Transform update (for Properties panel) ───────────────

  const handleUpdateTransform = useCallback(
    (pathId: string, currentBBox: BoundingBox, changes: { x?: number; y?: number; width?: number; height?: number; rotation?: number }) => {
      pushHistory()
      setLayers((prev) =>
        prev.map((layer) => ({
          ...layer,
          paths: layer.paths.map((p) => {
            if (p.id !== pathId) return p
            let newSegments = [...p.segments]
            let newTransform = { ...p.transform }
            if (changes.x !== undefined) {
              const dx = changes.x - currentBBox.x
              newSegments = translateSegments(newSegments, dx, 0)
            }
            if (changes.y !== undefined) {
              const dy = changes.y - currentBBox.y
              newSegments = translateSegments(newSegments, 0, dy)
            }
            if (changes.width !== undefined && currentBBox.width > 0) {
              newSegments = scaleSegments(newSegments, { x: currentBBox.x, y: currentBBox.y }, changes.width / currentBBox.width, 1)
            }
            if (changes.height !== undefined && currentBBox.height > 0) {
              newSegments = scaleSegments(newSegments, { x: currentBBox.x, y: currentBBox.y }, 1, changes.height / currentBBox.height)
            }
            if (changes.rotation !== undefined) {
              newTransform.rotation = (changes.rotation * Math.PI) / 180
            }
            return { ...p, segments: newSegments, transform: newTransform }
          }),
        }))
      )
    },
    [pushHistory]
  )

  // ─── Keyboard shortcuts ────────────────────────────────────

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
          setInteractionState({ type: "idle" })
        } else {
          undo()
          setInteractionState({ type: "idle" })
        }
      } else if (mod && e.key === "y") {
        e.preventDefault()
        redo()
        setInteractionState({ type: "idle" })
      } else if (e.key === "1") {
        setCurveMode("line")
      } else if (e.key === "2") {
        setCurveMode("quadratic")
      } else if (e.key === "3") {
        setCurveMode("cubic")
      }
    },
    [
      handleNewPath,
      handleClosePath,
      handleDeleteSelectedPoint,
      undo,
      redo,
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
      dispatchActions,
    ]
  )

  const activePath = getActivePath()

  const tools: {
    mode: ToolMode
    icon: typeof MousePointerIcon
    label: string
    shortcut: string
  }[] = [
    {
      mode: "select",
      icon: MousePointerIcon,
      label: "Select",
      shortcut: "V",
    },
    { mode: "pen", icon: PenToolIcon, label: "Pen", shortcut: "P" },
    { mode: "line", icon: MinusIcon, label: "Line", shortcut: "L" },
    {
      mode: "rectangle",
      icon: SquareIcon,
      label: "Rectangle",
      shortcut: "R",
    },
    {
      mode: "ellipse",
      icon: CircleIcon,
      label: "Ellipse",
      shortcut: "O",
    },
  ]

  const curveModes: {
    mode: "line" | "quadratic" | "cubic"
    icon: typeof MinusIcon
    label: string
    shortcut: string
  }[] = [
    { mode: "line", icon: MinusIcon, label: "Straight", shortcut: "1" },
    {
      mode: "quadratic",
      icon: SplineIcon,
      label: "Quadratic",
      shortcut: "2",
    },
    { mode: "cubic", icon: WavesIcon, label: "Cubic", shortcut: "3" },
  ]

  return (
    <div
      className="h-full flex flex-col min-h-0"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 h-10 border-b border-border flex-shrink-0 overflow-x-auto">
        {/* Drawing tools */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-border">
          {tools.map((t) => (
            <button
              key={t.mode}
              onClick={() => setTool(t.mode)}
              title={`${t.label} (${t.shortcut})`}
              className={cn(
                "p-1.5 rounded transition-colors",
                tool === t.mode
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <t.icon className="h-4 w-4" />
            </button>
          ))}
        </div>

        {/* Curve mode (visible when pen tool active) */}
        {tool === "pen" && (
          <div className="flex items-center gap-0.5 pr-2 border-r border-border">
            {curveModes.map((c) => (
              <button
                key={c.mode}
                onClick={() => setCurveMode(c.mode)}
                title={`${c.label} (${c.shortcut})`}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  curveMode === c.mode
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <c.icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        )}

        {/* Path actions */}
        {tool === "pen" && activePathId && (
          <div className="flex items-center gap-0.5 pr-2 border-r border-border">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleClosePath}
              title="Close path (Enter)"
              className="text-muted-foreground"
            >
              <XIcon className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleNewPath}
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
            onClick={() => setShowGrid((v) => !v)}
            title="Toggle grid (G)"
            className={cn(
              "p-1.5 rounded transition-colors",
              showGrid
                ? "text-foreground bg-muted/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <GridIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSnapEnabled((v) => !v)}
            title="Toggle snap (S)"
            className={cn(
              "p-1.5 rounded transition-colors",
              snapEnabled
                ? "text-foreground bg-muted/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MagnetIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-border">
          <button
            onClick={() => setZoom((z) => Math.max(0.1, z * 0.8))}
            title="Zoom out"
            className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <ZoomOutIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setZoom(1)
              setPanX(0)
              setPanY(0)
            }}
            title="Reset view"
            className="px-1.5 py-0.5 rounded text-xs font-mono text-muted-foreground hover:text-foreground transition-colors min-w-[40px] text-center"
          >
            {(zoom * 100).toFixed(0)}%
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(10, z * 1.25))}
            title="Zoom in"
            className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <ZoomInIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setZoom(1)
              setPanX(0)
              setPanY(0)
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
            onClick={undo}
            disabled={historyIdx < 0}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
          >
            <Undo2Icon className="h-4 w-4" />
          </button>
          <button
            onClick={redo}
            disabled={historyIdx >= history.length - 1}
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
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayersIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() =>
              setRightPanel((p) =>
                p === "properties" ? null : "properties"
              )
            }
            title="Properties"
            className={cn(
              "p-1.5 rounded transition-colors",
              rightPanel === "properties"
                ? "text-foreground bg-muted/50"
                : "text-muted-foreground hover:text-foreground"
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
                : "text-muted-foreground hover:text-foreground"
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
          layers={layers}
          activeLayerId={activeLayerId}
          activePathId={activePathId}
          tool={tool}
          snapEnabled={snapEnabled}
          gridSize={gridSize}
          showGrid={showGrid}
          zoom={zoom}
          panX={panX}
          panY={panY}
          selectedPoint={selectedPoint}
          backgroundColor={backgroundColor}
          onUpdatePath={() => {}}
          onAddSegment={handleAddSegment}
          onSelectPoint={handleSelectPoint}
          onMovePoint={handleMovePoint}
          onPanChange={(x, y) => {
            setPanX(x)
            setPanY(y)
          }}
          onZoomChange={setZoom}
          onFinishShape={handleFinishShape}
          onSelectPath={(id) => setActivePathId(id)}
          onDragStart={pushHistory}
          curveMode={curveMode}
          interactionState={interactionState}
          onInteractionStateChange={setInteractionState}
          onDispatchActions={dispatchActions}
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
                    : "text-muted-foreground hover:text-foreground"
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
                    : "text-muted-foreground hover:text-foreground"
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
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Code
              </button>
            </div>

            {/* Panel content */}
            <div className="flex-1 min-h-0">
              {rightPanel === "layers" && (
                <LayersPanel
                  layers={layers}
                  activeLayerId={activeLayerId}
                  activePathId={activePathId}
                  onSelectLayer={setActiveLayerId}
                  onSelectPath={(id) => setActivePathId(id)}
                  onAddLayer={handleAddLayer}
                  onDeleteLayer={handleDeleteLayer}
                  onToggleLayerVisibility={handleToggleLayerVisibility}
                  onToggleLayerLock={handleToggleLayerLock}
                  onAddPath={handleAddPath}
                  onDeletePath={handleDeletePath}
                  onTogglePathVisibility={handleTogglePathVisibility}
                  onTogglePathLock={handleTogglePathLock}
                  onDuplicatePath={handleDuplicatePath}
                  onRenameLayer={handleRenameLayer}
                />
              )}
              {rightPanel === "properties" && (
                <PropertiesPanel
                  path={activePath}
                  interactionState={interactionState}
                  onUpdatePaint={handleUpdatePaint}
                  onUpdatePath={handleUpdatePath}
                  onUpdateTransform={handleUpdateTransform}
                />
              )}
              {rightPanel === "code" && (
                <CodeExportPanel
                  layers={layers}
                  canvasWidth={canvasWidth}
                  canvasHeight={canvasHeight}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper to get the last point in a path's segments
function getLastPoint(segments: PathSegment[]): Point {
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i]
    if (seg.type === "moveTo" || seg.type === "lineTo") return seg.point
    if (
      seg.type === "quadraticBezierTo" ||
      seg.type === "cubicTo" ||
      seg.type === "arcToPoint"
    )
      return seg.endPoint
  }
  return { x: 0, y: 0 }
}

// Helper to find a path across all layers
function findPathInLayers(layers: Layer[], pathId: string): ShapePath | null {
  for (const layer of layers) {
    for (const path of layer.paths) {
      if (path.id === pathId) return path
    }
  }
  return null
}
