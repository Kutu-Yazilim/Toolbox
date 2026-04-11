// ── Board Engine Constants ──────────────────────────────────────
// All magic numbers extracted from boardEngine.ts

// ── Handle & Interaction Sizes ──────────────────────────────────
export const HANDLE_SIZE = 8
export const ROTATION_HANDLE_OFFSET = 24
export const ROTATION_HANDLE_RADIUS = 5
export const CONNECTION_POINT_RADIUS = 6
export const CONNECTION_THRESHOLD = 14
export const ARROW_CONTROL_HANDLE_SIZE = 6

// ── Selection & Snapping ────────────────────────────────────────
export const SELECTION_PADDING = 4
export const SELECTION_LINE_WIDTH = 1.5
export const SNAP_THRESHOLD = 5
export const VIEWPORT_MARGIN = 50
export const HIT_TEST_TOLERANCE = 4
export const HOVER_MARGIN = 20

// ── Grid ────────────────────────────────────────────────────────
export const GRID_LINE_OPACITY = "rgba(128, 128, 128, 0.15)"
export const DEFAULT_GRID_SIZE = 20

// ── Arrow ───────────────────────────────────────────────────────
export const ARROW_HEAD_BASE_SIZE = 12
export const ARROW_HEAD_STROKE_MULTIPLIER = 2
export const BEZIER_SAMPLE_STEPS = 20

// ── Text & Sticky ───────────────────────────────────────────────
export const TEXT_PADDING = 8
export const STICKY_PADDING = 12
export const STICKY_MIN_SIZE = 200
export const TEXT_DEFAULT_WIDTH = 200
export const TEXT_DEFAULT_HEIGHT = 30
export const LINE_HEIGHT_MULTIPLIER = 1.3
export const STICKY_LINE_HEIGHT_MULTIPLIER = 1.4
export const FONT_SIZE_DEFAULT = 16
export const STICKY_FONT_SIZE = 14

// ── Stroke Dash Patterns ────────────────────────────────────────
export const DASH_PATTERN: [number, number] = [8, 4]
export const DOT_PATTERN: [number, number] = [2, 4]

// ── Selection Box ───────────────────────────────────────────────
export const SELECTION_BOX_DASH: [number, number] = [5, 5]
export const SELECTION_COLOR = "#3B82F6"
export const SELECTION_BOX_FILL = "rgba(59, 130, 246, 0.1)"

// ── Smart Guide ─────────────────────────────────────────────────
export const SMART_GUIDE_DASH: [number, number] = [4, 4]

// ── Export ───────────────────────────────────────────────────────
export const EXPORT_PADDING = 40
export const EXPORT_SVG_PADDING = 20
export const EXPORT_EMPTY_WIDTH = 400
export const EXPORT_EMPTY_HEIGHT = 300
export const RETINA_SCALE = 2

// ── Element Defaults ────────────────────────────────────────────
export const IMAGE_DEFAULT_SIZE = 200
export const DUPLICATE_OFFSET = 20
export const MIN_DRAW_SIZE = 2
export const MIN_ARROW_LENGTH = 5
export const ANGLE_SNAP_INCREMENT = Math.PI / 4
export const ROTATION_SNAP_INCREMENT = (Math.PI / 180) * 15
export const MAX_NESTING_DEPTH = 2

// ── Group Selection ─────────────────────────────────────────────
export const GROUP_DASH_ON = 6
export const GROUP_DASH_OFF = 4

// ── Arrow Label ─────────────────────────────────────────────────
export const ARROW_LABEL_PADDING_X = 8
export const ARROW_LABEL_PADDING_Y = 6
export const ARROW_LABEL_BG_OPACITY = 0.85

// ── Shadow (Sticky) ─────────────────────────────────────────────
export const STICKY_SHADOW_COLOR = "rgba(0,0,0,0.15)"
export const STICKY_SHADOW_BLUR = 8
export const STICKY_SHADOW_OFFSET_X = 2
export const STICKY_SHADOW_OFFSET_Y = 2

// ── Sticky Default Colors ───────────────────────────────────────
export const STICKY_DEFAULT_FILL = "#FEF3C7"
export const STICKY_DEFAULT_STROKE = "#F59E0B"
export const STICKY_DEFAULT_STROKE_WIDTH = 1
export const STICKY_DEFAULT_BORDER_RADIUS = 8
export const RECTANGLE_DEFAULT_BORDER_RADIUS = 4

// ── Font Family Map ─────────────────────────────────────────────
export const FONT_FAMILY_MAP: Record<string, string> = {
  "sans-serif": "Inter, system-ui, sans-serif",
  "serif": "Georgia, serif",
  "monospace": "monospace",
  "cursive": "Caveat, cursive",
}

// ── Arrowhead angle ─────────────────────────────────────────────
export const ARROWHEAD_ANGLE = Math.PI / 6
