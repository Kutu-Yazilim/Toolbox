"use client"

import { useState, useCallback, useMemo } from "react"
import { jsPDF } from "jspdf"
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
import { CSV_TO_PDF_PRESETS } from "@/components/pdf/pdfPresets"
import type { Preset } from "@/components/shared/PresetsDrawer"
import type { ExportOption } from "@/components/shared/ExportMenu"

const ACCEPTED_MIME_TYPES = ["text/csv"]
const ACCEPTED_EXTENSIONS = [".csv"]

type Delimiter = "," | ";" | "\t"
type PageSizeOption = "a4" | "letter"
type OrientationOption = "portrait" | "landscape"
type FontSizeOption = 4 | 6 | 8 | 10 | 12

interface CsvToPdfSettings {
  delimiter: Delimiter
  hasHeader: "yes" | "no"
  pageSize: PageSizeOption
  orientation: OrientationOption
  fontSize: FontSizeOption
  showRowNumbers: "yes" | "no"
}

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

const ROW_NUMBERS_OPTIONS: { value: "yes" | "no"; label: string }[] = [
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
const FONT_NAME = "LiberationSans"

let fontCache: { regular: string; bold: string } | null = null

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunks: string[] = []
  for (let i = 0; i < bytes.length; i += 8192) {
    chunks.push(String.fromCharCode(...bytes.subarray(i, i + 8192)))
  }
  return btoa(chunks.join(""))
}

async function loadFonts(): Promise<{ regular: string; bold: string }> {
  if (fontCache) return fontCache
  const [regularBuf, boldBuf] = await Promise.all([
    fetch("/fonts/LiberationSans-Regular.ttf").then((r) => r.arrayBuffer()),
    fetch("/fonts/LiberationSans-Bold.ttf").then((r) => r.arrayBuffer()),
  ])
  fontCache = {
    regular: arrayBufferToBase64(regularBuf),
    bold: arrayBufferToBase64(boldBuf),
  }
  return fontCache
}

function registerFonts(pdf: jsPDF, fonts: { regular: string; bold: string }) {
  pdf.addFileToVFS("LiberationSans-Regular.ttf", fonts.regular)
  pdf.addFileToVFS("LiberationSans-Bold.ttf", fonts.bold)
  pdf.addFont("LiberationSans-Regular.ttf", FONT_NAME, "normal")
  pdf.addFont("LiberationSans-Bold.ttf", FONT_NAME, "bold")
}

let logoCache: string | null = null

async function loadLogo(): Promise<string> {
  if (logoCache) return logoCache
  const res = await fetch("/LogoOnlyCircularSVG.svg")
  const svgText = await res.text()
  const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" })
  const url = URL.createObjectURL(blob)

  const img = new Image()
  img.src = url
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = reject
  })

  const size = 64
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(img, 0, 0, size, size)
  URL.revokeObjectURL(url)

  logoCache = canvas.toDataURL("image/png")
  return logoCache
}

const FOOTER_HEIGHT = 24
const FOOTER_TEXT = "made using toolbox.kutuyazilim.org"

function drawPageFooter(
  pdf: jsPDF,
  logoDataUrl: string,
  pageWidth: number,
  pageHeight: number,
  padding: number
) {
  const logoSize = 14
  const gap = 4
  const footerFontSize = 7
  const centerY = pageHeight - padding - logoSize / 2

  pdf.setFontSize(footerFontSize)
  pdf.setFont(FONT_NAME, "normal")
  pdf.setTextColor(156, 163, 175)
  const textWidth = pdf.getTextWidth(FOOTER_TEXT)

  const totalWidth = logoSize + gap + textWidth
  const startX = (pageWidth - totalWidth) / 2

  pdf.addImage(logoDataUrl, "PNG", startX, centerY - logoSize / 2, logoSize, logoSize)
  pdf.text(FOOTER_TEXT, startX + logoSize + gap, centerY, { baseline: "middle" })
}

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
  pdf.setFont(FONT_NAME, "bold")
  if (allRows.length > 0) {
    for (let c = 0; c < colCount; c++) {
      const text = allRows[0][c] ?? ""
      maxWidths[c] = Math.max(maxWidths[c], pdf.getTextWidth(text) + cellPadX * 2)
    }
  }

  pdf.setFont(FONT_NAME, "normal")
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

function drawDocumentHeader(
  pdf: jsPDF,
  x: number,
  y: number,
  maxWidth: number,
  title: string,
  subtitle: string,
  paragraph: string,
  tableFontSize: number
): number {
  let curY = y

  if (title) {
    const titleSize = Math.max(tableFontSize * 1.8, 14)
    pdf.setFontSize(titleSize)
    pdf.setFont(FONT_NAME, "bold")
    pdf.setTextColor(17, 24, 39)
    pdf.text(title, x, curY)
    curY += titleSize * 1.4
  }

  if (subtitle) {
    const subtitleSize = Math.max(tableFontSize * 1.3, 11)
    pdf.setFontSize(subtitleSize)
    pdf.setFont(FONT_NAME, "normal")
    pdf.setTextColor(107, 114, 128)
    pdf.text(subtitle, x, curY)
    curY += subtitleSize * 1.4
  }

  if (paragraph) {
    const paraSize = Math.max(tableFontSize * 1.1, 9)
    pdf.setFontSize(paraSize)
    pdf.setFont(FONT_NAME, "normal")
    pdf.setTextColor(55, 65, 81)
    const lines = pdf.splitTextToSize(paragraph, maxWidth) as string[]
    for (const line of lines) {
      pdf.text(line, x, curY)
      curY += paraSize * 1.4
    }
  }

  if (title || subtitle || paragraph) {
    curY += 8
  }

  return curY
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

    pdf.setFont(FONT_NAME, isHeader ? "bold" : "normal")
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

const DEFAULT_SETTINGS: CsvToPdfSettings = {
  delimiter: ",",
  hasHeader: "yes",
  pageSize: "a4",
  orientation: "portrait",
  fontSize: 10,
  showRowNumbers: "no",
}

export function CsvToPdf() {
  const [rawText, setRawText] = useState<string | null>(null)
  const [fileName, setFileName] = useState("")
  const [settings, setSettings] = useLocalStorage<CsvToPdfSettings>(
    "pdf-tool-csv-settings",
    DEFAULT_SETTINGS,
  )
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [paragraph, setParagraph] = useState("")
  const [outputFileName, setOutputFileName] = useState("")
  const [processing, setProcessing] = useState<PdfProcessingState>(INITIAL_PROCESSING_STATE)
  const [result, setResult] = useState<Blob | null>(null)

  const { shareUrl } = useShareableUrl<CsvToPdfSettings>(
    "csv-to-pdf",
    settings,
    useCallback((restored: CsvToPdfSettings) => setSettings(restored), [setSettings]),
  )

  const rows = useMemo(() => rawText ? parseCsv(rawText, settings.delimiter) : [], [rawText, settings.delimiter])
  const headerRow = settings.hasHeader === "yes" && rows.length > 0 ? rows[0] : null
  const dataRows = useMemo(() => settings.hasHeader === "yes" ? rows.slice(1) : rows, [rows, settings.hasHeader])
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
      const detected = detectDelimiter(firstLine)
      setSettings((prev) => ({ ...prev, delimiter: detected }))
    }
    reader.readAsText(file)
  }, [setSettings])

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
    const detected = detectDelimiter(firstLine)
    setSettings((prev) => ({ ...prev, delimiter: detected }))
  }, [fileName, setSettings])

  const handleConvert = useCallback(async () => {
    if (rows.length === 0) return

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
      const cellPadX = settings.fontSize * 0.8
      const rowHeight = settings.fontSize * 2.2

      const pdf = new jsPDF({
        unit: "px",
        format: [dims.width, dims.height],
      })

      const [fonts, logoDataUrl] = await Promise.all([loadFonts(), loadLogo()])
      registerFonts(pdf, fonts)

      // Measure document header height on a scratch pass
      const headerBlockHeight =
        title || subtitle || paragraph
          ? drawDocumentHeader(pdf, padding, padding, contentWidth, title, subtitle, paragraph, settings.fontSize) - padding
          : 0
      const footerReserved = FOOTER_HEIGHT

      // Prepare rows with optional row-number column
      const addRowNum = settings.showRowNumbers === "yes"
      const displayHeader = headerRow
        ? addRowNum ? ["#", ...headerRow] : headerRow
        : null
      const displayDataRows = dataRows.map((row, idx) =>
        addRowNum ? [String(idx + 1), ...row] : row
      )
      const allDisplayRows = displayHeader
        ? [displayHeader, ...displayDataRows]
        : displayDataRows

      const colCount = Math.max(...allDisplayRows.map((r) => r.length))
      const colWidths = computeColumnWidths(
        allDisplayRows,
        colCount,
        contentWidth,
        pdf,
        settings.fontSize,
        cellPadX
      )

      const tableHeaderHeight = displayHeader ? rowHeight : 0
      const availableHeightPage1 = dims.height - padding * 2 - headerBlockHeight - tableHeaderHeight - footerReserved
      const availableHeightRest = dims.height - padding * 2 - tableHeaderHeight - footerReserved
      const rowsPage1 = Math.max(1, Math.floor(availableHeightPage1 / rowHeight))
      const rowsPerPage = Math.max(1, Math.floor(availableHeightRest / rowHeight))
      const totalDataRows = displayDataRows.length
      const remainingAfterPage1 = Math.max(0, totalDataRows - rowsPage1)
      const pageCount = 1 + (remainingAfterPage1 > 0 ? Math.ceil(remainingAfterPage1 / rowsPerPage) : 0)

      for (let page = 0; page < pageCount; page++) {
        if (page > 0) {
          pdf.addPage([dims.width, dims.height])
        }

        let y = padding

        // Draw document header only on the first page
        if (page === 0 && (title || subtitle || paragraph)) {
          y = drawDocumentHeader(pdf, padding, y, contentWidth, title, subtitle, paragraph, settings.fontSize)
        }

        if (displayHeader) {
          drawTableRow(pdf, displayHeader, padding, y, colWidths, rowHeight, settings.fontSize, cellPadX, true, false)
          y += rowHeight
        }

        const startIdx = page === 0 ? 0 : rowsPage1 + (page - 1) * rowsPerPage
        const count = page === 0 ? rowsPage1 : rowsPerPage
        const batch = displayDataRows.slice(startIdx, startIdx + count)

        for (let i = 0; i < batch.length; i++) {
          drawTableRow(pdf, batch[i], padding, y, colWidths, rowHeight, settings.fontSize, cellPadX, false, i % 2 === 1)
          y += rowHeight
        }

        drawPageFooter(pdf, logoDataUrl, dims.width, dims.height, padding)

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
  }, [rows, dataRows, headerRow, settings, title, subtitle, paragraph])

  const computedFileName = outputFileName || (title ? title.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") : "") || fileName || "csv-export"

  const handleDownload = useCallback(() => {
    if (result) {
      downloadBlob(result, `${computedFileName}.pdf`)
    }
  }, [result, computedFileName])

  const handleRetry = useCallback(() => {
    setProcessing(INITIAL_PROCESSING_STATE)
    setResult(null)
  }, [])

  const handlePresetSelect = useCallback((preset: Preset) => {
    const parsed = JSON.parse(preset.content) as Partial<CsvToPdfSettings>
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
        title="CSV to PDF"
        status={toolbarStatus}
        onShare={shareUrl}
        exportOptions={exportOptions}
        presets={CSV_TO_PDF_PRESETS}
        onPresetSelect={handlePresetSelect}
        shortcuts={shortcuts}
      />

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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Title
              </label>
              <input
                type="text"
                maxLength={30}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Document title"
                className={cn(
                  "w-full rounded-md border border-border bg-muted/30 px-3 py-1.5",
                  "text-xs text-foreground placeholder:text-muted-foreground/50",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                )}
              />
              <span className="text-[10px] text-muted-foreground/60 mt-0.5 block text-right">{title.length}/30</span>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Subtitle
              </label>
              <input
                type="text"
                maxLength={50}
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Document subtitle"
                className={cn(
                  "w-full rounded-md border border-border bg-muted/30 px-3 py-1.5",
                  "text-xs text-foreground placeholder:text-muted-foreground/50",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                )}
              />
              <span className="text-[10px] text-muted-foreground/60 mt-0.5 block text-right">{subtitle.length}/50</span>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                File Name
              </label>
              <input
                type="text"
                value={outputFileName}
                onChange={(e) => setOutputFileName(e.target.value)}
                placeholder={title
                  ? title.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")
                  : fileName || "csv-export"}
                className={cn(
                  "w-full rounded-md border border-border bg-muted/30 px-3 py-1.5",
                  "text-xs text-foreground placeholder:text-muted-foreground/50",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                )}
              />
              <span className="text-[10px] text-muted-foreground/60 mt-0.5 block text-right">.pdf</span>
            </div>
            <div className="sm:col-span-3">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Description
              </label>
              <textarea
                maxLength={500}
                value={paragraph}
                onChange={(e) => setParagraph(e.target.value)}
                placeholder="Optional paragraph displayed above the table"
                rows={2}
                className={cn(
                  "w-full rounded-md border border-border bg-muted/30 px-3 py-1.5",
                  "text-xs text-foreground placeholder:text-muted-foreground/50",
                  "resize-y focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                )}
              />
              <span className="text-[10px] text-muted-foreground/60 mt-0.5 block text-right">{paragraph.length}/500</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <OptionGroup
              label="Delimiter"
              options={DELIMITER_OPTIONS}
              value={settings.delimiter}
              onChange={(v) => setSettings((prev) => ({ ...prev, delimiter: v }))}
            />
            <OptionGroup
              label="Header Row"
              options={HAS_HEADER_OPTIONS}
              value={settings.hasHeader}
              onChange={(v) => setSettings((prev) => ({ ...prev, hasHeader: v }))}
            />
            <OptionGroup
              label="Row Numbers"
              options={ROW_NUMBERS_OPTIONS}
              value={settings.showRowNumbers}
              onChange={(v) => setSettings((prev) => ({ ...prev, showRowNumbers: v }))}
            />
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
          filename={`${computedFileName}.pdf`}
        />
      )}
    </>
  )
}
