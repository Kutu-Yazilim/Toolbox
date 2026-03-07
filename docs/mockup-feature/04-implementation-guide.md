# Step-by-Step Implementation Guide

Follow these steps in order. Each step is self-contained and results in a working (if incomplete) feature.

---

## Step 1: Types & Device Catalog

**Files to create**: `src/types/mockup.ts`

Define all TypeScript interfaces and the device catalog array.

```typescript
// src/types/mockup.ts

export interface DeviceScreen {
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius: number;
}

export interface DeviceFrame {
  width: number;
  height: number;
}

export interface DeviceResolution {
  width: number;
  height: number;
  pixelRatio: number;
}

export interface DeviceStyle {
  bezelColor: string;
  bezelWidth: { top: number; right: number; bottom: number; left: number };
  borderRadius: number;
  hasNotch: boolean;
  hasDynamicIsland: boolean;
  hasHomeButton: boolean;
}

export interface DeviceColorVariant {
  name: string;
  color: string;
}

export type DeviceCategory = "phone" | "tablet" | "laptop";
export type DeviceBrand = "apple" | "samsung" | "google";

export interface DeviceSpec {
  id: string;
  name: string;
  brand: DeviceBrand;
  category: DeviceCategory;
  frame: DeviceFrame;
  screen: DeviceScreen;
  resolution: DeviceResolution;
  style: DeviceStyle;
  colorVariants: DeviceColorVariant[];
}

export interface MockupBackground {
  type: "solid" | "gradient" | "transparent";
  color: string;
  gradientFrom: string;
  gradientTo: string;
  gradientAngle: number;
}

export interface MockupTransform {
  perspective: number;
  rotateX: number;
  rotateY: number;
}

export type Orientation = "portrait" | "landscape";
export type ExportScale = 1 | 2 | 3;
```

Then define the `DEVICE_CATALOG: DeviceSpec[]` array with all devices from **02-device-specifications.md**. Start with 3–5 key devices:

1. `iphone-16-pro` — most requested phone mockup
2. `galaxy-s24` — key Android representative
3. `ipad-pro-13` — tablet
4. `macbook-pro-16` — laptop
5. `iphone-se` — home button variant

Expand the catalog later.

**Validation**: Import the types in a test file or just ensure `tsc` compiles without errors.

---

## Step 2: Navigation Integration

**File to modify**: `src/App.tsx`

1. Add `{ value: "mockup", label: "Mockup" }` to `NAV_ITEMS` array
2. Add `<TabsContent value="mockup"><MockupEditor /></TabsContent>`
3. Create a placeholder `MockupEditor` that just renders "Mockup Editor — Coming Soon"

**Validation**: Run the app, see the new "Mockup" tab, click it, see the placeholder.

---

## Step 3: Image Uploader Component

**File to create**: `src/components/mockup/ImageUploader.tsx`

Build the drag-and-drop upload zone:

```typescript
// Key implementation points:

// 1. useRef for hidden file input
const fileInputRef = useRef<HTMLInputElement>(null);

// 2. Drag-and-drop handlers
const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  setIsDragOver(true);
};

const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  setIsDragOver(false);
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) {
    processFile(file);
  }
};

// 3. File processing
const processFile = (file: File) => {
  if (file.size > 20 * 1024 * 1024) {
    // Show error: file too large
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string;
    const img = new Image();
    img.onload = () => {
      onImageUpload(dataUrl, { w: img.naturalWidth, h: img.naturalHeight });
    };
    img.src = dataUrl;
  };
  reader.readAsDataURL(file);
};

// 4. Clipboard paste support
useEffect(() => {
  const handlePaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) processFile(file);
      }
    }
  };
  document.addEventListener("paste", handlePaste);
  return () => document.removeEventListener("paste", handlePaste);
}, []);
```

**Validation**: Upload an image via drag-and-drop, file picker, and clipboard paste. Confirm `onImageUpload` is called with correct data URL and dimensions.

---

## Step 4: Device Frame CSS Component

**File to create**: `src/components/mockup/DeviceFrame.tsx`

Build the CSS-only device frame renderer:

```typescript
// Core idea: a wrapper div styled to look like the device

interface DeviceFrameProps {
  device: DeviceSpec;
  orientation: Orientation;
  colorVariant: string;
  children: React.ReactNode;  // The image goes here
}

export function DeviceFrame({ device, orientation, colorVariant, children }: DeviceFrameProps) {
  // Swap dimensions for landscape
  const isLandscape = orientation === "landscape";
  const frameW = isLandscape ? device.frame.height : device.frame.width;
  const frameH = isLandscape ? device.frame.width : device.frame.height;
  const screenX = isLandscape ? device.screen.y : device.screen.x;
  const screenY = isLandscape ? device.screen.x : device.screen.y;
  const screenW = isLandscape ? device.screen.height : device.screen.width;
  const screenH = isLandscape ? device.screen.width : device.screen.height;

  return (
    <div
      className="relative"
      style={{ width: frameW, height: frameH }}
    >
      {/* Outer bezel */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          border: `${device.style.bezelWidth.top}px solid ${colorVariant}`,
          borderRadius: device.style.borderRadius,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.1)",
        }}
      />

      {/* Dynamic Island / Notch */}
      {device.style.hasDynamicIsland && (
        <div className="absolute z-20" style={{
          top: device.style.bezelWidth.top - 2,
          left: "50%",
          transform: "translateX(-50%)",
          width: isLandscape ? 36 : 120,
          height: isLandscape ? 120 : 36,
          background: colorVariant,
          borderRadius: 20,
        }} />
      )}

      {/* Screen area */}
      <div
        className="absolute overflow-hidden bg-black"
        style={{
          top: screenY,
          left: screenX,
          width: screenW,
          height: screenH,
          borderRadius: device.screen.borderRadius,
        }}
      >
        {children}
      </div>

      {/* MacBook base (for laptop category) */}
      {device.category === "laptop" && (
        <>
          <div style={{
            position: "absolute",
            bottom: -14,
            left: -10,
            right: -10,
            height: 14,
            background: "linear-gradient(to bottom, #c0c0c0, #a0a0a0)",
            borderRadius: "0 0 4px 4px",
          }} />
          <div style={{
            position: "absolute",
            bottom: -22,
            left: -30,
            right: -30,
            height: 8,
            background: "#d0d0d0",
            borderRadius: "0 0 8px 8px",
          }} />
        </>
      )}
    </div>
  );
}
```

**Validation**: Render the frame with a static test image. Verify it looks like a device.

---

## Step 5: Device Preview (Main Preview Area)

**File to create**: `src/components/mockup/DevicePreview.tsx`

Combine background, 3D transforms, device frame, and image:

```typescript
// Key structure:
<div
  className="flex-1 flex items-center justify-center overflow-hidden relative"
  style={{ background: computedBackground }}
>
  <div style={{
    perspective: `${transform.perspective}px`,
    transformStyle: "preserve-3d",
  }}>
    <div style={{
      transform: `rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg)`,
      transition: "transform 0.3s ease",
    }}>
      <DeviceFrame device={device} orientation={orientation} colorVariant={colorVariant}>
        {image ? (
          <img
            src={image}
            className="w-full h-full object-cover"
            style={{
              transform: `scale(${imageScale}) translate(${offsetX}px, ${offsetY}px)`,
            }}
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900
                          flex items-center justify-center text-white/30 text-sm">
            Upload an image
          </div>
        )}
      </DeviceFrame>
    </div>
  </div>
</div>
```

**Auto-scaling**: The device frame should scale to fit its container. Use a `useEffect` + `ResizeObserver` to compute a CSS `scale()` factor:

```typescript
const containerRef = useRef<HTMLDivElement>(null);
const [scaleFactor, setScaleFactor] = useState(1);

useEffect(() => {
  const observer = new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    const padding = 80; // breathing room
    const scaleX = (width - padding) / frameWidth;
    const scaleY = (height - padding) / frameHeight;
    setScaleFactor(Math.min(scaleX, scaleY, 1));
  });
  if (containerRef.current) observer.observe(containerRef.current);
  return () => observer.disconnect();
}, [frameWidth, frameHeight]);
```

**Validation**: See the device frame centered in the preview area, auto-scaled to fit. Image displays correctly inside.

---

## Step 6: Device Selector Panel

**File to create**: `src/components/mockup/DeviceSelectorPanel.tsx`

Implement the sidebar with device categories and selection:

```typescript
// Group devices by category
const phoneDevices = DEVICE_CATALOG.filter(d => d.category === "phone");
const tabletDevices = DEVICE_CATALOG.filter(d => d.category === "tablet");
const laptopDevices = DEVICE_CATALOG.filter(d => d.category === "laptop");

// Render as tabs with grid of device cards
<Tabs defaultValue="phone">
  <TabsList>
    <TabsTrigger value="phone">Phone</TabsTrigger>
    <TabsTrigger value="tablet">Tablet</TabsTrigger>
    <TabsTrigger value="laptop">Laptop</TabsTrigger>
  </TabsList>

  <TabsContent value="phone">
    <div className="grid grid-cols-2 gap-2">
      {phoneDevices.map(device => (
        <DeviceCard
          key={device.id}
          device={device}
          isSelected={device.id === selectedDeviceId}
          onClick={() => onDeviceChange(device.id)}
        />
      ))}
    </div>
  </TabsContent>
  {/* ... tablet, laptop tabs ... */}
</Tabs>
```

**DeviceCard**: A small clickable card showing a mini version of the device shape:

```typescript
function DeviceCard({ device, isSelected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-3 rounded-lg border text-center transition-colors",
        isSelected
          ? "border-primary bg-primary/10"
          : "border-border hover:border-primary/50"
      )}
    >
      {/* Mini device preview — simplified rectangle */}
      <div className="mx-auto mb-2" style={{
        width: device.frame.width * 0.1,
        height: device.frame.height * 0.1,
        border: "2px solid currentColor",
        borderRadius: device.style.borderRadius * 0.1,
      }} />
      <span className="text-xs">{device.name}</span>
    </button>
  );
}
```

**Orientation toggle** and **Color variant picker** go below the device grid.

**Validation**: Click through devices, see preview update. Toggle orientation.

---

## Step 7: Toolbar & Background Picker

**Files to create**:
- `src/components/mockup/MockupToolbar.tsx`
- `src/components/mockup/BackgroundPicker.tsx`

### MockupToolbar

Perspective and rotation sliders using shadcn `<Slider>`:

```typescript
<div className="flex items-center gap-4">
  <Label className="text-xs w-16">Rotate X</Label>
  <Slider
    min={-30} max={30} step={1}
    value={[rotateX]}
    onValueChange={([v]) => onTransformChange({ rotateX: v })}
  />
  <span className="text-xs w-8 text-right">{rotateX}°</span>
</div>
```

Export button with scale selector:

```typescript
<div className="flex items-center gap-2">
  <Select value={String(exportScale)} onValueChange={v => onExportScaleChange(Number(v))}>
    <SelectTrigger className="w-16">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="1">1x</SelectItem>
      <SelectItem value="2">2x</SelectItem>
      <SelectItem value="3">3x</SelectItem>
    </SelectContent>
  </Select>
  <Button onClick={onExport} disabled={!hasImage || isExporting}>
    <Download className="h-4 w-4 mr-2" />
    Export PNG
  </Button>
</div>
```

### BackgroundPicker

Preset color swatches + custom color input:

```typescript
const PRESETS = [
  { name: "White", value: "#ffffff" },
  { name: "Black", value: "#000000" },
  { name: "Light Gray", value: "#f5f5f5" },
  { name: "Gradient Blue", value: "gradient", from: "#667eea", to: "#764ba2" },
  // ... more presets
];
```

**Validation**: Sliders work. Background changes. Export button is present.

---

## Step 8: Export Engine (Canvas Compositing)

**File to create**: `src/utils/mockupEngine.ts`

This is the core export logic:

```typescript
export interface ExportOptions {
  image: string;                   // Data URL
  device: DeviceSpec;
  orientation: Orientation;
  colorVariant: string;
  background: MockupBackground;
  transform: MockupTransform;
  exportScale: ExportScale;
}

export async function exportMockup(options: ExportOptions): Promise<Blob> {
  const { image, device, orientation, colorVariant, background, exportScale } = options;

  // 1. Calculate dimensions
  const isLandscape = orientation === "landscape";
  const frameW = isLandscape ? device.frame.height : device.frame.width;
  const frameH = isLandscape ? device.frame.width : device.frame.height;

  // Add padding around device
  const padding = 60;
  const canvasW = (frameW + padding * 2) * exportScale;
  const canvasH = (frameH + padding * 2) * exportScale;

  // 2. Create canvas
  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(exportScale, exportScale);

  // 3. Draw background
  if (background.type === "solid") {
    ctx.fillStyle = background.color;
    ctx.fillRect(0, 0, frameW + padding * 2, frameH + padding * 2);
  } else if (background.type === "gradient") {
    const angle = background.gradientAngle * (Math.PI / 180);
    const grad = ctx.createLinearGradient(
      0, 0,
      Math.cos(angle) * (frameW + padding * 2),
      Math.sin(angle) * (frameH + padding * 2)
    );
    grad.addColorStop(0, background.gradientFrom);
    grad.addColorStop(1, background.gradientTo);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, frameW + padding * 2, frameH + padding * 2);
  }

  // 4. Load user image
  const userImg = await loadImage(image);

  // 5. Calculate screen region
  const screenX = padding + (isLandscape ? device.screen.y : device.screen.x);
  const screenY = padding + (isLandscape ? device.screen.x : device.screen.y);
  const screenW = isLandscape ? device.screen.height : device.screen.width;
  const screenH = isLandscape ? device.screen.width : device.screen.height;

  // 6. Draw user image into screen area (cover fit)
  ctx.save();
  roundedRect(ctx, screenX, screenY, screenW, screenH, device.screen.borderRadius);
  ctx.clip();
  drawCover(ctx, userImg, screenX, screenY, screenW, screenH);
  ctx.restore();

  // 7. Draw device bezel
  drawDeviceBezel(ctx, device, padding, padding, frameW, frameH, colorVariant, isLandscape);

  // 8. Draw shadow under device
  // (drawn before device if using separate layering)

  // 9. Export
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/png");
  });
}

// Helper: load image from data URL
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Helper: draw image with cover behavior
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number, w: number, h: number
) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const areaRatio = w / h;

  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;

  if (imgRatio > areaRatio) {
    // Image is wider — crop sides
    sw = img.naturalHeight * areaRatio;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    // Image is taller — crop top/bottom
    sh = img.naturalWidth / areaRatio;
    sy = (img.naturalHeight - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

// Helper: rounded rectangle path
function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Trigger download
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

**Validation**: Upload image → select device → click Export → PNG downloads with device frame around the image.

---

## Step 9: MockupEditor (Wire Everything Together)

**File to create**: `src/components/mockup/MockupEditor.tsx`

```typescript
export function MockupEditor() {
  // State
  const [image, setImage] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<{ w: number; h: number } | null>(null);
  const [deviceId, setDeviceId] = useState("iphone-16-pro");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [colorVariant, setColorVariant] = useState("#1a1a1a");
  const [background, setBackground] = useState<MockupBackground>({
    type: "solid", color: "#f5f5f5",
    gradientFrom: "#667eea", gradientTo: "#764ba2", gradientAngle: 135,
  });
  const [transform, setTransform] = useState<MockupTransform>({
    perspective: 1200, rotateX: 0, rotateY: 0,
  });
  const [exportScale, setExportScale] = useState<ExportScale>(2);
  const [isExporting, setIsExporting] = useState(false);

  const device = DEVICE_CATALOG.find(d => d.id === deviceId)!;

  const handleExport = async () => {
    if (!image) return;
    setIsExporting(true);
    try {
      const blob = await exportMockup({
        image, device, orientation, colorVariant,
        background, transform, exportScale,
      });
      downloadBlob(blob, `mockup-${device.id}.png`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <MockupToolbar ... />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          {image ? (
            <DevicePreview ... />
          ) : (
            <ImageUploader onImageUpload={(url, size) => {
              setImage(url);
              setImageSize(size);
            }} />
          )}
        </div>
        <div className="w-72 border-l overflow-y-auto p-4 space-y-4">
          <DeviceSelectorPanel ... />
          <BackgroundPicker ... />
        </div>
      </div>
    </div>
  );
}
```

**Validation**: Full flow works — upload → select device → adjust → export.

---

## Step 10: Polish & Edge Cases

1. **Empty state**: Show a welcoming upload area when no image is loaded
2. **Loading state**: Show spinner during export
3. **Error handling**: Toast for invalid files, export failures
4. **Dark mode**: Ensure all controls respect the existing dark mode theme
5. **Performance**: Debounce slider changes, lazy-load device catalog
6. **Accessibility**: Keyboard navigation, ARIA labels on device cards
7. **Mobile layout**: Stack sidebar below preview on small screens

---

## Implementation Order Summary

| Step | What | Estimated Effort | Dependency |
|------|------|-----------------|------------|
| 1 | Types & Device Catalog | Small | None |
| 2 | Navigation Integration | Tiny | None |
| 3 | ImageUploader | Small | Step 1 |
| 4 | DeviceFrame CSS | Medium | Step 1 |
| 5 | DevicePreview | Medium | Steps 3, 4 |
| 6 | DeviceSelectorPanel | Small | Step 1 |
| 7 | Toolbar & BackgroundPicker | Small | None |
| 8 | Export Engine | Medium | Step 1 |
| 9 | MockupEditor (wire up) | Medium | Steps 2–8 |
| 10 | Polish & Edge Cases | Small | Step 9 |

Steps 1–2 can be done first. Then Steps 3, 4, 6, 7, 8 can be done in parallel. Step 5 depends on 3+4. Step 9 wires everything together. Step 10 is final polish.
