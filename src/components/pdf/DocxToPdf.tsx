import { useState, useCallback, useRef } from "react"
import mammoth from "mammoth"
import { toPng } from "html-to-image"
import { jsPDF } from "jspdf"
import type { PdfProcessingState } from "@/types/pdf"
import { INITIAL_PROCESSING_STATE } from "@/types/pdf"
import { PdfFileDropZone } from "@/components/pdf/PdfFileDropZone"
import { PdfProgressBar } from "@/components/pdf/PdfProgressBar"
import { PdfDownloadButton } from "@/components/pdf/PdfDownloadButton"
import { cn } from "@/lib/utils"

const ACCEPTED_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]
const ACCEPTED_EXTENSIONS = [".docx"]

const A4_WIDTH_PX = 595
const A4_HEIGHT_PX = 842

export function DocxToPdf() {
  const [htmlContent, setHtmlContent] = useState<string | null>(null)
  const [fileName, setFileName] = useState("")
  const [processing, setProcessing] = useState<PdfProcessingState>(INITIAL_PROCESSING_STATE)
  const [result, setResult] = useState<Blob | null>(null)
  const captureRef = useRef<HTMLDivElement>(null)

  const handleFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return

    setResult(null)
    setProcessing({
      status: "reading",
      progress: 0,
      message: "Reading DOCX file...",
      error: null,
    })

    try {
      const file = files[0]
      setFileName(file.name.replace(/\.docx$/i, ""))
      const buffer = await file.arrayBuffer()
      const { value } = await mammoth.convertToHtml({ arrayBuffer: buffer })
      setHtmlContent(value)
      setProcessing(INITIAL_PROCESSING_STATE)
    } catch (err) {
      setProcessing({
        status: "error",
        progress: 0,
        message: "",
        error: err instanceof Error ? err.message : "Failed to read DOCX file",
      })
    }
  }, [])

  const handleConvert = useCallback(async () => {
    if (!captureRef.current || !htmlContent) return

    setProcessing({
      status: "processing",
      progress: 0,
      message: "Generating PDF...",
      error: null,
    })

    try {
      const container = captureRef.current
      const totalHeight = container.scrollHeight
      const pageCount = Math.ceil(totalHeight / A4_HEIGHT_PX)
      const pdf = new jsPDF({ unit: "px", format: [A4_WIDTH_PX, A4_HEIGHT_PX] })

      for (let page = 0; page < pageCount; page++) {
        if (page > 0) {
          pdf.addPage([A4_WIDTH_PX, A4_HEIGHT_PX])
        }

        const clipTop = page * A4_HEIGHT_PX
        const clipHeight = Math.min(A4_HEIGHT_PX, totalHeight - clipTop)

        const dataUrl = await toPng(container, {
          width: A4_WIDTH_PX,
          height: clipHeight,
          style: {
            transform: `translateY(-${clipTop}px)`,
            transformOrigin: "top left",
          },
          canvasWidth: A4_WIDTH_PX,
          canvasHeight: clipHeight,
        })

        pdf.addImage(dataUrl, "PNG", 0, 0, A4_WIDTH_PX, clipHeight)

        setProcessing({
          status: "processing",
          progress: ((page + 1) / pageCount) * 100,
          message: `Rendering page ${page + 1} of ${pageCount}...`,
          error: null,
        })
      }

      const blob = pdf.output("blob")
      setResult(blob)
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
        error: err instanceof Error ? err.message : "PDF conversion failed",
      })
    }
  }, [htmlContent])

  const handleRetry = useCallback(() => {
    setProcessing(INITIAL_PROCESSING_STATE)
    setResult(null)
  }, [])

  return (
    <>
      <PdfFileDropZone
        acceptedMimeTypes={ACCEPTED_MIME_TYPES}
        acceptedExtensions={ACCEPTED_EXTENSIONS}
        multiple={false}
        onFiles={handleFiles}
        label="Drop a DOCX file here or click to browse"
      />

      {htmlContent && (
        <>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Preview
            </p>
            <div
              className={cn(
                "rounded-lg border border-border overflow-auto max-h-[500px]",
                "bg-white p-8 text-black"
              )}
              style={{
                fontFamily: "serif",
                fontSize: "12pt",
                lineHeight: 1.6,
              }}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
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
          filename={`${fileName || "document"}.pdf`}
        />
      )}

      {htmlContent && (
        <div
          ref={captureRef}
          style={{
            position: "fixed",
            left: "-9999px",
            top: 0,
            width: `${A4_WIDTH_PX}px`,
            background: "white",
            color: "black",
            padding: "40px",
            fontFamily: "serif",
            fontSize: "12pt",
            lineHeight: 1.6,
            boxSizing: "border-box",
          }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      )}
    </>
  )
}
