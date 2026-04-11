"use client"

import { useCallback, useMemo, useState } from "react"
import { hexToRgb, rgbToHex, rgbToHsl, hslToRgb, rgbToHsb, hsbToRgb, rgbToCmyk, isValidHex } from "@/utils/colorUtils"
import type { RGB, HSL, HSB } from "@/types/color"

interface DirectInputPickerProps {
    hex: string
    onChange: (hex: string) => void
}

interface SliderRowProps {
    label: string
    value: number
    min: number
    max: number
    gradient: string
    onChange: (v: number) => void
}

function SliderRow({ label, value, min, max, gradient, onChange }: SliderRowProps) {
    return (
        <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-muted-foreground w-5 text-right">{label}</span>
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="flex-1 h-2 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:shadow-sm"
                style={{ background: gradient }}
            />
            <input
                type="number"
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value))))}
                className="w-14 px-2 py-1 text-xs font-mono text-foreground bg-muted/30 border border-border rounded-md text-center outline-none focus:border-ring"
            />
        </div>
    )
}

export function DirectInputPicker({ hex, onChange }: DirectInputPickerProps) {
    const [hexInput, setHexInput] = useState(hex.replace("#", ""))

    const rgb = useMemo(() => hexToRgb(hex), [hex])
    const hsl = useMemo(() => rgbToHsl(rgb), [rgb])
    const hsb = useMemo(() => rgbToHsb(rgb), [rgb])
    const cmyk = useMemo(() => rgbToCmyk(rgb), [rgb])

    // Sync hex input when external hex changes
    useMemo(() => {
        setHexInput(hex.replace("#", ""))
    }, [hex])

    const handleHexChange = useCallback((value: string) => {
        const clean = value.replace("#", "").slice(0, 6)
        setHexInput(clean)
        if (clean.length === 6 && isValidHex(clean)) {
            onChange(`#${clean.toUpperCase()}`)
        }
    }, [onChange])

    const handleRgbChange = useCallback((channel: keyof RGB, value: number) => {
        onChange(rgbToHex({ ...rgb, [channel]: value }))
    }, [onChange, rgb])

    const handleHslChange = useCallback((channel: keyof HSL, value: number) => {
        onChange(rgbToHex(hslToRgb({ ...hsl, [channel]: value })))
    }, [onChange, hsl])

    const handleHsbChange = useCallback((channel: keyof HSB, value: number) => {
        onChange(rgbToHex(hsbToRgb({ ...hsb, [channel]: value })))
    }, [onChange, hsb])

    // Gradient helpers
    const hueGradient = "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)"

    const hslSatGradient = useMemo(() => {
        const gray = rgbToHex(hslToRgb({ h: hsl.h, s: 0, l: hsl.l }))
        const sat = rgbToHex(hslToRgb({ h: hsl.h, s: 100, l: hsl.l }))
        return `linear-gradient(to right, ${gray}, ${sat})`
    }, [hsl])

    const hslLightGradient = useMemo(() => {
        const mid = rgbToHex(hslToRgb({ h: hsl.h, s: hsl.s, l: 50 }))
        return `linear-gradient(to right, #000000, ${mid}, #ffffff)`
    }, [hsl])

    const hsbSatGradient = useMemo(() => {
        const gray = rgbToHex(hsbToRgb({ h: hsb.h, s: 0, b: hsb.b }))
        const sat = rgbToHex(hsbToRgb({ h: hsb.h, s: 100, b: hsb.b }))
        return `linear-gradient(to right, ${gray}, ${sat})`
    }, [hsb])

    const hsbBrightGradient = useMemo(() => {
        const bright = rgbToHex(hsbToRgb({ h: hsb.h, s: hsb.s, b: 100 }))
        return `linear-gradient(to right, #000000, ${bright})`
    }, [hsb])

    return (
        <div className="flex flex-col gap-5">
            {/* HEX Input */}
            <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">HEX</label>
                <div className="flex items-center gap-1">
                    <span className="text-xs font-mono text-muted-foreground">#</span>
                    <input
                        type="text"
                        value={hexInput}
                        onChange={(e) => handleHexChange(e.target.value)}
                        maxLength={6}
                        className="flex-1 px-2 py-1.5 text-xs font-mono text-foreground bg-muted/30 border border-border rounded-md outline-none focus:border-ring uppercase"
                        spellCheck={false}
                    />
                </div>
            </div>

            {/* RGB Sliders */}
            <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">RGB</label>
                <div className="flex flex-col gap-2">
                    <SliderRow label="R" value={rgb.r} min={0} max={255} gradient="linear-gradient(to right, #000000, #ff0000)" onChange={(v) => handleRgbChange("r", v)} />
                    <SliderRow label="G" value={rgb.g} min={0} max={255} gradient="linear-gradient(to right, #000000, #00ff00)" onChange={(v) => handleRgbChange("g", v)} />
                    <SliderRow label="B" value={rgb.b} min={0} max={255} gradient="linear-gradient(to right, #000000, #0000ff)" onChange={(v) => handleRgbChange("b", v)} />
                </div>
            </div>

            {/* HSL Sliders */}
            <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">HSL</label>
                <div className="flex flex-col gap-2">
                    <SliderRow label="H" value={hsl.h} min={0} max={360} gradient={hueGradient} onChange={(v) => handleHslChange("h", v)} />
                    <SliderRow label="S" value={hsl.s} min={0} max={100} gradient={hslSatGradient} onChange={(v) => handleHslChange("s", v)} />
                    <SliderRow label="L" value={hsl.l} min={0} max={100} gradient={hslLightGradient} onChange={(v) => handleHslChange("l", v)} />
                </div>
            </div>

            {/* HSB Sliders */}
            <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">HSB</label>
                <div className="flex flex-col gap-2">
                    <SliderRow label="H" value={hsb.h} min={0} max={360} gradient={hueGradient} onChange={(v) => handleHsbChange("h", v)} />
                    <SliderRow label="S" value={hsb.s} min={0} max={100} gradient={hsbSatGradient} onChange={(v) => handleHsbChange("s", v)} />
                    <SliderRow label="B" value={hsb.b} min={0} max={100} gradient={hsbBrightGradient} onChange={(v) => handleHsbChange("b", v)} />
                </div>
            </div>

            {/* CMYK Read-only */}
            <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">CMYK</label>
                <div className="grid grid-cols-4 gap-2">
                    {(["c", "m", "y", "k"] as const).map((channel) => (
                        <div key={channel} className="flex flex-col items-center">
                            <span className="text-[10px] font-mono text-muted-foreground uppercase">{channel}</span>
                            <span className="text-xs font-mono text-foreground bg-muted/30 border border-border rounded-md px-2 py-1 w-full text-center">
                                {cmyk[channel]}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
