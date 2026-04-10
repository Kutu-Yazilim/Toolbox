"use client"

import { useState, useMemo, useCallback } from "react"
import { ArrowRightLeftIcon, CopyIcon, CheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useShareableUrl } from "@/hooks/useShareableUrl"
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { type Preset } from "@/components/shared/PresetsDrawer"
import { type ExportOption } from "@/components/shared/ExportMenu"
import { UNIT_CONVERTER_PRESETS } from "./presets"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CategoryId = "length" | "weight" | "temperature" | "data" | "time" | "speed"

type UnitDef = {
  id: string
  label: string
  toBase: (v: number) => number
  fromBase: (v: number) => number
}

type Category = {
  id: CategoryId
  label: string
  units: UnitDef[]
}

// ---------------------------------------------------------------------------
// Helpers to build linear unit defs
// ---------------------------------------------------------------------------

function linear(id: string, label: string, factor: number): UnitDef {
  return { id, label, toBase: (v) => v * factor, fromBase: (v) => v / factor }
}

// ---------------------------------------------------------------------------
// Categories & units
// ---------------------------------------------------------------------------

const CATEGORIES: Category[] = [
  {
    id: "length",
    label: "Length",
    units: [
      linear("m", "Meter (m)", 1),
      linear("km", "Kilometer (km)", 1000),
      linear("cm", "Centimeter (cm)", 0.01),
      linear("mm", "Millimeter (mm)", 0.001),
      linear("mi", "Mile (mi)", 1609.344),
      linear("yd", "Yard (yd)", 0.9144),
      linear("ft", "Foot (ft)", 0.3048),
      linear("in", "Inch (in)", 0.0254),
    ],
  },
  {
    id: "weight",
    label: "Weight",
    units: [
      linear("kg", "Kilogram (kg)", 1),
      linear("g", "Gram (g)", 0.001),
      linear("mg", "Milligram (mg)", 0.000001),
      linear("lb", "Pound (lb)", 0.45359237),
      linear("oz", "Ounce (oz)", 0.028349523125),
      linear("t", "Metric Ton (t)", 1000),
    ],
  },
  {
    id: "temperature",
    label: "Temperature",
    units: [
      {
        id: "c",
        label: "Celsius (\u00B0C)",
        toBase: (v) => v,
        fromBase: (v) => v,
      },
      {
        id: "f",
        label: "Fahrenheit (\u00B0F)",
        toBase: (v) => ((v - 32) * 5) / 9,
        fromBase: (v) => (v * 9) / 5 + 32,
      },
      {
        id: "k",
        label: "Kelvin (K)",
        toBase: (v) => v - 273.15,
        fromBase: (v) => v + 273.15,
      },
    ],
  },
  {
    id: "data",
    label: "Data Size",
    units: [
      linear("B", "Byte (B)", 1),
      linear("KB", "Kilobyte (KB)", 1024),
      linear("MB", "Megabyte (MB)", 1024 ** 2),
      linear("GB", "Gigabyte (GB)", 1024 ** 3),
      linear("TB", "Terabyte (TB)", 1024 ** 4),
    ],
  },
  {
    id: "time",
    label: "Time",
    units: [
      linear("ms", "Millisecond (ms)", 0.001),
      linear("s", "Second (s)", 1),
      linear("min", "Minute (min)", 60),
      linear("h", "Hour (h)", 3600),
      linear("d", "Day (d)", 86400),
      linear("w", "Week (w)", 604800),
    ],
  },
  {
    id: "speed",
    label: "Speed",
    units: [
      linear("m/s", "m/s", 1),
      linear("km/h", "km/h", 1 / 3.6),
      linear("mph", "mph", 0.44704),
      linear("knots", "Knots", 0.514444),
    ],
  },
]

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

function formatResult(value: number): string {
  if (!Number.isFinite(value)) return "Invalid"
  if (value === 0) return "0"
  const abs = Math.abs(value)
  if (abs > 1e15 || (abs !== 0 && abs < 1e-10)) {
    return value.toExponential(6)
  }
  return parseFloat(value.toPrecision(10)).toString()
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface UnitConverterState {
  categoryId: CategoryId
  fromUnitId: string
  toUnitId: string
  inputValue: string
}

const DEFAULT_STATE: UnitConverterState = {
  categoryId: "length",
  fromUnitId: "",
  toUnitId: "",
  inputValue: "1",
}

export function UnitConverter() {
  const [state, setState] = useLocalStorage<UnitConverterState>("unit-converter", DEFAULT_STATE)
  const [copied, setCopied] = useState(false)

  const { shareUrl } = useShareableUrl("unit-converter", state, (restored) => {
    setState(restored)
  })

  const category = useMemo(
    () => CATEGORIES.find((c) => c.id === state.categoryId)!,
    [state.categoryId],
  )

  const fromUnit = useMemo(() => {
    const found = category.units.find((u) => u.id === state.fromUnitId)
    return found ?? category.units[0]
  }, [category, state.fromUnitId])

  const toUnit = useMemo(() => {
    const found = category.units.find((u) => u.id === state.toUnitId)
    return found ?? category.units[1]
  }, [category, state.toUnitId])

  const result = useMemo(() => {
    const num = parseFloat(state.inputValue)
    if (Number.isNaN(num)) return ""
    const base = fromUnit.toBase(num)
    return formatResult(toUnit.fromBase(base))
  }, [state.inputValue, fromUnit, toUnit])

  const handleCategoryChange = useCallback((id: CategoryId) => {
    setState(prev => ({ ...prev, categoryId: id, fromUnitId: "", toUnitId: "", inputValue: "1" }))
    setCopied(false)
  }, [setState])

  const handleSwap = useCallback(() => {
    setState(prev => ({
      ...prev,
      fromUnitId: toUnit.id,
      toUnitId: fromUnit.id,
      inputValue: result || "1",
    }))
    setCopied(false)
  }, [setState, fromUnit, toUnit, result])

  const handleCopy = useCallback(() => {
    if (!result) return
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [result])

  const handlePresetSelect = useCallback((preset: Preset) => {
    const data = JSON.parse(preset.content)
    setState({
      categoryId: data.category,
      fromUnitId: data.from,
      toUnitId: data.to,
      inputValue: data.value,
    })
    setCopied(false)
  }, [setState])

  const shortcuts: Shortcut[] = useMemo(() => [
    { key: "mod+shift+s", label: "Swap units", action: handleSwap },
    { key: "mod+shift+c", label: "Copy result", action: handleCopy },
  ], [handleSwap, handleCopy])

  useKeyboardShortcuts(shortcuts)

  const conversionText = result && state.inputValue
    ? `${state.inputValue} ${fromUnit.id} = ${result} ${toUnit.id}`
    : ""

  const exportOptions: ExportOption[] = useMemo(() => [
    {
      label: "Download conversion",
      action: () => {
        const blob = new Blob([conversionText], { type: "text/plain" })
        const a = document.createElement("a")
        a.href = URL.createObjectURL(blob)
        a.download = "unit-conversion.txt"
        a.click()
        URL.revokeObjectURL(a.href)
      },
    },
  ], [conversionText])

  return (
    <div className="h-full flex flex-col min-h-0">
      <ToolToolbar
        title="Unit Converter"
        copyValue={result}
        onShare={shareUrl}
        exportOptions={exportOptions}
        presets={UNIT_CONVERTER_PRESETS}
        onPresetSelect={handlePresetSelect}
        shortcuts={shortcuts}
      />

      <div className="mx-auto w-full max-w-2xl space-y-6 p-4">
        {/* Category tabs */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              variant={cat.id === state.categoryId ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryChange(cat.id)}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Converter card */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-4">
            {/* From column */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">From</label>
              <select
                value={fromUnit.id}
                onChange={(e) => {
                  setState(prev => ({ ...prev, fromUnitId: e.target.value }))
                  setCopied(false)
                }}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {category.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={state.inputValue}
                onChange={(e) => {
                  setState(prev => ({ ...prev, inputValue: e.target.value }))
                  setCopied(false)
                }}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter value"
              />
            </div>

            {/* Swap button */}
            <div className="flex items-center pb-1">
              <Button variant="ghost" size="icon" onClick={handleSwap} title="Swap units">
                <ArrowRightLeftIcon className="h-4 w-4" />
              </Button>
            </div>

            {/* To column */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">To</label>
              <select
                value={toUnit.id}
                onChange={(e) => {
                  setState(prev => ({ ...prev, toUnitId: e.target.value }))
                  setCopied(false)
                }}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {category.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex-1 rounded-md border border-input bg-muted px-3 py-2 text-sm font-mono",
                    !result && "text-muted-foreground",
                  )}
                >
                  {result || "\u2014"}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopy}
                  disabled={!result}
                  title="Copy result"
                >
                  {copied ? (
                    <CheckIcon className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <CopyIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Conversion summary */}
          {conversionText && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {conversionText}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
