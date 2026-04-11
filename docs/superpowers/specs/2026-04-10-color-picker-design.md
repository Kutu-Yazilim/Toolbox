# Color Picker — Deep Overhaul Design Spec

**Date:** 2026-04-10
**Scope:** Decomposition of existing 2,700-line codebase + 4 new features: saved palettes, color wheel/spectrum picker, image extraction, gradient editor
**Approach:** Decompose first (Phase 1), then add features (Phases 2-5)

---

## Phase 1: Decomposition & Extracted Hooks

### Hooks to extract

#### `useColorHistory<T>` Hook

Extracted from ColorPicker's undo/redo logic (history array, historyIndex, skipHistoryRef).

```ts
const { state, pushState, undo, redo, canUndo, canRedo } = useColorHistory<PaletteColor[]>(initialColors)
```

- Max 50 states
- `skipHistoryRef` pattern prevents undo/redo from creating new history entries
- Returns current state and mutation functions

**Location:** `src/components/color/useColorHistory.ts`

#### `useColorNames` Hook

Extracted from ColorPicker's API name-fetching logic.

```ts
const { getName, preloadNames } = useColorNames()
```

- Caches fetched names in a Map (hex → name)
- 150ms debounced API calls
- Returns cached name synchronously if available
- `preloadNames(hexes: string[])` batches lookups for a palette

**Location:** `src/components/color/useColorNames.ts`

#### `usePaletteDrag` Hook

Extracted from drag-and-drop reordering logic.

```ts
const { dragHandleProps, dropTargetProps, isDragging } = usePaletteDrag(colors, onReorder)
```

- Returns props to spread on drag handles and drop targets
- Manages dragIndex/dragOverIndex refs internally

**Location:** `src/components/color/usePaletteDrag.ts`

### Component decomposition

`ColorDetailPanel.tsx` (600 lines) splits into:
- `ColorDetailPanel.tsx` — main panel orchestrator (~250 lines)
- `ConversionGrid.tsx` — the 9-format conversion grid (HEX, RGB, HSL, CMYK, LAB, LCH, XYZ, LUV, HWB)
- `HarmonyGrid.tsx` — harmony visualization section (analogous, complementary, triadic, etc.)
- `ShadeGrid.tsx` — shade/tint gradient section (12 shades)

`ColorPicker.tsx` (482 lines) slims down to ~250 lines by extracting the three hooks above.

### Existing files preserved (no changes needed)

- `AdjustDialog.tsx` (186 lines) — fine as-is
- `ContrastChecker.tsx` (170 lines) — fine as-is
- `HarmonySelector.tsx` (109 lines) — fine as-is
- `ColorBlindnessView.tsx` (75 lines) — fine as-is
- `PaletteToolbar.tsx` (117 lines) — fine as-is, will add new buttons
- `presets.ts` (40 lines) — fine as-is

---

## Phase 2: IndexedDB Storage & Saved Palettes

### Storage layer (reusing `idb` package, same pattern as API builder)

**`colorStore.ts`** — IndexedDB wrapper

Database: `kutu-colors`, version 1. Two object stores:

```ts
interface SavedPalette {
    id: string
    name: string
    colors: string[]         // hex values
    harmony: ColorHarmony
    createdAt: number
    updatedAt: number
}

interface SavedGradient {
    id: string
    name: string
    type: "linear" | "radial" | "conic"
    angle: number
    stops: GradientStop[]
    easing: string
    createdAt: number
    updatedAt: number
}
```

Object stores:
- `palettes` (keyPath: "id") — SavedPalette objects
- `gradients` (keyPath: "id") — SavedGradient objects

Functions:
```ts
getPalettes(): Promise<SavedPalette[]>
savePalette(palette: SavedPalette): Promise<void>
deletePalette(id: string): Promise<void>
getGradients(): Promise<SavedGradient[]>
saveGradient(gradient: SavedGradient): Promise<void>
deleteGradient(id: string): Promise<void>
```

**Location:** `src/components/color/colorStore.ts`

**`useColorStore.ts`** — React hook wrapping colorStore

```ts
const {
    palettes, savePalette, deletePalette,
    gradients, saveGradient, deleteGradient,
    loaded,
} = useColorStore()
```

**Location:** `src/components/color/useColorStore.ts`

### PalettesDrawer

Slide-out from right (same pattern as PresetsDrawer/HistoryDrawer):
- "Save Current" button at top → inline name input → Enter to save
- List of saved palettes:
  - Name (editable on click)
  - Color swatches preview (small horizontal strip)
  - Date saved (relative)
  - Click to load, X to delete
- Search/filter by name
- Palette count in footer
- Loading a saved palette replaces current colors (pushes to undo history)

**Location:** `src/components/color/PalettesDrawer.tsx`

### Toolbar integration

New button in PaletteToolbar actions: `FolderIcon` → opens PalettesDrawer

---

## Phase 3: Color Wheel / Spectrum Picker

### ColorPickerModal

Modal dialog with 4 tabs sharing the same color state. Switching tabs preserves the selected color. "Apply" confirms, "Cancel" discards.

**Location:** `src/components/color/ColorPickerModal.tsx` (main modal + tab container, ~100 lines)

#### Tab 1: HSL Wheel + Triangle — `HslWheelPicker.tsx`

- Outer ring: circular hue wheel (drag around to select hue, 0-360)
- Inner triangle: saturation/lightness picker (drag within triangle)
- Rendered via HTML Canvas for smooth interaction
- Selected color preview swatch + hex display below

**Location:** `src/components/color/HslWheelPicker.tsx`

#### Tab 2: HSV Square + Hue Strip — `HsvSquarePicker.tsx`

- Large square: X-axis = saturation (0-100), Y-axis = value/brightness (100-0, top is bright)
- Vertical strip on right: hue selector (0-360)
- Crosshair indicator on square, arrow indicator on hue strip
- Same layout as Chrome DevTools / VS Code

**Location:** `src/components/color/HsvSquarePicker.tsx`

#### Tab 3: RGB Wheel — `RgbWheelPicker.tsx`

- Three overlapping translucent circles (Red, Green, Blue) with additive color mixing
- Drag each circle to adjust that channel's intensity
- Intersection areas show mixed colors in real-time
- Channel value labels on each circle

**Location:** `src/components/color/RgbWheelPicker.tsx`

#### Tab 4: Direct Inputs — `DirectInputPicker.tsx`

- HEX input (6-char text input with # prefix)
- RGB: 3 horizontal sliders + number inputs (0-255 each), colored slider tracks
- HSL: 3 horizontal sliders + number inputs (H: 0-360 rainbow track, S: 0-100 gray-to-saturated track, L: 0-100 black-to-white track)
- HSB: 3 horizontal sliders + number inputs (H: 0-360, S: 0-100, B: 0-100)
- CMYK: 4 display fields (read-only, computed from current color)
- All inputs bidirectionally synced — changing any one updates all others
- Large color preview swatch at top

**Location:** `src/components/color/DirectInputPicker.tsx`

### Integration

Replaces the current `ColorEditor.tsx` inline popup. Opens when clicking a color's hex value in ColorColumn or a new "Edit" action button. The existing `ColorEditor.tsx` file is replaced by `ColorPickerModal.tsx`.

---

## Phase 4: Image Color Extraction

### ImageExtractorModal

Accessed via a new "Extract" button in PaletteToolbar (ImageIcon). Opens a modal.

**Layout:**
1. **Upload area** — drag-drop zone or file picker (PNG, JPG, WEBP, SVG). Uses `useFileImport` hook.
2. **Image preview** — shows uploaded image with colored dots overlaid at dominant color sample points
3. **Color count slider** — 3 to 12 colors (default 5)
4. **Extracted palette** — row of extracted color swatches below the image
5. **Actions:**
   - "Use as palette" → replaces current palette
   - "Add to palette" → appends to current palette
   - "Re-extract" → re-runs with different count
   - Cancel

**Location:** `src/components/color/ImageExtractorModal.tsx`

### Extraction algorithm

Client-side Canvas API + k-means clustering:
1. Draw image to hidden canvas, downscale to max 200x200 for performance
2. Read all pixel data via `getImageData()`
3. Run k-means clustering (k = desired count, max 20 iterations)
4. Sort resulting centroids by cluster size (most prominent first)
5. Convert to hex, deduplicate similar colors (deltaE < 5 using existing `colorUtils.ts` functions)

Pure function, no React:
```ts
function extractColors(imageData: ImageData, count: number): string[]
```

**Location:** `src/components/color/colorExtractor.ts`

Performance: downscale to 200x200 (~40,000 pixels), k-means converges in <100ms. No Web Worker needed.

---

## Phase 5: Gradient Editor

### GradientEditor

Toggled from the main palette view — a "Gradient" mode button in PaletteToolbar switches between palette mode and gradient mode. When active, replaces the palette columns with the gradient editor panel.

**Location:** `src/components/color/GradientEditor.tsx` (main container, ~150 lines)

### Layout

1. **Preview area** (~40% height):
   - Live gradient rendered on a div (full width, rounded corners)
   - Mock element preview below (switchable: Button | Card | Text):
     - Button: gradient as background
     - Card: gradient as card background with sample text
     - Text: gradient as text fill (`background-clip: text`)

2. **Gradient bar** (interactive):
   - Horizontal bar showing current gradient
   - Draggable stop handles (colored circles at bottom edge)
   - Click empty space to add a stop
   - Drag a stop off the bar (vertically) to remove it
   - Each stop shows position % label

3. **Controls panel**:
   - Type selector: Linear | Radial | Conic pills
   - Angle input (0-360) for linear, center position X/Y for radial/conic
   - Easing dropdown: linear, ease-in, ease-out, ease-in-out

4. **Stops table**:
   - Each row: color swatch (clickable → opens ColorPickerModal), position % input, remove button
   - Add stop button

5. **Output tabs**: CSS | Tailwind | SVG code with copy buttons

**Sub-components:**
- `GradientPreview.tsx` — live preview + mock element
- `GradientBar.tsx` — interactive gradient bar with draggable stops
- `GradientControls.tsx` — type/angle/easing controls + stops table
- `GradientOutput.tsx` — code output tabs (CSS, Tailwind, SVG)

### Types

```ts
interface GradientStop {
    id: string
    color: string        // hex
    position: number     // 0-100
}

interface GradientConfig {
    type: "linear" | "radial" | "conic"
    angle: number
    centerX: number      // 0-100, for radial/conic
    centerY: number      // 0-100, for radial/conic
    stops: GradientStop[]
    easing: "linear" | "ease-in" | "ease-out" | "ease-in-out"
}
```

**Location for types:** `src/components/color/colorTypes.ts` (new file, also moves existing types from `@/types/color` for colocation)

### Gradient presets

8 built-in presets: Sunset, Ocean, Aurora, Night Sky, Forest, Fire, Pastel, Monochrome. Each is a `GradientConfig` object.

**Location:** `src/components/color/gradientPresets.ts`

### Palette integration

- "From Palette" button: creates gradient from current palette colors (evenly spaced stops)
- "To Palette" button: extracts gradient stop colors into the palette
- Saved gradients stored in IndexedDB alongside saved palettes

### CSS output generation

```ts
function generateGradientCss(config: GradientConfig): string
function generateGradientTailwind(config: GradientConfig): string
function generateGradientSvg(config: GradientConfig): string
```

**Location:** `src/components/color/gradientUtils.ts`

---

## File Structure (final state)

```
src/components/color/
├── ColorPicker.tsx              (rewrite, slimmed to ~250 lines)
├── ColorColumn.tsx              (existing, minor updates)
├── ColorDetailPanel.tsx         (rewrite, slimmed to ~250 lines)
├── ConversionGrid.tsx           (new, extracted from ColorDetailPanel)
├── HarmonyGrid.tsx              (new, extracted from ColorDetailPanel)
├── ShadeGrid.tsx                (new, extracted from ColorDetailPanel)
├── ColorPickerModal.tsx         (new, replaces ColorEditor.tsx)
├── HslWheelPicker.tsx           (new)
├── HsvSquarePicker.tsx          (new)
├── RgbWheelPicker.tsx           (new)
├── DirectInputPicker.tsx        (new)
├── ImageExtractorModal.tsx      (new)
├── GradientEditor.tsx           (new)
├── GradientPreview.tsx          (new)
├── GradientBar.tsx              (new)
├── GradientControls.tsx         (new)
├── GradientOutput.tsx           (new)
├── PalettesDrawer.tsx           (new)
├── AdjustDialog.tsx             (existing, no changes)
├── ContrastChecker.tsx          (existing, no changes)
├── HarmonySelector.tsx          (existing, no changes)
├── ColorBlindnessView.tsx       (existing, no changes)
├── ExportDialog.tsx             (existing, no changes)
├── PaletteToolbar.tsx           (existing, add new buttons)
├── colorStore.ts                (new, IndexedDB)
├── useColorStore.ts             (new, React hook)
├── useColorHistory.ts           (new, extracted hook)
├── useColorNames.ts             (new, extracted hook)
├── usePaletteDrag.ts            (new, extracted hook)
├── colorTypes.ts                (new, consolidated types)
├── colorExtractor.ts            (new, k-means extraction)
├── gradientUtils.ts             (new, CSS/Tailwind/SVG generation)
├── gradientPresets.ts           (new)
├── presets.ts                   (existing, no changes)
└── ColorEditor.tsx              (deleted, replaced by ColorPickerModal)
```

**Total: 34 files** (up from 11, but each focused and manageable)

---

## Dependencies

**New:** None — `idb` already installed from API builder overhaul.

**Existing (no changes):**
- `html-to-image` — PNG export
- `jspdf` — PDF export
- `lucide-react` — icons
- All shared infrastructure hooks/components
- `colorUtils.ts` and `colorApi.ts` in existing utils — unchanged

---

## Migration Notes

- `ColorEditor.tsx` is deleted and replaced by `ColorPickerModal.tsx`
- Types currently in `@/types/color` are moved to `src/components/color/colorTypes.ts` for colocation. Update imports across ALL color component files that reference `@/types/color`.
- The gradient easing applies CSS color interpolation hints between each stop pair using midpoint positioning (e.g., `linear-gradient(90deg, #ff0000, 25%, #00ff00)` for ease-in effect). This is a visual approximation, not true bezier easing.
- The existing `presets.ts` stays as-is — gradient presets go in `gradientPresets.ts`
- PaletteToolbar gets 3 new buttons: Palettes (FolderIcon), Extract (ImageIcon), Gradient mode toggle
- The gradient mode is a toggle on the main ColorPicker — when active, it hides the palette columns and shows GradientEditor instead
