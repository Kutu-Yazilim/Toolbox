"use client"

import { useState, useCallback, useRef } from "react"
import type { PdfProcessingState, WatermarkConfig, WatermarkPosition } from "@/types/pdf"
import { INITIAL_PROCESSING_STATE } from "@/types/pdf"
import { PdfFileDropZone } from "@/components/pdf/PdfFileDropZone"
import { PdfProgressBar } from "@/components/pdf/PdfProgressBar"
import { PdfDownloadButton } from "@/components/pdf/PdfDownloadButton"
import { addWatermark } from "@/utils/pdfEngine"
import { validatePdf, friendlyPdfError, downloadPdf } from "@/utils/pdfUtils"
import { cn } from "@/lib/utils"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useShareableUrl } from "@/hooks/useShareableUrl"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { PDF_WATERMARK_PRESETS } from "@/components/pdf/pdfPresets"
import type { Preset } from "@/components/shared/PresetsDrawer"
import type { ExportOption } from "@/components/shared/ExportMenu"

interface WatermarkSettings {
  text: string
  fontSize: number
  color: string
  opacity: number
  rotation: number
  position: WatermarkPosition
  layer: "foreground" | "background"
}

const DEFAULT_SETTINGS: WatermarkSettings = {
  text: "WATERMARK",
  fontSize: 48,
  color: "#ff0000",
  opacity: 0.3,
  rotation: -45,
  position: "diagonal",
  layer: "foreground",
}

const POSITIONS: { value: WatermarkPosition; label: string }[] = [
  { value: "top-left", label: "Top Left" },
  { value: "center", label: "Center" },
  { value: "top-right", label: "Top Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "diagonal", label: "Diagonal" },
  { value: "bottom-right", label: "Bottom Right" },
  { value: "mosaic", label: "Mosaic" },
]

const PAGE_PRESETS = ["all", "odd", "even"] as const

export function PdfWatermark() {
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [settings, setSettings] = useLocalStorage<WatermarkSettings>(
    "pdf-tool-watermark-settings",
    DEFAULT_SETTINGS,
  )
  const [watermarkType, setWatermarkType] = useState<"text" | "image">("text")
  const [imageData, setImageData] = useState<Uint8Array | null>(null)
  const [imageFormat, setImageFormat] = useState<"png" | "jpg">("png")
  const [scale, setScale] = useState(0.3)
  const [processing, setProcessing] = useState<PdfProcessingState>(INITIAL_PROCESSING_STATE)
  const [result, setResult] = useState<Uint8Array | null>(null)
  const [customPages, setCustomPages] = useState("")
  const [pageMode, setPageMode] = useState<"all" | "odd" | "even" | "custom">("all")
  const imageInputRef = useRef<HTMLInputElement>(null)

  const { shareUrl } = useShareableUrl<WatermarkSettings>(
    "pdf-watermark",
    settings,
    useCallback((restored: WatermarkSettings) => setSettings(restored), [setSettings]),
  )

  const handleFiles = useCallback((files: File[]) => {
    setResult(null)
    setProcessing(INITIAL_PROCESSING_STATE)
    setPdfFile(files[0] ?? null)
  }, [])

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer
      const format = file.type === "image/jpeg" ? "jpg" : "png"
      setImageData(new Uint8Array(arrayBuffer))
      setImageFormat(format)
    }
    reader.readAsArrayBuffer(file)
  }, [])

  const handleApply = useCallback(async () => {
    if (!pdfFile) return

    setProcessing({
      status: "reading",
      progress: 0,
      message: "Reading PDF...",
      error: null,
    })
    setResult(null)

    try {
      const buffer = await pdfFile.arrayBuffer()
      await validatePdf(buffer)

      setProcessing({
        status: "processing",
        progress: 50,
        message: "Applying watermark...",
        error: null,
      })

      const finalConfig: WatermarkConfig = {
        type: watermarkType,
        text: settings.text,
        fontSize: settings.fontSize,
        color: settings.color,
        opacity: settings.opacity,
        rotation: settings.rotation,
        position: settings.position,
        pages: pageMode === "custom" ? customPages : pageMode,
        layer: settings.layer,
        imageData,
        imageFormat,
        scale,
      }

      const output = await addWatermark(buffer, finalConfig)

      setResult(output)
      setProcessing({
        status: "done",
        progress: 100,
        message: "Watermark applied!",
        error: null,
      })
    } catch (err) {
      setProcessing({
        status: "error",
        progress: 0,
        message: "",
        error: friendlyPdfError(err),
      })
    }
  }, [pdfFile, settings, watermarkType, pageMode, customPages, imageData, imageFormat, scale])

  const handleDownload = useCallback(() => {
    if (result) {
      downloadPdf(result, `watermarked-${pdfFile?.name ?? "output.pdf"}`)
    }
  }, [result, pdfFile])

  const handleRetry = useCallback(() => {
    setProcessing(INITIAL_PROCESSING_STATE)
    setResult(null)
  }, [])

  const handlePresetSelect = useCallback((preset: Preset) => {
    const parsed = JSON.parse(preset.content) as Partial<WatermarkSettings>
    setSettings((prev) => ({ ...prev, ...parsed }))
    setWatermarkType("text")
  }, [setSettings])

  const shortcuts = [
    { key: "mod+enter", label: "Apply watermark", action: handleApply },
    { key: "mod+s", label: "Download result", action: handleDownload },
  ]

  useKeyboardShortcuts(shortcuts)

  const exportOptions: ExportOption[] = result
    ? [{ label: "Download as PDF", action: handleDownload }]
    : []

  const toolbarStatus = processing.status === "done"
    ? { type: "success" as const, label: processing.message }
    : processing.status === "error"
    ? { type: "error" as const, label: processing.error ?? "Error" }
    : null

  return (
    <>
      <ToolToolbar
        title="PDF Watermark"
        status={toolbarStatus}
        onShare={shareUrl}
        exportOptions={exportOptions}
        presets={PDF_WATERMARK_PRESETS}
        onPresetSelect={handlePresetSelect}
        shortcuts={shortcuts}
      />

      <PdfFileDropZone
        acceptedMimeTypes={["application/pdf"]}
        acceptedExtensions={[".pdf"]}
        multiple={false}
        onFiles={handleFiles}
        label="Drop a PDF file here to add watermark"
      />

      {pdfFile && (
        <div className="space-y-5">
          {/* Watermark Type Toggle */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Watermark Type</label>
            <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
              {(["text", "image"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setWatermarkType(t)}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize",
                    watermarkType === t
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Text Mode Controls */}
          {watermarkType === "text" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Text</label>
                <input
                  type="text"
                  value={settings.text}
                  onChange={(e) => setSettings((prev) => ({ ...prev, text: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                  placeholder="Watermark text"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Font Size: {settings.fontSize}px
                </label>
                <input
                  type="range"
                  min={12}
                  max={72}
                  step={1}
                  value={settings.fontSize}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, fontSize: Number(e.target.value) }))
                  }
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Color</label>
                <input
                  type="color"
                  value={settings.color}
                  onChange={(e) => setSettings((prev) => ({ ...prev, color: e.target.value }))}
                  className="h-9 w-16 rounded border cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Opacity: {settings.opacity.toFixed(2)}
                </label>
                <input
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  value={settings.opacity}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, opacity: Number(e.target.value) }))
                  }
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Rotation: {settings.rotation}°
                </label>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={settings.rotation}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, rotation: Number(e.target.value) }))
                  }
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Image Mode Controls */}
          {watermarkType === "image" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Watermark Image</label>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                  onChange={handleImageUpload}
                  className="block w-full text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-muted file:text-foreground hover:file:bg-muted/80 file:cursor-pointer"
                />
                {imageData && (
                  <p className="text-xs text-muted-foreground">
                    Image loaded ({imageFormat.toUpperCase()}, {imageData.byteLength} bytes)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Scale: {scale.toFixed(2)}
                </label>
                <input
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Position Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Position</label>
            <div className="grid grid-cols-3 gap-1.5 w-fit">
              {POSITIONS.map((pos) => (
                <button
                  key={pos.value}
                  onClick={() => setSettings((prev) => ({ ...prev, position: pos.value }))}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                    settings.position === pos.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  )}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          {/* Page Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Pages</label>
            <div className="flex flex-wrap gap-1.5">
              {PAGE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setPageMode(preset)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize",
                    pageMode === preset
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  )}
                >
                  {preset}
                </button>
              ))}
              <button
                onClick={() => setPageMode("custom")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  pageMode === "custom"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                )}
              >
                Custom
              </button>
            </div>
            {pageMode === "custom" && (
              <input
                type="text"
                value={customPages}
                onChange={(e) => setCustomPages(e.target.value)}
                placeholder="e.g. 1-3, 5, 7-10"
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm mt-1.5"
              />
            )}
          </div>

          {/* Layer Toggle */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Layer</label>
            <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
              {(["foreground", "background"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setSettings((prev) => ({ ...prev, layer: l }))}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize",
                    settings.layer === l
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Apply Button */}
          <button
            onClick={handleApply}
            disabled={
              processing.status === "processing" ||
              processing.status === "reading" ||
              (watermarkType === "image" && !imageData)
            }
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            Apply Watermark
          </button>
        </div>
      )}

      <PdfProgressBar state={processing} onRetry={handleRetry} />

      {result && (
        <PdfDownloadButton
          data={result}
          filename={`watermarked-${pdfFile?.name ?? "output.pdf"}`}
        />
      )}
    </>
  )
}
