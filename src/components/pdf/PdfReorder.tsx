"use client"

import { useState, useCallback } from "react"
import { ArrowDownUpIcon, Trash2Icon, RotateCwIcon } from "lucide-react"
import type { PdfProcessingState } from "@/types/pdf"
import { INITIAL_PROCESSING_STATE } from "@/types/pdf"
import { PdfFileDropZone } from "@/components/pdf/PdfFileDropZone"
import { PdfPageThumbnail } from "@/components/pdf/PdfPageThumbnail"
import { PdfProgressBar } from "@/components/pdf/PdfProgressBar"
import { PdfDownloadButton } from "@/components/pdf/PdfDownloadButton"
import { reorderPdf, rotatePdfPage, deletePdfPages, getPdfPageCount } from "@/utils/pdfEngine"
import { validatePdf, friendlyPdfError, downloadPdf } from "@/utils/pdfUtils"
import { cn } from "@/lib/utils"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import type { ExportOption } from "@/components/shared/ExportMenu"

type RotationAngle = 90 | 180 | 270

const ROTATION_OPTIONS: { label: string; value: RotationAngle }[] = [
  { label: "90\u00B0", value: 90 },
  { label: "180\u00B0", value: 180 },
  { label: "270\u00B0", value: 270 },
]

export function PdfReorder() {
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [pageOrder, setPageOrder] = useState<number[]>([])
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set())
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [processing, setProcessing] = useState<PdfProcessingState>(INITIAL_PROCESSING_STATE)
  const [result, setResult] = useState<Uint8Array | null>(null)
  const [rotateOpen, setRotateOpen] = useState(false)

  const handleFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return

    setResult(null)
    setProcessing(INITIAL_PROCESSING_STATE)
    setSelectedPages(new Set())
    setDragIndex(null)

    try {
      const buffer = await files[0].arrayBuffer()
      await validatePdf(buffer)
      const count = await getPdfPageCount(buffer)
      setPdfData(buffer)
      setPageCount(count)
      setPageOrder(Array.from({ length: count }, (_, i) => i))
    } catch (err) {
      setPdfData(null)
      setPageCount(0)
      setPageOrder([])
      setProcessing({
        status: "error",
        progress: 0,
        message: "",
        error: friendlyPdfError(err),
      })
    }
  }, [])

  const toggleSelection = useCallback((orderIdx: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev)
      if (next.has(orderIdx)) {
        next.delete(orderIdx)
      } else {
        next.add(orderIdx)
      }
      return next
    })
  }, [])

  const handleDragStart = useCallback((idx: number) => {
    setDragIndex(idx)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback(
    (targetIdx: number) => {
      if (dragIndex === null || dragIndex === targetIdx) {
        setDragIndex(null)
        return
      }
      setPageOrder((prev) => {
        const next = [...prev]
        const [moved] = next.splice(dragIndex, 1)
        next.splice(targetIdx, 0, moved)
        return next
      })
      setSelectedPages(new Set())
      setDragIndex(null)
    },
    [dragIndex]
  )

  const handleReverseAll = useCallback(() => {
    setPageOrder((prev) => [...prev].reverse())
    setSelectedPages(new Set())
  }, [])

  const handleDeleteSelected = useCallback(() => {
    if (selectedPages.size === 0) return
    setPageOrder((prev) => prev.filter((_, i) => !selectedPages.has(i)))
    setSelectedPages(new Set())
  }, [selectedPages])

  const handleRotateSelected = useCallback(
    async (angle: RotationAngle) => {
      if (!pdfData || selectedPages.size === 0) return
      setRotateOpen(false)

      setProcessing({
        status: "processing",
        progress: 0,
        message: "Rotating pages...",
        error: null,
      })

      try {
        let currentBytes: ArrayBuffer = pdfData
        const selectedArr = Array.from(selectedPages)

        for (let i = 0; i < selectedArr.length; i++) {
          const orderIdx = selectedArr[i]
          const originalPageIndex = pageOrder[orderIdx]
          const rotated = await rotatePdfPage(currentBytes, originalPageIndex, angle)
          currentBytes = rotated.buffer as ArrayBuffer

          setProcessing((prev) => ({
            ...prev,
            progress: ((i + 1) / selectedArr.length) * 100,
            message: `Rotating page ${i + 1} of ${selectedArr.length}...`,
          }))
        }

        setPdfData(currentBytes)
        setSelectedPages(new Set())
        setProcessing({
          status: "done",
          progress: 100,
          message: "Rotation complete!",
          error: null,
        })
        setTimeout(() => setProcessing(INITIAL_PROCESSING_STATE), 1500)
      } catch (err) {
        setProcessing({
          status: "error",
          progress: 0,
          message: "",
          error: friendlyPdfError(err),
        })
      }
    },
    [pdfData, selectedPages, pageOrder]
  )

  const handleApply = useCallback(async () => {
    if (!pdfData || pageOrder.length === 0) return

    setProcessing({
      status: "processing",
      progress: 0,
      message: "Reordering PDF...",
      error: null,
    })

    try {
      const isIdentity =
        pageOrder.length === pageCount &&
        pageOrder.every((p, i) => p === i)

      let output: Uint8Array

      if (pageOrder.length < pageCount) {
        setProcessing((prev) => ({
          ...prev,
          progress: 30,
          message: "Removing deleted pages...",
        }))
        output = await deletePdfPages(pdfData, pageOrder)
      } else if (!isIdentity) {
        setProcessing((prev) => ({
          ...prev,
          progress: 30,
          message: "Applying new page order...",
        }))
        output = await reorderPdf(pdfData, pageOrder)
      } else {
        output = new Uint8Array(pdfData)
      }

      setResult(output)
      setProcessing({
        status: "done",
        progress: 100,
        message: "Reorder complete!",
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
  }, [pdfData, pageOrder, pageCount])

  const handleDownload = useCallback(() => {
    if (result) {
      downloadPdf(result, "reordered.pdf")
    }
  }, [result])

  const handleRetry = useCallback(() => {
    setProcessing(INITIAL_PROCESSING_STATE)
    setResult(null)
  }, [])

  const shortcuts = [
    { key: "mod+enter", label: "Apply reorder", action: handleApply },
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
        title="Reorder PDF"
        status={toolbarStatus}
        exportOptions={exportOptions}
        shortcuts={shortcuts}
      />

      <PdfFileDropZone
        acceptedMimeTypes={["application/pdf"]}
        acceptedExtensions={[".pdf"]}
        multiple={false}
        onFiles={handleFiles}
        label="Drop a PDF file here to reorder pages"
      />

      {pdfData && pageOrder.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleReverseAll}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                "bg-muted hover:bg-muted/80 text-foreground"
              )}
            >
              <ArrowDownUpIcon className="size-4" />
              Reverse All
            </button>

            <button
              onClick={handleDeleteSelected}
              disabled={selectedPages.size === 0}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                "bg-muted hover:bg-muted/80 text-foreground",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <Trash2Icon className="size-4" />
              Delete Selected
            </button>

            <div className="relative">
              <button
                onClick={() => setRotateOpen((prev) => !prev)}
                disabled={selectedPages.size === 0}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  "bg-muted hover:bg-muted/80 text-foreground",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <RotateCwIcon className="size-4" />
                Rotate
              </button>

              {rotateOpen && (
                <div className="absolute top-full left-0 mt-1 z-10 bg-popover border border-border rounded-lg shadow-md py-1 min-w-[80px]">
                  {ROTATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleRotateSelected(opt.value)}
                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className="text-xs text-muted-foreground ml-auto">
              {pageOrder.length} page{pageOrder.length !== 1 ? "s" : ""}
              {selectedPages.size > 0 && ` \u2022 ${selectedPages.size} selected`}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {pageOrder.map((originalIdx, orderIdx) => (
              <div
                key={`page-${originalIdx}-${orderIdx}`}
                draggable
                onDragStart={() => handleDragStart(orderIdx)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(orderIdx)}
                onClick={() => toggleSelection(orderIdx)}
                className={cn(
                  "relative rounded-lg border-2 cursor-grab active:cursor-grabbing transition-all overflow-hidden",
                  selectedPages.has(orderIdx)
                    ? "ring-2 ring-primary border-primary"
                    : "border-border hover:border-muted-foreground/40",
                  dragIndex === orderIdx && "opacity-50"
                )}
              >
                <PdfPageThumbnail
                  pdfData={pdfData}
                  pageIndex={originalIdx}
                  width={150}
                  className="w-full h-auto pointer-events-none"
                />
                <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs text-center py-0.5 font-mono">
                  {originalIdx + 1}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleApply}
            disabled={processing.status === "processing"}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            Apply Reorder
          </button>
        </div>
      )}

      <PdfProgressBar state={processing} onRetry={handleRetry} />

      {result && (
        <PdfDownloadButton
          data={result}
          filename="reordered.pdf"
        />
      )}
    </>
  )
}
