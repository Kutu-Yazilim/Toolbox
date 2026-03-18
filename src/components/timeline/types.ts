export type WorkloadUnit = "days" | "weeks" | "months"

export type PriorityEntry = {
  id: string
  title: string
  priority: number
  workload: number
  workloadUnit: WorkloadUnit
  color: string
}

export type DateEntry = {
  id: string
  title: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  color: string
}

export const TIMELINE_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#14b8a6", // teal
  "#6366f1", // indigo
]

export function workloadToDays(workload: number, unit: WorkloadUnit): number {
  switch (unit) {
    case "days":
      return workload
    case "weeks":
      return workload * 7
    case "months":
      return workload * 30
  }
}

export function daysBetween(start: string, end: string): number {
  const s = new Date(start)
  const e = new Date(end)
  return Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1)
}

let _nextId = 0
export function nextId(): string {
  return `entry-${Date.now()}-${_nextId++}`
}
