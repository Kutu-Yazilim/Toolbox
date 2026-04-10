"use client"

import { useState, useCallback } from "react"
import type { PdfProcessingState } from "@/types/pdf"
import { INITIAL_PROCESSING_STATE } from "@/types/pdf"
import { PdfFileDropZone } from "@/components/pdf/PdfFileDropZone"
import { PdfProgressBar } from "@/components/pdf/PdfProgressBar"
import { PdfDownloadButton } from "@/components/pdf/PdfDownloadButton"
import { mergePdfs, getPdfPageCount } from "@/utils/pdfEngine"
import { formatFileSize, validatePdf, friendlyPdfError, downloadPdf } from "@/utils/pdfUtils"
import { cn } from "@/lib/utils"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import type { ExportOption } from "@/components/shared/ExportMenu"

interface PdfFileInfo {
  file: File
  pageCount: number
}

export function PdfMerge() {
  const [fileInfos, setFileInfos] = useState<PdfFileInfo[]>([])
  const [processing, setProcessing] = useState<PdfProcessingState>(INITIAL_PROCESSING_STATE)
  const [result, setResult] = useState<Uint8Array | null>(null)

  const handleFiles = useCallback(async (files: File[]) => {
    setResult(null)
    setProcessing(INITIAL_PROCESSING_STATE)

    const infos: PdfFileInfo[] = []
    for (const file of files) {
      try {
        const buffer = await file.arrayBuffer()
        await validatePdf(buffer)
        const pageCount = await getPdfPageCount(buffer)
        infos.push({ file, pageCount })
      } catch (err) {
        setProcessing({
          status: "error",
          progress: 0,
          message: "",
          error: `${file.name}: ${friendlyPdfError(err)}`,
        })
        return
      }
    }
    setFileInfos(infos)
  }, [])

  const handleMerge = useCallback(async () => {
    if (fileInfos.length < 2) return

    setProcessing({
      status: "processing",
      progress: 0,
      message: "Merging PDFs...",
      error: null,
    })

    try {
      const buffers: ArrayBuffer[] = []
      for (let i = 0; i < fileInfos.length; i++) {
        setProcessing((prev) => ({
          ...prev,
          progress: ((i + 1) / fileInfos.length) * 80,
          message: `Reading file ${i + 1} of ${fileInfos.length}...`,
        }))
        buffers.push(await fileInfos[i].file.arrayBuffer())
      }

      setProcessing((prev) => ({
        ...prev,
        progress: 90,
        message: "Merging pages...",
      }))

      const merged = await mergePdfs(buffers)

      setResult(merged)
      setProcessing({
        status: "done",
        progress: 100,
        message: "Merge complete!",
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
  }, [fileInfos])

  const handleDownload = useCallback(() => {
    if (result) {
      downloadPdf(result, "merged.pdf")
    }
  }, [result])

  const handleRetry = useCallback(() => {
    setProcessing(INITIAL_PROCESSING_STATE)
    setResult(null)
  }, [])

  const totalPages = fileInfos.reduce((sum, f) => sum + f.pageCount, 0)

  const shortcuts = [
    { key: "mod+enter", label: "Merge PDFs", action: handleMerge },
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
        title="Merge PDFs"
        status={toolbarStatus}
        exportOptions={exportOptions}
        shortcuts={shortcuts}
      />

      <PdfFileDropZone
        acceptedMimeTypes={["application/pdf"]}
        acceptedExtensions={[".pdf"]}
        multiple
        onFiles={handleFiles}
        label="Drop PDF files here to merge"
      />

      {fileInfos.length > 0 && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            {fileInfos.map((info, i) => (
              <div
                key={`${info.file.name}-${i}`}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/40 text-sm"
              >
                <span className="text-xs font-mono text-muted-foreground w-5 text-right">
                  {i + 1}
                </span>
                <span className="truncate flex-1">{info.file.name}</span>
                <span className="text-xs text-muted-foreground">
                  {info.pageCount} page{info.pageCount !== 1 ? "s" : ""}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(info.file.size)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleMerge}
              disabled={fileInfos.length < 2 || processing.status === "processing"}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              Merge PDFs
            </button>
            <span className="text-xs text-muted-foreground">
              {fileInfos.length} files, {totalPages} total pages
            </span>
          </div>
        </div>
      )}

      <PdfProgressBar state={processing} onRetry={handleRetry} />

      {result && (
        <PdfDownloadButton
          data={result}
          filename="merged.pdf"
        />
      )}
    </>
  )
}
