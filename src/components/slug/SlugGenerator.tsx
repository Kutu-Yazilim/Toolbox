"use client"

import { useMemo, useCallback } from "react"
import { cn } from "@/lib/utils"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useShareableUrl } from "@/hooks/useShareableUrl"
import { useFileImport } from "@/hooks/useFileImport"
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { type Preset } from "@/components/shared/PresetsDrawer"
import { type ExportOption } from "@/components/shared/ExportMenu"
import { SLUG_PRESETS } from "./presets"

// ─── Transliteration map ────────────────────────────────────────────────────

const TRANSLITERATION_MAP: Record<string, string> = {
  // Turkish
  "\u00E7": "c", "\u00C7": "C", "\u011F": "g", "\u011E": "G", "\u0131": "i", "\u0130": "I",
  "\u015F": "s", "\u015E": "S", "\u00F6": "o", "\u00D6": "O", "\u00FC": "u", "\u00DC": "U",
  // German
  "\u00E4": "ae", "\u00C4": "Ae", "\u00DF": "ss",
  // French / Spanish / Portuguese
  "\u00E0": "a", "\u00E2": "a", "\u00E1": "a", "\u00E3": "a", "\u00E5": "a",
  "\u00C0": "A", "\u00C2": "A", "\u00C1": "A", "\u00C3": "A", "\u00C5": "A",
  "\u00E8": "e", "\u00E9": "e", "\u00EA": "e", "\u00EB": "e",
  "\u00C8": "E", "\u00C9": "E", "\u00CA": "E", "\u00CB": "E",
  "\u00EC": "i", "\u00ED": "i", "\u00EE": "i", "\u00EF": "i",
  "\u00CC": "I", "\u00CD": "I", "\u00CE": "I", "\u00CF": "I",
  "\u00F2": "o", "\u00F3": "o", "\u00F4": "o", "\u00F5": "o",
  "\u00D2": "O", "\u00D3": "O", "\u00D4": "O", "\u00D5": "O",
  "\u00F9": "u", "\u00FA": "u", "\u00FB": "u",
  "\u00D9": "U", "\u00DA": "U", "\u00DB": "U",
  "\u00F1": "n", "\u00D1": "N",
  "\u00FD": "y", "\u00FF": "y", "\u00DD": "Y",
  // Polish
  "\u0105": "a", "\u0104": "A", "\u0107": "c", "\u0106": "C", "\u0119": "e", "\u0118": "E",
  "\u0142": "l", "\u0141": "L", "\u0144": "n", "\u0143": "N", "\u015B": "s", "\u015A": "S",
  "\u017A": "z", "\u0179": "Z", "\u017C": "z", "\u017B": "Z",
  // Czech
  "\u010D": "c", "\u010C": "C", "\u010F": "d", "\u010E": "D", "\u011B": "e", "\u011A": "E",
  "\u0148": "n", "\u0147": "N", "\u0159": "r", "\u0158": "R", "\u0161": "s", "\u0160": "S",
  "\u0165": "t", "\u0164": "T", "\u016F": "u", "\u016E": "U", "\u017E": "z", "\u017D": "Z",
  // Scandinavian
  "\u00E6": "ae", "\u00C6": "Ae", "\u00F8": "o", "\u00D8": "O",
  // Romanian
  "\u0103": "a", "\u0102": "A", "\u021B": "t", "\u021A": "T", "\u0219": "s", "\u0218": "S",
} as const

type Separator = "-" | "_"

// ─── Slug function ──────────────────────────────────────────────────────────

function toSlug(text: string, separator: Separator): string {
  let result = ""
  for (const ch of text) {
    result += TRANSLITERATION_MAP[ch] ?? ch
  }

  result = result.toLowerCase()
  result = result.replace(/[^a-z0-9\s\-_]/g, "")
  result = result.replace(/[\s\-_]+/g, separator)
  result = result.replace(new RegExp(`^${separator === "-" ? "\\-" : "_"}+|${separator === "-" ? "\\-" : "_"}+$`, "g"), "")

  return result
}

// ─── Component ──────────────────────────────────────────────────────────────

interface SlugState {
  input: string
  separator: Separator
}

const DEFAULT_STATE: SlugState = {
  input: "",
  separator: "-",
}

export function SlugGenerator() {
  const [state, setState] = useLocalStorage<SlugState>("slug-generator", DEFAULT_STATE)

  const slug = useMemo(() => toSlug(state.input, state.separator), [state.input, state.separator])

  const { shareUrl } = useShareableUrl("slug-generator", state, (restored) => {
    setState(restored)
  })

  const { dropzoneProps, isDragging } = useFileImport({
    accept: [".txt"],
    onImport: (content) => {
      setState(prev => ({ ...prev, input: content }))
    },
  })

  const handleCopy = useCallback(() => {
    if (!slug) return
    navigator.clipboard.writeText(slug)
  }, [slug])

  const handlePresetSelect = useCallback((preset: Preset) => {
    setState(prev => ({ ...prev, input: preset.content }))
  }, [setState])

  const exportOptions: ExportOption[] = useMemo(() => [
    {
      label: "Download slug as .txt",
      action: () => {
        const blob = new Blob([slug], { type: "text/plain" })
        const a = document.createElement("a")
        a.href = URL.createObjectURL(blob)
        a.download = "slug.txt"
        a.click()
        URL.revokeObjectURL(a.href)
      },
    },
  ], [slug])

  const shortcuts: Shortcut[] = useMemo(() => [
    { key: "mod+shift+c", label: "Copy slug", action: handleCopy },
    { key: "mod+shift+s", label: "Toggle separator", action: () => setState(prev => ({ ...prev, separator: prev.separator === "-" ? "_" : "-" })) },
  ], [handleCopy, setState])

  useKeyboardShortcuts(shortcuts)

  return (
    <div className="flex h-full flex-col" {...dropzoneProps}>
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-lg">
          <span className="text-sm font-medium text-primary">Drop text file</span>
        </div>
      )}

      <ToolToolbar
        title="Slug Generator"
        copyValue={slug || undefined}
        onShare={shareUrl}
        exportOptions={exportOptions}
        presets={SLUG_PRESETS}
        onPresetSelect={handlePresetSelect}
        shortcuts={shortcuts}
      />

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
          <button
            onClick={() => setState(prev => ({ ...prev, separator: "-" }))}
            className={cn(
              "rounded px-3 py-1 text-sm font-medium transition-colors",
              state.separator === "-"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            hyphen (-)
          </button>
          <button
            onClick={() => setState(prev => ({ ...prev, separator: "_" }))}
            className={cn(
              "rounded px-3 py-1 text-sm font-medium transition-colors",
              state.separator === "_"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            underscore (_)
          </button>
        </div>
      </div>

      {/* ── Two-panel layout ────────────────────────────────────────── */}
      <div className="grid min-h-0 flex-1 grid-rows-2 gap-3 p-4">
        <textarea
          value={state.input}
          onChange={(e) => setState(prev => ({ ...prev, input: e.target.value }))}
          placeholder="Type or paste text here..."
          spellCheck={false}
          className="w-full resize-none rounded-md border border-border bg-background p-3 font-sans text-sm text-foreground placeholder-muted-foreground outline-none focus:border-muted-foreground"
        />

        <div
          onClick={(e) => {
            const sel = window.getSelection()
            const range = document.createRange()
            range.selectNodeContents(e.currentTarget)
            sel?.removeAllRanges()
            sel?.addRange(range)
          }}
          className={cn(
            "cursor-text overflow-auto rounded-md border border-border bg-background p-3 font-mono text-sm break-all select-all",
            slug ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {slug || "slug-will-appear-here"}
        </div>
      </div>
    </div>
  )
}
