"use client"

import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ShuffleIcon, CopyIcon, CheckIcon, UsersRoundIcon, SparklesIcon } from "lucide-react"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useShareableUrl } from "@/hooks/useShareableUrl"
import { useFileImport } from "@/hooks/useFileImport"
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { TEAM_SHUFFLER_PRESETS } from "./presets"
import { type Preset } from "@/components/shared/PresetsDrawer"

const TEAM_COLORS = ["#3b82f6","#ef4444","#22c55e","#f59e0b","#8b5cf6","#ec4899","#14b8a6","#f97316","#06b6d4","#84cc16"] as const

const EXAMPLE_NAMES = ["Alice","Bob","Charlie","Diana","Eve","Frank","Grace","Hank","Ivy","Jack","Karen","Leo"]

const MIN_TEAMS = 2
const MAX_TEAMS = 20
const SHUFFLE_ANIMATION_MS = 400

type Team = { name: string; members: string[]; color: string }
type ShufflerSettings = { input: string; teamCount: number }

function fisherYatesShuffle<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const randomBytes = new Uint32Array(1); crypto.getRandomValues(randomBytes)
    const j = randomBytes[0] % (i + 1); [result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function distributeIntoTeams(names: string[], teamCount: number): Team[] {
  const shuffled = fisherYatesShuffle(names)
  const teams: Team[] = Array.from({ length: teamCount }, (_, i) => ({ name: `Team ${i + 1}`, members: [], color: TEAM_COLORS[i % TEAM_COLORS.length] }))
  for (let i = 0; i < shuffled.length; i++) teams[i % teamCount].members.push(shuffled[i])
  return teams
}

function formatTeamsAsText(teams: Team[]): string {
  return teams.map((team) => `${team.name} (${team.members.length})\n${team.members.map((m) => `  - ${m}`).join("\n")}`).join("\n\n")
}

export function TeamShuffler() {
  const [settings, setSettings] = useLocalStorage<ShufflerSettings>("team-shuffler-settings", { input: "", teamCount: 2 })
  const [teams, setTeams] = useState<Team[]>([])
  const [isShuffling, setIsShuffling] = useState(false)
  const [copied, setCopied] = useState(false)

  const { input, teamCount } = settings
  const names = input.split("\n").map((n) => n.trim()).filter(Boolean)
  const canShuffle = names.length >= teamCount && teamCount >= MIN_TEAMS

  const shareState = useMemo(() => ({ input, teamCount }), [input, teamCount])
  const { shareUrl } = useShareableUrl("team-shuffler", shareState, useCallback((state: ShufflerSettings) => { setSettings(state) }, [setSettings]))

  const { dropzoneProps, openFilePicker, isDragging } = useFileImport({
    accept: [".txt", ".csv"],
    onImport: (content) => { setSettings(prev => ({ ...prev, input: content })); setTeams([]) },
  })

  const shuffle = useCallback(() => {
    if (isShuffling) return
    const parsed = input.split("\n").map((n) => n.trim()).filter(Boolean)
    if (parsed.length < teamCount) return
    setIsShuffling(true); setTeams([])
    setTimeout(() => { setTeams(distributeIntoTeams(parsed, teamCount)); setIsShuffling(false) }, SHUFFLE_ANIMATION_MS)
  }, [isShuffling, input, teamCount])

  const handleCopy = useCallback(() => {
    if (teams.length === 0) return
    navigator.clipboard.writeText(formatTeamsAsText(teams)).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })
  }, [teams])

  const loadExample = useCallback(() => { setSettings(prev => ({ ...prev, input: EXAMPLE_NAMES.join("\n") })); setTeams([]) }, [setSettings])

  const handlePresetSelect = useCallback((preset: Preset) => {
    const data = JSON.parse(preset.content)
    setSettings({ input: data.names, teamCount: data.teamCount })
    setTeams([])
  }, [setSettings])

  const teamsText = useMemo(() => teams.length > 0 ? formatTeamsAsText(teams) : "", [teams])

  const shortcuts: Shortcut[] = useMemo(() => [
    { key: "mod+enter", label: "Shuffle teams", action: shuffle },
    { key: "mod+shift+c", label: "Copy results", action: handleCopy },
    { key: "mod+o", label: "Import names file", action: openFilePicker },
  ], [shuffle, handleCopy, openFilePicker])

  useKeyboardShortcuts(shortcuts)

  const exportOptions = useMemo(() => [
    { label: "Copy all teams", action: handleCopy },
    { label: "Download as .txt", action: () => {
      const blob = new Blob([teamsText], { type: "text/plain" })
      const url = URL.createObjectURL(blob); const a = document.createElement("a")
      a.href = url; a.download = "team-shuffle.txt"; a.click(); URL.revokeObjectURL(url)
    }},
  ], [handleCopy, teamsText])

  return (
    <div className="h-full flex flex-col min-h-0">
      <ToolToolbar
        title="Team Shuffler"
        status={teams.length > 0 ? { type: "success", label: `${teams.length} teams created` } : null}
        copyValue={teamsText || undefined}
        onShare={shareUrl}
        exportOptions={teams.length > 0 ? exportOptions : undefined}
        presets={TEAM_SHUFFLER_PRESETS}
        onPresetSelect={handlePresetSelect}
        shortcuts={shortcuts}
      />
      <div className="flex-1 overflow-auto p-4 space-y-4" {...dropzoneProps}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Names (one per line)</label>
              <span className="text-xs text-muted-foreground">{names.length} name{names.length !== 1 ? "s" : ""}</span>
            </div>
            <textarea value={input} onChange={(e) => { setSettings(prev => ({ ...prev, input: e.target.value })); setTeams([]) }} placeholder={"Alice\nBob\nCharlie\n..."} rows={8} className={`w-full rounded-md border bg-muted/50 px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y ${isDragging ? "ring-2 ring-primary" : ""}`} />
          </div>
          <div className="flex flex-col gap-3 lg:w-48">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Number of teams</label>
              <input type="number" min={MIN_TEAMS} max={MAX_TEAMS} value={teamCount} onChange={(e) => { setSettings(prev => ({ ...prev, teamCount: Math.max(MIN_TEAMS, Math.min(MAX_TEAMS, Number(e.target.value) || MIN_TEAMS)) })); setTeams([]) }} className="w-full rounded-md border bg-muted/50 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <Button onClick={shuffle} disabled={!canShuffle || isShuffling}><ShuffleIcon className="size-4" />{teams.length > 0 ? "Re-shuffle" : "Shuffle"}</Button>
            <Button variant="outline" onClick={loadExample}><SparklesIcon className="size-4" />Load Example</Button>
            {teams.length > 0 && (
              <Button variant="outline" onClick={handleCopy}>{copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}{copied ? "Copied!" : "Copy All"}</Button>
            )}
          </div>
        </div>

        {isShuffling && (
          <div className="flex items-center justify-center py-12">
            <div className="grid grid-cols-4 gap-2 animate-pulse">
              {names.slice(0, 12).map((name, i) => (
                <span key={i} className="px-3 py-1 rounded-full text-xs font-medium text-white animate-bounce" style={{ backgroundColor: TEAM_COLORS[i % TEAM_COLORS.length], animationDelay: `${i * 50}ms`, animationDuration: "300ms" }}>{name}</span>
              ))}
            </div>
          </div>
        )}

        {!isShuffling && teams.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><UsersRoundIcon className="size-4" /><span>{names.length} people into {teams.length} teams</span></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {teams.map((team, i) => (
                <div key={i} className="rounded-lg border bg-card overflow-hidden">
                  <div className="px-3 py-2 flex items-center justify-between" style={{ backgroundColor: team.color }}>
                    <span className="text-sm font-semibold text-white">{team.name}</span>
                    <span className="text-xs text-white/80">{team.members.length}</span>
                  </div>
                  <ul className="p-3 space-y-1">
                    {team.members.map((member, j) => (
                      <li key={j} className="text-sm text-foreground flex items-center gap-2"><span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: team.color }} />{member}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
