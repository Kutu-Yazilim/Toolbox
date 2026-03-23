import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  TargetIcon,
  RotateCcwIcon,
  ListIcon,
  SparklesIcon,
} from "lucide-react"

const EXAMPLE_ITEMS = [
  "Pizza",
  "Sushi",
  "Tacos",
  "Burger",
  "Pasta",
  "Ramen",
  "Salad",
  "Curry",
  "Pho",
  "Sandwich",
]

const FLIP_DURATION_MS = 600

function cryptoRandomIndex(max: number): number {
  const randomBytes = new Uint32Array(1)
  crypto.getRandomValues(randomBytes)
  return randomBytes[0] % max
}

export function RandomPicker() {
  const [input, setInput] = useState("")
  const [pickedItem, setPickedItem] = useState<string | null>(null)
  const [isFlipping, setIsFlipping] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [withoutReplacement, setWithoutReplacement] = useState(false)
  const [pickedIndices, setPickedIndices] = useState<Set<number>>(new Set())

  const items = input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  const availableItems = withoutReplacement
    ? items.filter((_, i) => !pickedIndices.has(i))
    : items

  const allPicked = withoutReplacement && availableItems.length === 0 && items.length > 0

  const pick = useCallback(() => {
    if (isFlipping || availableItems.length === 0) return

    setIsFlipping(true)
    setIsFlipped(false)
    setPickedItem(null)

    // Small delay so the card resets to face-down before flipping
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const idx = cryptoRandomIndex(availableItems.length)
        const chosen = availableItems[idx]

        // Find the original index in the full items list
        if (withoutReplacement) {
          let count = 0
          for (let i = 0; i < items.length; i++) {
            if (!pickedIndices.has(i)) {
              if (count === idx) {
                setPickedIndices((prev) => new Set(prev).add(i))
                break
              }
              count++
            }
          }
        }

        setIsFlipped(true)
        setPickedItem(chosen)
        setHistory((prev) => [chosen, ...prev])

        setTimeout(() => {
          setIsFlipping(false)
        }, FLIP_DURATION_MS)
      })
    })
  }, [isFlipping, availableItems, withoutReplacement, items, pickedIndices])

  const reset = useCallback(() => {
    setPickedItem(null)
    setIsFlipped(false)
    setIsFlipping(false)
    setHistory([])
    setPickedIndices(new Set())
  }, [])

  const loadExample = useCallback(() => {
    setInput(EXAMPLE_ITEMS.join("\n"))
    setPickedItem(null)
    setIsFlipped(false)
    setIsFlipping(false)
    setHistory([])
    setPickedIndices(new Set())
  }, [])

  return (
    <>
      <style>{`
        .card-perspective { perspective: 1000px; }
        .card-inner {
          transition: transform 0.6s ease;
          transform-style: preserve-3d;
          position: relative;
          width: 100%;
          height: 100%;
        }
        .card-inner.flipped { transform: rotateY(180deg); }
        .card-face {
          backface-visibility: hidden;
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.75rem;
        }
        .card-back {
          transform: rotateY(180deg);
        }
      `}</style>

      <div className="h-full flex flex-col md:flex-row min-h-0">
        {/* Left panel: input */}
        <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-border flex flex-col min-h-0 p-4 gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">
              Items ({items.length})
            </h2>
            <Button variant="ghost" size="sm" onClick={loadExample}>
              <SparklesIcon className="w-3.5 h-3.5 mr-1.5" />
              Load Example
            </Button>
          </div>

          <textarea
            className="flex-1 min-h-[160px] w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder={"Enter items, one per line:\n\nPizza\nSushi\nTacos\nBurger\n..."}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              // Reset picked state when input changes
              setPickedItem(null)
              setIsFlipped(false)
              setHistory([])
              setPickedIndices(new Set())
            }}
          />

          {/* Without replacement toggle */}
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <button
              type="button"
              role="switch"
              aria-checked={withoutReplacement}
              onClick={() => {
                setWithoutReplacement((v) => !v)
                setPickedIndices(new Set())
                setHistory([])
                setPickedItem(null)
                setIsFlipped(false)
              }}
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${
                withoutReplacement ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                  withoutReplacement ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-muted-foreground">Without replacement</span>
          </label>

          {/* Item list with greyed-out picked items */}
          {withoutReplacement && items.length > 0 && (
            <div className="flex-1 min-h-0 overflow-y-auto space-y-0.5">
              {items.map((item, i) => (
                <div
                  key={`${i}-${item}`}
                  className={`text-sm px-2 py-1 rounded ${
                    pickedIndices.has(i)
                      ? "text-muted-foreground/40 line-through"
                      : "text-foreground"
                  }`}
                >
                  {item}
                </div>
              ))}
            </div>
          )}

          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcwIcon className="w-3.5 h-3.5 mr-1.5" />
            Reset
          </Button>
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 p-6 gap-6">
          {/* Card */}
          <div className="card-perspective w-64 h-40 md:w-80 md:h-48">
            <div className={`card-inner ${isFlipped ? "flipped" : ""}`}>
              {/* Front face (question mark) */}
              <div className="card-face bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30">
                <span className="text-6xl md:text-7xl font-bold text-primary/50 select-none">
                  ?
                </span>
              </div>
              {/* Back face (result) */}
              <div className="card-back card-face bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary">
                <span className="text-xl md:text-2xl font-bold text-foreground text-center px-4 break-words max-w-full">
                  {pickedItem}
                </span>
              </div>
            </div>
          </div>

          {allPicked ? (
            <div className="text-center">
              <p className="text-lg font-semibold text-primary">All items picked!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Reset to start over
              </p>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button
                size="lg"
                onClick={pick}
                disabled={items.length === 0 || isFlipping}
              >
                <TargetIcon className="w-4 h-4 mr-2" />
                {history.length === 0 ? "Pick" : "Pick Again"}
              </Button>
            </div>
          )}
        </div>

        {/* Right panel: history */}
        {history.length > 0 && (
          <div className="w-full md:w-64 lg:w-72 border-t md:border-t-0 md:border-l border-border flex flex-col min-h-0 p-4 gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ListIcon className="w-3.5 h-3.5" />
              History ({history.length})
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto space-y-1">
              {history.map((item, i) => (
                <div
                  key={`${i}-${item}`}
                  className={`text-sm px-2 py-1.5 rounded border ${
                    i === 0
                      ? "border-primary/30 bg-primary/5 text-foreground font-medium"
                      : "border-transparent text-muted-foreground"
                  }`}
                >
                  <span className="text-muted-foreground/60 mr-2 font-mono text-xs">
                    #{history.length - i}
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
