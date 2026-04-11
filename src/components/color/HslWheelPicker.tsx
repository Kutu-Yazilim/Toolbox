"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import { hexToRgb, rgbToHsl, hslToRgb, rgbToHex } from "@/utils/colorUtils"

interface HslWheelPickerProps {
    hex: string
    onChange: (hex: string) => void
}

const CANVAS_SIZE = 280
const CENTER = CANVAS_SIZE / 2
const OUTER_RADIUS = CANVAS_SIZE / 2 - 4
const RING_WIDTH = 28
const INNER_RADIUS = OUTER_RADIUS - RING_WIDTH
const TRIANGLE_RADIUS = INNER_RADIUS - 6

type DragTarget = "ring" | "triangle" | null

export function HslWheelPicker({ hex, onChange }: HslWheelPickerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const dragTarget = useRef<DragTarget>(null)
    const [hsl, setHsl] = useState(() => rgbToHsl(hexToRgb(hex)))

    // Sync external hex changes
    useEffect(() => {
        setHsl(rgbToHsl(hexToRgb(hex)))
    }, [hex])

    const emitColor = useCallback((h: number, s: number, l: number) => {
        const newHsl = { h, s, l }
        setHsl(newHsl)
        onChange(rgbToHex(hslToRgb(newHsl)))
    }, [onChange])

    // Triangle vertices based on current hue
    const getTriangleVertices = useCallback((hue: number) => {
        const angle = (hue - 90) * (Math.PI / 180)
        const v0 = { x: CENTER + TRIANGLE_RADIUS * Math.cos(angle), y: CENTER + TRIANGLE_RADIUS * Math.sin(angle) }
        const v1 = { x: CENTER + TRIANGLE_RADIUS * Math.cos(angle + (2 * Math.PI / 3)), y: CENTER + TRIANGLE_RADIUS * Math.sin(angle + (2 * Math.PI / 3)) }
        const v2 = { x: CENTER + TRIANGLE_RADIUS * Math.cos(angle + (4 * Math.PI / 3)), y: CENTER + TRIANGLE_RADIUS * Math.sin(angle + (4 * Math.PI / 3)) }
        return { v0, v1, v2 } // v0 = pure hue, v1 = black, v2 = white
    }, [])

    // Convert point in triangle to S/L using barycentric coordinates
    const pointToSL = useCallback((px: number, py: number, hue: number): { s: number; l: number } => {
        const { v0, v1, v2 } = getTriangleVertices(hue)
        // v0 = pure color (S=100, L=50), v1 = black (S=0, L=0), v2 = white (S=0, L=100)
        const denom = (v1.y - v2.y) * (v0.x - v2.x) + (v2.x - v1.x) * (v0.y - v2.y)
        if (Math.abs(denom) < 0.001) return { s: 0, l: 50 }
        let w0 = ((v1.y - v2.y) * (px - v2.x) + (v2.x - v1.x) * (py - v2.y)) / denom
        let w1 = ((v2.y - v0.y) * (px - v2.x) + (v0.x - v2.x) * (py - v2.y)) / denom
        let w2 = 1 - w0 - w1

        // Clamp barycentric coords
        w0 = Math.max(0, Math.min(1, w0))
        w1 = Math.max(0, Math.min(1, w1))
        w2 = Math.max(0, Math.min(1, w2))
        const sum = w0 + w1 + w2
        w0 /= sum; w1 /= sum; w2 /= sum

        // v0 -> S=100,L=50 ; v1 -> S=0,L=0 ; v2 -> S=0,L=100
        const s = Math.round(w0 * 100)
        const l = Math.round(w0 * 50 + w2 * 100)
        return { s: Math.max(0, Math.min(100, s)), l: Math.max(0, Math.min(100, l)) }
    }, [getTriangleVertices])

    // Convert S/L to point in triangle
    const slToPoint = useCallback((s: number, l: number, hue: number): { x: number; y: number } => {
        const { v0, v1, v2 } = getTriangleVertices(hue)
        // Inverse of pointToSL: compute barycentric weights
        const w0 = s / 100
        const w2 = (l - w0 * 50) / 100
        const w1 = 1 - w0 - w2
        return {
            x: w0 * v0.x + w1 * v1.x + w2 * v2.x,
            y: w0 * v0.y + w1 * v1.y + w2 * v2.y,
        }
    }, [getTriangleVertices])

    // Draw canvas
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

        // Draw hue ring
        for (let angle = 0; angle < 360; angle += 1) {
            const startAngle = (angle - 1) * (Math.PI / 180)
            const endAngle = (angle + 1) * (Math.PI / 180)
            ctx.beginPath()
            ctx.arc(CENTER, CENTER, OUTER_RADIUS - RING_WIDTH / 2, startAngle, endAngle)
            ctx.lineWidth = RING_WIDTH
            const rgb = hslToRgb({ h: angle, s: 100, l: 50 })
            ctx.strokeStyle = `rgb(${rgb.r},${rgb.g},${rgb.b})`
            ctx.stroke()
        }

        // Draw inner triangle
        const { v0, v1, v2 } = getTriangleVertices(hsl.h)
        // Draw filled triangle with gradients using pixel-level rendering
        // Create offscreen for triangle
        const imgData = ctx.createImageData(CANVAS_SIZE, CANVAS_SIZE)
        for (let py = 0; py < CANVAS_SIZE; py++) {
            for (let px = 0; px < CANVAS_SIZE; px++) {
                // Check if point is inside triangle using barycentric coords
                const denom = (v1.y - v2.y) * (v0.x - v2.x) + (v2.x - v1.x) * (v0.y - v2.y)
                if (Math.abs(denom) < 0.001) continue
                const w0 = ((v1.y - v2.y) * (px - v2.x) + (v2.x - v1.x) * (py - v2.y)) / denom
                const w1 = ((v2.y - v0.y) * (px - v2.x) + (v0.x - v2.x) * (py - v2.y)) / denom
                const w2 = 1 - w0 - w1

                if (w0 >= -0.01 && w1 >= -0.01 && w2 >= -0.01) {
                    // v0 = pure color, v1 = black, v2 = white
                    const pureRgb = hslToRgb({ h: hsl.h, s: 100, l: 50 })
                    const r = Math.round(w0 * pureRgb.r + w1 * 0 + w2 * 255)
                    const g = Math.round(w0 * pureRgb.g + w1 * 0 + w2 * 255)
                    const b = Math.round(w0 * pureRgb.b + w1 * 0 + w2 * 255)
                    const idx = (py * CANVAS_SIZE + px) * 4
                    imgData.data[idx] = Math.max(0, Math.min(255, r))
                    imgData.data[idx + 1] = Math.max(0, Math.min(255, g))
                    imgData.data[idx + 2] = Math.max(0, Math.min(255, b))
                    imgData.data[idx + 3] = 255
                }
            }
        }
        ctx.putImageData(imgData, 0, 0)

        // Re-draw hue ring on top (triangle may overlap edges)
        for (let angle = 0; angle < 360; angle += 1) {
            const startAngle = (angle - 1) * (Math.PI / 180)
            const endAngle = (angle + 1) * (Math.PI / 180)
            ctx.beginPath()
            ctx.arc(CENTER, CENTER, OUTER_RADIUS - RING_WIDTH / 2, startAngle, endAngle)
            ctx.lineWidth = RING_WIDTH
            const rgb = hslToRgb({ h: angle, s: 100, l: 50 })
            ctx.strokeStyle = `rgb(${rgb.r},${rgb.g},${rgb.b})`
            ctx.stroke()
        }

        // Hue indicator on ring
        const hueAngle = (hsl.h - 90) * (Math.PI / 180)
        const hueX = CENTER + (OUTER_RADIUS - RING_WIDTH / 2) * Math.cos(hueAngle)
        const hueY = CENTER + (OUTER_RADIUS - RING_WIDTH / 2) * Math.sin(hueAngle)
        ctx.beginPath()
        ctx.arc(hueX, hueY, RING_WIDTH / 2 - 2, 0, Math.PI * 2)
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 2.5
        ctx.stroke()
        ctx.strokeStyle = "#000000"
        ctx.lineWidth = 1
        ctx.stroke()

        // S/L indicator on triangle
        const slPos = slToPoint(hsl.s, hsl.l, hsl.h)
        ctx.beginPath()
        ctx.arc(slPos.x, slPos.y, 6, 0, Math.PI * 2)
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 2.5
        ctx.stroke()
        ctx.strokeStyle = "#000000"
        ctx.lineWidth = 1
        ctx.stroke()
    }, [hsl, getTriangleVertices, slToPoint])

    const getCanvasPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current!.getBoundingClientRect()
        const scaleX = CANVAS_SIZE / rect.width
        const scaleY = CANVAS_SIZE / rect.height
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        }
    }, [])

    const handlePointerDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const { x, y } = getCanvasPos(e)
        const dist = Math.sqrt((x - CENTER) ** 2 + (y - CENTER) ** 2)

        if (dist >= INNER_RADIUS && dist <= OUTER_RADIUS) {
            dragTarget.current = "ring"
            const angle = Math.atan2(y - CENTER, x - CENTER) * (180 / Math.PI) + 90
            const h = ((angle % 360) + 360) % 360
            emitColor(Math.round(h), hsl.s, hsl.l)
        } else if (dist < INNER_RADIUS) {
            dragTarget.current = "triangle"
            const { s, l } = pointToSL(x, y, hsl.h)
            emitColor(hsl.h, s, l)
        }
    }, [getCanvasPos, emitColor, hsl, pointToSL])

    const handlePointerMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!dragTarget.current) return
        const { x, y } = getCanvasPos(e)

        if (dragTarget.current === "ring") {
            const angle = Math.atan2(y - CENTER, x - CENTER) * (180 / Math.PI) + 90
            const h = ((angle % 360) + 360) % 360
            emitColor(Math.round(h), hsl.s, hsl.l)
        } else if (dragTarget.current === "triangle") {
            const { s, l } = pointToSL(x, y, hsl.h)
            emitColor(hsl.h, s, l)
        }
    }, [getCanvasPos, emitColor, hsl, pointToSL])

    const handlePointerUp = useCallback(() => {
        dragTarget.current = null
    }, [])

    return (
        <div className="flex flex-col items-center gap-2">
            <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                className="cursor-crosshair max-w-full"
                style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
            />
            <div className="flex gap-4 text-xs text-muted-foreground font-mono">
                <span>H: {hsl.h}</span>
                <span>S: {hsl.s}</span>
                <span>L: {hsl.l}</span>
            </div>
        </div>
    )
}
