"use client"

import { useState, useCallback, useMemo, useRef } from "react"
import { toPng } from "html-to-image"
import { jsPDF } from "jspdf"
import * as XLSX from "xlsx"
import type { PdfProcessingState } from "@/types/pdf"
import { INITIAL_PROCESSING_STATE } from "@/types/pdf"
import { PdfFileDropZone } from "@/components/pdf/PdfFileDropZone"
import { PdfProgressBar } from "@/components/pdf/PdfProgressBar"
import { PdfDownloadButton } from "@/components/pdf/PdfDownloadButton"
import { downloadBlob } from "@/utils/pdfUtils"
import { cn } from "@/lib/utils"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useShareableUrl } from "@/hooks/useShareableUrl"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { XLSX_TO_PDF_PRESETS } from "@/components/pdf/pdfPresets"
import type { Preset } from "@/components/shared/PresetsDrawer"
import type { ExportOption } from "@/components/shared/ExportMenu"

const ACCEPTED_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
]
const ACCEPTED_EXTENSIONS = [".xlsx", ".xls"]

type PageSizeOption = "a4" | "letter"
type OrientationOption = "portrait" | "landscape"
type FontSizeOption = 8 | 10 | 12

interface XlsxToPdfSettings {
  pageSize: PageSizeOption
  orientation: OrientationOption
  fontSize: FontSizeOption
}

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

const DEFAULT_SETTINGS: XlsxToPdfSettings = {
  pageSize: "a4",
  orientation: "landscape",
  fontSize: 10,
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

export function XlsxToPdf() {
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [activeSheet, setActiveSheet] = useState(0)
  const [sheets, setSheets] = useState<string[][][]>([])
  const [fileName, setFileName] = useState("")
  const [settings, setSettings] = useLocalStorage<XlsxToPdfSettings>(
    "pdf-tool-xlsx-settings",
    DEFAULT_SETTINGS,
  )
  const [processing, setProcessing] = useState<PdfProcessingState>(INITIAL_PROCESSING_STATE)
  const [result, setResult] = useState<Blob | null>(null)
  const captureRef = useRef<HTMLDivElement>(null)

  const { shareUrl } = useShareableUrl<XlsxToPdfSettings>(
    "xlsx-to-pdf",
    settings,
    useCallback((restored: XlsxToPdfSettings) => setSettings(restored), [setSettings]),
  )

  const currentRows = sheets[activeSheet] ?? []
  const headerRow = currentRows.length > 0 ? currentRows[0] : null
  const dataRows = useMemo(() => currentRows.slice(1), [currentRows])
  const previewRows = dataRows.slice(0, PREVIEW_MAX_ROWS)

  const handleFiles = useCallback((files: File[]) => {
    if (files.length === 0) return

    setResult(null)
    setProcessing(INITIAL_PROCESSING_STATE)

    const file = files[0]
    setFileName(file.name.replace(/\.(xlsx|xls)$/i, ""))

    const reader = new FileReader()
    reader.onload = () => {
      const data = new Uint8Array(reader.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: "array" })

      setSheetNames(workbook.SheetNames)

      const parsedSheets: string[][][] = workbook.SheetNames.map((name) => {
        const sheet = workbook.Sheets[name]
        const rows: string[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
          blankrows: false,
        })
        return rows.map((row) => row.map((cell) => String(cell ?? "")))
      })

      setSheets(parsedSheets)
      setActiveSheet(0)
    }
    reader.readAsArrayBuffer(file)
  }, [])

  const handleConvert = useCallback(async () => {
    if (!captureRef.current || currentRows.length === 0) return

    setProcessing({
      status: "processing",
      progress: 0,
      message: "Generating PDF...",
      error: null,
    })

    try {
      const dims = PAGE_DIMENSIONS[settings.pageSize][settings.orientation]
      const padding = 24
      const contentWidth = dims.width - padding * 2
      const rowHeight = settings.fontSize * 2.2
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
          settings.fontSize
        )

        captureRef.current.style.width = `${contentWidth}px`

        // Force synchronous reflow
        void captureRef.current.offsetHeight
        await new Promise((r) => setTimeout(r, 100))

        const capturedHeight = captureRef.current.scrollHeight || captureRef.current.offsetHeight

        const dataUrl = await toPng(captureRef.current, {
          width: contentWidth,
          height: capturedHeight,
          canvasWidth: contentWidth,
          canvasHeight: capturedHeight,
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
          capturedHeight
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
  }, [currentRows, dataRows, headerRow, settings])

  const handleDownload = useCallback(() => {
    if (result) {
      downloadBlob(result, `${fileName || "spreadsheet"}.pdf`)
    }
  }, [result, fileName])

  const handleRetry = useCallback(() => {
    setProcessing(INITIAL_PROCESSING_STATE)
    setResult(null)
  }, [])

  const handlePresetSelect = useCallback((preset: Preset) => {
    const parsed = JSON.parse(preset.content) as Partial<XlsxToPdfSettings>
    setSettings((prev) => ({ ...prev, ...parsed }))
  }, [setSettings])

  const shortcuts = [
    { key: "mod+enter", label: "Convert to PDF", action: handleConvert },
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
        title="XLSX to PDF"
        status={toolbarStatus}
        onShare={shareUrl}
        exportOptions={exportOptions}
        presets={XLSX_TO_PDF_PRESETS}
        onPresetSelect={handlePresetSelect}
        shortcuts={shortcuts}
      />

      <PdfFileDropZone
        acceptedMimeTypes={ACCEPTED_MIME_TYPES}
        acceptedExtensions={ACCEPTED_EXTENSIONS}
        multiple={false}
        onFiles={handleFiles}
        label="Drop an XLSX or XLS file here or click to browse"
      />

      {sheets.length > 0 && (
        <>
          {/* Sheet tabs */}
          {sheetNames.length > 1 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Sheet
              </label>
              <div className="flex flex-wrap gap-1">
                {sheetNames.map((name, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveSheet(i)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                      activeSheet === i
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <OptionGroup
              label="Page Size"
              options={PAGE_SIZE_OPTIONS}
              value={settings.pageSize}
              onChange={(v) => setSettings((prev) => ({ ...prev, pageSize: v }))}
            />
            <OptionGroup
              label="Orientation"
              options={ORIENTATION_OPTIONS}
              value={settings.orientation}
              onChange={(v) => setSettings((prev) => ({ ...prev, orientation: v }))}
            />
            <OptionGroup
              label="Font Size"
              options={FONT_SIZE_OPTIONS}
              value={settings.fontSize}
              onChange={(v) => setSettings((prev) => ({ ...prev, fontSize: v }))}
            />
          </div>

          {/* Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground">
                Preview — {sheetNames[activeSheet]}
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
              disabled={processing.status === "processing" || currentRows.length === 0}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              Convert to PDF
            </button>
            <span className="text-xs text-muted-foreground">
              {currentRows.length} row{currentRows.length !== 1 ? "s" : ""} total
            </span>
          </div>
        </>
      )}

      <PdfProgressBar state={processing} onRetry={handleRetry} />

      {result && (
        <PdfDownloadButton
          data={result}
          filename={`${fileName || "spreadsheet"}.pdf`}
        />
      )}

      <div
        ref={captureRef}
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          visibility: "hidden",
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
