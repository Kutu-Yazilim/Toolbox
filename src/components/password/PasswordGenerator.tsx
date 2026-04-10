"use client"

import { useState, useCallback, useMemo } from "react"
import {
  CopyIcon,
  CheckIcon,
  Trash2Icon,
  RefreshCwIcon,
  ZapIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { type Preset } from "@/components/shared/PresetsDrawer"
import { type ExportOption } from "@/components/shared/ExportMenu"
import { PASSWORD_PRESETS } from "./passwordPresets"

// ─── Types & constants ──────────────────────────────────────────────────────

type Mode = "password" | "passphrase"

type StrengthLevel = "Weak" | "Moderate" | "Strong" | "Very Strong"

const LOWERCASE = "abcdefghijklmnopqrstuvwxyz"
const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const NUMBERS = "0123456789"
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?"
const AMBIGUOUS = "0Oo1lI"

const WORD_LIST = [
  "apple", "brave", "coral", "delta", "eagle", "flame", "grape", "house",
  "ivory", "juice", "knack", "lemon", "mango", "noble", "ocean", "piano",
  "quilt", "river", "storm", "tiger", "ultra", "vivid", "whale", "xenon",
  "yield", "zebra", "amber", "blaze", "crisp", "drift", "ember", "frost",
  "gleam", "haven", "inbox", "jewel", "karma", "lunar", "maple", "nexus",
  "olive", "plumb", "quest", "ridge", "solar", "thorn", "unity", "vapor",
  "wrist", "yacht", "zonal", "acorn", "bloom", "charm", "dwell", "flint",
  "grove", "haste", "irony", "joker",
]

const BULK_COUNT = 10

// ─── Helpers ────────────────────────────────────────────────────────────────

function secureRandom(max: number): number {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return array[0] % max
}

function generatePassword(
  length: number,
  useLowercase: boolean,
  useUppercase: boolean,
  useNumbers: boolean,
  useSymbols: boolean,
  excludeAmbiguous: boolean,
): string {
  let charset = ""
  if (useLowercase) charset += LOWERCASE
  if (useUppercase) charset += UPPERCASE
  if (useNumbers) charset += NUMBERS
  if (useSymbols) charset += SYMBOLS

  if (charset.length === 0) charset = LOWERCASE

  if (excludeAmbiguous) {
    charset = charset
      .split("")
      .filter((c) => !AMBIGUOUS.includes(c))
      .join("")
  }

  let result = ""
  for (let i = 0; i < length; i++) {
    result += charset[secureRandom(charset.length)]
  }
  return result
}

function generatePassphrase(wordCount: number, separator: string): string {
  const words: string[] = []
  for (let i = 0; i < wordCount; i++) {
    words.push(WORD_LIST[secureRandom(WORD_LIST.length)])
  }
  return words.join(separator)
}

function calcStrength(value: string): { score: number; level: StrengthLevel } {
  let score = 0

  // Length contribution
  if (value.length >= 8) score += 1
  if (value.length >= 12) score += 1
  if (value.length >= 20) score += 1
  if (value.length >= 32) score += 1

  // Character diversity
  if (/[a-z]/.test(value)) score += 1
  if (/[A-Z]/.test(value)) score += 1
  if (/[0-9]/.test(value)) score += 1
  if (/[^a-zA-Z0-9]/.test(value)) score += 1

  let level: StrengthLevel
  if (score <= 2) level = "Weak"
  else if (score <= 4) level = "Moderate"
  else if (score <= 6) level = "Strong"
  else level = "Very Strong"

  // Normalize score to 0-100
  const normalized = Math.min(100, Math.round((score / 8) * 100))
  return { score: normalized, level }
}

const STRENGTH_COLORS: Record<StrengthLevel, string> = {
  Weak: "bg-red-500",
  Moderate: "bg-yellow-500",
  Strong: "bg-green-500",
  "Very Strong": "bg-emerald-400",
}

// ─── Component ──────────────────────────────────────────────────────────────

export function PasswordGenerator() {
  const [mode, setMode] = useState<Mode>("password")

  // Password mode state
  const [length, setLength] = useLocalStorage("pw-length", 16)
  const [useLowercase, setUseLowercase] = useLocalStorage("pw-lower", true)
  const [useUppercase, setUseUppercase] = useLocalStorage("pw-upper", true)
  const [useNumbers, setUseNumbers] = useLocalStorage("pw-numbers", true)
  const [useSymbols, setUseSymbols] = useLocalStorage("pw-symbols", true)
  const [excludeAmbiguous, setExcludeAmbiguous] = useLocalStorage("pw-no-ambig", false)

  // Passphrase mode state
  const [wordCount, setWordCount] = useLocalStorage("pw-words", 4)
  const [separator, setSeparator] = useLocalStorage("pw-sep", "-")

  // Results
  const [results, setResults] = useState<string[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const generateOne = useCallback((): string => {
    if (mode === "password") {
      return generatePassword(length, useLowercase, useUppercase, useNumbers, useSymbols, excludeAmbiguous)
    }
    return generatePassphrase(wordCount, separator)
  }, [mode, length, useLowercase, useUppercase, useNumbers, useSymbols, excludeAmbiguous, wordCount, separator])

  const handleGenerate = useCallback(() => {
    setResults([generateOne()])
    setCopiedIndex(null)
  }, [generateOne])

  const handleBulk = useCallback(() => {
    const bulk: string[] = []
    for (let i = 0; i < BULK_COUNT; i++) {
      bulk.push(generateOne())
    }
    setResults(bulk)
    setCopiedIndex(null)
  }, [generateOne])

  const handleClear = useCallback(() => {
    setResults([])
    setCopiedIndex(null)
  }, [])

  const copyOne = useCallback((value: string, index: number) => {
    navigator.clipboard.writeText(value)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 1500)
  }, [])

  const handlePresetSelect = useCallback((preset: Preset) => {
    const config = JSON.parse(preset.content)
    if (config.mode === "password") {
      setMode("password")
      setLength(config.length)
      setUseLowercase(config.lower)
      setUseUppercase(config.upper)
      setUseNumbers(config.numbers)
      setUseSymbols(config.symbols)
      setExcludeAmbiguous(config.noAmbiguous)
    } else {
      setMode("passphrase")
      setWordCount(config.wordCount)
      setSeparator(config.separator)
    }
  }, [setLength, setUseLowercase, setUseUppercase, setUseNumbers, setUseSymbols, setExcludeAmbiguous, setWordCount, setSeparator])

  const exportOptions = useMemo<ExportOption[]>(() => [
    { label: "Copy All", action: () => navigator.clipboard.writeText(results.join("\n")) },
    { label: "Download .txt", action: () => {
      const blob = new Blob([results.join("\n")], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url; a.download = "passwords.txt"; a.click()
      URL.revokeObjectURL(url)
    }},
  ], [results])

  const shortcuts = useMemo<Shortcut[]>(() => [
    { key: "mod+g", label: "Generate", action: handleGenerate },
    { key: "mod+shift+g", label: "Bulk Generate", action: handleBulk },
    { key: "mod+shift+c", label: "Copy All", action: () => navigator.clipboard.writeText(results.join("\n")) },
  ], [handleGenerate, handleBulk, results])

  useKeyboardShortcuts(shortcuts)

  return (
    <div className="h-full flex flex-col min-h-0">
      <ToolToolbar
        title="Password Generator"
        status={results.length > 0 ? { type: "info", label: `${results.length} generated` } : null}
        copyValue={results.length === 1 ? results[0] : undefined}
        exportOptions={results.length > 0 ? exportOptions : undefined}
        presets={PASSWORD_PRESETS}
        onPresetSelect={handlePresetSelect}
        shortcuts={shortcuts}
      />
      {/* Header bar */}
      <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
        {/* Mode toggle */}
        <div className="flex items-center gap-1.5 rounded-lg border bg-muted/40 p-1">
          {(["password", "passphrase"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                mode === m
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Password mode controls */}
        {mode === "password" && (
          <>
            {/* Length slider */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Length:</span>
              <input
                type="range"
                min={4}
                max={128}
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className="w-24 accent-primary"
              />
              <span className="text-xs font-mono w-7 text-right">{length}</span>
            </div>

            {/* Character set toggles */}
            <div className="flex items-center gap-1.5">
              {[
                { label: "a-z", active: useLowercase, toggle: () => setUseLowercase((p) => !p) },
                { label: "A-Z", active: useUppercase, toggle: () => setUseUppercase((p) => !p) },
                { label: "0-9", active: useNumbers, toggle: () => setUseNumbers((p) => !p) },
                { label: "!@#", active: useSymbols, toggle: () => setUseSymbols((p) => !p) },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={opt.toggle}
                  className={cn(
                    "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                    opt.active
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-transparent bg-muted/40 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Exclude ambiguous */}
            <button
              onClick={() => setExcludeAmbiguous((p) => !p)}
              className={cn(
                "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                excludeAmbiguous
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-transparent bg-muted/40 text-muted-foreground hover:text-foreground",
              )}
            >
              No Ambiguous
            </button>
          </>
        )}

        {/* Passphrase mode controls */}
        {mode === "passphrase" && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Words:</span>
              <input
                type="number"
                min={3}
                max={10}
                value={wordCount}
                onChange={(e) => setWordCount(Math.min(10, Math.max(3, Number(e.target.value))))}
                className="w-14 rounded-md border bg-muted/40 px-2 py-1.5 text-xs text-center"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Separator:</span>
              <input
                type="text"
                maxLength={2}
                value={separator}
                onChange={(e) => setSeparator(e.target.value)}
                className="w-10 rounded-md border bg-muted/40 px-2 py-1.5 text-xs text-center font-mono"
              />
            </div>
          </>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 ml-auto">
          <Button onClick={handleGenerate} size="sm">
            <RefreshCwIcon className="size-3.5" />
            Generate
          </Button>
          <Button onClick={handleBulk} variant="outline" size="sm">
            <ZapIcon className="size-3.5" />
            Bulk (10)
          </Button>
          {results.length > 0 && (
            <Button onClick={handleClear} variant="ghost" size="sm">
              <Trash2Icon className="size-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-4">
        {results.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            Click Generate to create passwords
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {results.map((value, i) => {
              const strength = calcStrength(value)
              return (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="group flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-2.5 font-mono text-sm hover:bg-muted/50 transition-colors">
                    <span className="text-muted-foreground text-xs w-8 text-right shrink-0">
                      {i + 1}
                    </span>
                    <span className="flex-1 select-all break-all">{value}</span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => copyOne(value, i)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    >
                      {copiedIndex === i ? (
                        <CheckIcon className="size-3" />
                      ) : (
                        <CopyIcon className="size-3" />
                      )}
                    </Button>
                  </div>
                  {/* Strength meter */}
                  <div className="flex items-center gap-2 pl-12">
                    <div className="h-1.5 flex-1 max-w-48 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", STRENGTH_COLORS[strength.level])}
                        style={{ width: `${strength.score}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">{strength.level}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
