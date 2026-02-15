// ── Core Types ──────────────────────────────────────────────────

export interface Point {
  x: number
  y: number
}

export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

// ── Tools ───────────────────────────────────────────────────────

export type Tool =
  | "select"
  | "hand"
  | "rectangle"
  | "ellipse"
  | "diamond"
  | "line"
  | "arrow"
  | "draw"
  | "text"
  | "sticky"

// ── Element Types ───────────────────────────────────────────────

export type ElementType =
  | "rectangle"
  | "ellipse"
  | "diamond"
  | "line"
  | "arrow"
  | "draw"
  | "text"
  | "sticky"

export interface ElementStyle {
  strokeColor: string
  fillColor: string
  strokeWidth: number
  opacity: number
  fontSize: number
  fontFamily: string
  textAlign: "left" | "center" | "right"
  strokeStyle: "solid" | "dashed" | "dotted"
  borderRadius: number
}

export interface BoardElement {
  id: string
  type: ElementType
  x: number
  y: number
  width: number
  height: number
  rotation: number
  points: Point[] // for line, arrow, draw
  text: string
  style: ElementStyle
  locked: boolean
}

// ── Camera ──────────────────────────────────────────────────────

export interface Camera {
  x: number
  y: number
  zoom: number
}

// ── Selection ───────────────────────────────────────────────────

export type ResizeHandle =
  | "nw" | "n" | "ne"
  | "w"         | "e"
  | "sw" | "s" | "se"

// ── Board State ─────────────────────────────────────────────────

export interface BoardState {
  elements: BoardElement[]
  selectedIds: string[]
  camera: Camera
  tool: Tool
  gridEnabled: boolean
  gridSize: number
  defaultStyle: ElementStyle
}

// ── Actions ─────────────────────────────────────────────────────

export type BoardAction =
  | { type: "SET_ELEMENTS"; elements: BoardElement[] }
  | { type: "ADD_ELEMENT"; element: BoardElement }
  | { type: "UPDATE_ELEMENT"; id: string; updates: Partial<BoardElement> }
  | { type: "DELETE_ELEMENTS"; ids: string[] }
  | { type: "SET_SELECTION"; ids: string[] }
  | { type: "SET_CAMERA"; camera: Camera }
  | { type: "SET_TOOL"; tool: Tool }
  | { type: "SET_GRID"; enabled: boolean }
  | { type: "SET_DEFAULT_STYLE"; style: Partial<ElementStyle> }
  | { type: "MOVE_ELEMENTS"; ids: string[]; dx: number; dy: number }
  | { type: "BRING_TO_FRONT"; ids: string[] }
  | { type: "SEND_TO_BACK"; ids: string[] }
  | { type: "DUPLICATE_ELEMENTS"; ids: string[] }
  | { type: "LOAD_STATE"; state: Pick<BoardState, "elements" | "camera" | "gridEnabled" | "gridSize"> }

// ── Defaults ────────────────────────────────────────────────────

export const DEFAULT_STYLE: ElementStyle = {
  strokeColor: "#1e1e1e",
  fillColor: "transparent",
  strokeWidth: 2,
  opacity: 1,
  fontSize: 16,
  fontFamily: "sans-serif",
  textAlign: "center",
  strokeStyle: "solid",
  borderRadius: 0,
}

export const STICKY_COLORS = [
  "#FEF3C7", // yellow
  "#DBEAFE", // blue
  "#D1FAE5", // green
  "#FCE7F3", // pink
  "#E9D5FF", // purple
  "#FED7AA", // orange
  "#F3F4F6", // gray
  "#FECACA", // red
]

export const STROKE_COLORS = [
  "#1e1e1e", "#e03131", "#2f9e44", "#1971c2",
  "#f08c00", "#6741d9", "#0c8599", "#e8590c",
  "#ffffff", "#868e96",
]

export const FILL_COLORS = [
  "transparent", "#ffc9c9", "#b2f2bb", "#a5d8ff",
  "#ffec99", "#d0bfff", "#99e9f2", "#ffd8a8",
  "#ffffff", "#dee2e6",
]
