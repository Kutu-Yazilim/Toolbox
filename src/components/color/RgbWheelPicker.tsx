"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import { hexToRgb, rgbToHex } from "@/utils/colorUtils"
import type { RGB } from "@/types/color"

interface RgbWheelPickerProps {
    hex: string
    onChange: (hex: string) => void
}

const CANVAS_SIZE = 260
const CENTER = CANVAS_SIZE / 2
const CIRCLE_RADIUS = 70
const CIRCLE_OFFSET = 55

const CHANNEL_CONFIGS = [
    { key: "r" as const, label: "R", trackFrom: [0, 0, 0] as const, trackTo: [255, 0, 0] as const },
    { key: "g" as const, label: "G", trackFrom: [0, 0, 0] as const, trackTo: [0, 255, 0] as const },
    { key: "b" as const, label: "B", trackFrom: [0, 0, 0] as const, trackTo: [0, 0, 255] as const },
] as const

export function RgbWheelPicker({ hex, onChange }: RgbWheelPickerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [rgb, setRgb] = useState<RGB>(() => hexToRgb(hex))

    useEffect(() => {
        setRgb(hexToRgb(hex))
    }, [hex])

    const emitColor = useCallback((newRgb: RGB) => {
        setRgb(newRgb)
        onChange(rgbToHex(newRgb))
    }, [onChange])

    // Circle positions: R top, G bottom-left, B bottom-right
    const circlePositions = [
        { x: CENTER, y: CENTER - CIRCLE_OFFSET },
        { x: CENTER - CIRCLE_OFFSET * Math.cos(Math.PI / 6), y: CENTER + CIRCLE_OFFSET * Math.sin(Math.PI / 6) },
        { x: CENTER + CIRCLE_OFFSET * Math.cos(Math.PI / 6), y: CENTER + CIRCLE_OFFSET * Math.sin(Math.PI / 6) },
    ]

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

        // Use globalCompositeOperation for additive blending
        ctx.globalCompositeOperation = "lighter"

        const colors = [
            `rgba(${rgb.r}, 0, 0, 0.85)`,
            `rgba(0, ${rgb.g}, 0, 0.85)`,
            `rgba(0, 0, ${rgb.b}, 0.85)`,
        ]

        circlePositions.forEach((pos, i) => {
            ctx.beginPath()
            ctx.arc(pos.x, pos.y, CIRCLE_RADIUS, 0, Math.PI * 2)
            ctx.fillStyle = colors[i]
            ctx.fill()
        })

        ctx.globalCompositeOperation = "source-over"
    }, [rgb, circlePositions])

    const handleSliderChange = useCallback((channel: keyof RGB, value: number) => {
        emitColor({ ...rgb, [channel]: value })
    }, [emitColor, rgb])

    return (
        <div className="flex flex-col items-center gap-4">
            <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                className="max-w-full"
                style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
            />
            <div className="w-full flex flex-col gap-3 px-2">
                {CHANNEL_CONFIGS.map(({ key, label, trackFrom, trackTo }) => (
                    <div key={key} className="flex items-center gap-3">
                        <span className="text-xs font-mono text-muted-foreground w-4">{label}</span>
                        <input
                            type="range"
                            min={0}
                            max={255}
                            value={rgb[key]}
                            onChange={(e) => handleSliderChange(key, Number(e.target.value))}
                            className="flex-1 h-2 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:shadow-sm"
                            style={{
                                background: `linear-gradient(to right, rgb(${trackFrom.join(",")}), rgb(${trackTo.join(",")}))`
                            }}
                        />
                        <input
                            type="number"
                            min={0}
                            max={255}
                            value={rgb[key]}
                            onChange={(e) => handleSliderChange(key, Math.max(0, Math.min(255, Number(e.target.value))))}
                            className="w-14 px-2 py-1 text-xs font-mono text-foreground bg-muted/30 border border-border rounded-md text-center outline-none focus:border-ring"
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}
