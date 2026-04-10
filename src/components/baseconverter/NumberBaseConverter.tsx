"use client"

import { useState, useCallback, useMemo } from "react"
import { CopyIcon, CheckIcon, InfoIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useShareableUrl } from "@/hooks/useShareableUrl"
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { type Preset } from "@/components/shared/PresetsDrawer"
import { type ExportOption } from "@/components/shared/ExportMenu"
import { NUMBER_BASE_PRESETS } from "./presets"

type Base = "bin" | "oct" | "dec" | "hex"

const BASE_CONFIG: { id: Base; label: string; radix: number; prefix: string; pattern: RegExp }[] = [
  { id: "bin", label: "Binary", radix: 2, prefix: "0b", pattern: /^[01]*$/ },
  { id: "oct", label: "Octal", radix: 8, prefix: "0o", pattern: /^[0-7]*$/ },
  { id: "dec", label: "Decimal", radix: 10, prefix: "", pattern: /^[0-9]*$/ },
  { id: "hex", label: "Hexadecimal", radix: 16, prefix: "0x", pattern: /^[0-9a-fA-F]*$/ },
]

function parseToBigInt(value: string, base: Base): bigint | null {
  if (!value.trim()) return null
  try {
    switch (base) {
      case "bin": return BigInt("0b" + value)
      case "oct": return BigInt("0o" + value)
      case "dec": return BigInt(value)
      case "hex": return BigInt("0x" + value)
    }
  } catch {
    return null
  }
}

function convertFromBigInt(value: bigint, base: Base): string {
  switch (base) {
    case "bin": return value.toString(2)
    case "oct": return value.toString(8)
    case "dec": return value.toString(10)
    case "hex": return value.toString(16).toUpperCase()
  }
}

function padBinary(bin: string): string {
  const remainder = bin.length % 8
  if (remainder === 0) return bin
  return bin.padStart(bin.length + (8 - remainder), "0")
}

export function NumberBaseConverter() {
  const [values, setValues] = useLocalStorage<Record<Base, string>>("number-base-converter", {
    bin: "",
    oct: "",
    dec: "",
    hex: "",
  })
  const [activeBase, setActiveBase] = useState<Base | null>(null)
  const [copiedField, setCopiedField] = useState<Base | null>(null)

  const { shareUrl } = useShareableUrl("number-base", values, (restored) => {
    setValues(restored)
  })

  const handleChange = useCallback((base: Base, raw: string) => {
    const config = BASE_CONFIG.find((c) => c.id === base)!
    if (!config.pattern.test(raw)) return

    setActiveBase(base)

    if (!raw.trim()) {
      setValues({ bin: "", oct: "", dec: "", hex: "" })
      return
    }

    const bigint = parseToBigInt(raw, base)
    if (bigint === null || bigint < 0n) {
      setValues((prev) => ({ ...prev, [base]: raw }))
      return
    }

    const next: Record<Base, string> = {
      bin: convertFromBigInt(bigint, "bin"),
      oct: convertFromBigInt(bigint, "oct"),
      dec: convertFromBigInt(bigint, "dec"),
      hex: convertFromBigInt(bigint, "hex"),
    }
    next[base] = raw
    setValues(next)
  }, [setValues])

  const handleCopy = useCallback((base: Base) => {
    const val = values[base]
    if (!val) return
    navigator.clipboard.writeText(val)
    setCopiedField(base)
    setTimeout(() => setCopiedField(null), 1500)
  }, [values])

  const handleClear = useCallback(() => {
    setValues({ bin: "", oct: "", dec: "", hex: "" })
    setActiveBase(null)
  }, [setValues])

  const handlePresetSelect = useCallback((preset: Preset) => {
    handleChange("dec", preset.content)
  }, [handleChange])

  const shortcuts: Shortcut[] = useMemo(() => [
    { key: "mod+shift+x", label: "Clear all", action: handleClear },
    { key: "mod+shift+b", label: "Copy binary", action: () => handleCopy("bin") },
    { key: "mod+shift+h", label: "Copy hex", action: () => handleCopy("hex") },
  ], [handleClear, handleCopy])

  useKeyboardShortcuts(shortcuts)

  const allValues = `Binary: ${values.bin}\nOctal: ${values.oct}\nDecimal: ${values.dec}\nHex: ${values.hex}`

  const exportOptions: ExportOption[] = useMemo(() => [
    {
      label: "Download all formats",
      action: () => {
        const blob = new Blob([allValues], { type: "text/plain" })
        const a = document.createElement("a")
        a.href = URL.createObjectURL(blob)
        a.download = "number-conversion.txt"
        a.click()
        URL.revokeObjectURL(a.href)
      },
    },
  ], [allValues])

  const binaryDisplay = values.bin ? padBinary(values.bin) : ""

  return (
    <div className="h-full flex flex-col min-h-0">
      <ToolToolbar
        title="Number Base"
        onShare={shareUrl}
        copyValue={values.dec}
        exportOptions={exportOptions}
        presets={NUMBER_BASE_PRESETS}
        onPresetSelect={handlePresetSelect}
        shortcuts={shortcuts}
      />

      {/* Info bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/20 flex-shrink-0">
        <InfoIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        <span className="text-xs text-muted-foreground">
          Type in any field to convert between number bases.
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Base fields */}
        <div className="grid gap-3">
          {BASE_CONFIG.map((config) => (
            <div key={config.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {config.label}
                  <span className="ml-1.5 text-[10px] opacity-60">
                    (base {config.radix})
                  </span>
                </label>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleCopy(config.id)}
                  disabled={!values[config.id]}
                >
                  {copiedField === config.id ? (
                    <CheckIcon className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <CopyIcon className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <input
                type="text"
                value={values[config.id]}
                onChange={(e) => handleChange(config.id, e.target.value)}
                onFocus={() => setActiveBase(config.id)}
                placeholder={`Enter ${config.label.toLowerCase()} value...`}
                spellCheck={false}
                className={cn(
                  "w-full rounded-md border px-3 py-2 text-sm font-mono bg-background outline-none transition-colors",
                  activeBase === config.id
                    ? "border-primary ring-1 ring-primary/30"
                    : "border-border",
                )}
              />
            </div>
          ))}
        </div>

        {/* Bit visualization */}
        {binaryDisplay && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Bit Visualization
            </h3>
            <div className="rounded-md border border-border bg-muted/20 p-3">
              <div className="flex flex-wrap gap-y-2">
                {Array.from(binaryDisplay).map((bit, i) => {
                  const isGroupStart = i % 8 === 0 && i > 0
                  return (
                    <div
                      key={i}
                      className={cn("flex flex-col items-center", isGroupStart && "ml-3")}
                    >
                      <div
                        className={cn(
                          "w-6 h-6 rounded-sm flex items-center justify-center text-[10px] font-mono font-bold transition-colors",
                          bit === "1"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {bit}
                      </div>
                      {i % 8 === 0 && (
                        <span className="text-[9px] text-muted-foreground mt-1 opacity-60">
                          {binaryDisplay.length - 1 - i}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="mt-2 flex gap-3 text-[10px] text-muted-foreground">
                <span>{binaryDisplay.length} bits</span>
                <span>{binaryDisplay.length / 8} bytes</span>
                <span>
                  {Math.floor(binaryDisplay.length / 8)} group{Math.floor(binaryDisplay.length / 8) !== 1 ? "s" : ""} of 8
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
