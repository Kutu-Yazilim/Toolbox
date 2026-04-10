"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import QRCodeStyling, { type DotType, type CornerSquareType, type Options } from "qr-code-styling"
import { DownloadIcon, RefreshCwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useShareableUrl } from "@/hooks/useShareableUrl"
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { type Preset } from "@/components/shared/PresetsDrawer"
import { QR_PRESETS } from "./presets"

// ─── Dot type options ─────────────────────────────────────────────────────────

const DOT_TYPES: { value: DotType; label: string; preview: string }[] = [
    { value: "square", label: "Square", preview: "\u25A1" },
    { value: "rounded", label: "Rounded", preview: "\u25A2" },
    { value: "dots", label: "Dots", preview: "\u25CF" },
    { value: "classy", label: "Classy", preview: "\u25C6" },
    { value: "classy-rounded", label: "Classy +" , preview: "\u25C8" },
    { value: "extra-rounded", label: "Extra Round", preview: "\u2B1F" },
]

const CORNER_TYPES: { value: CornerSquareType; label: string }[] = [
    { value: "square", label: "Square" },
    { value: "dot", label: "Dot" },
    { value: "extra-rounded", label: "Rounded" },
]

const ERROR_LEVELS = ["L", "M", "Q", "H"] as const

const PRESET_COLORS = [
    { fg: "#000000", bg: "#ffffff", label: "Classic" },
    { fg: "#1e293b", bg: "#f8fafc", label: "Slate" },
    { fg: "#7c3aed", bg: "#faf5ff", label: "Violet" },
    { fg: "#0ea5e9", bg: "#f0f9ff", label: "Sky" },
    { fg: "#16a34a", bg: "#f0fdf4", label: "Green" },
    { fg: "#dc2626", bg: "#fef2f2", label: "Red" },
    { fg: "#ffffff", bg: "#18181b", label: "Inverted" },
]

// ─── QR instance (singleton, recreated on option change) ─────────────────────

function buildQrOptions(
    data: string,
    size: number,
    dotType: DotType,
    cornerType: CornerSquareType,
    fgColor: string,
    bgColor: string,
    errorLevel: "L" | "M" | "Q" | "H"
): Options {
    return {
        width: size,
        height: size,
        data: data || " ",
        margin: 12,
        qrOptions: { errorCorrectionLevel: errorLevel },
        dotsOptions: { type: dotType, color: fgColor },
        backgroundOptions: { color: bgColor },
        cornersSquareOptions: { type: cornerType, color: fgColor },
        cornersDotOptions: { color: fgColor },
        imageOptions: { crossOrigin: "anonymous", margin: 4 },
    }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface QrState {
    text: string
    dotType: DotType
    cornerType: CornerSquareType
    fgColor: string
    bgColor: string
    errorLevel: "L" | "M" | "Q" | "H"
}

const DEFAULT_STATE: QrState = {
    text: "https://kutu.io",
    dotType: "rounded",
    cornerType: "extra-rounded",
    fgColor: "#000000",
    bgColor: "#ffffff",
    errorLevel: "M",
}

export function QrGenerator() {
    const qrRef = useRef<HTMLDivElement>(null)
    const qrInstance = useRef<QRCodeStyling | null>(null)

    const [state, setState] = useLocalStorage<QrState>("qr-generator", DEFAULT_STATE)
    const [size] = useState(280)

    const { shareUrl } = useShareableUrl("qr-generator", state, (restored) => {
        setState(restored)
    })

    // Init QR instance
    useEffect(() => {
        const opts = buildQrOptions(state.text, size, state.dotType, state.cornerType, state.fgColor, state.bgColor, state.errorLevel)
        qrInstance.current = new QRCodeStyling(opts)
        if (qrRef.current) {
            qrRef.current.innerHTML = ""
            qrInstance.current.append(qrRef.current)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Update QR on any option change
    useEffect(() => {
        if (!qrInstance.current) return
        qrInstance.current.update(
            buildQrOptions(state.text, size, state.dotType, state.cornerType, state.fgColor, state.bgColor, state.errorLevel)
        )
    }, [state.text, size, state.dotType, state.cornerType, state.fgColor, state.bgColor, state.errorLevel])

    const handleDownload = useCallback(() => {
        qrInstance.current?.download({ name: "qr-code", extension: "png" })
    }, [])

    const handleReset = useCallback(() => {
        setState(DEFAULT_STATE)
    }, [setState])

    const handlePresetSelect = useCallback((preset: Preset) => {
        setState(prev => ({ ...prev, text: preset.content }))
    }, [setState])

    const applyPreset = useCallback((fg: string, bg: string) => {
        setState(prev => ({ ...prev, fgColor: fg, bgColor: bg }))
    }, [setState])

    const shortcuts: Shortcut[] = useMemo(() => [
        { key: "mod+shift+d", label: "Download PNG", action: handleDownload },
        { key: "mod+shift+r", label: "Reset settings", action: handleReset },
    ], [handleDownload, handleReset])

    useKeyboardShortcuts(shortcuts)

    return (
        <div className="h-full flex flex-col min-h-0 overflow-hidden">
            <ToolToolbar
                title="QR Generator"
                onShare={shareUrl}
                presets={QR_PRESETS}
                onPresetSelect={handlePresetSelect}
                shortcuts={shortcuts}
            />

            <div className="flex-1 flex flex-col-reverse md:flex-row min-h-0 overflow-hidden">
                {/* ── Left panel: controls ── */}
                <div className="w-full md:w-72 md:flex-shrink-0 flex flex-col border-t md:border-t-0 md:border-r border-border max-h-[50vh] md:max-h-none overflow-y-auto">

                    {/* Input */}
                    <div className="p-4 border-b border-border">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                            Content
                        </label>
                        <textarea
                            value={state.text}
                            onChange={e => setState(prev => ({ ...prev, text: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 text-sm bg-muted/30 border border-border rounded-lg text-foreground resize-none outline-none focus:ring-1 focus:ring-ring font-mono"
                            placeholder="URL, text, email, phone..."
                            spellCheck={false}
                        />
                    </div>

                    {/* Color presets */}
                    <div className="p-4 border-b border-border">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-2">
                            Color Preset
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {PRESET_COLORS.map(p => (
                                <button
                                    key={p.label}
                                    onClick={() => applyPreset(p.fg, p.bg)}
                                    title={p.label}
                                    className={cn(
                                        "w-7 h-7 rounded-md border-2 transition-all",
                                        state.fgColor === p.fg && state.bgColor === p.bg
                                            ? "border-primary scale-110 shadow"
                                            : "border-border hover:border-foreground/40"
                                    )}
                                    style={{ background: `linear-gradient(135deg, ${p.bg} 50%, ${p.fg} 50%)` }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Custom colors */}
                    <div className="p-4 border-b border-border space-y-3">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">
                            Custom Colors
                        </label>
                        <div className="space-y-2.5">
                            <div>
                                <span className="text-xs text-muted-foreground block mb-1">Foreground</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={state.fgColor}
                                        onChange={e => setState(prev => ({ ...prev, fgColor: e.target.value }))}
                                        className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent"
                                    />
                                    <input
                                        type="text"
                                        value={state.fgColor}
                                        onChange={e => setState(prev => ({ ...prev, fgColor: e.target.value }))}
                                        className="flex-1 px-2 py-1 text-xs font-mono bg-muted/30 border border-border rounded outline-none focus:ring-1 focus:ring-ring"
                                    />
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground block mb-1">Background</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={state.bgColor}
                                        onChange={e => setState(prev => ({ ...prev, bgColor: e.target.value }))}
                                        className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent"
                                    />
                                    <input
                                        type="text"
                                        value={state.bgColor}
                                        onChange={e => setState(prev => ({ ...prev, bgColor: e.target.value }))}
                                        className="flex-1 px-2 py-1 text-xs font-mono bg-muted/30 border border-border rounded outline-none focus:ring-1 focus:ring-ring"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dot type */}
                    <div className="p-4 border-b border-border">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-2">
                            Dot Style
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                            {DOT_TYPES.map(d => (
                                <button
                                    key={d.value}
                                    onClick={() => setState(prev => ({ ...prev, dotType: d.value }))}
                                    className={cn(
                                        "flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg border text-xs transition-all",
                                        state.dotType === d.value
                                            ? "border-primary bg-primary/10 text-foreground"
                                            : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                                    )}
                                >
                                    <span className="text-base leading-none">{d.preview}</span>
                                    <span className="text-[9px] leading-none mt-0.5">{d.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Corner type */}
                    <div className="p-4 border-b border-border">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-2">
                            Corner Style
                        </label>
                        <div className="flex gap-1.5">
                            {CORNER_TYPES.map(c => (
                                <button
                                    key={c.value}
                                    onClick={() => setState(prev => ({ ...prev, cornerType: c.value }))}
                                    className={cn(
                                        "flex-1 py-1.5 rounded-lg border text-xs transition-all",
                                        state.cornerType === c.value
                                            ? "border-primary bg-primary/10 text-foreground font-medium"
                                            : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                                    )}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Error correction level */}
                    <div className="p-4">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-2">
                            Error Correction
                        </label>
                        <div className="flex gap-1.5">
                            {ERROR_LEVELS.map(l => (
                                <button
                                    key={l}
                                    onClick={() => setState(prev => ({ ...prev, errorLevel: l }))}
                                    className={cn(
                                        "flex-1 py-1.5 rounded-lg border text-xs font-mono transition-all",
                                        state.errorLevel === l
                                            ? "border-primary bg-primary/10 text-foreground font-medium"
                                            : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                                    )}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
                            H = highest recovery (30%), smaller data capacity
                        </p>
                    </div>
                </div>

                {/* ── Right panel: preview + download ── */}
                <div className="flex-shrink-0 md:flex-1 flex flex-col items-center justify-center gap-6 p-4 md:p-8">
                    {/* QR preview */}
                    <div
                        className="rounded-2xl shadow-lg overflow-hidden ring-1 ring-border"
                        style={{ background: state.bgColor }}
                    >
                        <div ref={qrRef} />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <Button onClick={handleDownload} className="gap-2">
                            <DownloadIcon className="h-4 w-4" />
                            Download PNG
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleReset}
                            className="gap-2"
                        >
                            <RefreshCwIcon className="h-4 w-4" />
                            Reset
                        </Button>
                    </div>

                    {/* Info */}
                    {state.text && (
                        <p className="text-xs text-muted-foreground text-center max-w-xs">
                            <span className="font-mono">{state.text.length}</span> characters ·{" "}
                            Error correction <span className="font-mono">{state.errorLevel}</span>
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
