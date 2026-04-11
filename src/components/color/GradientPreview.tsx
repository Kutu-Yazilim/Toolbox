"use client"

import { useState } from "react"
import { type GradientConfig } from "./colorTypes"
import { generateGradientCss } from "./gradientUtils"

type PreviewMode = "button" | "card" | "text"

const PREVIEW_MODES: { label: string; value: PreviewMode }[] = [
    { label: "Button", value: "button" },
    { label: "Card", value: "card" },
    { label: "Text", value: "text" },
]

interface GradientPreviewProps {
    config: GradientConfig
}

export function GradientPreview({ config }: GradientPreviewProps) {
    const [mode, setMode] = useState<PreviewMode>("card")
    const gradientCss = generateGradientCss(config)

    return (
        <div className="flex flex-col gap-3">
            {/* Full gradient preview */}
            <div
                className="w-full h-32 rounded-lg border border-border"
                style={{ background: gradientCss }}
            />

            {/* Mode selector */}
            <div className="flex items-center gap-1">
                {PREVIEW_MODES.map(({ label, value }) => (
                    <button
                        key={value}
                        onClick={() => setMode(value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            mode === value
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Mock element preview */}
            <div className="flex items-center justify-center p-6 rounded-lg bg-muted/30 border border-border">
                {mode === "button" && (
                    <div
                        className="px-6 py-2.5 rounded-md text-sm font-medium shadow-sm cursor-default"
                        style={{
                            background: gradientCss,
                            color: "#FFFFFF",
                            textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                        }}
                    >
                        Sample Button
                    </div>
                )}

                {mode === "card" && (
                    <div
                        className="w-full max-w-xs rounded-lg p-6 shadow-md"
                        style={{ background: gradientCss }}
                    >
                        <p
                            className="text-sm font-medium"
                            style={{
                                color: "#FFFFFF",
                                textShadow: "0 1px 3px rgba(0,0,0,0.3)",
                            }}
                        >
                            Sample Text
                        </p>
                        <p
                            className="text-xs mt-1 opacity-80"
                            style={{
                                color: "#FFFFFF",
                                textShadow: "0 1px 3px rgba(0,0,0,0.3)",
                            }}
                        >
                            A preview of your gradient applied to a card element.
                        </p>
                    </div>
                )}

                {mode === "text" && (
                    <span
                        className="text-4xl font-bold"
                        style={{
                            background: gradientCss,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                        }}
                    >
                        Gradient Text
                    </span>
                )}
            </div>
        </div>
    )
}
