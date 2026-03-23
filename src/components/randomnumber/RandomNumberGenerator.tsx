import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ShuffleIcon, CopyIcon, CheckIcon } from "lucide-react"

type Mode = "single" | "batch"

const ANIMATION_DURATION_MS = 300
const ANIMATION_INTERVAL_MS = 30
const DEFAULT_MIN = 1
const DEFAULT_MAX = 100
const MAX_BATCH_COUNT = 1000
const BUCKET_COUNT = 10

function cryptoRandomInt(min: number, max: number): number {
  const range = max - min + 1
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return min + (array[0] % range)
}

function generateUniqueNumbers(min: number, max: number, count: number): number[] {
  const set = new Set<number>()
  while (set.size < count) {
    set.add(cryptoRandomInt(min, max))
  }
  return Array.from(set)
}

function buildBuckets(numbers: number[], min: number, max: number): { label: string; count: number }[] {
  const range = max - min + 1
  const bucketSize = Math.ceil(range / BUCKET_COUNT)
  const buckets: { label: string; count: number }[] = []

  for (let i = 0; i < BUCKET_COUNT; i++) {
    const lo = min + i * bucketSize
    const hi = Math.min(lo + bucketSize - 1, max)
    if (lo > max) break
    buckets.push({ label: `${lo}-${hi}`, count: 0 })
  }

  for (const n of numbers) {
    const idx = Math.min(Math.floor((n - min) / bucketSize), buckets.length - 1)
    buckets[idx].count++
  }

  return buckets
}

export function RandomNumberGenerator() {
  const [mode, setMode] = useState<Mode>("single")
  const [min, setMin] = useState(DEFAULT_MIN)
  const [max, setMax] = useState(DEFAULT_MAX)
  const [batchCount, setBatchCount] = useState(10)
  const [noRepeat, setNoRepeat] = useState(false)
  const [sortOutput, setSortOutput] = useState(false)

  const [singleResult, setSingleResult] = useState<number | null>(null)
  const [displayNumber, setDisplayNumber] = useState<number | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [batchResults, setBatchResults] = useState<number[]>([])
  const [copied, setCopied] = useState(false)

  const validRange = max >= min
  const rangeSize = validRange ? max - min + 1 : 0
  const noRepeatDisabled = rangeSize < batchCount

  useEffect(() => {
    return () => {
      if (animationRef.current) clearInterval(animationRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const generateSingle = useCallback(() => {
    if (!validRange || isAnimating) return

    setIsAnimating(true)

    if (animationRef.current) clearInterval(animationRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    const finalValue = cryptoRandomInt(min, max)

    animationRef.current = setInterval(() => {
      setDisplayNumber(cryptoRandomInt(min, max))
    }, ANIMATION_INTERVAL_MS)

    timeoutRef.current = setTimeout(() => {
      if (animationRef.current) clearInterval(animationRef.current)
      animationRef.current = null
      setSingleResult(finalValue)
      setDisplayNumber(finalValue)
      setIsAnimating(false)
    }, ANIMATION_DURATION_MS)
  }, [min, max, validRange, isAnimating])

  const generateBatch = useCallback(() => {
    if (!validRange) return
    const count = Math.min(batchCount, MAX_BATCH_COUNT)

    let results: number[]
    if (noRepeat && !noRepeatDisabled) {
      results = generateUniqueNumbers(min, max, count)
    } else {
      results = Array.from({ length: count }, () => cryptoRandomInt(min, max))
    }

    if (sortOutput) {
      results.sort((a, b) => a - b)
    }

    setBatchResults(results)
  }, [min, max, validRange, batchCount, noRepeat, noRepeatDisabled, sortOutput])

  const copyResults = useCallback(() => {
    const text =
      mode === "single" && singleResult !== null
        ? String(singleResult)
        : batchResults.join(", ")
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [mode, singleResult, batchResults])

  const hasResults = mode === "single" ? singleResult !== null : batchResults.length > 0
  const showDistribution = mode === "batch" && batchResults.length >= 20

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Mode toggle */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Mode</label>
            <div className="flex gap-1">
              {(["single", "batch"] as const).map((m) => (
                <Button
                  key={m}
                  variant={mode === m ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode(m)}
                >
                  {m === "single" ? "Single" : "Batch"}
                </Button>
              ))}
            </div>
          </div>

          {/* Range inputs */}
          <div className="flex gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Min</label>
              <input
                type="number"
                value={min}
                onChange={(e) => setMin(Number(e.target.value) || 0)}
                className="w-32 h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Max</label>
              <input
                type="number"
                value={max}
                onChange={(e) => setMax(Number(e.target.value) || 0)}
                className="w-32 h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {!validRange && (
            <p className="text-sm text-destructive">Max must be greater than or equal to Min.</p>
          )}

          {/* Batch options */}
          {mode === "batch" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Count</label>
                <input
                  type="number"
                  min={1}
                  max={MAX_BATCH_COUNT}
                  value={batchCount}
                  onChange={(e) => {
                    const v = Math.max(1, Math.min(MAX_BATCH_COUNT, Number(e.target.value) || 1))
                    setBatchCount(v)
                  }}
                  className="w-32 h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={noRepeat && !noRepeatDisabled}
                    disabled={noRepeatDisabled}
                    onChange={(e) => setNoRepeat(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span className={noRepeatDisabled ? "text-muted-foreground" : ""}>
                    No repeats
                  </span>
                  {noRepeatDisabled && (
                    <span className="text-xs text-muted-foreground">(range too small)</span>
                  )}
                </label>

                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={sortOutput}
                    onChange={(e) => setSortOutput(e.target.checked)}
                    className="rounded border-border"
                  />
                  Sort output
                </label>
              </div>
            </div>
          )}

          {/* Generate button */}
          <div className="flex items-center gap-3">
            <Button
              onClick={mode === "single" ? generateSingle : generateBatch}
              disabled={!validRange || isAnimating}
              size="lg"
            >
              <ShuffleIcon className="size-5" />
              Generate
            </Button>

            {hasResults && (
              <Button variant="outline" size="sm" onClick={copyResults}>
                {copied ? (
                  <CheckIcon className="size-4" />
                ) : (
                  <CopyIcon className="size-4" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            )}
          </div>

          {/* Single mode result */}
          {mode === "single" && (
            <div className="min-h-[140px] flex items-center justify-center">
              {displayNumber !== null ? (
                <div
                  className={`text-7xl font-bold tabular-nums text-foreground transition-transform ${
                    isAnimating ? "scale-95 opacity-70" : "scale-100 opacity-100"
                  }`}
                >
                  {displayNumber}
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">
                  Generate a number between {min} and {max}
                </div>
              )}
            </div>
          )}

          {/* Batch mode results */}
          {mode === "batch" && batchResults.length > 0 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-border bg-card max-h-64 overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {batchResults.map((n, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-md border border-border bg-muted text-sm font-medium tabular-nums text-foreground"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                {batchResults.length} numbers generated
                {noRepeat && !noRepeatDisabled ? " (unique)" : ""}
                {sortOutput ? " (sorted)" : ""}
              </div>
            </div>
          )}

          {/* Distribution chart */}
          {showDistribution && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">Distribution</h3>
              <div className="p-4 rounded-lg border border-border bg-card">
                {(() => {
                  const buckets = buildBuckets(batchResults, min, max)
                  const maxCount = Math.max(...buckets.map((b) => b.count), 1)
                  return (
                    <div className="space-y-2">
                      {buckets.map((bucket) => (
                        <div key={bucket.label} className="flex items-center gap-3 text-xs">
                          <span className="w-20 text-right text-muted-foreground tabular-nums shrink-0">
                            {bucket.label}
                          </span>
                          <div className="flex-1 h-5 bg-muted rounded-sm overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-sm transition-all"
                              style={{
                                width: `${(bucket.count / maxCount) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="w-8 text-right text-muted-foreground tabular-nums shrink-0">
                            {bucket.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
