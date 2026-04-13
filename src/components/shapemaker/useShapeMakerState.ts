"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import type {
  Point,
  Layer,
  ShapePath,
  PathSegment,
  PaintStyle,
  ToolMode,
  SelectedPoint,
  InteractionState,
  InteractionAction,
  BoundingBox,
} from "@/types/shapemaker"
import { DEFAULT_PAINT, DEFAULT_TRANSFORM } from "@/types/shapemaker"
import { translateSegments, scaleSegments, updateSegmentPoint } from "@/utils/shapemakerTransform"
import { type PolygonPreset, generateRegularPolygon, generateStar, generatePresetShape } from "@/utils/shapemakerPolygon"
import { duplicatePath } from "@/utils/shapemakerClipboard"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import type { ShapeMakerHistoryAPI } from "./useShapeMakerHistory"
import type { ShapeMakerClipboardAPI } from "./useShapeMakerClipboard"

// ─── ID generation ────────────────────────────────────────────

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

// ─── Helper ───────────────────────────────────────────────────

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

function findPathInLayers(layers: Layer[], pathId: string): ShapePath | null {
  for (const layer of layers) {
    for (const path of layer.paths) {
      if (path.id === pathId) return path
    }
  }
  return null
}

// ─── Return type ──────────────────────────────────────────────

export interface ShapeMakerStateAPI {
  // Canvas state
  canvasWidth: number
  canvasHeight: number
  backgroundColor: string
  layers: Layer[]
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>
  activeLayerId: string
  setActiveLayerId: (id: string) => void
  activePathId: string | null
  setActivePathId: (id: string | null) => void

  // Selection state (multi-select)
  selectedPathIds: string[]
  setSelectedPathIds: React.Dispatch<React.SetStateAction<string[]>>

  // Tool state
  tool: ToolMode
  setTool: (tool: ToolMode) => void
  curveMode: "line" | "quadratic" | "cubic"
  setCurveMode: (mode: "line" | "quadratic" | "cubic") => void

  // Polygon config
  polygonSides: number
  setPolygonSides: (sides: number) => void
  polygonIsStar: boolean
  setPolygonIsStar: (isStar: boolean) => void
  polygonInnerRadius: number
  setPolygonInnerRadius: (radius: number) => void
  polygonPreset: PolygonPreset | null
  setPolygonPreset: (preset: PolygonPreset | null) => void

  // View state
  zoom: number
  setZoom: (zoom: number) => void
  panX: number
  setPanX: (x: number) => void
  panY: number
  setPanY: (y: number) => void
  showGrid: boolean
  setShowGrid: React.Dispatch<React.SetStateAction<boolean>>
  snapEnabled: boolean
  setSnapEnabled: React.Dispatch<React.SetStateAction<boolean>>
  gridSize: number

  // Point selection
  selectedPoint: SelectedPoint | null
  setSelectedPoint: (sp: SelectedPoint | null) => void

  // Interaction state
  interactionState: InteractionState
  setInteractionState: (state: InteractionState) => void

  // Computed
  activePath: ShapePath | null

  // Path operations
  handleAddSegment: (point: Point) => void
  handleSelectPoint: (sp: SelectedPoint | null) => void
  handleMovePoint: (sp: SelectedPoint, newPos: Point) => void
  handleFinishShape: (start: Point, end: Point) => void
  handleClosePath: () => void
  handleNewPath: () => void
  handleDeleteSelectedPoint: () => void
  handleUpdatePaint: (updates: Partial<PaintStyle>) => void
  handleUpdatePath: (updates: Partial<ShapePath>) => void
  handleUpdateTransform: (
    pathId: string,
    currentBBox: BoundingBox,
    changes: { x?: number; y?: number; width?: number; height?: number; rotation?: number },
  ) => void

  // Layer operations
  handleAddLayer: () => void
  handleDeleteLayer: (id: string) => void
  handleToggleLayerVisibility: (id: string) => void
  handleToggleLayerLock: (id: string) => void
  handleRenameLayer: (id: string, name: string) => void
  reorderLayers: (fromIndex: number, toIndex: number) => void

  // Path list operations
  handleAddPath: (layerId: string) => void
  handleDeletePath: (layerId: string, pathId: string) => void
  handleTogglePathVisibility: (layerId: string, pathId: string) => void
  handleTogglePathLock: (layerId: string, pathId: string) => void
  handleDuplicatePath: (layerId: string, pathId: string) => void
  reorderPaths: (layerId: string, fromIndex: number, toIndex: number) => void

  // Action dispatcher
  dispatchActions: (actions: InteractionAction[]) => void
}

// ─── Hook ─────────────────────────────────────────────────────

export function useShapeMakerState(
  historyApi: ShapeMakerHistoryAPI,
  clipboardApi: ShapeMakerClipboardAPI,
): ShapeMakerStateAPI {
  // Canvas state
  const [canvasWidth] = useState(400)
  const [canvasHeight] = useState(400)
  const [backgroundColor] = useState("#ffffff")

  // Layers - persist to localStorage
  const initialLayer = useRef(createLayer("Layer 1")).current
  const [savedLayers, setSavedLayers] = useLocalStorage<Layer[]>("shapemaker-layers", [initialLayer])
  const [layers, setLayers] = useState<Layer[]>(savedLayers)
  const [activeLayerId, setActiveLayerId] = useState(savedLayers[0]?.id ?? initialLayer.id)
  const [activePathId, setActivePathId] = useState<string | null>(null)

  // Multi-select
  const [selectedPathIds, setSelectedPathIds] = useState<string[]>([])

  // Tool
  const [tool, setTool] = useState<ToolMode>("pen")
  const [curveMode, setCurveMode] = useState<"line" | "quadratic" | "cubic">("line")

  // Polygon config
  const [polygonSides, setPolygonSides] = useState(5)
  const [polygonIsStar, setPolygonIsStar] = useState(false)
  const [polygonInnerRadius, setPolygonInnerRadius] = useState(40)
  const [polygonPreset, setPolygonPreset] = useState<PolygonPreset | null>(null)

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

  // ─── Helpers ────────────────────────────────────────────────

  const pushHistory = useCallback(() => {
    historyApi.push(layers, activeLayerId, activePathId)
  }, [layers, activeLayerId, activePathId, historyApi])

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
        }),
      )
    },
    [activeLayerId, activePathId],
  )

  // ─── Path operations ───────────────────────────────────────

  const pathCounter = useRef(0)

  const handleAddSegment = useCallback(
    (point: Point) => {
      pushHistory()

      if (!activePathId) {
        const newPath = createPath(`Path ${++pathCounter.current}`)
        newPath.segments = [{ type: "moveTo", point }]

        setLayers((prev) =>
          prev.map((layer) => {
            if (layer.id !== activeLayerId) return layer
            return { ...layer, paths: [...layer.paths, newPath] }
          }),
        )
        setActivePathId(newPath.id)
        return
      }

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
                const lastPoint = getLastPoint(p.segments)
                const dx = point.x - lastPoint.x
                const dy = point.y - lastPoint.y
                const dist = Math.sqrt(dx * dx + dy * dy)
                const offset = dist * 0.3
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
        }),
      )
    },
    [activePathId, activeLayerId, curveMode, pushHistory],
  )

  const handleSelectPoint = useCallback((sp: SelectedPoint | null) => {
    setSelectedPoint(sp)
  }, [])

  const handleMovePoint = useCallback(
    (sp: SelectedPoint, newPos: Point) => {
      setLayers((prev) =>
        prev.map((layer) => ({
          ...layer,
          paths: layer.paths.map((p) => {
            if (p.id !== sp.pathId) return p
            const segs = [...p.segments]
            const seg = segs[sp.segmentIndex]

            if (
              (seg.type === "moveTo" || seg.type === "lineTo") &&
              sp.pointType === "point"
            ) {
              segs[sp.segmentIndex] = updateSegmentPoint(seg, "point", newPos)
            } else if (seg.type === "quadraticBezierTo") {
              if (sp.pointType === "controlPoint1") {
                segs[sp.segmentIndex] = updateSegmentPoint(seg, "controlPoint", newPos)
              } else if (sp.pointType === "endPoint") {
                segs[sp.segmentIndex] = updateSegmentPoint(seg, "endPoint", newPos)
              }
            } else if (seg.type === "cubicTo") {
              if (sp.pointType === "controlPoint1") {
                segs[sp.segmentIndex] = updateSegmentPoint(seg, "controlPoint1", newPos)
              } else if (sp.pointType === "controlPoint2") {
                segs[sp.segmentIndex] = updateSegmentPoint(seg, "controlPoint2", newPos)
              } else if (sp.pointType === "endPoint") {
                segs[sp.segmentIndex] = updateSegmentPoint(seg, "endPoint", newPos)
              }
            } else if (
              seg.type === "arcToPoint" &&
              sp.pointType === "endPoint"
            ) {
              segs[sp.segmentIndex] = updateSegmentPoint(seg, "endPoint", newPos)
            }

            return { ...p, segments: segs }
          }),
        })),
      )
    },
    [],
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
        const cx = (minX + maxX) / 2
        const cy = (minY + maxY) / 2
        const rx = (maxX - minX) / 2
        const ry = (maxY - minY) / 2
        const k = 0.5522847498
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
      } else if (tool === "polygon") {
        const cx = (minX + maxX) / 2
        const cy = (minY + maxY) / 2
        const radius = Math.min(w, h) / 2

        if (polygonPreset) {
          newPath.segments = generatePresetShape(polygonPreset, cx, cy, radius * 2)
        } else if (polygonIsStar) {
          const inner = radius * (polygonInnerRadius / 100)
          newPath.segments = generateStar(polygonSides, cx, cy, radius, inner)
        } else {
          newPath.segments = generateRegularPolygon(polygonSides, cx, cy, radius)
        }
      }

      newPath.closed = tool === "rectangle" || tool === "ellipse" || tool === "polygon"

      setLayers((prev) =>
        prev.map((layer) => {
          if (layer.id !== activeLayerId) return layer
          return { ...layer, paths: [...layer.paths, newPath] }
        }),
      )
      setActivePathId(newPath.id)
    },
    [tool, activeLayerId, pushHistory, polygonSides, polygonIsStar, polygonInnerRadius, polygonPreset],
  )

  const handleClosePath = useCallback(() => {
    if (!activePathId) return
    pushHistory()
    updateActivePath((p) => ({
      ...p,
      closed: true,
      segments: [...p.segments, { type: "close" as const }],
    }))
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
      })),
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
    [layers, activeLayerId, pushHistory],
  )

  const handleToggleLayerVisibility = useCallback((id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)),
    )
  }, [])

  const handleToggleLayerLock = useCallback((id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l)),
    )
  }, [])

  const handleRenameLayer = useCallback((id: string, name: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, name } : l)),
    )
  }, [])

  const reorderLayers = useCallback((fromIndex: number, toIndex: number) => {
    setLayers((prev) => {
      const result = [...prev]
      const [removed] = result.splice(fromIndex, 1)
      result.splice(toIndex, 0, removed)
      return result
    })
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
        }),
      )
      setActiveLayerId(layerId)
      setActivePathId(path.id)
    },
    [pushHistory],
  )

  const handleDeletePath = useCallback(
    (layerId: string, pathId: string) => {
      pushHistory()
      setLayers((prev) =>
        prev.map((l) => {
          if (l.id !== layerId) return l
          return { ...l, paths: l.paths.filter((p) => p.id !== pathId) }
        }),
      )
      if (activePathId === pathId) {
        setActivePathId(null)
        setSelectedPoint(null)
      }
      setSelectedPathIds((prev) => prev.filter((id) => id !== pathId))
    },
    [activePathId, pushHistory],
  )

  const handleTogglePathVisibility = useCallback(
    (layerId: string, pathId: string) => {
      setLayers((prev) =>
        prev.map((l) => {
          if (l.id !== layerId) return l
          return {
            ...l,
            paths: l.paths.map((p) =>
              p.id === pathId ? { ...p, visible: !p.visible } : p,
            ),
          }
        }),
      )
    },
    [],
  )

  const handleTogglePathLock = useCallback(
    (layerId: string, pathId: string) => {
      setLayers((prev) =>
        prev.map((l) => {
          if (l.id !== layerId) return l
          return {
            ...l,
            paths: l.paths.map((p) =>
              p.id === pathId ? { ...p, locked: !p.locked } : p,
            ),
          }
        }),
      )
    },
    [],
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
        }),
      )
    },
    [pushHistory],
  )

  const reorderPaths = useCallback((layerId: string, fromIndex: number, toIndex: number) => {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id !== layerId) return l
        const paths = [...l.paths]
        const [removed] = paths.splice(fromIndex, 1)
        paths.splice(toIndex, 0, removed)
        return { ...l, paths }
      }),
    )
  }, [])

  // ─── Properties ────────────────────────────────────────────

  const handleUpdatePaint = useCallback(
    (updates: Partial<PaintStyle>) => {
      pushHistory()
      updateActivePath((p) => ({
        ...p,
        paint: { ...p.paint, ...updates },
      }))
    },
    [pushHistory, updateActivePath],
  )

  const handleUpdatePath = useCallback(
    (updates: Partial<ShapePath>) => {
      updateActivePath((p) => ({ ...p, ...updates }))
    },
    [updateActivePath],
  )

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
        })),
      )
    },
    [pushHistory],
  )

  // ─── Action dispatcher ─────────────────────────────────────

  const dispatchActions = useCallback(
    (actions: InteractionAction[]) => {
      for (const action of actions) {
        switch (action.type) {
          case "select-shape":
            setActivePathId(action.pathId)
            setSelectedPoint(null)
            if (action.pathId) {
              setSelectedPathIds([action.pathId])
            } else {
              setSelectedPathIds([])
            }
            break

          case "move-shape":
            setLayers((prev) =>
              prev.map((layer) => ({
                ...layer,
                paths: layer.paths.map((p) =>
                  p.id === action.pathId ? { ...p, segments: action.segments } : p,
                ),
              })),
            )
            break

          case "set-rotation":
            setLayers((prev) =>
              prev.map((layer) => ({
                ...layer,
                paths: layer.paths.map((p) =>
                  p.id === action.pathId
                    ? { ...p, transform: { ...p.transform, rotation: action.rotation } }
                    : p,
                ),
              })),
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
              })),
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
              })),
            )
            setActivePathId(null)
            setSelectedPathIds([])
            break

          case "copy": {
            const path = getActivePath()
            if (path) {
              clipboardApi.copy([path])
            }
            break
          }

          case "paste": {
            const result = clipboardApi.paste()
            if (result && result.paths.length > 0) {
              pushHistory()
              setLayers((prev) =>
                prev.map((layer) => {
                  if (layer.id !== activeLayerId) return layer
                  return { ...layer, paths: [...layer.paths, ...result.paths] }
                }),
              )
              setActivePathId(result.paths[0].id)
              setSelectedPathIds([result.paths[0].id])
              setInteractionState({ type: "shape-selected", pathId: result.paths[0].id, mode: "shape" })
            }
            break
          }

          case "duplicate": {
            const srcPath = getActivePath()
            if (!srcPath) break
            const dups = clipboardApi.duplicate([srcPath])
            if (dups.length > 0) {
              setLayers((prev) =>
                prev.map((layer) => {
                  if (layer.id !== activeLayerId) return layer
                  return { ...layer, paths: [...layer.paths, ...dups] }
                }),
              )
              setActivePathId(dups[0].id)
              setSelectedPathIds([dups[0].id])
              setInteractionState({ type: "shape-selected", pathId: dups[0].id, mode: "shape" })
            }
            break
          }

          case "duplicate-and-drag": {
            const srcForClone = findPathInLayers(layers, action.pathId)
            if (!srcForClone) break
            const clone = duplicatePath(srcForClone)
            setLayers((prev) =>
              prev.map((layer) => {
                if (layer.id !== activeLayerId) return layer
                return { ...layer, paths: [...layer.paths, clone] }
              }),
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
              })),
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
            // Handled by canvas component
            break

          case "resize-shape":
            setLayers((prev) =>
              prev.map((layer) => ({
                ...layer,
                paths: layer.paths.map((p) =>
                  p.id === action.pathId
                    ? { ...p, segments: action.newSegments, transform: action.newTransform }
                    : p,
                ),
              })),
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
              })),
            )
            setSelectedPoint(null)
            break
        }
      }
    },
    [
      activeLayerId,
      clipboardApi,
      getActivePath,
      handleAddSegment,
      handleClosePath,
      handleFinishShape,
      handleMovePoint,
      handleNewPath,
      layers,
      pushHistory,
    ],
  )

  // ─── Persist layers to localStorage ─────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setSavedLayers(layers), 1000)
    return () => clearTimeout(timer)
  }, [layers, setSavedLayers])

  // ─── Sync selectedPathIds with activePathId ──────────────────
  useEffect(() => {
    if (activePathId && !selectedPathIds.includes(activePathId)) {
      setSelectedPathIds(activePathId ? [activePathId] : [])
    }
  }, [activePathId]) // eslint-disable-line react-hooks/exhaustive-deps

  const activePath = getActivePath()

  return {
    canvasWidth,
    canvasHeight,
    backgroundColor,
    layers,
    setLayers,
    activeLayerId,
    setActiveLayerId,
    activePathId,
    setActivePathId,
    selectedPathIds,
    setSelectedPathIds,
    tool,
    setTool,
    curveMode,
    setCurveMode,
    polygonSides,
    setPolygonSides,
    polygonIsStar,
    setPolygonIsStar,
    polygonInnerRadius,
    setPolygonInnerRadius,
    polygonPreset,
    setPolygonPreset,
    zoom,
    setZoom,
    panX,
    setPanX,
    panY,
    setPanY,
    showGrid,
    setShowGrid,
    snapEnabled,
    setSnapEnabled,
    gridSize,
    selectedPoint,
    setSelectedPoint,
    interactionState,
    setInteractionState,
    activePath,
    handleAddSegment,
    handleSelectPoint,
    handleMovePoint,
    handleFinishShape,
    handleClosePath,
    handleNewPath,
    handleDeleteSelectedPoint,
    handleUpdatePaint,
    handleUpdatePath,
    handleUpdateTransform,
    handleAddLayer,
    handleDeleteLayer,
    handleToggleLayerVisibility,
    handleToggleLayerLock,
    handleRenameLayer,
    reorderLayers,
    handleAddPath,
    handleDeletePath,
    handleTogglePathVisibility,
    handleTogglePathLock,
    handleDuplicatePath,
    reorderPaths,
    dispatchActions,
  }
}
