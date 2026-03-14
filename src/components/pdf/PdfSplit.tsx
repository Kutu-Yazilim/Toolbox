import { useState, useCallback } from "react"
import JSZip from "jszip"
import type { PdfProcessingState, SplitConfig, SplitMode } from "@/types/pdf"
import { INITIAL_PROCESSING_STATE } from "@/types/pdf"
import { PdfFileDropZone } from "@/components/pdf/PdfFileDropZone"
import { PdfPageThumbnail } from "@/components/pdf/PdfPageThumbnail"
import { PdfProgressBar } from "@/components/pdf/PdfProgressBar"
import { PdfDownloadButton } from "@/components/pdf/PdfDownloadButton"
import { splitPdf, getPdfPageCount } from "@/utils/pdfEngine"
import { formatFileSize, downloadBlob, validatePdf, friendlyPdfError } from "@/utils/pdfUtils"
import { cn } from "@/lib/utils"
import { DownloadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

const SPLIT_MODES: { value: SplitMode; label: string }[] = [
  { value: "range", label: "Page Ranges" },
  { value: "every-n", label: "Every N Pages" },
  { value: "extract", label: "Extract Pages" },
]

const EVERY_N_OPTIONS = [1, 2, 5, 10] as const

export function PdfSplit() {
  const [file, setFile] = useState<File | null>(null)
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [mode, setMode] = useState<SplitMode>("range")
  const [ranges, setRanges] = useState("")
  const [everyN, setEveryN] = useState(2)
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set())
  const [processing, setProcessing] = useState<PdfProcessingState>(INITIAL_PROCESSING_STATE)
  const [results, setResults] = useState<Uint8Array[]>([])

  const handleFiles = useCallback(async (files: File[]) => {
    const picked = files[0]
    if (!picked) return

    setResults([])
    setProcessing(INITIAL_PROCESSING_STATE)
    setSelectedPages(new Set())
    setRanges("")

    try {
      const buffer = await picked.arrayBuffer()
      await validatePdf(buffer)
      const count = await getPdfPageCount(buffer)
      setFile(picked)
      setPdfData(buffer)
      setPageCount(count)
    } catch (err) {
      setFile(null)
      setPdfData(null)
      setPageCount(0)
      setProcessing({
        status: "error",
        progress: 0,
        message: "",
        error: friendlyPdfError(err),
      })
    }
  }, [])

  const buildConfig = useCallback((): SplitConfig => {
    switch (mode) {
      case "range":
        return { mode: "range", ranges, everyN: 1 }
      case "every-n":
        return { mode: "every-n", ranges: "", everyN }
      case "extract": {
        const sorted = Array.from(selectedPages).sort((a, b) => a - b)
        const rangeStr = sorted.map((i) => String(i + 1)).join(",")
        return { mode: "extract", ranges: rangeStr, everyN: 1 }
      }
    }
  }, [mode, ranges, everyN, selectedPages])

  const canSplit = useCallback((): boolean => {
    if (!pdfData) return false
    switch (mode) {
      case "range":
        return ranges.trim().length > 0
      case "every-n":
        return true
      case "extract":
        return selectedPages.size > 0
    }
  }, [pdfData, mode, ranges, selectedPages])

  const handleSplit = useCallback(async () => {
    if (!pdfData || !canSplit()) return

    setProcessing({
      status: "processing",
      progress: 0,
      message: "Splitting PDF...",
      error: null,
    })
    setResults([])

    try {
      setProcessing((prev) => ({
        ...prev,
        progress: 30,
        message: "Reading PDF...",
      }))

      const config = buildConfig()

      setProcessing((prev) => ({
        ...prev,
        progress: 60,
        message: "Splitting pages...",
      }))

      const parts = await splitPdf(pdfData, config)

      setResults(parts)
      setProcessing({
        status: "done",
        progress: 100,
        message: `Split into ${parts.length} file${parts.length !== 1 ? "s" : ""}`,
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
  }, [pdfData, canSplit, buildConfig])

  const handleDownloadZip = useCallback(async () => {
    if (results.length === 0 || !file) return

    const zip = new JSZip()
    const baseName = file.name.replace(/\.pdf$/i, "")
    for (let i = 0; i < results.length; i++) {
      zip.file(`${baseName}_part${i + 1}.pdf`, results[i])
    }
    const blob = await zip.generateAsync({ type: "blob" })
    downloadBlob(blob, `${baseName}_split.zip`)
  }, [results, file])

  const handleRetry = useCallback(() => {
    setProcessing(INITIAL_PROCESSING_STATE)
    setResults([])
  }, [])

  const togglePage = useCallback((pageIndex: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev)
      if (next.has(pageIndex)) {
        next.delete(pageIndex)
      } else {
        next.add(pageIndex)
      }
      return next
    })
  }, [])

  return (
    <>
      <PdfFileDropZone
        acceptedMimeTypes={["application/pdf"]}
        acceptedExtensions={[".pdf"]}
        multiple={false}
        onFiles={handleFiles}
        label="Drop a PDF file here to split"
      />

      {file && pdfData && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{file.name}</span>
            <span>&middot;</span>
            <span>{pageCount} page{pageCount !== 1 ? "s" : ""}</span>
            <span>&middot;</span>
            <span>{formatFileSize(file.size)}</span>
          </div>

          {/* Mode selector */}
          <div className="flex gap-1.5">
            {SPLIT_MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                  mode === m.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Mode-specific controls */}
          {mode === "range" && (
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">
                Page ranges (e.g. 1-3, 5, 7-10)
              </label>
              <input
                type="text"
                value={ranges}
                onChange={(e) => setRanges(e.target.value)}
                placeholder="1-3, 5, 7-10"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}

          {mode === "every-n" && (
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">
                Split every N pages
              </label>
              <select
                value={everyN}
                onChange={(e) => setEveryN(Number(e.target.value))}
                className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {EVERY_N_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n} page{n !== 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {mode === "extract" && (
            <p className="text-sm text-muted-foreground">
              Click pages to select them for extraction
              {selectedPages.size > 0 && (
                <span className="ml-1 text-foreground font-medium">
                  ({selectedPages.size} selected)
                </span>
              )}
            </p>
          )}

          {/* Page thumbnails */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {Array.from({ length: pageCount }, (_, i) => (
              <button
                key={i}
                onClick={() => mode === "extract" && togglePage(i)}
                disabled={mode !== "extract"}
                className={cn(
                  "relative rounded-lg overflow-hidden border-2 transition-all",
                  mode === "extract" && "cursor-pointer hover:opacity-90",
                  mode === "extract" && selectedPages.has(i)
                    ? "ring-2 ring-primary border-primary"
                    : "border-transparent"
                )}
              >
                <PdfPageThumbnail
                  pdfData={pdfData}
                  pageIndex={i}
                  width={120}
                  className="block"
                />
                <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs text-center py-0.5">
                  {i + 1}
                </span>
              </button>
            ))}
          </div>

          {/* Split button */}
          <button
            onClick={handleSplit}
            disabled={!canSplit() || processing.status === "processing"}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            Split PDF
          </button>
        </div>
      )}

      <PdfProgressBar state={processing} onRetry={handleRetry} />

      {results.length === 1 && file && (
        <PdfDownloadButton
          data={results[0]}
          filename={`${file.name.replace(/\.pdf$/i, "")}_split.pdf`}
        />
      )}

      {results.length > 1 && (
        <Button onClick={handleDownloadZip} className="gap-2">
          <DownloadIcon className="size-4" />
          <span>Download ZIP ({results.length} files)</span>
        </Button>
      )}
    </>
  )
}
