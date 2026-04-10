"use client"

import { useState, useRef, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  UploadIcon,
  CopyIcon,
  TrashIcon,
  CheckIcon,
  ImageIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useFileImport } from "@/hooks/useFileImport"
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { IMAGE_BASE64_PRESETS } from "./presets"
import { type Preset } from "@/components/shared/PresetsDrawer"

type OutputFormat = "datauri" | "raw" | "html" | "css"

const OUTPUT_FORMATS: { id: OutputFormat; label: string }[] = [
  { id: "datauri", label: "Data URI" },
  { id: "raw", label: "Raw Base64" },
  { id: "html", label: "HTML <img>" },
  { id: "css", label: "CSS background" },
]

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function ImageToBase64() {
  const [dataUri, setDataUri] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>("")
  const [fileSize, setFileSize] = useState(0)
  const [outputFormat, setOutputFormat] = useLocalStorage<OutputFormat>("image-base64-format", "datauri")
  const [copiedButton, setCopiedButton] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const rawBase64 = useMemo(() => {
    if (!dataUri) return ""
    const idx = dataUri.indexOf(",")
    return idx >= 0 ? dataUri.slice(idx + 1) : ""
  }, [dataUri])

  const outputText = useMemo(() => {
    if (!dataUri) return ""
    switch (outputFormat) {
      case "datauri": return dataUri
      case "raw": return rawBase64
      case "html": return `<img src="${dataUri}" alt="image" />`
      case "css": return `background-image: url(${dataUri});`
    }
  }, [dataUri, rawBase64, outputFormat])

  const base64Length = useMemo(() => dataUri?.length ?? 0, [dataUri])

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return
    setFileName(file.name)
    setFileSize(file.size)
    const reader = new FileReader()
    reader.onload = (e) => setDataUri(e.target?.result as string)
    reader.readAsDataURL(file)
  }, [])

  const handleFileImport = useCallback((content: string, filename: string) => {
    setDataUri(content)
    setFileName(filename)
    setFileSize(Math.round(content.length * 0.75))
  }, [])

  const { dropzoneProps, openFilePicker, isDragging } = useFileImport({
    accept: [".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".bmp"],
    onImport: handleFileImport,
    readAs: "dataURL",
  })

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) loadFile(file)
  }, [loadFile])

  const handleClear = useCallback(() => {
    setDataUri(null)
    setFileName("")
    setFileSize(0)
    setOutputFormat("datauri")
    setCopiedButton(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [setOutputFormat])

  const copyToClipboard = useCallback(async (text: string, buttonId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedButton(buttonId)
      setTimeout(() => setCopiedButton(null), 1500)
    } catch { /* clipboard not available */ }
  }, [])

  const handlePresetSelect = useCallback((preset: Preset) => {
    const data = JSON.parse(preset.content)
    if (data.format) setOutputFormat(data.format)
  }, [setOutputFormat])

  const shortcuts: Shortcut[] = useMemo(() => [
    { key: "mod+o", label: "Open image", action: openFilePicker },
    { key: "mod+shift+c", label: "Copy output", action: () => { if (outputText) navigator.clipboard.writeText(outputText) } },
    { key: "mod+shift+r", label: "Clear", action: handleClear },
  ], [openFilePicker, outputText, handleClear])

  useKeyboardShortcuts(shortcuts)

  const exportOptions = useMemo(() => [
    { label: "Copy Data URI", action: () => copyToClipboard(dataUri ?? "", "full") },
    { label: "Copy Raw Base64", action: () => copyToClipboard(rawBase64, "raw") },
    { label: "Download as .txt", action: () => {
      const blob = new Blob([outputText], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url; a.download = `${fileName || "image"}-base64.txt`; a.click()
      URL.revokeObjectURL(url)
    }},
  ], [dataUri, rawBase64, outputText, fileName, copyToClipboard])

  return (
    <div className="h-full flex flex-col min-h-0">
      <ToolToolbar
        title="Image to Base64"
        status={dataUri ? { type: "info", label: `${formatBytes(base64Length)} encoded` } : null}
        copyValue={outputText || undefined}
        exportOptions={dataUri ? exportOptions : undefined}
        presets={IMAGE_BASE64_PRESETS}
        onPresetSelect={handlePresetSelect}
        shortcuts={shortcuts}
      />
      <div className="flex-1 flex flex-col md:flex-row min-h-0 gap-px bg-border">
        <div className="flex flex-col bg-background w-full md:w-1/2 h-1/2 md:h-auto min-h-0">
          <div className="flex items-center justify-between px-3 h-9 border-b border-border flex-shrink-0">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Image</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="xs" onClick={openFilePicker} title="Upload image">
                <UploadIcon className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="xs" onClick={handleClear} title="Clear" disabled={!dataUri}>
                <TrashIcon className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

          <div className="flex-1 min-h-0 overflow-auto">
            {!dataUri ? (
              <div
                {...dropzoneProps}
                className={cn("h-full flex flex-col items-center justify-center cursor-pointer transition-colors", isDragging ? "bg-accent/40 border-2 border-dashed border-ring" : "hover:bg-muted/30")}
                onClick={openFilePicker}
              >
                <ImageIcon className="size-10 mb-3 opacity-40 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground mb-1">Drop an image here</p>
                <p className="text-xs text-muted-foreground">or click to browse</p>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex-1 min-h-0 flex items-center justify-center p-4">
                  <img src={dataUri} alt={fileName} className="max-w-full max-h-full object-contain rounded-lg border border-border shadow-sm" />
                </div>
                <div className="flex items-center gap-3 px-3 h-9 border-t border-border flex-shrink-0 bg-muted/20">
                  <span className="text-[10px] text-muted-foreground truncate">{fileName}</span>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">{formatBytes(fileSize)}</span>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">Base64: {formatBytes(base64Length)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-background min-w-0 h-1/2 md:h-auto min-h-0">
          <div className="flex items-center justify-between px-3 h-9 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-1">
              {OUTPUT_FORMATS.map((fmt) => (
                <button key={fmt.id} onClick={() => setOutputFormat(fmt.id)} className={cn("px-2 py-0.5 rounded text-[10px] font-medium transition-colors", outputFormat === fmt.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                  {fmt.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="xs" onClick={() => copyToClipboard(dataUri ?? "", "full")} disabled={!dataUri} title="Copy full data URI">
                {copiedButton === "full" ? <CheckIcon className="h-3 w-3 text-green-500" /> : <CopyIcon className="h-3 w-3" />}
                <span className="text-[10px] ml-0.5">URI</span>
              </Button>
              <Button variant="ghost" size="xs" onClick={() => copyToClipboard(rawBase64, "raw")} disabled={!dataUri} title="Copy raw base64 only">
                {copiedButton === "raw" ? <CheckIcon className="h-3 w-3 text-green-500" /> : <CopyIcon className="h-3 w-3" />}
                <span className="text-[10px] ml-0.5">Base64</span>
              </Button>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            {!dataUri ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground px-6">
                <p className="text-xs text-center max-w-[260px]">Upload an image to see the base64 output here.</p>
              </div>
            ) : (
              <textarea readOnly value={outputText} className="w-full h-full px-3 py-2 text-xs font-mono bg-transparent text-foreground resize-none outline-none" spellCheck={false} onClick={(e) => (e.target as HTMLTextAreaElement).select()} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
