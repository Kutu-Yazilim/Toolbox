import type {
  Point,
  Layer,
  ToolMode,
  InteractionState,
  CanvasEvent,
  InteractionAction,
  HitTestResult,
  ShapeTransform,
  PathSegment,
} from "@/types/shapemaker"
import { computeBoundingBox, bboxCenter, getAnchorForHandle, snapAngle, translateSegments, getCursorForHandle } from "./shapemakerTransform"

export type InteractionContext = {
  layers: Layer[]
  tool: ToolMode
  zoom: number
  panX: number
  panY: number
  snapEnabled: boolean
  gridSize: number
  hitTest: HitTestResult  // pre-computed by the canvas before calling
  activePathId: string | null
}

export type ProcessResult = {
  newState: InteractionState
  actions: InteractionAction[]
}

export function processEvent(
  state: InteractionState,
  event: CanvasEvent,
  ctx: InteractionContext,
): ProcessResult {
  switch (state.type) {
    case "idle":
      return processIdle(state, event, ctx)
    case "shape-selected":
      return processShapeSelected(state, event, ctx)
    case "dragging-shape":
      return processDraggingShape(state, event, ctx)
    case "rotating":
      return processRotating(state, event, ctx)
    case "resizing":
      return processResizing(state, event, ctx)
    case "dragging-node":
      return processDraggingNode(state, event, ctx)
    case "drawing-pen":
      return processDrawingPen(state, event, ctx)
    case "drawing-shape":
      return processDrawingShape(state, event, ctx)
  }
}

// ─── IDLE ──────────────────────────────────────────────────────

function processIdle(
  state: InteractionState,
  event: CanvasEvent,
  ctx: InteractionContext,
): ProcessResult {
  if (event.type !== "mousedown" && event.type !== "keydown") {
    return { newState: state, actions: [] }
  }

  if (event.type === "mousedown" && event.button !== 0) {
    return { newState: state, actions: [] }
  }

  if (event.type === "mousedown") {
    if (ctx.tool === "select") {
      if (ctx.hitTest.type === "shape-body") {
        return {
          newState: { type: "shape-selected", pathId: ctx.hitTest.pathId, mode: "shape" },
          actions: [
            { type: "select-shape", pathId: ctx.hitTest.pathId },
            { type: "set-cursor", cursor: "move" },
          ],
        }
      }
      return { newState: state, actions: [{ type: "set-cursor", cursor: "default" }] }
    }

    if (ctx.tool === "pen") {
      return {
        newState: { type: "drawing-pen" },
        actions: [{ type: "add-segment", point: event.point }],
      }
    }

    if (ctx.tool === "rectangle" || ctx.tool === "ellipse" || ctx.tool === "line" || ctx.tool === "polygon") {
      return {
        newState: { type: "drawing-shape", shapeType: ctx.tool, start: event.point },
        actions: [],
      }
    }
  }

  return { newState: state, actions: [] }
}

// ─── SHAPE-SELECTED ────────────────────────────────────────────

function processShapeSelected(
  state: Extract<InteractionState, { type: "shape-selected" }>,
  event: CanvasEvent,
  ctx: InteractionContext,
): ProcessResult {
  const path = findPath(ctx.layers, state.pathId)
  if (!path) return { newState: { type: "idle" }, actions: [] }

  // Handle keyboard events
  if (event.type === "keydown") {
    return processShapeSelectedKeyboard(state, event, ctx)
  }

  // Handle double-click to toggle shape/node mode
  if (event.type === "dblclick") {
    if (state.mode === "shape") {
      return {
        newState: { ...state, mode: "node" },
        actions: [],
      }
    }
    return { newState: state, actions: [] }
  }

  if (event.type === "mousedown" && event.button === 0) {
    if (state.mode === "shape") {
      return processShapeModeMouseDown(state, event, ctx, path)
    } else {
      return processNodeModeMouseDown(state, event, ctx, path)
    }
  }

  // Cursor updates on mousemove
  if (event.type === "mousemove" && state.mode === "shape") {
    return processShapeModeCursorUpdate(state, event, ctx)
  }

  return { newState: state, actions: [] }
}

function processShapeModeMouseDown(
  state: Extract<InteractionState, { type: "shape-selected" }>,
  event: Extract<CanvasEvent, { type: "mousedown" }>,
  ctx: InteractionContext,
  path: { segments: PathSegment[]; transform: ShapeTransform },
): ProcessResult {
  const hitTest = ctx.hitTest

  // Resize handle
  if (hitTest.type === "resize-handle") {
    const bbox = computeBoundingBox(path.segments)
    const anchor = getAnchorForHandle(hitTest.handle, bbox)
    return {
      newState: {
        type: "resizing",
        pathId: state.pathId,
        handle: hitTest.handle,
        anchor,
        originalBBox: bbox,
        originalSegments: JSON.parse(JSON.stringify(path.segments)),
        originalTransform: { ...path.transform },
      },
      actions: [{ type: "push-history" }],
    }
  }

  // Rotation zone
  if (hitTest.type === "rotation-zone") {
    const bbox = computeBoundingBox(path.segments)
    const center = bboxCenter(bbox)
    const startAngle = Math.atan2(event.point.y - center.y, event.point.x - center.x)
    return {
      newState: {
        type: "rotating",
        pathId: state.pathId,
        center,
        startAngle,
        originalRotation: path.transform.rotation,
      },
      actions: [{ type: "push-history" }],
    }
  }

  // Click on same shape body → start drag (or alt+drag for duplicate)
  if (hitTest.type === "shape-body" && hitTest.pathId === state.pathId) {
    if (event.altKey) {
      return {
        newState: {
          type: "dragging-shape",
          pathId: state.pathId,
          startPoint: event.point,
          originalSegments: JSON.parse(JSON.stringify(path.segments)),
        },
        actions: [
          { type: "push-history" },
          { type: "duplicate-and-drag", pathId: state.pathId },
        ],
      }
    }
    return {
      newState: {
        type: "dragging-shape",
        pathId: state.pathId,
        startPoint: event.point,
        originalSegments: JSON.parse(JSON.stringify(path.segments)),
      },
      actions: [{ type: "push-history" }],
    }
  }

  // Click on different shape
  if (hitTest.type === "shape-body" && hitTest.pathId !== state.pathId) {
    return {
      newState: { type: "shape-selected", pathId: hitTest.pathId, mode: "shape" },
      actions: [{ type: "select-shape", pathId: hitTest.pathId }],
    }
  }

  // Click on nothing → deselect
  if (hitTest.type === "none") {
    return {
      newState: { type: "idle" },
      actions: [{ type: "select-shape", pathId: null }],
    }
  }

  return { newState: state, actions: [] }
}

function processNodeModeMouseDown(
  state: Extract<InteractionState, { type: "shape-selected" }>,
  _event: Extract<CanvasEvent, { type: "mousedown" }>,
  ctx: InteractionContext,
  _path: { segments: PathSegment[]; transform: ShapeTransform },
): ProcessResult {
  const hitTest = ctx.hitTest

  if (hitTest.type === "node") {
    return {
      newState: { type: "dragging-node", selectedPoint: hitTest.selectedPoint },
      actions: [{ type: "push-history" }],
    }
  }

  // Click on a different shape body
  if (hitTest.type === "shape-body") {
    if (hitTest.pathId !== state.pathId) {
      return {
        newState: { type: "shape-selected", pathId: hitTest.pathId, mode: "shape" },
        actions: [{ type: "select-shape", pathId: hitTest.pathId }],
      }
    }
    // Click on own body in node mode — keep node mode
    return { newState: state, actions: [] }
  }

  if (hitTest.type === "none") {
    return {
      newState: { type: "idle" },
      actions: [{ type: "select-shape", pathId: null }],
    }
  }

  return { newState: state, actions: [] }
}

function processShapeSelectedKeyboard(
  state: Extract<InteractionState, { type: "shape-selected" }>,
  event: Extract<CanvasEvent, { type: "keydown" }>,
  _ctx: InteractionContext,
): ProcessResult {
  const mod = event.ctrlKey || event.metaKey

  // Escape: node mode → shape mode, or shape mode → idle
  if (event.key === "Escape") {
    if (state.mode === "node") {
      return { newState: { ...state, mode: "shape" }, actions: [] }
    }
    return {
      newState: { type: "idle" },
      actions: [{ type: "select-shape", pathId: null }],
    }
  }

  // Delete
  if (event.key === "Delete" || event.key === "Backspace") {
    if (state.mode === "node") {
      // Handled externally — we don't know which node is selected from here
      // The canvas component tracks selectedPoint separately for node mode
      return { newState: state, actions: [] }
    }
    return {
      newState: { type: "idle" },
      actions: [
        { type: "push-history" },
        { type: "delete-shape", pathId: state.pathId },
      ],
    }
  }

  // Copy
  if (mod && event.key === "c") {
    return { newState: state, actions: [{ type: "copy" }] }
  }

  // Paste
  if (mod && event.key === "v") {
    return { newState: state, actions: [{ type: "paste" }] }
  }

  // Duplicate
  if (mod && event.key === "d") {
    return { newState: state, actions: [{ type: "push-history" }, { type: "duplicate" }] }
  }

  // Arrow keys (nudge)
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
    const amount = event.shiftKey ? 10 : 1
    const delta: Point = { x: 0, y: 0 }
    if (event.key === "ArrowUp") delta.y = -amount
    if (event.key === "ArrowDown") delta.y = amount
    if (event.key === "ArrowLeft") delta.x = -amount
    if (event.key === "ArrowRight") delta.x = amount
    return {
      newState: state,
      actions: [
        { type: "push-history" },
        { type: "nudge", delta },
      ],
    }
  }

  return { newState: state, actions: [] }
}

function processShapeModeCursorUpdate(
  state: Extract<InteractionState, { type: "shape-selected" }>,
  _event: Extract<CanvasEvent, { type: "mousemove" }>,
  ctx: InteractionContext,
): ProcessResult {
  const hitTest = ctx.hitTest
  if (hitTest.type === "resize-handle") {
    const path = findPath(ctx.layers, state.pathId)
    const rotation = path?.transform.rotation ?? 0
    return {
      newState: state,
      actions: [{ type: "set-cursor", cursor: getCursorForHandle(hitTest.handle, rotation) }],
    }
  }
  if (hitTest.type === "rotation-zone") {
    return { newState: state, actions: [{ type: "set-cursor", cursor: "grab" }] }
  }
  if (hitTest.type === "shape-body" && hitTest.pathId === state.pathId) {
    return { newState: state, actions: [{ type: "set-cursor", cursor: "move" }] }
  }
  return { newState: state, actions: [{ type: "set-cursor", cursor: "default" }] }
}

// ─── DRAGGING-SHAPE ────────────────────────────────────────────

function processDraggingShape(
  state: Extract<InteractionState, { type: "dragging-shape" }>,
  event: CanvasEvent,
  _ctx: InteractionContext,
): ProcessResult {
  if (event.type === "mousemove") {
    const dx = event.point.x - state.startPoint.x
    const dy = event.point.y - state.startPoint.y
    // IMPORTANT: translate from ORIGINAL segments, not current, to avoid compounding
    const segments = translateSegments(state.originalSegments, dx, dy)
    return {
      newState: state,
      actions: [{ type: "move-shape", pathId: state.pathId, segments }],
    }
  }

  if (event.type === "mouseup") {
    return {
      newState: { type: "shape-selected", pathId: state.pathId, mode: "shape" },
      actions: [],
    }
  }

  return { newState: state, actions: [] }
}

// ─── ROTATING ──────────────────────────────────────────────────

function processRotating(
  state: Extract<InteractionState, { type: "rotating" }>,
  event: CanvasEvent,
  _ctx: InteractionContext,
): ProcessResult {
  if (event.type === "mousemove") {
    const currentAngle = Math.atan2(
      event.point.y - state.center.y,
      event.point.x - state.center.x,
    )
    let newRotation = state.originalRotation + (currentAngle - state.startAngle)

    if (event.shiftKey) {
      const snap15 = (15 * Math.PI) / 180
      newRotation = snapAngle(newRotation, snap15)
    }

    return {
      newState: state,
      actions: [{ type: "set-rotation", pathId: state.pathId, rotation: newRotation }],
    }
  }

  if (event.type === "mouseup") {
    return {
      newState: { type: "shape-selected", pathId: state.pathId, mode: "shape" },
      actions: [],
    }
  }

  return { newState: state, actions: [] }
}

// ─── RESIZING ──────────────────────────────────────────────────

function processResizing(
  state: Extract<InteractionState, { type: "resizing" }>,
  event: CanvasEvent,
  _ctx: InteractionContext,
): ProcessResult {
  if (event.type === "mousemove") {
    const { handle, anchor, originalBBox, originalSegments } = state

    // Compute scale based on handle type
    let scaleX = 1
    let scaleY = 1

    const isCorner = ["nw", "ne", "se", "sw"].includes(handle)
    const isHorizontal = ["e", "w"].includes(handle)
    const isVertical = ["n", "s"].includes(handle)

    if (isCorner || isHorizontal) {
      const newWidth = Math.abs(event.point.x - anchor.x)
      scaleX = originalBBox.width > 0 ? newWidth / originalBBox.width : 1
    }
    if (isCorner || isVertical) {
      const newHeight = Math.abs(event.point.y - anchor.y)
      scaleY = originalBBox.height > 0 ? newHeight / originalBBox.height : 1
    }

    // Shift = proportional
    if (event.shiftKey && isCorner) {
      const maxScale = Math.max(scaleX, scaleY)
      scaleX = maxScale
      scaleY = maxScale
    }

    // Prevent zero scale
    scaleX = Math.max(scaleX, 0.01)
    scaleY = Math.max(scaleY, 0.01)

    return {
      newState: state,
      actions: [{
        type: "bake-resize",
        pathId: state.pathId,
        anchor,
        scaleX,
        scaleY,
        originalSegments: originalSegments,
      }],
    }
  }

  if (event.type === "mouseup") {
    // Scale is already baked — just transition back
    return {
      newState: { type: "shape-selected", pathId: state.pathId, mode: "shape" },
      actions: [],
    }
  }

  return { newState: state, actions: [] }
}

// ─── DRAGGING-NODE ─────────────────────────────────────────────

function processDraggingNode(
  state: Extract<InteractionState, { type: "dragging-node" }>,
  event: CanvasEvent,
  _ctx: InteractionContext,
): ProcessResult {
  if (event.type === "mousemove") {
    return {
      newState: state,
      actions: [{ type: "move-node", selectedPoint: state.selectedPoint, newPos: event.point }],
    }
  }

  if (event.type === "mouseup") {
    // Return to shape-selected in node mode
    // We need the pathId from the selectedPoint
    return {
      newState: {
        type: "shape-selected",
        pathId: state.selectedPoint.pathId,
        mode: "node",
      },
      actions: [],
    }
  }

  return { newState: state, actions: [] }
}

// ─── DRAWING-PEN ───────────────────────────────────────────────

function processDrawingPen(
  state: InteractionState,
  event: CanvasEvent,
  _ctx: InteractionContext,
): ProcessResult {
  if (event.type === "mousedown" && event.button === 0) {
    return {
      newState: state,
      actions: [{ type: "add-segment", point: event.point }],
    }
  }

  if (event.type === "keydown") {
    if (event.key === "Enter") {
      return {
        newState: { type: "idle" },
        actions: [{ type: "close-path" }],
      }
    }
    if (event.key === "Escape") {
      return {
        newState: { type: "idle" },
        actions: [{ type: "new-path" }],
      }
    }
  }

  return { newState: state, actions: [] }
}

// ─── DRAWING-SHAPE ─────────────────────────────────────────────

function processDrawingShape(
  state: Extract<InteractionState, { type: "drawing-shape" }>,
  event: CanvasEvent,
  _ctx: InteractionContext,
): ProcessResult {
  if (event.type === "mouseup") {
    // Transition to shape-selected — the finish-drawing-shape action will create the shape
    // and set activePathId, which the dispatcher uses to update interactionState
    return {
      newState: { type: "idle" },  // Temporarily idle; dispatcher updates to shape-selected after creating the shape
      actions: [{
        type: "finish-drawing-shape",
        start: state.start,
        end: event.point,
        shapeType: state.shapeType,
      }],
    }
  }

  return { newState: state, actions: [] }
}

// ─── Helpers ───────────────────────────────────────────────────

function findPath(layers: Layer[], pathId: string) {
  for (const layer of layers) {
    for (const path of layer.paths) {
      if (path.id === pathId) return path
    }
  }
  return null
}
