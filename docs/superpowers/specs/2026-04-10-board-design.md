# Board / Whiteboard — Deep Overhaul Design Spec

**Date:** 2026-04-10
**Scope:** Type system rewrite, engine decomposition with render optimization, component decomposition, 7 new features
**Approach:** Type system first → engine split → component decomposition → features
**Current size:** 5,427 lines across 9 files

---

## Phase 1: Strict Discriminated Union Type System

### Rewrite `src/types/board.ts`

#### Base Element

```ts
interface BaseElement {
    id: string
    x: number
    y: number
    width: number
    height: number
    rotation: number
    locked: boolean
    visible: boolean          // NEW — default true, for layers panel hide/show
    name: string | null       // NEW — user-assigned name, null = auto-generated
    groupId: string | null
    style: ElementStyle
}
```

#### Discriminated Union — Each Type Has Only Its Properties

```ts
interface RectangleElement extends BaseElement { type: "rectangle"; borderRadius: number }
interface EllipseElement extends BaseElement { type: "ellipse" }
interface DiamondElement extends BaseElement { type: "diamond" }
interface TextElement extends BaseElement { type: "text"; text: string; richText: RichTextSegment[] }
interface StickyElement extends BaseElement { type: "sticky"; text: string; richText: RichTextSegment[]; stickyColor: string }
interface ImageElement extends BaseElement { type: "image"; imageData: string }
interface DrawElement extends BaseElement { type: "draw"; points: Point[] }
interface LineElement extends BaseElement { type: "line"; points: [Point, Point] }
interface ArrowElement extends BaseElement {
    type: "arrow"
    points: [Point, Point]
    startConnection: Connection | null
    endConnection: Connection | null
    controlPointOffset: Point | null
    bidirectional: boolean
    label: string
    richLabel: RichTextSegment[]
}
interface GroupElement extends BaseElement {
    type: "group"
    isGroup: true
    childIds: string[]
}

type BoardElement =
    | RectangleElement | EllipseElement | DiamondElement
    | TextElement | StickyElement | ImageElement
    | DrawElement | LineElement | ArrowElement | GroupElement
```

#### Rich Text Model

```ts
interface RichTextSegment {
    text: string
    bold?: boolean
    italic?: boolean
    underline?: boolean
    strikethrough?: boolean
    color?: string
    link?: string
}
```

Plain text = single segment with no formatting flags. The `text` field stays for backward compatibility (plain text fallback). `richText` / `richLabel` is the source of truth when present and non-empty.

#### Type Guards

```ts
function isShapeElement(el: BoardElement): el is RectangleElement | EllipseElement | DiamondElement
function isTextLike(el: BoardElement): el is TextElement | StickyElement
function isLineLike(el: BoardElement): el is LineElement | ArrowElement
function hasRichText(el: BoardElement): el is TextElement | StickyElement
```

#### Other Types (kept/updated)

- `Point`, `Bounds`, `Connection`, `Camera`, `ElementStyle`, `ResizeHandle`, `SmartGuide` — kept as-is
- `BoardState` — updated to use new `BoardElement` union
- `BoardAction` — updated to use new union
- `ToolType` — kept as-is
- Theme color functions — kept as-is

### Migration

Every function that currently uses `element.points` without checking type must be updated to narrow first. The TypeScript compiler will flag every location. This is mechanical but touches every file.

---

## Phase 2: Engine Decomposition + Optimization

### Split `src/utils/boardEngine.ts` (1,845 lines) → `src/utils/board/`

```
src/utils/board/
├── index.ts              — re-exports everything (~20 lines)
├── constants.ts          — all magic numbers extracted (~80 lines)
├── hitTest.ts            — point-in-element, selection box, handle detection (~300 lines)
├── rendering.ts          — drawElement, drawGrid, drawHandles, drawGuides (~500 lines)
├── transforms.ts         — resize, rotate, align, distribute (~200 lines)
├── connections.ts        — arrow connection points, nearest side, update connections (~200 lines)
├── groups.ts             — nesting depth, descendants, sync bounds (~100 lines)
├── exportEngine.ts       — PNG (with quality), SVG (with embedded images), JSON export/import (~350 lines)
├── snapping.ts           — grid snap + element-to-element snap with guide lines (~200 lines)
```

### `constants.ts` — Extracted Magic Numbers

```ts
export const HANDLE_SIZE = 6
export const ROTATION_HANDLE_OFFSET = 20
export const CONNECTION_POINT_RADIUS = 4
export const SELECTION_PADDING = 2
export const VIEWPORT_MARGIN = 50
export const SNAP_THRESHOLD = 5
export const GRID_LINE_OPACITY = 0.1
export const MAX_HISTORY = 80
export const MIN_ELEMENT_SIZE = 2
export const ARROW_HEAD_SIZE = 10
export const CURVE_HANDLE_SIZE = 6
export const TEXT_PADDING = 8
export const STICKY_MIN_SIZE = 80
export const FONT_SIZE_DEFAULT = 16
export const MINIMAP_WIDTH = 150
export const MINIMAP_HEIGHT = 100
export const LAYERS_PANEL_WIDTH = 240
```

### `snapping.ts` — Enhanced with Element-to-Element Snap

Current: only grid snapping.

New: element-to-element snapping:
- Snaps to edges (left, right, top, bottom) and centers (horizontal, vertical) of other visible, unlocked elements
- Threshold: `SNAP_THRESHOLD` (5px)
- Returns `SmartGuide[]` for visual feedback
- Works during both move and resize operations
- Only considers elements within the viewport (performance)

```ts
export function computeElementSnap(
    movingBounds: Bounds,
    otherElements: BoardElement[],
    camera: Camera,
    gridSize: number | null,
): { snappedPosition: Point; guides: SmartGuide[] }
```

### `rendering.ts` — Render Optimization

Dirty flag / offscreen canvas caching system:
- Module-level `Map<string, { canvas: OffscreenCanvas; version: number }>` cache
- Each element gets a `_renderVersion` counter (incremented on mutation)
- `drawElement()` checks cache: if version matches, blit from cache. Otherwise re-render to offscreen canvas and cache.
- Camera/viewport changes don't invalidate caches (only transform applied differently)
- Cache eviction: remove entries for deleted elements

Rich text rendering:
- `drawRichText(ctx, segments, x, y, maxWidth, style)` — renders `RichTextSegment[]` with inline formatting
- Bold: heavier font weight. Italic: italic font style. Underline/strikethrough: drawn lines.
- Used by text, sticky, and arrow label rendering

### `exportEngine.ts` — Fixed + New Formats

**SVG export fix:** embed images as `<image xlink:href="data:image/png;base64,..." />`. Rich text rendered as `<text>` with `<tspan>` elements for formatting.

**PNG quality:** `exportBoardToPng(elements, camera, options: { scale: 1 | 2 | 3, transparentBg: boolean })`. Uses `devicePixelRatio * scale` for the canvas.

**JSON export/import:**
```ts
export function exportBoardToJson(elements: BoardElement[], camera: Camera, grid: GridSettings): string
export function importBoardFromJson(json: string): { elements: BoardElement[]; camera: Camera; grid: GridSettings }
```

Clean JSON format, validates on import, regenerates IDs to avoid conflicts.

### `index.ts` — Backward Compatible Re-export

```ts
export * from "./constants"
export * from "./hitTest"
export * from "./rendering"
export * from "./transforms"
export * from "./connections"
export * from "./groups"
export * from "./exportEngine"
export * from "./snapping"
```

The old `src/utils/boardEngine.ts` is deleted. Any file importing from `@/utils/boardEngine` updates to import from `@/utils/board`.

---

## Phase 3: Component Decomposition

### `BoardCanvas.tsx` (1,274 lines) → ~400 lines + 3 extracted pieces

**`BoardCanvas.tsx`** (slimmed ~400 lines) — canvas element, delegates to hooks:

**`useCanvasInteraction.ts`** (~400 lines) — interaction state machine hook:
- States: idle, panning, drawing, selecting, moving, resizing, rotating, connecting, curving, editing-text
- Handles mousedown/mousemove/mouseup/touchstart/touchmove/touchend
- Returns current interaction state, event handlers, cursor style
- Uses element-to-element snapping during move/resize

**`useCanvasRenderer.ts`** (~200 lines) — render loop hook:
- `requestAnimationFrame` loop with dirty flag
- Offscreen canvas cache management
- Viewport culling with `VIEWPORT_MARGIN`
- Device pixel ratio handling
- Returns `canvasRef` and `requestRender()` trigger

**`ContextMenu.tsx`** (~80 lines) — extracted right-click menu:
- Copy, Paste, Duplicate, Delete
- Group, Ungroup
- Bring to front, Send to back
- Lock/Unlock
- Positioned at click coordinates

### `BoardEditor.tsx` (1,101 lines) → ~300 lines + 3 extracted hooks

**`BoardEditor.tsx`** (slimmed ~300 lines) — orchestrator:
- Holds elements state, selectedIds, camera, tool, grid settings
- Renders layout: ToolToolbar + optional LayersPanel + BoardCanvas + optional BoardProperties + optional Minimap + RulerOverlay
- Wires all hooks and child components

**`useBoardHistory.ts`** (~80 lines) — undo/redo hook:
- 80-level history (snapshots of elements + selectedIds)
- `push()`, `undo()`, `redo()`, `canUndo`, `canRedo`
- Skip ref pattern (same as useColorHistory)

**`useBoardClipboard.ts`** (~100 lines) — clipboard hook:
- `copy()`, `cut()`, `paste()`, `duplicate()`
- Handles ID regeneration, position offset on paste
- Group cloning (deep copy with new IDs for children)
- Uses `navigator.clipboard` for cross-tab copy when available

**`useBoardKeyboard.ts`** (~120 lines) — keyboard shortcuts hook:
- Consolidates all 40+ shortcuts from BoardEditor
- Registers with `useKeyboardShortcuts` from shared infra
- Returns `shortcuts` array for the ShortcutsSheet

### New Feature Components

**`LayersPanel.tsx`** (~250 lines) — Figma-style layers:

Props:
```ts
interface LayersPanelProps {
    elements: BoardElement[]
    selectedIds: string[]
    onSelect: (ids: string[]) => void
    onReorder: (elementId: string, newIndex: number) => void
    onToggleVisible: (id: string) => void
    onToggleLock: (id: string) => void
    onRename: (id: string, name: string) => void
    onMoveToGroup: (elementId: string, groupId: string | null) => void
}
```

- Left panel, 240px wide, toggleable from BoardTopBar
- Element rows with type icon, name (auto or custom), visibility eye, lock icon
- Groups render as collapsible folders with indented children
- Click to select (shift/cmd for multi), double-click name to rename
- Drag to reorder z-index or move into/out of groups
- Search input to filter by name/text content
- Bidirectional selection sync with canvas

**`Minimap.tsx`** (~150 lines) — overview panel:

Props:
```ts
interface MinimapProps {
    elements: BoardElement[]
    camera: Camera
    canvasSize: { width: number; height: number }
    onNavigate: (x: number, y: number) => void
}
```

- Bottom-right corner, 150x100px, semi-transparent bg
- Simplified element rendering (colored rectangles, no detail)
- Blue viewport rectangle showing current view bounds
- Click to navigate, drag viewport rectangle to pan
- Toggle from BoardTopBar

**`RulerOverlay.tsx`** (~100 lines) — dimension display:

Props:
```ts
interface RulerOverlayProps {
    elements: BoardElement[]
    selectedIds: string[]
    hoveredId: string | null
    camera: Camera
    interacting: boolean
}
```

- Renders on a canvas overlay (not DOM) for performance
- On hover: tooltip showing W × H near element
- On select: info bar at bottom with X, Y, W, H
- On move/resize: live-updating dimensions + delta
- Between two selected elements: distance between edges

### Existing files modified

**`BoardTopBar.tsx`** — add buttons for:
- Layers panel toggle
- Minimap toggle
- JSON export in export menu
- PNG quality selector (1x/2x/3x dropdown)
- Keyboard shortcuts button (`?`)

**`BoardProperties.tsx`** — add rich text controls:
- Bold (B), Italic (I), Underline (U), Strikethrough (S) toggle buttons
- Text color picker (small color dots)
- Bullet list toggle
- Only visible when text-like element is selected
- Applies to full element text or selected range during editing

**`BoardToolbar.tsx`** — no changes needed (62 lines, clean)

### Final Component File Structure

```
src/components/board/
├── BoardEditor.tsx           (rewrite, ~300 lines)
├── BoardCanvas.tsx           (rewrite, ~400 lines)
├── BoardProperties.tsx       (modify, add rich text controls)
├── BoardToolbar.tsx          (existing, 62 lines, no changes)
├── BoardTopBar.tsx           (modify, add new buttons)
├── LayersPanel.tsx           (new, ~250 lines)
├── Minimap.tsx               (new, ~150 lines)
├── RulerOverlay.tsx          (new, ~100 lines)
├── ContextMenu.tsx           (new, extracted, ~80 lines)
├── useCanvasInteraction.ts   (new, extracted, ~400 lines)
├── useCanvasRenderer.ts      (new, extracted, ~200 lines)
├── useBoardHistory.ts        (new, extracted, ~80 lines)
├── useBoardClipboard.ts      (new, extracted, ~100 lines)
├── useBoardKeyboard.ts       (new, extracted, ~120 lines)
├── presets.ts                (existing, 28 lines, no changes)
```

---

## Phase 4: New Features Summary

### 4.1 Layers Panel
- Figma-style left panel with element tree
- Groups as collapsible folders with nested children
- Visibility toggle (eye), lock toggle, rename (double-click)
- Drag to reorder z-index or move between groups
- Search/filter
- Bidirectional selection sync with canvas

### 4.2 Minimap
- 150x100px bottom-right overview
- Simplified colored rectangles for elements
- Viewport rectangle showing current view
- Click to navigate, drag to pan
- Toggleable from top bar

### 4.3 Element-to-Element Snapping
- Snaps moving/resizing elements to edges and centers of other visible, unlocked elements
- 5px threshold
- Visual guide lines (dashed accent lines) during snap
- Works alongside grid snapping (both active simultaneously)

### 4.4 Rich Text
- Bold, italic, underline, strikethrough, text color, bullet lists
- Stored as `RichTextSegment[]` on text, sticky, and arrow label elements
- Formatting toolbar in BoardProperties when text element selected
- Rendered on canvas with inline formatting
- Backward compatible: plain `text` field stays as fallback

### 4.5 JSON Export/Import
- Clean JSON format for board state (elements, camera, grid)
- Export via BoardTopBar menu
- Import via file drag-drop or menu
- Validates and regenerates IDs on import

### 4.6 SVG Export with Embedded Images
- Images embedded as base64 `<image>` elements
- Rich text rendered as `<text>` with `<tspan>` formatting
- Full fidelity export (no data loss)

### 4.7 Keyboard Shortcuts Cheatsheet
- `?` key opens ShortcutsSheet (reuses shared component)
- All 40+ board shortcuts registered
- Categories: Tools, Edit, View, Elements

### 4.8 Rulers / Measurements
- Hover: W × H tooltip
- Select: X, Y, W, H info bar
- Move/resize: live dimensions + delta
- Multi-select: distance between elements

---

## Dependencies

No new dependencies. Everything uses:
- Canvas 2D API (existing)
- Shared infrastructure hooks/components (existing)
- `html-to-image` for PNG export (existing)

---

## Migration Notes

- `src/utils/boardEngine.ts` (1,845 lines) is deleted, replaced by `src/utils/board/` (7 modules + index + constants)
- `src/types/board.ts` is fully rewritten with discriminated union
- All files importing `@/utils/boardEngine` update to `@/utils/board`
- `kutudFormat.ts` is updated to handle new element types (backward compatible — reads old format, writes new)
- `BaseElement` gains `visible: boolean` (default true) and `name: string | null` (default null) — existing boards get defaults on load
- `presets.ts` updated to use new element types
- Backward compatibility for saved boards: when loading a .kutud or JSON file that lacks `visible`, `name`, or `richText` fields, defaults are applied (`visible: true`, `name: null`, `richText: []`). The `parseKutud()` and `importBoardFromJson()` functions handle this normalization.
