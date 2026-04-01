"use client"

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  PlayIcon,
  DownloadIcon,
  UploadIcon,
  ActivityIcon,
  LoaderIcon,
  RotateCcwIcon,
  WifiIcon,
  ServerIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

type TestPhase = "idle" | "latency" | "download" | "upload" | "done"

type SpeedResult = {
  ping: number
  jitter: number
  download: number
  upload: number
}

const CF_DOWN = "https://speed.cloudflare.com/__down?bytes="
const CF_UP = "https://speed.cloudflare.com/__up"

function formatSpeed(mbps: number): string {
  if (mbps >= 1000) return `${(mbps / 1000).toFixed(2)}`
  if (mbps >= 100) return mbps.toFixed(1)
  if (mbps >= 10) return mbps.toFixed(2)
  return mbps.toFixed(2)
}

function getSpeedUnit(mbps: number): string {
  return mbps >= 1000 ? "Gbps" : "Mbps"
}

function getSpeedColor(mbps: number): string {
  if (mbps >= 100) return "text-emerald-500"
  if (mbps >= 50) return "text-green-500"
  if (mbps >= 25) return "text-yellow-500"
  if (mbps >= 10) return "text-orange-500"
  return "text-red-500"
}

function getPingColor(ms: number): string {
  if (ms <= 10) return "text-emerald-500"
  if (ms <= 30) return "text-green-500"
  if (ms <= 60) return "text-yellow-500"
  if (ms <= 100) return "text-orange-500"
  return "text-red-500"
}

async function measureLatency(): Promise<{ ping: number; jitter: number }> {
  const pings: number[] = []
  const rounds = 10

  for (let i = 0; i < rounds; i++) {
    const start = performance.now()
    await fetch(`${CF_DOWN}0&r=${Math.random()}`, { cache: "no-store" })
    const elapsed = performance.now() - start
    pings.push(elapsed)
  }

  // Drop the first ping (cold connection) and compute stats from the rest
  const warmPings = pings.slice(1)
  const avg = warmPings.reduce((a, b) => a + b, 0) / warmPings.length
  const diffs = warmPings.slice(1).map((p, i) => Math.abs(p - warmPings[i]))
  const jitter = diffs.length > 0 ? diffs.reduce((a, b) => a + b, 0) / diffs.length : 0

  return { ping: Math.round(avg), jitter: Math.round(jitter * 10) / 10 }
}

async function measureDownload(
  onProgress: (mbps: number) => void,
  signal: AbortSignal,
): Promise<number> {
  // Progressive chunk sizes: start small, ramp up
  const sizes = [
    100_000, 500_000, 1_000_000,
    2_000_000, 5_000_000, 10_000_000,
    25_000_000, 25_000_000,
  ]
  const durationTarget = 10_000 // 10 seconds total target
  let totalBytes = 0
  const startTime = performance.now()

  for (const size of sizes) {
    if (signal.aborted) break
    if (performance.now() - startTime > durationTarget) break

    try {
      const resp = await fetch(`${CF_DOWN}${size}&r=${Math.random()}`, {
        cache: "no-store",
        signal,
      })
      const blob = await resp.blob()
      totalBytes += blob.size
      const elapsed = (performance.now() - startTime) / 1000
      const mbps = (totalBytes * 8) / (elapsed * 1_000_000)
      onProgress(mbps)
    } catch {
      if (signal.aborted) break
    }
  }

  const totalElapsed = (performance.now() - startTime) / 1000
  return totalElapsed > 0 ? (totalBytes * 8) / (totalElapsed * 1_000_000) : 0
}

async function measureUpload(
  onProgress: (mbps: number) => void,
  signal: AbortSignal,
): Promise<number> {
  const sizes = [
    100_000, 500_000, 1_000_000,
    2_000_000, 5_000_000, 5_000_000,
  ]
  const durationTarget = 10_000
  let totalBytes = 0
  const startTime = performance.now()

  for (const size of sizes) {
    if (signal.aborted) break
    if (performance.now() - startTime > durationTarget) break

    try {
      const blob = new Blob([new ArrayBuffer(size)])
      await fetch(CF_UP, {
        method: "POST",
        body: blob,
        signal,
      })
      totalBytes += size
      const elapsed = (performance.now() - startTime) / 1000
      const mbps = (totalBytes * 8) / (elapsed * 1_000_000)
      onProgress(mbps)
    } catch {
      if (signal.aborted) break
    }
  }

  const totalElapsed = (performance.now() - startTime) / 1000
  return totalElapsed > 0 ? (totalBytes * 8) / (totalElapsed * 1_000_000) : 0
}

// Gauge component
function SpeedGauge({ value, max, label, unit }: { value: number; max: number; label: string; unit: string }) {
  const pct = Math.min(value / max, 1)
  const angle = pct * 240 - 120 // -120 to 120 degrees

  return (
    <div className="relative w-48 h-28 mx-auto">
      <svg viewBox="0 0 200 120" className="w-full h-full">
        {/* Background arc */}
        <path
          d="M 20 110 A 80 80 0 0 1 180 110"
          fill="none"
          stroke="currentColor"
          className="text-muted/30"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d="M 20 110 A 80 80 0 0 1 180 110"
          fill="none"
          stroke="currentColor"
          className={cn(
            value > 0 ? getSpeedColor(value) : "text-muted/30",
          )}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${pct * 264} 264`}
          style={{ transition: "stroke-dasharray 0.5s ease" }}
        />
        {/* Needle */}
        <g transform={`rotate(${angle}, 100, 110)`} style={{ transition: "transform 0.5s ease" }}>
          <line x1="100" y1="110" x2="100" y2="40" stroke="currentColor" className="text-foreground" strokeWidth="2" strokeLinecap="round" />
          <circle cx="100" cy="110" r="4" fill="currentColor" className="text-foreground" />
        </g>
      </svg>
      <div className="absolute bottom-0 left-0 right-0 text-center">
        <div className={cn("text-2xl font-bold font-mono", value > 0 ? getSpeedColor(value) : "text-muted-foreground")}>
          {value > 0 ? formatSpeed(value) : "—"}
        </div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{value > 0 ? unit : label}</div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sublabel, colorClass }: {
  icon: React.ReactNode
  label: string
  value: string
  sublabel: string
  colorClass?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3 text-center">
      <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className={cn("text-xl font-bold font-mono", colorClass ?? "text-foreground")}>{value}</div>
      <div className="text-[10px] text-muted-foreground">{sublabel}</div>
    </div>
  )
}

export function SpeedTest() {
  const [phase, setPhase] = useState<TestPhase>("idle")
  const [result, setResult] = useState<SpeedResult | null>(null)
  const [currentSpeed, setCurrentSpeed] = useState(0)
  const [progress, setProgress] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  const runTest = useCallback(async () => {
    setResult(null)
    setCurrentSpeed(0)
    setProgress(0)

    const ac = new AbortController()
    abortRef.current = ac

    // Phase 1: Latency
    setPhase("latency")
    setProgress(5)
    let ping = 0
    let jitter = 0
    try {
      const latency = await measureLatency()
      ping = latency.ping
      jitter = latency.jitter
    } catch {
      // continue with 0 values
    }
    setProgress(15)

    if (ac.signal.aborted) return

    // Phase 2: Download
    setPhase("download")
    let download = 0
    try {
      download = await measureDownload((mbps) => setCurrentSpeed(mbps), ac.signal)
    } catch {
      // continue
    }
    setProgress(60)
    setCurrentSpeed(0)

    if (ac.signal.aborted) return

    // Phase 3: Upload
    setPhase("upload")
    let upload = 0
    try {
      upload = await measureUpload((mbps) => setCurrentSpeed(mbps), ac.signal)
    } catch {
      // continue
    }
    setProgress(100)

    if (ac.signal.aborted) return

    setResult({ ping, jitter, download, upload })
    setCurrentSpeed(0)
    setPhase("done")
  }, [])

  const handleStop = useCallback(() => {
    abortRef.current?.abort()
    setPhase("idle")
    setCurrentSpeed(0)
    setProgress(0)
  }, [])

  const handleReset = useCallback(() => {
    setPhase("idle")
    setResult(null)
    setCurrentSpeed(0)
    setProgress(0)
  }, [])

  const isRunning = phase !== "idle" && phase !== "done"
  const gaugeMax = currentSpeed > 200 ? 1000 : currentSpeed > 50 ? 200 : 100

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-8 border-b border-border bg-muted/20 flex-shrink-0">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Internet Speed Test
        </span>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <ServerIcon className="h-3 w-3" />
          Cloudflare Network
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col items-center justify-center">
        <div className="max-w-lg w-full space-y-6">
          {/* Gauge area */}
          {isRunning && (
            <div className="space-y-3">
              <div className="text-center">
                <span className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
                  phase === "latency" && "bg-blue-500/10 text-blue-500",
                  phase === "download" && "bg-emerald-500/10 text-emerald-500",
                  phase === "upload" && "bg-violet-500/10 text-violet-500",
                )}>
                  <LoaderIcon className="h-3 w-3 animate-spin" />
                  {phase === "latency" && "Measuring Latency..."}
                  {phase === "download" && "Testing Download..."}
                  {phase === "upload" && "Testing Upload..."}
                </span>
              </div>

              {phase !== "latency" && (
                <SpeedGauge
                  value={currentSpeed}
                  max={gaugeMax}
                  label={phase === "download" ? "Download" : "Upload"}
                  unit={getSpeedUnit(currentSpeed)}
                />
              )}

              {/* Progress bar */}
              <div className="w-full bg-muted/30 rounded-full h-1.5 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    phase === "latency" && "bg-blue-500",
                    phase === "download" && "bg-emerald-500",
                    phase === "upload" && "bg-violet-500",
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Results */}
          {phase === "done" && result && (
            <div className="space-y-4 animate-in fade-in duration-500">
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={<DownloadIcon className="h-3.5 w-3.5" />}
                  label="Download"
                  value={formatSpeed(result.download)}
                  sublabel={getSpeedUnit(result.download)}
                  colorClass={getSpeedColor(result.download)}
                />
                <StatCard
                  icon={<UploadIcon className="h-3.5 w-3.5" />}
                  label="Upload"
                  value={formatSpeed(result.upload)}
                  sublabel={getSpeedUnit(result.upload)}
                  colorClass={getSpeedColor(result.upload)}
                />
                <StatCard
                  icon={<ActivityIcon className="h-3.5 w-3.5" />}
                  label="Ping"
                  value={`${result.ping}`}
                  sublabel="ms"
                  colorClass={getPingColor(result.ping)}
                />
                <StatCard
                  icon={<WifiIcon className="h-3.5 w-3.5" />}
                  label="Jitter"
                  value={`${result.jitter}`}
                  sublabel="ms"
                  colorClass={getPingColor(result.jitter)}
                />
              </div>
            </div>
          )}

          {/* Start / Stop / Reset buttons */}
          <div className="flex justify-center gap-2">
            {phase === "idle" && (
              <Button onClick={runTest} size="lg" className="gap-2 px-8">
                <PlayIcon className="h-4 w-4" />
                Start Speed Test
              </Button>
            )}
            {isRunning && (
              <Button onClick={handleStop} variant="outline" size="lg" className="gap-2 px-8">
                Stop
              </Button>
            )}
            {phase === "done" && (
              <>
                <Button onClick={runTest} size="lg" className="gap-2 px-8">
                  <PlayIcon className="h-4 w-4" />
                  Test Again
                </Button>
                <Button onClick={handleReset} variant="outline" size="lg" className="gap-2">
                  <RotateCcwIcon className="h-4 w-4" />
                  Reset
                </Button>
              </>
            )}
          </div>

          {/* Idle info */}
          {phase === "idle" && !result && (
            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                Measures your download speed, upload speed, ping, and jitter.
              </p>
              <p className="text-[10px] text-muted-foreground/70">
                Test runs against Cloudflare&apos;s global network for accurate results.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
