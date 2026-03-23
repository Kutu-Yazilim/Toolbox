# Board Overhaul Design

## Overview

Overhaul the Board (whiteboard/diagramming) tool from a basic canvas drawing app to an Excalidraw/Miro-class diagramming tool. Clean/precise rendering style (not hand-drawn). Three phases, each producing usable improvements.

**Current state:** ~2,800 lines across 7 files. 10 tools, 8 element types. Basic zoom/pan, selection, copy/paste, undo/redo, PNG/.kutud export. Missing: rotation, context menu, perfect shapes, curved arrows, SVG export, font options, image insertion, alignment, grouping, smart guides, touch support.

**Target:** Professional diagramming tool competitive with Excalidraw and Miro for quick diagrams, wireframes, and brainstorming.

**Architecture:** Modify existing files. No new dependencies. Canvas 2D rendering stays.

---

## Phase 1: Layout Fix + Core Parity

### 1.1 Layout Fix
- **Problem:** Canvas doesn't fill available space — appears to use only half the screen
- **Fix:** Ensure the board container uses `h-full w-full` and the canvas ResizeObserver correctly tracks the full container dimensions. The canvas element must have `display: block` (not inline) and match its container exactly.
- Verify that the parent layout in `BoardEditor.tsx` fills the available space from `CategoryLayout` / `RootLayout`

### 1.2 Rotation
- Rotation handle: circular handle positioned above the selected element's bounding box (offset ~24px above top-center)
- Cursor: `cursor: grab` on hover, custom rotate cursor during drag
- Drag to rotate freely; Shift constrains to 15° increments
- `rotation` property already exists on `BoardElement` — currently unused
- Wire rotation through:
  - **Rendering:** Apply `ctx.rotate(element.rotation)` around element center before drawing
  - **Hit testing:** Inverse-rotate the test point before checking bounds
  - **Resize handles:** Rotate handle positions around element center
  - **Properties panel:** Show rotation value (degrees) with reset button

### 1.3 Right-Click Context Menu
- Custom context menu on right-click (prevent default browser menu)
- Menu items:
  - Cut (Ctrl+X), Copy (Ctrl+C), Paste (Ctrl+V), Duplicate (Ctrl+D)
  - Separator
  - Bring to Front, Bring Forward, Send Backward, Send to Back
  - Separator
  - Lock / Unlock
  - Delete
  - Separator
  - Select All (Ctrl+A)
- Position: at mouse cursor, contained within viewport
- Dismiss on click outside, Escape, or any action

### 1.4 Perfect Shapes (Shift Constraint)
- Shift + draw rectangle → square (width = height = max(width, height))
- Shift + draw ellipse → circle (same logic)
- Shift + draw line → constrain angle to nearest 0°/45°/90°/135°/180°/225°/270°/315°
- Shift + draw diamond → equilateral diamond
- Apply constraint during preview and on commit

### 1.5 Arrow Improvements
- **Curved arrows:** Quadratic bezier curve with a draggable control point at the midpoint
  - When arrow is selected, show the control point handle
  - Dragging the control point changes the curve
  - Default: straight (control point at midpoint = straight line)
  - Store control point offset in arrow element data
- **Bidirectional arrows:** Toggle in properties panel — adds arrowhead at start as well as end
- **Arrow labels:** Double-click an arrow (with select tool active) to add/edit a text label positioned at the midpoint
  - Label is a property of the arrow element (`label: string`), NOT a separate element
  - If arrow has no label, double-click creates one and enters inline edit mode
  - If arrow already has a label, double-click enters edit mode on existing text
  - If the text tool is active, double-click on arrow is ignored (text tool creates standalone text)
  - Render centered on the arrow's midpoint with a small background-colored padding rect behind it

---

## Phase 2: Missing Features

### 2.1 SVG Export
- Reconstruct all visible elements as SVG DOM nodes
- Map each element type: rectangle → `<rect>`, ellipse → `<ellipse>`, diamond/line/arrow/draw → `<path>`, text → `<text>`, sticky → `<rect>` + `<text>`, image → `<image>` with embedded base64
- Respect all styles: stroke color, fill, opacity, stroke width, dash pattern, border radius, rotation
- Calculate viewBox from element bounding box (with padding)
- Download as `.svg` file
- Add SVG export button to top bar next to PNG export

### 2.2 Font Options
- Font family selector in properties panel: Sans-serif (`Inter, system-ui`), Serif (`Georgia, serif`), Monospace (`monospace`), Handwritten (`Caveat, cursive` — system fallback, no extra font loading)
- Bold toggle (font-weight 700 vs 400)
- Italic toggle (font-style italic vs normal)
- Text color picker (separate from stroke color) — add `textColor` to ElementStyle
- Apply to: text elements, sticky notes, arrow labels
- Store in element style, render in canvas with appropriate `ctx.font` string

### 2.3 Image Insertion
- New element type: `image` added to BoardElement types
- Insert via:
  - Drag-and-drop image file onto canvas
  - Paste image from clipboard (Ctrl+V when no text is being edited)
  - "Insert Image" button in toolbar or top bar
- Store image data as base64 data URI in the element
- Render using `ctx.drawImage()` with a preloaded `HTMLImageElement` (cache loaded images)
- On insertion: image is placed at its natural size (capped at 800px max dimension), centered at the drop/paste position. No drag-to-create — it just appears.
- Resize with aspect ratio lock by default (hold Alt to unlock ratio). Uses standard 8-handle resize.
- Inherits rotation support from Phase 1.
- Supported formats: PNG, JPEG, WebP, GIF (first frame only), SVG

### 2.4 Align & Distribute
- When 2+ elements are selected, show alignment toolbar in properties panel (or floating above selection)
- **Align (2+ elements):**
  - Left, Center (horizontal), Right
  - Top, Middle (vertical), Bottom
  - Aligns to the bounding box of the selection
- **Distribute (3+ elements):**
  - Horizontal: even spacing between elements
  - Vertical: even spacing between elements
- Icons for each action (use Lucide icons)

### 2.5 Grid & Smart Guides
- **Grid size selector:** Dropdown in top bar: 10, 20, 40, 80px (default 20)
- **Smart guides:** When dragging/resizing elements, show temporary alignment lines when:
  - Element edge aligns with another element's edge
  - Element center aligns with another element's center
  - Visual: thin colored line (e.g., primary color) spanning across canvas
  - Snaps to the guide with a 5px screen-space threshold (consistent feel regardless of zoom level)
- **Snap to element:** Works alongside grid snap — whichever is closer wins

---

## Phase 3: Polish & UX

### 3.1 Grouping
- Select multiple elements → Ctrl+G to group
- New element type or concept: `group` — stores child element IDs
- Group behaves as single element: move, resize (scales children proportionally), rotate
- Double-click group to "enter" — edit children individually, dimmed overlay on non-group elements. Only one level of editing at a time (entering a nested group exits the parent editing context).
- Click outside group to "exit"
- Ctrl+Shift+G to ungroup (flattens one level — nested groups stay grouped)
- Groups can be nested (max 3 levels to keep complexity bounded)
- Resizing a group scales all children proportionally (position and size, NOT stroke width)
- Rotating a group rotates all children around the group's center

### 3.2 Keyboard Shortcuts Expansion
- Ctrl+A: select all elements
- Ctrl+Shift+C: copy canvas as PNG to clipboard
- Alt+drag: duplicate element while dragging
- Arrow keys: nudge selected 1px; Shift+Arrow: nudge 10px
- `]`: bring forward one step; `[`: send backward one step
- Ctrl+`]`: bring to front; Ctrl+`[`: send to back
- Escape: deselect all / cancel current action

### 3.3 Z-Order Granular Controls
- Currently only "bring to front" and "send to back"
- Add "bring forward" (swap with next element in z-order) and "send backward" (swap with previous)
- Expose in context menu and properties panel

### 3.4 Performance
- **Viewport culling:** Before rendering, check if element's bounding box intersects the visible viewport. Skip rendering if entirely outside.
- **Dirty flag rendering:** Use a `needsRender` flag. Set it on: element changes, camera changes (zoom/pan), selection changes, tool state changes that affect visuals (e.g., preview element). Do NOT render on: idle mouse moves with no interaction, keyboard events that don't change state. Use `requestAnimationFrame` loop that checks the flag and only renders when dirty.
- Both changes are in `boardEngine.ts` rendering path

### 3.5 Export Improvements
- **Copy as PNG to clipboard:** Ctrl+Shift+C — uses `canvas.toBlob()` + `navigator.clipboard.write()`
- **Export selected only:** Toggle in export dialog — renders only selected elements
- **Transparent background:** Toggle in export — skip background fill, use `compositeOperation` to clear

### 3.6 Touch Support
- **Pinch to zoom:** Track two-touch distance changes → update camera.zoom
- **Two-finger pan:** Track two-touch midpoint changes → update camera.x/y
- **Single-finger:** Acts as current tool (select, draw, etc.)
- Add touch event listeners alongside mouse events in BoardCanvas.tsx
- Use `pointer events` API for unified mouse/touch/pen handling where possible

---

## Files Affected

| File | Phase 1 | Phase 2 | Phase 3 |
|------|---------|---------|---------|
| `src/types/board.ts` | rotation wiring, arrow curve data | image type, textColor, fontFamily/bold/italic | group type |
| `src/utils/boardEngine.ts` | rotation rendering/hit-test, perfect shapes, arrow curves | SVG export, image rendering, smart guides | viewport culling, dirty rendering |
| `src/components/board/BoardCanvas.tsx` | context menu, shift constraints, rotation handles | image drag-drop, smart guide overlay | touch events, pointer events |
| `src/components/board/BoardEditor.tsx` | layout fix, keyboard shortcuts for context menu actions | align/distribute state | grouping logic, expanded shortcuts |
| `src/components/board/BoardToolbar.tsx` | minimal changes | image tool button | minimal changes |
| `src/components/board/BoardTopBar.tsx` | minimal changes | SVG export button, grid size selector | export improvements UI |
| `src/components/board/BoardProperties.tsx` | rotation display | font options, text color, align/distribute buttons, bidirectional toggle | group-aware properties |

## Dependencies

None. All features use existing browser APIs (Canvas 2D, Pointer Events, Clipboard API).
