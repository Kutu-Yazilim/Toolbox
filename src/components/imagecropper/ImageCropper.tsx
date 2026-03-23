import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  UploadIcon,
  DownloadIcon,
  RotateCcwIcon,
  CropIcon,
  ScissorsIcon,
  ImageIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

type CropBox = {
  x: number
  y: number
  width: number
  height: number
}

type AspectRatio = {
  label: string
  value: number | null
}

type DragMode =
  | "none"
  | "move"
  | "nw"
  | "ne"
  | "sw"
  | "se"
  | "n"
  | "s"
  | "e"
  | "w"

type ImageState = {
  src: string
  name: string
  naturalWidth: number
  naturalHeight: number
}

const ASPECT_RATIOS: AspectRatio[] = [
  { label: "Free", value: null },
  { label: "1:1", value: 1 },
  { label: "16:9", value: 16 / 9 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:2", value: 3 / 2 },
]

const HANDLE_SIZE = 10
const MIN_CROP = 20

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

function getCursorForMode(mode: DragMode): string {
  switch (mode) {
    case "move":
      return "move"
    case "nw":
    case "se":
      return "nwse-resize"
    case "ne":
    case "sw":
      return "nesw-resize"
    case "n":
    case "s":
      return "ns-resize"
    case "e":
    case "w":
      return "ew-resize"
    default:
      return "crosshair"
  }
}

function hitTest(
  mx: number,
  my: number,
  crop: CropBox,
): DragMode {
  const { x, y, width, height } = crop
  const hs = HANDLE_SIZE / 2

  // corners
  if (Math.abs(mx - x) <= hs && Math.abs(my - y) <= hs) return "nw"
  if (Math.abs(mx - (x + width)) <= hs && Math.abs(my - y) <= hs) return "ne"
  if (Math.abs(mx - x) <= hs && Math.abs(my - (y + height)) <= hs) return "sw"
  if (Math.abs(mx - (x + width)) <= hs && Math.abs(my - (y + height)) <= hs)
    return "se"

  // edges
  if (Math.abs(my - y) <= hs && mx > x + hs && mx < x + width - hs) return "n"
  if (
    Math.abs(my - (y + height)) <= hs &&
    mx > x + hs &&
    mx < x + width - hs
  )
    return "s"
  if (Math.abs(mx - x) <= hs && my > y + hs && my < y + height - hs) return "w"
  if (
    Math.abs(mx - (x + width)) <= hs &&
    my > y + hs &&
    my < y + height - hs
  )
    return "e"

  // inside
  if (mx > x && mx < x + width && my > y && my < y + height) return "move"

  return "none"
}

export function ImageCropper() {
  const [image, setImage] = useState<ImageState | null>(null)
  const [crop, setCrop] = useState<CropBox>({ x: 0, y: 0, width: 0, height: 0 })
  const [selectedRatio, setSelectedRatio] = useState<number>(0)
  const [croppedUrl, setCroppedUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragRef = useRef<{
    mode: DragMode
    startX: number
    startY: number
    startCrop: CropBox
  } | null>(null)

  const aspectValue = ASPECT_RATIOS[selectedRatio].value

  const getScale = useCallback(() => {
    if (!image || displaySize.width === 0) return 1
    return image.naturalWidth / displaySize.width
  }, [image, displaySize])

  const updateDisplaySize = useCallback(() => {
    if (!containerRef.current || !image) return
    const container = containerRef.current
    const maxW = container.clientWidth
    const maxH = container.clientHeight
    const imgRatio = image.naturalWidth / image.naturalHeight

    let w: number
    let h: number
    if (maxW / maxH > imgRatio) {
      h = maxH
      w = h * imgRatio
    } else {
      w = maxW
      h = w / imgRatio
    }
    setDisplaySize({ width: Math.round(w), height: Math.round(h) })
  }, [image])

  useEffect(() => {
    updateDisplaySize()
    window.addEventListener("resize", updateDisplaySize)
    return () => window.removeEventListener("resize", updateDisplaySize)
  }, [updateDisplaySize])

  const initCrop = useCallback(
    (dw: number, dh: number) => {
      const margin = 0.1
      let cw = dw * (1 - 2 * margin)
      let ch = dh * (1 - 2 * margin)

      if (aspectValue) {
        if (cw / ch > aspectValue) {
          cw = ch * aspectValue
        } else {
          ch = cw / aspectValue
        }
      }

      setCrop({
        x: (dw - cw) / 2,
        y: (dh - ch) / 2,
        width: cw,
        height: ch,
      })
    },
    [aspectValue],
  )

  useEffect(() => {
    if (displaySize.width > 0 && displaySize.height > 0 && image) {
      initCrop(displaySize.width, displaySize.height)
      setCroppedUrl(null)
    }
  }, [displaySize, image, initCrop])

  const loadImage = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const src = e.target?.result as string
      const img = new Image()
      img.onload = () => {
        imgRef.current = img
        setImage({
          src,
          name: file.name,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
        })
        setCroppedUrl(null)
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file && file.type.startsWith("image/")) {
        loadImage(file)
      }
    },
    [loadImage],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file && file.type.startsWith("image/")) {
        loadImage(file)
      }
    },
    [loadImage],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const constrainCrop = useCallback(
    (box: CropBox, anchor?: { x: number; y: number }): CropBox => {
      const dw = displaySize.width
      const dh = displaySize.height
      let { x, y, width, height } = box

      // Enforce minimum size
      width = Math.max(width, MIN_CROP)
      height = Math.max(height, MIN_CROP)

      // Enforce aspect ratio
      if (aspectValue) {
        if (anchor) {
          // Resize: adjust height to match ratio
          const newH = width / aspectValue
          if (newH <= dh) {
            height = newH
          } else {
            height = dh
            width = height * aspectValue
          }
          // Re-anchor
          if (anchor.x === x + box.width) {
            // dragging left edge, anchor right
            x = anchor.x - width
          }
          if (anchor.y === y + box.height) {
            // dragging top edge, anchor bottom
            y = anchor.y - height
          }
        } else {
          height = width / aspectValue
        }
      }

      // Clamp to bounds
      x = clamp(x, 0, dw - width)
      y = clamp(y, 0, dh - height)
      width = Math.min(width, dw - x)
      height = Math.min(height, dh - y)

      return { x, y, width, height }
    },
    [displaySize, aspectValue],
  )

  const getMousePos = useCallback(
    (e: React.MouseEvent | MouseEvent): { mx: number; my: number } => {
      if (!overlayRef.current) return { mx: 0, my: 0 }
      const rect = overlayRef.current.getBoundingClientRect()
      return { mx: e.clientX - rect.left, my: e.clientY - rect.top }
    },
    [],
  )

  const getTouchPos = useCallback(
    (e: React.TouchEvent | TouchEvent): { mx: number; my: number } => {
      if (!overlayRef.current) return { mx: 0, my: 0 }
      const rect = overlayRef.current.getBoundingClientRect()
      const touch = e.touches[0]
      return { mx: touch.clientX - rect.left, my: touch.clientY - rect.top }
    },
    [],
  )

  const handlePointerDown = useCallback(
    (mx: number, my: number) => {
      const mode = hitTest(mx, my, crop)
      if (mode === "none") return
      dragRef.current = {
        mode,
        startX: mx,
        startY: my,
        startCrop: { ...crop },
      }
    },
    [crop],
  )

  const handlePointerMove = useCallback(
    (mx: number, my: number) => {
      const drag = dragRef.current
      if (!drag) return

      const dx = mx - drag.startX
      const dy = my - drag.startY
      const sc = drag.startCrop
      const dw = displaySize.width
      const dh = displaySize.height

      let newBox: CropBox

      if (drag.mode === "move") {
        newBox = constrainCrop({
          x: clamp(sc.x + dx, 0, dw - sc.width),
          y: clamp(sc.y + dy, 0, dh - sc.height),
          width: sc.width,
          height: sc.height,
        })
      } else {
        let nx = sc.x
        let ny = sc.y
        let nw = sc.width
        let nh = sc.height

        // horizontal
        if (drag.mode.includes("w")) {
          nw = Math.max(MIN_CROP, sc.width - dx)
          nx = sc.x + sc.width - nw
          if (nx < 0) {
            nw += nx
            nx = 0
          }
        } else if (drag.mode.includes("e")) {
          nw = Math.max(MIN_CROP, sc.width + dx)
          if (nx + nw > dw) nw = dw - nx
        }

        // vertical
        if (drag.mode.includes("n")) {
          nh = Math.max(MIN_CROP, sc.height - dy)
          ny = sc.y + sc.height - nh
          if (ny < 0) {
            nh += ny
            ny = 0
          }
        } else if (drag.mode.includes("s")) {
          nh = Math.max(MIN_CROP, sc.height + dy)
          if (ny + nh > dh) nh = dh - ny
        }

        // For aspect-constrained edge-only drags, derive the other dimension
        if (aspectValue) {
          if (drag.mode === "n" || drag.mode === "s") {
            nw = nh * aspectValue
            // Keep centered horizontally relative to start
            const cx = sc.x + sc.width / 2
            nx = cx - nw / 2
            if (nx < 0) {
              nx = 0
              nw = Math.min(nw, dw)
              nh = nw / aspectValue
            }
            if (nx + nw > dw) {
              nw = dw - nx
              nh = nw / aspectValue
            }
          } else if (drag.mode === "e" || drag.mode === "w") {
            nh = nw / aspectValue
            const cy = sc.y + sc.height / 2
            ny = cy - nh / 2
            if (ny < 0) {
              ny = 0
              nh = Math.min(nh, dh)
              nw = nh * aspectValue
            }
            if (ny + nh > dh) {
              nh = dh - ny
              nw = nh * aspectValue
            }
          } else {
            // corner resize: width leads
            nh = nw / aspectValue
            if (drag.mode.includes("n")) {
              ny = sc.y + sc.height - nh
              if (ny < 0) {
                ny = 0
                nh = sc.y + sc.height
                nw = nh * aspectValue
              }
            }
            if (ny + nh > dh) {
              nh = dh - ny
              nw = nh * aspectValue
            }
            if (drag.mode.includes("w")) {
              nx = sc.x + sc.width - nw
              if (nx < 0) {
                nx = 0
                nw = sc.x + sc.width
                nh = nw / aspectValue
              }
            }
            if (nx + nw > dw) {
              nw = dw - nx
              nh = nw / aspectValue
            }
          }
        }

        newBox = { x: nx, y: ny, width: nw, height: nh }
      }

      setCrop(newBox)
    },
    [displaySize, constrainCrop, aspectValue],
  )

  const handlePointerUp = useCallback(() => {
    dragRef.current = null
  }, [])

  // Mouse events
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const { mx, my } = getMousePos(e)
      handlePointerDown(mx, my)
    },
    [getMousePos, handlePointerDown],
  )

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return
      const { mx, my } = getMousePos(e)
      handlePointerMove(mx, my)
    }
    const onUp = () => handlePointerUp()

    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [getMousePos, handlePointerMove, handlePointerUp])

  // Touch events
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 1) return
      const { mx, my } = getTouchPos(e)
      handlePointerDown(mx, my)
    },
    [getTouchPos, handlePointerDown],
  )

  useEffect(() => {
    const onMove = (e: TouchEvent) => {
      if (!dragRef.current) return
      e.preventDefault()
      const pos = (() => {
        if (!overlayRef.current) return { mx: 0, my: 0 }
        const rect = overlayRef.current.getBoundingClientRect()
        const touch = e.touches[0]
        return { mx: touch.clientX - rect.left, my: touch.clientY - rect.top }
      })()
      handlePointerMove(pos.mx, pos.my)
    }
    const onUp = () => handlePointerUp()

    window.addEventListener("touchmove", onMove, { passive: false })
    window.addEventListener("touchend", onUp)
    return () => {
      window.removeEventListener("touchmove", onMove)
      window.removeEventListener("touchend", onUp)
    }
  }, [handlePointerMove, handlePointerUp])

  // Cursor tracking
  const [cursor, setCursor] = useState("crosshair")
  const onMouseMoveOverlay = useCallback(
    (e: React.MouseEvent) => {
      if (dragRef.current) return
      const { mx, my } = getMousePos(e)
      const mode = hitTest(mx, my, crop)
      setCursor(getCursorForMode(mode))
    },
    [getMousePos, crop],
  )

  const handleCrop = useCallback(() => {
    if (!imgRef.current || !image) return

    const scale = getScale()
    const sx = Math.round(crop.x * scale)
    const sy = Math.round(crop.y * scale)
    const sw = Math.round(crop.width * scale)
    const sh = Math.round(crop.height * scale)

    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = sw
    canvas.height = sh
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(imgRef.current, sx, sy, sw, sh, 0, 0, sw, sh)

    setCroppedUrl(canvas.toDataURL("image/png"))
  }, [image, crop, getScale])

  const handleDownload = useCallback(() => {
    if (!croppedUrl || !image) return
    const a = document.createElement("a")
    const baseName = image.name.replace(/\.[^.]+$/, "")
    const scale = getScale()
    const w = Math.round(crop.width * scale)
    const h = Math.round(crop.height * scale)
    a.href = croppedUrl
    a.download = `${baseName}_cropped_${w}x${h}.png`
    a.click()
  }, [croppedUrl, image, crop, getScale])

  const handleReset = useCallback(() => {
    setImage(null)
    setCrop({ x: 0, y: 0, width: 0, height: 0 })
    setCroppedUrl(null)
    setSelectedRatio(0)
    imgRef.current = null
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  const handleRatioChange = useCallback(
    (index: number) => {
      setSelectedRatio(index)
      setCroppedUrl(null)
      // Re-init crop with new ratio on next render via effect
    },
    [],
  )

  // Reinit crop when ratio changes (after selectedRatio state updates)
  useEffect(() => {
    if (displaySize.width > 0 && displaySize.height > 0 && image) {
      initCrop(displaySize.width, displaySize.height)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRatio])

  const scale = getScale()
  const cropNaturalW = Math.round(crop.width * scale)
  const cropNaturalH = Math.round(crop.height * scale)

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-4">
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!image ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex min-h-[300px] cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50",
          )}
        >
          <UploadIcon className="h-12 w-12 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">
              Drop an image here or click to browse
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Supports PNG, JPEG, WebP, GIF, BMP, SVG
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Controls panel */}
          <div className="flex w-full flex-col gap-4 lg:w-72 lg:shrink-0">
            {/* Aspect ratio */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                Aspect Ratio
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {ASPECT_RATIOS.map((ratio, i) => (
                  <button
                    key={ratio.label}
                    onClick={() => handleRatioChange(i)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm transition-colors",
                      selectedRatio === i
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80",
                    )}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Crop dimensions */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                Crop Dimensions
              </h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size</span>
                  <span className="font-mono text-xs">
                    {cropNaturalW} x {cropNaturalH} px
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original</span>
                  <span className="font-mono text-xs">
                    {image.naturalWidth} x {image.naturalHeight} px
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button onClick={handleCrop} className="w-full">
                <ScissorsIcon className="mr-1.5 h-4 w-4" />
                Crop
              </Button>
              {croppedUrl && (
                <Button onClick={handleDownload} variant="outline" className="w-full">
                  <DownloadIcon className="mr-1.5 h-4 w-4" />
                  Download PNG
                </Button>
              )}
              <Button variant="outline" onClick={handleReset} className="w-full">
                <RotateCcwIcon className="mr-1.5 h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>

          {/* Crop area */}
          <div className="flex min-h-[400px] flex-1 flex-col gap-4">
            <div className="flex flex-1 flex-col rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-4 py-2">
                <CropIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Crop Area</span>
                <span className="ml-auto font-mono text-xs text-muted-foreground">
                  {cropNaturalW} x {cropNaturalH} px
                </span>
              </div>
              <div
                ref={containerRef}
                className="relative flex flex-1 items-center justify-center overflow-hidden p-4"
              >
                {displaySize.width > 0 && (
                  <div
                    className="relative"
                    style={{
                      width: displaySize.width,
                      height: displaySize.height,
                    }}
                  >
                    <img
                      src={image.src}
                      alt="Source"
                      className="pointer-events-none block"
                      style={{
                        width: displaySize.width,
                        height: displaySize.height,
                      }}
                      draggable={false}
                    />
                    {/* Overlay */}
                    <div
                      ref={overlayRef}
                      className="absolute inset-0"
                      style={{ cursor }}
                      onMouseDown={onMouseDown}
                      onMouseMove={onMouseMoveOverlay}
                      onTouchStart={onTouchStart}
                    >
                      {/* Dark mask - four rectangles around the crop */}
                      {/* Top */}
                      <div
                        className="absolute bg-black/50"
                        style={{
                          left: 0,
                          top: 0,
                          width: displaySize.width,
                          height: crop.y,
                        }}
                      />
                      {/* Bottom */}
                      <div
                        className="absolute bg-black/50"
                        style={{
                          left: 0,
                          top: crop.y + crop.height,
                          width: displaySize.width,
                          height: displaySize.height - crop.y - crop.height,
                        }}
                      />
                      {/* Left */}
                      <div
                        className="absolute bg-black/50"
                        style={{
                          left: 0,
                          top: crop.y,
                          width: crop.x,
                          height: crop.height,
                        }}
                      />
                      {/* Right */}
                      <div
                        className="absolute bg-black/50"
                        style={{
                          left: crop.x + crop.width,
                          top: crop.y,
                          width: displaySize.width - crop.x - crop.width,
                          height: crop.height,
                        }}
                      />
                      {/* Crop border */}
                      <div
                        className="absolute border-2 border-white"
                        style={{
                          left: crop.x,
                          top: crop.y,
                          width: crop.width,
                          height: crop.height,
                        }}
                      >
                        {/* Rule of thirds grid */}
                        <div className="absolute inset-0">
                          <div
                            className="absolute left-1/3 top-0 h-full w-px bg-white/30"
                          />
                          <div
                            className="absolute left-2/3 top-0 h-full w-px bg-white/30"
                          />
                          <div
                            className="absolute left-0 top-1/3 h-px w-full bg-white/30"
                          />
                          <div
                            className="absolute left-0 top-2/3 h-px w-full bg-white/30"
                          />
                        </div>
                      </div>
                      {/* Resize handles - corners */}
                      {(
                        [
                          { mode: "nw", x: crop.x, y: crop.y },
                          { mode: "ne", x: crop.x + crop.width, y: crop.y },
                          { mode: "sw", x: crop.x, y: crop.y + crop.height },
                          {
                            mode: "se",
                            x: crop.x + crop.width,
                            y: crop.y + crop.height,
                          },
                        ] as const
                      ).map((h) => (
                        <div
                          key={h.mode}
                          className="absolute h-3 w-3 rounded-sm border-2 border-white bg-primary"
                          style={{
                            left: h.x - 6,
                            top: h.y - 6,
                            cursor: getCursorForMode(h.mode),
                          }}
                        />
                      ))}
                      {/* Resize handles - edges */}
                      {(
                        [
                          {
                            mode: "n" as DragMode,
                            x: crop.x + crop.width / 2,
                            y: crop.y,
                          },
                          {
                            mode: "s" as DragMode,
                            x: crop.x + crop.width / 2,
                            y: crop.y + crop.height,
                          },
                          {
                            mode: "w" as DragMode,
                            x: crop.x,
                            y: crop.y + crop.height / 2,
                          },
                          {
                            mode: "e" as DragMode,
                            x: crop.x + crop.width,
                            y: crop.y + crop.height / 2,
                          },
                        ]
                      ).map((h) => (
                        <div
                          key={h.mode}
                          className="absolute h-2.5 w-2.5 rounded-sm border-2 border-white bg-primary"
                          style={{
                            left: h.x - 5,
                            top: h.y - 5,
                            cursor: getCursorForMode(h.mode),
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cropped preview */}
            {croppedUrl && (
              <div className="rounded-lg border border-border bg-card">
                <div className="flex items-center gap-2 border-b border-border px-4 py-2">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Cropped Result
                  </span>
                  <span className="ml-auto font-mono text-xs text-muted-foreground">
                    {cropNaturalW} x {cropNaturalH} px
                  </span>
                </div>
                <div className="flex items-center justify-center p-4">
                  <img
                    src={croppedUrl}
                    alt="Cropped result"
                    className="max-h-64 max-w-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
