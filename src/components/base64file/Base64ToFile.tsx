"use client"

import { useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  DownloadIcon,
  TrashIcon,
  AlertCircleIcon,
  FileIcon,
  FileTextIcon,
  FileSpreadsheetIcon,
  FileImageIcon,
  ClipboardPasteIcon,
  InfoIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useShareableUrl } from "@/hooks/useShareableUrl"
import { useFileImport } from "@/hooks/useFileImport"
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { type Preset } from "@/components/shared/PresetsDrawer"
import { BASE64_FILE_PRESETS } from "./presets"

type FileType = {
  extension: string
  mime: string
  label: string
  category: "image" | "document" | "text" | "data" | "other"
}

const FILE_TYPES: FileType[] = [
  { extension: "png", mime: "image/png", label: "PNG Image", category: "image" },
  { extension: "jpg", mime: "image/jpeg", label: "JPEG Image", category: "image" },
  { extension: "gif", mime: "image/gif", label: "GIF Image", category: "image" },
  { extension: "webp", mime: "image/webp", label: "WebP Image", category: "image" },
  { extension: "svg", mime: "image/svg+xml", label: "SVG Image", category: "image" },
  { extension: "ico", mime: "image/x-icon", label: "ICO Icon", category: "image" },
  { extension: "bmp", mime: "image/bmp", label: "BMP Image", category: "image" },
  { extension: "pdf", mime: "application/pdf", label: "PDF Document", category: "document" },
  { extension: "docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", label: "Word Document", category: "document" },
  { extension: "xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", label: "Excel Spreadsheet", category: "data" },
  { extension: "csv", mime: "text/csv", label: "CSV File", category: "data" },
  { extension: "json", mime: "application/json", label: "JSON File", category: "text" },
  { extension: "xml", mime: "application/xml", label: "XML File", category: "text" },
  { extension: "txt", mime: "text/plain", label: "Text File", category: "text" },
  { extension: "md", mime: "text/markdown", label: "Markdown File", category: "text" },
  { extension: "html", mime: "text/html", label: "HTML File", category: "text" },
  { extension: "css", mime: "text/css", label: "CSS File", category: "text" },
  { extension: "js", mime: "text/javascript", label: "JavaScript File", category: "text" },
  { extension: "ts", mime: "text/typescript", label: "TypeScript File", category: "text" },
  { extension: "zip", mime: "application/zip", label: "ZIP Archive", category: "other" },
  { extension: "mp3", mime: "audio/mpeg", label: "MP3 Audio", category: "other" },
  { extension: "mp4", mime: "video/mp4", label: "MP4 Video", category: "other" },
  { extension: "wav", mime: "audio/wav", label: "WAV Audio", category: "other" },
]

// Detect file type from data URI prefix
function detectFromDataUri(input: string): { mime: string; base64: string } | null {
  const match = input.match(/^data:([^;]+);base64,(.+)$/s)
  if (!match) return null
  return { mime: match[1], base64: match[2] }
}

// Detect file type from raw base64 magic bytes
function detectFromMagicBytes(base64: string): string | null {
  const clean = base64.replace(/\s/g, "")
  if (clean.startsWith("iVBOR")) return "image/png"
  if (clean.startsWith("/9j/")) return "image/jpeg"
  if (clean.startsWith("R0lG")) return "image/gif"
  if (clean.startsWith("JVBE")) return "application/pdf"
  if (clean.startsWith("UEsD")) return "application/zip"
  if (clean.startsWith("UklG")) return "image/webp"
  if (clean.startsWith("Qk")) return "image/bmp"
  if (clean.startsWith("UklG") && !clean.startsWith("UklGR")) return "audio/wav"
  if (clean.startsWith("SUQz") || clean.startsWith("//u")) return "audio/mpeg"

  try {
    const decoded = atob(clean.slice(0, 100))
    const trimmed = decoded.trimStart()
    if (trimmed.startsWith("<svg")) return "image/svg+xml"
    if (trimmed.startsWith("<!DOCTYPE html") || trimmed.startsWith("<html")) return "text/html"
    if (trimmed.startsWith("<?xml")) return "application/xml"
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "application/json"
  } catch {
    // not valid base64
  }

  return null
}

function getFileTypeByMime(mime: string): FileType | undefined {
  return FILE_TYPES.find(ft => ft.mime === mime)
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function decodeBase64ToText(base64: string): string | null {
  try {
    return decodeURIComponent(
      atob(base64)
        .split("")
        .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )
  } catch {
    try {
      return atob(base64)
    } catch {
      return null
    }
  }
}

export function Base64ToFile() {
  const [input, setInput] = useLocalStorage<string>("base64-to-file-input", "")
  const [manualMime, setManualMime] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { shareUrl } = useShareableUrl("base64-to-file", { input }, (restored) => {
    setInput((restored as { input: string }).input)
    setManualMime(null)
    setError(null)
  })

  const { dropzoneProps, isDragging } = useFileImport({
    accept: [".txt", ".b64"],
    onImport: (content) => {
      setInput(content)
      setManualMime(null)
      setError(null)
    },
  })

  const handleClear = useCallback(() => {
    setInput("")
    setManualMime(null)
    setError(null)
  }, [setInput])

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      setInput(text)
      setManualMime(null)
    } catch {
      setError("Failed to read clipboard")
    }
  }, [setInput])

  const shortcuts: Shortcut[] = useMemo(() => [
    { key: "mod+v", label: "Paste from clipboard", action: handlePaste },
    { key: "mod+shift+x", label: "Clear input", action: handleClear },
  ], [handlePaste, handleClear])

  useKeyboardShortcuts(shortcuts)

  const parsed = useMemo(() => {
    if (!input.trim()) return null
    setError(null)

    let base64 = input.trim()
    let detectedMime: string | null = null

    const dataUri = detectFromDataUri(base64)
    if (dataUri) {
      base64 = dataUri.base64
      detectedMime = dataUri.mime
    } else {
      base64 = base64.replace(/\s/g, "")
      detectedMime = detectFromMagicBytes(base64)
    }

    try {
      atob(base64)
    } catch {
      setError("Invalid base64 string")
      return null
    }

    const byteLength = Math.floor((base64.length * 3) / 4)
    const mime = manualMime || detectedMime
    const fileType = mime ? getFileTypeByMime(mime) : null

    return {
      base64,
      mime,
      fileType,
      detectedMime,
      byteLength,
    }
  }, [input, manualMime])

  const handleDownload = useCallback(() => {
    if (!parsed) return
    const mime = parsed.mime || "application/octet-stream"
    const ext = parsed.fileType?.extension || "bin"
    const dataUrl = `data:${mime};base64,${parsed.base64}`
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = `file.${ext}`
    a.click()
  }, [parsed])

  const handlePresetSelect = useCallback((preset: Preset) => {
    setInput(preset.content)
    setManualMime(null)
    setError(null)
  }, [setInput])

  const previewDataUrl = useMemo(() => {
    if (!parsed?.base64 || !parsed.mime) return null
    return `data:${parsed.mime};base64,${parsed.base64}`
  }, [parsed])

  const textContent = useMemo(() => {
    if (!parsed?.base64) return null
    if (!parsed.fileType || parsed.fileType.category !== "text") {
      if (parsed.mime === "text/csv") {
        return decodeBase64ToText(parsed.base64)
      }
      return null
    }
    return decodeBase64ToText(parsed.base64)
  }, [parsed])

  const csvData = useMemo(() => {
    if (parsed?.mime !== "text/csv" || !textContent) return null
    const lines = textContent.split("\n").filter(l => l.trim())
    if (lines.length === 0) return null
    return lines.map(line => {
      const cells: string[] = []
      let current = ""
      let inQuotes = false
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') {
          inQuotes = !inQuotes
        } else if (ch === "," && !inQuotes) {
          cells.push(current.trim())
          current = ""
        } else {
          current += ch
        }
      }
      cells.push(current.trim())
      return cells
    })
  }, [parsed?.mime, textContent])

  return (
    <div className="h-full flex flex-col min-h-0" {...dropzoneProps}>
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-lg">
          <span className="text-sm font-medium text-primary">Drop file to import</span>
        </div>
      )}

      {/* Two-panel layout */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 gap-px bg-border">
        {/* Input panel (left) */}
        <div className="flex flex-col bg-background w-full md:w-1/2 h-1/2 md:h-auto min-h-0">
          {/* Input toolbar */}
          <ToolToolbar
            title="Base64 Input"
            onShare={shareUrl}
            presets={BASE64_FILE_PRESETS}
            onPresetSelect={handlePresetSelect}
            shortcuts={shortcuts}
          >
            <div className="flex items-center gap-1 ml-auto">
              <Button variant="ghost" size="xs" onClick={handlePaste} title="Paste from clipboard">
                <ClipboardPasteIcon className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="xs" onClick={handleClear} title="Clear" disabled={!input}>
                <TrashIcon className="h-3 w-3" />
              </Button>
            </div>
          </ToolToolbar>

          {/* Textarea */}
          <div className="flex-1 min-h-0">
            <textarea
              value={input}
              onChange={e => { setInput(e.target.value); setManualMime(null); setError(null) }}
              className="w-full h-full px-3 py-2 text-xs font-mono bg-transparent text-foreground resize-none outline-none"
              placeholder="Paste a base64 string here...&#10;&#10;Supports data URIs like:&#10;data:image/png;base64,iVBORw0KGgo...&#10;&#10;Or raw base64:&#10;iVBORw0KGgoAAAANSUhEU..."
              spellCheck={false}
            />
          </div>

          {/* File type override */}
          {input.trim() && (
            <div className="flex items-center gap-2 px-3 h-9 border-t border-border flex-shrink-0 bg-muted/20">
              <span className="text-[10px] text-muted-foreground flex-shrink-0">Type:</span>
              <select
                value={manualMime || parsed?.detectedMime || ""}
                onChange={e => setManualMime(e.target.value || null)}
                className="text-[11px] bg-transparent border border-border rounded px-1.5 py-0.5 text-foreground outline-none cursor-pointer min-w-0"
              >
                <option value="">
                  {parsed?.detectedMime
                    ? `Auto-detected: ${getFileTypeByMime(parsed.detectedMime)?.label || parsed.detectedMime}`
                    : "Select file type..."}
                </option>
                {FILE_TYPES.map(ft => (
                  <option key={ft.mime} value={ft.mime}>
                    {ft.label} (.{ft.extension})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="px-3 py-2 bg-destructive/10 border-t border-destructive/20 flex-shrink-0">
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircleIcon className="h-3 w-3 flex-shrink-0" />
                {error}
              </p>
            </div>
          )}
        </div>

        {/* Preview panel (right) */}
        <div className="flex-1 flex flex-col bg-background min-w-0 h-1/2 md:h-auto min-h-0">
          {/* Preview toolbar */}
          <div className="flex items-center justify-between px-3 h-9 border-b border-border flex-shrink-0">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              PREVIEW
            </span>
            <div className="flex items-center gap-1">
              {parsed && (
                <>
                  <span className="text-[10px] text-muted-foreground mr-1">
                    {formatBytes(parsed.byteLength)}
                    {parsed.fileType && ` · .${parsed.fileType.extension}`}
                  </span>
                  <Button variant="ghost" size="xs" onClick={handleDownload} title="Download file">
                    <DownloadIcon className="h-3 w-3" />
                    <span className="text-[10px] ml-0.5">Download</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Preview content */}
          <div className="flex-1 min-h-0 overflow-auto">
            {!input.trim() ? (
              <EmptyState />
            ) : error ? (
              <ErrorState />
            ) : !parsed?.mime ? (
              <UnknownTypeState onDownload={handleDownload} byteLength={parsed?.byteLength} />
            ) : parsed.fileType?.category === "image" && previewDataUrl ? (
              <ImagePreview src={previewDataUrl} label={parsed.fileType.label} />
            ) : parsed.mime === "application/pdf" && previewDataUrl ? (
              <PdfPreview src={previewDataUrl} />
            ) : parsed.mime === "text/csv" && csvData ? (
              <CsvPreview data={csvData} />
            ) : textContent !== null ? (
              <TextPreview content={textContent} fileType={parsed.fileType} />
            ) : parsed.mime.startsWith("audio/") && previewDataUrl ? (
              <AudioPreview src={previewDataUrl} label={parsed.fileType?.label || "Audio"} />
            ) : parsed.mime.startsWith("video/") && previewDataUrl ? (
              <VideoPreview src={previewDataUrl} label={parsed.fileType?.label || "Video"} />
            ) : (
              <BinaryPreview fileType={parsed.fileType} byteLength={parsed.byteLength} onDownload={handleDownload} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Preview sub-components ---------- */

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-muted-foreground px-6">
      <FileIcon className="size-10 mb-3 opacity-40" />
      <p className="text-sm font-medium mb-1">No input yet</p>
      <p className="text-xs text-center max-w-[260px]">
        Paste a base64 string on the left to see a file preview here.
      </p>
    </div>
  )
}

function ErrorState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-muted-foreground px-6">
      <AlertCircleIcon className="size-10 mb-3 text-destructive/40" />
      <p className="text-sm font-medium text-destructive mb-1">Invalid base64</p>
      <p className="text-xs text-center max-w-[260px]">
        The input doesn't appear to be a valid base64 string.
      </p>
    </div>
  )
}

function UnknownTypeState({ onDownload, byteLength }: { onDownload: () => void; byteLength?: number }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-muted-foreground px-6">
      <InfoIcon className="size-10 mb-3 opacity-40" />
      <p className="text-sm font-medium mb-1">Unknown file type</p>
      <p className="text-xs text-center max-w-[280px] mb-3">
        Could not detect the file type. Select a type from the dropdown on the left, or download as-is.
      </p>
      {byteLength !== undefined && (
        <p className="text-[10px] text-muted-foreground mb-3">{formatBytes(byteLength)}</p>
      )}
      <Button variant="outline" size="sm" onClick={onDownload}>
        <DownloadIcon className="h-3.5 w-3.5 mr-1.5" />
        Download as file
      </Button>
    </div>
  )
}

function ImagePreview({ src, label }: { src: string; label: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <div className="relative max-w-full max-h-full flex items-center justify-center">
        <img
          src={src}
          alt={label}
          className="max-w-full max-h-[calc(100vh-160px)] object-contain rounded-lg border border-border shadow-sm"
          style={{ imageRendering: "auto" }}
        />
      </div>
    </div>
  )
}

function PdfPreview({ src }: { src: string }) {
  return (
    <div className="h-full p-2">
      <iframe
        src={src}
        className="w-full h-full rounded border border-border"
        title="PDF Preview"
      />
    </div>
  )
}

function TextPreview({ content, fileType }: { content: string; fileType: FileType | null | undefined }) {
  return (
    <div className="h-full p-3 overflow-auto">
      <div className="flex items-center gap-1.5 mb-2">
        <FileTextIcon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          {fileType?.label || "Text Content"}
        </span>
      </div>
      <pre className="text-xs font-mono text-foreground/90 whitespace-pre-wrap break-words leading-relaxed bg-muted/30 rounded-md p-3 border border-border">
        {content}
      </pre>
    </div>
  )
}

function CsvPreview({ data }: { data: string[][] }) {
  const maxCols = Math.max(...data.map(r => r.length))
  return (
    <div className="h-full p-3 overflow-auto">
      <div className="flex items-center gap-1.5 mb-2">
        <FileSpreadsheetIcon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          CSV · {data.length} rows · {maxCols} columns
        </span>
      </div>
      <div className="overflow-x-auto border border-border rounded-md">
        <table className="min-w-full text-xs font-mono">
          <thead>
            <tr className="bg-muted/40 border-b border-border">
              <th className="px-2 py-1 text-left text-[10px] font-semibold text-muted-foreground border-r border-border w-8">#</th>
              {data[0]?.map((cell, i) => (
                <th key={i} className="px-2 py-1 text-left text-[10px] font-semibold text-foreground border-r border-border last:border-r-0">
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(1).map((row, ri) => (
              <tr key={ri} className={cn("border-b border-border last:border-b-0", ri % 2 === 0 ? "" : "bg-muted/20")}>
                <td className="px-2 py-1 text-[10px] text-muted-foreground border-r border-border">{ri + 1}</td>
                {row.map((cell, ci) => (
                  <td key={ci} className="px-2 py-1 text-foreground/90 border-r border-border last:border-r-0 whitespace-nowrap">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AudioPreview({ src, label }: { src: string; label: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <FileIcon className="size-10 mb-3 text-muted-foreground/40" />
      <p className="text-sm font-medium text-foreground mb-3">{label}</p>
      <audio controls src={src} className="max-w-[300px] w-full" />
    </div>
  )
}

function VideoPreview({ src, label }: { src: string; label: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
      <video
        controls
        src={src}
        className="max-w-full max-h-[calc(100vh-200px)] rounded-lg border border-border"
      />
    </div>
  )
}

function BinaryPreview({
  fileType,
  byteLength,
  onDownload,
}: {
  fileType: FileType | null | undefined
  byteLength: number
  onDownload: () => void
}) {
  const Icon = fileType?.category === "image" ? FileImageIcon
    : fileType?.category === "data" ? FileSpreadsheetIcon
    : fileType?.category === "document" ? FileTextIcon
    : FileIcon

  return (
    <div className="h-full flex flex-col items-center justify-center text-muted-foreground px-6">
      <Icon className="size-10 mb-3 opacity-40" />
      <p className="text-sm font-medium text-foreground mb-1">
        {fileType?.label || "Binary File"}
      </p>
      <p className="text-xs mb-1">{formatBytes(byteLength)}</p>
      {fileType && (
        <p className="text-[10px] mb-3">.{fileType.extension} · {fileType.mime}</p>
      )}
      <p className="text-xs text-center max-w-[260px] mb-4">
        This file type cannot be previewed in the browser. Download to open it in the appropriate application.
      </p>
      <Button variant="outline" size="sm" onClick={onDownload}>
        <DownloadIcon className="h-3.5 w-3.5 mr-1.5" />
        Download .{fileType?.extension || "bin"}
      </Button>
    </div>
  )
}
