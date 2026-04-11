// ─── Gradient Presets ───────────────────────────────────────────────────────

import { type GradientConfig } from "./colorTypes"

function stop(id: string, color: string, position: number) {
    return { id, color, position }
}

const BASE: Pick<GradientConfig, "type" | "centerX" | "centerY" | "easing"> = {
    type: "linear",
    centerX: 50,
    centerY: 50,
    easing: "linear",
}

export const GRADIENT_PRESETS: { name: string; config: GradientConfig }[] = [
    {
        name: "Sunset",
        config: {
            ...BASE,
            angle: 135,
            stops: [
                stop("sunset-1", "#FF6B35", 0),
                stop("sunset-2", "#F7418C", 50),
                stop("sunset-3", "#8B5CF6", 100),
            ],
        },
    },
    {
        name: "Ocean",
        config: {
            ...BASE,
            angle: 180,
            stops: [
                stop("ocean-1", "#0F3460", 0),
                stop("ocean-2", "#16697A", 40),
                stop("ocean-3", "#0EA5E9", 70),
                stop("ocean-4", "#67E8F9", 100),
            ],
        },
    },
    {
        name: "Aurora",
        config: {
            ...BASE,
            angle: 160,
            stops: [
                stop("aurora-1", "#22C55E", 0),
                stop("aurora-2", "#06B6D4", 50),
                stop("aurora-3", "#A855F7", 100),
            ],
        },
    },
    {
        name: "Night Sky",
        config: {
            ...BASE,
            angle: 180,
            stops: [
                stop("night-1", "#1E3A5F", 0),
                stop("night-2", "#4338CA", 50),
                stop("night-3", "#0F172A", 100),
            ],
        },
    },
    {
        name: "Forest",
        config: {
            ...BASE,
            angle: 120,
            stops: [
                stop("forest-1", "#14532D", 0),
                stop("forest-2", "#059669", 40),
                stop("forest-3", "#4ADE80", 75),
                stop("forest-4", "#BEF264", 100),
            ],
        },
    },
    {
        name: "Fire",
        config: {
            ...BASE,
            angle: 45,
            stops: [
                stop("fire-1", "#DC2626", 0),
                stop("fire-2", "#EA580C", 40),
                stop("fire-3", "#F59E0B", 75),
                stop("fire-4", "#FDE047", 100),
            ],
        },
    },
    {
        name: "Pastel",
        config: {
            ...BASE,
            angle: 90,
            stops: [
                stop("pastel-1", "#FDB4C5", 0),
                stop("pastel-2", "#C4B5FD", 50),
                stop("pastel-3", "#A7F3D0", 100),
            ],
        },
    },
    {
        name: "Monochrome",
        config: {
            ...BASE,
            angle: 180,
            stops: [
                stop("mono-1", "#FFFFFF", 0),
                stop("mono-2", "#9CA3AF", 50),
                stop("mono-3", "#111827", 100),
            ],
        },
    },
]
