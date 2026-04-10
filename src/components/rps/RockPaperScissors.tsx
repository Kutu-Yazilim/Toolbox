"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { RotateCwIcon, TrophyIcon, FlameIcon } from "lucide-react"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useShareableUrl } from "@/hooks/useShareableUrl"
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { RPS_PRESETS } from "./presets"
import { type Preset } from "@/components/shared/PresetsDrawer"

type Choice = "rock" | "paper" | "scissors"
type Result = "win" | "lose" | "draw"
type BestOfMode = 3 | 5 | 7 | 0

const CHOICES: { id: Choice; emoji: string; label: string }[] = [
  { id: "rock", emoji: "\u270a", label: "Rock" }, { id: "paper", emoji: "\u270b", label: "Paper" }, { id: "scissors", emoji: "\u270c\ufe0f", label: "Scissors" },
]

const BEST_OF_OPTIONS: { value: BestOfMode; label: string }[] = [
  { value: 3, label: "Best of 3" }, { value: 5, label: "Best of 5" }, { value: 7, label: "Best of 7" }, { value: 0, label: "Unlimited" },
]

type HistoryEntry = { playerChoice: Choice; computerChoice: Choice; result: Result; round: number }

function getRandomChoice(): Choice { const array = new Uint32Array(1); crypto.getRandomValues(array); return CHOICES[array[0] % 3].id }
function getResult(player: Choice, computer: Choice): Result { if (player === computer) return "draw"; if ((player === "rock" && computer === "scissors") || (player === "paper" && computer === "rock") || (player === "scissors" && computer === "paper")) return "win"; return "lose" }
function getEmoji(choice: Choice): string { return CHOICES.find((c) => c.id === choice)!.emoji }

const RESULT_CONFIG: Record<Result, { text: string; className: string }> = {
  win: { text: "You Win!", className: "text-green-500" }, lose: { text: "You Lose!", className: "text-red-500" }, draw: { text: "Draw!", className: "text-yellow-500" },
}

export function RockPaperScissors() {
  const [bestOfMode, setBestOfMode] = useLocalStorage<BestOfMode>("rps-best-of", 0)
  const [playerScore, setPlayerScore] = useState(0)
  const [computerScore, setComputerScore] = useState(0)
  const [winStreak, setWinStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [phase, setPhase] = useState<"idle" | "revealing" | "result">("idle")
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null)
  const [computerChoice, setComputerChoice] = useState<Choice | null>(null)
  const [lastResult, setLastResult] = useState<Result | null>(null)
  const [resultFlash, setResultFlash] = useState(false)
  const [seriesWinner, setSeriesWinner] = useState<"player" | "computer" | null>(null)
  const roundRef = useRef(0)

  const winsNeeded = bestOfMode === 0 ? 0 : Math.ceil(bestOfMode / 2)

  const shareState = useMemo(() => ({ bestOfMode }), [bestOfMode])
  const { shareUrl } = useShareableUrl("rps", shareState, useCallback((state: { bestOfMode: BestOfMode }) => { setBestOfMode(state.bestOfMode) }, [setBestOfMode]))

  const play = useCallback((choice: Choice) => {
    if (phase !== "idle" || seriesWinner) return
    const cpuChoice = getRandomChoice(); setPlayerChoice(choice); setComputerChoice(cpuChoice); setPhase("revealing")
    setTimeout(() => {
      const result = getResult(choice, cpuChoice); setLastResult(result); setPhase("result"); setResultFlash(true)
      roundRef.current += 1
      setHistory((prev) => [{ playerChoice: choice, computerChoice: cpuChoice, result, round: roundRef.current }, ...prev.slice(0, 9)])
      if (result === "win") { setPlayerScore((s) => s + 1); setWinStreak((s) => { const next = s + 1; setBestStreak((b) => Math.max(b, next)); return next }) }
      else if (result === "lose") { setComputerScore((s) => s + 1); setWinStreak(0) }
      setTimeout(() => { setResultFlash(false); setPhase("idle") }, 1200)
    }, 600)
  }, [phase, seriesWinner])

  useEffect(() => {
    if (bestOfMode === 0) return
    if (playerScore >= winsNeeded) setSeriesWinner("player")
    else if (computerScore >= winsNeeded) setSeriesWinner("computer")
  }, [playerScore, computerScore, bestOfMode, winsNeeded])

  const resetStats = useCallback(() => { setPlayerScore(0); setComputerScore(0); setWinStreak(0); setBestStreak(0); setHistory([]); setPhase("idle"); setPlayerChoice(null); setComputerChoice(null); setLastResult(null); setSeriesWinner(null); roundRef.current = 0 }, [])
  const newSeries = useCallback(() => { setPlayerScore(0); setComputerScore(0); setPhase("idle"); setPlayerChoice(null); setComputerChoice(null); setLastResult(null); setSeriesWinner(null); roundRef.current = 0 }, [])

  const handlePresetSelect = useCallback((preset: Preset) => { const data = JSON.parse(preset.content); setBestOfMode(data.bestOfMode); newSeries() }, [setBestOfMode, newSeries])

  const totalRounds = history.length
  const currentRound = roundRef.current + 1

  const statsText = useMemo(() => {
    if (history.length === 0) return ""
    const wins = history.filter(h => h.result === "win").length; const losses = history.filter(h => h.result === "lose").length; const draws = history.filter(h => h.result === "draw").length
    return `Score: You ${playerScore} - ${computerScore} CPU\nWins: ${wins} | Losses: ${losses} | Draws: ${draws}\nBest streak: ${bestStreak}`
  }, [history, playerScore, computerScore, bestStreak])

  const shortcuts: Shortcut[] = useMemo(() => [
    { key: "mod+shift+r", label: "Reset stats", action: resetStats },
  ], [resetStats])

  useKeyboardShortcuts(shortcuts)

  const exportOptions = useMemo(() => [
    { label: "Copy stats", action: () => navigator.clipboard.writeText(statsText) },
  ], [statsText])

  return (
    <div className="h-full flex flex-col min-h-0">
      <ToolToolbar
        title="Rock Paper Scissors"
        status={seriesWinner ? { type: seriesWinner === "player" ? "success" : "error", label: seriesWinner === "player" ? "You win!" : "CPU wins!" } : lastResult && phase === "result" ? { type: lastResult === "win" ? "success" : lastResult === "lose" ? "error" : "info", label: RESULT_CONFIG[lastResult].text } : null}
        onShare={shareUrl}
        exportOptions={history.length > 0 ? exportOptions : undefined}
        presets={RPS_PRESETS}
        onPresetSelect={handlePresetSelect}
        shortcuts={shortcuts}
      />
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 p-6 gap-6">
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            {BEST_OF_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => { setBestOfMode(opt.value); newSeries() }} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${bestOfMode === opt.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{opt.label}</button>
            ))}
          </div>

          {bestOfMode > 0 && !seriesWinner && <p className="text-sm text-muted-foreground">Round {Math.min(currentRound, bestOfMode)} of {bestOfMode}</p>}

          <div className="flex items-center gap-8">
            <div className="text-center"><p className="text-sm text-muted-foreground">You</p><p className="text-4xl font-bold tabular-nums">{playerScore}</p></div>
            <span className="text-2xl text-muted-foreground font-light">vs</span>
            <div className="text-center"><p className="text-sm text-muted-foreground">Computer</p><p className="text-4xl font-bold tabular-nums">{computerScore}</p></div>
          </div>

          {(winStreak > 0 || bestStreak > 0) && (
            <div className="flex items-center gap-4 text-sm">
              {winStreak > 0 && <span className="flex items-center gap-1 text-orange-500"><FlameIcon className="size-4" />{winStreak} streak</span>}
              {bestStreak > 1 && <span className="flex items-center gap-1 text-muted-foreground"><TrophyIcon className="size-4" />Best: {bestStreak}</span>}
            </div>
          )}

          <div className="flex items-center gap-8 md:gap-16 min-h-[120px]">
            <div className="flex flex-col items-center gap-2">
              <div className="select-none" style={{ fontSize: "80px", lineHeight: 1 }}>
                {phase === "revealing" ? <span className="inline-block animate-bounce">?</span> : playerChoice ? <span className="inline-block animate-in zoom-in-50 duration-300">{getEmoji(playerChoice)}</span> : <span className="opacity-30">?</span>}
              </div>
              <span className="text-xs text-muted-foreground">You</span>
            </div>
            <span className="text-xl font-bold text-muted-foreground">VS</span>
            <div className="flex flex-col items-center gap-2">
              <div className="select-none" style={{ fontSize: "80px", lineHeight: 1 }}>
                {phase === "revealing" ? <span className="inline-block animate-bounce">?</span> : computerChoice ? <span className="inline-block animate-in zoom-in-50 duration-300">{getEmoji(computerChoice)}</span> : <span className="opacity-30">?</span>}
              </div>
              <span className="text-xs text-muted-foreground">CPU</span>
            </div>
          </div>

          <div className="h-10 flex items-center justify-center">
            {seriesWinner ? <p className={`text-2xl font-bold ${seriesWinner === "player" ? "text-green-500" : "text-red-500"}`}>{seriesWinner === "player" ? "You win the series!" : "Computer wins the series!"}</p>
            : lastResult && phase === "result" ? <p className={`text-2xl font-bold transition-transform ${RESULT_CONFIG[lastResult].className} ${resultFlash ? "scale-125" : "scale-100"}`}>{RESULT_CONFIG[lastResult].text}</p> : null}
          </div>

          {!seriesWinner ? (
            <div className="flex gap-4">
              {CHOICES.map((c) => (
                <button key={c.id} onClick={() => play(c.id)} disabled={phase !== "idle"} className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all select-none ${phase !== "idle" ? "opacity-50 cursor-not-allowed border-border" : "border-border hover:border-primary hover:bg-accent cursor-pointer active:scale-95"}`}>
                  <span style={{ fontSize: "48px", lineHeight: 1 }}>{c.emoji}</span>
                  <span className="text-sm font-medium text-muted-foreground">{c.label}</span>
                </button>
              ))}
            </div>
          ) : <Button onClick={newSeries} size="lg">New Series</Button>}

          <Button variant="ghost" size="sm" onClick={resetStats}><RotateCwIcon className="size-4" />Reset All Stats</Button>
        </div>

        <div className="w-full md:w-72 border-t md:border-t-0 md:border-l bg-muted/30 p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Match History</h3>
          {history.length === 0 ? <p className="text-sm text-muted-foreground/60">No rounds played yet. Pick a move!</p> : (
            <div className="flex flex-col gap-2">
              {history.map((entry, i) => (
                <div key={`${entry.round}-${i}`} className="flex items-center gap-3 rounded-lg bg-background/60 px-3 py-2 text-sm">
                  <span className="text-xs text-muted-foreground w-4 shrink-0">#{entry.round}</span>
                  <span style={{ fontSize: "20px" }}>{getEmoji(entry.playerChoice)}</span>
                  <span className="text-muted-foreground">vs</span>
                  <span style={{ fontSize: "20px" }}>{getEmoji(entry.computerChoice)}</span>
                  <span className={`ml-auto text-xs font-semibold ${RESULT_CONFIG[entry.result].className}`}>{entry.result === "win" ? "W" : entry.result === "lose" ? "L" : "D"}</span>
                </div>
              ))}
            </div>
          )}
          {totalRounds > 0 && (
            <div className="mt-4 pt-3 border-t text-xs text-muted-foreground space-y-1">
              <p>Total: {totalRounds} round{totalRounds !== 1 ? "s" : ""}</p>
              <p>Wins: {history.filter((h) => h.result === "win").length} | Losses: {history.filter((h) => h.result === "lose").length} | Draws: {history.filter((h) => h.result === "draw").length}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
