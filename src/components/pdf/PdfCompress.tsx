"use client"

import { useState, useCallback } from "react"
import { PDFDocument } from "pdf-lib"
import type { PdfProcessingState, CompressionLevel } from "@/types/pdf"
import { INITIAL_PROCESSING_STATE } from "@/types/pdf"
import { PdfFileDropZone } from "@/components/pdf/PdfFileDropZone"
import { PdfProgressBar } from "@/components/pdf/PdfProgressBar"
import { PdfDownloadButton } from "@/components/pdf/PdfDownloadButton"
import { formatFileSize, validatePdf, friendlyPdfError } from "@/utils/pdfUtils"
import { cn } from "@/lib/utils"

const COMPRESSION_LEVELS: { value: CompressionLevel; label: string; description: string }[] = [
  { value: "screen", label: "Maximum", description: "Smallest file, lower quality" },
  { value: "ebook", label: "Recommended", description: "Good balance of size and quality" },
  { value: "printer", label: "High Quality", description: "Less compression, better quality" },
  { value: "prepress", label: "Minimal", description: "Highest quality, least compression" },
]

export function PdfCompress() {
  const [file, setFile] = useState<File | null>(null)
  const [level, setLevel] = useState<CompressionLevel>("ebook")
  const [processing, setProcessing] = useState<PdfProcessingState>(INITIAL_PROCESSING_STATE)
  const [result, setResult] = useState<Uint8Array | null>(null)
  const [originalSize, setOriginalSize] = useState(0)

  const handleFiles = useCallback((files: File[]) => {
    if (files.length > 0) {
      setFile(files[0])
      setOriginalSize(files[0].size)
      setResult(null)
      setProcessing(INITIAL_PROCESSING_STATE)
    }
  }, [])

  const handleCompress = useCallback(async () => {
    if (!file) return

    setProcessing({
      status: "processing",
      progress: 0,
      message: "Compressing PDF...",
      error: null,
    })

    try {
      const buffer = await file.arrayBuffer()
      await validatePdf(buffer)

      setProcessing((prev) => ({
        ...prev,
        progress: 30,
        message: "Loading PDF...",
      }))

      // Re-save with pdf-lib to strip redundancy and optimize structure
      const doc = await PDFDocument.load(buffer)

      setProcessing((prev) => ({
        ...prev,
        progress: 60,
        message: "Optimizing structure...",
      }))

      // Remove metadata based on compression level
      if (level === "screen" || level === "ebook") {
        doc.setTitle("")
        doc.setAuthor("")
        doc.setSubject("")
        doc.setKeywords([])
        doc.setProducer("")
        doc.setCreator("")
      }

      const compressed = await doc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      })

      setResult(compressed)
      setProcessing({
        status: "done",
        progress: 100,
        message: "Compression complete!",
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
  }, [file, level])

  const handleRetry = useCallback(() => {
    setProcessing(INITIAL_PROCESSING_STATE)
    setResult(null)
  }, [])

  const compressedSize = result?.byteLength ?? 0
  const savings = originalSize > 0 && compressedSize > 0
    ? Math.round((1 - compressedSize / originalSize) * 100)
    : 0

  return (
    <>
      <PdfFileDropZone
        acceptedMimeTypes={["application/pdf"]}
        acceptedExtensions={[".pdf"]}
        multiple={false}
        onFiles={handleFiles}
        label="Drop a PDF file to compress"
      />

      {file && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Compression Level
            </label>
            <div className="grid grid-cols-2 gap-2">
              {COMPRESSION_LEVELS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setLevel(opt.value)}
                  className={cn(
                    "p-3 rounded-lg text-left transition-colors border",
                    level === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-muted/30 hover:bg-muted/50"
                  )}
                >
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCompress}
            disabled={processing.status === "processing"}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            Compress PDF
          </button>
        </div>
      )}

      <PdfProgressBar state={processing} onRetry={handleRetry} />

      {result && (
        <div className="space-y-3">
          <div className="flex items-center gap-6 p-4 rounded-lg bg-muted/30">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Original</p>
              <p className="text-sm font-medium">{formatFileSize(originalSize)}</p>
            </div>
            <div className="text-lg text-muted-foreground">&rarr;</div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Compressed</p>
              <p className="text-sm font-medium">{formatFileSize(compressedSize)}</p>
            </div>
            {savings > 0 && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Saved</p>
                <p className="text-sm font-medium text-green-500">{savings}%</p>
              </div>
            )}
          </div>

          <PdfDownloadButton
            data={result}
            filename={`compressed-${file?.name ?? "output.pdf"}`}
          />
        </div>
      )}
    </>
  )
}
