"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  UploadIcon,
  DownloadIcon,
  RotateCcwIcon,
  ImageIcon,
  AlertTriangleIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

type TargetFormat = "png" | "jpeg" | "webp" | "avif"

type ImageState = {
  src: string
  name: string
  originalFormat: string
  width: number
  height: number
  fileSize: number
}

type ConvertedState = {
  blob: Blob
  previewUrl: string
  size: number
}

const FORMAT_OPTIONS: { value: TargetFormat; label: string }[] = [
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPEG" },
  { value: "webp", label: "WebP" },
  { value: "avif", label: "AVIF" },
]

const MIME_MAP: Record<TargetFormat, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
  avif: "image/avif",
}

const EXT_MAP: Record<TargetFormat, string> = {
  png: "png",
  jpeg: "jpg",
  webp: "webp",
  avif: "avif",
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function detectFormat(mimeType: string): string {
  const map: Record<string, string> = {
    "image/png": "PNG",
    "image/jpeg": "JPEG",
    "image/webp": "WebP",
    "image/avif": "AVIF",
    "image/gif": "GIF",
    "image/bmp": "BMP",
    "image/svg+xml": "SVG",
    "image/tiff": "TIFF",
  }
  return map[mimeType] ?? mimeType.replace("image/", "").toUpperCase()
}

export function ImageFormatConverter() {
  const [image, setImage] = useState<ImageState | null>(null)
  const [targetFormat, setTargetFormat] = useState<TargetFormat>("png")
  const [converted, setConverted] = useState<ConvertedState | null>(null)
  const [converting, setConverting] = useState(false)
  const [unsupported, setUnsupported] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

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
          originalFormat: detectFormat(file.type),
          width: img.naturalWidth,
          height: img.naturalHeight,
          fileSize: file.size,
        })
        setConverted(null)
        setUnsupported(false)
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

  const handleConvert = useCallback(() => {
    if (!imgRef.current || !image) return

    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = image.width
    canvas.height = image.height
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    setConverting(true)
    setUnsupported(false)

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(imgRef.current, 0, 0, image.width, image.height)

    const mime = MIME_MAP[targetFormat]

    canvas.toBlob(
      (blob) => {
        setConverting(false)
        if (!blob) {
          setUnsupported(true)
          setConverted(null)
          return
        }
        setConverted((prev) => {
          if (prev) URL.revokeObjectURL(prev.previewUrl)
          return {
            blob,
            previewUrl: URL.createObjectURL(blob),
            size: blob.size,
          }
        })
      },
      mime,
      targetFormat === "png" ? undefined : 0.92,
    )
  }, [image, targetFormat])

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (converted?.previewUrl) {
        URL.revokeObjectURL(converted.previewUrl)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDownload = useCallback(() => {
    if (!converted || !image) return
    const url = URL.createObjectURL(converted.blob)
    const a = document.createElement("a")
    const baseName = image.name.replace(/\.[^.]+$/, "")
    a.href = url
    a.download = `${baseName}.${EXT_MAP[targetFormat]}`
    a.click()
    URL.revokeObjectURL(url)
  }, [converted, image, targetFormat])

  const handleReset = useCallback(() => {
    if (converted?.previewUrl) {
      URL.revokeObjectURL(converted.previewUrl)
    }
    setImage(null)
    setTargetFormat("png")
    setConverted(null)
    setConverting(false)
    setUnsupported(false)
    setIsDragging(false)
    imgRef.current = null
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [converted])

  // Reset converted state when target format changes
  const handleFormatChange = useCallback(
    (fmt: TargetFormat) => {
      if (converted?.previewUrl) {
        URL.revokeObjectURL(converted.previewUrl)
      }
      setTargetFormat(fmt)
      setConverted(null)
      setUnsupported(false)
    },
    [converted],
  )

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
                  <span className="text-muted-foreground">Format</span>
                  <span className="font-mono text-xs">
                    {image.originalFormat}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dimensions</span>
                  <span className="font-mono text-xs">
                    {image.width} x {image.height}
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

            {/* Target format selector */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                Target Format
              </h3>
              <div className="flex rounded-md border border-border">
                {FORMAT_OPTIONS.map((opt, i) => (
                  <button
                    key={opt.value}
                    onClick={() => handleFormatChange(opt.value)}
                    className={cn(
                      "flex flex-1 items-center justify-center px-3 py-2 text-sm transition-colors",
                      i === 0 && "rounded-l-md",
                      i === FORMAT_OPTIONS.length - 1 && "rounded-r-md",
                      targetFormat === opt.value
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Convert button */}
            <Button onClick={handleConvert} disabled={converting}>
              {converting ? "Converting..." : "Convert"}
            </Button>

            {/* Unsupported warning */}
            {unsupported && (
              <div className="flex items-start gap-2 rounded-lg border border-border bg-card p-4 text-sm">
                <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                <span className="text-muted-foreground">
                  {targetFormat.toUpperCase()} is not supported by your browser.
                  Try a different format.
                </span>
              </div>
            )}

            {/* Converted info */}
            {converted && (
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                  Converted
                </h3>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Format</span>
                    <span className="font-mono text-xs">
                      {targetFormat.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">File size</span>
                    <span className="font-mono text-xs">
                      {formatFileSize(converted.size)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleDownload}
                disabled={!converted}
                className="flex-1"
              >
                <DownloadIcon className="mr-1.5 h-4 w-4" />
                Download
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
              {converted && (
                <span className="ml-auto font-mono text-xs text-muted-foreground">
                  {targetFormat.toUpperCase()} &middot;{" "}
                  {formatFileSize(converted.size)}
                </span>
              )}
            </div>
            <div className="flex flex-1 items-center justify-center overflow-auto p-4">
              {converted ? (
                <img
                  src={converted.previewUrl}
                  alt="Converted preview"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <img
                  src={image.src}
                  alt="Original preview"
                  className="max-h-full max-w-full object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
