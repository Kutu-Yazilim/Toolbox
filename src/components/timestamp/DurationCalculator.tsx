"use client"

import { useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRightIcon } from "lucide-react"

const MS_PER_SECOND = 1000
const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60
const HOURS_PER_DAY = 24
const DAYS_PER_YEAR = 365.25
const DAYS_PER_MONTH = 30.44

interface DurationCalculatorProps {
    currentTimestamp: number | null
}

interface DurationResult {
    years: number
    months: number
    days: number
    hours: number
    minutes: number
    seconds: number
    totalMs: number
    direction: "forward" | "backward"
}

function parseTimestampInput(value: string): number | null {
    if (!value.trim()) return null
    const num = parseInt(value.trim(), 10)
    if (isNaN(num)) return null
    return num
}

function computeDuration(t1Seconds: number, t2Seconds: number): DurationResult {
    const diffMs = (t2Seconds - t1Seconds) * MS_PER_SECOND
    const absDiffMs = Math.abs(diffMs)
    const direction = diffMs >= 0 ? "forward" : "backward"

    let remaining = Math.floor(absDiffMs / MS_PER_SECOND)

    const totalSecondsInDay = SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY
    const totalSecondsInYear = Math.floor(DAYS_PER_YEAR * totalSecondsInDay)
    const totalSecondsInMonth = Math.floor(DAYS_PER_MONTH * totalSecondsInDay)

    const years = Math.floor(remaining / totalSecondsInYear)
    remaining -= years * totalSecondsInYear

    const months = Math.floor(remaining / totalSecondsInMonth)
    remaining -= months * totalSecondsInMonth

    const days = Math.floor(remaining / totalSecondsInDay)
    remaining -= days * totalSecondsInDay

    const hours = Math.floor(remaining / (SECONDS_PER_MINUTE * MINUTES_PER_HOUR))
    remaining -= hours * SECONDS_PER_MINUTE * MINUTES_PER_HOUR

    const minutes = Math.floor(remaining / SECONDS_PER_MINUTE)
    const seconds = remaining - minutes * SECONDS_PER_MINUTE

    return { years, months, days, hours, minutes, seconds, totalMs: absDiffMs, direction }
}

function formatDurationPart(value: number, unit: string): string | null {
    if (value === 0) return null
    return `${value}${unit}`
}

export function DurationCalculator({ currentTimestamp }: DurationCalculatorProps) {
    const [t1Input, setT1Input] = useState(
        currentTimestamp !== null ? currentTimestamp.toString() : ""
    )
    const [t2Input, setT2Input] = useState("")

    const handleUseCurrentT1 = useCallback(() => {
        if (currentTimestamp !== null) setT1Input(currentTimestamp.toString())
    }, [currentTimestamp])

    const handleUseCurrentT2 = useCallback(() => {
        if (currentTimestamp !== null) setT2Input(currentTimestamp.toString())
    }, [currentTimestamp])

    const handleUseNowT1 = useCallback(() => {
        setT1Input(Math.floor(Date.now() / MS_PER_SECOND).toString())
    }, [])

    const handleUseNowT2 = useCallback(() => {
        setT2Input(Math.floor(Date.now() / MS_PER_SECOND).toString())
    }, [])

    const t1 = useMemo(() => parseTimestampInput(t1Input), [t1Input])
    const t2 = useMemo(() => parseTimestampInput(t2Input), [t2Input])

    const duration = useMemo(() => {
        if (t1 === null || t2 === null) return null
        return computeDuration(t1, t2)
    }, [t1, t2])

    const durationParts = useMemo(() => {
        if (!duration) return null
        const parts = [
            formatDurationPart(duration.years, "y"),
            formatDurationPart(duration.months, "mo"),
            formatDurationPart(duration.days, "d"),
            formatDurationPart(duration.hours, "h"),
            formatDurationPart(duration.minutes, "m"),
            formatDurationPart(duration.seconds, "s"),
        ].filter(Boolean)
        return parts.length > 0 ? parts.join(" ") : "0s"
    }, [duration])

    return (
        <div className="border border-border rounded-lg p-3 space-y-3">
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Duration Calculator
            </h3>

            {/* T1 */}
            <div className="space-y-1">
                <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground w-5 flex-shrink-0">T1</span>
                    <input
                        type="text"
                        value={t1Input}
                        onChange={e => setT1Input(e.target.value)}
                        className="flex-1 bg-muted/30 border border-border rounded px-2 py-1 text-xs font-mono text-foreground outline-none focus:border-ring placeholder:text-muted-foreground/50"
                        placeholder="Unix timestamp..."
                        spellCheck={false}
                    />
                    <Button variant="ghost" size="xs" onClick={handleUseCurrentT1} disabled={currentTimestamp === null}>
                        Use parsed
                    </Button>
                    <Button variant="ghost" size="xs" onClick={handleUseNowT1}>
                        Now
                    </Button>
                </div>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center gap-2">
                <ArrowRightIcon className={`h-3 w-3 text-muted-foreground ${
                    duration?.direction === "backward" ? "rotate-180" : ""
                } transition-transform`} />
                {durationParts && (
                    <span className="text-xs font-mono text-foreground font-medium">
                        {durationParts}
                    </span>
                )}
                {!duration && (
                    <span className="text-xs text-muted-foreground">
                        Enter both timestamps
                    </span>
                )}
            </div>

            {/* T2 */}
            <div className="space-y-1">
                <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground w-5 flex-shrink-0">T2</span>
                    <input
                        type="text"
                        value={t2Input}
                        onChange={e => setT2Input(e.target.value)}
                        className="flex-1 bg-muted/30 border border-border rounded px-2 py-1 text-xs font-mono text-foreground outline-none focus:border-ring placeholder:text-muted-foreground/50"
                        placeholder="Unix timestamp..."
                        spellCheck={false}
                    />
                    <Button variant="ghost" size="xs" onClick={handleUseCurrentT2} disabled={currentTimestamp === null}>
                        Use parsed
                    </Button>
                    <Button variant="ghost" size="xs" onClick={handleUseNowT2}>
                        Now
                    </Button>
                </div>
            </div>

            {/* Detailed breakdown */}
            {duration && (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                    {([
                        ["Years", duration.years],
                        ["Months", duration.months],
                        ["Days", duration.days],
                        ["Hours", duration.hours],
                        ["Minutes", duration.minutes],
                        ["Seconds", duration.seconds],
                    ] as const).map(([label, val]) => (
                        <div key={label} className="text-center">
                            <div className="text-sm font-mono text-foreground font-medium">{val}</div>
                            <div className="text-[9px] text-muted-foreground uppercase">{label}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
