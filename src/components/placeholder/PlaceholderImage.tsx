"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DownloadIcon, CopyIcon, CheckIcon } from "lucide-react"

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

export function PlaceholderImage() {
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [height, setHeight] = useState(DEFAULT_HEIGHT)
  const [bgColor, setBgColor] = useState(DEFAULT_BG_COLOR)
  const [textColor, setTextColor] = useState(DEFAULT_TEXT_COLOR)
  const [customText, setCustomText] = useState("")
  const [fontSizeOverride, setFontSizeOverride] = useState<string>("")
  const [copied, setCopied] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const displayText = customText || `${width} x ${height}`
  const fontSize =
    fontSizeOverride && Number(fontSizeOverride) > 0
      ? Number(fontSizeOverride)
      : calcFontSize(width, height)

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
    const textWidth = metrics.width
    // If text is wider than canvas, scale down
    if (textWidth > width * 0.9) {
      const scale = (width * 0.9) / textWidth
      ctx.font = `bold ${Math.floor(fontSize * scale)}px sans-serif`
    }

    ctx.fillText(displayText, width / 2, height / 2)
  }, [width, height, bgColor, textColor, displayText, fontSize])

  useEffect(() => {
    draw()
  }, [draw])

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
    const dataUri = canvas.toDataURL("image/png")
    await navigator.clipboard.writeText(dataUri)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-4 lg:flex-row">
      {/* Controls */}
      <div className="flex w-full flex-col gap-4 lg:w-72 lg:shrink-0">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Dimensions
          </h3>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className={LABEL_CLASS}>Width</label>
              <input
                type="number"
                className={INPUT_CLASS}
                value={width}
                min={1}
                max={4096}
                onChange={(e) =>
                  setWidth(Math.max(1, Math.min(4096, Number(e.target.value) || 1)))
                }
              />
            </div>
            <div className="flex-1">
              <label className={LABEL_CLASS}>Height</label>
              <input
                type="number"
                className={INPUT_CLASS}
                value={height}
                min={1}
                max={4096}
                onChange={(e) =>
                  setHeight(Math.max(1, Math.min(4096, Number(e.target.value) || 1)))
                }
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Colors</h3>
          <div className="flex flex-col gap-3">
            <div>
              <label className={LABEL_CLASS}>Background</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="h-9 w-9 shrink-0 cursor-pointer rounded border border-input bg-transparent p-0.5"
                />
                <input
                  type="text"
                  className={INPUT_CLASS}
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className={LABEL_CLASS}>Text</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="h-9 w-9 shrink-0 cursor-pointer rounded border border-input bg-transparent p-0.5"
                />
                <input
                  type="text"
                  className={INPUT_CLASS}
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Text</h3>
          <div className="flex flex-col gap-3">
            <div>
              <label className={LABEL_CLASS}>Label</label>
              <input
                type="text"
                className={INPUT_CLASS}
                value={customText}
                placeholder={`${width} x ${height}`}
                onChange={(e) => setCustomText(e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>
                Font Size{" "}
                <span className="text-muted-foreground/60">
                  (auto: {calcFontSize(width, height)}px)
                </span>
              </label>
              <input
                type="number"
                className={INPUT_CLASS}
                value={fontSizeOverride}
                placeholder={String(calcFontSize(width, height))}
                min={1}
                max={999}
                onChange={(e) => setFontSizeOverride(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={handleDownload} className="w-full gap-2">
            <DownloadIcon className="h-4 w-4" />
            Download PNG
          </Button>
          <Button
            variant="outline"
            onClick={handleCopyDataUri}
            className="w-full gap-2"
          >
            {copied ? (
              <CheckIcon className="h-4 w-4" />
            ) : (
              <CopyIcon className="h-4 w-4" />
            )}
            {copied ? "Copied!" : "Copy Data URI"}
          </Button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex flex-1 items-center justify-center overflow-auto rounded-lg border border-border bg-muted/30 p-4">
        <canvas
          ref={canvasRef}
          className="max-h-full max-w-full"
          style={{ imageRendering: "auto" }}
        />
      </div>
    </div>
  )
}
