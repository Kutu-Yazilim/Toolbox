"use client"

import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { DownloadIcon, CopyIcon, CheckIcon } from "lucide-react"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useShareableUrl } from "@/hooks/useShareableUrl"
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { PLACEHOLDER_PRESETS } from "./presets"
import { type Preset } from "@/components/shared/PresetsDrawer"

const INPUT_CLASS =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"

const LABEL_CLASS = "block text-xs font-medium text-muted-foreground mb-1"

const DEFAULT_WIDTH = 800
const DEFAULT_HEIGHT = 600
const DEFAULT_BG_COLOR = "#cccccc"
const DEFAULT_TEXT_COLOR = "#666666"

function calcFontSize(w: number, h: number): number {
  return Math.max(12, Math.floor(Math.min(w, h) / 8))
}

type PlaceholderSettings = {
  width: number
  height: number
  bgColor: string
  textColor: string
  customText: string
  fontSizeOverride: string
}

export function PlaceholderImage() {
  const [settings, setSettings] = useLocalStorage<PlaceholderSettings>("placeholder-settings", {
    width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT,
    bgColor: DEFAULT_BG_COLOR, textColor: DEFAULT_TEXT_COLOR,
    customText: "", fontSizeOverride: "",
  })
  const [copied, setCopied] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const { width, height, bgColor, textColor, customText, fontSizeOverride } = settings

  const displayText = customText || `${width} x ${height}`
  const fontSize =
    fontSizeOverride && Number(fontSizeOverride) > 0
      ? Number(fontSizeOverride)
      : calcFontSize(width, height)

  const shareState = useMemo(() => ({
    width, height, bgColor, textColor, customText, fontSizeOverride,
  }), [width, height, bgColor, textColor, customText, fontSizeOverride])

  const { shareUrl } = useShareableUrl("placeholder-image", shareState, useCallback((state: PlaceholderSettings) => {
    setSettings(state)
  }, [setSettings]))

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    canvas.width = width
    canvas.height = height
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = textColor
    ctx.font = `bold ${fontSize}px sans-serif`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    const metrics = ctx.measureText(displayText)
    if (metrics.width > width * 0.9) {
      const scale = (width * 0.9) / metrics.width
      ctx.font = `bold ${Math.floor(fontSize * scale)}px sans-serif`
    }
    ctx.fillText(displayText, width / 2, height / 2)
  }, [width, height, bgColor, textColor, displayText, fontSize])

  useEffect(() => { draw() }, [draw])

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement("a")
    link.download = `placeholder-${width}x${height}.png`
    link.href = canvas.toDataURL("image/png")
    link.click()
  }, [width, height])

  const handleCopyDataUri = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    await navigator.clipboard.writeText(canvas.toDataURL("image/png"))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  const handlePresetSelect = useCallback((preset: Preset) => {
    const data = JSON.parse(preset.content)
    setSettings(prev => ({
      ...prev,
      width: data.width ?? prev.width,
      height: data.height ?? prev.height,
      bgColor: data.bgColor ?? prev.bgColor,
      textColor: data.textColor ?? prev.textColor,
    }))
  }, [setSettings])

  const updateSetting = useCallback(<K extends keyof PlaceholderSettings>(key: K, value: PlaceholderSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [setSettings])

  const shortcuts: Shortcut[] = useMemo(() => [
    { key: "mod+s", label: "Download PNG", action: handleDownload },
    { key: "mod+shift+c", label: "Copy Data URI", action: handleCopyDataUri },
  ], [handleDownload, handleCopyDataUri])

  useKeyboardShortcuts(shortcuts)

  const exportOptions = useMemo(() => [
    { label: "Download PNG", action: handleDownload },
    { label: "Copy Data URI", action: handleCopyDataUri },
  ], [handleDownload, handleCopyDataUri])

  return (
    <div className="flex h-full flex-col">
      <ToolToolbar
        title="Placeholder Image"
        status={{ type: "info", label: `${width}x${height}` }}
        onShare={shareUrl}
        exportOptions={exportOptions}
        presets={PLACEHOLDER_PRESETS}
        onPresetSelect={handlePresetSelect}
        shortcuts={shortcuts}
      />
      <div className="flex flex-1 flex-col gap-4 overflow-auto p-4 lg:flex-row">
        <div className="flex w-full flex-col gap-4 lg:w-72 lg:shrink-0">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Dimensions</h3>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className={LABEL_CLASS}>Width</label>
                <input type="number" className={INPUT_CLASS} value={width} min={1} max={4096}
                  onChange={(e) => updateSetting("width", Math.max(1, Math.min(4096, Number(e.target.value) || 1)))} />
              </div>
              <div className="flex-1">
                <label className={LABEL_CLASS}>Height</label>
                <input type="number" className={INPUT_CLASS} value={height} min={1} max={4096}
                  onChange={(e) => updateSetting("height", Math.max(1, Math.min(4096, Number(e.target.value) || 1)))} />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Colors</h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className={LABEL_CLASS}>Background</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={bgColor} onChange={(e) => updateSetting("bgColor", e.target.value)} className="h-9 w-9 shrink-0 cursor-pointer rounded border border-input bg-transparent p-0.5" />
                  <input type="text" className={INPUT_CLASS} value={bgColor} onChange={(e) => updateSetting("bgColor", e.target.value)} />
                </div>
              </div>
              <div>
                <label className={LABEL_CLASS}>Text</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={textColor} onChange={(e) => updateSetting("textColor", e.target.value)} className="h-9 w-9 shrink-0 cursor-pointer rounded border border-input bg-transparent p-0.5" />
                  <input type="text" className={INPUT_CLASS} value={textColor} onChange={(e) => updateSetting("textColor", e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Text</h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className={LABEL_CLASS}>Label</label>
                <input type="text" className={INPUT_CLASS} value={customText} placeholder={`${width} x ${height}`} onChange={(e) => updateSetting("customText", e.target.value)} />
              </div>
              <div>
                <label className={LABEL_CLASS}>Font Size <span className="text-muted-foreground/60">(auto: {calcFontSize(width, height)}px)</span></label>
                <input type="number" className={INPUT_CLASS} value={fontSizeOverride} placeholder={String(calcFontSize(width, height))} min={1} max={999} onChange={(e) => updateSetting("fontSizeOverride", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={handleDownload} className="w-full gap-2">
              <DownloadIcon className="h-4 w-4" />Download PNG
            </Button>
            <Button variant="outline" onClick={handleCopyDataUri} className="w-full gap-2">
              {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy Data URI"}
            </Button>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center overflow-auto rounded-lg border border-border bg-muted/30 p-4">
          <canvas ref={canvasRef} className="max-h-full max-w-full" style={{ imageRendering: "auto" }} />
        </div>
      </div>
    </div>
  )
}
