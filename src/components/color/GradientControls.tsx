"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PlusIcon, TrashIcon, CopyIcon, CheckIcon } from "lucide-react"
import { type GradientConfig, type GradientStop } from "./colorTypes"
import { generateGradientCss, generateGradientTailwind, generateGradientSvg } from "./gradientUtils"

const GRADIENT_TYPES: GradientConfig["type"][] = ["linear", "radial", "conic"]
const EASING_OPTIONS: GradientConfig["easing"][] = ["linear", "ease-in", "ease-out", "ease-in-out"]
const MIN_STOPS = 2

type OutputTab = "css" | "tailwind" | "svg"
const OUTPUT_TABS: { label: string; value: OutputTab }[] = [
    { label: "CSS", value: "css" },
    { label: "Tailwind", value: "tailwind" },
    { label: "SVG", value: "svg" },
]

interface GradientControlsProps {
    config: GradientConfig
    onChange: (config: GradientConfig) => void
    selectedStopId: string | null
    onColorClick: (stopId: string) => void
}

export function GradientControls({ config, onChange, selectedStopId, onColorClick }: GradientControlsProps) {
    const [outputTab, setOutputTab] = useState<OutputTab>("css")
    const [copied, setCopied] = useState(false)

    const updateStop = (id: string, updates: Partial<GradientStop>) => {
        onChange({
            ...config,
            stops: config.stops.map(s => s.id === id ? { ...s, ...updates } : s),
        })
    }

    const removeStop = (id: string) => {
        if (config.stops.length <= MIN_STOPS) return
        onChange({ ...config, stops: config.stops.filter(s => s.id !== id) })
    }

    const addStop = () => {
        const sorted = [...config.stops].sort((a, b) => a.position - b.position)
        const lastPos = sorted[sorted.length - 1]?.position ?? 0
        const position = Math.min(100, lastPos + 10)

        onChange({
            ...config,
            stops: [
                ...config.stops,
                {
                    id: `stop-${Date.now()}`,
                    color: "#888888",
                    position,
                },
            ],
        })
    }

    const outputCode = (() => {
        switch (outputTab) {
            case "css": return generateGradientCss(config)
            case "tailwind": return generateGradientTailwind(config)
            case "svg": return generateGradientSvg(config)
        }
    })()

    const handleCopy = () => {
        navigator.clipboard.writeText(outputCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Type pills */}
            <div className="flex flex-col gap-1.5">
                <span className="text-xs text-muted-foreground">Type</span>
                <div className="flex items-center gap-1">
                    {GRADIENT_TYPES.map(type => (
                        <button
                            key={type}
                            onClick={() => onChange({ ...config, type })}
                            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                                config.type === type
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Angle / Center controls */}
            <div className="flex items-end gap-3">
                {config.type === "linear" && (
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs text-muted-foreground">Angle</span>
                        <input
                            type="number"
                            min={0}
                            max={360}
                            value={config.angle}
                            onChange={e => onChange({ ...config, angle: Number(e.target.value) % 360 })}
                            className="w-20 px-2 py-1 text-xs font-mono bg-muted/30 border border-border rounded-md outline-none focus:border-ring text-foreground"
                        />
                    </div>
                )}

                {(config.type === "radial" || config.type === "conic") && (
                    <>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-xs text-muted-foreground">Center X%</span>
                            <input
                                type="number"
                                min={0}
                                max={100}
                                value={config.centerX}
                                onChange={e => onChange({ ...config, centerX: Number(e.target.value) })}
                                className="w-20 px-2 py-1 text-xs font-mono bg-muted/30 border border-border rounded-md outline-none focus:border-ring text-foreground"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-xs text-muted-foreground">Center Y%</span>
                            <input
                                type="number"
                                min={0}
                                max={100}
                                value={config.centerY}
                                onChange={e => onChange({ ...config, centerY: Number(e.target.value) })}
                                className="w-20 px-2 py-1 text-xs font-mono bg-muted/30 border border-border rounded-md outline-none focus:border-ring text-foreground"
                            />
                        </div>
                        {config.type === "conic" && (
                            <div className="flex flex-col gap-1.5">
                                <span className="text-xs text-muted-foreground">Angle</span>
                                <input
                                    type="number"
                                    min={0}
                                    max={360}
                                    value={config.angle}
                                    onChange={e => onChange({ ...config, angle: Number(e.target.value) % 360 })}
                                    className="w-20 px-2 py-1 text-xs font-mono bg-muted/30 border border-border rounded-md outline-none focus:border-ring text-foreground"
                                />
                            </div>
                        )}
                    </>
                )}

                {/* Easing */}
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-muted-foreground">Easing</span>
                    <select
                        value={config.easing}
                        onChange={e => onChange({ ...config, easing: e.target.value as GradientConfig["easing"] })}
                        className="px-2 py-1 text-xs bg-muted/30 border border-border rounded-md outline-none focus:border-ring text-foreground"
                    >
                        {EASING_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Stops table */}
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Stops</span>
                    <Button variant="ghost" size="xs" onClick={addStop}>
                        <PlusIcon className="h-3 w-3" />
                        <span className="text-xs">Add</span>
                    </Button>
                </div>
                <div className="flex flex-col gap-1">
                    {[...config.stops]
                        .sort((a, b) => a.position - b.position)
                        .map(stop => (
                            <div
                                key={stop.id}
                                className={`flex items-center gap-2 px-2 py-1 rounded-md ${
                                    selectedStopId === stop.id ? "bg-muted/50" : ""
                                }`}
                            >
                                <button
                                    className="w-6 h-6 rounded border border-border shadow-sm flex-shrink-0 cursor-pointer"
                                    style={{ backgroundColor: stop.color }}
                                    onClick={() => onColorClick(stop.id)}
                                    title="Change color"
                                />
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={stop.position}
                                    onChange={e => updateStop(stop.id, { position: Number(e.target.value) })}
                                    className="w-16 px-1.5 py-0.5 text-xs font-mono bg-muted/30 border border-border rounded outline-none focus:border-ring text-foreground"
                                />
                                <span className="text-[10px] text-muted-foreground font-mono">{stop.color}</span>
                                <div className="flex-1" />
                                <Button
                                    variant="ghost"
                                    size="xs"
                                    onClick={() => removeStop(stop.id)}
                                    disabled={config.stops.length <= MIN_STOPS}
                                >
                                    <TrashIcon className="h-3 w-3 text-muted-foreground" />
                                </Button>
                            </div>
                        ))}
                </div>
            </div>

            {/* Output section */}
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        {OUTPUT_TABS.map(({ label, value }) => (
                            <button
                                key={value}
                                onClick={() => setOutputTab(value)}
                                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                                    outputTab === value
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <Button variant="ghost" size="xs" onClick={handleCopy}>
                        {copied ? (
                            <CheckIcon className="h-3 w-3 text-green-500" />
                        ) : (
                            <CopyIcon className="h-3 w-3" />
                        )}
                    </Button>
                </div>
                <pre className="px-3 py-2 text-xs font-mono bg-muted/30 border border-border rounded-md overflow-x-auto text-foreground whitespace-pre-wrap break-all">
                    {outputCode}
                </pre>
            </div>
        </div>
    )
}
