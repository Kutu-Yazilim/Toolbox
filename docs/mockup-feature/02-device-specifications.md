# Device Specifications Reference

This document defines every supported device, its physical dimensions, screen area coordinates, and the CSS values needed for the preview frame.

---

## Device Data Model

Each device entry in the catalog follows this TypeScript interface (defined in `src/types/mockup.ts`):

```typescript
interface DeviceSpec {
  id: string;                    // e.g., "iphone-16-pro"
  name: string;                  // e.g., "iPhone 16 Pro"
  brand: "apple" | "samsung" | "google";
  category: "phone" | "tablet" | "laptop";

  // Physical frame dimensions (in logical CSS pixels for preview)
  frame: {
    width: number;               // Total frame width including bezels
    height: number;              // Total frame height including bezels
  };

  // Screen area within the frame (for image placement)
  screen: {
    x: number;                   // Left offset from frame edge
    y: number;                   // Top offset from frame edge
    width: number;               // Screen width
    height: number;              // Screen height
    borderRadius: number;        // Screen corner radius
  };

  // Native resolution (for high-res export)
  resolution: {
    width: number;               // Native pixel width
    height: number;              // Native pixel height
    pixelRatio: number;          // Device pixel ratio (2x, 3x)
  };

  // CSS preview styling
  style: {
    bezelColor: string;          // e.g., "#1a1a1a" for Space Black
    bezelWidth: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    borderRadius: number;        // Outer frame corner radius
    hasNotch: boolean;
    hasDynamicIsland: boolean;
    hasHomeButton: boolean;
  };
}
```

---

## Phone Devices

### Apple iPhone

| ID | Name | Frame (px) | Screen Region | Native Res | Ratio | Notable |
|----|------|-----------|---------------|------------|-------|---------|
| `iphone-16-pro-max` | iPhone 16 Pro Max | 290 × 600 | x:12, y:12, w:266, h:576 | 1320 × 2868 | 3x | Dynamic Island |
| `iphone-16-pro` | iPhone 16 Pro | 270 × 564 | x:12, y:12, w:246, h:540 | 1206 × 2622 | 3x | Dynamic Island |
| `iphone-16` | iPhone 16 | 260 × 540 | x:12, y:12, w:236, h:516 | 1179 × 2556 | 3x | Dynamic Island |
| `iphone-15-pro` | iPhone 15 Pro | 270 × 564 | x:12, y:12, w:246, h:540 | 1179 × 2556 | 3x | Dynamic Island |
| `iphone-15` | iPhone 15 | 260 × 540 | x:12, y:12, w:236, h:516 | 1179 × 2556 | 3x | Dynamic Island |
| `iphone-14` | iPhone 14 | 260 × 540 | x:12, y:12, w:236, h:516 | 1170 × 2532 | 3x | Notch |
| `iphone-se` | iPhone SE (3rd gen) | 250 × 510 | x:14, y:60, w:222, h:390 | 750 × 1334 | 2x | Home Button |

**CSS Preview Values for Modern iPhones (Dynamic Island):**

```css
.device-iphone-modern {
  border-radius: 44px;
  border: 12px solid #1a1a1a;
  position: relative;
}

.device-iphone-modern::before {
  /* Dynamic Island */
  content: "";
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 36px;
  background: #1a1a1a;
  border-radius: 20px;
  z-index: 10;
}
```

### Samsung Galaxy

| ID | Name | Frame (px) | Screen Region | Native Res | Ratio | Notable |
|----|------|-----------|---------------|------------|-------|---------|
| `galaxy-s24-ultra` | Galaxy S24 Ultra | 270 × 580 | x:8, y:8, w:254, h:564 | 1440 × 3120 | 3x | Flat edges, S Pen |
| `galaxy-s24` | Galaxy S24 | 254 × 540 | x:8, y:8, w:238, h:524 | 1080 × 2340 | 3x | Flat edges |
| `galaxy-s23` | Galaxy S23 | 254 × 540 | x:8, y:8, w:238, h:524 | 1080 × 2340 | 3x | Slight curve |
| `galaxy-z-fold-6-outer` | Z Fold 6 (Cover) | 220 × 560 | x:8, y:8, w:204, h:544 | 968 × 2376 | 3x | Narrow |
| `galaxy-z-fold-6-inner` | Z Fold 6 (Inner) | 430 × 490 | x:8, y:8, w:414, h:474 | 1856 × 2160 | 2x | Square-ish |

**CSS Preview Values for Samsung (thin bezels, punch-hole camera):**

```css
.device-samsung-modern {
  border-radius: 28px;
  border: 8px solid #1a1a1a;
  position: relative;
}

.device-samsung-modern::before {
  /* Punch-hole camera */
  content: "";
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  width: 12px;
  height: 12px;
  background: #1a1a1a;
  border-radius: 50%;
  z-index: 10;
}
```

### Google Pixel

| ID | Name | Frame (px) | Screen Region | Native Res | Ratio | Notable |
|----|------|-----------|---------------|------------|-------|---------|
| `pixel-9-pro` | Pixel 9 Pro | 260 × 556 | x:10, y:10, w:240, h:536 | 1280 × 2856 | 3x | Flat design |
| `pixel-9` | Pixel 9 | 254 × 540 | x:10, y:10, w:234, h:520 | 1080 × 2424 | 3x | Flat design |

---

## Tablet Devices

### Apple iPad

| ID | Name | Frame (px) | Screen Region | Native Res | Ratio | Notable |
|----|------|-----------|---------------|------------|-------|---------|
| `ipad-pro-13` | iPad Pro 13" (M4) | 580 × 780 | x:16, y:16, w:548, h:748 | 2064 × 2752 | 2x | Ultra-thin bezels |
| `ipad-pro-11` | iPad Pro 11" (M4) | 490 × 680 | x:16, y:16, w:458, h:648 | 1668 × 2420 | 2x | Thin bezels |
| `ipad-air-13` | iPad Air 13" (M2) | 580 × 780 | x:20, y:20, w:540, h:740 | 2048 × 2732 | 2x | Slightly thicker bezel |
| `ipad-air-11` | iPad Air 11" (M2) | 480 × 660 | x:20, y:20, w:440, h:620 | 1640 × 2360 | 2x | |
| `ipad-mini` | iPad mini (A17) | 400 × 580 | x:16, y:16, w:368, h:548 | 1488 × 2266 | 2x | Compact |

**CSS Preview Values for Modern iPad:**

```css
.device-ipad-modern {
  border-radius: 18px;
  border: 16px solid #2a2a2a;
  position: relative;
}
/* No notch, no home button — clean uniform bezels */
```

### Samsung Galaxy Tab

| ID | Name | Frame (px) | Screen Region | Native Res | Ratio |
|----|------|-----------|---------------|------------|-------|
| `galaxy-tab-s9-ultra` | Galaxy Tab S9 Ultra | 620 × 410 | x:12, y:12, w:596, h:386 | 2960 × 1848 | 2x |
| `galaxy-tab-s9` | Galaxy Tab S9 | 500 × 350 | x:12, y:12, w:476, h:326 | 2560 × 1600 | 2x |

---

## Laptop Devices

### Apple MacBook

| ID | Name | Frame (px) | Screen Region | Native Res | Ratio | Notable |
|----|------|-----------|---------------|------------|-------|---------|
| `macbook-pro-16` | MacBook Pro 16" | 780 × 520 | x:52, y:22, w:676, h:438 | 3456 × 2234 | 2x | Notch, thick bottom bezel |
| `macbook-pro-14` | MacBook Pro 14" | 700 × 470 | x:48, y:20, w:604, h:392 | 3024 × 1964 | 2x | Notch |
| `macbook-air-15` | MacBook Air 15" | 740 × 500 | x:50, y:22, w:640, h:414 | 2880 × 1864 | 2x | No notch |
| `macbook-air-13` | MacBook Air 13" | 680 × 460 | x:48, y:20, w:584, h:380 | 2560 × 1664 | 2x | |

**CSS Preview Values for MacBook:**

```css
.device-macbook {
  position: relative;
}

/* Screen lid */
.device-macbook-screen {
  border-radius: 12px 12px 0 0;
  border: 12px solid #2a2a2a;
  border-bottom: 0;
  background: #000;
  position: relative;
}

/* Notch (for Pro models) */
.device-macbook-screen::before {
  content: "";
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 160px;
  height: 20px;
  background: #2a2a2a;
  border-radius: 0 0 10px 10px;
  z-index: 10;
}

/* Bottom chin / hinge */
.device-macbook-base {
  height: 14px;
  background: linear-gradient(to bottom, #c0c0c0, #a0a0a0);
  border-radius: 0 0 4px 4px;
  width: 100%;
}

/* Keyboard base (optional detail) */
.device-macbook-keyboard {
  height: 8px;
  background: #d0d0d0;
  width: 110%;
  margin-left: -5%;
  border-radius: 0 0 8px 8px;
}
```

---

## Device Color Variants

Each device can optionally have color variants:

| Device Family | Available Colors |
|---------------|-----------------|
| iPhone 16 Pro | Natural Titanium (`#8a8580`), Black Titanium (`#3a3a3c`), White Titanium (`#f0ede8`), Desert Titanium (`#bfa48f`) |
| iPhone 16 | Black (`#3a3a3a`), White (`#f5f5f0`), Pink (`#f0b4c8`), Teal (`#97c5c3`), Ultramarine (`#7a8cc6`) |
| Galaxy S24 | Onyx Black (`#2a2a2a`), Marble Gray (`#c0c0c0`), Cobalt Violet (`#7a6a9a`), Amber Yellow (`#d4a843`) |
| MacBook Pro | Space Black (`#2a2a2a`), Silver (`#c0c0c0`) |
| MacBook Air | Midnight (`#2e3440`), Starlight (`#e8dcc8`), Space Gray (`#7a7a7a`), Silver (`#c0c0c0`) |
| iPad Pro | Space Black (`#2a2a2a`), Silver (`#c0c0c0`) |

These map to the `bezelColor` field in `DeviceSpec.style`.

---

## Orientation Support

All phone and tablet devices support both orientations:

- **Portrait**: Default. `frame.width` < `frame.height`
- **Landscape**: Swap `frame.width ↔ frame.height`, `screen.x ↔ screen.y`, `screen.width ↔ screen.height`

Laptops are always landscape.

The orientation toggle should be a simple button that swaps dimensions in the preview.

---

## Image Fitting Strategy

When the uploaded image's aspect ratio doesn't match the device screen:

| Strategy | CSS | Canvas | Use When |
|----------|-----|--------|----------|
| **Cover** (default) | `object-fit: cover` | Crop to fill | Most mockups — looks natural |
| **Contain** | `object-fit: contain` | Letterbox | User wants to see full image |
| **Stretch** | `object-fit: fill` | Stretch to fill | Rare — usually looks distorted |

Default to **Cover** with the image centered. Allow the user to drag/reposition within the frame.

---

## PNG Asset Strategy for Export

For the Canvas export pipeline, we need transparent PNG device frames. Two approaches:

### Option A: Generate from CSS (Recommended for Phase 1)

Use `html-to-image` (already installed) to capture the CSS device frame as a PNG, cache it, then composite with the user's image on Canvas. This avoids needing to ship PNG assets.

```typescript
// Pseudo-code
const frameElement = document.querySelector('.device-frame-only');
const framePng = await toPng(frameElement, { pixelRatio: 2 });
// Now composite framePng + user image on canvas
```

### Option B: Pre-built PNG Assets (Better quality for Phase 2+)

Ship high-resolution PNG device frames as static assets in `src/assets/devices/`. Each PNG is a transparent frame at 2x or 3x resolution with the screen area cut out.

- File size estimate: ~50–150 KB per device at 2x (compressed PNG)
- Total for ~20 devices: ~2–3 MB of assets
- Can be lazy-loaded per device selection

### Recommendation

Start with **Option A** for MVP — zero asset management. Move to **Option B** when higher fidelity is needed.
