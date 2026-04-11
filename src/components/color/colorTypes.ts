// ─── Color Types ─────────────────────────────────────────────────────────────
// Single source of truth for all color-related types.
// Re-exports base types from @/types/color for convenience.

export type {
    RGB,
    HSL,
    HSB,
    CMYK,
    PaletteColor,
    ColorHarmony,
    ColorBlindnessType,
    ExportFormat,
} from "@/types/color"

// ─── Gradient ────────────────────────────────────────────────────────────────

export interface GradientStop {
    id: string
    color: string
    position: number
}

export interface GradientConfig {
    type: "linear" | "radial" | "conic"
    angle: number
    centerX: number
    centerY: number
    stops: GradientStop[]
    easing: "linear" | "ease-in" | "ease-out" | "ease-in-out"
}

// ─── Saved Items ─────────────────────────────────────────────────────────────

export interface SavedPalette {
    id: string
    name: string
    colors: string[]
    harmony: import("@/types/color").ColorHarmony
    createdAt: number
    updatedAt: number
}

export interface SavedGradient {
    id: string
    name: string
    type: "linear" | "radial" | "conic"
    angle: number
    stops: GradientStop[]
    easing: string
    createdAt: number
    updatedAt: number
}
