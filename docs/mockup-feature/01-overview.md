# Device Mockup Feature — Overview & Architecture

## Goal

Add a **"Mockup"** tab to kutu-tree that lets users:

1. Upload a screenshot or image (PNG, JPG, WebP)
2. Pick a device frame (iPhone, iPad, Samsung, MacBook, etc.)
3. See the image rendered inside the chosen device in real-time
4. Optionally apply 3D perspective transforms and background customization
5. Export the final composited mockup as a high-resolution PNG

---

## Why This Approach

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **CSS device frames** (devices.css, css-device-frames) | Easy to set up, responsive | Hard to export as image, limited device accuracy | Good for preview, bad for export |
| **SVG device frames** | Resolution-independent, customizable | Complex to build, foreignObject quirks | Medium effort |
| **PNG frame overlay + Canvas compositing** | Pixel-perfect output, easy export, matches real devices | Requires PNG assets per device | **Best for export quality** |
| **Hybrid: CSS preview + Canvas export** | Best of both worlds | Slightly more code | **Recommended** |

### Chosen Architecture: **Hybrid CSS Preview + Canvas Export**

- **Interactive preview**: CSS-based device frame using `<div>` with styled bezels, notch, and rounded corners. The uploaded image is placed inside via `<img>` with `object-fit: cover`.
- **Export pipeline**: When the user clicks "Export", a hidden `<canvas>` composites the uploaded image at the correct screen coordinates, then overlays a high-res PNG device frame on top, and triggers download via `canvas.toBlob()`.

This mirrors the existing patterns in the codebase (BoardEditor uses Canvas for export, color palette uses html-to-image).

---

## Feature Scope

### Phase 1 — Core (MVP)

- [ ] Image upload via drag-and-drop or file picker
- [ ] Device selector with categories (Phone, Tablet, Laptop)
- [ ] Live preview of image inside CSS device frame
- [ ] Single device export as PNG (1x and 2x resolution)
- [ ] Background color picker (solid color behind device)

### Phase 2 — Enhancements

- [ ] 3D perspective rotation (rotateX, rotateY sliders)
- [ ] Shadow and reflection effects
- [ ] Gradient and image backgrounds
- [ ] Multiple export formats (PNG, JPG, WebP)
- [ ] Preset scene layouts (e.g., "floating", "flat lay", "isometric")

### Phase 3 — Advanced

- [ ] Multi-device compositions (e.g., iPhone + MacBook side by side)
- [ ] Device color variants (Space Black, Silver, Gold)
- [ ] Custom frame upload
- [ ] Batch export (upload multiple images, get multiple mockups)

---

## Tech Stack Alignment

| Concern | Existing Pattern | Mockup Implementation |
|---------|-----------------|----------------------|
| UI Components | shadcn + Tailwind + CVA | Same — reuse Button, Select, Dialog, Slider |
| File Upload | Hidden `<input type="file">` with ref | Same + drag-and-drop zone |
| Canvas Rendering | `boardEngine.ts` uses Canvas API | Same pattern in `mockupEngine.ts` |
| Image Export | `html-to-image` + `canvas.toBlob()` | Canvas compositing + `toBlob()` |
| State Management | React `useState` + refs | Same — no new libraries needed |
| Types | TypeScript interfaces in `src/types/` | New `src/types/mockup.ts` |

**No new dependencies required** — everything can be built with the existing stack.

---

## File Structure (Planned)

```
src/
├── components/
│   └── mockup/
│       ├── MockupEditor.tsx        # Main container component
│       ├── DeviceSelector.tsx       # Device category + model picker
│       ├── DevicePreview.tsx        # CSS-based live preview
│       ├── ImageUploader.tsx        # Drag-and-drop + file picker
│       ├── MockupToolbar.tsx        # Export, background, perspective controls
│       └── BackgroundPicker.tsx     # Color/gradient background selector
├── types/
│   └── mockup.ts                   # Device specs, mockup state types
├── utils/
│   └── mockupEngine.ts             # Canvas compositing + export logic
└── assets/
    └── devices/                    # PNG device frame overlays (for export)
        ├── iphone-16-pro.png
        ├── ipad-pro-13.png
        ├── macbook-pro-16.png
        └── ...
```

---

## Navigation Integration

Add to `NAV_ITEMS` in `App.tsx`:

```typescript
{ value: "mockup", label: "Mockup" }
```

Add corresponding `<TabsContent value="mockup">` with `<MockupEditor />`.

---

## Next Steps

See the following companion documents:

1. **[02-device-specifications.md](./02-device-specifications.md)** — Complete device catalog with dimensions, screen regions, and CSS styling values
2. **[03-component-architecture.md](./03-component-architecture.md)** — Detailed component breakdown, props, state, and interactions
3. **[04-implementation-guide.md](./04-implementation-guide.md)** — Step-by-step coding guide with code snippets for each phase
