"use client"

import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  UploadIcon,
  DownloadIcon,
  RotateCcwIcon,
  ImageIcon,
  InfoIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useShareableUrl } from "@/hooks/useShareableUrl"
import { useFileImport } from "@/hooks/useFileImport"
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { IMAGE_COMPRESSOR_PRESETS } from "./presets"
import { type Preset } from "@/components/shared/PresetsDrawer"

type OutputFormat = "jpeg" | "webp" | "png"

type ImageState = {
  src: string
  name: string
  width: number
  height: number
  fileSize: number
}

type CompressedState = {
  blob: Blob
  previewUrl: string
  size: number
}

const FORMAT_OPTIONS: { value: OutputFormat; label: string }[] = [
  { value: "jpeg", label: "JPEG" },
  { value: "webp", label: "WebP" },
  { value: "png", label: "PNG" },
]

const MIME_MAP: Record<OutputFormat, string> = {
  jpeg: "image/jpeg",
  webp: "image/webp",
  png: "image/png",
}

const EXT_MAP: Record<OutputFormat, string> = {
  jpeg: "jpg",
  webp: "webp",
  png: "png",
}

const DEFAULT_QUALITY = 80

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function calcReduction(original: number, compressed: number): string {
  if (original === 0) return "0"
  return ((1 - compressed / original) * 100).toFixed(1)
}

type CompressSettings = { quality: number; format: OutputFormat }

export function ImageCompressor() {
  const [image, setImage] = useState<ImageState | null>(null)
  const [settings, setSettings] = useLocalStorage<CompressSettings>("image-compressor-settings", {
    quality: DEFAULT_QUALITY,
    format: "jpeg",
  })
  const [compressed, setCompressed] = useState<CompressedState | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  const shareState = useMemo(() => settings, [settings])
  const { shareUrl } = useShareableUrl("image-compressor", shareState, useCallback((state: CompressSettings) => {
    setSettings(state)
  }, [setSettings]))

  const handleFileImport = useCallback((content: string, filename: string) => {
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      setImage({
        src: content,
        name: filename,
        width: img.naturalWidth,
        height: img.naturalHeight,
        fileSize: Math.round(content.length * 0.75),
      })
      setCompressed(null)
    }
    img.src = content
  }, [])

  const { dropzoneProps, openFilePicker, isDragging } = useFileImport({
    accept: [".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".bmp"],
    onImport: handleFileImport,
    readAs: "dataURL",
  })

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
          width: img.naturalWidth,
          height: img.naturalHeight,
          fileSize: file.size,
        })
        setCompressed(null)
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file && file.type.startsWith("image/")) loadImage(file)
    },
    [loadImage],
  )

  useEffect(() => {
    if (!imgRef.current || !image) {
      setCompressed(null)
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = image.width
    canvas.height = image.height
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(imgRef.current, 0, 0, image.width, image.height)

    const mime = MIME_MAP[settings.format]
    const q = settings.format === "png" ? undefined : settings.quality / 100

    canvas.toBlob(
      (blob) => {
        if (!blob) return
        setCompressed((prev) => {
          if (prev) URL.revokeObjectURL(prev.previewUrl)
          return { blob, previewUrl: URL.createObjectURL(blob), size: blob.size }
        })
      },
      mime,
      q,
    )
  }, [image, settings.quality, settings.format])

  useEffect(() => {
    return () => {
      if (compressed?.previewUrl) URL.revokeObjectURL(compressed.previewUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDownload = useCallback(() => {
    if (!compressed || !image) return
    const url = URL.createObjectURL(compressed.blob)
    const a = document.createElement("a")
    const baseName = image.name.replace(/\.[^.]+$/, "")
    a.href = url
    a.download = `${baseName}_compressed.${EXT_MAP[settings.format]}`
    a.click()
    URL.revokeObjectURL(url)
  }, [compressed, image, settings.format])

  const handleReset = useCallback(() => {
    if (compressed?.previewUrl) URL.revokeObjectURL(compressed.previewUrl)
    setImage(null)
    setSettings({ quality: DEFAULT_QUALITY, format: "jpeg" })
    setCompressed(null)
    imgRef.current = null
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [compressed, setSettings])

  const handlePresetSelect = useCallback((preset: Preset) => {
    const data = JSON.parse(preset.content)
    setSettings({ quality: data.quality, format: data.format })
  }, [setSettings])

  const isPng = settings.format === "png"
  const reduction = image && compressed ? calcReduction(image.fileSize, compressed.size) : "0"
  const reductionNum = parseFloat(reduction)

  const shortcuts: Shortcut[] = useMemo(() => [
    { key: "mod+o", label: "Open image", action: openFilePicker },
    { key: "mod+s", label: "Download compressed", action: handleDownload },
    { key: "mod+shift+r", label: "Reset", action: handleReset },
  ], [openFilePicker, handleDownload, handleReset])

  useKeyboardShortcuts(shortcuts)

  const exportOptions = useMemo(() => [
    { label: "Download compressed", action: handleDownload },
  ], [handleDownload])

  return (
    <div className="flex h-full flex-col">
      <ToolToolbar
        title="Image Compressor"
        status={compressed ? { type: "success", label: `${Math.abs(reductionNum).toFixed(1)}% ${reductionNum > 0 ? "smaller" : "larger"}` } : null}
        onShare={shareUrl}
        exportOptions={compressed ? exportOptions : undefined}
        presets={IMAGE_COMPRESSOR_PRESETS}
        onPresetSelect={handlePresetSelect}
        shortcuts={shortcuts}
      />
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
        <canvas ref={canvasRef} className="hidden" />
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

        {!image ? (
          <div
            {...dropzoneProps}
            onClick={openFilePicker}
            className={cn(
              "flex min-h-[300px] cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed transition-colors",
              isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
            )}
          >
            <UploadIcon className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">Drop an image here or click to browse</p>
              <p className="mt-1 text-xs text-muted-foreground">Supports PNG, JPEG, WebP, GIF, BMP, SVG</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">Original</h3>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span className="max-w-[160px] truncate font-mono text-xs">{image.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dimensions</span>
                    <span className="font-mono text-xs">{image.width} x {image.height}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">File size</span>
                    <span className="font-mono text-xs">{formatFileSize(image.fileSize)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">Output Format</h3>
                <div className="flex rounded-md border border-border">
                  {FORMAT_OPTIONS.map((opt, i) => (
                    <button
                      key={opt.value}
                      onClick={() => setSettings(prev => ({ ...prev, format: opt.value }))}
                      className={cn(
                        "flex flex-1 items-center justify-center px-3 py-2 text-sm transition-colors",
                        i === 0 && "rounded-l-md",
                        i === FORMAT_OPTIONS.length - 1 && "rounded-r-md",
                        settings.format === opt.value ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">Quality</h3>
                  <span className="font-mono text-sm">{settings.quality}</span>
                </div>
                <input
                  type="range" min={1} max={100} value={settings.quality}
                  onChange={(e) => setSettings(prev => ({ ...prev, quality: Number(e.target.value) }))}
                  disabled={isPng}
                  className={cn("w-full accent-primary", isPng && "opacity-40")}
                />
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span>100</span>
                </div>
                {isPng && (
                  <div className="mt-3 flex items-start gap-2 rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
                    <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>PNG is a lossless format. The quality slider does not apply.</span>
                  </div>
                )}
              </div>

              {compressed && (
                <div className="rounded-lg border border-border bg-card p-4">
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">Compressed</h3>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">File size</span>
                      <span className="font-mono text-xs">{formatFileSize(compressed.size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reduction</span>
                      <span className={cn("font-mono text-xs", reductionNum > 0 ? "text-green-500" : reductionNum < 0 ? "text-red-500" : "text-muted-foreground")}>
                        {reductionNum > 0 ? "-" : reductionNum < 0 ? "+" : ""}{Math.abs(reductionNum)}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full transition-all", reductionNum > 0 ? "bg-green-500" : "bg-red-500")}
                        style={{ width: `${Math.min(Math.abs(reductionNum), 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatFileSize(image.fileSize)}</span>
                      <span>{formatFileSize(compressed.size)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleDownload} disabled={!compressed} className="flex-1">
                  <DownloadIcon className="mr-1.5 h-4 w-4" />
                  Download
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcwIcon className="mr-1.5 h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>

            <div className="flex min-h-[300px] flex-1 flex-col rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-4 py-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Preview</span>
                {compressed && (
                  <span className="ml-auto font-mono text-xs text-muted-foreground">
                    {settings.format.toUpperCase()} &middot; {formatFileSize(compressed.size)}
                  </span>
                )}
              </div>
              <div className="flex flex-1 items-center justify-center overflow-auto p-4">
                {compressed ? (
                  <img src={compressed.previewUrl} alt="Compressed preview" className="max-h-full max-w-full object-contain" />
                ) : (
                  <p className="text-sm text-muted-foreground">Compressing...</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
