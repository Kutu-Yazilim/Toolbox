"use client"

import { useState, useCallback, useRef } from "react"
import { toPng } from "html-to-image"
import { Button } from "@/components/ui/button"
import {
  ShuffleIcon,
  TrophyIcon,
  DownloadIcon,
  RotateCcwIcon,
  PlayIcon,
} from "lucide-react"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIN_PARTICIPANTS = 2
const MAX_PARTICIPANTS = 64
const BYE = "BYE"

const EXAMPLE_PARTICIPANTS = [
  "Alpha",
  "Bravo",
  "Charlie",
  "Delta",
  "Echo",
  "Foxtrot",
  "Golf",
  "Hotel",
]

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Match = {
  id: number
  round: number
  position: number
  participants: [string | null, string | null]
  winner: string | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nextPowerOf2(n: number): number {
  let p = 1
  while (p < n) p *= 2
  return p
}

function fisherYatesShuffle<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const buf = new Uint32Array(1)
    crypto.getRandomValues(buf)
    const j = buf[0] % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function buildMatches(participants: string[]): Match[] {
  const size = nextPowerOf2(participants.length)
  const padded = [...participants]
  while (padded.length < size) padded.push(BYE)

  const totalRounds = Math.log2(size)
  const matches: Match[] = []
  let id = 0

  // First round
  for (let i = 0; i < size / 2; i++) {
    matches.push({
      id: id++,
      round: 0,
      position: i,
      participants: [padded[i * 2], padded[i * 2 + 1]],
      winner: null,
    })
  }

  // Subsequent rounds
  for (let r = 1; r < totalRounds; r++) {
    const matchesInRound = size / Math.pow(2, r + 1)
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        id: id++,
        round: r,
        position: i,
        participants: [null, null],
        winner: null,
      })
    }
  }

  // Auto-advance BYEs in round 0
  return autoAdvanceByes(matches, totalRounds)
}

function autoAdvanceByes(matches: Match[], totalRounds: number): Match[] {
  const updated = matches.map((m) => ({ ...m }))

  for (const match of updated) {
    if (match.round !== 0) continue
    const [a, b] = match.participants
    if (a === BYE && b !== BYE && b !== null) {
      match.winner = b
    } else if (b === BYE && a !== BYE && a !== null) {
      match.winner = a
    }
  }

  // Propagate auto-advanced winners
  for (const match of updated) {
    if (match.round === 0 && match.winner) {
      propagateWinner(updated, match, totalRounds)
    }
  }

  return updated
}

function propagateWinner(
  matches: Match[],
  match: Match,
  totalRounds: number,
): void {
  if (match.round >= totalRounds - 1) return
  const nextRound = match.round + 1
  const nextPos = Math.floor(match.position / 2)
  const slot = match.position % 2

  const nextMatch = matches.find(
    (m) => m.round === nextRound && m.position === nextPos,
  )
  if (!nextMatch) return

  nextMatch.participants[slot] = match.winner

  // If both participants set and one is BYE, auto-advance
  const [a, b] = nextMatch.participants
  if (a && b) {
    if (a === BYE && b !== BYE) {
      nextMatch.winner = b
      propagateWinner(matches, nextMatch, totalRounds)
    } else if (b === BYE && a !== BYE) {
      nextMatch.winner = a
      propagateWinner(matches, nextMatch, totalRounds)
    }
  }
}

function selectWinner(
  matches: Match[],
  matchId: number,
  winner: string,
  totalRounds: number,
): Match[] {
  const updated = matches.map((m) => ({ ...m, participants: [...m.participants] as [string | null, string | null] }))
  const match = updated.find((m) => m.id === matchId)
  if (!match) return updated

  // Clear downstream if winner changed
  if (match.winner && match.winner !== winner) {
    clearDownstream(updated, match, totalRounds)
  }

  match.winner = winner
  propagateWinner(updated, match, totalRounds)

  return updated
}

function clearDownstream(
  matches: Match[],
  match: Match,
  totalRounds: number,
): void {
  if (match.round >= totalRounds - 1) return
  const nextRound = match.round + 1
  const nextPos = Math.floor(match.position / 2)
  const slot = match.position % 2

  const nextMatch = matches.find(
    (m) => m.round === nextRound && m.position === nextPos,
  )
  if (!nextMatch) return

  // Remove old winner from next match
  if (nextMatch.winner === match.winner) {
    clearDownstream(matches, nextMatch, totalRounds)
    nextMatch.winner = null
  }
  nextMatch.participants[slot] = null
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BracketGenerator() {
  const [input, setInput] = useState("")
  const [matches, setMatches] = useState<Match[]>([])
  const [totalRounds, setTotalRounds] = useState(0)
  const [seededNames, setSeededNames] = useState<string[]>([])
  const bracketRef = useRef<HTMLDivElement>(null)

  const names = input
    .split("\n")
    .map((n) => n.trim())
    .filter(Boolean)

  const canGenerate =
    names.length >= MIN_PARTICIPANTS && names.length <= MAX_PARTICIPANTS

  const champion = matches.find(
    (m) => m.round === totalRounds - 1 && m.winner,
  )?.winner

  const generate = useCallback(
    (participantList: string[]) => {
      const size = nextPowerOf2(participantList.length)
      const rounds = Math.log2(size)
      setTotalRounds(rounds)
      setSeededNames(participantList)
      setMatches(buildMatches(participantList))
    },
    [],
  )

  const handleGenerate = useCallback(() => {
    if (!canGenerate) return
    generate(names)
  }, [canGenerate, names, generate])

  const handleRandomize = useCallback(() => {
    if (!canGenerate) return
    generate(fisherYatesShuffle(names))
  }, [canGenerate, names, generate])

  const handleReset = useCallback(() => {
    if (seededNames.length === 0) return
    generate(seededNames)
  }, [seededNames, generate])

  const handleReseed = useCallback(() => {
    if (seededNames.length === 0) return
    generate(fisherYatesShuffle(seededNames))
  }, [seededNames, generate])

  const handleSelectWinner = useCallback(
    (matchId: number, winner: string) => {
      if (winner === BYE) return
      setMatches((prev) => selectWinner(prev, matchId, winner, totalRounds))
    },
    [totalRounds],
  )

  const handleExportPng = useCallback(async () => {
    if (!bracketRef.current) return
    const dataUrl = await toPng(bracketRef.current, {
      backgroundColor: "#09090b",
      pixelRatio: 2,
    })
    const link = document.createElement("a")
    link.download = "bracket.png"
    link.href = dataUrl
    link.click()
  }, [])

  const loadExample = useCallback(() => {
    setInput(EXAMPLE_PARTICIPANTS.join("\n"))
    setMatches([])
    setSeededNames([])
  }, [])

  // Group matches by round
  const rounds: Match[][] = []
  for (let r = 0; r < totalRounds; r++) {
    rounds.push(matches.filter((m) => m.round === r).sort((a, b) => a.position - b.position))
  }

  const roundLabel = (r: number): string => {
    if (r === totalRounds - 1) return "Final"
    if (r === totalRounds - 2) return "Semifinals"
    if (r === totalRounds - 3) return "Quarterfinals"
    return `Round ${r + 1}`
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Input section */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Participants (one per line, 2-64)
              </label>
              <span className="text-xs text-muted-foreground">
                {names.length} participant{names.length !== 1 ? "s" : ""}
              </span>
            </div>
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                setMatches([])
                setSeededNames([])
              }}
              placeholder={"Alice\nBob\nCharlie\nDiana\n..."}
              rows={8}
              className="w-full rounded-md border bg-muted/50 px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            />
          </div>

          <div className="flex flex-col gap-3 lg:w-52">
            <Button onClick={handleGenerate} disabled={!canGenerate}>
              <PlayIcon className="size-4" />
              Generate Bracket
            </Button>

            <Button
              variant="outline"
              onClick={handleRandomize}
              disabled={!canGenerate}
            >
              <ShuffleIcon className="size-4" />
              Randomize Seeding
            </Button>

            <Button variant="outline" onClick={loadExample}>
              <TrophyIcon className="size-4" />
              Load Example
            </Button>

            {matches.length > 0 && (
              <>
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcwIcon className="size-4" />
                  Reset Bracket
                </Button>

                <Button variant="outline" onClick={handleReseed}>
                  <ShuffleIcon className="size-4" />
                  Re-seed
                </Button>

                <Button variant="outline" onClick={handleExportPng}>
                  <DownloadIcon className="size-4" />
                  Export PNG
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Champion banner */}
        {champion && (
          <div className="flex items-center justify-center gap-3 rounded-lg border-2 border-yellow-500/50 bg-yellow-500/10 px-4 py-3">
            <TrophyIcon className="size-6 text-yellow-500" />
            <span className="text-lg font-bold text-yellow-500">
              {champion}
            </span>
            <TrophyIcon className="size-6 text-yellow-500" />
          </div>
        )}

        {/* Bracket display */}
        {matches.length > 0 && (
          <div className="overflow-x-auto pb-4">
            <div
              ref={bracketRef}
              className="flex gap-0 min-w-max p-4"
            >
              {rounds.map((roundMatches, roundIndex) => (
                <div key={roundIndex} className="flex flex-col">
                  {/* Round header */}
                  <div className="text-center text-xs font-semibold text-muted-foreground mb-3 px-2">
                    {roundLabel(roundIndex)}
                  </div>

                  {/* Matches */}
                  <div
                    className="flex flex-col flex-1 justify-around"
                    style={{
                      gap: `${Math.pow(2, roundIndex) * 8}px`,
                    }}
                  >
                    {roundMatches.map((match) => (
                      <div key={match.id} className="flex items-center">
                        {/* Match box */}
                        <div className="w-40 shrink-0">
                          <MatchBox
                            match={match}
                            isFinal={roundIndex === totalRounds - 1}
                            onSelectWinner={handleSelectWinner}
                          />
                        </div>

                        {/* Connector lines (not for final round) */}
                        {roundIndex < totalRounds - 1 && (
                          <ConnectorLines position={match.position} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// MatchBox
// ---------------------------------------------------------------------------

function MatchBox({
  match,
  isFinal,
  onSelectWinner,
}: {
  match: Match
  isFinal: boolean
  onSelectWinner: (matchId: number, winner: string) => void
}) {
  const [top, bottom] = match.participants
  const canSelect =
    top !== null && bottom !== null && top !== BYE && bottom !== BYE

  return (
    <div
      className={`rounded-md border overflow-hidden ${
        isFinal && match.winner
          ? "border-yellow-500 ring-2 ring-yellow-500/30"
          : "border-border"
      }`}
    >
      <ParticipantSlot
        name={top}
        isWinner={match.winner === top && top !== null}
        isBye={top === BYE}
        canClick={canSelect && top !== null && match.winner !== top}
        onClick={() => {
          if (top && canSelect) onSelectWinner(match.id, top)
        }}
        position="top"
      />
      <div className="h-px bg-border" />
      <ParticipantSlot
        name={bottom}
        isWinner={match.winner === bottom && bottom !== null}
        isBye={bottom === BYE}
        canClick={canSelect && bottom !== null && match.winner !== bottom}
        onClick={() => {
          if (bottom && canSelect) onSelectWinner(match.id, bottom)
        }}
        position="bottom"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// ParticipantSlot
// ---------------------------------------------------------------------------

function ParticipantSlot({
  name,
  isWinner,
  isBye,
  canClick,
  onClick,
  position: _position,
}: {
  name: string | null
  isWinner: boolean
  isBye: boolean
  canClick: boolean
  onClick: () => void
  position: "top" | "bottom"
}) {
  const base = "px-2 py-1.5 text-xs truncate transition-colors"
  const winnerClass = isWinner
    ? "bg-primary/20 text-primary font-bold"
    : ""
  const byeClass = isBye ? "text-muted-foreground/40 italic" : ""
  const emptyClass = name === null ? "text-muted-foreground/30" : ""
  const clickClass =
    canClick && !isWinner
      ? "cursor-pointer hover:bg-accent/50 active:bg-accent"
      : ""

  return (
    <div
      className={`${base} ${winnerClass} ${byeClass} ${emptyClass} ${clickClass}`}
      onClick={canClick ? onClick : undefined}
      role={canClick ? "button" : undefined}
      tabIndex={canClick ? 0 : undefined}
      onKeyDown={
        canClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick()
            }
          : undefined
      }
    >
      {name ?? "TBD"}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ConnectorLines
// ---------------------------------------------------------------------------

function ConnectorLines({ position }: { position: number }) {
  const isTop = position % 2 === 0

  return (
    <div className="w-6 h-full flex flex-col justify-center relative">
      <div
        className={`absolute left-0 right-1/2 ${
          isTop ? "top-1/2 border-t border-r rounded-tr" : "bottom-1/2 border-b border-r rounded-br"
        } border-border h-1/2`}
      />
      <div className="absolute right-0 left-1/2 top-1/2 border-t border-border" />
    </div>
  )
}
