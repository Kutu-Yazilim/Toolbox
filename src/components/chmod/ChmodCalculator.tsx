"use client"

import { useState, useMemo, useCallback } from "react"
import { CopyIcon, CheckIcon, InfoIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useShareableUrl } from "@/hooks/useShareableUrl"
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { type Preset } from "@/components/shared/PresetsDrawer"
import { type ExportOption } from "@/components/shared/ExportMenu"
import { CHMOD_PRESETS } from "./chmodPresets"

// ─── Types & Constants ──────────────────────────────────────────────────────

type PermMatrix = boolean[][]

const ROLES = ["Owner", "Group", "Other"] as const
const PERMS = ["Read", "Write", "Execute"] as const
const PERM_CHARS = ["r", "w", "x"] as const
const PERM_VALUES = [4, 2, 1] as const

type CopiedField = "numeric" | "symbolic" | "command" | null

function numericToMatrix(numeric: string): PermMatrix {
  return numeric.split("").map((digit) => {
    const n = parseInt(digit, 10)
    return [!!(n & 4), !!(n & 2), !!(n & 1)]
  })
}

const DEFAULT_MATRIX = numericToMatrix("755")

// ─── Helpers ────────────────────────────────────────────────────────────────

function toNumeric(matrix: PermMatrix): string {
  return matrix
    .map((row) =>
      row.reduce((sum, on, i) => sum + (on ? PERM_VALUES[i] : 0), 0),
    )
    .join("")
}

function toSymbolic(matrix: PermMatrix): string {
  return matrix
    .map((row) =>
      row.map((on, i) => (on ? PERM_CHARS[i] : "-")).join(""),
    )
    .join("")
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ChmodCalculator() {
  const [stored, setStored] = useLocalStorage("chmod-calculator", { numeric: "755" })
  const [matrix, setMatrix] = useState<PermMatrix>(
    () => numericToMatrix(stored.numeric).map((row) => [...row]),
  )
  const [copiedField, setCopiedField] = useState<CopiedField>(null)

  const numeric = useMemo(() => toNumeric(matrix), [matrix])
  const symbolic = useMemo(() => toSymbolic(matrix), [matrix])
  const command = useMemo(() => `chmod ${numeric} filename`, [numeric])

  const { shareUrl } = useShareableUrl("chmod-calculator", { numeric }, (restored) => {
    const m = numericToMatrix(restored.numeric)
    setMatrix(m.map((row) => [...row]))
    setStored({ numeric: restored.numeric })
  })

  const toggle = useCallback((row: number, col: number) => {
    setMatrix((prev) => {
      const next = prev.map((r, ri) =>
        ri === row ? r.map((v, ci) => (ci === col ? !v : v)) : [...r],
      )
      setStored({ numeric: toNumeric(next) })
      return next
    })
  }, [setStored])

  const applyNumeric = useCallback((num: string) => {
    const m = numericToMatrix(num)
    setMatrix(m.map((row) => [...row]))
    setStored({ numeric: num })
  }, [setStored])

  const handlePresetSelect = useCallback((preset: Preset) => {
    applyNumeric(preset.content)
  }, [applyNumeric])

  const copyToClipboard = useCallback(
    (text: string, field: CopiedField) => {
      navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 1500)
    },
    [],
  )

  const handleDownload = useCallback(() => {
    const content = `# Chmod: ${numeric}\n# Symbolic: ${symbolic}\n# Command: ${command}\n`
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "chmod.txt"
    a.click()
    URL.revokeObjectURL(url)
  }, [numeric, symbolic, command])

  const exportOptions: ExportOption[] = useMemo(() => [
    { label: "Download chmod info", action: handleDownload },
  ], [handleDownload])

  const shortcuts: Shortcut[] = useMemo(() => [
    { key: "mod+shift+c", label: "Copy command", action: () => copyToClipboard(command, "command") },
    { key: "mod+shift+n", label: "Copy numeric", action: () => copyToClipboard(numeric, "numeric") },
  ], [command, numeric, copyToClipboard])

  useKeyboardShortcuts(shortcuts)

  return (
    <div className="flex h-full flex-col">
      <ToolToolbar
        title="Chmod Calculator"
        status={{ type: "info", label: numeric }}
        copyValue={command}
        onShare={shareUrl}
        exportOptions={exportOptions}
        presets={CHMOD_PRESETS}
        onPresetSelect={handlePresetSelect}
        shortcuts={shortcuts}
      />

      <div className="flex flex-col gap-4 p-4 overflow-y-auto">
        {/* ── Info bar ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
          <InfoIcon className="h-4 w-4 shrink-0" />
          Toggle permissions below or pick a preset
        </div>

        {/* ── Permission grid ────────────────────────────────────────── */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Role
                </th>
                {PERMS.map((perm) => (
                  <th
                    key={perm}
                    className="px-3 py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    {perm}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROLES.map((role, ri) => (
                <tr key={role} className="border-t border-border">
                  <td className="px-3 py-2 text-sm font-medium text-foreground">
                    {role}
                  </td>
                  {PERMS.map((_, ci) => (
                    <td key={ci} className="px-3 py-2 text-center">
                      <button
                        onClick={() => toggle(ri, ci)}
                        className={cn(
                          "inline-flex h-10 w-14 items-center justify-center rounded-md font-mono text-sm font-semibold transition-colors",
                          matrix[ri][ci]
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "bg-muted text-muted-foreground hover:bg-muted/80",
                        )}
                      >
                        {matrix[ri][ci] ? PERM_CHARS[ci] : "-"}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Output section ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <OutputRow
            label="Numeric"
            value={numeric}
            copied={copiedField === "numeric"}
            onCopy={() => copyToClipboard(numeric, "numeric")}
          />
          <OutputRow
            label="Symbolic"
            value={symbolic}
            copied={copiedField === "symbolic"}
            onCopy={() => copyToClipboard(symbolic, "symbolic")}
          />
          <OutputRow
            label="Command"
            value={command}
            copied={copiedField === "command"}
            onCopy={() => copyToClipboard(command, "command")}
          />
        </div>

        {/* ── Presets section ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Common Presets
          </span>
          <div className="flex flex-wrap gap-2">
            {CHMOD_PRESETS.map((preset) => {
              const active = numeric === preset.content
              return (
                <button
                  key={preset.content}
                  onClick={() => applyNumeric(preset.content)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "border-primary ring-primary bg-primary/10 text-primary"
                      : "border-border bg-muted text-muted-foreground hover:border-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="font-mono">{preset.content}</span>
                  <span className="ml-1.5 text-xs opacity-70">
                    {preset.description}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Output Row ─────────────────────────────────────────────────────────────

function OutputRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string
  value: string
  copied: boolean
  onCopy: () => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-muted/20 px-3 py-2">
      <span className="w-20 shrink-0 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span className="flex-1 font-mono text-sm text-foreground">{value}</span>
      <Button variant="ghost" size="sm" onClick={onCopy} className="h-7 w-7 p-0">
        {copied ? (
          <CheckIcon className="h-3.5 w-3.5 text-green-400" />
        ) : (
          <CopyIcon className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  )
}
