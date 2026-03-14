import { useState, useCallback, useMemo, useRef } from "react"
import { toPng } from "html-to-image"
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
type FontSizeOption = 8 | 10 | 12

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
  const captureRef = useRef<HTMLDivElement>(null)

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

  const handleConvert = useCallback(async () => {
    if (!captureRef.current || rows.length === 0) return

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
      const rowHeight = fontSize * 2.2
      const headerHeight = headerRow ? rowHeight : 0
      const availableHeight = dims.height - padding * 2 - headerHeight
      const rowsPerPage = Math.max(1, Math.floor(availableHeight / rowHeight))
      const pageCount = Math.ceil(dataRows.length / rowsPerPage)

      const pdf = new jsPDF({
        unit: "px",
        format: [dims.width, dims.height],
      })

      for (let page = 0; page < pageCount; page++) {
        const startIdx = page * rowsPerPage
        const batch = dataRows.slice(startIdx, startIdx + rowsPerPage)

        const batchWithHeader = headerRow ? [headerRow, ...batch] : batch

        captureRef.current.innerHTML = buildTableHtml(
          batchWithHeader,
          headerRow !== null,
          fontSize
        )

        captureRef.current.style.width = `${contentWidth}px`

        await new Promise((r) => setTimeout(r, 50))

        const dataUrl = await toPng(captureRef.current, {
          width: contentWidth,
          height: captureRef.current.scrollHeight,
          canvasWidth: contentWidth,
          canvasHeight: captureRef.current.scrollHeight,
          backgroundColor: "#ffffff",
        })

        if (page > 0) {
          pdf.addPage([dims.width, dims.height])
        }

        pdf.addImage(
          dataUrl,
          "PNG",
          padding,
          padding,
          contentWidth,
          captureRef.current.scrollHeight
        )

        setProcessing({
          status: "processing",
          progress: ((page + 1) / pageCount) * 100,
          message: `Rendering page ${page + 1} of ${pageCount}...`,
          error: null,
        })
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

      <div
        ref={captureRef}
        style={{
          position: "fixed",
          left: "-9999px",
          top: 0,
          background: "white",
        }}
      />
    </>
  )
}

function buildTableHtml(
  rows: string[][],
  firstRowIsHeader: boolean,
  fontSize: number
): string {
  const headerBg = "#e5e7eb"
  const evenBg = "#ffffff"
  const oddBg = "#f9fafb"
  const borderColor = "#d1d5db"

  let html = `<table style="width:100%;border-collapse:collapse;font-family:sans-serif;font-size:${fontSize}px;">`

  rows.forEach((row, rowIdx) => {
    const isHeader = firstRowIsHeader && rowIdx === 0
    const tag = isHeader ? "th" : "td"
    const bg = isHeader ? headerBg : rowIdx % 2 === 0 ? evenBg : oddBg
    const fontWeight = isHeader ? "bold" : "normal"

    html += `<tr style="background:${bg};">`
    row.forEach((cell) => {
      html += `<${tag} style="border:1px solid ${borderColor};padding:${fontSize * 0.5}px ${fontSize * 0.8}px;font-weight:${fontWeight};text-align:left;color:#111827;">${escapeHtml(cell)}</${tag}>`
    })
    html += "</tr>"
  })

  html += "</table>"
  return html
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
