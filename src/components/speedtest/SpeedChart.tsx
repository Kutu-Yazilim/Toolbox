"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from "recharts"
import { useTheme } from "@/hooks/useTheme"

export type SpeedSample = {
  time: number // seconds elapsed
  speed: number // Mbps
  phase: "download" | "upload"
}

export function SpeedChart({ data, phaseBreakTime }: { data: SpeedSample[]; phaseBreakTime?: number }) {
  const { isDark } = useTheme()

  if (data.length === 0) return null

  const downloadData = data.filter((d) => d.phase === "download")
  const uploadData = data.filter((d) => d.phase === "upload")

  const merged = data.map((d) => ({
    time: d.time,
    download: d.phase === "download" ? d.speed : undefined,
    upload: d.phase === "upload" ? d.speed : undefined,
  }))

  // If there's a gap between download end and upload start, insert a bridge point
  if (downloadData.length > 0 && uploadData.length > 0) {
    const lastDownload = downloadData[downloadData.length - 1]
    const firstUpload = uploadData[0]
    if (lastDownload.time < firstUpload.time) {
      const breakIdx = merged.findIndex((d) => d.upload !== undefined)
      if (breakIdx > 0) {
        merged.splice(breakIdx, 0, {
          time: lastDownload.time + 0.1,
          download: undefined,
          upload: undefined,
        })
      }
    }
  }

  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"
  const axisColor = isDark ? "#475569" : "#94a3b8"

  return (
    <div className="w-full h-40">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={merged} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: axisColor }}
            tickFormatter={(v: number) => `${Math.round(v)}s`}
            axisLine={{ stroke: gridColor }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: axisColor }}
            tickFormatter={(v: number) => `${Math.round(v)}`}
            axisLine={false}
            tickLine={false}
            label={{
              value: "Mbps",
              angle: -90,
              position: "insideLeft",
              offset: 25,
              style: { fontSize: 9, fill: axisColor },
            }}
          />
          {phaseBreakTime !== undefined && (
            <ReferenceLine
              x={phaseBreakTime}
              stroke={isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}
              strokeDasharray="4 4"
            />
          )}
          <Area
            type="monotone"
            dataKey="download"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={isDark ? 0.2 : 0.12}
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="upload"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={isDark ? 0.2 : 0.12}
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
