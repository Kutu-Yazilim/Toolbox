"use client"

import { useState, useCallback } from "react"
import type {
  PdfToolId,
  PageOptions,
  PdfImageData,
  PdfProcessingState,
} from "@/types/pdf"
import { INITIAL_PROCESSING_STATE } from "@/types/pdf"
import { getToolDefinition } from "@/components/pdf/pdfToolCatalog"
import { PdfFileDropZone } from "@/components/pdf/PdfFileDropZone"
import { PdfProgressBar } from "@/components/pdf/PdfProgressBar"
import { PdfDownloadButton } from "@/components/pdf/PdfDownloadButton"
import { imagesToPdf } from "@/utils/pdfConverters"
import { cn } from "@/lib/utils"

type PageSizeOption = "fit" | "a4" | "letter"
type OrientationOption = "portrait" | "landscape" | "auto"
type MarginOption = "none" | "small" | "normal"

const PAGE_SIZE_OPTIONS: { value: PageSizeOption; label: string }[] = [
  { value: "fit", label: "Fit to image" },
  { value: "a4", label: "A4" },
  { value: "letter", label: "Letter" },
]

const ORIENTATION_OPTIONS: { value: OrientationOption; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "portrait", label: "Portrait" },
  { value: "landscape", label: "Landscape" },
]

const MARGIN_OPTIONS: { value: MarginOption; label: string }[] = [
  { value: "none", label: "None" },
  { value: "small", label: "Small" },
  { value: "normal", label: "Normal" },
]

function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
        {label}
      </label>
      <div className="flex gap-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              value === opt.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ImageToPdf({ toolId }: { toolId: PdfToolId }) {
  const toolDef = getToolDefinition(toolId)!
  const [images, setImages] = useState<PdfImageData[]>([])
  const [pageSize, setPageSize] = useState<PageSizeOption>("fit")
  const [orientation, setOrientation] = useState<OrientationOption>("auto")
  const [margin, setMargin] = useState<MarginOption>("none")
  const [processing, setProcessing] = useState<PdfProcessingState>(INITIAL_PROCESSING_STATE)
  const [result, setResult] = useState<Uint8Array | null>(null)

  const handleFiles = useCallback((files: File[]) => {
    setResult(null)
    setProcessing(INITIAL_PROCESSING_STATE)

    const promises = files.map(
      (file) =>
        new Promise<PdfImageData>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            const img = new Image()
            img.onload = () => {
              resolve({
                dataUrl: reader.result as string,
                width: img.naturalWidth,
                height: img.naturalHeight,
                name: file.name,
              })
            }
            img.onerror = reject
            img.src = reader.result as string
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
    )

    Promise.all(promises).then(setImages).catch(console.error)
  }, [])

  const handleConvert = useCallback(async () => {
    if (images.length === 0) return

    setProcessing({
      status: "processing",
      progress: 0,
      message: "Converting images to PDF...",
      error: null,
    })

    try {
      const options: PageOptions = { pageSize, orientation, margin }
      const pdfBytes = await imagesToPdf(images, options)
      setResult(pdfBytes)
      setProcessing({
        status: "done",
        progress: 100,
        message: "Conversion complete!",
        error: null,
      })
    } catch (err) {
      setProcessing({
        status: "error",
        progress: 0,
        message: "",
        error: err instanceof Error ? err.message : "Conversion failed",
      })
    }
  }, [images, pageSize, orientation, margin])

  const handleRetry = useCallback(() => {
    setProcessing(INITIAL_PROCESSING_STATE)
    setResult(null)
  }, [])

  return (
    <>
      <PdfFileDropZone
        acceptedMimeTypes={toolDef.acceptedMimeTypes}
        acceptedExtensions={toolDef.acceptedExtensions}
        multiple={toolDef.multiFile}
        onFiles={handleFiles}
        label={`Drop ${toolId === "jpg-to-pdf" ? "JPG" : "PNG"} images here`}
      />

      {images.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <OptionGroup
              label="Page Size"
              options={PAGE_SIZE_OPTIONS}
              value={pageSize}
              onChange={setPageSize}
            />
            <OptionGroup
              label="Orientation"
              options={ORIENTATION_OPTIONS}
              value={orientation}
              onChange={setOrientation}
            />
            <OptionGroup
              label="Margins"
              options={MARGIN_OPTIONS}
              value={margin}
              onChange={setMargin}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleConvert}
              disabled={processing.status === "processing"}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              Convert to PDF
            </button>
            <span className="text-xs text-muted-foreground">
              {images.length} image{images.length !== 1 ? "s" : ""}
            </span>
          </div>
        </>
      )}

      <PdfProgressBar state={processing} onRetry={handleRetry} />

      {result && (
        <PdfDownloadButton
          data={result}
          filename={`images-to-pdf.pdf`}
        />
      )}
    </>
  )
}
