"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { CopyIcon, CheckIcon, FileUpIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useShareableUrl } from "@/hooks/useShareableUrl"
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { type Preset } from "@/components/shared/PresetsDrawer"
import { type ExportOption } from "@/components/shared/ExportMenu"
import { HASH_PRESETS } from "./presets"

// ─── MD5 implementation (public domain, RFC 1321) ──────────────────────────

function md5(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const len = bytes.length

  const bitLen = len * 8
  const padLen = ((56 - ((len + 1) % 64)) + 64) % 64
  const padded = new Uint8Array(len + 1 + padLen + 8)
  padded.set(bytes)
  padded[len] = 0x80

  const view = new DataView(padded.buffer)
  view.setUint32(padded.length - 8, bitLen >>> 0, true)
  view.setUint32(padded.length - 4, Math.floor(bitLen / 0x100000000) >>> 0, true)

  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ]

  const T = new Uint32Array(64)
  for (let i = 0; i < 64; i++) {
    T[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) >>> 0
  }

  let a0 = 0x67452301 >>> 0
  let b0 = 0xefcdab89 >>> 0
  let c0 = 0x98badcfe >>> 0
  let d0 = 0x10325476 >>> 0

  const M = new Uint32Array(16)

  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let j = 0; j < 16; j++) {
      M[j] = view.getUint32(offset + j * 4, true)
    }

    let A = a0, B = b0, C = c0, D = d0

    for (let i = 0; i < 64; i++) {
      let F: number, g: number
      if (i < 16) {
        F = (B & C) | (~B & D)
        g = i
      } else if (i < 32) {
        F = (D & B) | (~D & C)
        g = (5 * i + 1) % 16
      } else if (i < 48) {
        F = B ^ C ^ D
        g = (3 * i + 5) % 16
      } else {
        F = C ^ (B | ~D)
        g = (7 * i) % 16
      }

      F = (F + A + T[i] + M[g]) >>> 0
      A = D
      D = C
      C = B
      B = (B + ((F << S[i]) | (F >>> (32 - S[i])))) >>> 0
    }

    a0 = (a0 + A) >>> 0
    b0 = (b0 + B) >>> 0
    c0 = (c0 + C) >>> 0
    d0 = (d0 + D) >>> 0
  }

  function toHex32LE(val: number): string {
    const b = new Uint8Array(4)
    b[0] = val & 0xff
    b[1] = (val >>> 8) & 0xff
    b[2] = (val >>> 16) & 0xff
    b[3] = (val >>> 24) & 0xff
    return Array.from(b)
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
  }

  return toHex32LE(a0) + toHex32LE(b0) + toHex32LE(c0) + toHex32LE(d0)
}

// ─── Hash helpers ───────────────────────────────────────────────────────────

type Algorithm = "MD5" | "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512"

const ALGORITHMS: Algorithm[] = ["MD5", "SHA-1", "SHA-256", "SHA-384", "SHA-512"]

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

async function computeHash(
  algorithm: Algorithm,
  data: ArrayBuffer,
): Promise<string> {
  if (algorithm === "MD5") {
    return md5(data)
  }
  const result = await crypto.subtle.digest(algorithm, data)
  return bufferToHex(result)
}

async function computeAllHashes(
  data: ArrayBuffer,
): Promise<Record<Algorithm, string>> {
  const results = await Promise.all(
    ALGORITHMS.map(async (algo) => [algo, await computeHash(algo, data)] as const),
  )
  return Object.fromEntries(results) as Record<Algorithm, string>
}

// ─── Component ──────────────────────────────────────────────────────────────

const EMPTY_HASHES: Record<Algorithm, string> = {
  "MD5": "",
  "SHA-1": "",
  "SHA-256": "",
  "SHA-384": "",
  "SHA-512": "",
}

export function HashGenerator() {
  const [text, setText] = useLocalStorage<string>("hash-generator-text", "")
  const [file, setFile] = useState<File | null>(null)
  const [hashes, setHashes] = useState<Record<Algorithm, string>>(EMPTY_HASHES)
  const [copiedAlgo, setCopiedAlgo] = useState<Algorithm | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hasInput = text.length > 0 || file !== null

  const { shareUrl } = useShareableUrl("hash-generator", { text }, (restored) => {
    setText((restored as { text: string }).text)
    setFile(null)
  })

  // Compute hashes when text changes
  useEffect(() => {
    if (file) return
    if (text.length === 0) {
      setHashes(EMPTY_HASHES)
      return
    }
    let cancelled = false
    const data = new TextEncoder().encode(text).buffer as ArrayBuffer
    computeAllHashes(data).then((result) => {
      if (!cancelled) setHashes(result)
    })
    return () => {
      cancelled = true
    }
  }, [text, file])

  // Compute hashes when file changes
  useEffect(() => {
    if (!file) return
    let cancelled = false
    file.arrayBuffer().then((data) => {
      computeAllHashes(data).then((result) => {
        if (!cancelled) setHashes(result)
      })
    })
    return () => {
      cancelled = true
    }
  }, [file])

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile)
    setText("")
  }, [setText])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile) handleFileSelect(droppedFile)
    },
    [handleFileSelect],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleCopy = useCallback((algo: Algorithm, value: string) => {
    navigator.clipboard.writeText(value)
    setCopiedAlgo(algo)
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    copyTimeoutRef.current = setTimeout(() => setCopiedAlgo(null), 1500)
  }, [])

  const clearFile = useCallback(() => {
    setFile(null)
    setHashes(EMPTY_HASHES)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [])

  const handlePresetSelect = useCallback((preset: Preset) => {
    setText(preset.content)
    setFile(null)
  }, [setText])

  const allHashesText = ALGORITHMS.map(a => `${a}: ${hashes[a]}`).join("\n")

  const shortcuts: Shortcut[] = useMemo(() => [
    { key: "mod+shift+1", label: "Copy MD5", action: () => handleCopy("MD5", hashes["MD5"]) },
    { key: "mod+shift+2", label: "Copy SHA-256", action: () => handleCopy("SHA-256", hashes["SHA-256"]) },
    { key: "mod+shift+x", label: "Clear file", action: clearFile },
  ], [handleCopy, hashes, clearFile])

  useKeyboardShortcuts(shortcuts)

  const exportOptions: ExportOption[] = useMemo(() => [
    {
      label: "Download all hashes",
      action: () => {
        const blob = new Blob([allHashesText], { type: "text/plain" })
        const a = document.createElement("a")
        a.href = URL.createObjectURL(blob)
        a.download = "hashes.txt"
        a.click()
        URL.revokeObjectURL(a.href)
      },
    },
  ], [allHashesText])

  return (
    <div className="h-full flex flex-col min-h-0">
      <ToolToolbar
        title="Hash Generator"
        copyValue={hashes["SHA-256"] || undefined}
        onShare={shareUrl}
        exportOptions={exportOptions}
        presets={HASH_PRESETS}
        onPresetSelect={handlePresetSelect}
        shortcuts={shortcuts}
      />

      {/* ── Top: Input section ─────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-border p-4 space-y-3">
        {/* Text input */}
        <textarea
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          rows={4}
          placeholder="Enter text to hash..."
          value={text}
          disabled={file !== null}
          onChange={(e) => setText(e.target.value)}
        />

        {/* File drop zone */}
        <div
          className={cn(
            "flex items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-3 text-sm transition-colors cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5 text-primary"
              : "border-border text-muted-foreground hover:border-primary/50",
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFileSelect(f)
            }}
          />
          {file ? (
            <div className="flex items-center gap-2">
              <FileUpIcon className="h-4 w-4 shrink-0" />
              <span className="font-medium truncate max-w-xs">{file.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={(e) => {
                  e.stopPropagation()
                  clearFile()
                }}
              >
                <XIcon className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <>
              <FileUpIcon className="h-4 w-4 shrink-0" />
              <span>Drop a file here or click to browse</span>
            </>
          )}
        </div>
      </div>

      {/* ── Bottom: Hash results ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!hasInput ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Enter text or drop a file to see hashes
          </p>
        ) : (
          ALGORITHMS.map((algo) => (
            <div key={algo} className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                {algo}
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs font-mono break-all select-all">
                  {hashes[algo] || "Computing..."}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  disabled={!hashes[algo]}
                  onClick={() => handleCopy(algo, hashes[algo])}
                >
                  {copiedAlgo === algo ? (
                    <CheckIcon className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <CopyIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
