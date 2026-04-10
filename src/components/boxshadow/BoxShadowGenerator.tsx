"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { CopyIcon, CheckIcon, PlusIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useShareableUrl } from "@/hooks/useShareableUrl"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { type Preset } from "@/components/shared/PresetsDrawer"
import { BOX_SHADOW_PRESETS } from "./presets"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ShadowLayer = {
  id: number
  x: number
  y: number
  blur: number
  spread: number
  color: string
  inset: boolean
}

type CopiedKey = "css" | "flutter" | null

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_LAYER: Omit<ShadowLayer, "id"> = {
  x: 5,
  y: 5,
  blur: 15,
  spread: 0,
  color: "#00000040",
  inset: false,
}

const SLIDER_CONFIGS = [
  { key: "x" as const, label: "X Offset", min: -50, max: 50 },
  { key: "y" as const, label: "Y Offset", min: -50, max: 50 },
  { key: "blur" as const, label: "Blur", min: 0, max: 100 },
  { key: "spread" as const, label: "Spread", min: -50, max: 50 },
] as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let nextId = 1

function createLayer(overrides?: Partial<Omit<ShadowLayer, "id">>): ShadowLayer {
  return { ...DEFAULT_LAYER, ...overrides, id: nextId++ }
}

function parseHexColor(hex: string): { r: number; g: number; b: number; a: number } {
  const clean = hex.replace("#", "")
  if (clean.length === 6) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
      a: 255,
    }
  }
  if (clean.length === 8) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
      a: parseInt(clean.slice(6, 8), 16),
    }
  }
  return { r: 0, g: 0, b: 0, a: 255 }
}

function hexToRgba(hex: string): string {
  const { r, g, b, a } = parseHexColor(hex)
  return `rgba(${r},${g},${b},${(a / 255).toFixed(2)})`
}

function hexToFlutterColor(hex: string): string {
  const { r, g, b, a } = parseHexColor(hex)
  const toHex = (n: number) => n.toString(16).toUpperCase().padStart(2, "0")
  return `Color(0x${toHex(a)}${toHex(r)}${toHex(g)}${toHex(b)})`
}

function layerToCss(layer: ShadowLayer): string {
  const insetStr = layer.inset ? "inset " : ""
  return `${insetStr}${layer.x}px ${layer.y}px ${layer.blur}px ${layer.spread}px ${hexToRgba(layer.color)}`
}

function layerToFlutter(layer: ShadowLayer): string {
  const lines = [
    `  BoxShadow(`,
    `    offset: Offset(${layer.x}, ${layer.y}),`,
    `    blurRadius: ${layer.blur},`,
    `    spreadRadius: ${layer.spread},`,
    `    color: ${hexToFlutterColor(layer.color)},`,
  ]
  if (layer.inset) {
    lines.push(`    // Note: Flutter does not natively support inset shadows in BoxShadow`)
  }
  lines.push(`  )`)
  return lines.join("\n")
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type ShadowState = Omit<ShadowLayer, "id">[]

export function BoxShadowGenerator() {
  const [savedLayers, setSavedLayers] = useLocalStorage<ShadowState>("box-shadow-state", [{ ...DEFAULT_LAYER }])
  const [layers, setLayers] = useState<ShadowLayer[]>(() => savedLayers.map(l => createLayer(l)))
  const [copied, setCopied] = useState<CopiedKey>(null)

  const updateLayer = useCallback((id: number, patch: Partial<Omit<ShadowLayer, "id">>) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }, [])

  const removeLayer = useCallback((id: number) => {
    setLayers((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev))
  }, [])

  const addLayer = useCallback(() => {
    setLayers((prev) => [...prev, createLayer()])
  }, [])

  const cssValue = useMemo(() => layers.map(layerToCss).join(", "), [layers])

  const cssSnippet = useMemo(() => `box-shadow: ${cssValue};`, [cssValue])

  const flutterSnippet = useMemo(() => {
    if (layers.length === 1) {
      return layerToFlutter(layers[0])
    }
    return `[\n${layers.map(layerToFlutter).join(",\n")},\n]`
  }, [layers])

  const handleCopy = useCallback(
    (key: CopiedKey) => {
      const text = key === "css" ? cssSnippet : flutterSnippet
      navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    },
    [cssSnippet, flutterSnippet],
  )

  // Persist to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      setSavedLayers(layers.map(({ id, ...rest }) => rest))
    }, 500)
    return () => clearTimeout(timer)
  }, [layers, setSavedLayers])

  // Shareable URL
  const shareableState = useMemo(() => layers.map(({ id, ...rest }) => rest), [layers])
  const { shareUrl } = useShareableUrl("box-shadow-generator", shareableState, useCallback((state: ShadowState) => {
    setLayers(state.map(l => createLayer(l)))
  }, []))

  // Preset handling
  const handlePresetSelect = useCallback((preset: Preset) => {
    const data = JSON.parse(preset.content) as ShadowState
    setLayers(data.map(l => createLayer(l)))
  }, [])

  // Export options
  const exportOptions = useMemo(() => [
    { label: "Copy CSS", action: () => navigator.clipboard.writeText(cssSnippet) },
    { label: "Copy Flutter", action: () => navigator.clipboard.writeText(flutterSnippet) },
    {
      label: "Download CSS",
      action: () => {
        const blob = new Blob([cssSnippet], { type: "text/css" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "box-shadow.css"
        a.click()
        URL.revokeObjectURL(url)
      },
    },
  ], [cssSnippet, flutterSnippet])

  // Keyboard shortcuts
  const shortcuts = useMemo(() => [
    { key: "mod+shift+c", label: "Copy CSS", action: () => navigator.clipboard.writeText(cssSnippet) },
    { key: "mod+shift+f", label: "Copy Flutter", action: () => navigator.clipboard.writeText(flutterSnippet) },
    { key: "mod+shift+s", label: "Share URL", action: () => { shareUrl() } },
  ], [cssSnippet, flutterSnippet, shareUrl])

  useKeyboardShortcuts(shortcuts)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ToolToolbar
        title="Box Shadow Generator"
        copyValue={cssSnippet}
        onShare={shareUrl}
        exportOptions={exportOptions}
        presets={BOX_SHADOW_PRESETS}
        onPresetSelect={handlePresetSelect}
        shortcuts={shortcuts}
      />
      <div className="flex flex-1 gap-4 overflow-hidden p-4">
      {/* Left panel – controls */}
      <div className="flex w-2/5 min-w-0 flex-col gap-3 overflow-y-auto pr-1">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Shadow Layers</h2>
          <Button variant="outline" size="sm" onClick={addLayer}>
            <PlusIcon className="mr-1 h-3.5 w-3.5" />
            Add Layer
          </Button>
        </div>

        {layers.map((layer, idx) => (
          <div
            key={layer.id}
            className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Layer {idx + 1}
              </span>
              <button
                className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                onClick={() => removeLayer(layer.id)}
                disabled={layers.length === 1}
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            {SLIDER_CONFIGS.map(({ key, label, min, max }) => (
              <div key={key} className="flex items-center gap-2">
                <label className="w-16 shrink-0 text-xs text-muted-foreground">{label}</label>
                <input
                  type="range"
                  min={min}
                  max={max}
                  value={layer[key]}
                  onChange={(e) => updateLayer(layer.id, { [key]: Number(e.target.value) })}
                  className="h-1.5 flex-1 cursor-pointer appearance-none rounded bg-muted accent-primary"
                />
                <span className="w-8 text-right text-xs tabular-nums text-foreground">
                  {layer[key]}
                </span>
              </div>
            ))}

            <div className="flex items-center gap-2">
              <label className="w-16 shrink-0 text-xs text-muted-foreground">Color</label>
              <input
                type="color"
                value={layer.color.slice(0, 7)}
                onChange={(e) => {
                  const alpha = layer.color.length === 9 ? layer.color.slice(7) : "40"
                  updateLayer(layer.id, { color: e.target.value + alpha })
                }}
                className="h-7 w-7 shrink-0 cursor-pointer rounded border border-border bg-transparent"
              />
              <input
                type="text"
                value={layer.color}
                onChange={(e) => updateLayer(layer.id, { color: e.target.value })}
                className="h-7 flex-1 rounded border border-border bg-background px-2 text-xs text-foreground"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="w-16 shrink-0 text-xs text-muted-foreground">Inset</label>
              <input
                type="checkbox"
                checked={layer.inset}
                onChange={(e) => updateLayer(layer.id, { inset: e.target.checked })}
                className="h-4 w-4 cursor-pointer accent-primary"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Right panel – preview + export */}
      <div className="flex w-3/5 min-w-0 flex-col gap-4 overflow-y-auto">
        {/* Preview */}
        <div className="flex flex-1 items-center justify-center rounded-lg bg-muted p-8">
          <div
            className="flex h-48 w-64 items-center justify-center rounded-xl bg-white p-6"
            style={{ boxShadow: cssValue }}
          >
            <p className="text-center text-sm font-medium text-gray-700">
              Preview Card
            </p>
          </div>
        </div>

        {/* Export CSS */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">CSS</span>
            <Button variant="outline" size="sm" onClick={() => handleCopy("css")}>
              {copied === "css" ? (
                <CheckIcon className="mr-1 h-3.5 w-3.5" />
              ) : (
                <CopyIcon className="mr-1 h-3.5 w-3.5" />
              )}
              {copied === "css" ? "Copied" : "Copy"}
            </Button>
          </div>
          <pre className="overflow-x-auto rounded-md border border-border bg-card p-3 text-xs text-foreground">
            {cssSnippet}
          </pre>
        </div>

        {/* Export Flutter */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Flutter</span>
            <Button variant="outline" size="sm" onClick={() => handleCopy("flutter")}>
              {copied === "flutter" ? (
                <CheckIcon className="mr-1 h-3.5 w-3.5" />
              ) : (
                <CopyIcon className="mr-1 h-3.5 w-3.5" />
              )}
              {copied === "flutter" ? "Copied" : "Copy"}
            </Button>
          </div>
          <pre className="overflow-x-auto rounded-md border border-border bg-card p-3 text-xs text-foreground">
            {flutterSnippet}
          </pre>
        </div>
      </div>
      </div>
    </div>
  )
}
