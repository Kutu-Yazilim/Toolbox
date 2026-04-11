"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { PaletteIcon } from "lucide-react"
import { type GradientConfig, type GradientStop } from "./colorTypes"
import { GRADIENT_PRESETS } from "./gradientPresets"
import { GradientPreview } from "./GradientPreview"
import { GradientBar } from "./GradientBar"
import { GradientControls } from "./GradientControls"

function createStopsFromColors(colors: string[]): GradientStop[] {
    if (colors.length === 0) return DEFAULT_CONFIG.stops
    return colors.map((color, i) => ({
        id: `init-${i}`,
        color,
        position: colors.length === 1 ? 50 : Math.round((i / (colors.length - 1)) * 100),
    }))
}

const DEFAULT_CONFIG: GradientConfig = GRADIENT_PRESETS[0].config

interface GradientEditorProps {
    initialColors?: string[]
    onToPalette: (colors: string[]) => void
}

export function GradientEditor({ initialColors, onToPalette }: GradientEditorProps) {
    const [config, setConfig] = useState<GradientConfig>(() => {
        if (initialColors && initialColors.length > 0) {
            return {
                ...DEFAULT_CONFIG,
                stops: createStopsFromColors(initialColors),
            }
        }
        return DEFAULT_CONFIG
    })
    const [selectedStopId, setSelectedStopId] = useState<string | null>(null)

    const handleStopsChange = useCallback((stops: GradientStop[]) => {
        setConfig(prev => ({ ...prev, stops }))
    }, [])

    const handleColorClick = useCallback((stopId: string) => {
        setSelectedStopId(stopId)
        // The parent color picker tool can observe selectedStopId to open its picker
    }, [])

    const handlePresetSelect = useCallback((preset: GradientConfig) => {
        setConfig(preset)
        setSelectedStopId(null)
    }, [])

    const extractToPalette = useCallback(() => {
        const colors = [...config.stops]
            .sort((a, b) => a.position - b.position)
            .map(s => s.color)
        onToPalette(colors)
    }, [config.stops, onToPalette])

    return (
        <div className="flex flex-col gap-4">
            {/* Presets */}
            <div className="flex flex-col gap-1.5">
                <span className="text-xs text-muted-foreground">Presets</span>
                <div className="flex flex-wrap gap-1.5">
                    {GRADIENT_PRESETS.map(preset => (
                        <button
                            key={preset.name}
                            onClick={() => handlePresetSelect(preset.config)}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-border hover:border-primary/50 transition-colors"
                            title={preset.name}
                        >
                            <div
                                className="w-5 h-5 rounded-sm"
                                style={{
                                    background: `linear-gradient(135deg, ${preset.config.stops.map(s => s.color).join(", ")})`,
                                }}
                            />
                            <span className="text-[10px] text-muted-foreground">{preset.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Preview */}
            <GradientPreview config={config} />

            {/* Gradient bar */}
            <GradientBar
                config={config}
                onStopsChange={handleStopsChange}
                onSelectStop={setSelectedStopId}
                selectedStopId={selectedStopId}
            />

            {/* Controls */}
            <GradientControls
                config={config}
                onChange={setConfig}
                selectedStopId={selectedStopId}
                onColorClick={handleColorClick}
            />

            {/* Extract to palette */}
            <Button variant="outline" size="sm" onClick={extractToPalette} className="self-start">
                <PaletteIcon className="h-3.5 w-3.5" />
                <span className="text-xs">Send to Palette</span>
            </Button>
        </div>
    )
}
