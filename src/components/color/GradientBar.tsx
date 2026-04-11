"use client"

import { useRef, useCallback } from "react"
import { type GradientConfig, type GradientStop } from "./colorTypes"
import { generateGradientCss } from "./gradientUtils"

const MIN_STOPS = 2
const REMOVE_THRESHOLD_PX = 40
const HANDLE_SIZE = "w-4 h-4"

interface GradientBarProps {
    config: GradientConfig
    onStopsChange: (stops: GradientStop[]) => void
    onSelectStop: (id: string) => void
    selectedStopId: string | null
}

export function GradientBar({ config, onStopsChange, onSelectStop, selectedStopId }: GradientBarProps) {
    const barRef = useRef<HTMLDivElement>(null)
    const dragState = useRef<{ stopId: string; startY: number } | null>(null)

    const getPositionFromX = useCallback((clientX: number): number => {
        const bar = barRef.current
        if (!bar) return 0
        const rect = bar.getBoundingClientRect()
        const ratio = (clientX - rect.left) / rect.width
        return Math.round(Math.max(0, Math.min(100, ratio * 100)))
    }, [])

    const handleMouseDown = useCallback((e: React.MouseEvent, stopId: string) => {
        e.stopPropagation()
        onSelectStop(stopId)
        dragState.current = { stopId, startY: e.clientY }

        const handleMouseMove = (me: MouseEvent) => {
            if (!dragState.current) return

            const verticalOffset = Math.abs(me.clientY - dragState.current.startY)

            // Remove stop if dragged away vertically
            if (verticalOffset > REMOVE_THRESHOLD_PX && config.stops.length > MIN_STOPS) {
                const newStops = config.stops.filter(s => s.id !== dragState.current!.stopId)
                onStopsChange(newStops)
                dragState.current = null
                document.removeEventListener("mousemove", handleMouseMove)
                document.removeEventListener("mouseup", handleMouseUp)
                return
            }

            const position = getPositionFromX(me.clientX)
            const newStops = config.stops.map(s =>
                s.id === dragState.current!.stopId ? { ...s, position } : s
            )
            onStopsChange(newStops)
        }

        const handleMouseUp = () => {
            dragState.current = null
            document.removeEventListener("mousemove", handleMouseMove)
            document.removeEventListener("mouseup", handleMouseUp)
        }

        document.addEventListener("mousemove", handleMouseMove)
        document.addEventListener("mouseup", handleMouseUp)
    }, [config.stops, onStopsChange, onSelectStop, getPositionFromX])

    const handleBarClick = useCallback((e: React.MouseEvent) => {
        // Don't add if clicking a handle
        if ((e.target as HTMLElement).dataset.handle) return

        const position = getPositionFromX(e.clientX)
        const newStop: GradientStop = {
            id: `stop-${Date.now()}`,
            color: interpolateColorAtPosition(config.stops, position),
            position,
        }
        onStopsChange([...config.stops, newStop])
        onSelectStop(newStop.id)
    }, [config.stops, onStopsChange, onSelectStop, getPositionFromX])

    const gradientCss = generateGradientCss({
        ...config,
        type: "linear",
        angle: 90,
    })

    return (
        <div className="flex flex-col gap-1">
            <div
                ref={barRef}
                className="relative h-8 rounded-md border border-border cursor-crosshair"
                style={{ background: gradientCss }}
                onClick={handleBarClick}
            >
                {config.stops.map(stop => (
                    <div
                        key={stop.id}
                        data-handle="true"
                        className={`absolute top-full -translate-y-1/2 -translate-x-1/2 ${HANDLE_SIZE} rounded-full border-2 cursor-grab active:cursor-grabbing shadow-sm ${
                            selectedStopId === stop.id
                                ? "border-primary ring-2 ring-primary/30"
                                : "border-background"
                        }`}
                        style={{
                            left: `${stop.position}%`,
                            backgroundColor: stop.color,
                        }}
                        onMouseDown={e => handleMouseDown(e, stop.id)}
                    />
                ))}
            </div>

            {/* Position labels */}
            <div className="relative h-4">
                {config.stops.map(stop => (
                    <span
                        key={stop.id}
                        className="absolute text-[9px] text-muted-foreground -translate-x-1/2 top-0"
                        style={{ left: `${stop.position}%` }}
                    >
                        {stop.position}%
                    </span>
                ))}
            </div>
        </div>
    )
}

/** Interpolate a color at a given position along the gradient stops */
function interpolateColorAtPosition(stops: GradientStop[], position: number): string {
    const sorted = [...stops].sort((a, b) => a.position - b.position)
    if (sorted.length === 0) return "#888888"
    if (position <= sorted[0].position) return sorted[0].color
    if (position >= sorted[sorted.length - 1].position) return sorted[sorted.length - 1].color

    // Find surrounding stops
    for (let i = 0; i < sorted.length - 1; i++) {
        if (position >= sorted[i].position && position <= sorted[i + 1].position) {
            const range = sorted[i + 1].position - sorted[i].position
            if (range === 0) return sorted[i].color
            const ratio = (position - sorted[i].position) / range
            return blendHex(sorted[i].color, sorted[i + 1].color, ratio)
        }
    }

    return sorted[0].color
}

function blendHex(hex1: string, hex2: string, ratio: number): string {
    const r1 = parseInt(hex1.slice(1, 3), 16)
    const g1 = parseInt(hex1.slice(3, 5), 16)
    const b1 = parseInt(hex1.slice(5, 7), 16)
    const r2 = parseInt(hex2.slice(1, 3), 16)
    const g2 = parseInt(hex2.slice(3, 5), 16)
    const b2 = parseInt(hex2.slice(5, 7), 16)

    const r = Math.round(r1 + (r2 - r1) * ratio)
    const g = Math.round(g1 + (g2 - g1) * ratio)
    const b = Math.round(b1 + (b2 - b1) * ratio)

    return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("").toUpperCase()
}
