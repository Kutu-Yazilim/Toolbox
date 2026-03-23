import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  UploadIcon,
  DownloadIcon,
  RotateCcwIcon,
  LinkIcon,
  UnlinkIcon,
  PercentIcon,
  RulerIcon,
  ImageIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

type ResizeMode = "pixels" | "percentage"

type ImageState = {
  src: string
  name: string
  originalWidth: number
  originalHeight: number
  fileSize: number
}

const INPUT_CLASS =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function ImageResizer() {
  const [image, setImage] = useState<ImageState | null>(null)
  const [width, setWidth] = useState<string>("")
  const [height, setHeight] = useState<string>("")
  const [percentage, setPercentage] = useState<string>("100")
  const [aspectLocked, setAspectLocked] = useState(true)
  const [mode, setMode] = useState<ResizeMode>("pixels")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  const aspectRatio = image ? image.originalWidth / image.originalHeight : 1

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
          originalWidth: img.naturalWidth,
          originalHeight: img.naturalHeight,
          fileSize: file.size,
        })
        setWidth(String(img.naturalWidth))
        setHeight(String(img.naturalHeight))
        setPercentage("100")
        setPreviewUrl(null)
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

  const handleWidthChange = useCallback(
    (value: string) => {
      setWidth(value)
      if (aspectLocked && image) {
        const w = parseInt(value)
        if (!isNaN(w) && w > 0) {
          setHeight(String(Math.round(w / aspectRatio)))
        }
      }
      setPreviewUrl(null)
    },
    [aspectLocked, aspectRatio, image],
  )

  const handleHeightChange = useCallback(
    (value: string) => {
      setHeight(value)
      if (aspectLocked && image) {
        const h = parseInt(value)
        if (!isNaN(h) && h > 0) {
          setWidth(String(Math.round(h * aspectRatio)))
        }
      }
      setPreviewUrl(null)
    },
    [aspectLocked, aspectRatio, image],
  )

  const handlePercentageChange = useCallback(
    (value: string) => {
      setPercentage(value)
      if (image) {
        const p = parseFloat(value)
        if (!isNaN(p) && p > 0) {
          setWidth(String(Math.round(image.originalWidth * (p / 100))))
          setHeight(String(Math.round(image.originalHeight * (p / 100))))
        }
      }
      setPreviewUrl(null)
    },
    [image],
  )

  const targetWidth = parseInt(width) || 0
  const targetHeight = parseInt(height) || 0

  // Generate preview whenever dimensions change
  useEffect(() => {
    if (!imgRef.current || targetWidth <= 0 || targetHeight <= 0) {
      setPreviewUrl(null)
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = targetWidth
    canvas.height = targetHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(imgRef.current, 0, 0, targetWidth, targetHeight)

    setPreviewUrl(canvas.toDataURL("image/png"))
  }, [targetWidth, targetHeight, image])

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return

    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        const baseName = image.name.replace(/\.[^.]+$/, "")
        a.href = url
        a.download = `${baseName}_${targetWidth}x${targetHeight}.png`
        a.click()
        URL.revokeObjectURL(url)
      },
      "image/png",
      1,
    )
  }, [image, targetWidth, targetHeight])

  const handleReset = useCallback(() => {
    setImage(null)
    setWidth("")
    setHeight("")
    setPercentage("100")
    setPreviewUrl(null)
    setAspectLocked(true)
    setMode("pixels")
    imgRef.current = null
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

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
        /* Drop zone */
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
          <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
            {/* Original info */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                Original
              </h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="max-w-[160px] truncate font-mono text-xs">
                    {image.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dimensions</span>
                  <span className="font-mono text-xs">
                    {image.originalWidth} x {image.originalHeight}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">File size</span>
                  <span className="font-mono text-xs">
                    {formatFileSize(image.fileSize)}
                  </span>
                </div>
              </div>
            </div>

            {/* Mode toggle */}
            <div className="flex rounded-md border border-border">
              <button
                onClick={() => setMode("pixels")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-l-md px-3 py-2 text-sm transition-colors",
                  mode === "pixels"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                )}
              >
                <RulerIcon className="h-3.5 w-3.5" />
                Pixels
              </button>
              <button
                onClick={() => setMode("percentage")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-r-md px-3 py-2 text-sm transition-colors",
                  mode === "percentage"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                )}
              >
                <PercentIcon className="h-3.5 w-3.5" />
                Percentage
              </button>
            </div>

            {/* Dimension inputs */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                Resize
              </h3>

              {mode === "percentage" ? (
                <div>
                  <label className="mb-1.5 block text-xs text-muted-foreground">
                    Scale (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={percentage}
                    onChange={(e) => handlePercentageChange(e.target.value)}
                    className={INPUT_CLASS}
                    placeholder="100"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Output: {targetWidth} x {targetHeight} px
                  </p>
                </div>
              ) : (
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="mb-1.5 block text-xs text-muted-foreground">
                      Width (px)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={width}
                      onChange={(e) => handleWidthChange(e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="Width"
                    />
                  </div>
                  <button
                    onClick={() => setAspectLocked((v) => !v)}
                    className={cn(
                      "mb-0.5 rounded-md p-2 transition-colors",
                      aspectLocked
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    title={
                      aspectLocked ? "Unlock aspect ratio" : "Lock aspect ratio"
                    }
                  >
                    {aspectLocked ? (
                      <LinkIcon className="h-4 w-4" />
                    ) : (
                      <UnlinkIcon className="h-4 w-4" />
                    )}
                  </button>
                  <div className="flex-1">
                    <label className="mb-1.5 block text-xs text-muted-foreground">
                      Height (px)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={height}
                      onChange={(e) => handleHeightChange(e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="Height"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleDownload}
                disabled={!previewUrl}
                className="flex-1"
              >
                <DownloadIcon className="mr-1.5 h-4 w-4" />
                Download PNG
              </Button>
              <Button variant="outline" onClick={handleReset}>
                <RotateCcwIcon className="mr-1.5 h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>

          {/* Preview panel */}
          <div className="flex min-h-[300px] flex-1 flex-col rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-4 py-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Preview</span>
              {previewUrl && (
                <span className="ml-auto font-mono text-xs text-muted-foreground">
                  {targetWidth} x {targetHeight}
                </span>
              )}
            </div>
            <div className="flex flex-1 items-center justify-center overflow-auto p-4">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Resized preview"
                  className="max-h-full max-w-full object-contain"
                  style={{
                    imageRendering:
                      targetWidth > image.originalWidth
                        ? "pixelated"
                        : "auto",
                  }}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Enter valid dimensions to see preview
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
