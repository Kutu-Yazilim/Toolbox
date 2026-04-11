"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import { hexToRgb, rgbToHsb, hsbToRgb, rgbToHex } from "@/utils/colorUtils"

interface HsvSquarePickerProps {
    hex: string
    onChange: (hex: string) => void
}

const SQUARE_SIZE = 250
const STRIP_WIDTH = 20
const STRIP_GAP = 16

type DragTarget = "square" | "strip" | null

export function HsvSquarePicker({ hex, onChange }: HsvSquarePickerProps) {
    const squareRef = useRef<HTMLCanvasElement>(null)
    const stripRef = useRef<HTMLCanvasElement>(null)
    const dragTarget = useRef<DragTarget>(null)
    const [hsb, setHsb] = useState(() => rgbToHsb(hexToRgb(hex)))

    useEffect(() => {
        setHsb(rgbToHsb(hexToRgb(hex)))
    }, [hex])

    const emitColor = useCallback((h: number, s: number, b: number) => {
        const newHsb = { h, s, b }
        setHsb(newHsb)
        onChange(rgbToHex(hsbToRgb(newHsb)))
    }, [onChange])

    // Draw SV square
    useEffect(() => {
        const canvas = squareRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Base hue fill
        const hueRgb = hsbToRgb({ h: hsb.h, s: 100, b: 100 })
        ctx.fillStyle = `rgb(${hueRgb.r},${hueRgb.g},${hueRgb.b})`
        ctx.fillRect(0, 0, SQUARE_SIZE, SQUARE_SIZE)

        // White gradient (left to right = low to high saturation)
        const whiteGrad = ctx.createLinearGradient(0, 0, SQUARE_SIZE, 0)
        whiteGrad.addColorStop(0, "rgba(255,255,255,1)")
        whiteGrad.addColorStop(1, "rgba(255,255,255,0)")
        ctx.fillStyle = whiteGrad
        ctx.fillRect(0, 0, SQUARE_SIZE, SQUARE_SIZE)

        // Black gradient (top to bottom = high to low brightness)
        const blackGrad = ctx.createLinearGradient(0, 0, 0, SQUARE_SIZE)
        blackGrad.addColorStop(0, "rgba(0,0,0,0)")
        blackGrad.addColorStop(1, "rgba(0,0,0,1)")
        ctx.fillStyle = blackGrad
        ctx.fillRect(0, 0, SQUARE_SIZE, SQUARE_SIZE)

        // Crosshair indicator
        const cx = (hsb.s / 100) * SQUARE_SIZE
        const cy = (1 - hsb.b / 100) * SQUARE_SIZE
        ctx.beginPath()
        ctx.arc(cx, cy, 6, 0, Math.PI * 2)
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 2.5
        ctx.stroke()
        ctx.strokeStyle = "#000000"
        ctx.lineWidth = 1
        ctx.stroke()
    }, [hsb])

    // Draw hue strip
    useEffect(() => {
        const canvas = stripRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const gradient = ctx.createLinearGradient(0, 0, 0, SQUARE_SIZE)
        const stops = [0, 60, 120, 180, 240, 300, 360]
        stops.forEach((hue, i) => {
            const rgb = hsbToRgb({ h: hue % 360, s: 100, b: 100 })
            gradient.addColorStop(i / (stops.length - 1), `rgb(${rgb.r},${rgb.g},${rgb.b})`)
        })
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, STRIP_WIDTH, SQUARE_SIZE)

        // Arrow indicator
        const hy = (hsb.h / 360) * SQUARE_SIZE
        ctx.beginPath()
        ctx.moveTo(0, hy - 4)
        ctx.lineTo(0, hy + 4)
        ctx.lineTo(5, hy)
        ctx.closePath()
        ctx.fillStyle = "#ffffff"
        ctx.fill()
        ctx.strokeStyle = "#000000"
        ctx.lineWidth = 0.5
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(STRIP_WIDTH, hy - 4)
        ctx.lineTo(STRIP_WIDTH, hy + 4)
        ctx.lineTo(STRIP_WIDTH - 5, hy)
        ctx.closePath()
        ctx.fillStyle = "#ffffff"
        ctx.fill()
        ctx.strokeStyle = "#000000"
        ctx.lineWidth = 0.5
        ctx.stroke()
    }, [hsb.h])

    const handleSquareDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        dragTarget.current = "square"
        const rect = squareRef.current!.getBoundingClientRect()
        const x = Math.max(0, Math.min(SQUARE_SIZE, ((e.clientX - rect.left) / rect.width) * SQUARE_SIZE))
        const y = Math.max(0, Math.min(SQUARE_SIZE, ((e.clientY - rect.top) / rect.height) * SQUARE_SIZE))
        emitColor(hsb.h, Math.round((x / SQUARE_SIZE) * 100), Math.round((1 - y / SQUARE_SIZE) * 100))
    }, [emitColor, hsb.h])

    const handleStripDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        dragTarget.current = "strip"
        const rect = stripRef.current!.getBoundingClientRect()
        const y = Math.max(0, Math.min(SQUARE_SIZE, ((e.clientY - rect.top) / rect.height) * SQUARE_SIZE))
        emitColor(Math.round((y / SQUARE_SIZE) * 360), hsb.s, hsb.b)
    }, [emitColor, hsb.s, hsb.b])

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!dragTarget.current) return
        if (dragTarget.current === "square" && squareRef.current) {
            const rect = squareRef.current.getBoundingClientRect()
            const x = Math.max(0, Math.min(SQUARE_SIZE, ((e.clientX - rect.left) / rect.width) * SQUARE_SIZE))
            const y = Math.max(0, Math.min(SQUARE_SIZE, ((e.clientY - rect.top) / rect.height) * SQUARE_SIZE))
            emitColor(hsb.h, Math.round((x / SQUARE_SIZE) * 100), Math.round((1 - y / SQUARE_SIZE) * 100))
        } else if (dragTarget.current === "strip" && stripRef.current) {
            const rect = stripRef.current.getBoundingClientRect()
            const y = Math.max(0, Math.min(SQUARE_SIZE, ((e.clientY - rect.top) / rect.height) * SQUARE_SIZE))
            emitColor(Math.round((y / SQUARE_SIZE) * 360), hsb.s, hsb.b)
        }
    }, [emitColor, hsb])

    const handleMouseUp = useCallback(() => {
        dragTarget.current = null
    }, [])

    return (
        <div
            className="flex flex-col items-center gap-2"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div className="flex items-start" style={{ gap: STRIP_GAP }}>
                <canvas
                    ref={squareRef}
                    width={SQUARE_SIZE}
                    height={SQUARE_SIZE}
                    className="cursor-crosshair rounded-sm border border-border"
                    style={{ width: SQUARE_SIZE, height: SQUARE_SIZE }}
                    onMouseDown={handleSquareDown}
                />
                <canvas
                    ref={stripRef}
                    width={STRIP_WIDTH}
                    height={SQUARE_SIZE}
                    className="cursor-pointer rounded-sm border border-border"
                    style={{ width: STRIP_WIDTH, height: SQUARE_SIZE }}
                    onMouseDown={handleStripDown}
                />
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground font-mono">
                <span>H: {hsb.h}</span>
                <span>S: {hsb.s}</span>
                <span>B: {hsb.b}</span>
            </div>
        </div>
    )
}
