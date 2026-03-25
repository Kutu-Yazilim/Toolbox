"use client"

import { DownloadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { downloadPdf, downloadBlob, formatFileSize } from "@/utils/pdfUtils"

interface PdfDownloadButtonProps {
  data: Uint8Array | Blob | null
  filename: string
  disabled?: boolean
  label?: string
}

export function PdfDownloadButton({
  data,
  filename,
  disabled = false,
  label,
}: PdfDownloadButtonProps) {
  const size = data
    ? data instanceof Blob
      ? data.size
      : data.byteLength
    : 0

  const handleDownload = () => {
    if (!data) return
    if (data instanceof Blob) {
      downloadBlob(data, filename)
    } else {
      downloadPdf(data, filename)
    }
  }

  return (
    <Button
      onClick={handleDownload}
      disabled={disabled || !data}
      className="gap-2"
    >
      <DownloadIcon className="size-4" />
      <span>{label ?? "Download PDF"}</span>
      {size > 0 && (
        <span className="text-xs opacity-70">({formatFileSize(size)})</span>
      )}
    </Button>
  )
}
