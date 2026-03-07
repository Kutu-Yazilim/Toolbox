import { useState, useRef, useCallback, useEffect } from "react"
import { Dialog } from "radix-ui"
import { XIcon, CheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DeviceSpec, Orientation } from "@/types/mockup"

interface CropModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageSrc: string
  device: DeviceSpec
  orientation: Orientation
  onApply: (croppedImageDataUrl: string) => void
}

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

type HandleId = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w"

const ASPECT_PRESETS = [
  { label: "Free", value: "free" },
  { label: "Device", value: "device" },
  { label: "16:9", value: "16:9" },
  { label: "4:3", value: "4:3" },
  { label: "1:1", value: "1:1" },
  { label: "3:2", value: "3:2" },
  { label: "9:16", value: "9:16" },
]

const MIN_CROP = 30
const HANDLE_SIZE = 10

function getAspectRatio(preset: string, deviceAspect: number): number | null {
  switch (preset) {
    case "free": return null
    case "device": return deviceAspect
    case "16:9": return 16 / 9
    case "4:3": return 4 / 3
    case "1:1": return 1
    case "3:2": return 3 / 2
    case "9:16": return 9 / 16
    default: return null
  }
}

function computeImageBounds(
  containerW: number,
  containerH: number,
  naturalW: number,
  naturalH: number,
): Rect {
  const scale = Math.min(containerW / naturalW, containerH / naturalH)
  const w = naturalW * scale
  const h = naturalH * scale
  return { x: (containerW - w) / 2, y: (containerH - h) / 2, w, h }
}

function constrainCropToRatio(
  crop: Rect,
  ratio: number,
  imgW: number,
  imgH: number,
): Rect {
  const cx = crop.x + crop.w / 2
  const cy = crop.y + crop.h / 2

  let w = crop.w
  let h = crop.h

  if (w / h > ratio) {
    w = h * ratio
  } else {
    h = w / ratio
  }

  // Ensure it fits within image bounds
  if (w > imgW) { w = imgW; h = w / ratio }
  if (h > imgH) { h = imgH; w = h * ratio }

  let x = cx - w / 2
  let y = cy - h / 2

  if (x < 0) x = 0
  if (y < 0) y = 0
  if (x + w > imgW) x = imgW - w
  if (y + h > imgH) y = imgH - h

  return { x, y, w, h }
}

function getHandlePosition(crop: Rect, handle: HandleId, imgBounds: Rect) {
  const ox = imgBounds.x
  const oy = imgBounds.y
  const { x, y, w, h } = crop

  switch (handle) {
    case "nw": return { x: ox + x, y: oy + y }
    case "n": return { x: ox + x + w / 2, y: oy + y }
    case "ne": return { x: ox + x + w, y: oy + y }
    case "e": return { x: ox + x + w, y: oy + y + h / 2 }
    case "se": return { x: ox + x + w, y: oy + y + h }
    case "s": return { x: ox + x + w / 2, y: oy + y + h }
    case "sw": return { x: ox + x, y: oy + y + h }
    case "w": return { x: ox + x, y: oy + y + h / 2 }
  }
}

function getHandleCursor(handle: HandleId): string {
  switch (handle) {
    case "nw": case "se": return "nwse-resize"
    case "ne": case "sw": return "nesw-resize"
    case "n": case "s": return "ns-resize"
    case "e": case "w": return "ew-resize"
  }
}

export function CropModal({
  open,
  onOpenChange,
  imageSrc,
  device,
  orientation,
  onApply,
}: CropModalProps) {
  const [cropRect, setCropRect] = useState<Rect>({ x: 0, y: 0, w: 0, h: 0 })
  const [imgBounds, setImgBounds] = useState<Rect>({ x: 0, y: 0, w: 0, h: 0 })
  const [aspectLock, setAspectLock] = useState("free")
  const [initialized, setInitialized] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const cropRectRef = useRef(cropRect)
  cropRectRef.current = cropRect
  const imgBoundsRef = useRef(imgBounds)
  imgBoundsRef.current = imgBounds
  const aspectLockRef = useRef(aspectLock)
  aspectLockRef.current = aspectLock

  // Compute device screen aspect ratio
  const fi = device.frameImage
  const isLandscape = orientation === "landscape"
  let deviceScreenAspect: number
  if (fi) {
    deviceScreenAspect = fi.nativeScreen.width / fi.nativeScreen.height
  } else {
    const sw = isLandscape ? device.screen.height : device.screen.width
    const sh = isLandscape ? device.screen.width : device.screen.height
    deviceScreenAspect = sw / sh
  }
  if (isLandscape && fi) {
    deviceScreenAspect = fi.nativeScreen.height / fi.nativeScreen.width
  }

  const updateBounds = useCallback(() => {
    const container = containerRef.current
    const img = imgRef.current
    if (!container || !img || !img.naturalWidth) return null

    const cRect = container.getBoundingClientRect()
    const bounds = computeImageBounds(cRect.width, cRect.height, img.naturalWidth, img.naturalHeight)
    setImgBounds(bounds)
    imgBoundsRef.current = bounds
    return bounds
  }, [])

  const initializeCrop = useCallback(() => {
    const bounds = updateBounds()
    if (!bounds) return
    setCropRect({ x: 0, y: 0, w: bounds.w, h: bounds.h })
    cropRectRef.current = { x: 0, y: 0, w: bounds.w, h: bounds.h }
    setInitialized(true)
  }, [updateBounds])

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setInitialized(false)
      setAspectLock("free")
    }
  }, [open])

  const handleImageLoad = useCallback(() => {
    initializeCrop()
  }, [initializeCrop])

  // Handle container resize
  useEffect(() => {
    if (!open || !initialized) return
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => {
      const oldBounds = imgBoundsRef.current
      const newBounds = updateBounds()
      if (!newBounds || !oldBounds.w) return

      const scaleX = newBounds.w / oldBounds.w
      const scaleY = newBounds.h / oldBounds.h
      setCropRect((prev) => {
        const next = {
          x: prev.x * scaleX,
          y: prev.y * scaleY,
          w: prev.w * scaleX,
          h: prev.h * scaleY,
        }
        cropRectRef.current = next
        return next
      })
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [open, initialized, updateBounds])

  // Handle aspect lock change
  const handleAspectLockChange = useCallback(
    (preset: string) => {
      setAspectLock(preset)
      aspectLockRef.current = preset
      const ratio = getAspectRatio(preset, deviceScreenAspect)
      if (ratio) {
        const bounds = imgBoundsRef.current
        setCropRect((prev) => {
          const next = constrainCropToRatio(prev, ratio, bounds.w, bounds.h)
          cropRectRef.current = next
          return next
        })
      }
    },
    [deviceScreenAspect],
  )

  // Pointer interaction — uses window listeners to avoid capture issues
  const startInteraction = useCallback(
    (e: React.PointerEvent, type: "move" | "resize", handle?: HandleId) => {
      e.preventDefault()
      e.stopPropagation()

      const startX = e.clientX
      const startY = e.clientY
      const startCrop = { ...cropRectRef.current }
      const currentRatio = getAspectRatio(aspectLockRef.current, deviceScreenAspect)
      const bounds = { ...imgBoundsRef.current }

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX
        const dy = ev.clientY - startY

        if (type === "move") {
          let newX = startCrop.x + dx
          let newY = startCrop.y + dy
          newX = Math.max(0, Math.min(bounds.w - startCrop.w, newX))
          newY = Math.max(0, Math.min(bounds.h - startCrop.h, newY))
          const next = { ...startCrop, x: newX, y: newY }
          cropRectRef.current = next
          setCropRect(next)
        } else if (handle) {
          let { x, y, w, h } = startCrop

          // Apply raw resize
          if (handle.includes("e")) w += dx
          if (handle.includes("w")) { x += dx; w -= dx }
          if (handle.includes("s")) h += dy
          if (handle.includes("n")) { y += dy; h -= dy }

          // Enforce minimum size
          if (w < MIN_CROP) {
            if (handle.includes("w")) x = startCrop.x + startCrop.w - MIN_CROP
            w = MIN_CROP
          }
          if (h < MIN_CROP) {
            if (handle.includes("n")) y = startCrop.y + startCrop.h - MIN_CROP
            h = MIN_CROP
          }

          // Enforce aspect ratio
          if (currentRatio) {
            if (handle.length === 2) {
              // Corner handle — use horizontal delta to determine size
              const currentR = w / h
              if (currentR > currentRatio) {
                w = h * currentRatio
                if (handle.includes("w")) x = startCrop.x + startCrop.w - w
              } else {
                h = w / currentRatio
                if (handle.includes("n")) y = startCrop.y + startCrop.h - h
              }
            } else if (handle === "e" || handle === "w") {
              const newH = w / currentRatio
              const centerY = y + h / 2
              h = newH
              y = centerY - h / 2
            } else {
              const newW = h * currentRatio
              const centerX = x + w / 2
              w = newW
              x = centerX - w / 2
            }
          }

          // Clamp to image bounds
          if (x < 0) { w += x; x = 0 }
          if (y < 0) { h += y; y = 0 }
          if (x + w > bounds.w) w = bounds.w - x
          if (y + h > bounds.h) h = bounds.h - y

          // Re-enforce ratio after clamping
          if (currentRatio && Math.abs(w / h - currentRatio) > 0.01) {
            if (w / h > currentRatio) w = h * currentRatio
            else h = w / currentRatio
          }

          // Final minimum check
          if (w < MIN_CROP) w = MIN_CROP
          if (h < MIN_CROP) h = MIN_CROP

          const next = { x, y, w, h }
          cropRectRef.current = next
          setCropRect(next)
        }
      }

      const onUp = () => {
        window.removeEventListener("pointermove", onMove)
        window.removeEventListener("pointerup", onUp)
      }

      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", onUp)
    },
    [deviceScreenAspect],
  )

  // Apply crop
  const handleApply = useCallback(() => {
    const img = imgRef.current
    const bounds = imgBoundsRef.current
    if (!img || !bounds.w) return

    const scaleX = img.naturalWidth / bounds.w
    const scaleY = img.naturalHeight / bounds.h
    const crop = cropRectRef.current

    const sx = crop.x * scaleX
    const sy = crop.y * scaleY
    const sw = crop.w * scaleX
    const sh = crop.h * scaleY

    const canvas = document.createElement("canvas")
    canvas.width = Math.round(sw)
    canvas.height = Math.round(sh)
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)

    onApply(canvas.toDataURL("image/png"))
    onOpenChange(false)
  }, [onApply, onOpenChange])

  // Compute device overlay rect within the crop area (shows "cover" mapping)
  const deviceOverlay = (() => {
    if (!cropRect.w || !cropRect.h) return null
    const cropAspect = cropRect.w / cropRect.h
    if (cropAspect > deviceScreenAspect) {
      const w = cropRect.h * deviceScreenAspect
      return { x: (cropRect.w - w) / 2, y: 0, w, h: cropRect.h }
    } else {
      const h = cropRect.w / deviceScreenAspect
      return { x: 0, y: (cropRect.h - h) / 2, w: cropRect.w, h }
    }
  })()

  // Screen border radius scaled to overlay size
  const overlayBorderRadius = (() => {
    if (!deviceOverlay) return 0
    const screenW = isLandscape ? device.screen.height : device.screen.width
    return device.screen.borderRadius * (deviceOverlay.w / screenW)
  })()

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-4 z-50 flex flex-col bg-background rounded-xl shadow-2xl overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <Dialog.Title className="text-sm font-medium">Crop Image</Dialog.Title>
            <div className="flex items-center gap-2">
              {/* Aspect ratio presets */}
              <div className="flex items-center gap-1 flex-wrap">
                {ASPECT_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => handleAspectLockChange(p.value)}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                      aspectLock === p.value
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="w-px h-4 bg-border mx-1" />
              <Dialog.Close asChild>
                <button className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted">
                  <XIcon className="size-4" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Crop area */}
          <div
            ref={containerRef}
            className="flex-1 relative overflow-hidden bg-neutral-900"
          >
            {/* Full image */}
            <img
              ref={imgRef}
              src={imageSrc}
              alt=""
              draggable={false}
              onLoad={handleImageLoad}
              className="w-full h-full object-contain select-none pointer-events-none"
            />

            {initialized && (
              <>
                {/* Dark overlay outside crop */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: imgBounds.x,
                    top: imgBounds.y,
                    width: imgBounds.w,
                    height: imgBounds.h,
                  }}
                >
                  <svg width="100%" height="100%" className="absolute inset-0">
                    <defs>
                      <mask id="crop-dim-mask">
                        <rect width="100%" height="100%" fill="white" />
                        <rect
                          x={cropRect.x}
                          y={cropRect.y}
                          width={cropRect.w}
                          height={cropRect.h}
                          fill="black"
                        />
                      </mask>
                    </defs>
                    <rect
                      width="100%"
                      height="100%"
                      fill="rgba(0,0,0,0.6)"
                      mask="url(#crop-dim-mask)"
                    />
                  </svg>
                </div>

                {/* Crop rectangle border + interior */}
                <div
                  className="absolute border-2 border-white/90"
                  style={{
                    left: imgBounds.x + cropRect.x,
                    top: imgBounds.y + cropRect.y,
                    width: cropRect.w,
                    height: cropRect.h,
                    cursor: "move",
                  }}
                  onPointerDown={(e) => startInteraction(e, "move")}
                >
                  {/* Rule of thirds grid */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/25" />
                    <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/25" />
                    <div className="absolute top-1/3 left-0 right-0 h-px bg-white/25" />
                    <div className="absolute top-2/3 left-0 right-0 h-px bg-white/25" />
                  </div>

                  {/* Device screen overlay */}
                  {deviceOverlay && (
                    <div
                      className="absolute border-2 border-dashed border-blue-400/50 pointer-events-none"
                      style={{
                        left: deviceOverlay.x,
                        top: deviceOverlay.y,
                        width: deviceOverlay.w,
                        height: deviceOverlay.h,
                        borderRadius: overlayBorderRadius,
                      }}
                    >
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-blue-400/70 whitespace-nowrap">
                        Device screen
                      </span>
                    </div>
                  )}
                </div>

                {/* Resize handles */}
                {(["nw", "n", "ne", "e", "se", "s", "sw", "w"] as HandleId[]).map(
                  (handle) => {
                    const pos = getHandlePosition(cropRect, handle, imgBounds)
                    return (
                      <div
                        key={handle}
                        className="absolute bg-white border border-gray-400 z-10"
                        style={{
                          left: pos.x - HANDLE_SIZE / 2,
                          top: pos.y - HANDLE_SIZE / 2,
                          width: HANDLE_SIZE,
                          height: HANDLE_SIZE,
                          cursor: getHandleCursor(handle),
                        }}
                        onPointerDown={(e) =>
                          startInteraction(e, "resize", handle)
                        }
                      />
                    )
                  },
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              className="h-8 text-xs gap-1.5"
            >
              <CheckIcon className="size-3.5" />
              Apply Crop
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
