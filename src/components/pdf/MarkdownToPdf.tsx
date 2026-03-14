import { useState, useCallback, useRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { toPng } from "html-to-image"
import { jsPDF } from "jspdf"
import type { PdfProcessingState } from "@/types/pdf"
import { INITIAL_PROCESSING_STATE } from "@/types/pdf"
import { PdfFileDropZone } from "@/components/pdf/PdfFileDropZone"
import { PdfProgressBar } from "@/components/pdf/PdfProgressBar"
import { PdfDownloadButton } from "@/components/pdf/PdfDownloadButton"
import { cn } from "@/lib/utils"

type InputMode = "upload" | "type"
type PageSizeOption = "a4" | "letter"
type OrientationOption = "portrait" | "landscape"
type MarginOption = "none" | "small" | "normal"

const INPUT_MODE_OPTIONS: { value: InputMode; label: string }[] = [
  { value: "upload", label: "Upload File" },
  { value: "type", label: "Type Markdown" },
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

export function MarkdownToPdf() {
  const [inputMode, setInputMode] = useState<InputMode>("upload")
  const [markdown, setMarkdown] = useState("")
  const [pageSize, setPageSize] = useState<PageSizeOption>("a4")
  const [orientation, setOrientation] = useState<OrientationOption>("portrait")
  const [margin, setMargin] = useState<MarginOption>("normal")
  const [processing, setProcessing] = useState<PdfProcessingState>(INITIAL_PROCESSING_STATE)
  const [result, setResult] = useState<Blob | null>(null)
  const hiddenRef = useRef<HTMLDivElement>(null)

  const handleFiles = useCallback((files: File[]) => {
    if (files.length === 0) return
    setResult(null)
    setProcessing(INITIAL_PROCESSING_STATE)

    const reader = new FileReader()
    reader.onload = () => {
      setMarkdown(reader.result as string)
    }
    reader.readAsText(files[0])
  }, [])

  const handleConvert = useCallback(async () => {
    if (!markdown.trim()) return
    if (!hiddenRef.current) return

    setProcessing({
      status: "processing",
      progress: 10,
      message: "Rendering markdown...",
      error: null,
    })

    try {
      const dims = PAGE_DIMENSIONS[pageSize]
      const isLandscape = orientation === "landscape"
      const pageWidthMm = isLandscape ? dims.height : dims.width
      const pageHeightMm = isLandscape ? dims.width : dims.height
      const marginMm = MARGIN_VALUES[margin]

      const contentWidthMm = pageWidthMm - marginMm * 2
      const dpi = 96
      const mmToPx = dpi / 25.4
      const renderWidthPx = contentWidthMm * mmToPx

      hiddenRef.current.style.width = `${renderWidthPx}px`

      await new Promise((resolve) => setTimeout(resolve, 100))

      setProcessing({
        status: "processing",
        progress: 30,
        message: "Capturing content...",
        error: null,
      })

      const dataUrl = await toPng(hiddenRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      })

      setProcessing({
        status: "processing",
        progress: 60,
        message: "Generating PDF...",
        error: null,
      })

      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = dataUrl
      })

      const imgWidthPx = img.naturalWidth
      const imgHeightPx = img.naturalHeight

      const contentHeightMm = pageHeightMm - marginMm * 2
      const scaledImgHeightMm = (imgHeightPx / imgWidthPx) * contentWidthMm

      const totalPages = Math.max(1, Math.ceil(scaledImgHeightMm / contentHeightMm))

      const pdf = new jsPDF({
        orientation: isLandscape ? "landscape" : "portrait",
        unit: "mm",
        format: pageSize === "a4" ? "a4" : "letter",
      })

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage()
        }

        const srcYStart = (page * contentHeightMm / scaledImgHeightMm) * imgHeightPx
        const srcYHeight = (contentHeightMm / scaledImgHeightMm) * imgHeightPx

        const canvas = document.createElement("canvas")
        canvas.width = imgWidthPx
        canvas.height = Math.min(Math.ceil(srcYHeight), imgHeightPx - Math.floor(srcYStart))
        const ctx = canvas.getContext("2d")!
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(
          img,
          0,
          Math.floor(srcYStart),
          imgWidthPx,
          canvas.height,
          0,
          0,
          canvas.width,
          canvas.height
        )

        const sliceDataUrl = canvas.toDataURL("image/png")
        const sliceHeightMm = (canvas.height / imgWidthPx) * contentWidthMm

        pdf.addImage(sliceDataUrl, "PNG", marginMm, marginMm, contentWidthMm, sliceHeightMm)

        setProcessing({
          status: "processing",
          progress: 60 + ((page + 1) / totalPages) * 35,
          message: `Processing page ${page + 1} of ${totalPages}...`,
          error: null,
        })
      }

      const pdfBlob = pdf.output("blob")
      setResult(pdfBlob)
      setProcessing({
        status: "done",
        progress: 100,
        message: `Conversion complete! (${totalPages} page${totalPages !== 1 ? "s" : ""})`,
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
  }, [markdown, pageSize, orientation, margin])

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
        onChange={setInputMode}
      />

      {inputMode === "upload" ? (
        <PdfFileDropZone
          acceptedMimeTypes={["text/markdown"]}
          acceptedExtensions={[".md", ".markdown"]}
          multiple={false}
          onFiles={handleFiles}
          label="Drop a Markdown file here or click to browse"
        />
      ) : (
        <textarea
          value={markdown}
          onChange={(e) => {
            setMarkdown(e.target.value)
            setResult(null)
            setProcessing(INITIAL_PROCESSING_STATE)
          }}
          placeholder="Type or paste your Markdown here..."
          className={cn(
            "w-full min-h-[200px] p-4 rounded-xl border border-border bg-background",
            "text-sm font-mono resize-y",
            "placeholder:text-muted-foreground/50",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
          )}
        />
      )}

      {markdown.trim() && (
        <>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Preview
            </label>
            <div
              className={cn(
                "rounded-xl border border-border bg-background p-6 overflow-auto max-h-[400px]",
                "prose prose-sm dark:prose-invert max-w-none",
                "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:first:mt-0",
                "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-5",
                "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4",
                "[&_p]:leading-7 [&_p]:mb-4",
                "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4",
                "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4",
                "[&_li]:mb-1",
                "[&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono",
                "[&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:mb-4",
                "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
                "[&_blockquote]:border-l-4 [&_blockquote]:border-muted-foreground/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
                "[&_table]:w-full [&_table]:border-collapse [&_table]:mb-4",
                "[&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:bg-muted/50 [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold",
                "[&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm",
                "[&_hr]:border-border [&_hr]:my-6",
                "[&_a]:text-primary [&_a]:underline",
                "[&_img]:max-w-full [&_img]:rounded-lg",
                "[&_input[type=checkbox]]:mr-2"
              )}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
            </div>
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
          filename="markdown-to-pdf.pdf"
        />
      )}

      {/* Hidden render target for PDF capture */}
      <div
        ref={hiddenRef}
        style={{ position: "fixed", left: "-9999px", top: 0 }}
        className={cn(
          "bg-white text-black",
          "p-8",
          "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:first:mt-0",
          "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-5",
          "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4",
          "[&_p]:leading-7 [&_p]:mb-4",
          "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4",
          "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4",
          "[&_li]:mb-1",
          "[&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono",
          "[&_pre]:bg-gray-100 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:mb-4",
          "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
          "[&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600",
          "[&_table]:w-full [&_table]:border-collapse [&_table]:mb-4",
          "[&_th]:border [&_th]:border-gray-300 [&_th]:px-3 [&_th]:py-2 [&_th]:bg-gray-50 [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold",
          "[&_td]:border [&_td]:border-gray-300 [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm",
          "[&_hr]:border-gray-200 [&_hr]:my-6",
          "[&_a]:text-blue-600 [&_a]:underline",
          "[&_img]:max-w-full [&_img]:rounded-lg",
          "[&_input[type=checkbox]]:mr-2"
        )}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </div>
    </>
  )
}
