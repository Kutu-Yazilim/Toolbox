"use client"

import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { DicesIcon, Trash2Icon } from "lucide-react"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useShareableUrl } from "@/hooks/useShareableUrl"
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { DICE_ROLLER_PRESETS } from "./presets"
import { type Preset } from "@/components/shared/PresetsDrawer"

const DICE_TYPES = [4, 6, 8, 10, 12, 20, 100] as const
type DiceType = (typeof DICE_TYPES)[number]

const MAX_DICE_COUNT = 20
const MAX_HISTORY = 20
const ROLL_ANIMATION_MS = 500

type DiceSettings = { diceType: DiceType; diceCount: number; modifier: number }

type RollEntry = {
  diceType: DiceType
  count: number
  modifier: number
  results: number[]
  total: number
  timestamp: number
}

function secureRandom(max: number): number {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return (array[0] % max) + 1
}

export function DiceRoller() {
  const [settings, setSettings] = useLocalStorage<DiceSettings>("dice-roller-settings", { diceType: 20, diceCount: 1, modifier: 0 })
  const [isRolling, setIsRolling] = useState(false)
  const [currentResults, setCurrentResults] = useState<number[] | null>(null)
  const [history, setHistory] = useState<RollEntry[]>([])

  const { diceType, diceCount, modifier } = settings

  const shareState = useMemo(() => settings, [settings])
  const { shareUrl } = useShareableUrl("dice-roller", shareState, useCallback((state: DiceSettings) => {
    setSettings(state)
  }, [setSettings]))

  const roll = useCallback(() => {
    if (isRolling) return
    setIsRolling(true)
    setCurrentResults(null)
    setTimeout(() => {
      const results: number[] = []
      for (let i = 0; i < diceCount; i++) results.push(secureRandom(diceType))
      const total = results.reduce((a, b) => a + b, 0) + modifier
      setCurrentResults(results)
      setIsRolling(false)
      setHistory((prev) => [{ diceType, count: diceCount, modifier, results, total, timestamp: Date.now() }, ...prev.slice(0, MAX_HISTORY - 1)])
    }, ROLL_ANIMATION_MS)
  }, [isRolling, diceType, diceCount, modifier])

  const currentTotal = currentResults !== null ? currentResults.reduce((a, b) => a + b, 0) + modifier : null

  const resultsText = useMemo(() => {
    if (!currentResults) return ""
    return `${diceCount}d${diceType}${modifier !== 0 ? (modifier > 0 ? `+${modifier}` : modifier) : ""}: [${currentResults.join(", ")}] = ${currentTotal}`
  }, [currentResults, diceCount, diceType, modifier, currentTotal])

  const handlePresetSelect = useCallback((preset: Preset) => {
    const data = JSON.parse(preset.content)
    setSettings({ diceType: data.diceType, diceCount: data.diceCount, modifier: data.modifier })
  }, [setSettings])

  const shortcuts: Shortcut[] = useMemo(() => [
    { key: "mod+enter", label: "Roll dice", action: roll },
    { key: "mod+shift+r", label: "Clear history", action: () => setHistory([]) },
  ], [roll])

  useKeyboardShortcuts(shortcuts)

  const exportOptions = useMemo(() => [
    { label: "Copy result", action: () => navigator.clipboard.writeText(resultsText) },
    { label: "Copy history", action: () => navigator.clipboard.writeText(history.map(e => `${e.count}d${e.diceType}${e.modifier !== 0 ? (e.modifier > 0 ? `+${e.modifier}` : e.modifier) : ""}: [${e.results.join(", ")}] = ${e.total}`).join("\n")) },
  ], [resultsText, history])

  return (
    <div className="h-full flex flex-col min-h-0">
      <ToolToolbar
        title="Dice Roller"
        status={currentTotal !== null ? { type: "success", label: `Total: ${currentTotal}` } : null}
        copyValue={resultsText || undefined}
        onShare={shareUrl}
        exportOptions={currentResults ? exportOptions : undefined}
        presets={DICE_ROLLER_PRESETS}
        onPresetSelect={handlePresetSelect}
        shortcuts={shortcuts}
      />
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Dice Type</label>
            <div className="flex flex-wrap gap-1">
              {DICE_TYPES.map((d) => (
                <Button key={d} variant={diceType === d ? "default" : "outline"} size="sm" onClick={() => setSettings(prev => ({ ...prev, diceType: d }))}>d{d}</Button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Count</label>
              <input type="number" min={1} max={MAX_DICE_COUNT} value={diceCount} onChange={(e) => setSettings(prev => ({ ...prev, diceCount: Math.max(1, Math.min(MAX_DICE_COUNT, Number(e.target.value) || 1)) }))} className="w-24 h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Modifier</label>
              <input type="number" value={modifier} onChange={(e) => setSettings(prev => ({ ...prev, modifier: Number(e.target.value) || 0 }))} className="w-24 h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={roll} disabled={isRolling} size="lg"><DicesIcon className="size-5" />{isRolling ? "Rolling..." : "Roll"}</Button>
            <span className="text-xs text-muted-foreground">or press Space</span>
          </div>

          <div className="min-h-[120px] flex flex-col items-center justify-center gap-4">
            {isRolling && (
              <div className="flex flex-wrap justify-center gap-2">
                {Array.from({ length: diceCount }).map((_, i) => (
                  <div key={i} className="w-12 h-12 rounded-lg border border-border bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground animate-bounce" style={{ animationDelay: `${i * 50}ms` }}>?</div>
                ))}
              </div>
            )}
            {!isRolling && currentResults !== null && (
              <>
                <div className="flex flex-wrap justify-center gap-2">
                  {currentResults.map((r, i) => (
                    <div key={i} className="w-12 h-12 rounded-lg border border-border bg-card flex items-center justify-center text-lg font-bold text-foreground shadow-sm">{r}</div>
                  ))}
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">{currentTotal}</div>
                  {modifier !== 0 && <div className="text-sm text-muted-foreground">{currentResults.reduce((a, b) => a + b, 0)} {modifier > 0 ? "+" : ""}{modifier} = {currentTotal}</div>}
                </div>
              </>
            )}
            {!isRolling && currentResults === null && (
              <div className="text-muted-foreground text-sm">Roll {diceCount}d{diceType}{modifier !== 0 ? (modifier > 0 ? `+${modifier}` : modifier) : ""}</div>
            )}
          </div>

          {history.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">Roll History</h3>
                <Button variant="ghost" size="xs" onClick={() => setHistory([])}><Trash2Icon className="size-3" />Clear</Button>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {history.map((entry, i) => (
                  <div key={`${entry.timestamp}-${i}`} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card text-sm">
                    <span className="font-medium text-foreground shrink-0">{entry.count}d{entry.diceType}{entry.modifier !== 0 ? entry.modifier > 0 ? `+${entry.modifier}` : entry.modifier : ""}</span>
                    <span className="text-muted-foreground truncate">[{entry.results.join(", ")}]</span>
                    <span className="font-bold text-foreground ml-auto shrink-0">= {entry.total}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
