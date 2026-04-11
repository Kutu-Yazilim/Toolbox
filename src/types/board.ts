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
  | "image"
  | "group"

export type FontFamily = "sans-serif" | "serif" | "monospace" | "cursive"
export type FontWeight = "normal" | "bold"
export type FontStyle = "normal" | "italic"

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
  fontWeight: FontWeight
  fontStyle: FontStyle
  textColor: string
}

// Connection point on a shape (for arrows)
export type ConnectionSide = "top" | "right" | "bottom" | "left"

export interface Connection {
  elementId: string
  side: ConnectionSide
}

// ── Rich Text ──────────────────────────────────────────────────

export interface RichTextSegment {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  color?: string
  link?: string
}

// ── Base Element ───────────────────────────────────────────────

interface BaseElement {
  id: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  locked: boolean
  visible: boolean
  name: string | null
  groupId: string | null
  style: ElementStyle
}

// ── Discriminated Element Types ────────────────────────────────

export interface RectangleElement extends BaseElement {
  type: "rectangle"
  borderRadius: number
  text: string
}

export interface EllipseElement extends BaseElement {
  type: "ellipse"
  text: string
}

export interface DiamondElement extends BaseElement {
  type: "diamond"
  text: string
}

export interface TextElement extends BaseElement {
  type: "text"
  text: string
  richText: RichTextSegment[]
}

export interface StickyElement extends BaseElement {
  type: "sticky"
  text: string
  richText: RichTextSegment[]
  stickyColor: string
}

export interface ImageElement extends BaseElement {
  type: "image"
  imageData: string
}

export interface DrawElement extends BaseElement {
  type: "draw"
  points: Point[]
}

export interface LineElement extends BaseElement {
  type: "line"
  points: [Point, Point]
}

export interface ArrowElement extends BaseElement {
  type: "arrow"
  points: [Point, Point]
  startConnection: Connection | null
  endConnection: Connection | null
  controlPointOffset: Point | null
  bidirectional: boolean
  label: string
  richLabel: RichTextSegment[]
}

export interface GroupElement extends BaseElement {
  type: "group"
  isGroup: true
  childIds: string[]
}

// ── Union Type ─────────────────────────────────────────────────

export type BoardElement =
  | RectangleElement
  | EllipseElement
  | DiamondElement
  | TextElement
  | StickyElement
  | ImageElement
  | DrawElement
  | LineElement
  | ArrowElement
  | GroupElement

// ── Type Guards ────────────────────────────────────────────────

export function isShapeElement(el: BoardElement): el is RectangleElement | EllipseElement | DiamondElement {
  return el.type === "rectangle" || el.type === "ellipse" || el.type === "diamond"
}

export function isTextLike(el: BoardElement): el is TextElement | StickyElement {
  return el.type === "text" || el.type === "sticky"
}

export function isLineLike(el: BoardElement): el is LineElement | ArrowElement {
  return el.type === "line" || el.type === "arrow"
}

export function hasRichText(el: BoardElement): el is TextElement | StickyElement {
  return el.type === "text" || el.type === "sticky"
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

// ── Grid Settings ──────────────────────────────────────────────

export interface GridSettings {
  enabled: boolean
  size: number
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
  | { type: "BRING_FORWARD"; ids: string[] }
  | { type: "SEND_BACKWARD"; ids: string[] }
  | { type: "DUPLICATE_ELEMENTS"; ids: string[] }
  | { type: "LOAD_STATE"; state: Pick<BoardState, "elements" | "camera" | "gridEnabled" | "gridSize"> }

// ── Theme-Adaptive Colors ───────────────────────────────────────

export function isDarkMode(): boolean {
  return document.documentElement.classList.contains("dark")
}

export function getThemeStrokeColor(): string {
  return isDarkMode() ? "#e0e0e0" : "#1e1e1e"
}

export function getThemeFillColor(): string {
  return isDarkMode() ? "#374151" : "#e8eaed"
}

export function getThemeCanvasBg(): string {
  return isDarkMode() ? "#1a1a2e" : "#ffffff"
}

export function getThemeTextColor(): string {
  return isDarkMode() ? "#f0f0f0" : "#1e1e1e"
}

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
  fontWeight: "normal",
  fontStyle: "normal",
  textColor: "",
}

/** Returns a default style with colors adapted to current theme */
export function getThemedDefaultStyle(): ElementStyle {
  return {
    ...DEFAULT_STYLE,
    strokeColor: getThemeStrokeColor(),
  }
}

/** Returns a default style for shapes (with fill) adapted to current theme */
export function getThemedShapeStyle(): ElementStyle {
  return {
    ...DEFAULT_STYLE,
    strokeColor: getThemeStrokeColor(),
    fillColor: getThemeFillColor(),
    borderRadius: 4,
  }
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

// ── Smart Guides ─────────────────────────────────────────────────

export interface SmartGuide {
  orientation: "horizontal" | "vertical"
  position: number
  snappedTo: number
}

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
