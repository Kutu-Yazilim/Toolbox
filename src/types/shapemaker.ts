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
