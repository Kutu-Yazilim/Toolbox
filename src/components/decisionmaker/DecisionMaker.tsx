"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ZapIcon, Trash2Icon } from "lucide-react"
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { DECISION_MAKER_PRESETS } from "./presets"
import { type Preset } from "@/components/shared/PresetsDrawer"

type ConfettiParticle = { id: number; x: number; y: number; rotation: number; size: number; color: string; shape: "square" | "circle" }
type Decision = { question: string; answer: "YES" | "NO"; timestamp: number }

const CONFETTI_COLORS = ["#ff4757","#ff6b81","#ffa502","#ffda79","#2ed573","#7bed9f","#1e90ff","#70a1ff","#5352ed","#a29bfe","#ff6348","#eccc68"]

function generateConfetti(): ConfettiParticle[] {
  const particles: ConfettiParticle[] = []
  for (let i = 0; i < 40; i++) {
    const angle = Math.random() * Math.PI * 2; const distance = 200 + Math.random() * 400
    particles.push({ id: i, x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, rotation: Math.random() * 720, size: 6 + Math.random() * 6, color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)], shape: Math.random() > 0.5 ? "square" : "circle" })
  }
  return particles
}

function cryptoRandom(): boolean { const arr = new Uint32Array(1); crypto.getRandomValues(arr); return arr[0] % 2 === 0 }

export function DecisionMaker() {
  const [question, setQuestion] = useState("")
  const [showOverlay, setShowOverlay] = useState(false)
  const [cyclingText, setCyclingText] = useState<"YES" | "NO" | null>(null)
  const [finalAnswer, setFinalAnswer] = useState<"YES" | "NO" | null>(null)
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([])
  const [history, setHistory] = useState<Decision[]>([])
  const [isRevealing, setIsRevealing] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { return () => { if (intervalRef.current) clearInterval(intervalRef.current); if (timeoutRef.current) clearTimeout(timeoutRef.current) } }, [])

  const dismiss = useCallback(() => { setShowOverlay(false); setCyclingText(null); setFinalAnswer(null); setConfetti([]); setIsRevealing(false); if (intervalRef.current) clearInterval(intervalRef.current); if (timeoutRef.current) clearTimeout(timeoutRef.current) }, [])

  const decide = useCallback(() => {
    if (!question.trim()) return
    const answer: "YES" | "NO" = cryptoRandom() ? "YES" : "NO"
    setShowOverlay(true); setIsRevealing(true); setFinalAnswer(null); setConfetti([])
    let count = 0; const maxCycles = 30; let currentDelay = 50

    const cycle = () => {
      count++; setCyclingText((prev) => (prev === "YES" ? "NO" : "YES"))
      if (count >= maxCycles) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setCyclingText(answer)
        timeoutRef.current = setTimeout(() => {
          setFinalAnswer(answer); setCyclingText(null); setConfetti(generateConfetti()); setIsRevealing(false)
          setHistory((prev) => [{ question: question.trim(), answer, timestamp: Date.now() }, ...prev])
        }, 200); return
      }
      if (count > 20) currentDelay = 50 + (count - 20) * 30
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = setInterval(cycle, currentDelay)
    }
    setCyclingText("YES"); intervalRef.current = setInterval(cycle, currentDelay)
  }, [question])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => { if (e.key === "Enter") decide() }, [decide])

  const handlePresetSelect = useCallback((preset: Preset) => {
    const data = JSON.parse(preset.content)
    if (data.question) setQuestion(data.question)
  }, [])

  const historyText = useMemo(() => history.map(d => `Q: ${d.question} -> ${d.answer}`).join("\n"), [history])

  const shortcuts: Shortcut[] = useMemo(() => [
    { key: "mod+enter", label: "Decide", action: decide },
    { key: "mod+shift+r", label: "Clear history", action: () => setHistory([]) },
  ], [decide])

  useKeyboardShortcuts(shortcuts)

  const exportOptions = useMemo(() => [
    { label: "Copy history", action: () => navigator.clipboard.writeText(historyText) },
    { label: "Download as .txt", action: () => {
      const blob = new Blob([historyText], { type: "text/plain" })
      const url = URL.createObjectURL(blob); const a = document.createElement("a")
      a.href = url; a.download = "decisions.txt"; a.click(); URL.revokeObjectURL(url)
    }},
  ], [historyText])

  return (
    <div className="h-full flex flex-col min-h-0">
      <ToolToolbar
        title="Decision Maker"
        status={finalAnswer ? { type: finalAnswer === "YES" ? "success" : "error", label: finalAnswer } : null}
        copyValue={finalAnswer ?? undefined}
        exportOptions={history.length > 0 ? exportOptions : undefined}
        presets={DECISION_MAKER_PRESETS}
        onPresetSelect={handlePresetSelect}
        shortcuts={shortcuts}
      />
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 p-6 gap-6">
          <div className="flex items-center gap-2 text-foreground">
            <ZapIcon className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Decision Maker</h1>
          </div>

          <p className="text-muted-foreground text-center max-w-md">
            Ask a yes/no question and let fate decide. Brace yourself for the answer.
          </p>

          <div className="w-full max-w-lg flex flex-col gap-4">
            <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={handleKeyDown} placeholder="Should I adopt that cat?" className="w-full px-4 py-3 rounded-lg bg-muted/30 text-foreground border border-border placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-lg" />
            <Button onClick={decide} disabled={!question.trim()} className="w-full text-lg py-6"><ZapIcon className="w-5 h-5 mr-2" />Decide</Button>
          </div>
        </div>

        {history.length > 0 && (
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-border bg-muted/30 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">History ({history.length})</h2>
              <Button variant="ghost" size="sm" onClick={() => setHistory([])} className="text-muted-foreground hover:text-foreground"><Trash2Icon className="w-4 h-4" /></Button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {history.map((d) => (
                <div key={d.timestamp} className="rounded-lg bg-background border border-border p-3">
                  <p className="text-sm text-foreground truncate">{d.question}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-bold" style={{ color: d.answer === "YES" ? "#22c55e" : "#ef4444" }}>{d.answer}</span>
                    <span className="text-xs text-muted-foreground">{new Date(d.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showOverlay && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-300" style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }} onClick={finalAnswer ? dismiss : undefined}>
            {isRevealing && cyclingText && <span className="text-7xl md:text-9xl font-black select-none" style={{ color: cyclingText === "YES" ? "#22c55e" : "#ef4444", textShadow: `0 0 40px ${cyclingText === "YES" ? "#22c55e" : "#ef4444"}` }}>{cyclingText}</span>}
            {finalAnswer && (
              <>
                <span className="text-8xl md:text-[12rem] font-black select-none animate-scale-in" style={{ color: finalAnswer === "YES" ? "#22c55e" : "#ef4444", textShadow: `0 0 60px ${finalAnswer === "YES" ? "#22c55e" : "#ef4444"}, 0 0 120px ${finalAnswer === "YES" ? "#22c55e40" : "#ef444440"}` }}>{finalAnswer}</span>
                <p className="text-white/60 text-lg mt-4 max-w-md text-center px-4">&ldquo;{history[0]?.question}&rdquo;</p>
                {confetti.map((p) => (
                  <div key={p.id} className="absolute pointer-events-none" style={{ left: "50%", top: "50%", width: p.size, height: p.size, backgroundColor: p.color, borderRadius: p.shape === "circle" ? "50%" : "2px", animation: `confetti-burst 1.5s ease-out forwards`, ["--cx" as string]: `${p.x}px`, ["--cy" as string]: `${p.y}px`, ["--cr" as string]: `${p.rotation}deg` }} />
                ))}
                <Button onClick={(e) => { e.stopPropagation(); dismiss() }} variant="outline" className="mt-8 text-white border-white/30 hover:bg-white/10 hover:text-white">Ask Again</Button>
                <p className="text-white/30 text-sm mt-3">Click anywhere to dismiss</p>
              </>
            )}
          </div>
        )}

        <style>{`
          @keyframes confetti-burst { 0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); opacity: 1; } 100% { transform: translate(calc(-50% + var(--cx)), calc(-50% + var(--cy))) rotate(var(--cr)) scale(0.5); opacity: 0; } }
          @keyframes scale-in { 0% { transform: scale(0.3); opacity: 0; } 50% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
          .animate-scale-in { animation: scale-in 0.4s ease-out forwards; }
        `}</style>
      </div>
    </div>
  )
}
