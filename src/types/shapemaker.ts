// ─── Point & Geometry ────────────────────────────────────────────

export type Point = { x: number; y: number }

// ─── Path Segments (matches Flutter Path API) ───────────────────

export type MoveToSegment = {
  type: "moveTo"
  point: Point
}

export type LineToSegment = {
  type: "lineTo"
  point: Point
}

export type QuadraticSegment = {
  type: "quadraticBezierTo"
  controlPoint: Point
  endPoint: Point
}

export type CubicSegment = {
  type: "cubicTo"
  controlPoint1: Point
  controlPoint2: Point
  endPoint: Point
}

export type ArcToSegment = {
  type: "arcToPoint"
  endPoint: Point
  radius: Point // rx, ry
  rotation: number
  largeArc: boolean
  clockwise: boolean
}

export type CloseSegment = {
  type: "close"
}

export type PathSegment =
  | MoveToSegment
  | LineToSegment
  | QuadraticSegment
  | CubicSegment
  | ArcToSegment
  | CloseSegment

// ─── Transform ─────────────────────────────────────────────────

export type ShapeTransform = {
  rotation: number   // radians, around bounding box center
  scaleX: number     // 1.0 = no scale
  scaleY: number
}

export const DEFAULT_TRANSFORM: ShapeTransform = {
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
}

// ─── Bounding box (computed, not stored) ───────────────────────

export type BoundingBox = {
  x: number
  y: number
  width: number
  height: number
}

// ─── Handle positions for resize ───────────────────────────────

export type HandlePosition = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w"

// ─── Editing mode ──────────────────────────────────────────────

export type EditingMode = "shape" | "node"

// ─── Interaction state machine ─────────────────────────────────

export type InteractionState =
  | { type: "idle" }
  | { type: "shape-selected"; pathId: string; mode: EditingMode }
  | { type: "dragging-shape"; pathId: string; startPoint: Point; originalSegments: PathSegment[] }
  | { type: "rotating"; pathId: string; center: Point; startAngle: number; originalRotation: number }
  | {
      type: "resizing"
      pathId: string
      handle: HandlePosition
      anchor: Point
      originalBBox: BoundingBox
      originalSegments: PathSegment[]
      originalTransform: ShapeTransform
    }
  | { type: "dragging-node"; selectedPoint: SelectedPoint }
  | { type: "drawing-pen" }
  | { type: "drawing-shape"; shapeType: "rectangle" | "ellipse" | "line" | "polygon"; start: Point }

// ─── Canvas events (for state machine input) ───────────────────

export type CanvasEvent =
  | { type: "mousedown"; point: Point; screenPoint: Point; button: number; altKey: boolean; shiftKey: boolean }
  | { type: "mousemove"; point: Point; screenPoint: Point; shiftKey: boolean }
  | { type: "mouseup"; point: Point }
  | { type: "dblclick"; point: Point; screenPoint: Point }
  | { type: "keydown"; key: string; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean }

// ─── Hit test results ──────────────────────────────────────────

export type HitTestResult =
  | { type: "none" }
  | { type: "shape-body"; pathId: string; layerId: string }
  | { type: "resize-handle"; handle: HandlePosition }
  | { type: "rotation-zone" }
  | { type: "node"; selectedPoint: SelectedPoint }

// ─── Actions emitted by state machine ──────────────────────────

export type InteractionAction =
  | { type: "select-shape"; pathId: string | null }
  | { type: "move-shape"; pathId: string; segments: PathSegment[] }
  | { type: "set-rotation"; pathId: string; rotation: number }
  | { type: "resize-shape"; pathId: string; newSegments: PathSegment[]; newTransform: ShapeTransform }
  | { type: "bake-resize"; pathId: string; anchor: Point; scaleX: number; scaleY: number; originalSegments: PathSegment[] }
  | { type: "move-node"; selectedPoint: SelectedPoint; newPos: Point }
  | { type: "delete-shape"; pathId: string }
  | { type: "delete-node"; selectedPoint: SelectedPoint }
  | { type: "copy" }
  | { type: "paste" }
  | { type: "duplicate" }
  | { type: "duplicate-and-drag"; pathId: string }
  | { type: "nudge"; delta: Point }
  | { type: "add-segment"; point: Point }
  | { type: "close-path" }
  | { type: "new-path" }
  | { type: "finish-drawing-shape"; start: Point; end: Point; shapeType: "rectangle" | "ellipse" | "line" | "polygon" }
  | { type: "push-history" }
  | { type: "set-cursor"; cursor: string }

// ─── Clipboard ─────────────────────────────────────────────────

export type ClipboardEntry = {
  paths: ShapePath[]
  pasteCount: number
}

// ─── Paint styles ───────────────────────────────────────────────

export type GradientStop = {
  offset: number // 0-1
  color: string
}

export type LinearGradient = {
  type: "linear"
  startPoint: Point
  endPoint: Point
  stops: GradientStop[]
}

export type RadialGradient = {
  type: "radial"
  center: Point
  radius: number
  stops: GradientStop[]
}

export type SweepGradient = {
  type: "sweep"
  center: Point
  startAngle: number
  endAngle: number
  stops: GradientStop[]
}

export type GradientDef = LinearGradient | RadialGradient | SweepGradient

export type PaintStyle = {
  fillColor: string
  fillOpacity: number
  strokeColor: string
  strokeOpacity: number
  strokeWidth: number
  paintingStyle: "fill" | "stroke" | "fillAndStroke"
  strokeCap: "butt" | "round" | "square"
  strokeJoin: "miter" | "round" | "bevel"
  gradient: GradientDef | null
  blurRadius: number
  shadowColor: string
  shadowOffset: Point
}

// ─── Shapes ─────────────────────────────────────────────────────

export type ShapePath = {
  id: string
  name: string
  segments: PathSegment[]
  closed: boolean
  paint: PaintStyle
  visible: boolean
  locked: boolean
  transform: ShapeTransform
}

// ─── Layer ──────────────────────────────────────────────────────

export type Layer = {
  id: string
  name: string
  paths: ShapePath[]
  visible: boolean
  locked: boolean
}

// ─── Canvas state ───────────────────────────────────────────────

export type CanvasState = {
  width: number
  height: number
  layers: Layer[]
  activeLayerId: string
  activePathId: string | null
  backgroundColor: string
}

// ─── Tool modes ─────────────────────────────────────────────────

export type ToolMode =
  | "select"
  | "pen"
  | "line"
  | "rectangle"
  | "ellipse"
  | "polygon"

// ─── Selected point reference ───────────────────────────────────

export type SelectedPoint = {
  pathId: string
  segmentIndex: number
  pointType: "point" | "controlPoint1" | "controlPoint2" | "endPoint"
}

// ─── Undo/redo ──────────────────────────────────────────────────

export type HistoryEntry = {
  layers: Layer[]
  activeLayerId: string
  activePathId: string | null
}

// ─── Code generation options ────────────────────────────────────

export type CodeGenOptions = {
  className: string
  responsive: boolean
  includeSize: boolean
  canvasWidth: number
  canvasHeight: number
}

// ─── Default paint style ────────────────────────────────────────

export const DEFAULT_PAINT: PaintStyle = {
  fillColor: "#2196F3",
  fillOpacity: 1,
  strokeColor: "#000000",
  strokeOpacity: 1,
  strokeWidth: 2,
  paintingStyle: "fill",
  strokeCap: "round",
  strokeJoin: "round",
  gradient: null,
  blurRadius: 0,
  shadowColor: "#000000",
  shadowOffset: { x: 0, y: 0 },
}
