"use client"

import { useState, useEffect } from "react"
import * as pdfjsLib from "pdfjs-dist"
import { PdfPageThumbnail } from "@/components/pdf/PdfPageThumbnail"

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

interface PdfPreviewPanelProps {
  pdfData: ArrayBuffer | null
  maxPages?: number
  thumbnailWidth?: number
}

export function PdfPreviewPanel({
  pdfData,
  maxPages = 20,
  thumbnailWidth = 150,
}: PdfPreviewPanelProps) {
  const [pageCount, setPageCount] = useState(0)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    if (!pdfData) return

    let cancelled = false

    pdfjsLib
      .getDocument({ data: pdfData.slice(0) })
      .promise.then((doc) => {
        if (!cancelled) setPageCount(doc.numPages)
      })

    return () => {
      cancelled = true
      setPageCount(0)
    }
  }, [pdfData])

  if (!pdfData || pageCount === 0) return null

  const visibleCount = showAll ? pageCount : Math.min(pageCount, maxPages)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Preview ({pageCount} page{pageCount !== 1 ? "s" : ""})
        </h4>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {Array.from({ length: visibleCount }, (_, i) => (
          <div
            key={i}
            className="relative rounded-lg overflow-hidden border border-border bg-white shadow-sm"
          >
            <PdfPageThumbnail
              pdfData={pdfData}
              pageIndex={i}
              width={thumbnailWidth}
            />
            <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] text-center py-0.5">
              {i + 1}
            </div>
          </div>
        ))}
      </div>
      {!showAll && pageCount > maxPages && (
        <button
          onClick={() => setShowAll(true)}
          className="text-xs text-primary hover:underline"
        >
          Show all {pageCount} pages
        </button>
      )}
    </div>
  )
}
