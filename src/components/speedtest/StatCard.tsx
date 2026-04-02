"use client"

import { cn } from "@/lib/utils"

type QualityRating = "Excellent" | "Good" | "Fair" | "Poor"

function getSpeedRating(mbps: number): QualityRating {
  if (mbps >= 100) return "Excellent"
  if (mbps >= 50) return "Good"
  if (mbps >= 25) return "Fair"
  return "Poor"
}

function getPingRating(ms: number): QualityRating {
  if (ms <= 10) return "Excellent"
  if (ms <= 30) return "Good"
  if (ms <= 60) return "Fair"
  return "Poor"
}

function getRatingColor(rating: QualityRating): string {
  switch (rating) {
    case "Excellent": return "text-emerald-500 bg-emerald-500/10"
    case "Good": return "text-green-500 bg-green-500/10"
    case "Fair": return "text-yellow-500 bg-yellow-500/10"
    case "Poor": return "text-red-500 bg-red-500/10"
  }
}

function getValueColor(rating: QualityRating): string {
  switch (rating) {
    case "Excellent": return "text-emerald-500"
    case "Good": return "text-green-500"
    case "Fair": return "text-yellow-500"
    case "Poor": return "text-red-500"
  }
}

type StatType = "download" | "upload" | "ping" | "jitter"

const STAT_ACCENTS: Record<StatType, string> = {
  download: "border-emerald-500/30",
  upload: "border-violet-500/30",
  ping: "border-blue-500/30",
  jitter: "border-amber-500/30",
}

export function StatCard({ icon, label, value, unit, type }: {
  icon: React.ReactNode
  label: string
  value: number
  unit: string
  type: StatType
}) {
  const isLatencyType = type === "ping" || type === "jitter"
  const rating = isLatencyType ? getPingRating(value) : getSpeedRating(value)
  const ratingColor = getRatingColor(rating)
  const valueColor = getValueColor(rating)

  const formatted = isLatencyType
    ? `${value}`
    : value >= 1000
      ? `${(value / 1000).toFixed(2)}`
      : value >= 100
        ? value.toFixed(1)
        : value.toFixed(2)

  const displayUnit = !isLatencyType && value >= 1000 ? "Gbps" : unit

  return (
    <div className={cn(
      "rounded-xl border-2 bg-card p-4 text-center transition-colors",
      STAT_ACCENTS[type],
    )}>
      <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-2">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className={cn("text-2xl font-bold font-mono", valueColor)}>
        {formatted}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">{displayUnit}</div>
      <span className={cn("inline-block mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full", ratingColor)}>
        {rating}
      </span>
    </div>
  )
}
