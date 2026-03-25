"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
    CopyIcon,
    CheckIcon,
    ClockIcon,
} from "lucide-react"

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
    const diff = date.getTime() - start.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
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

    // Pure digits — treat as timestamp
    if (/^\d+$/.test(trimmed)) {
        const num = parseInt(trimmed, 10)
        // If 13 digits or more, it's milliseconds
        if (trimmed.length >= 13) {
            const d = new Date(num)
            return isNaN(d.getTime()) ? null : d
        }
        // Otherwise, seconds
        const d = new Date(num * 1000)
        return isNaN(d.getTime()) ? null : d
    }

    // Negative timestamps
    if (/^-\d+$/.test(trimmed)) {
        const num = parseInt(trimmed, 10)
        const d = trimmed.length >= 14 ? new Date(num) : new Date(num * 1000)
        return isNaN(d.getTime()) ? null : d
    }

    // Try parsing as date string
    const d = new Date(trimmed)
    return isNaN(d.getTime()) ? null : d
}

const QUICK_OFFSETS = [
    { label: "Now", offset: 0 },
    { label: "-1h", offset: -3600 },
    { label: "+1h", offset: 3600 },
    { label: "-1d", offset: -86400 },
    { label: "+1d", offset: 86400 },
    { label: "-1w", offset: -604800 },
    { label: "+1w", offset: 604800 },
    { label: "Epoch", offset: "epoch" as const },
]

const POPULAR_TIMEZONES = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Berlin",
    "Europe/Istanbul",
    "Asia/Dubai",
    "Asia/Kolkata",
    "Asia/Shanghai",
    "Asia/Tokyo",
    "Australia/Sydney",
    "Pacific/Auckland",
]

export function TimestampConverter() {
    const [input, setInput] = useState("")
    const [now, setNow] = useState(new Date())
    const [copiedField, setCopiedField] = useState<string | null>(null)
    const [selectedTimezone, setSelectedTimezone] = useState(
        Intl.DateTimeFormat().resolvedOptions().timeZone
    )

    // Live clock
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(interval)
    }, [])

    const parsedDate = useMemo(() => parseInput(input), [input])

    const handleQuickOffset = useCallback((offset: number | "epoch") => {
        if (offset === "epoch") {
            setInput("0")
            return
        }
        const ts = Math.floor(Date.now() / 1000) + offset
        setInput(ts.toString())
    }, [])

    const copyToClipboard = async (text: string, field: string) => {
        await navigator.clipboard.writeText(text)
        setCopiedField(field)
        setTimeout(() => setCopiedField(null), 2000)
    }

    // Generate all output formats
    const outputs = useMemo(() => {
        if (!parsedDate) return null
        const d = parsedDate

        const unixSec = Math.floor(d.getTime() / 1000)
        const unixMs = d.getTime()
        const iso = d.toISOString()
        const utc = d.toUTCString()
        const local = d.toLocaleString()
        const relative = formatRelative(d, now)
        const dayOfWeek = d.toLocaleDateString("en-US", { weekday: "long" })
        const weekNum = getWeekNumber(d)
        const dayOfYear = getDayOfYear(d)

        // Selected timezone display
        let tzDisplay: string
        try {
            tzDisplay = d.toLocaleString("en-US", {
                timeZone: selectedTimezone,
                dateStyle: "full",
                timeStyle: "long",
            })
        } catch {
            tzDisplay = "Invalid timezone"
        }

        return {
            "Unix (seconds)": unixSec.toString(),
            "Unix (milliseconds)": unixMs.toString(),
            "ISO 8601": iso,
            "UTC": utc,
            "Local": local,
            "Relative": relative,
            "Day of week": dayOfWeek,
            "Week number": `Week ${weekNum}`,
            "Day of year": `Day ${dayOfYear} of ${d.getFullYear()}`,
            [`${selectedTimezone}`]: tzDisplay,
        }
    }, [parsedDate, now, selectedTimezone])

    return (
        <div className="h-full flex flex-col min-h-0">
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
                    {input && !parsedDate && (
                        <span className="text-destructive text-xs flex items-center gap-1 flex-shrink-0">
                            <span className="text-[10px]">Cannot parse</span>
                        </span>
                    )}
                </div>

                {/* Quick buttons */}
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
                    <select
                        value={selectedTimezone}
                        onChange={e => setSelectedTimezone(e.target.value)}
                        className="bg-muted/30 border border-border rounded px-2 py-0.5 text-[11px] font-mono text-foreground outline-none"
                    >
                        {POPULAR_TIMEZONES.map(tz => (
                            <option key={tz} value={tz}>{tz}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Output grid */}
            <div className="flex-1 overflow-y-auto min-h-0">
                {!parsedDate ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        {input ? "Invalid date or timestamp" : "Enter a timestamp or date above"}
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {outputs && Object.entries(outputs).map(([label, value]) => (
                            <div
                                key={label}
                                className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors group"
                            >
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                        {label}
                                    </span>
                                    <span className="text-sm font-mono text-foreground truncate">
                                        {value}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="xs"
                                    onClick={() => copyToClipboard(value, label)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                >
                                    {copiedField === label ? (
                                        <CheckIcon className="h-3 w-3" />
                                    ) : (
                                        <CopyIcon className="h-3 w-3" />
                                    )}
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
