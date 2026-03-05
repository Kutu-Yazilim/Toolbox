import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { RotateCwIcon, HistoryIcon, Trash2Icon } from "lucide-react"

type FlipResult = {
  result: "heads" | "tails"
  timestamp: number
}

export function CoinFlip() {
  const [isFlipping, setIsFlipping] = useState(false)
  const [result, setResult] = useState<"heads" | "tails" | null>(null)
  const [history, setHistory] = useState<FlipResult[]>([])
  const [flipCount, setFlipCount] = useState(0)
  const coinRef = useRef<HTMLDivElement>(null)

  const flip = useCallback(() => {
    if (isFlipping) return
    setIsFlipping(true)

    // Determine result immediately (but reveal after animation)
    const outcome: "heads" | "tails" = Math.random() < 0.5 ? "heads" : "tails"

    // Increment flip count to restart animation
    setFlipCount((c) => c + 1)

    // Reveal after animation
    setTimeout(() => {
      setResult(outcome)
      setHistory((prev) => [
        { result: outcome, timestamp: Date.now() },
        ...prev,
      ])
      setIsFlipping(false)
    }, 1800)
  }, [isFlipping])

  const headsCount = history.filter((h) => h.result === "heads").length
  const tailsCount = history.filter((h) => h.result === "tails").length

  return (
    <div className="h-full flex flex-col md:flex-row min-h-0">
      {/* Main area */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 p-6 gap-8">
        {/* Coin */}
        <div className="relative" style={{ perspective: "800px" }}>
          <div
            ref={coinRef}
            key={flipCount}
            className={`relative w-44 h-44 md:w-56 md:h-56 ${isFlipping ? "coin-flipping" : ""}`}
            style={{
              transformStyle: "preserve-3d",
              transform:
                !isFlipping && result
                  ? result === "tails"
                    ? "rotateY(180deg)"
                    : "rotateY(0deg)"
                  : undefined,
              transition: !isFlipping ? "transform 0.3s ease" : undefined,
            }}
          >
            {/* Heads face */}
            <div
              className="absolute inset-0 rounded-full flex items-center justify-center backface-hidden"
              style={{
                backfaceVisibility: "hidden",
                background:
                  "radial-gradient(ellipse at 35% 35%, #ffd700, #daa520 50%, #b8860b 100%)",
                boxShadow:
                  "0 4px 24px rgba(218,165,32,0.35), inset 0 2px 8px rgba(255,255,255,0.3), inset 0 -3px 6px rgba(0,0,0,0.15)",
              }}
            >
              <div className="flex flex-col items-center select-none">
                <span
                  className="text-5xl md:text-6xl font-bold"
                  style={{
                    color: "#8B6914",
                    textShadow:
                      "1px 1px 0 rgba(255,255,255,0.4), -1px -1px 0 rgba(0,0,0,0.1)",
                  }}
                >
                  H
                </span>
                <span
                  className="text-xs md:text-sm font-semibold tracking-widest uppercase mt-1"
                  style={{ color: "#8B6914" }}
                >
                  Heads
                </span>
              </div>
              {/* Coin rim effect */}
              <div
                className="absolute inset-1 rounded-full border-2 pointer-events-none"
                style={{ borderColor: "rgba(255,255,255,0.2)" }}
              />
              <div
                className="absolute inset-3 rounded-full border pointer-events-none"
                style={{ borderColor: "rgba(139,105,20,0.3)" }}
              />
            </div>

            {/* Tails face */}
            <div
              className="absolute inset-0 rounded-full flex items-center justify-center"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                background:
                  "radial-gradient(ellipse at 35% 35%, #c0c0c0, #a8a8a8 50%, #808080 100%)",
                boxShadow:
                  "0 4px 24px rgba(128,128,128,0.35), inset 0 2px 8px rgba(255,255,255,0.4), inset 0 -3px 6px rgba(0,0,0,0.15)",
              }}
            >
              <div className="flex flex-col items-center select-none">
                <span
                  className="text-5xl md:text-6xl font-bold"
                  style={{
                    color: "#4a4a4a",
                    textShadow:
                      "1px 1px 0 rgba(255,255,255,0.5), -1px -1px 0 rgba(0,0,0,0.1)",
                  }}
                >
                  T
                </span>
                <span
                  className="text-xs md:text-sm font-semibold tracking-widest uppercase mt-1"
                  style={{ color: "#4a4a4a" }}
                >
                  Tails
                </span>
              </div>
              <div
                className="absolute inset-1 rounded-full border-2 pointer-events-none"
                style={{ borderColor: "rgba(255,255,255,0.25)" }}
              />
              <div
                className="absolute inset-3 rounded-full border pointer-events-none"
                style={{ borderColor: "rgba(74,74,74,0.2)" }}
              />
            </div>
          </div>
        </div>

        {/* Result text */}
        <div className="h-8 flex items-center">
          {result && !isFlipping && (
            <span className="text-lg font-semibold text-foreground animate-in fade-in slide-in-from-bottom-2 duration-300">
              {result === "heads" ? "Heads!" : "Tails!"}
            </span>
          )}
          {isFlipping && (
            <span className="text-sm text-muted-foreground animate-pulse">
              Flipping...
            </span>
          )}
          {!result && !isFlipping && (
            <span className="text-sm text-muted-foreground">
              Press flip to toss the coin
            </span>
          )}
        </div>

        {/* Flip button */}
        <Button
          onClick={flip}
          disabled={isFlipping}
          size="lg"
          className="px-10 gap-2"
        >
          <RotateCwIcon
            className={`h-4 w-4 ${isFlipping ? "animate-spin" : ""}`}
          />
          {isFlipping ? "Flipping..." : "Flip Coin"}
        </Button>
      </div>

      {/* History panel */}
      <div className="w-full md:w-56 md:flex-shrink-0 max-h-48 md:max-h-none flex flex-col border-t md:border-t-0 md:border-l border-border">
        <div className="flex items-center gap-2 px-3 h-9 border-b border-border flex-shrink-0">
          <HistoryIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            History
          </span>
          <span className="ml-auto text-xs text-muted-foreground">
            {history.length}
          </span>
          {history.length > 0 && (
            <button
              onClick={() => {
                setHistory([])
                setResult(null)
              }}
              className="text-muted-foreground hover:text-destructive transition-colors"
              title="Clear history"
            >
              <Trash2Icon className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Stats */}
        {history.length > 0 && (
          <div className="flex items-center gap-3 px-3 py-2 border-b border-border flex-shrink-0 text-xs">
            <div className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: "#daa520" }}
              />
              <span className="text-muted-foreground">
                H: <span className="font-semibold text-foreground">{headsCount}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: "#a8a8a8" }}
              />
              <span className="text-muted-foreground">
                T: <span className="font-semibold text-foreground">{tailsCount}</span>
              </span>
            </div>
            {history.length > 0 && (
              <span className="ml-auto text-muted-foreground">
                {((headsCount / history.length) * 100).toFixed(0)}% /{" "}
                {((tailsCount / history.length) * 100).toFixed(0)}%
              </span>
            )}
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto min-h-0 p-2">
          <div className="space-y-0.5">
            {history.map((entry, i) => (
              <div
                key={entry.timestamp}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor:
                      entry.result === "heads" ? "#daa520" : "#a8a8a8",
                  }}
                />
                <span className="flex-1 capitalize">{entry.result}</span>
                <span className="text-xs text-muted-foreground">
                  #{history.length - i}
                </span>
              </div>
            ))}
            {history.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">
                No flips yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* CSS animation */}
      <style>{`
        @keyframes coinFlip {
          0% {
            transform: rotateY(0deg) rotateX(0deg) translateY(0px);
          }
          15% {
            transform: rotateY(540deg) rotateX(20deg) translateY(-80px);
          }
          30% {
            transform: rotateY(1080deg) rotateX(-10deg) translateY(-120px);
          }
          50% {
            transform: rotateY(1620deg) rotateX(15deg) translateY(-100px);
          }
          70% {
            transform: rotateY(2160deg) rotateX(-5deg) translateY(-40px);
          }
          85% {
            transform: rotateY(2520deg) rotateX(2deg) translateY(-10px);
          }
          100% {
            transform: rotateY(2880deg) rotateX(0deg) translateY(0px);
          }
        }
        .coin-flipping {
          animation: coinFlip 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}</style>
    </div>
  )
}
