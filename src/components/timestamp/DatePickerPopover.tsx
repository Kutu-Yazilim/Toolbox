"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
    CalendarIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    XIcon,
} from "lucide-react"

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
] as const

const HOURS_MAX = 23
const MINUTES_MAX = 59
const SECONDS_MAX = 59

interface DatePickerPopoverProps {
    value: Date | null
    onChange: (timestamp: number) => void
}

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
    return new Date(year, month, 1).getDay()
}

function buildCalendarGrid(year: number, month: number): (number | null)[] {
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    const cells: (number | null)[] = []

    for (let i = 0; i < firstDay; i++) {
        cells.push(null)
    }
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push(d)
    }
    return cells
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
}

export function DatePickerPopover({ value, onChange }: DatePickerPopoverProps) {
    const [open, setOpen] = useState(false)
    const popoverRef = useRef<HTMLDivElement>(null)

    const initial = value ?? new Date()
    const [viewYear, setViewYear] = useState(initial.getFullYear())
    const [viewMonth, setViewMonth] = useState(initial.getMonth())
    const [selectedDay, setSelectedDay] = useState(initial.getDate())
    const [hour, setHour] = useState(initial.getHours())
    const [minute, setMinute] = useState(initial.getMinutes())
    const [second, setSecond] = useState(initial.getSeconds())

    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [open])

    useEffect(() => {
        if (value) {
            setViewYear(value.getFullYear())
            setViewMonth(value.getMonth())
            setSelectedDay(value.getDate())
            setHour(value.getHours())
            setMinute(value.getMinutes())
            setSecond(value.getSeconds())
        }
    }, [value])

    const handlePrevMonth = useCallback(() => {
        setViewMonth(prev => {
            if (prev === 0) {
                setViewYear(y => y - 1)
                return 11
            }
            return prev - 1
        })
    }, [])

    const handleNextMonth = useCallback(() => {
        setViewMonth(prev => {
            if (prev === 11) {
                setViewYear(y => y + 1)
                return 0
            }
            return prev + 1
        })
    }, [])

    const handleSetNow = useCallback(() => {
        const now = new Date()
        setViewYear(now.getFullYear())
        setViewMonth(now.getMonth())
        setSelectedDay(now.getDate())
        setHour(now.getHours())
        setMinute(now.getMinutes())
        setSecond(now.getSeconds())
    }, [])

    const handleConfirm = useCallback(() => {
        const d = new Date(viewYear, viewMonth, selectedDay, hour, minute, second)
        onChange(Math.floor(d.getTime() / 1000))
        setOpen(false)
    }, [viewYear, viewMonth, selectedDay, hour, minute, second, onChange])

    const calendarCells = buildCalendarGrid(viewYear, viewMonth)
    const today = new Date()
    const isToday = (day: number) =>
        day === today.getDate() &&
        viewMonth === today.getMonth() &&
        viewYear === today.getFullYear()

    return (
        <div className="relative" ref={popoverRef}>
            <Button
                variant="outline"
                size="xs"
                onClick={() => setOpen(!open)}
                title="Pick date"
            >
                <CalendarIcon className="h-3 w-3" />
            </Button>

            {open && (
                <div className="absolute left-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-xl p-3 w-72">
                    <div className="flex items-center justify-between mb-2">
                        <Button variant="ghost" size="icon-xs" onClick={handlePrevMonth}>
                            <ChevronLeftIcon className="h-3 w-3" />
                        </Button>
                        <span className="text-xs font-medium text-foreground">
                            {MONTHS[viewMonth]} {viewYear}
                        </span>
                        <Button variant="ghost" size="icon-xs" onClick={handleNextMonth}>
                            <ChevronRightIcon className="h-3 w-3" />
                        </Button>
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-0 mb-1">
                        {DAYS_OF_WEEK.map(day => (
                            <div key={day} className="text-center text-[10px] font-medium text-muted-foreground py-1">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-0">
                        {calendarCells.map((day, i) => (
                            <button
                                key={i}
                                disabled={day === null}
                                onClick={() => day !== null && setSelectedDay(day)}
                                className={`h-7 text-xs rounded-md transition-colors ${
                                    day === null
                                        ? "invisible"
                                        : day === selectedDay
                                            ? "bg-primary text-primary-foreground font-medium"
                                            : isToday(day)
                                                ? "bg-accent text-accent-foreground"
                                                : "hover:bg-muted text-foreground"
                                }`}
                            >
                                {day}
                            </button>
                        ))}
                    </div>

                    {/* Time inputs */}
                    <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center justify-center gap-1">
                            <TimeSpinner value={hour} max={HOURS_MAX} onChange={setHour} />
                            <span className="text-xs text-muted-foreground font-mono">:</span>
                            <TimeSpinner value={minute} max={MINUTES_MAX} onChange={setMinute} />
                            <span className="text-xs text-muted-foreground font-mono">:</span>
                            <TimeSpinner value={second} max={SECONDS_MAX} onChange={setSecond} />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex items-center justify-between">
                        <Button variant="ghost" size="xs" onClick={handleSetNow}>
                            Now
                        </Button>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="xs" onClick={() => setOpen(false)}>
                                <XIcon className="h-3 w-3 mr-1" />
                                Cancel
                            </Button>
                            <Button variant="default" size="xs" onClick={handleConfirm}>
                                Confirm
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function TimeSpinner({
    value,
    max,
    onChange,
}: {
    value: number
    max: number
    onChange: (v: number) => void
}) {
    return (
        <div className="flex flex-col items-center gap-0.5">
            <button
                onClick={() => onChange(value >= max ? 0 : value + 1)}
                className="text-muted-foreground hover:text-foreground transition-colors"
            >
                <ChevronUpIcon className="h-3 w-3" />
            </button>
            <input
                type="text"
                value={value.toString().padStart(2, "0")}
                onChange={e => {
                    const num = parseInt(e.target.value, 10)
                    if (!isNaN(num)) onChange(clamp(num, 0, max))
                }}
                className="w-8 text-center text-xs font-mono bg-muted/30 border border-border rounded py-0.5 text-foreground outline-none focus:border-ring"
            />
            <button
                onClick={() => onChange(value <= 0 ? max : value - 1)}
                className="text-muted-foreground hover:text-foreground transition-colors"
            >
                <ChevronDownIcon className="h-3 w-3" />
            </button>
        </div>
    )
}
