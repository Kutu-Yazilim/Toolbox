import { useState, useCallback, useRef } from "react"
import type { PdfProcessingState, WatermarkConfig, WatermarkPosition } from "@/types/pdf"
import { INITIAL_PROCESSING_STATE } from "@/types/pdf"
import { PdfFileDropZone } from "@/components/pdf/PdfFileDropZone"
import { PdfProgressBar } from "@/components/pdf/PdfProgressBar"
import { PdfDownloadButton } from "@/components/pdf/PdfDownloadButton"
import { addWatermark } from "@/utils/pdfEngine"
import { validatePdf, friendlyPdfError } from "@/utils/pdfUtils"
import { cn } from "@/lib/utils"

const INITIAL_WATERMARK_CONFIG: WatermarkConfig = {
  type: "text",
  text: "WATERMARK",
  fontSize: 48,
  color: "#ff0000",
  opacity: 0.3,
  rotation: -45,
  position: "diagonal",
  pages: "all",
  layer: "foreground",
  imageData: null,
  imageFormat: "png",
  scale: 0.3,
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
  const [config, setConfig] = useState<WatermarkConfig>(INITIAL_WATERMARK_CONFIG)
  const [processing, setProcessing] = useState<PdfProcessingState>(INITIAL_PROCESSING_STATE)
  const [result, setResult] = useState<Uint8Array | null>(null)
  const [customPages, setCustomPages] = useState("")
  const [pageMode, setPageMode] = useState<"all" | "odd" | "even" | "custom">("all")
  const imageInputRef = useRef<HTMLInputElement>(null)

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
      setConfig((prev) => ({
        ...prev,
        imageData: new Uint8Array(arrayBuffer),
        imageFormat: format,
      }))
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
        ...config,
        pages: pageMode === "custom" ? customPages : pageMode,
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
  }, [pdfFile, config, pageMode, customPages])

  const handleRetry = useCallback(() => {
    setProcessing(INITIAL_PROCESSING_STATE)
    setResult(null)
  }, [])

  return (
    <>
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
                  onClick={() => setConfig((prev) => ({ ...prev, type: t }))}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize",
                    config.type === t
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
          {config.type === "text" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Text</label>
                <input
                  type="text"
                  value={config.text}
                  onChange={(e) => setConfig((prev) => ({ ...prev, text: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                  placeholder="Watermark text"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Font Size: {config.fontSize}px
                </label>
                <input
                  type="range"
                  min={12}
                  max={72}
                  step={1}
                  value={config.fontSize}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, fontSize: Number(e.target.value) }))
                  }
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Color</label>
                <input
                  type="color"
                  value={config.color}
                  onChange={(e) => setConfig((prev) => ({ ...prev, color: e.target.value }))}
                  className="h-9 w-16 rounded border cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Opacity: {config.opacity.toFixed(2)}
                </label>
                <input
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  value={config.opacity}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, opacity: Number(e.target.value) }))
                  }
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Rotation: {config.rotation}°
                </label>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={config.rotation}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, rotation: Number(e.target.value) }))
                  }
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Image Mode Controls */}
          {config.type === "image" && (
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
                {config.imageData && (
                  <p className="text-xs text-muted-foreground">
                    Image loaded ({config.imageFormat.toUpperCase()}, {config.imageData.byteLength} bytes)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Scale: {config.scale.toFixed(2)}
                </label>
                <input
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  value={config.scale}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, scale: Number(e.target.value) }))
                  }
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
                  onClick={() => setConfig((prev) => ({ ...prev, position: pos.value }))}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                    config.position === pos.value
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
                  onClick={() => setConfig((prev) => ({ ...prev, layer: l }))}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize",
                    config.layer === l
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
              (config.type === "image" && !config.imageData)
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
