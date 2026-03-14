import { useState, useCallback } from "react"
import { InfoIcon } from "lucide-react"
import type { PdfProcessingState } from "@/types/pdf"
import { INITIAL_PROCESSING_STATE } from "@/types/pdf"
import { PdfFileDropZone } from "@/components/pdf/PdfFileDropZone"
import { PdfProgressBar } from "@/components/pdf/PdfProgressBar"
import { PdfDownloadButton } from "@/components/pdf/PdfDownloadButton"
import { cn } from "@/lib/utils"

export function XlsxToPdf() {
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState<PdfProcessingState>(INITIAL_PROCESSING_STATE)

  const handleFiles = useCallback((files: File[]) => {
    setFile(files[0] ?? null)
    setProcessing(INITIAL_PROCESSING_STATE)
  }, [])

  return (
    <>
      <PdfFileDropZone
        acceptedMimeTypes={[
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ]}
        acceptedExtensions={[".xlsx", ".xls"]}
        multiple={false}
        onFiles={handleFiles}
        label="Drop an XLSX file here"
      />

      {file && (
        <div
          className={cn(
            "flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4"
          )}
        >
          <InfoIcon className="size-5 flex-shrink-0 text-amber-500 mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="font-medium text-amber-700 dark:text-amber-400">
              XLSX conversion engine not available
            </p>
            <p className="text-amber-600 dark:text-amber-400/80">
              XLSX conversion requires the office2pdf WASM module. Please build
              it from source:
            </p>
            <code className="block rounded bg-amber-500/10 px-2 py-1 text-xs font-mono text-amber-700 dark:text-amber-300">
              wasm-pack build crates/office2pdf --target web --features wasm
            </code>
          </div>
        </div>
      )}

      <PdfProgressBar state={processing} />

      <PdfDownloadButton data={null} filename="spreadsheet.pdf" disabled />
    </>
  )
}
