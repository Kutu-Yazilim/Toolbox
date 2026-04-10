"use client"

import { useState, useMemo, useCallback } from "react"
import {
  CopyIcon,
  CheckIcon,
  XIcon,
  PlusIcon,
  AlertTriangleIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useShareableUrl } from "@/hooks/useShareableUrl"
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { type Preset } from "@/components/shared/PresetsDrawer"
import { type ExportOption } from "@/components/shared/ExportMenu"
import { CSP_PRESETS } from "./cspPresets"

// ─── Types & Constants ──────────────────────────────────────────────────────

type DirectiveConfig = {
  name: string
  isFlag: boolean
}

type DirectiveState = {
  enabled: boolean
  sources: string[]
}

const DIRECTIVES: DirectiveConfig[] = [
  { name: "default-src", isFlag: false },
  { name: "script-src", isFlag: false },
  { name: "style-src", isFlag: false },
  { name: "img-src", isFlag: false },
  { name: "font-src", isFlag: false },
  { name: "connect-src", isFlag: false },
  { name: "media-src", isFlag: false },
  { name: "object-src", isFlag: false },
  { name: "frame-src", isFlag: false },
  { name: "base-uri", isFlag: false },
  { name: "form-action", isFlag: false },
  { name: "frame-ancestors", isFlag: false },
  { name: "upgrade-insecure-requests", isFlag: true },
  { name: "block-all-mixed-content", isFlag: true },
]

const QUICK_SOURCES = [
  "'self'",
  "'none'",
  "'unsafe-inline'",
  "'unsafe-eval'",
  "'strict-dynamic'",
  "https:",
  "data:",
  "blob:",
] as const

function buildInitialState(): Record<string, DirectiveState> {
  const state: Record<string, DirectiveState> = {}
  for (const d of DIRECTIVES) {
    state[d.name] = {
      enabled: d.name === "default-src",
      sources: d.name === "default-src" ? ["'self'"] : [],
    }
  }
  return state
}

// ─── Validation ─────────────────────────────────────────────────────────────

type Warning = {
  message: string
}

function getWarnings(directives: Record<string, DirectiveState>): Warning[] {
  const warnings: Warning[] = []

  if (!directives["default-src"].enabled || directives["default-src"].sources.length === 0) {
    warnings.push({ message: "No default-src is set — browsers will have no fallback policy" })
  }

  const scriptSrc = directives["script-src"]
  if (scriptSrc.enabled && scriptSrc.sources.includes("'unsafe-inline'")) {
    warnings.push({
      message: "'unsafe-inline' in script-src allows inline scripts, weakening CSP protection",
    })
  }

  for (const [name, state] of Object.entries(directives)) {
    if (state.enabled && state.sources.includes("'unsafe-eval'")) {
      warnings.push({
        message: `'unsafe-eval' in ${name} allows eval(), which is a security risk`,
      })
    }
  }

  return warnings
}

// ─── Component ──────────────────────────────────────────────────────────────

function parseCspString(csp: string): Record<string, DirectiveState> {
  const state = buildInitialState()
  if (!csp.trim()) return state
  const parts = csp.split(";").map((s) => s.trim()).filter(Boolean)
  for (const part of parts) {
    const tokens = part.split(/\s+/)
    const name = tokens[0]
    const sources = tokens.slice(1)
    const config = DIRECTIVES.find((d) => d.name === name)
    if (config) {
      state[name] = { enabled: true, sources: config.isFlag ? [] : sources }
    }
  }
  return state
}

export function CspHeaderBuilder() {
  const [directives, setDirectives] = useState<Record<string, DirectiveState>>(buildInitialState)
  const [copied, setCopied] = useState(false)
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({})

  const cspHeader = useMemo(() => {
    const parts: string[] = []
    for (const d of DIRECTIVES) {
      const state = directives[d.name]
      if (!state.enabled) continue
      if (d.isFlag) {
        parts.push(d.name)
      } else if (state.sources.length > 0) {
        parts.push(`${d.name} ${state.sources.join(" ")}`)
      }
    }
    return parts.join("; ")
  }, [directives])

  const warnings = useMemo(() => getWarnings(directives), [directives])

  const toggleDirective = useCallback((name: string) => {
    setDirectives((prev) => ({
      ...prev,
      [name]: { ...prev[name], enabled: !prev[name].enabled },
    }))
  }, [])

  const addSource = useCallback((directiveName: string, source: string) => {
    setDirectives((prev) => {
      const current = prev[directiveName]
      if (current.sources.includes(source)) return prev
      return {
        ...prev,
        [directiveName]: { ...current, sources: [...current.sources, source] },
      }
    })
  }, [])

  const removeSource = useCallback((directiveName: string, source: string) => {
    setDirectives((prev) => {
      const current = prev[directiveName]
      return {
        ...prev,
        [directiveName]: {
          ...current,
          sources: current.sources.filter((s) => s !== source),
        },
      }
    })
  }, [])

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(cspHeader)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [cspHeader])

  const handleCustomAdd = useCallback(
    (directiveName: string) => {
      const value = (customInputs[directiveName] ?? "").trim()
      if (!value) return
      addSource(directiveName, value)
      setCustomInputs((prev) => ({ ...prev, [directiveName]: "" }))
    },
    [customInputs, addSource],
  )

  const { shareUrl } = useShareableUrl("csp-builder", { csp: cspHeader }, (restored) => {
    const s = restored as { csp: string }
    setDirectives(parseCspString(s.csp))
  })

  const handlePresetSelect = useCallback((preset: Preset) => {
    setDirectives(parseCspString(preset.content))
  }, [])

  const exportOptions = useMemo<ExportOption[]>(() => [
    { label: "Copy Header", action: () => navigator.clipboard.writeText(cspHeader) },
    { label: "Copy as Meta Tag", action: () => navigator.clipboard.writeText(`<meta http-equiv="Content-Security-Policy" content="${cspHeader}">`) },
    { label: "Download .txt", action: () => {
      const blob = new Blob([cspHeader], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url; a.download = "csp-header.txt"; a.click()
      URL.revokeObjectURL(url)
    }},
  ], [cspHeader])

  const shortcuts = useMemo<Shortcut[]>(() => [
    { key: "mod+shift+c", label: "Copy Header", action: copyToClipboard },
  ], [copyToClipboard])

  useKeyboardShortcuts(shortcuts)

  return (
    <div className="flex h-full flex-col min-h-0">
      <ToolToolbar
        title="CSP Header Builder"
        status={warnings.length > 0 ? { type: "error", label: `${warnings.length} warning(s)` } : cspHeader ? { type: "success", label: `${cspHeader.length} chars` } : null}
        copyValue={cspHeader || undefined}
        onShare={shareUrl}
        exportOptions={exportOptions}
        presets={CSP_PRESETS}
        onPresetSelect={handlePresetSelect}
        shortcuts={shortcuts}
      />
      <div className="flex flex-col gap-4 p-4 flex-1 overflow-y-auto">
      {/* ── Header preview ───────────────────────────────────────── */}
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            CSP Header Preview
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {cspHeader.length} chars
            </span>
            <Button variant="ghost" size="sm" onClick={copyToClipboard} className="h-7 gap-1.5">
              {copied ? (
                <>
                  <CheckIcon className="h-3.5 w-3.5 text-green-400" />
                  <span className="text-xs">Copied</span>
                </>
              ) : (
                <>
                  <CopyIcon className="h-3.5 w-3.5" />
                  <span className="text-xs">Copy</span>
                </>
              )}
            </Button>
          </div>
        </div>
        <pre className="whitespace-pre-wrap break-all rounded-md bg-muted/40 p-3 font-mono text-sm text-foreground">
          {cspHeader || "No directives enabled"}
        </pre>
      </div>

      {/* ── Warnings ─────────────────────────────────────────────── */}
      {warnings.length > 0 && (
        <div className="flex flex-col gap-1.5 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-yellow-500">
              <AlertTriangleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{w.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Directive cards ──────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {DIRECTIVES.map((d) => {
          const state = directives[d.name]
          return (
            <div key={d.name} className="rounded-lg border border-border p-3">
              <div className="flex items-center gap-3">
                {/* Toggle */}
                <button
                  onClick={() => toggleDirective(d.name)}
                  className={cn(
                    "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                    state.enabled ? "bg-primary" : "bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                      state.enabled && "translate-x-4",
                    )}
                  />
                </button>
                <span
                  className={cn(
                    "font-mono text-sm font-medium",
                    state.enabled ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {d.name}
                </span>
                {d.isFlag && (
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    flag
                  </span>
                )}
              </div>

              {/* Source controls — only for non-flag, enabled directives */}
              {state.enabled && !d.isFlag && (
                <div className="mt-3 flex flex-col gap-2">
                  {/* Source chips */}
                  {state.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {state.sources.map((source) => (
                        <span
                          key={source}
                          className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary"
                        >
                          {source}
                          <button
                            onClick={() => removeSource(d.name, source)}
                            className="rounded-sm p-0.5 hover:bg-primary/20"
                          >
                            <XIcon className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Quick-add buttons */}
                  <div className="flex flex-wrap gap-1">
                    {QUICK_SOURCES.map((source) => (
                      <button
                        key={source}
                        onClick={() => addSource(d.name, source)}
                        disabled={state.sources.includes(source)}
                        className={cn(
                          "rounded-md border px-2 py-0.5 font-mono text-xs transition-colors",
                          state.sources.includes(source)
                            ? "border-transparent bg-muted/50 text-muted-foreground/40 cursor-default"
                            : "border-border bg-muted text-muted-foreground hover:border-muted-foreground hover:text-foreground",
                        )}
                      >
                        {source}
                      </button>
                    ))}
                  </div>

                  {/* Custom source input */}
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={customInputs[d.name] ?? ""}
                      onChange={(e) =>
                        setCustomInputs((prev) => ({
                          ...prev,
                          [d.name]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCustomAdd(d.name)
                      }}
                      placeholder="*.example.com"
                      className="h-7 flex-1 rounded-md border border-border bg-background px-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-ring focus:outline-none"
                    />
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleCustomAdd(d.name)}
                    >
                      <PlusIcon className="h-3 w-3" />
                      Add
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      </div>
    </div>
  )
}
