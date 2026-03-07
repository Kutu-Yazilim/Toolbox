# Component Architecture

This document describes each component, its responsibilities, props, state, and how they interact.

---

## Component Tree

```
App.tsx
└── <TabsContent value="mockup">
    └── MockupEditor
        ├── MockupToolbar          (top bar: export, undo, settings)
        ├── ImageUploader           (drag-and-drop zone, shown when no image)
        ├── DevicePreview           (main canvas area — shows device + image)
        │   └── DeviceFrame         (CSS device frame wrapper)
        │       └── <img>           (user's uploaded image)
        ├── DeviceSelectorPanel     (right sidebar)
        │   ├── CategoryTabs        (Phone | Tablet | Laptop)
        │   ├── DeviceList          (grid of device thumbnails)
        │   └── DeviceOptions       (orientation, color variant)
        └── BackgroundPicker        (background color/gradient controls)
```

---

## Component Specifications

### 1. MockupEditor (Main Container)

**File**: `src/components/mockup/MockupEditor.tsx`

**Responsibility**: Top-level state owner. Orchestrates all child components.

**State**:

```typescript
interface MockupState {
  // Image
  uploadedImage: string | null;        // Data URL of uploaded image
  imageNaturalSize: { w: number; h: number } | null;

  // Device
  selectedDeviceId: string;            // e.g., "iphone-16-pro"
  orientation: "portrait" | "landscape";
  colorVariant: string;                // Bezel color hex

  // Background
  backgroundColor: string;            // Hex color
  backgroundType: "solid" | "gradient";
  gradientFrom: string;
  gradientTo: string;
  gradientAngle: number;

  // Transform
  perspective: number;                 // 800–2000, default 1200
  rotateX: number;                     // -30 to 30, default 0
  rotateY: number;                     // -30 to 30, default 0

  // Image positioning within frame
  imageScale: number;                  // 1.0 = cover fit, adjustable
  imageOffsetX: number;               // Pan offset
  imageOffsetY: number;

  // Export
  isExporting: boolean;
  exportScale: 1 | 2 | 3;            // Pixel ratio for export
}
```

**Key handlers**:

```typescript
handleImageUpload(file: File): void
handleDeviceChange(deviceId: string): void
handleOrientationToggle(): void
handleExport(): Promise<void>
handleBackgroundChange(bg: Partial<BackgroundState>): void
handleTransformChange(transform: Partial<TransformState>): void
handleImageReposition(dx: number, dy: number): void
```

**Layout**: Flexbox — toolbar on top, main preview area center, sidebar on right.

```
┌─────────────────────────────────────────────┐
│  MockupToolbar                              │
├───────────────────────────────┬──────────────┤
│                               │ Device       │
│                               │ Selector     │
│     DevicePreview             │ Panel        │
│     (or ImageUploader         │              │
│      if no image)             │──────────────│
│                               │ Background   │
│                               │ Picker       │
│                               │              │
├───────────────────────────────┴──────────────┤
│  (status bar / image info)                   │
└─────────────────────────────────────────────┘
```

---

### 2. ImageUploader

**File**: `src/components/mockup/ImageUploader.tsx`

**Responsibility**: Handle image upload via drag-and-drop or file picker. Shown as an overlay/placeholder when no image is loaded.

**Props**:

```typescript
interface ImageUploaderProps {
  onImageUpload: (dataUrl: string, naturalSize: { w: number; h: number }) => void;
}
```

**Behavior**:

1. Render a dashed-border drop zone with an upload icon and "Drop image here or click to browse" text
2. Accept `image/png`, `image/jpeg`, `image/webp`
3. On file select/drop:
   - Validate file type and size (max 20 MB)
   - Read as Data URL via `FileReader.readAsDataURL()`
   - Load into a hidden `<img>` to get `naturalWidth` / `naturalHeight`
   - Call `onImageUpload(dataUrl, { w, h })`
4. Show preview thumbnail after upload with a "Replace" button
5. Support paste from clipboard (`document.addEventListener('paste', ...)`)

**UI Pattern** (matches existing codebase style):

```tsx
<div
  className="border-2 border-dashed border-muted-foreground/25 rounded-lg
             flex flex-col items-center justify-center gap-4 p-8
             hover:border-muted-foreground/50 transition-colors cursor-pointer"
  onDragOver={handleDragOver}
  onDrop={handleDrop}
  onClick={() => fileInputRef.current?.click()}
>
  <Upload className="h-12 w-12 text-muted-foreground/50" />
  <p className="text-muted-foreground text-sm">
    Drop image here or click to browse
  </p>
  <p className="text-muted-foreground/50 text-xs">
    PNG, JPG, WebP — max 20 MB
  </p>
  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" />
</div>
```

---

### 3. DevicePreview

**File**: `src/components/mockup/DevicePreview.tsx`

**Responsibility**: Render the live preview of the device frame with the user's image inside. This is the main visual area.

**Props**:

```typescript
interface DevicePreviewProps {
  device: DeviceSpec;
  image: string | null;
  orientation: "portrait" | "landscape";
  colorVariant: string;
  backgroundColor: string;
  backgroundType: "solid" | "gradient";
  gradientFrom: string;
  gradientTo: string;
  gradientAngle: number;
  perspective: number;
  rotateX: number;
  rotateY: number;
  imageScale: number;
  imageOffsetX: number;
  imageOffsetY: number;
  onImageReposition: (dx: number, dy: number) => void;
}
```

**Rendering Strategy**:

```tsx
<div className="flex-1 flex items-center justify-center overflow-hidden"
     style={{ background }}>
  <div style={{
    perspective: `${perspective}px`,
    transformStyle: "preserve-3d",
  }}>
    <div
      className="relative"
      style={{
        width: frameWidth,
        height: frameHeight,
        transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transition: "transform 0.3s ease",
      }}
    >
      {/* Device bezel */}
      <div
        className="absolute inset-0 rounded-[var(--radius)] pointer-events-none z-10"
        style={{
          border: `${bezelWidth}px solid ${colorVariant}`,
          borderRadius: device.style.borderRadius,
        }}
      />

      {/* Notch / Dynamic Island */}
      {device.style.hasDynamicIsland && <DynamicIsland color={colorVariant} />}
      {device.style.hasNotch && <Notch color={colorVariant} />}

      {/* Screen area with user image */}
      <div
        className="absolute overflow-hidden"
        style={{
          top: screen.y, left: screen.x,
          width: screen.width, height: screen.height,
          borderRadius: screen.borderRadius,
        }}
      >
        {image && (
          <img
            src={image}
            className="w-full h-full"
            style={{
              objectFit: "cover",
              transform: `scale(${imageScale}) translate(${imageOffsetX}px, ${imageOffsetY}px)`,
            }}
            draggable={false}
          />
        )}
      </div>
    </div>
  </div>
</div>
```

**Image Dragging**: Attach `onMouseDown`/`onMouseMove`/`onMouseUp` to the screen area `<div>` to allow repositioning the image within the frame.

---

### 4. DeviceSelectorPanel

**File**: `src/components/mockup/DeviceSelectorPanel.tsx`

**Responsibility**: Let the user browse and select a device.

**Props**:

```typescript
interface DeviceSelectorPanelProps {
  selectedDeviceId: string;
  orientation: "portrait" | "landscape";
  colorVariant: string;
  onDeviceChange: (deviceId: string) => void;
  onOrientationToggle: () => void;
  onColorVariantChange: (color: string) => void;
}
```

**Layout**:

```
┌──────────────────────────┐
│ [Phone] [Tablet] [Laptop]│  ← Category tabs
├──────────────────────────┤
│ ┌──────┐ ┌──────┐       │
│ │📱    │ │📱    │       │  ← Device grid (mini previews)
│ │iPhone│ │iPhone│       │
│ │16 Pro│ │  16  │       │
│ └──────┘ └──────┘       │
│ ┌──────┐ ┌──────┐       │
│ │📱    │ │📱    │       │
│ │  15  │ │ SE   │       │
│ └──────┘ └──────┘       │
├──────────────────────────┤
│ Orientation: [🔄 Toggle] │
│ Color: ● ● ● ●          │  ← Color variant dots
└──────────────────────────┘
```

**Device Grid Items**: Each device shown as a small CSS frame thumbnail (simplified — just a rounded rect with the device name).

---

### 5. MockupToolbar

**File**: `src/components/mockup/MockupToolbar.tsx`

**Responsibility**: Top bar with export controls, perspective sliders, and image actions.

**Props**:

```typescript
interface MockupToolbarProps {
  hasImage: boolean;
  perspective: number;
  rotateX: number;
  rotateY: number;
  exportScale: 1 | 2 | 3;
  isExporting: boolean;
  onExport: () => void;
  onTransformChange: (t: Partial<TransformState>) => void;
  onExportScaleChange: (scale: 1 | 2 | 3) => void;
  onReplaceImage: () => void;
  onRemoveImage: () => void;
  onResetTransform: () => void;
}
```

**Layout**:

```
┌──────────────────────────────────────────────────────────────┐
│ [Replace Image] [Remove]  │  Perspective ═══●═══  │ [Export ↓] │
│                           │  Rotate X ═══●═══     │ [1x][2x]  │
│                           │  Rotate Y ═══●═══     │ [3x]      │
│                           │  [Reset]               │           │
└──────────────────────────────────────────────────────────────┘
```

Uses shadcn `<Button>`, `<Slider>`, `<Select>`.

---

### 6. BackgroundPicker

**File**: `src/components/mockup/BackgroundPicker.tsx`

**Responsibility**: Let the user customize the background behind the device.

**Props**:

```typescript
interface BackgroundPickerProps {
  backgroundColor: string;
  backgroundType: "solid" | "gradient";
  gradientFrom: string;
  gradientTo: string;
  gradientAngle: number;
  onChange: (bg: Partial<BackgroundState>) => void;
}
```

**Features**:

- Solid color picker (reuse pattern from existing color tool)
- Preset colors (White, Black, Light Gray, common blues/purples)
- Gradient mode with two color stops and angle slider
- Transparent background option (checkerboard pattern)

---

## Data Flow

```
User uploads image
       │
       ▼
ImageUploader ──onImageUpload──► MockupEditor (state update)
                                       │
                                       ▼
                              DevicePreview re-renders
                              (shows image in device frame)

User selects device
       │
       ▼
DeviceSelectorPanel ──onDeviceChange──► MockupEditor
                                              │
                                              ▼
                                    Look up DeviceSpec from catalog
                                    Update preview dimensions

User clicks Export
       │
       ▼
MockupEditor.handleExport()
       │
       ▼
mockupEngine.compositeAndExport({
  image, device, orientation, colorVariant,
  background, transform, exportScale
})
       │
       ▼
Canvas API: draw background → draw image → draw device frame
       │
       ▼
canvas.toBlob() → URL.createObjectURL() → <a>.click() → download
```

---

## Responsive Design

| Viewport | Layout |
|----------|--------|
| Desktop (≥1024px) | Sidebar visible, full toolbar |
| Tablet (768–1023px) | Sidebar as collapsible drawer |
| Mobile (<768px) | Sidebar as bottom sheet, toolbar condensed |

The preview area should auto-scale the device frame to fit the available space using CSS `transform: scale()` with `transform-origin: center`.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+V` / `Cmd+V` | Paste image from clipboard |
| `Ctrl+E` / `Cmd+E` | Export mockup |
| `R` | Reset perspective/rotation |
| `O` | Toggle orientation |
| `←` `→` `↑` `↓` | Nudge image position (1px) |
| `Shift + arrows` | Nudge image position (10px) |
