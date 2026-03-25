"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { PlusIcon, Trash2Icon, RotateCwIcon, TrophyIcon, MaximizeIcon, MinimizeIcon } from "lucide-react"

const PALETTE = [
    "#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6",
    "#1abc9c", "#e67e22", "#e91e63", "#00bcd4", "#ff5722",
    "#607d8b", "#795548", "#4caf50", "#ff9800", "#2196f3",
]

const STORAGE_KEY = "wheel-of-fate-options"
const FAB_STORAGE_KEY = "wheel-of-fate-fab"
const DEFAULT_OPTIONS = ["Alice", "Bob", "Charlie", "Diana"]

const LOGO_FAB = "/FabLogo.png"
const LOGO_DEFAULT = "/LogoOnlyCircularSVG.svg"

function loadOptions(): string[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            const parsed = JSON.parse(stored)
            if (Array.isArray(parsed) && parsed.length > 0) return parsed
        }
    } catch { /* use defaults */ }
    return DEFAULT_OPTIONS
}

function getColor(index: number) {
    return PALETTE[index % PALETTE.length]
}

export function WheelOfFate() {
    const [options, setOptions] = useState<string[]>(loadOptions)
    const [newOption, setNewOption] = useState("")
    const [isSpinning, setIsSpinning] = useState(false)
    const [winner, setWinner] = useState<string | null>(null)
    const [winnerIdx, setWinnerIdx] = useState<number | null>(null)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isFab, setIsFab] = useState(() => localStorage.getItem(FAB_STORAGE_KEY) === "true")

    const rootRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const rotationRef = useRef(0)
    const animationRef = useRef<number | null>(null)
    const optionsRef = useRef(options)
    const winnerIdxRef = useRef<number | null>(null)
    const logoRef = useRef<HTMLImageElement | null>(null)
    const isFabRef = useRef(isFab)

    useEffect(() => {
        optionsRef.current = options
        localStorage.setItem(STORAGE_KEY, JSON.stringify(options))
    }, [options])

    useEffect(() => {
        isFabRef.current = isFab
    }, [isFab])

    const drawWheel = useCallback((rotation: number, highlight: number | null) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const opts = optionsRef.current
        const n = opts.length
        const W = canvas.width
        const H = canvas.height
        const cx = W / 2
        const cy = H / 2

        ctx.clearRect(0, 0, W, H)

        if (n === 0) return

        const radius = Math.min(cx, cy) - 30
        if (radius <= 0) return

        const sliceAngle = (Math.PI * 2) / n

        // Draw slices
        for (let i = 0; i < n; i++) {
            const start = rotation - Math.PI / 2 + i * sliceAngle
            const end = start + sliceAngle

            ctx.beginPath()
            ctx.moveTo(cx, cy)
            ctx.arc(cx, cy, radius, start, end)
            ctx.closePath()

            ctx.fillStyle = highlight === i ? "#FFD700" : getColor(i)
            ctx.fill()

            ctx.strokeStyle = "rgba(255,255,255,0.35)"
            ctx.lineWidth = 2
            ctx.stroke()

            // Label
            const mid = start + sliceAngle / 2
            const tr = radius * 0.62
            const tx = cx + Math.cos(mid) * tr
            const ty = cy + Math.sin(mid) * tr

            ctx.save()
            ctx.translate(tx, ty)
            ctx.rotate(mid)

            const fontSize = Math.min(14, Math.max(7, 100 / n))
            ctx.font = `bold ${fontSize}px system-ui, sans-serif`
            ctx.fillStyle = highlight === i ? "#333" : "rgba(255,255,255,0.95)"
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"

            const label = opts[i].length > 16 ? opts[i].slice(0, 15) + "…" : opts[i]
            ctx.fillText(label, 0, 0, radius * 0.52)
            ctx.restore()
        }

        // Outer ring shadow
        ctx.beginPath()
        ctx.arc(cx, cy, radius, 0, Math.PI * 2)
        ctx.strokeStyle = "rgba(0,0,0,0.18)"
        ctx.lineWidth = 4
        ctx.stroke()

        // Center logo
        const logoSize = Math.max(48, radius * 0.32)
        ctx.save()
        ctx.beginPath()
        ctx.arc(cx, cy, logoSize / 2 + 6, 0, Math.PI * 2)
        ctx.fillStyle = "#fff"
        ctx.fill()
        ctx.strokeStyle = "rgba(0,0,0,0.15)"
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.restore()

        if (logoRef.current) {
            if (isFabRef.current) {
                const offscreen = document.createElement("canvas")
                offscreen.width = logoSize
                offscreen.height = logoSize
                const offCtx = offscreen.getContext("2d")!
                offCtx.drawImage(logoRef.current, 0, 0, logoSize, logoSize)
                offCtx.globalCompositeOperation = "source-in"
                offCtx.fillStyle = "#000"
                offCtx.fillRect(0, 0, logoSize, logoSize)
                ctx.drawImage(offscreen, cx - logoSize / 2, cy - logoSize / 2)
            } else {
                ctx.drawImage(logoRef.current, cx - logoSize / 2, cy - logoSize / 2, logoSize, logoSize)
            }
        }

        // Indicator triangle (top, pointing down into wheel)
        const tipY = cy - radius + 1
        const baseY = tipY - 22
        const hw = 11

        ctx.beginPath()
        ctx.moveTo(cx - hw, baseY)
        ctx.lineTo(cx + hw, baseY)
        ctx.lineTo(cx, tipY)
        ctx.closePath()
        ctx.fillStyle = "#fff"
        ctx.strokeStyle = "#555"
        ctx.lineWidth = 2
        ctx.fill()
        ctx.stroke()
    }, [])

    // Load center logo
    useEffect(() => {
        const img = new Image()
        img.src = isFab ? LOGO_FAB : LOGO_DEFAULT
        img.onload = () => {
            logoRef.current = img
            drawWheel(rotationRef.current, winnerIdxRef.current)
        }
    }, [drawWheel, isFab])

    // Setup canvas resize observer (stable — depends only on drawWheel which never changes)
    useEffect(() => {
        const container = containerRef.current
        const canvas = canvasRef.current
        if (!container || !canvas) return

        const resize = () => {
            canvas.width = container.clientWidth
            canvas.height = container.clientHeight
            drawWheel(rotationRef.current, winnerIdxRef.current)
        }

        resize()

        const observer = new ResizeObserver(resize)
        observer.observe(container)
        return () => observer.disconnect()
    }, [drawWheel])

    // Redraw when options or winner changes
    useEffect(() => {
        drawWheel(rotationRef.current, winnerIdx)
    }, [options, winnerIdx, drawWheel])

    const spin = useCallback(() => {
        if (isSpinning || optionsRef.current.length < 2) return

        setIsSpinning(true)
        setWinner(null)
        setWinnerIdx(null)
        winnerIdxRef.current = null

        if (animationRef.current) cancelAnimationFrame(animationRef.current)

        const totalRotation = Math.PI * 2 * (5 + Math.random() * 5)
        const duration = 3000 + Math.random() * 2000
        const startTime = performance.now()
        const startRot = rotationRef.current
        const endRot = startRot + totalRotation

        const animate = (now: number) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            // Ease out quart
            const eased = 1 - Math.pow(1 - progress, 4)

            rotationRef.current = startRot + totalRotation * eased
            drawWheel(rotationRef.current, null)

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate)
            } else {
                rotationRef.current = endRot

                const opts = optionsRef.current
                const n = opts.length
                const sliceAngle = (Math.PI * 2) / n
                // Normalize -endRot to [0, 2π) to find which slice is at the indicator
                const norm = ((-endRot) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)
                const idx = Math.floor(norm / sliceAngle) % n

                winnerIdxRef.current = idx
                setWinnerIdx(idx)
                setWinner(opts[idx])
                setIsSpinning(false)
                drawWheel(endRot, idx)
            }
        }

        animationRef.current = requestAnimationFrame(animate)
    }, [isSpinning, drawWheel])

    const addOption = () => {
        const t = newOption.trim()
        if (!t) return
        setOptions(prev => [...prev, t])
        setNewOption("")
        setWinner(null)
        setWinnerIdx(null)
        winnerIdxRef.current = null
    }

    const removeOption = (i: number) => {
        if (isSpinning) return
        setOptions(prev => prev.filter((_, idx) => idx !== i))
        setWinner(null)
        setWinnerIdx(null)
        winnerIdxRef.current = null
    }

    const toggleFab = () => {
        setIsFab(prev => {
            const next = !prev
            localStorage.setItem(FAB_STORAGE_KEY, String(next))
            return next
        })
    }

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            rootRef.current?.requestFullscreen()
        } else {
            document.exitFullscreen()
        }
    }, [])

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement)
        document.addEventListener("fullscreenchange", handler)
        return () => document.removeEventListener("fullscreenchange", handler)
    }, [])

    return (
        <div ref={rootRef} className="h-full flex flex-col-reverse md:flex-row min-h-0 bg-background">
            {/* Left panel — options list (hidden in fullscreen) */}
            {!isFullscreen && (
                <div className="w-full md:w-60 md:flex-shrink-0 max-h-48 md:max-h-none flex flex-col border-t md:border-t-0 md:border-r border-border">
                    <div className="flex items-center gap-2 px-3 h-9 border-b border-border flex-shrink-0">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Options
                        </span>
                        <div className="ml-auto flex items-center gap-2">
                            <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                <span className="text-xs font-medium text-muted-foreground">FAB</span>
                                <button
                                    role="switch"
                                    aria-checked={isFab}
                                    onClick={toggleFab}
                                    className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                                        isFab ? "bg-primary" : "bg-muted-foreground/30"
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-3 w-3 rounded-full bg-white transition-transform ${
                                            isFab ? "translate-x-3.5" : "translate-x-0.5"
                                        }`}
                                    />
                                </button>
                            </label>
                            <span className="text-xs text-muted-foreground">{options.length}</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-0 p-2">
                        <div className="space-y-1">
                            {options.map((opt, i) => (
                                <div
                                    key={i}
                                    className={`flex items-center gap-2 px-2.5 py-2.5 rounded-md text-sm transition-colors ${
                                        winnerIdx === i
                                            ? "bg-yellow-500/20 ring-1 ring-yellow-500/40"
                                            : "hover:bg-muted/50"
                                    }`}
                                >
                                    <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: getColor(i) }}
                                    />
                                    <span className="flex-1 truncate">{opt}</span>
                                    {winnerIdx === i && (
                                        <TrophyIcon className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />
                                    )}
                                    <button
                                        onClick={() => removeOption(i)}
                                        disabled={isSpinning}
                                        className="text-muted-foreground hover:text-destructive transition-colors disabled:pointer-events-none p-1 -mr-1"
                                    >
                                        <Trash2Icon className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}

                            {options.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-8">
                                    Add at least 2 options to spin
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Add option input */}
                    <div className="p-2 border-t border-border flex-shrink-0">
                        <div className="flex gap-1.5">
                            <input
                                type="text"
                                value={newOption}
                                onChange={e => setNewOption(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && addOption()}
                                placeholder="Add option..."
                                disabled={isSpinning}
                                className="flex-1 px-2 py-1 text-sm bg-muted/30 border border-border rounded-md outline-none focus:ring-1 focus:ring-ring focus:border-ring disabled:opacity-50 min-w-0"
                            />
                            <Button
                                variant="outline"
                                size="icon-xs"
                                onClick={addOption}
                                disabled={!newOption.trim() || isSpinning}
                            >
                                <PlusIcon />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Right panel — wheel */}
            <div className="flex-1 flex flex-col min-h-0">
                {/* Winner banner */}
                {winner ? (
                    <div className="flex items-center justify-center gap-2 h-9 px-4 bg-yellow-500/10 border-b border-yellow-500/30 flex-shrink-0">
                        <TrophyIcon className="h-3.5 w-3.5 text-yellow-500" />
                        <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                            {winner}
                        </span>
                    </div>
                ) : (
                    <div className="h-9 border-b border-border flex-shrink-0 flex items-center px-3">
                        <span className="text-xs text-muted-foreground">
                            {isSpinning ? "Spinning…" : "Press spin to pick a random option"}
                        </span>
                    </div>
                )}

                {/* Canvas */}
                <div ref={containerRef} className="flex-1 min-h-0 relative">
                    <canvas ref={canvasRef} className="absolute inset-0" />
                </div>

                {/* Spin button */}
                <div className="flex items-center justify-center gap-3 p-4 border-t border-border flex-shrink-0">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={toggleFullscreen}
                        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                    >
                        {isFullscreen ? <MinimizeIcon className="h-4 w-4" /> : <MaximizeIcon className="h-4 w-4" />}
                    </Button>
                    <Button
                        onClick={spin}
                        disabled={isSpinning || options.length < 2}
                        size="lg"
                        className="px-10 gap-2"
                    >
                        <RotateCwIcon className={`h-4 w-4 ${isSpinning ? "animate-spin" : ""}`} />
                        {isSpinning ? "Spinning…" : "Spin"}
                    </Button>
                    {options.length < 2 && !isSpinning && (
                        <span className="text-xs text-muted-foreground">Need at least 2 options</span>
                    )}
                </div>
            </div>
        </div>
    )
}
