"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  UploadIcon,
  CopyIcon,
  CheckIcon,
  Trash2Icon,
  ImageIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

type PickedColor = {
  hex: string
  rgb: string
  hsl: string
}

const MAGNIFIER_SIZE = 120
const MAGNIFIER_PIXELS = 11
const MAX_RECENT_PICKS = 20

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")
  ).toUpperCase()
}

function rgbToHsl(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; l: number } {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
  else if (max === gn) h = ((bn - rn) / d + 2) / 6
  else h = ((rn - gn) / d + 4) / 6
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

function formatRgb(r: number, g: number, b: number): string {
  return `rgb(${r}, ${g}, ${b})`
}

function formatHsl(h: number, s: number, l: number): string {
  return `hsl(${h}, ${s}%, ${l}%)`
}

function textColorForBg(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? "#000000" : "#FFFFFF"
}

export function ImageColorPicker() {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [hoverColor, setHoverColor] = useState<PickedColor | null>(null)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(
    null,
  )
  const [recentPicks, setRecentPicks] = useState<PickedColor[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const magnifierCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  const loadImage = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const src = e.target?.result as string
      const img = new Image()
      img.onload = () => {
        imgRef.current = img
        setImageSrc(src)
        setHoverColor(null)
        setCursorPos(null)
        setRecentPicks([])
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  }, [])

  useEffect(() => {
    if (!imageSrc || !imgRef.current || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const img = imgRef.current
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    ctx.drawImage(img, 0, 0)
  }, [imageSrc])

  const getPixelColor = useCallback(
    (
      clientX: number,
      clientY: number,
    ): { r: number; g: number; b: number; canvasX: number; canvasY: number } | null => {
      const canvas = canvasRef.current
      if (!canvas) return null
      const ctx = canvas.getContext("2d")
      if (!ctx) return null

      const displayEl = containerRef.current?.querySelector(
        "img",
      ) as HTMLImageElement | null
      if (!displayEl) return null

      const rect = displayEl.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      const canvasX = Math.floor((clientX - rect.left) * scaleX)
      const canvasY = Math.floor((clientY - rect.top) * scaleY)

      if (
        canvasX < 0 ||
        canvasY < 0 ||
        canvasX >= canvas.width ||
        canvasY >= canvas.height
      )
        return null

      const pixel = ctx.getImageData(canvasX, canvasY, 1, 1).data
      return { r: pixel[0], g: pixel[1], b: pixel[2], canvasX, canvasY }
    },
    [],
  )

  const drawMagnifier = useCallback(
    (canvasX: number, canvasY: number) => {
      const srcCanvas = canvasRef.current
      const magCanvas = magnifierCanvasRef.current
      if (!srcCanvas || !magCanvas) return
      const srcCtx = srcCanvas.getContext("2d")
      const magCtx = magCanvas.getContext("2d")
      if (!srcCtx || !magCtx) return

      const half = Math.floor(MAGNIFIER_PIXELS / 2)
      const sx = canvasX - half
      const sy = canvasY - half

      magCanvas.width = MAGNIFIER_SIZE
      magCanvas.height = MAGNIFIER_SIZE
      magCtx.imageSmoothingEnabled = false

      magCtx.clearRect(0, 0, MAGNIFIER_SIZE, MAGNIFIER_SIZE)

      magCtx.save()
      magCtx.beginPath()
      magCtx.arc(
        MAGNIFIER_SIZE / 2,
        MAGNIFIER_SIZE / 2,
        MAGNIFIER_SIZE / 2,
        0,
        Math.PI * 2,
      )
      magCtx.clip()

      magCtx.drawImage(
        srcCanvas,
        sx,
        sy,
        MAGNIFIER_PIXELS,
        MAGNIFIER_PIXELS,
        0,
        0,
        MAGNIFIER_SIZE,
        MAGNIFIER_SIZE,
      )

      // Draw crosshair
      const cellSize = MAGNIFIER_SIZE / MAGNIFIER_PIXELS
      const centerX = half * cellSize
      const centerY = half * cellSize
      magCtx.strokeStyle = "rgba(255,255,255,0.8)"
      magCtx.lineWidth = 2
      magCtx.strokeRect(centerX, centerY, cellSize, cellSize)
      magCtx.strokeStyle = "rgba(0,0,0,0.4)"
      magCtx.lineWidth = 1
      magCtx.strokeRect(centerX, centerY, cellSize, cellSize)

      magCtx.restore()

      // Draw border ring
      magCtx.beginPath()
      magCtx.arc(
        MAGNIFIER_SIZE / 2,
        MAGNIFIER_SIZE / 2,
        MAGNIFIER_SIZE / 2 - 1,
        0,
        Math.PI * 2,
      )
      magCtx.strokeStyle = "rgba(255,255,255,0.9)"
      magCtx.lineWidth = 3
      magCtx.stroke()
      magCtx.strokeStyle = "rgba(0,0,0,0.3)"
      magCtx.lineWidth = 1
      magCtx.stroke()
    },
    [],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const result = getPixelColor(e.clientX, e.clientY)
      if (!result) {
        setCursorPos(null)
        setHoverColor(null)
        return
      }
      const { r, g, b, canvasX, canvasY } = result
      const hex = rgbToHex(r, g, b)
      const { h, s, l } = rgbToHsl(r, g, b)

      const displayEl = containerRef.current?.querySelector(
        "img",
      ) as HTMLImageElement | null
      if (!displayEl) return
      const containerRect = containerRef.current!.getBoundingClientRect()

      setCursorPos({
        x: e.clientX - containerRect.left,
        y: e.clientY - containerRect.top,
      })
      setHoverColor({
        hex,
        rgb: formatRgb(r, g, b),
        hsl: formatHsl(h, s, l),
      })
      drawMagnifier(canvasX, canvasY)
    },
    [getPixelColor, drawMagnifier],
  )

  const handleMouseLeave = useCallback(() => {
    setCursorPos(null)
    setHoverColor(null)
  }, [])

  const handleClick = useCallback(
    (_e: React.MouseEvent) => {
      if (!hoverColor) return
      setRecentPicks((prev) => {
        const filtered = prev.filter((p) => p.hex !== hoverColor.hex)
        return [hoverColor, ...filtered].slice(0, MAX_RECENT_PICKS)
      })
    },
    [hoverColor],
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file && file.type.startsWith("image/")) loadImage(file)
    },
    [loadImage],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file && file.type.startsWith("image/")) loadImage(file)
    },
    [loadImage],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => setIsDragging(false), [])

  const copyToClipboard = useCallback(
    (text: string, index: number | null, format: string) => {
      navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setCopiedFormat(format)
      setTimeout(() => {
        setCopiedIndex(null)
        setCopiedFormat(null)
      }, 1500)
    },
    [],
  )

  const magnifierOffset = MAGNIFIER_SIZE / 2 + 20

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-4 lg:flex-row">
      {/* Left: Image area */}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {!imageSrc ? (
          <div
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50",
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Drag & drop an image here, or
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadIcon className="mr-2 h-4 w-4" />
              Choose File
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadIcon className="mr-2 h-4 w-4" />
                Change Image
              </Button>
            </div>
            <div
              ref={containerRef}
              className="relative flex flex-1 items-start justify-center overflow-auto rounded-lg border border-border bg-muted/30"
              style={{ cursor: "crosshair" }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <img
                src={imageSrc}
                alt="Uploaded"
                className="max-h-full max-w-full object-contain"
                draggable={false}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Magnifier */}
              {cursorPos && hoverColor && (
                <div
                  className="pointer-events-none absolute z-10"
                  style={{
                    left: cursorPos.x + magnifierOffset,
                    top: cursorPos.y - MAGNIFIER_SIZE / 2,
                    width: MAGNIFIER_SIZE,
                    height: MAGNIFIER_SIZE + 32,
                  }}
                >
                  <canvas
                    ref={magnifierCanvasRef}
                    width={MAGNIFIER_SIZE}
                    height={MAGNIFIER_SIZE}
                    className="rounded-full shadow-lg"
                  />
                  <div
                    className="mt-1 rounded px-2 py-0.5 text-center text-xs font-mono font-medium"
                    style={{
                      backgroundColor: hoverColor.hex,
                      color: textColorForBg(hoverColor.hex),
                    }}
                  >
                    {hoverColor.hex}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right: Color info & recent picks */}
      <div className="flex w-full flex-col gap-4 lg:w-80">
        {/* Current hover color */}
        {hoverColor && (
          <div className="rounded-lg border border-border p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Current Color
            </p>
            <div
              className="mb-3 h-16 w-full rounded-md border border-border"
              style={{ backgroundColor: hoverColor.hex }}
            />
            <div className="flex flex-col gap-1.5">
              <ColorFormatRow
                label="HEX"
                value={hoverColor.hex}
                onCopy={() => copyToClipboard(hoverColor.hex, null, "hex-hover")}
                copied={copiedIndex === null && copiedFormat === "hex-hover"}
              />
              <ColorFormatRow
                label="RGB"
                value={hoverColor.rgb}
                onCopy={() => copyToClipboard(hoverColor.rgb, null, "rgb-hover")}
                copied={copiedIndex === null && copiedFormat === "rgb-hover"}
              />
              <ColorFormatRow
                label="HSL"
                value={hoverColor.hsl}
                onCopy={() => copyToClipboard(hoverColor.hsl, null, "hsl-hover")}
                copied={copiedIndex === null && copiedFormat === "hsl-hover"}
              />
            </div>
          </div>
        )}

        {/* Recent picks */}
        <div className="rounded-lg border border-border p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              Recent Picks ({recentPicks.length})
            </p>
            {recentPicks.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setRecentPicks([])}
              >
                <Trash2Icon className="mr-1 h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
          {recentPicks.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              Click on the image to pick colors
            </p>
          ) : (
            <div className="flex max-h-[60vh] flex-col gap-1.5 overflow-auto">
              {recentPicks.map((color, i) => (
                <div
                  key={color.hex + i}
                  className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
                >
                  <div
                    className="h-7 w-7 shrink-0 rounded border border-border"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="flex-1 font-mono text-xs">
                    {color.hex}
                  </span>
                  <button
                    className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                    title="Copy HEX"
                    onClick={() => copyToClipboard(color.hex, i, "hex")}
                  >
                    {copiedIndex === i && copiedFormat === "hex" ? (
                      <CheckIcon className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <CopyIcon className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                    title="Copy RGB"
                    onClick={() => copyToClipboard(color.rgb, i, "rgb")}
                  >
                    {copiedIndex === i && copiedFormat === "rgb" ? (
                      <CheckIcon className="h-3 w-3 text-green-500" />
                    ) : (
                      <span className="text-[10px] font-bold leading-none">
                        RGB
                      </span>
                    )}
                  </button>
                  <button
                    className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                    title="Copy HSL"
                    onClick={() => copyToClipboard(color.hsl, i, "hsl")}
                  >
                    {copiedIndex === i && copiedFormat === "hsl" ? (
                      <CheckIcon className="h-3 w-3 text-green-500" />
                    ) : (
                      <span className="text-[10px] font-bold leading-none">
                        HSL
                      </span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ColorFormatRow({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string
  value: string
  onCopy: () => void
  copied: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-[10px] font-semibold text-muted-foreground">
        {label}
      </span>
      <span className="flex-1 font-mono text-xs">{value}</span>
      <button
        className="rounded p-1 text-muted-foreground hover:text-foreground"
        onClick={onCopy}
      >
        {copied ? (
          <CheckIcon className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <CopyIcon className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  )
}
