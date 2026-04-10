"use client"

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  PlusIcon,
  Trash2Icon,
  GripVerticalIcon,
} from "lucide-react"
import { toPng } from "html-to-image"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useShareableUrl } from "@/hooks/useShareableUrl"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { type Preset } from "@/components/shared/PresetsDrawer"
import { PRIORITY_TIMELINE_PRESETS } from "./presets"
import {
  type PriorityEntry,
  type WorkloadUnit,
  TIMELINE_COLORS,
  workloadToDays,
  nextId,
} from "./types"

const DEFAULT_ENTRIES: PriorityEntry[] = [
  {
    id: nextId(),
    title: "Project Setup",
    priority: 1,
    workload: 3,
    workloadUnit: "days",
    color: TIMELINE_COLORS[0],
  },
  {
    id: nextId(),
    title: "Core Development",
    priority: 2,
    workload: 2,
    workloadUnit: "weeks",
    color: TIMELINE_COLORS[1],
  },
  {
    id: nextId(),
    title: "API Integration",
    priority: 2,
    workload: 1,
    workloadUnit: "weeks",
    color: TIMELINE_COLORS[2],
  },
  {
    id: nextId(),
    title: "Testing & QA",
    priority: 3,
    workload: 1,
    workloadUnit: "weeks",
    color: TIMELINE_COLORS[3],
  },
  {
    id: nextId(),
    title: "Deployment",
    priority: 4,
    workload: 2,
    workloadUnit: "days",
    color: TIMELINE_COLORS[4],
  },
]

export function PriorityTimeline() {
  const [savedEntries, setSavedEntries] = useLocalStorage<PriorityEntry[]>("priority-timeline-state", DEFAULT_ENTRIES)
  const [entries, setEntries] = useState<PriorityEntry[]>(savedEntries)
  const timelineRef = useRef<HTMLDivElement>(null)

  const addEntry = useCallback(() => {
    const maxPriority = entries.length
      ? Math.max(...entries.map((e) => e.priority))
      : 0
    setEntries((prev) => [
      ...prev,
      {
        id: nextId(),
        title: "New Task",
        priority: maxPriority + 1,
        workload: 1,
        workloadUnit: "weeks",
        color: TIMELINE_COLORS[prev.length % TIMELINE_COLORS.length],
      },
    ])
  }, [entries])

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const updateEntry = useCallback(
    (id: string, field: keyof PriorityEntry, value: string | number) => {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
      )
    },
    [],
  )

  // Group by priority, sort groups, compute timeline layout
  const { groups, totalDays } = useMemo(() => {
    const grouped = new Map<number, PriorityEntry[]>()
    for (const e of entries) {
      const list = grouped.get(e.priority) || []
      list.push(e)
      grouped.set(e.priority, list)
    }

    const sortedPriorities = Array.from(grouped.keys()).sort((a, b) => a - b)
    const groups: {
      priority: number
      entries: PriorityEntry[]
      maxDays: number
      startDay: number
    }[] = []

    let cumDays = 0
    for (const p of sortedPriorities) {
      const ents = grouped.get(p)!
      const maxDays = Math.max(...ents.map((e) => workloadToDays(e.workload, e.workloadUnit)))
      groups.push({ priority: p, entries: ents, maxDays, startDay: cumDays })
      cumDays += maxDays
    }

    return { groups, totalDays: cumDays }
  }, [entries])

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

  // Persist to localStorage
  useEffect(() => {
    const timer = setTimeout(() => setSavedEntries(entries), 500)
    return () => clearTimeout(timer)
  }, [entries, setSavedEntries])

  // Shareable URL
  const { shareUrl } = useShareableUrl("priority-timeline", entries, useCallback((state: PriorityEntry[]) => {
    setEntries(state)
  }, []))

  // Presets
  const handlePresetSelect = useCallback((preset: Preset) => {
    const data = JSON.parse(preset.content) as Array<Omit<PriorityEntry, "id">>
    setEntries(data.map(e => ({ ...e, id: nextId() })))
  }, [])

  // Export options
  const exportOptions = useMemo(() => [
    { label: "Export PNG", action: exportPng },
    {
      label: "Export JSON",
      action: () => {
        const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "priority-timeline.json"
        a.click()
        URL.revokeObjectURL(url)
      },
    },
  ], [exportPng, entries])

  // Keyboard shortcuts
  const shortcuts = useMemo(() => [
    { key: "mod+n", label: "Add Task", action: addEntry },
    { key: "mod+e", label: "Export PNG", action: exportPng },
    { key: "mod+shift+s", label: "Share URL", action: () => { shareUrl() } },
  ], [addEntry, exportPng, shareUrl])

  useKeyboardShortcuts(shortcuts)

  return (
    <div className="h-full flex flex-col min-h-0">
      <ToolToolbar
        title="Priority Timeline"
        onShare={shareUrl}
        exportOptions={exportOptions}
        presets={PRIORITY_TIMELINE_PRESETS}
        onPresetSelect={handlePresetSelect}
        shortcuts={shortcuts}
        actions={
          <Button variant="outline" size="xs" onClick={addEntry}>
            <PlusIcon className="h-3 w-3" /> Add Task
          </Button>
        }
      />

      <div className="flex-1 min-h-0 overflow-auto p-4 flex flex-col gap-6">
        {/* Entry table */}
        <div className="border border-border rounded-lg overflow-hidden flex-shrink-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground text-left">
                <th className="px-3 py-2 font-medium w-8"></th>
                <th className="px-3 py-2 font-medium">Title</th>
                <th className="px-3 py-2 font-medium w-24">Priority</th>
                <th className="px-3 py-2 font-medium w-24">Workload</th>
                <th className="px-3 py-2 font-medium w-28">Unit</th>
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
                  <td className="px-3 py-1.5 text-muted-foreground">
                    <GripVerticalIcon className="size-4" />
                  </td>
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
                      type="number"
                      min={1}
                      className="w-full bg-transparent border border-border rounded px-2 py-0.5 text-sm text-foreground outline-none"
                      value={entry.priority}
                      onChange={(e) =>
                        updateEntry(
                          entry.id,
                          "priority",
                          parseInt(e.target.value) || 1,
                        )
                      }
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="number"
                      min={1}
                      className="w-full bg-transparent border border-border rounded px-2 py-0.5 text-sm text-foreground outline-none"
                      value={entry.workload}
                      onChange={(e) =>
                        updateEntry(
                          entry.id,
                          "workload",
                          parseInt(e.target.value) || 1,
                        )
                      }
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <select
                      className="w-full bg-transparent border border-border rounded px-2 py-0.5 text-sm text-foreground outline-none"
                      value={entry.workloadUnit}
                      onChange={(e) =>
                        updateEntry(
                          entry.id,
                          "workloadUnit",
                          e.target.value as WorkloadUnit,
                        )
                      }
                    >
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                    </select>
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
              {groups.map((group) => (
                <div key={group.priority} className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-muted-foreground w-20 flex-shrink-0">
                      Priority {group.priority}
                    </span>
                    <div className="flex-1 flex gap-1 items-center">
                      {group.entries.map((entry) => {
                        const entryDays = workloadToDays(
                          entry.workload,
                          entry.workloadUnit,
                        )
                        const widthPct = totalDays > 0
                          ? (entryDays / totalDays) * 100
                          : 100
                        const leftPct = totalDays > 0
                          ? (group.startDay / totalDays) * 100
                          : 0
                        return (
                          <div
                            key={entry.id}
                            className="relative h-8 rounded flex items-center px-2 text-white text-xs font-medium overflow-hidden whitespace-nowrap"
                            style={{
                              backgroundColor: entry.color,
                              width: `${widthPct}%`,
                              marginLeft:
                                group.entries.indexOf(entry) === 0
                                  ? `${leftPct}%`
                                  : undefined,
                              minWidth: "60px",
                            }}
                            title={`${entry.title} — ${entry.workload} ${entry.workloadUnit}`}
                          >
                            {entry.title}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {/* Day ruler at bottom */}
              <div className="mt-4 pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-20 flex-shrink-0">
                    Days
                  </span>
                  <div className="flex-1 relative h-6">
                    {totalDays > 0 &&
                      (() => {
                        const ticks: number[] = []
                        const step =
                          totalDays <= 14
                            ? 1
                            : totalDays <= 60
                              ? 7
                              : 30
                        for (let d = 0; d <= totalDays; d += step) {
                          ticks.push(d)
                        }
                        if (ticks[ticks.length - 1] !== totalDays) {
                          ticks.push(totalDays)
                        }
                        return ticks.map((d) => (
                          <span
                            key={d}
                            className="absolute text-[10px] text-muted-foreground -translate-x-1/2"
                            style={{ left: `${(d / totalDays) * 100}%` }}
                          >
                            {d}
                          </span>
                        ))
                      })()}
                  </div>
                </div>
              </div>

              {/* Total summary */}
              <div className="mt-4 text-xs text-muted-foreground text-right">
                Estimated total:{" "}
                <span className="font-semibold text-foreground">
                  ~{totalDays} days
                </span>
                {totalDays >= 7 && (
                  <span className="ml-2">
                    (~{Math.round(totalDays / 7)} weeks)
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
