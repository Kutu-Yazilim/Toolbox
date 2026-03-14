import { useEffect, useRef } from "react"
import * as pdfjsLib from "pdfjs-dist"

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

interface PdfPageThumbnailProps {
  pdfData: ArrayBuffer
  pageIndex: number
  width?: number
  className?: string
}

export function PdfPageThumbnail({
  pdfData,
  pageIndex,
  width = 150,
  className,
}: PdfPageThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let cancelled = false

    async function render() {
      const canvas = canvasRef.current
      if (!canvas) return

      const doc = await pdfjsLib.getDocument({ data: pdfData.slice(0) }).promise
      if (cancelled) return

      const page = await doc.getPage(pageIndex + 1) // pdfjs uses 1-based
      if (cancelled) return

      const viewport = page.getViewport({ scale: 1 })
      const scale = width / viewport.width
      const scaledViewport = page.getViewport({ scale })

      canvas.width = scaledViewport.width
      canvas.height = scaledViewport.height

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      await page.render({ canvasContext: ctx, viewport: scaledViewport, canvas } as Parameters<typeof page.render>[0]).promise
    }

    render()

    return () => {
      cancelled = true
    }
  }, [pdfData, pageIndex, width])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ maxWidth: width }}
    />
  )
}
