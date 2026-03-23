import { useState, useCallback } from "react"
import { CopyIcon, CheckIcon, Trash2Icon, RefreshCwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ─── Types & constants ──────────────────────────────────────────────────────

type UuidVersion = "v1" | "v4" | "v7"

const UUID_VERSIONS: { value: UuidVersion; label: string }[] = [
  { value: "v4", label: "v4 (Random)" },
  { value: "v1", label: "v1 (Timestamp)" },
  { value: "v7", label: "v7 (Timestamp + Random)" },
]

const BULK_PRESETS = [1, 5, 10, 25, 50, 100] as const

// ─── UUID generation helpers ────────────────────────────────────────────────

function generateUuidV4(): string {
  return crypto.randomUUID()
}

function generateUuidV1(): string {
  // Approximation of UUID v1 using timestamp and random node
  const now = Date.now()
  // UUID epoch offset (Oct 15, 1582 to Jan 1, 1970 in 100ns intervals)
  const UUID_EPOCH_OFFSET = 0x01b21dd213814000n
  const timestamp = BigInt(now) * 10000n + UUID_EPOCH_OFFSET

  const timeLow = timestamp & 0xffffffffn
  const timeMid = (timestamp >> 32n) & 0xffffn
  const timeHiAndVersion = ((timestamp >> 48n) & 0x0fffn) | 0x1000n

  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)

  const clockSeq = ((bytes[0] & 0x3f) << 8) | bytes[1]
  const clockSeqHi = (clockSeq >> 8) & 0x3f | 0x80
  const clockSeqLow = clockSeq & 0xff

  const node = Array.from(bytes.slice(2, 8))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  return [
    timeLow.toString(16).padStart(8, "0"),
    timeMid.toString(16).padStart(4, "0"),
    timeHiAndVersion.toString(16).padStart(4, "0"),
    clockSeqHi.toString(16).padStart(2, "0") + clockSeqLow.toString(16).padStart(2, "0"),
    node,
  ].join("-")
}

function generateUuidV7(): string {
  // UUID v7: unix timestamp ms (48 bits) + version (4 bits) + random
  const now = Date.now()
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)

  // Set timestamp (first 48 bits)
  bytes[0] = (now / 2 ** 40) & 0xff
  bytes[1] = (now / 2 ** 32) & 0xff
  bytes[2] = (now / 2 ** 24) & 0xff
  bytes[3] = (now / 2 ** 16) & 0xff
  bytes[4] = (now / 2 ** 8) & 0xff
  bytes[5] = now & 0xff

  // Set version 7 (bits 48-51)
  bytes[6] = (bytes[6] & 0x0f) | 0x70
  // Set variant 10xx (bits 64-65)
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-")
}

function generateUuid(version: UuidVersion): string {
  switch (version) {
    case "v1":
      return generateUuidV1()
    case "v4":
      return generateUuidV4()
    case "v7":
      return generateUuidV7()
  }
}

function formatUuid(uuid: string, uppercase: boolean, hyphens: boolean): string {
  let result = uuid
  if (!hyphens) result = result.replace(/-/g, "")
  if (uppercase) result = result.toUpperCase()
  return result
}

// ─── Component ──────────────────────────────────────────────────────────────

export function UuidGenerator() {
  const [version, setVersion] = useState<UuidVersion>("v4")
  const [count, setCount] = useState(1)
  const [uppercase, setUppercase] = useState(false)
  const [hyphens, setHyphens] = useState(true)
  const [uuids, setUuids] = useState<string[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)

  const generate = useCallback(() => {
    const results: string[] = []
    for (let i = 0; i < count; i++) {
      results.push(generateUuid(version))
    }
    setUuids(results)
    setCopiedIndex(null)
    setCopiedAll(false)
  }, [version, count])

  const copyOne = useCallback(
    (uuid: string, index: number) => {
      const formatted = formatUuid(uuid, uppercase, hyphens)
      navigator.clipboard.writeText(formatted)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 1500)
    },
    [uppercase, hyphens],
  )

  const copyAll = useCallback(() => {
    const formatted = uuids.map((u) => formatUuid(u, uppercase, hyphens)).join("\n")
    navigator.clipboard.writeText(formatted)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 1500)
  }, [uuids, uppercase, hyphens])

  const clear = useCallback(() => {
    setUuids([])
    setCopiedIndex(null)
    setCopiedAll(false)
  }, [])

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Header bar */}
      <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
        {/* Version toggle */}
        <div className="flex items-center gap-1.5 rounded-lg border bg-muted/40 p-1">
          {UUID_VERSIONS.map((v) => (
            <button
              key={v.value}
              onClick={() => setVersion(v.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                version === v.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Bulk count */}
        <div className="flex items-center gap-1.5 rounded-lg border bg-muted/40 p-1">
          {BULK_PRESETS.map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                count === n
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Format options */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUppercase((p) => !p)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
              uppercase
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-transparent bg-muted/40 text-muted-foreground hover:text-foreground",
            )}
          >
            UPPERCASE
          </button>
          <button
            onClick={() => setHyphens((p) => !p)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
              hyphens
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-transparent bg-muted/40 text-muted-foreground hover:text-foreground",
            )}
          >
            Hyphens
          </button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Button onClick={generate} size="sm">
            <RefreshCwIcon className="size-3.5" />
            Generate
          </Button>
          {uuids.length > 1 && (
            <Button onClick={copyAll} variant="outline" size="sm">
              {copiedAll ? (
                <CheckIcon className="size-3.5" />
              ) : (
                <CopyIcon className="size-3.5" />
              )}
              Copy All
            </Button>
          )}
          {uuids.length > 0 && (
            <Button onClick={clear} variant="ghost" size="sm">
              <Trash2Icon className="size-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-4">
        {uuids.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            Click Generate to create UUIDs
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {uuids.map((uuid, i) => {
              const formatted = formatUuid(uuid, uppercase, hyphens)
              return (
                <div
                  key={i}
                  className="group flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-2.5 font-mono text-sm hover:bg-muted/50 transition-colors"
                >
                  <span className="text-muted-foreground text-xs w-8 text-right shrink-0">
                    {i + 1}
                  </span>
                  <span className="flex-1 select-all break-all">{formatted}</span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => copyOne(uuid, i)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    {copiedIndex === i ? (
                      <CheckIcon className="size-3" />
                    ) : (
                      <CopyIcon className="size-3" />
                    )}
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
