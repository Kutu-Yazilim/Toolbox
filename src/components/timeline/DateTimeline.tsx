"use client"

import { useState, useMemo, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { PlusIcon, Trash2Icon, DownloadIcon } from "lucide-react"
import { toPng } from "html-to-image"
import {
  type DateEntry,
  TIMELINE_COLORS,
  daysBetween,
  nextId,
} from "./types"

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00")
  d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0]
}

const DEFAULT_ENTRIES: DateEntry[] = (() => {
  const today = todayStr()
  return [
    {
      id: nextId(),
      title: "Planning",
      startDate: today,
      endDate: addDays(today, 4),
      color: TIMELINE_COLORS[0],
    },
    {
      id: nextId(),
      title: "Design Phase",
      startDate: addDays(today, 3),
      endDate: addDays(today, 12),
      color: TIMELINE_COLORS[1],
    },
    {
      id: nextId(),
      title: "Development",
      startDate: addDays(today, 10),
      endDate: addDays(today, 30),
      color: TIMELINE_COLORS[2],
    },
    {
      id: nextId(),
      title: "Testing",
      startDate: addDays(today, 28),
      endDate: addDays(today, 38),
      color: TIMELINE_COLORS[3],
    },
    {
      id: nextId(),
      title: "Launch",
      startDate: addDays(today, 38),
      endDate: addDays(today, 42),
      color: TIMELINE_COLORS[4],
    },
  ]
})()

export function DateTimeline() {
  const [entries, setEntries] = useState<DateEntry[]>(DEFAULT_ENTRIES)
  const timelineRef = useRef<HTMLDivElement>(null)

  const addEntry = useCallback(() => {
    const today = todayStr()
    setEntries((prev) => [
      ...prev,
      {
        id: nextId(),
        title: "New Task",
        startDate: today,
        endDate: addDays(today, 6),
        color: TIMELINE_COLORS[prev.length % TIMELINE_COLORS.length],
      },
    ])
  }, [])

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const updateEntry = useCallback(
    (id: string, field: keyof DateEntry, value: string) => {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
      )
    },
    [],
  )

  // Compute global min/max for the timeline viewport
  const { globalStart, globalEnd, totalDays, calendarTicks } = useMemo(() => {
    if (entries.length === 0) {
      return {
        globalStart: todayStr(),
        globalEnd: todayStr(),
        totalDays: 1,
        calendarTicks: [] as { label: string; pct: number }[],
      }
    }

    const starts = entries.map((e) => e.startDate).sort()
    const ends = entries.map((e) => e.endDate).sort()
    const globalStart = starts[0]
    const globalEnd = ends[ends.length - 1]
    const totalDays = daysBetween(globalStart, globalEnd)

    // Generate calendar ticks
    const ticks: { label: string; pct: number }[] = []
    const step =
      totalDays <= 14
        ? 1
        : totalDays <= 60
          ? 7
          : totalDays <= 180
            ? 14
            : 30

    for (let d = 0; d < totalDays; d += step) {
      const dateStr = addDays(globalStart, d)
      ticks.push({
        label: formatDate(dateStr),
        pct: (d / totalDays) * 100,
      })
    }
    // Always show end
    if (ticks.length === 0 || ticks[ticks.length - 1].pct < 100) {
      ticks.push({
        label: formatDate(globalEnd),
        pct: 100,
      })
    }

    return { globalStart, globalEnd, totalDays, calendarTicks: ticks }
  }, [entries])

  // Sort entries by start date for rendering
  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [entries],
  )

  const exportPng = useCallback(async () => {
    if (!timelineRef.current) return
    const url = await toPng(timelineRef.current, {
      backgroundColor: "#ffffff",
      pixelRatio: 2,
    })
    const a = document.createElement("a")
    a.href = url
    a.download = "timeline.png"
    a.click()
  }, [])

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border flex-shrink-0">
        <span className="text-sm font-medium text-muted-foreground mr-auto">
          Date-Based Mode
        </span>
        <Button variant="outline" size="sm" onClick={addEntry}>
          <PlusIcon /> Add Task
        </Button>
        <Button variant="outline" size="sm" onClick={exportPng}>
          <DownloadIcon /> Export PNG
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-4 flex flex-col gap-6">
        {/* Entry table */}
        <div className="border border-border rounded-lg overflow-hidden flex-shrink-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground text-left">
                <th className="px-3 py-2 font-medium">Title</th>
                <th className="px-3 py-2 font-medium w-40">Start Date</th>
                <th className="px-3 py-2 font-medium w-40">End Date</th>
                <th className="px-3 py-2 font-medium w-20">Days</th>
                <th className="px-3 py-2 font-medium w-16">Color</th>
                <th className="px-3 py-2 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-t border-border hover:bg-muted/20 transition-colors"
                >
                  <td className="px-3 py-1.5">
                    <input
                      type="text"
                      className="w-full bg-transparent border-none outline-none text-foreground text-sm"
                      value={entry.title}
                      onChange={(e) =>
                        updateEntry(entry.id, "title", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="date"
                      className="w-full bg-transparent border border-border rounded px-2 py-0.5 text-sm text-foreground outline-none"
                      value={entry.startDate}
                      onChange={(e) =>
                        updateEntry(entry.id, "startDate", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="date"
                      className="w-full bg-transparent border border-border rounded px-2 py-0.5 text-sm text-foreground outline-none"
                      value={entry.endDate}
                      min={entry.startDate}
                      onChange={(e) =>
                        updateEntry(entry.id, "endDate", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-3 py-1.5 text-muted-foreground text-center">
                    {daysBetween(entry.startDate, entry.endDate)}
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="color"
                      className="w-8 h-6 rounded cursor-pointer border-none"
                      value={entry.color}
                      onChange={(e) =>
                        updateEntry(entry.id, "color", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <button
                      onClick={() => removeEntry(entry.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2Icon className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {entries.length === 0 && (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No tasks yet. Click "Add Task" to get started.
            </div>
          )}
        </div>

        {/* Timeline visualization */}
        {entries.length > 0 && (
          <div
            ref={timelineRef}
            className="border border-border rounded-lg p-6 bg-background"
          >
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Project Timeline
            </h3>
            <div className="relative">
              {/* Bars */}
              {sortedEntries.map((entry) => {
                const entryDays = daysBetween(entry.startDate, entry.endDate)
                const offsetDays = daysBetween(globalStart, entry.startDate) - 1
                const leftPct =
                  totalDays > 1 ? (offsetDays / totalDays) * 100 : 0
                const widthPct =
                  totalDays > 1 ? (entryDays / totalDays) * 100 : 100

                return (
                  <div key={entry.id} className="mb-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-24 flex-shrink-0 truncate text-right">
                      {entry.title}
                    </span>
                    <div className="flex-1 relative h-7">
                      <div
                        className="absolute h-full rounded flex items-center px-2 text-white text-xs font-medium overflow-hidden whitespace-nowrap"
                        style={{
                          backgroundColor: entry.color,
                          left: `${leftPct}%`,
                          width: `${Math.max(widthPct, 2)}%`,
                        }}
                        title={`${formatDate(entry.startDate)} — ${formatDate(entry.endDate)} (${entryDays} days)`}
                      >
                        <span className="truncate">
                          {formatDate(entry.startDate)} –{" "}
                          {formatDate(entry.endDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Calendar ruler */}
              <div className="mt-4 pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-24 flex-shrink-0"></span>
                  <div className="flex-1 relative h-8">
                    {calendarTicks.map((tick, i) => (
                      <span
                        key={i}
                        className="absolute text-[10px] text-muted-foreground -translate-x-1/2 top-0"
                        style={{ left: `${tick.pct}%` }}
                      >
                        <span className="block w-px h-2 bg-border mx-auto mb-0.5" />
                        {tick.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Total span */}
              <div className="mt-6 text-xs text-muted-foreground text-right">
                Total span:{" "}
                <span className="font-semibold text-foreground">
                  {totalDays} days
                </span>
                {" "}({formatDate(globalStart)} – {formatDate(globalEnd)})
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
