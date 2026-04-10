"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { CheckIcon, ClockIcon, CopyIcon } from "lucide-react"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { DatePickerPopover } from "@/components/timestamp/DatePickerPopover"
import { DurationCalculator } from "@/components/timestamp/DurationCalculator"
import { TimezoneCompare } from "@/components/timestamp/TimezoneCompare"
import { TIMESTAMP_PRESETS } from "@/components/timestamp/timestampPresets"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useShareableUrl } from "@/hooks/useShareableUrl"
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts"
import { type Preset } from "@/components/shared/PresetsDrawer"
import { type ExportOption } from "@/components/shared/ExportMenu"

const STORAGE_KEY = "kutu-timestamp"
const TOOL_ID = "timestamp"

const QUICK_OFFSETS = [
    { label: "Now", offset: 0 },
    { label: "-1h", offset: -3600 },
    { label: "+1h", offset: 3600 },
    { label: "-1d", offset: -86400 },
    { label: "+1d", offset: 86400 },
    { label: "-1w", offset: -604800 },
    { label: "+1w", offset: 604800 },
    { label: "Epoch", offset: "epoch" as const },
] as const

const QUICK_SNAP = [
    { label: "Start of day", snap: "startOfDay" },
    { label: "End of day", snap: "endOfDay" },
    { label: "Start of month", snap: "startOfMonth" },
    { label: "End of month", snap: "endOfMonth" },
] as const

const COPY_FEEDBACK_DURATION = 2000

function formatRelative(date: Date, now: Date): string {
    const diff = date.getTime() - now.getTime()
    const absDiff = Math.abs(diff)
    const seconds = Math.floor(absDiff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    const weeks = Math.floor(days / 7)
    const months = Math.floor(days / 30)
    const years = Math.floor(days / 365)

    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })
    if (years > 0) return rtf.format(diff > 0 ? years : -years, "year")
    if (months > 0) return rtf.format(diff > 0 ? months : -months, "month")
    if (weeks > 0) return rtf.format(diff > 0 ? weeks : -weeks, "week")
    if (days > 0) return rtf.format(diff > 0 ? days : -days, "day")
    if (hours > 0) return rtf.format(diff > 0 ? hours : -hours, "hour")
    if (minutes > 0) return rtf.format(diff > 0 ? minutes : -minutes, "minute")
    return rtf.format(diff > 0 ? seconds : -seconds, "second")
}

function getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0)
    return Math.floor((date.getTime() - start.getTime()) / 86400000)
}

function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

function parseInput(value: string): Date | null {
    if (!value.trim()) return null
    const trimmed = value.trim()

    if (/^\d+$/.test(trimmed)) {
        const num = parseInt(trimmed, 10)
        const d = trimmed.length >= 13 ? new Date(num) : new Date(num * 1000)
        return isNaN(d.getTime()) ? null : d
    }

    if (/^-\d+$/.test(trimmed)) {
        const num = parseInt(trimmed, 10)
        const d = trimmed.length >= 14 ? new Date(num) : new Date(num * 1000)
        return isNaN(d.getTime()) ? null : d
    }

    const d = new Date(trimmed)
    return isNaN(d.getTime()) ? null : d
}

function snapTimestamp(snap: string, referenceDate: Date): number {
    const d = new Date(referenceDate)
    switch (snap) {
        case "startOfDay":
            d.setHours(0, 0, 0, 0)
            break
        case "endOfDay":
            d.setHours(23, 59, 59, 999)
            break
        case "startOfMonth":
            d.setDate(1)
            d.setHours(0, 0, 0, 0)
            break
        case "endOfMonth":
            d.setMonth(d.getMonth() + 1, 0)
            d.setHours(23, 59, 59, 999)
            break
    }
    return Math.floor(d.getTime() / 1000)
}

function formatRfc2822(date: Date): string {
    return date.toUTCString().replace("GMT", "+0000")
}

function formatCustom(date: Date): string {
    const y = date.getFullYear()
    const mo = (date.getMonth() + 1).toString().padStart(2, "0")
    const d = date.getDate().toString().padStart(2, "0")
    const h = date.getHours().toString().padStart(2, "0")
    const mi = date.getMinutes().toString().padStart(2, "0")
    const s = date.getSeconds().toString().padStart(2, "0")
    return `${y}-${mo}-${d} ${h}:${mi}:${s}`
}

interface FormatEntry {
    label: string
    value: string
}

function buildFormats(date: Date, now: Date): FormatEntry[] {
    const unixSec = Math.floor(date.getTime() / 1000)
    return [
        { label: "Unix (seconds)", value: unixSec.toString() },
        { label: "Unix (milliseconds)", value: date.getTime().toString() },
        { label: "ISO 8601", value: date.toISOString() },
        { label: "UTC", value: date.toUTCString() },
        { label: "RFC 2822", value: formatRfc2822(date) },
        { label: "Local", value: date.toLocaleString() },
        { label: "Custom (YYYY-MM-DD HH:mm:ss)", value: formatCustom(date) },
        { label: "Relative", value: formatRelative(date, now) },
        { label: "Day of week", value: date.toLocaleDateString("en-US", { weekday: "long" }) },
        { label: "Week number", value: `Week ${getWeekNumber(date)}` },
        { label: "Day of year", value: `Day ${getDayOfYear(date)} of ${date.getFullYear()}` },
    ]
}

function buildAllFormatsText(formats: FormatEntry[]): string {
    return formats.map(f => `${f.label}: ${f.value}`).join("\n")
}

interface TimestampState {
    input: string
}

export function TimestampConverter() {
    const [storedState, setStoredState] = useLocalStorage<TimestampState>(STORAGE_KEY, { input: "" })
    const [input, setInput] = useState(storedState.input)
    const [now, setNow] = useState(new Date())
    const [copiedField, setCopiedField] = useState<string | null>(null)

    // Sync to localStorage
    useEffect(() => {
        setStoredState({ input })
    }, [input, setStoredState])

    // Live clock
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(interval)
    }, [])

    const parsedDate = useMemo(() => parseInput(input), [input])
    const currentTimestampSeconds = useMemo(
        () => parsedDate ? Math.floor(parsedDate.getTime() / 1000) : null,
        [parsedDate],
    )

    const formats = useMemo(() => {
        if (!parsedDate) return null
        return buildFormats(parsedDate, now)
    }, [parsedDate, now])

    const allFormatsText = useMemo(() => {
        if (!formats) return ""
        return buildAllFormatsText(formats)
    }, [formats])

    const handleQuickOffset = useCallback((offset: number | "epoch") => {
        if (offset === "epoch") {
            setInput("0")
            return
        }
        setInput((Math.floor(Date.now() / 1000) + offset).toString())
    }, [])

    const handleSnap = useCallback((snap: string) => {
        const ref = parsedDate ?? new Date()
        setInput(snapTimestamp(snap, ref).toString())
    }, [parsedDate])

    const handleDatePick = useCallback((timestamp: number) => {
        setInput(timestamp.toString())
    }, [])

    const handleSetNow = useCallback(() => {
        setInput(Math.floor(Date.now() / 1000).toString())
    }, [])

    const copyToClipboard = useCallback(async (text: string, field: string) => {
        await navigator.clipboard.writeText(text)
        setCopiedField(field)
        setTimeout(() => setCopiedField(null), COPY_FEEDBACK_DURATION)
    }, [])

    const handleRowClick = useCallback((value: string, label: string) => {
        copyToClipboard(value, label)
    }, [copyToClipboard])

    const handlePresetSelect = useCallback((preset: Preset) => {
        setInput(preset.content)
    }, [])

    // Restore from shareable URL
    const handleRestore = useCallback((state: TimestampState) => {
        setInput(state.input)
    }, [])

    const { shareUrl } = useShareableUrl<TimestampState>(
        TOOL_ID,
        { input },
        handleRestore,
    )

    const shortcuts: Shortcut[] = useMemo(() => [
        { key: "mod+n", label: "Set to now", action: handleSetNow },
    ], [handleSetNow])

    useKeyboardShortcuts(shortcuts)

    const exportOptions: ExportOption[] = useMemo(() => [
        {
            label: "Copy current timestamp",
            action: () => {
                if (currentTimestampSeconds !== null) {
                    navigator.clipboard.writeText(currentTimestampSeconds.toString())
                }
            },
        },
        {
            label: "Copy all formats",
            action: () => {
                if (allFormatsText) {
                    navigator.clipboard.writeText(allFormatsText)
                }
            },
        },
    ], [currentTimestampSeconds, allFormatsText])

    const status = useMemo(() => {
        if (!input) return null
        if (parsedDate) return { type: "success" as const, label: "Parsed" }
        return { type: "error" as const, label: "Cannot parse" }
    }, [input, parsedDate])

    return (
        <div className="h-full flex flex-col min-h-0">
            <ToolToolbar
                title="Timestamp Converter"
                status={status}
                copyValue={currentTimestampSeconds?.toString()}
                onShare={shareUrl}
                exportOptions={exportOptions}
                presets={TIMESTAMP_PRESETS}
                onPresetSelect={handlePresetSelect}
                shortcuts={shortcuts}
            />

            {/* Live clock bar */}
            <div className="flex items-center justify-between px-3 h-9 border-b border-border flex-shrink-0 bg-muted/20">
                <div className="flex items-center gap-2">
                    <ClockIcon className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-mono text-muted-foreground">
                        {Math.floor(now.getTime() / 1000)}
                    </span>
                </div>
                <span className="text-xs font-mono text-muted-foreground">
                    {now.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "medium" })}
                </span>
            </div>

            {/* Input section */}
            <div className="px-4 py-3 border-b border-border flex-shrink-0 space-y-2">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        className="flex-1 bg-muted/30 border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground outline-none focus:border-ring placeholder:text-muted-foreground/50"
                        placeholder="Enter unix timestamp or date string (e.g. 1700000000, 2024-01-15, Dec 25 2025)..."
                        spellCheck={false}
                    />
                    <DatePickerPopover value={parsedDate} onChange={handleDatePick} />
                </div>

                {/* Quick offset buttons */}
                <div className="flex items-center gap-1 flex-wrap">
                    {QUICK_OFFSETS.map(q => (
                        <Button
                            key={q.label}
                            variant="outline"
                            size="xs"
                            onClick={() => handleQuickOffset(q.offset)}
                            className="font-mono"
                        >
                            {q.label}
                        </Button>
                    ))}
                    <div className="w-px h-4 bg-border mx-1" />
                    {QUICK_SNAP.map(q => (
                        <Button
                            key={q.label}
                            variant="outline"
                            size="xs"
                            onClick={() => handleSnap(q.snap)}
                            className="font-mono text-[10px]"
                        >
                            {q.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Main content: two columns */}
            <div className="flex-1 overflow-y-auto min-h-0">
                {!parsedDate ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        {input ? "Invalid date or timestamp" : "Enter a timestamp or date above"}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-full">
                        {/* Left: Formats list */}
                        <div className="border-r border-border divide-y divide-border overflow-y-auto">
                            {formats?.map(({ label, value }) => (
                                <button
                                    key={label}
                                    onClick={() => handleRowClick(value, label)}
                                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors text-left cursor-pointer"
                                >
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                            {label}
                                        </span>
                                        <span className="text-sm font-mono text-foreground truncate">
                                            {value}
                                        </span>
                                    </div>
                                    <span className="flex-shrink-0 ml-2">
                                        {copiedField === label ? (
                                            <CheckIcon className="h-3 w-3 text-emerald-500" />
                                        ) : (
                                            <CopyIcon className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                                        )}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Right: Duration Calculator + Timezone Compare */}
                        <div className="p-4 space-y-4 overflow-y-auto">
                            <DurationCalculator currentTimestamp={currentTimestampSeconds} />
                            <TimezoneCompare timestamp={parsedDate} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
