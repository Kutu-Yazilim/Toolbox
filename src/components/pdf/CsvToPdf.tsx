"use client"

import { useState, useCallback, useMemo } from "react"
import { jsPDF } from "jspdf"
import type { PdfProcessingState } from "@/types/pdf"
import { INITIAL_PROCESSING_STATE } from "@/types/pdf"
import { PdfFileDropZone } from "@/components/pdf/PdfFileDropZone"
import { PdfProgressBar } from "@/components/pdf/PdfProgressBar"
import { PdfDownloadButton } from "@/components/pdf/PdfDownloadButton"
import { cn } from "@/lib/utils"

const ACCEPTED_MIME_TYPES = ["text/csv"]
const ACCEPTED_EXTENSIONS = [".csv"]

type Delimiter = "," | ";" | "\t"
type PageSizeOption = "a4" | "letter"
type OrientationOption = "portrait" | "landscape"
type FontSizeOption = 4 | 6 | 8 | 10 | 12

const DELIMITER_OPTIONS: { value: Delimiter; label: string }[] = [
  { value: ",", label: "Comma" },
  { value: ";", label: "Semicolon" },
  { value: "\t", label: "Tab" },
]

const PAGE_SIZE_OPTIONS: { value: PageSizeOption; label: string }[] = [
  { value: "a4", label: "A4" },
  { value: "letter", label: "Letter" },
]

const ORIENTATION_OPTIONS: { value: OrientationOption; label: string }[] = [
  { value: "portrait", label: "Portrait" },
  { value: "landscape", label: "Landscape" },
]

const FONT_SIZE_OPTIONS: { value: FontSizeOption; label: string }[] = [
  { value: 4, label: "Atomic (4)" },
  { value: 6, label: "Miniscule (6)" },
  { value: 8, label: "Small (8)" },
  { value: 10, label: "Medium (10)" },
  { value: 12, label: "Large (12)" },
]

const HAS_HEADER_OPTIONS: { value: "yes" | "no"; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
]

const PAGE_DIMENSIONS: Record<
  PageSizeOption,
  Record<OrientationOption, { width: number; height: number }>
> = {
  a4: {
    portrait: { width: 595, height: 842 },
    landscape: { width: 842, height: 595 },
  },
  letter: {
    portrait: { width: 612, height: 792 },
    landscape: { width: 792, height: 612 },
  },
}

const PREVIEW_MAX_ROWS = 20

function detectDelimiter(firstLine: string): Delimiter {
  const commaCount = (firstLine.match(/,/g) ?? []).length
  const semicolonCount = (firstLine.match(/;/g) ?? []).length
  const tabCount = (firstLine.match(/\t/g) ?? []).length

  if (tabCount >= commaCount && tabCount >= semicolonCount) return "\t"
  if (semicolonCount >= commaCount) return ";"
  return ","
}

function parseCsvLine(line: string, delimiter: Delimiter): string[] {
  const fields: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === delimiter) {
        fields.push(current)
        current = ""
      } else {
        current += char
      }
    }
  }

  fields.push(current)
  return fields
}

function parseCsv(text: string, delimiter: Delimiter): string[][] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
  return lines.map((line) => parseCsvLine(line, delimiter))
}

function OptionGroup<T extends string | number>({
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
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => (
          <button
            key={String(opt.value)}
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

function computeColumnWidths(
  allRows: string[][],
  colCount: number,
  contentWidth: number,
  pdf: jsPDF,
  fontSize: number,
  cellPadX: number
): number[] {
  const maxWidths: number[] = new Array(colCount).fill(0)

  pdf.setFontSize(fontSize)
  pdf.setFont("helvetica", "bold")
  if (allRows.length > 0) {
    for (let c = 0; c < colCount; c++) {
      const text = allRows[0][c] ?? ""
      maxWidths[c] = Math.max(maxWidths[c], pdf.getTextWidth(text) + cellPadX * 2)
    }
  }

  pdf.setFont("helvetica", "normal")
  for (let r = 1; r < allRows.length; r++) {
    for (let c = 0; c < colCount; c++) {
      const text = allRows[r][c] ?? ""
      maxWidths[c] = Math.max(maxWidths[c], pdf.getTextWidth(text) + cellPadX * 2)
    }
  }

  const minColWidth = cellPadX * 2 + pdf.getTextWidth("…")
  for (let c = 0; c < colCount; c++) {
    maxWidths[c] = Math.max(maxWidths[c], minColWidth)
  }

  const total = maxWidths.reduce((s, w) => s + w, 0)
  const scale = contentWidth / total
  return maxWidths.map((w) => w * scale)
}

function truncateText(pdf: jsPDF, text: string, maxWidth: number): string {
  if (maxWidth <= 0) return ""
  if (pdf.getTextWidth(text) <= maxWidth) return text

  const ellipsis = "…"
  const ellipsisWidth = pdf.getTextWidth(ellipsis)
  const targetWidth = maxWidth - ellipsisWidth
  if (targetWidth <= 0) return ellipsis

  let lo = 0
  let hi = text.length
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (pdf.getTextWidth(text.slice(0, mid)) <= targetWidth) {
      lo = mid
    } else {
      hi = mid - 1
    }
  }

  return text.slice(0, lo) + ellipsis
}

function drawTableRow(
  pdf: jsPDF,
  cells: string[],
  x: number,
  y: number,
  colWidths: number[],
  rowHeight: number,
  fontSize: number,
  cellPadX: number,
  isHeader: boolean,
  isOddRow: boolean
) {
  pdf.setFontSize(fontSize)
  pdf.setLineWidth(0.5)
  pdf.setDrawColor(209, 213, 219)

  let cellX = x
  for (let c = 0; c < colWidths.length; c++) {
    const w = colWidths[c]

    if (isHeader) {
      pdf.setFillColor(229, 231, 235)
    } else if (isOddRow) {
      pdf.setFillColor(249, 250, 251)
    } else {
      pdf.setFillColor(255, 255, 255)
    }
    pdf.rect(cellX, y, w, rowHeight, "FD")

    pdf.setFont("helvetica", isHeader ? "bold" : "normal")
    pdf.setTextColor(17, 24, 39)

    const text = cells[c] ?? ""
    const maxTextWidth = w - cellPadX * 2
    const display = truncateText(pdf, text, maxTextWidth)
    pdf.text(display, cellX + cellPadX, y + rowHeight / 2, {
      baseline: "middle",
    })

    cellX += w
  }
}

export function CsvToPdf() {
  const [rawText, setRawText] = useState<string | null>(null)
  const [fileName, setFileName] = useState("")
  const [delimiter, setDelimiter] = useState<Delimiter>(",")
  const [hasHeader, setHasHeader] = useState<"yes" | "no">("yes")
  const [pageSize, setPageSize] = useState<PageSizeOption>("a4")
  const [orientation, setOrientation] = useState<OrientationOption>("portrait")
  const [fontSize, setFontSize] = useState<FontSizeOption>(10)
  const [processing, setProcessing] = useState<PdfProcessingState>(INITIAL_PROCESSING_STATE)
  const [result, setResult] = useState<Blob | null>(null)

  const rows = useMemo(() => rawText ? parseCsv(rawText, delimiter) : [], [rawText, delimiter])
  const headerRow = hasHeader === "yes" && rows.length > 0 ? rows[0] : null
  const dataRows = useMemo(() => hasHeader === "yes" ? rows.slice(1) : rows, [rows, hasHeader])
  const previewRows = dataRows.slice(0, PREVIEW_MAX_ROWS)

  const handleFiles = useCallback((files: File[]) => {
    if (files.length === 0) return

    setResult(null)
    setProcessing(INITIAL_PROCESSING_STATE)

    const file = files[0]
    setFileName(file.name.replace(/\.csv$/i, ""))

    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      setRawText(text)

      const firstLine = text.split(/\r?\n/)[0] ?? ""
      setDelimiter(detectDelimiter(firstLine))
    }
    reader.readAsText(file)
  }, [])

  const handlePasteText = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setResult(null)
    setProcessing(INITIAL_PROCESSING_STATE)

    if (!text.trim()) {
      setRawText(null)
      return
    }

    setRawText(text)
    if (!fileName) setFileName("pasted-csv")

    const firstLine = text.split(/\r?\n/)[0] ?? ""
    setDelimiter(detectDelimiter(firstLine))
  }, [fileName])

  const handleConvert = useCallback(async () => {
    if (rows.length === 0) return

    setProcessing({
      status: "processing",
      progress: 0,
      message: "Generating PDF...",
      error: null,
    })

    try {
      const dims = PAGE_DIMENSIONS[pageSize][orientation]
      const padding = 24
      const contentWidth = dims.width - padding * 2
      const cellPadX = fontSize * 0.8
      const rowHeight = fontSize * 2.2
      const headerHeight = headerRow ? rowHeight : 0
      const availableHeight = dims.height - padding * 2 - headerHeight
      const rowsPerPage = Math.max(1, Math.floor(availableHeight / rowHeight))
      const pageCount = Math.ceil(dataRows.length / rowsPerPage)
      const colCount = Math.max(...rows.map((r) => r.length))

      const pdf = new jsPDF({
        unit: "px",
        format: [dims.width, dims.height],
      })

      const colWidths = computeColumnWidths(
        rows,
        colCount,
        contentWidth,
        pdf,
        fontSize,
        cellPadX
      )

      for (let page = 0; page < pageCount; page++) {
        if (page > 0) {
          pdf.addPage([dims.width, dims.height])
        }

        let y = padding

        if (headerRow) {
          drawTableRow(pdf, headerRow, padding, y, colWidths, rowHeight, fontSize, cellPadX, true, false)
          y += rowHeight
        }

        const startIdx = page * rowsPerPage
        const batch = dataRows.slice(startIdx, startIdx + rowsPerPage)

        for (let i = 0; i < batch.length; i++) {
          drawTableRow(pdf, batch[i], padding, y, colWidths, rowHeight, fontSize, cellPadX, false, i % 2 === 1)
          y += rowHeight
        }

        setProcessing({
          status: "processing",
          progress: ((page + 1) / pageCount) * 100,
          message: `Rendering page ${page + 1} of ${pageCount}...`,
          error: null,
        })

        // Yield to let the UI update the progress bar
        await new Promise((r) => setTimeout(r, 0))
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
  }, [rows, dataRows, headerRow, pageSize, orientation, fontSize])

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
        label="Drop a CSV file here or click to browse"
      />

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Or paste CSV text
        </label>
        <textarea
          className={cn(
            "w-full h-32 rounded-lg border border-border bg-muted/30 px-3 py-2",
            "text-xs text-foreground placeholder:text-muted-foreground/50",
            "resize-y focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow",
            "font-mono"
          )}
          placeholder={"name,age,city\nAlice,30,New York\nBob,25,London"}
          value={rawText ?? ""}
          onChange={handlePasteText}
          spellCheck={false}
        />
      </div>

      {rawText && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <OptionGroup
              label="Delimiter"
              options={DELIMITER_OPTIONS}
              value={delimiter}
              onChange={setDelimiter}
            />
            <OptionGroup
              label="Header Row"
              options={HAS_HEADER_OPTIONS}
              value={hasHeader}
              onChange={setHasHeader}
            />
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
              label="Font Size"
              options={FONT_SIZE_OPTIONS}
              value={fontSize}
              onChange={setFontSize}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground">
                Preview
              </p>
              <p className="text-xs text-muted-foreground">
                {dataRows.length} data row{dataRows.length !== 1 ? "s" : ""}
                {dataRows.length > PREVIEW_MAX_ROWS &&
                  ` (showing first ${PREVIEW_MAX_ROWS})`}
              </p>
            </div>
            <div className="rounded-lg border border-border overflow-auto max-h-[400px]">
              <table className="w-full text-xs border-collapse">
                {headerRow && (
                  <thead>
                    <tr className="bg-muted">
                      {headerRow.map((cell, i) => (
                        <th
                          key={i}
                          className="border border-border px-2 py-1.5 text-left font-bold text-foreground"
                        >
                          {cell}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {previewRows.map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className={rowIdx % 2 === 0 ? "bg-background" : "bg-muted/30"}
                    >
                      {row.map((cell, colIdx) => (
                        <td
                          key={colIdx}
                          className="border border-border px-2 py-1 text-foreground"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            <span className="text-xs text-muted-foreground">
              {rows.length} row{rows.length !== 1 ? "s" : ""} total
            </span>
          </div>
        </>
      )}

      <PdfProgressBar state={processing} onRetry={handleRetry} />

      {result && (
        <PdfDownloadButton
          data={result}
          filename={`${fileName || "csv-export"}.pdf`}
        />
      )}
    </>
  )
}
