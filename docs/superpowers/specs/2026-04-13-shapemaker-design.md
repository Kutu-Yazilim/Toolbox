# Shape Maker — Deep Overhaul Design Spec

**Date:** 2026-04-13
**Scope:** Decomposition of 1,416-line monolith, fix `as any` casts, 5 new features
**Approach:** Decompose first (Phase 1), then add features (Phase 2)
**Current size:** 5,187 lines across 6 components + 6 utility files + 1 type file

---

## Phase 1: Decomposition + Type Safety Fix

### Fix `as any` Casts — Discriminated Update Helper

Add `updateSegmentPoint` to `src/utils/shapemakerTransform.ts`:

```ts
function updateSegmentPoint(
    segment: PathSegment,
    field: string,
    value: Point
): PathSegment {
    switch (segment.type) {
        case "moveTo": return { ...segment, point: value }
        case "lineTo": return { ...segment, point: value }
        case "quadratic":
            if (field === "controlPoint") return { ...segment, controlPoint: value }
            return { ...segment, endPoint: value }
        case "cubic":
            if (field === "controlPoint1") return { ...segment, controlPoint1: value }
            if (field === "controlPoint2") return { ...segment, controlPoint2: value }
            return { ...segment, endPoint: value }
        case "arcTo": return { ...segment, endPoint: value }
        case "close": return segment
    }
}
```

Replace all 6 `as any` casts in `ShapeMaker.tsx` with calls to this function. Zero `as any` remaining after this change.

### `ShapeMaker.tsx` (1,416 lines) Decomposition

Split into orchestrator + 4 extracted hooks:

#### `ShapeMaker.tsx` (~300 lines) — Orchestrator

Responsibilities:
- Renders layout: ToolToolbar + LayersPanel (left) + ShapeMakerCanvas (center) + PropertiesPanel (right) + CodeExportPanel (bottom)
- Coordinates state between hooks and child components
- Handles file import/export (JSON save/load)
- Manages dialog/panel visibility states

#### `useShapeMakerState.ts` (~250 lines) — Core State Hook

Extracted from ShapeMaker's state management:
- Canvas state: width, height, layers, activeLayerId, activePathId, backgroundColor
- Selection state: selectedPathIds (plural — supports multi-select), interaction mode
- Action dispatcher: the 17-action `processAction` function
- Path CRUD: add, delete, update, close, duplicate
- Layer CRUD: add, delete, toggle visibility/lock, rename, reorder
- Uses `useLocalStorage` for persistence

Returns:
```ts
{
    canvasState: CanvasState
    selectedPathIds: string[]
    // All CRUD functions
    addLayer, deleteLayer, toggleLayerVisibility, toggleLayerLock, renameLayer, reorderLayers
    addPath, deletePath, updatePath, closePath, duplicatePath
    setCanvasSize, setBackgroundColor
    setSelectedPathIds
    processAction
}
```

#### `useShapeMakerHistory.ts` (~80 lines) — Undo/Redo

Same pattern as Board's `useBoardHistory`:
- 50-level history of layer snapshots
- `push()`, `undo()`, `redo()`, `canUndo`, `canRedo`
- Skip ref pattern to prevent undo/redo from creating history entries

#### `useShapeMakerClipboard.ts` (~60 lines) — Clipboard

Extracted clipboard logic:
- `copy(pathIds: string[])` — stores paths with paste count
- `paste()` — duplicates with 10px offset, increments paste count
- `duplicate(pathIds: string[])` — immediate copy+paste
- ID regeneration on paste

#### `useShapeMakerKeyboard.ts` (~100 lines) — Keyboard Shortcuts

Consolidated from ShapeMaker's scattered keyboard handling:
- Tool shortcuts: V (select), P (pen), L (line), R (rectangle), O (ellipse), N (polygon — new)
- Drawing modes: 1 (line), 2 (quadratic), 3 (cubic) — pen sub-modes
- Toggle shortcuts: G (grid), S (snap-to-grid)
- Edit: Ctrl+Z/Y (undo/redo), Ctrl+C/V/D (copy/paste/duplicate), Delete, Escape, Enter
- Uses `useKeyboardShortcuts` from shared infra
- Returns `shortcuts` array for ShortcutsSheet

### File Structure After Phase 1

```
src/components/shapemaker/
├── ShapeMaker.tsx              (rewrite, ~300 lines)
├── ShapeMakerCanvas.tsx        (existing, minor updates for multi-select)
├── PropertiesPanel.tsx         (existing, extended in Phase 2)
├── LayersPanel.tsx             (existing, extended in Phase 2)
├── CodeExportPanel.tsx         (existing, 126 lines, no changes)
├── useShapeMakerState.ts       (new, ~250 lines)
├── useShapeMakerHistory.ts     (new, ~80 lines)
├── useShapeMakerClipboard.ts   (new, ~60 lines)
├── useShapeMakerKeyboard.ts    (new, ~100 lines)
├── presets.ts                  (existing, extended in Phase 2)
```

---

## Phase 2: New Features

### 2.1 Gradient Editor UI

Inline in `PropertiesPanel.tsx` — add a gradient section below fill/stroke color controls.

**New component:** `GradientStopsEditor.tsx` (~150 lines)

Props:
```ts
interface GradientStopsEditorProps {
    gradient: LinearGradient | RadialGradient | SweepGradient | null
    gradientType: "linear" | "radial" | "sweep"
    onTypeChange: (type: "linear" | "radial" | "sweep") => void
    onChange: (gradient: LinearGradient | RadialGradient | SweepGradient) => void
    onClear: () => void  // revert to solid color
}
```

Layout:
- **Mode selector pills:** Solid | Linear | Radial | Sweep
- When Solid selected: current color picker behavior (no changes)
- When gradient selected:
  - **Gradient bar:** horizontal strip showing the gradient with draggable stop handles. Click empty space to add stop, drag off to remove. Minimum 2 stops.
  - **Angle input** (linear only): 0-360 degrees number input
  - **Center inputs** (radial/sweep): X% and Y% number inputs
  - **Stops table:** each row shows color swatch (clickable → opens small color input), position % input, remove button
  - **Add stop button**
- Applies to the selected path's `PaintStyle.gradient` field
- When gradient is set, the fill/stroke color pickers show the gradient preview instead of a solid color

**PropertiesPanel changes:**
- Add "Paint Mode" section with Solid/Linear/Radial/Sweep pills
- When non-solid: render `<GradientStopsEditor>` inline
- Wire onChange to update the selected path's paint style

### 2.2 Multi-Select + Alignment

**Multi-select changes:**

State: `selectedPathIds: string[]` replaces `selectedPathId: string | null` throughout.

Interaction changes in `shapemakerInteraction.ts`:
- Shift+click: toggle path in/out of selection
- Ctrl/Cmd+A: select all visible, unlocked paths
- Click empty space: clear selection
- Drag on selected group: move all selected paths
- Shared bounding box drawn around all selected paths

Canvas changes in `shapemakerCanvas.ts`:
- Draw combined bounding box when multiple paths selected
- Resize handles on combined bounding box (proportional resize for all)

**Alignment (when 2+ selected):**

New functions in `shapemakerTransform.ts`:
```ts
alignPaths(paths: ShapePath[], direction: "left" | "center" | "right" | "top" | "middle" | "bottom"): ShapePath[]
distributePaths(paths: ShapePath[], direction: "horizontal" | "vertical"): ShapePath[]
```

New UI in `PropertiesPanel.tsx`:
- When 2+ paths selected: show "Align" section with 6 alignment buttons (left, center H, right, top, center V, bottom)
- When 3+ paths selected: also show 2 distribution buttons (distribute H, distribute V)
- Use lucide icons: `AlignStartVertical`, `AlignCenterVertical`, `AlignEndVertical`, `AlignStartHorizontal`, `AlignCenterHorizontal`, `AlignEndHorizontal`

### 2.3 Layer Reordering

Enhance existing `LayersPanel.tsx`:

- **Drag handle** on each layer row (GripVertical icon from lucide)
- **Drag-to-reorder layers:** drag a layer row up/down to change layer order
- **Drag-to-reorder paths within a layer:** drag a path row up/down within its layer
- **Move path between layers:** drag a path from one layer to another layer's section
- **Visual feedback:** blue drop indicator line between rows during drag, highlighting the target drop zone
- State management: `reorderLayers(fromIndex, toIndex)` and `reorderPaths(layerId, fromIndex, toIndex)` functions added to `useShapeMakerState`

Implementation: use HTML5 drag-and-drop API (same pattern as existing board drag reordering). No external library needed.

### 2.4 Polygon Tool

New tool mode: `polygon` (keyboard shortcut: `N`).

**New file:** `src/utils/shapemakerPolygon.ts` (~150 lines)

Pure shape generation functions:
```ts
generateRegularPolygon(sides: number, cx: number, cy: number, radius: number): PathSegment[]
generateStar(points: number, cx: number, cy: number, outerRadius: number, innerRadius: number): PathSegment[]
generatePresetShape(preset: PolygonPreset, cx: number, cy: number, size: number): PathSegment[]
```

All return `PathSegment[]` (moveTo + lineTo segments + close) that can be used directly as a `ShapePath.segments`.

**Polygon presets:**
```ts
type PolygonPreset =
    | "triangle" | "square" | "pentagon" | "hexagon" | "octagon"
    | "star-5" | "star-6" | "star-8"
    | "arrow" | "cross" | "chevron" | "badge"
```

Custom shapes (arrow, cross, chevron, badge) are hand-defined coordinate arrays scaled to the given size.

**Drawing flow:**
1. Select polygon tool → small config popover appears near toolbar showing:
   - Sides slider (3-12) for regular polygons
   - Star toggle (with inner radius slider when active)
   - Preset dropdown for custom shapes
2. Click+drag on canvas to place and size
3. On release: polygon added as a new closed path with the generated segments

**New component:** `PolygonConfig.tsx` (~80 lines) — the popover shown when polygon tool is active.

Props:
```ts
interface PolygonConfigProps {
    sides: number
    isStar: boolean
    innerRadius: number  // 0-100 as percentage of outer radius
    preset: PolygonPreset | null
    onSidesChange: (sides: number) => void
    onStarToggle: (isStar: boolean) => void
    onInnerRadiusChange: (radius: number) => void
    onPresetSelect: (preset: PolygonPreset) => void
}
```

**Interaction changes:**
- Add polygon drawing state to `shapemakerInteraction.ts`
- On mousedown: record center point
- On mousemove: compute radius from distance to center, generate preview polygon
- On mouseup: commit polygon as new path

**Type changes:**
- Add `"polygon"` to `ToolMode` union in `src/types/shapemaker.ts`
- Add `PolygonPreset` type

### 2.5 Working Presets

Expand `presets.ts` from 4 to 10 presets. Each preset is a complete `Layer[]` that loads directly into the canvas.

**Presets:**
1. **Star** — 5-point star (generated via `generateStar`)
2. **Heart** — heart shape (hand-defined cubic bezier path)
3. **Arrow** — right-pointing arrow (polygon preset)
4. **Rounded Rectangle** — rectangle with rounded corners (existing)
5. **Circle** — perfect circle (4 cubic beziers, existing ellipse generation)
6. **Diamond** — rotated square (4 line segments)
7. **Speech Bubble** — rounded rectangle with tail (cubic bezier)
8. **Checkmark** — check/tick mark (line segments)
9. **Hexagon** — regular 6-sided polygon
10. **Cross/Plus** — plus sign shape

Each preset defined as:
```ts
{ name: string; category: string; description: string; content: string }
```

Where `content` is JSON-stringified `Layer[]`. The `onPresetSelect` handler in ShapeMaker parses the content and replaces/adds the layers.

**Wire presets:** Update ShapeMaker to actually call `setLayers(JSON.parse(preset.content))` on preset select, with undo support (push current state to history before loading).

---

## Final File Structure

```
src/components/shapemaker/
├── ShapeMaker.tsx              (rewrite, ~300 lines)
├── ShapeMakerCanvas.tsx        (modify, multi-select support)
├── PropertiesPanel.tsx         (modify, gradient editor + alignment buttons)
├── LayersPanel.tsx             (modify, drag-to-reorder)
├── CodeExportPanel.tsx         (existing, no changes)
├── GradientStopsEditor.tsx     (new, ~150 lines)
├── PolygonConfig.tsx           (new, ~80 lines)
├── useShapeMakerState.ts       (new, ~250 lines)
├── useShapeMakerHistory.ts     (new, ~80 lines)
├── useShapeMakerClipboard.ts   (new, ~60 lines)
├── useShapeMakerKeyboard.ts    (new, ~100 lines)
├── presets.ts                  (extend, 10 presets)

src/utils/
├── shapemakerInteraction.ts    (modify, multi-select + polygon drawing)
├── shapemakerCanvas.ts         (modify, multi-select bounding box)
├── shapemakerHitTest.ts        (existing, no changes)
├── shapemakerCodegen.ts        (existing, no changes)
├── shapemakerTransform.ts      (modify, add updateSegmentPoint + align/distribute)
├── shapemakerClipboard.ts      (existing, no changes — logic moves to hook)
├── shapemakerPolygon.ts        (new, ~150 lines)

src/types/
├── shapemaker.ts               (modify, add "polygon" to ToolMode, add PolygonPreset)
```

---

## Dependencies

No new dependencies. Everything uses existing Canvas 2D API and shared infrastructure.

---

## Migration Notes

- `ShapeMaker.tsx` is fully rewritten (not surgically modified) — too entangled to extract surgically
- `selectedPathId: string | null` becomes `selectedPathIds: string[]` throughout — this is an API change that affects ShapeMakerCanvas, PropertiesPanel, LayersPanel, and all interaction utilities. In `shapemakerInteraction.ts`, the interaction state machine must be updated: `processEvent` receives `selectedPathIds` instead of `selectedPathId`, and actions like `select` emit an array. Single-click selects one path (replaces array), shift+click toggles in/out of array.
- The 6 `as any` casts in the current ShapeMaker.tsx are eliminated by using `updateSegmentPoint`
- Existing localStorage persistence key stays the same for backward compatibility
- Presets that previously didn't generate anything now load actual shapes
