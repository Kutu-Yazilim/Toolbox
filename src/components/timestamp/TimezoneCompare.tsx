"use client"

import { useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { XIcon, PlusIcon } from "lucide-react"
import { useLocalStorage } from "@/hooks/useLocalStorage"

const DEFAULT_TIMEZONES = [
    "UTC",
    "America/New_York",
    "Europe/London",
    "Europe/Istanbul",
    "Asia/Tokyo",
] as const

const ALL_TIMEZONES = Intl.supportedValuesOf("timeZone")

const STORAGE_KEY = "kutu-timestamp-timezones"

const MS_PER_DAY = 86400000

interface TimezoneCompareProps {
    timestamp: Date | null
}

interface TimezoneRow {
    timezone: string
    formatted: string
    dayOffset: number
}

function computeTimezoneRows(timestamp: Date, timezones: string[]): TimezoneRow[] {
    const localDate = timestamp.toLocaleDateString("en-CA", { timeZone: "UTC" })

    return timezones.map(tz => {
        let formatted: string
        let tzDate: string
        try {
            formatted = timestamp.toLocaleString("en-US", {
                timeZone: tz,
                dateStyle: "medium",
                timeStyle: "medium",
            })
            tzDate = timestamp.toLocaleDateString("en-CA", { timeZone: tz })
        } catch {
            return { timezone: tz, formatted: "Invalid timezone", dayOffset: 0 }
        }

        const localDay = new Date(localDate + "T00:00:00Z").getTime()
        const tzDay = new Date(tzDate + "T00:00:00Z").getTime()
        const dayOffset = Math.round((tzDay - localDay) / MS_PER_DAY)

        return { timezone: tz, formatted, dayOffset }
    })
}

export function TimezoneCompare({ timestamp }: TimezoneCompareProps) {
    const [pinnedTimezones, setPinnedTimezones] = useLocalStorage<string[]>(
        STORAGE_KEY,
        [...DEFAULT_TIMEZONES],
    )
    const [showAdd, setShowAdd] = useState(false)
    const [tzSearch, setTzSearch] = useState("")

    const rows = useMemo(() => {
        if (!timestamp) return []
        return computeTimezoneRows(timestamp, pinnedTimezones)
    }, [timestamp, pinnedTimezones])

    const filteredTimezones = useMemo(() => {
        if (!tzSearch.trim()) return ALL_TIMEZONES.slice(0, 20)
        const q = tzSearch.toLowerCase()
        return ALL_TIMEZONES
            .filter(tz => tz.toLowerCase().includes(q) && !pinnedTimezones.includes(tz))
            .slice(0, 20)
    }, [tzSearch, pinnedTimezones])

    const handleRemove = useCallback((tz: string) => {
        setPinnedTimezones(prev => prev.filter(t => t !== tz))
    }, [setPinnedTimezones])

    const handleAdd = useCallback((tz: string) => {
        setPinnedTimezones(prev => [...prev, tz])
        setTzSearch("")
        setShowAdd(false)
    }, [setPinnedTimezones])

    return (
        <div className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Timezone Compare
                </h3>
                <Button variant="ghost" size="xs" onClick={() => setShowAdd(!showAdd)}>
                    <PlusIcon className="h-3 w-3" />
                </Button>
            </div>

            {showAdd && (
                <div className="space-y-1">
                    <input
                        type="text"
                        value={tzSearch}
                        onChange={e => setTzSearch(e.target.value)}
                        className="w-full bg-muted/30 border border-border rounded px-2 py-1 text-xs font-mono text-foreground outline-none focus:border-ring placeholder:text-muted-foreground/50"
                        placeholder="Search timezone..."
                        spellCheck={false}
                        autoFocus
                    />
                    <div className="max-h-32 overflow-y-auto border border-border rounded bg-card">
                        {filteredTimezones.map(tz => (
                            <button
                                key={tz}
                                onClick={() => handleAdd(tz)}
                                className="w-full text-left px-2 py-1 text-xs font-mono hover:bg-muted transition-colors text-foreground"
                            >
                                {tz}
                            </button>
                        ))}
                        {filteredTimezones.length === 0 && (
                            <div className="px-2 py-1 text-xs text-muted-foreground">No results</div>
                        )}
                    </div>
                </div>
            )}

            {!timestamp ? (
                <div className="text-xs text-muted-foreground text-center py-2">
                    Enter a timestamp to compare
                </div>
            ) : (
                <div className="space-y-0 divide-y divide-border">
                    {rows.map(row => (
                        <div
                            key={row.timezone}
                            className="flex items-center justify-between py-1.5 group"
                        >
                            <div className="min-w-0 flex-1">
                                <div className="text-[10px] text-muted-foreground font-medium truncate">
                                    {row.timezone}
                                </div>
                                <div className="text-xs font-mono text-foreground truncate">
                                    {row.formatted}
                                </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                {row.dayOffset !== 0 && (
                                    <span className="text-[10px] font-mono text-orange-500 font-medium">
                                        {row.dayOffset > 0 ? "+" : ""}{row.dayOffset}d
                                    </span>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => handleRemove(row.timezone)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <XIcon className="h-2.5 w-2.5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
