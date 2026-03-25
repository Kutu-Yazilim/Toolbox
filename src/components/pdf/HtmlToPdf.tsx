"use client"

import { useState, useCallback, useRef } from "react"
import { toPng } from "html-to-image"
import { jsPDF } from "jspdf"
import type { PdfProcessingState } from "@/types/pdf"
import { INITIAL_PROCESSING_STATE } from "@/types/pdf"
import { PdfFileDropZone } from "@/components/pdf/PdfFileDropZone"
import { PdfProgressBar } from "@/components/pdf/PdfProgressBar"
import { PdfDownloadButton } from "@/components/pdf/PdfDownloadButton"
import { cn } from "@/lib/utils"

type InputMode = "upload" | "paste"
type PageSizeOption = "a4" | "letter"
type OrientationOption = "portrait" | "landscape"
type MarginOption = "none" | "small" | "normal"

const INPUT_MODE_OPTIONS: { value: InputMode; label: string }[] = [
  { value: "upload", label: "Upload File" },
  { value: "paste", label: "Paste HTML" },
]

const PAGE_SIZE_OPTIONS: { value: PageSizeOption; label: string }[] = [
  { value: "a4", label: "A4" },
  { value: "letter", label: "Letter" },
]

const ORIENTATION_OPTIONS: { value: OrientationOption; label: string }[] = [
  { value: "portrait", label: "Portrait" },
  { value: "landscape", label: "Landscape" },
]

const MARGIN_OPTIONS: { value: MarginOption; label: string }[] = [
  { value: "none", label: "None" },
  { value: "small", label: "Small" },
  { value: "normal", label: "Normal" },
]

const PAGE_DIMENSIONS: Record<PageSizeOption, { width: number; height: number }> = {
  a4: { width: 210, height: 297 },
  letter: { width: 215.9, height: 279.4 },
}

const MARGIN_VALUES: Record<MarginOption, number> = {
  none: 0,
  small: 10,
  normal: 20,
}

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

export function HtmlToPdf() {
  const [inputMode, setInputMode] = useState<InputMode>("upload")
  const [htmlContent, setHtmlContent] = useState<string>("")
  const [pageSize, setPageSize] = useState<PageSizeOption>("a4")
  const [orientation, setOrientation] = useState<OrientationOption>("portrait")
  const [margin, setMargin] = useState<MarginOption>("normal")
  const [processing, setProcessing] = useState<PdfProcessingState>(INITIAL_PROCESSING_STATE)
  const [result, setResult] = useState<Blob | null>(null)
  const renderRef = useRef<HTMLDivElement>(null)

  const handleFiles = useCallback((files: File[]) => {
    if (files.length === 0) return
    setResult(null)
    setProcessing(INITIAL_PROCESSING_STATE)

    const reader = new FileReader()
    reader.onload = () => {
      setHtmlContent(reader.result as string)
    }
    reader.onerror = () => {
      setProcessing({
        status: "error",
        progress: 0,
        message: "",
        error: "Failed to read the HTML file",
      })
    }
    reader.readAsText(files[0])
  }, [])

  const handleConvert = useCallback(async () => {
    if (!htmlContent.trim()) return

    setProcessing({
      status: "processing",
      progress: 0,
      message: "Preparing HTML content...",
      error: null,
    })
    setResult(null)

    try {
      const marginMm = MARGIN_VALUES[margin]
      const dims = PAGE_DIMENSIONS[pageSize]
      const pageW = orientation === "landscape" ? dims.height : dims.width
      const pageH = orientation === "landscape" ? dims.width : dims.height

      const contentW = pageW - marginMm * 2
      const contentH = pageH - marginMm * 2

      const scale = 3
      const pxWidth = Math.round(contentW * scale)
      const pxPageHeight = Math.round(contentH * scale)

      const container = document.createElement("div")
      container.style.position = "fixed"
      container.style.left = "-9999px"
      container.style.top = "0"
      container.style.width = `${pxWidth}px`
      container.style.background = "white"
      container.style.color = "black"
      container.style.padding = "0"
      container.style.margin = "0"
      container.style.fontFamily = "sans-serif"
      container.style.fontSize = "14px"
      container.style.lineHeight = "1.6"
      container.innerHTML = htmlContent
      document.body.appendChild(container)

      await new Promise((r) => setTimeout(r, 200))

      const totalHeight = container.scrollHeight
      const pageCount = Math.ceil(totalHeight / pxPageHeight)

      setProcessing({
        status: "processing",
        progress: 10,
        message: `Rendering ${pageCount} page${pageCount !== 1 ? "s" : ""}...`,
        error: null,
      })

      const pdf = new jsPDF({
        orientation: orientation === "landscape" ? "l" : "p",
        unit: "mm",
        format: pageSize,
      })

      for (let i = 0; i < pageCount; i++) {
        const chunkTop = i * pxPageHeight
        const chunkHeight = Math.min(pxPageHeight, totalHeight - chunkTop)

        const dataUrl = await toPng(container, {
          width: pxWidth,
          height: chunkHeight,
          pixelRatio: 1,
          style: {
            transform: `translateY(-${chunkTop}px)`,
            transformOrigin: "top left",
          },
          canvasWidth: pxWidth,
          canvasHeight: chunkHeight,
        })

        const imgH = (chunkHeight / pxPageHeight) * contentH

        if (i > 0) pdf.addPage()
        pdf.addImage(dataUrl, "PNG", marginMm, marginMm, contentW, imgH)

        setProcessing({
          status: "processing",
          progress: 10 + ((i + 1) / pageCount) * 85,
          message: `Rendered page ${i + 1} of ${pageCount}...`,
          error: null,
        })
      }

      document.body.removeChild(container)

      const pdfBlob = pdf.output("blob")
      setResult(pdfBlob)
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
  }, [htmlContent, pageSize, orientation, margin])

  const handleRetry = useCallback(() => {
    setProcessing(INITIAL_PROCESSING_STATE)
    setResult(null)
  }, [])

  return (
    <>
      <OptionGroup
        label="Input Mode"
        options={INPUT_MODE_OPTIONS}
        value={inputMode}
        onChange={(v) => {
          setInputMode(v)
          setHtmlContent("")
          setResult(null)
          setProcessing(INITIAL_PROCESSING_STATE)
        }}
      />

      {inputMode === "upload" ? (
        <PdfFileDropZone
          acceptedMimeTypes={["text/html"]}
          acceptedExtensions={[".html", ".htm"]}
          multiple={false}
          onFiles={handleFiles}
          label="Drop an HTML file here or click to browse"
        />
      ) : (
        <textarea
          value={htmlContent}
          onChange={(e) => {
            setHtmlContent(e.target.value)
            setResult(null)
            setProcessing(INITIAL_PROCESSING_STATE)
          }}
          placeholder="Paste your HTML content here..."
          className={cn(
            "w-full min-h-[200px] p-4 rounded-xl border border-muted-foreground/20",
            "bg-background text-foreground font-mono text-sm",
            "resize-y focus:outline-none focus:ring-2 focus:ring-primary/50",
            "placeholder:text-muted-foreground/50"
          )}
        />
      )}

      {htmlContent.trim() && (
        <>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Preview
            </label>
            <div
              ref={renderRef}
              className="rounded-xl border border-muted-foreground/20 bg-white p-6 max-h-[400px] overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>

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
          </div>
        </>
      )}

      <PdfProgressBar state={processing} onRetry={handleRetry} />

      {result && (
        <PdfDownloadButton
          data={result}
          filename="html-to-pdf.pdf"
        />
      )}
    </>
  )
}
