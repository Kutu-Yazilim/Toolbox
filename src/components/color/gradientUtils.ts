// ─── Gradient Utility Functions ─────────────────────────────────────────────
// Pure functions for generating gradient CSS, Tailwind config, and SVG markup.

import { type GradientConfig } from "./colorTypes"

function formatStops(stops: GradientConfig["stops"]): string {
    return [...stops]
        .sort((a, b) => a.position - b.position)
        .map(s => `${s.color} ${s.position}%`)
        .join(", ")
}

export function generateGradientCss(config: GradientConfig): string {
    const stops = formatStops(config.stops)

    switch (config.type) {
        case "linear":
            return `linear-gradient(${config.angle}deg, ${stops})`
        case "radial":
            return `radial-gradient(circle at ${config.centerX}% ${config.centerY}%, ${stops})`
        case "conic":
            return `conic-gradient(from ${config.angle}deg at ${config.centerX}% ${config.centerY}%, ${stops})`
    }
}

export function generateGradientTailwind(config: GradientConfig): string {
    const css = generateGradientCss(config)
    return JSON.stringify(
        { backgroundImage: { "custom-gradient": css } },
        null,
        2
    )
}

export function generateGradientSvg(config: GradientConfig): string {
    const sorted = [...config.stops].sort((a, b) => a.position - b.position)

    if (config.type === "radial") {
        const stopElements = sorted
            .map(s => `  <stop offset="${s.position}%" stop-color="${s.color}" />`)
            .join("\n")
        return [
            `<radialGradient id="gradient" cx="${config.centerX}%" cy="${config.centerY}%" r="50%">`,
            stopElements,
            `</radialGradient>`,
        ].join("\n")
    }

    // Linear and conic both map to linearGradient in SVG
    const angleRad = (config.angle - 90) * (Math.PI / 180)
    const x1 = Math.round(50 - Math.cos(angleRad) * 50)
    const y1 = Math.round(50 - Math.sin(angleRad) * 50)
    const x2 = Math.round(50 + Math.cos(angleRad) * 50)
    const y2 = Math.round(50 + Math.sin(angleRad) * 50)

    const stopElements = sorted
        .map(s => `  <stop offset="${s.position}%" stop-color="${s.color}" />`)
        .join("\n")

    return [
        `<linearGradient id="gradient" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">`,
        stopElements,
        `</linearGradient>`,
    ].join("\n")
}
