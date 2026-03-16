# ShapeMaker P0: Core Interactions & Transform System

**Date:** 2026-03-16
**Priority:** P0 (Core interaction fixes + Transform tools)
**Approach:** Refactor into interaction layers (Approach 2)

## Problem

The ShapeMaker tool has fundamental interaction gaps that make it unusable as a serious design tool:

- Cannot select shapes by clicking their filled area (only outline proximity)
- Cannot move entire shapes (only individual nodes)
- No copy/paste
- No rotation, scaling, or transform handles
- No distinction between shape-level and node-level editing

## Goals

- Fix shape selection to work by clicking filled areas
- Enable moving whole shapes by dragging
- Add rotation and scale transforms with bounding box handles (Figma-style)
- Add numeric transform inputs (X, Y, W, H, R) in the Properties panel
- Add copy/paste (Ctrl+C/V), duplicate (Ctrl+D), and Alt+Drag duplication
- Introduce a clean interaction state machine that separates shape mode from node mode
- Generate idiomatic Flutter code with `canvas.translate/rotate` for rotated shapes

## Non-Goals (P1/P2)

- Multi-select (P1)
- Grouping/ungrouping (P1)
- Layer reordering via drag-and-drop (P1)
- Boolean operations — union, subtract, intersect (P2)
- Node types — smooth/corner/symmetric (P2)
- Path simplification (P2)
- SVG import/export (P2)

## Design Decisions

### Transform Data Model

- **Moves bake into points immediately.** When the user drags a shape, all segment coordinates update to reflect the new position. There is no stored position offset.
- **Rotation and scale are stored separately** in a `ShapeTransform` object on each path: `{ rotation: number, scaleX: number, scaleY: number }`.
- **Scale is transient.** During a resize drag, `scaleX`/`scaleY` are used for rendering. On mouseup, the scale is baked into points and reset to 1.0.
- **Rotation is permanent.** `transform.rotation` persists and is used at render time (`ctx.translate/rotate`) and in Flutter code export.

### Interaction Model

- **Double-click to enter node editing mode.** Single-click selects the shape as a whole (shape mode). Double-click enters node mode for editing individual points/handles. Escape returns to shape mode.
- **State machine architecture.** A pure function `processEvent(state, event, context) → { newState, actions[] }` replaces the current ad-hoc `isDragging`/`isPanning`/`selectedPoint` state.

### Hit Testing

- **Canvas `isPointInPath`/`isPointInStroke` API** replaces the manual bezier sampling approach. More accurate, handles complex/self-intersecting paths, less code.
- **Transform-aware.** Click coordinates are un-rotated into the shape's local space before hit testing.
- **Reverse z-order.** Topmost visible shape is hit first.

### Transform Interaction (Figma-style)

- **Bounding box with 8 handles** (corners + edge midpoints) for resize.
- **Rotation by hovering just outside corners** — cursor changes to rotation cursor, drag to rotate.
- **Shift modifiers:** Shift+resize = proportional, Shift+rotate = snap to 15° increments.
- **Arrow keys** nudge 1px (Shift+Arrow = 10px), baked into points.

### Clipboard

- **Ctrl+C/V** for copy/paste (paste offsets +10px each time)
- **Ctrl+D** for duplicate in place
- **Alt+Drag** for drag-duplicate
- In-memory clipboard, not system clipboard.

## Data Model

### New Types

```typescript
type ShapeTransform = {
  rotation: number    // radians, around bounding box center
  scaleX: number      // 1.0 = no scale
  scaleY: number
}

type EditingMode = "shape" | "node"

type InteractionState =
  | { type: "idle" }
  | { type: "shape-selected"; pathId: string; mode: EditingMode }
  | { type: "dragging-shape"; pathId: string; startPoint: Point; originalSegments: PathSegment[] }
  | { type: "rotating"; pathId: string; center: Point; startAngle: number; originalRotation: number }
  | { type: "resizing"; pathId: string; handle: HandlePosition; origin: Point; originalBBox: BoundingBox; originalSegments: PathSegment[]; originalTransform: ShapeTransform }
  | { type: "dragging-node"; selectedPoint: SelectedPoint }
  | { type: "drawing-pen" }  // activePathId on CanvasState tracks which path is being drawn
  | { type: "drawing-shape"; shapeType: "rectangle" | "ellipse" | "line"; start: Point }

// Note: Panning is handled as a parallel concern (separate isPanning boolean),
// not part of InteractionState. It can occur during any state via middle-click or Alt+click.

type BoundingBox = { x: number; y: number; width: number; height: number }

type HandlePosition = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w"

type ClipboardEntry = {
  paths: ShapePath[]
}
```

### Modified Types

```typescript
// ShapePath gains transform field
type ShapePath = {
  id: string
  name: string
  segments: PathSegment[]
  closed: boolean
  paint: PaintStyle
  visible: boolean
  locked: boolean
  transform: ShapeTransform   // NEW
}
```

## Interaction State Machine

### State Transitions

```
IDLE
  ├─ click shape fill/stroke → SHAPE-SELECTED (shape mode)
  ├─ click empty area → stay IDLE
  ├─ click with pen tool → DRAWING-PEN
  ├─ mousedown with rect/ellipse/line → DRAWING-SHAPE
  └─ middle-click / alt+click → PANNING (separate)

SHAPE-SELECTED (shape mode)
  ├─ drag shape body → DRAGGING-SHAPE
  ├─ drag resize handle → RESIZING
  ├─ drag rotation zone → ROTATING
  ├─ double-click → SHAPE-SELECTED (node mode)
  ├─ click another shape → SHAPE-SELECTED (new shape)
  ├─ click empty area → IDLE
  ├─ Delete → delete shape → IDLE
  ├─ Ctrl+C → copy to clipboard
  ├─ Ctrl+D → duplicate in place
  ├─ Alt+drag → duplicate + DRAGGING-SHAPE
  └─ Arrow keys → nudge

SHAPE-SELECTED (node mode)
  ├─ click node → select node
  ├─ drag node → DRAGGING-NODE
  ├─ Escape → SHAPE-SELECTED (shape mode)
  ├─ click empty → IDLE
  └─ Delete → delete node

DRAGGING-SHAPE → mouseup → SHAPE-SELECTED
ROTATING → mouseup → SHAPE-SELECTED
RESIZING → mouseup → SHAPE-SELECTED (bake scale, reset to 1.0)
DRAGGING-NODE → mouseup → SHAPE-SELECTED (node mode)
DRAWING-PEN → Enter/Escape → IDLE
DRAWING-SHAPE → mouseup → SHAPE-SELECTED
```

### Cursor Map

| Context | Cursor |
|---------|--------|
| Select tool, hovering shape body | `move` |
| Hovering resize handle | directional (`nwse-resize`, `ns-resize`, etc.) |
| Hovering rotation zone | `grab` |
| Hovering node in node mode | `crosshair` |
| Drawing tools | `crosshair` |
| Select tool, empty area | `default` |

## Hit Testing

### Priority Order

1. Transform handles (if shape selected in shape mode)
   - 8 resize handles: 8×8px squares in screen space
   - 4 rotation zones: 12px radius, 16px outside corners, screen space
2. Nodes (if in node mode)
   - Control points and endpoints
3. Shape fills (closed paths)
   - `ctx.isPointInPath(path2d, x, y)`
4. Shape strokes (all paths)
   - `ctx.isPointInStroke(path2d, x, y)` with lineWidth set to `max(strokeWidth, 8/zoom)` for easier picking
5. Nothing → deselect

### Transform-Aware Testing

Before `isPointInPath`, un-rotate the click point around the shape's bounding box center by `-transform.rotation`. This ensures rotated shapes can be clicked correctly.

### Path2D Caching

Build `Path2D` objects from `ShapePath.segments` and cache per shape. Invalidate when segments change.

## Transform Operations

### Move (bake into points)

On drag: compute `delta = currentMouse - startMouse`, apply delta to ALL points in ALL segments (moveTo.point, lineTo.point, quadratic controlPoint + endPoint, cubic controlPoint1 + controlPoint2 + endPoint, arc endPoint).

### Rotation (stored in transform)

On drag: `currentAngle = atan2(mouseY - centerY, mouseX - centerX)`, `delta = currentAngle - startAngle`, set `transform.rotation = originalRotation + delta`. Shift snaps to 15° increments.

### Resize (transient scale, bake on release)

On drag: compute `scaleX = newWidth / originalWidth`, `scaleY = newHeight / originalHeight` from anchor. For corner handles, the anchor is the opposite corner and both axes scale. For edge handles (n/s/e/w), the anchor is the opposite edge and only one axis scales (e.g., dragging "n" handle only changes scaleY). Shift constrains proportions. On mouseup: apply scale to all points as `newPoint = anchor + (originalPoint - anchor) * scale`, reset scale to 1.0.

### Nudge

Arrow keys: +1px to all points. Shift+Arrow: +10px.

## Rendering Changes

### Per-Path Rotation

In `renderLayer`, for paths with `transform.rotation !== 0`:

```
ctx.save()
ctx.translate(centerX, centerY)
ctx.rotate(path.transform.rotation)
ctx.translate(-centerX, -centerY)
// draw path normally
ctx.restore()
```

### Bounding Box + Handles

When shape selected in shape mode, render after all layers:
1. Compute bounding box in canvas space
2. Apply rotation transform
3. Draw dashed rectangle
4. Draw 8 resize handles (white fill, blue stroke)
5. Rotation zones are invisible (cursor-only)

## Properties Panel

### New Transform Section (top of panel)

Shows when a shape is selected in shape mode. Hidden in node mode or no selection.

| Field | Source | On edit |
|-------|--------|---------|
| X | `boundingBox.x` | Bake delta into all points |
| Y | `boundingBox.y` | Bake delta into all points |
| W | `boundingBox.width` | Scale all points from left edge |
| H | `boundingBox.height` | Scale all points from top edge |
| R | `transform.rotation` (degrees) | Set rotation directly (deg → rad) |

Lock aspect ratio checkbox makes W/H changes proportional.

## Code Export

For shapes with `transform.rotation !== 0`, generate:

```dart
canvas.save();
canvas.translate(centerX, centerY);
canvas.rotate(rotationInRadians);
canvas.translate(-centerX, -centerY);
// path and paint code
canvas.restore();
```

## Keyboard Shortcuts (Full Map)

### Selection & Movement
| Shortcut | Action |
|----------|--------|
| Click shape | Select shape (shape mode) |
| Double-click shape | Enter node mode |
| Escape | Exit node mode → shape mode, or deselect |
| Arrow keys | Nudge 1px |
| Shift + Arrow | Nudge 10px |
| Delete / Backspace | Delete selected shape or node |

### Copy/Paste
| Shortcut | Action |
|----------|--------|
| Ctrl+C | Copy selected shape |
| Ctrl+V | Paste (offset +10px) |
| Ctrl+D | Duplicate in place |
| Alt+Drag | Drag-duplicate |

### Transforms
| Shortcut | Action |
|----------|--------|
| Drag shape body | Move (bake into points) |
| Drag corner handle | Free resize |
| Shift + drag corner | Proportional resize |
| Drag outside corner | Free rotate |
| Shift + rotate | Snap to 15° |
| Drag edge handle | Stretch on one axis |

### Tools (unchanged)
| Shortcut | Action |
|----------|--------|
| V | Select tool |
| P | Pen tool |
| L | Line tool |
| R | Rectangle tool |
| O | Ellipse tool |
| G | Toggle grid |
| S | Toggle snap |
| 1/2/3 | Curve mode (straight/quadratic/cubic) |
| Enter | Close path |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/utils/shapemakerHitTest.ts` | Path2D building, isPointInPath/isPointInStroke, handle hit zones, transform-aware coordinate mapping |
| `src/utils/shapemakerInteraction.ts` | Pure state machine: processEvent() → { newState, actions[] } |
| `src/utils/shapemakerTransform.ts` | computeBoundingBox(), handle positions, point translation/scaling math |
| `src/utils/shapemakerClipboard.ts` | Deep clone, offset, ID reassignment |

### Modified Files
| File | Changes |
|------|---------|
| `src/types/shapemaker.ts` | Add ShapeTransform, InteractionState, EditingMode, BoundingBox, HandlePosition, ClipboardEntry, Action types. Add transform to ShapePath. |
| `src/components/shapemaker/ShapeMakerCanvas.tsx` | Replace ad-hoc handlers with processEvent(). Remove isPointNearPath/sampling functions. Add bounding box + handle rendering. Add cursor management. |
| `src/components/shapemaker/ShapeMaker.tsx` | Replace scattered state with InteractionState. Add action dispatcher. Add copy/paste/duplicate/nudge shortcuts. |
| `src/components/shapemaker/PropertiesPanel.tsx` | Add Transform section (X, Y, W, H, R inputs). |
| `src/utils/shapemakerCanvas.ts` | Update renderLayer for per-path rotation. |
| `src/utils/shapemakerCodegen.ts` | Emit canvas.save/translate/rotate/restore for rotated shapes. |

### Unchanged Files
- `LayersPanel.tsx`
- `CodeExportPanel.tsx`

### Dependency Flow
```
types/shapemaker.ts
     ↓
utils/shapemakerTransform.ts  (imports types)
utils/shapemakerHitTest.ts    (imports types, transform)
utils/shapemakerClipboard.ts  (imports types)
utils/shapemakerInteraction.ts (imports types, hitTest, transform, clipboard)
utils/shapemakerCanvas.ts     (imports types)
utils/shapemakerCodegen.ts    (imports types)
     ↓
components/ShapeMakerCanvas.tsx  (imports interaction, hitTest, canvas utils)
components/PropertiesPanel.tsx   (imports types, transform)
components/ShapeMaker.tsx        (imports all above)
```
