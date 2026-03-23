import { useState, useMemo, useCallback } from "react"
import { CopyIcon, CheckIcon, InfoIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ─── Types & Constants ──────────────────────────────────────────────────────

type PermMatrix = boolean[][]

const ROLES = ["Owner", "Group", "Other"] as const
const PERMS = ["Read", "Write", "Execute"] as const
const PERM_CHARS = ["r", "w", "x"] as const
const PERM_VALUES = [4, 2, 1] as const

type CopiedField = "numeric" | "symbolic" | "command" | null

type Preset = {
  numeric: string
  description: string
  matrix: PermMatrix
}

function numericToMatrix(numeric: string): PermMatrix {
  return numeric.split("").map((digit) => {
    const n = parseInt(digit, 10)
    return [!!(n & 4), !!(n & 2), !!(n & 1)]
  })
}

const PRESETS: Preset[] = [
  { numeric: "644", description: "Default file" },
  { numeric: "755", description: "Default dir / script" },
  { numeric: "700", description: "Owner only" },
  { numeric: "777", description: "Full access" },
  { numeric: "600", description: "Owner read/write" },
  { numeric: "750", description: "Group read/exec" },
  { numeric: "444", description: "Read-only all" },
].map((p) => ({ ...p, matrix: numericToMatrix(p.numeric) }))

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

function matricesEqual(a: PermMatrix, b: PermMatrix): boolean {
  return a.every((row, ri) => row.every((val, ci) => val === b[ri][ci]))
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ChmodCalculator() {
  const [matrix, setMatrix] = useState<PermMatrix>(
    () => DEFAULT_MATRIX.map((row) => [...row]),
  )
  const [copiedField, setCopiedField] = useState<CopiedField>(null)

  const numeric = useMemo(() => toNumeric(matrix), [matrix])
  const symbolic = useMemo(() => toSymbolic(matrix), [matrix])
  const command = useMemo(() => `chmod ${numeric} filename`, [numeric])

  const toggle = useCallback((row: number, col: number) => {
    setMatrix((prev) =>
      prev.map((r, ri) =>
        ri === row ? r.map((v, ci) => (ci === col ? !v : v)) : [...r],
      ),
    )
  }, [])

  const applyPreset = useCallback((preset: Preset) => {
    setMatrix(preset.matrix.map((row) => [...row]))
  }, [])

  const copyToClipboard = useCallback(
    (text: string, field: CopiedField) => {
      navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 1500)
    },
    [],
  )

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* ── Info bar ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-400">
        <InfoIcon className="h-4 w-4 shrink-0" />
        Toggle permissions below or pick a preset
      </div>

      {/* ── Permission grid ────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Role
              </th>
              {PERMS.map((perm) => (
                <th
                  key={perm}
                  className="px-3 py-2 text-center text-xs font-medium text-zinc-500 uppercase tracking-wider"
                >
                  {perm}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROLES.map((role, ri) => (
              <tr key={role} className="border-t border-zinc-800">
                <td className="px-3 py-2 text-sm font-medium text-zinc-300">
                  {role}
                </td>
                {PERMS.map((_, ci) => (
                  <td key={ci} className="px-3 py-2 text-center">
                    <button
                      onClick={() => toggle(ri, ci)}
                      className={cn(
                        "inline-flex h-10 w-14 items-center justify-center rounded-md font-mono text-sm font-semibold transition-colors",
                        matrix[ri][ci]
                          ? "bg-blue-600 text-white hover:bg-blue-500"
                          : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700",
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
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          Common Presets
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => {
            const active = matricesEqual(matrix, preset.matrix)
            return (
              <button
                key={preset.numeric}
                onClick={() => applyPreset(preset)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "border-blue-500 bg-blue-600/20 text-blue-400"
                    : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300",
                )}
              >
                <span className="font-mono">{preset.numeric}</span>
                <span className="ml-1.5 text-xs opacity-70">
                  {preset.description}
                </span>
              </button>
            )
          })}
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
    <div className="flex items-center gap-3 rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2">
      <span className="w-20 shrink-0 text-xs font-medium text-zinc-500 uppercase tracking-wider">
        {label}
      </span>
      <span className="flex-1 font-mono text-sm text-zinc-100">{value}</span>
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
