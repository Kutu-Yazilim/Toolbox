"use client"

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  PlayIcon,
  LoaderIcon,
  RotateCcwIcon,
  ServerIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SpeedGauge } from "./SpeedGauge"
import { SpeedChart, type SpeedSample } from "./SpeedChart"
import { ResultsGrid } from "./ResultsGrid"

type TestPhase = "idle" | "latency" | "download" | "upload" | "done"

type SpeedResult = {
  ping: number
  jitter: number
  download: number
  upload: number
}

const CF_DOWN = "https://speed.cloudflare.com/__down?bytes="
const CF_UP = "https://speed.cloudflare.com/__up"

function percentile(samples: number[], p: number): number {
  if (samples.length === 0) return 0
  const sorted = [...samples].sort((a, b) => a - b)
  const idx = Math.floor(p * (sorted.length - 1))
  return sorted[idx]
}

async function measureLatency(signal: AbortSignal): Promise<{ ping: number; jitter: number }> {
  const pings: number[] = []

  for (let i = 0; i < 10; i++) {
    if (signal.aborted) break
    const start = performance.now()
    await fetch(`${CF_DOWN}0&r=${Math.random()}`, { cache: "no-store", signal })
    pings.push(performance.now() - start)
  }

  const warmPings = pings.slice(1)
  const avg = warmPings.reduce((a, b) => a + b, 0) / warmPings.length
  const diffs = warmPings.slice(1).map((p, i) => Math.abs(p - warmPings[i]))
  const jitter = diffs.length > 0 ? diffs.reduce((a, b) => a + b, 0) / diffs.length : 0

  return { ping: Math.round(avg), jitter: Math.round(jitter * 10) / 10 }
}

type SampleCallback = (sample: SpeedSample) => void

async function measureDownload(
  onSample: SampleCallback,
  signal: AbortSignal,
  testStartTime: number,
): Promise<{ speed: number; samples: number[] }> {
  const sizes = [100_000, 500_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000, 25_000_000, 25_000_000]
  const durationTarget = 10_000
  const chunkSpeeds: number[] = []
  const phaseStart = performance.now()

  for (const size of sizes) {
    if (signal.aborted) break
    if (performance.now() - phaseStart > durationTarget) break

    try {
      const chunkStart = performance.now()
      const resp = await fetch(`${CF_DOWN}${size}&r=${Math.random()}`, { cache: "no-store", signal })
      const blob = await resp.blob()
      const chunkElapsed = (performance.now() - chunkStart) / 1000
      const chunkMbps = chunkElapsed > 0 ? (blob.size * 8) / (chunkElapsed * 1_000_000) : 0

      chunkSpeeds.push(chunkMbps)
      onSample({
        time: (performance.now() - testStartTime) / 1000,
        speed: chunkMbps,
        phase: "download",
      })
    } catch {
      if (signal.aborted) break
    }
  }

  return { speed: percentile(chunkSpeeds, 0.9), samples: chunkSpeeds }
}

async function measureUpload(
  onSample: SampleCallback,
  signal: AbortSignal,
  testStartTime: number,
): Promise<{ speed: number; samples: number[] }> {
  const sizes = [100_000, 500_000, 1_000_000, 2_000_000, 5_000_000, 5_000_000]
  const durationTarget = 10_000
  const chunkSpeeds: number[] = []
  const phaseStart = performance.now()

  for (const size of sizes) {
    if (signal.aborted) break
    if (performance.now() - phaseStart > durationTarget) break

    try {
      const chunkStart = performance.now()
      const blob = new Blob([new ArrayBuffer(size)])
      await fetch(CF_UP, { method: "POST", body: blob, signal })
      const chunkElapsed = (performance.now() - chunkStart) / 1000
      const chunkMbps = chunkElapsed > 0 ? (size * 8) / (chunkElapsed * 1_000_000) : 0

      chunkSpeeds.push(chunkMbps)
      onSample({
        time: (performance.now() - testStartTime) / 1000,
        speed: chunkMbps,
        phase: "upload",
      })
    } catch {
      if (signal.aborted) break
    }
  }

  return { speed: percentile(chunkSpeeds, 0.9), samples: chunkSpeeds }
}

export function SpeedTest() {
  const [phase, setPhase] = useState<TestPhase>("idle")
  const [result, setResult] = useState<SpeedResult | null>(null)
  const [currentSpeed, setCurrentSpeed] = useState(0)
  const [progress, setProgress] = useState(0)
  const [chartData, setChartData] = useState<SpeedSample[]>([])
  const [phaseBreakTime, setPhaseBreakTime] = useState<number | undefined>()
  const abortRef = useRef<AbortController | null>(null)

  const addSample = useCallback((sample: SpeedSample) => {
    setChartData((prev) => [...prev, sample])
    setCurrentSpeed(sample.speed)
  }, [])

  const runTest = useCallback(async () => {
    setResult(null)
    setCurrentSpeed(0)
    setProgress(0)
    setChartData([])
    setPhaseBreakTime(undefined)

    const ac = new AbortController()
    abortRef.current = ac
    const testStartTime = performance.now()

    // Phase 1: Latency
    setPhase("latency")
    setProgress(5)
    let ping = 0
    let jitter = 0
    try {
      const latency = await measureLatency(ac.signal)
      ping = latency.ping
      jitter = latency.jitter
    } catch { /* continue */ }
    setProgress(15)

    if (ac.signal.aborted) return

    // Phase 2: Download
    setPhase("download")
    let download = 0
    try {
      const dlResult = await measureDownload(addSample, ac.signal, testStartTime)
      download = dlResult.speed
    } catch { /* continue */ }
    setProgress(60)

    if (ac.signal.aborted) return

    // Mark phase break for chart divider
    setPhaseBreakTime((performance.now() - testStartTime) / 1000)
    setCurrentSpeed(0)

    // Phase 3: Upload
    setPhase("upload")
    let upload = 0
    try {
      const ulResult = await measureUpload(addSample, ac.signal, testStartTime)
      upload = ulResult.speed
    } catch { /* continue */ }
    setProgress(100)

    if (ac.signal.aborted) return

    setResult({ ping, jitter, download, upload })
    setCurrentSpeed(0)
    setPhase("done")
  }, [addSample])

  const handleStop = useCallback(() => {
    abortRef.current?.abort()
    setPhase("idle")
    setCurrentSpeed(0)
    setProgress(0)
    setChartData([])
    setPhaseBreakTime(undefined)
  }, [])

  const handleReset = useCallback(() => {
    setPhase("idle")
    setResult(null)
    setCurrentSpeed(0)
    setProgress(0)
    setChartData([])
    setPhaseBreakTime(undefined)
  }, [])

  const isRunning = phase !== "idle" && phase !== "done"

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
          {/* Phase badge */}
          {isRunning && (
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
          )}

          {/* Gauge — visible during download/upload and on results */}
          {(phase === "download" || phase === "upload") && (
            <SpeedGauge value={currentSpeed} />
          )}
          {phase === "done" && result && (
            <SpeedGauge value={result.download} />
          )}

          {/* Live chart — visible during download/upload and on results */}
          {(phase === "download" || phase === "upload" || phase === "done") && chartData.length > 0 && (
            <SpeedChart data={chartData} phaseBreakTime={phaseBreakTime} />
          )}

          {/* Progress bar */}
          {isRunning && (
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
          )}

          {/* Results */}
          {phase === "done" && result && (
            <div className="animate-in fade-in duration-500">
              <ResultsGrid result={result} />
            </div>
          )}

          {/* Buttons */}
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
