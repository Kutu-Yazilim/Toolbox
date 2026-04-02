"use client"

import { useTheme } from "@/hooks/useTheme"

const ARC_RADIUS = 105
const CX = 140
const CY = 135
const START_ANGLE = 180
const END_ANGLE = 0
const SWEEP = START_ANGLE - END_ANGLE // 180 degrees

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) }
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle)
  const end = polarToCartesian(cx, cy, r, endAngle)
  const largeArc = startAngle - endAngle > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`
}

function getGaugeMax(speed: number): number {
  if (speed > 500) return 1000
  if (speed > 200) return 500
  if (speed > 100) return 250
  if (speed > 50) return 100
  return 50
}

const TICK_COUNT = 10

function formatSpeed(mbps: number): string {
  if (mbps >= 1000) return `${(mbps / 1000).toFixed(2)}`
  if (mbps >= 100) return mbps.toFixed(1)
  if (mbps >= 10) return mbps.toFixed(1)
  return mbps.toFixed(1)
}

function getSpeedUnit(mbps: number): string {
  return mbps >= 1000 ? "Gbps" : "Mbps"
}

export function SpeedGauge({ value, maxOverride }: { value: number; maxOverride?: number }) {
  const { isDark } = useTheme()
  const max = maxOverride ?? getGaugeMax(value)
  const pct = Math.min(Math.max(value / max, 0), 1)

  // Needle angle: from 180° (left) to 0° (right)
  const needleAngle = START_ANGLE - pct * SWEEP
  const needleTip = polarToCartesian(CX, CY, ARC_RADIUS - 20, needleAngle)

  // Ticks
  const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, i) => {
    const frac = i / TICK_COUNT
    const angle = START_ANGLE - frac * SWEEP
    const outer = polarToCartesian(CX, CY, ARC_RADIUS + 8, angle)
    const inner = polarToCartesian(CX, CY, ARC_RADIUS + 2, angle)
    const labelPos = polarToCartesian(CX, CY, ARC_RADIUS + 18, angle)
    const tickValue = Math.round((frac * max))
    const showLabel = i % 2 === 0
    return { outer, inner, labelPos, tickValue, showLabel }
  })

  const trackColor = isDark ? "#1a1a3e" : "#e2e8f0"
  const textColor = isDark ? "#ffffff" : "#0f172a"
  const mutedText = isDark ? "#64748b" : "#94a3b8"
  const tickColor = isDark ? "#334155" : "#cbd5e1"
  const pivotColor = "#06b6d4"
  const needleColor = isDark ? "#ffffff" : "#0f172a"
  const glowOpacity = isDark ? "1" : "0.4"

  return (
    <div className="flex justify-center">
      <svg viewBox="0 0 280 200" className="w-full max-w-xs">
        <defs>
          <linearGradient id="gaugeArcGrad" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="30%" stopColor="#f59e0b" />
            <stop offset="60%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <filter id="gaugeGlow">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background track */}
        <path
          d={describeArc(CX, CY, ARC_RADIUS, START_ANGLE, END_ANGLE)}
          fill="none"
          stroke={trackColor}
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* Gradient arc — filled portion */}
        {pct > 0 && (
          <path
            d={describeArc(CX, CY, ARC_RADIUS, START_ANGLE, START_ANGLE - pct * SWEEP)}
            fill="none"
            stroke="url(#gaugeArcGrad)"
            strokeWidth="14"
            strokeLinecap="round"
            filter="url(#gaugeGlow)"
            opacity={glowOpacity}
            style={{ transition: "d 0.5s ease" }}
          />
        )}

        {/* Tick marks */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={t.inner.x}
              y1={t.inner.y}
              x2={t.outer.x}
              y2={t.outer.y}
              stroke={tickColor}
              strokeWidth="1.5"
              opacity="0.5"
            />
            {t.showLabel && (
              <text
                x={t.labelPos.x}
                y={t.labelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={mutedText}
                fontSize="8"
                fontFamily="system-ui"
              >
                {t.tickValue}
              </text>
            )}
          </g>
        ))}

        {/* Needle */}
        <line
          x1={CX}
          y1={CY}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke={needleColor}
          strokeWidth="2"
          strokeLinecap="round"
          filter="url(#gaugeGlow)"
          style={{ transition: "x2 0.5s ease, y2 0.5s ease" }}
        />

        {/* Pivot */}
        <circle cx={CX} cy={CY} r="7" fill={pivotColor} />
        <circle cx={CX} cy={CY} r="3" fill={isDark ? "#0a0a1a" : "#ffffff"} />

        {/* Speed value — below pivot */}
        <text
          x={CX}
          y={CY + 30}
          textAnchor="middle"
          fill={textColor}
          fontSize="36"
          fontWeight="700"
          fontFamily="system-ui"
        >
          {value > 0 ? formatSpeed(value) : "\u2014"}
        </text>
        <text
          x={CX}
          y={CY + 48}
          textAnchor="middle"
          fill={mutedText}
          fontSize="12"
          fontFamily="system-ui"
          letterSpacing="1"
        >
          {value > 0 ? getSpeedUnit(value) : "Mbps"}
        </text>
      </svg>
    </div>
  )
}
