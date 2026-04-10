"use client"

import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  SearchIcon,
  GlobeIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  InfoIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useShareableUrl } from "@/hooks/useShareableUrl"
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { type Preset } from "@/components/shared/PresetsDrawer"
import { type ExportOption } from "@/components/shared/ExportMenu"
import { HEADERS_PRESETS } from "./headersPresets"

// TODO: Replace mock data with real backend API calls when available.
// Browser-side JS cannot fetch arbitrary URLs' response headers due to
// CORS restrictions. A backend proxy endpoint is required for live inspection.

type HeaderEntry = {
  name: string
  value: string
}

type SecurityCheck = {
  name: string
  header: string
  description: string
  present: boolean
}

const MOCK_HEADERS: HeaderEntry[] = [
  { name: "Content-Type", value: "text/html; charset=UTF-8" },
  { name: "Content-Length", value: "1256" },
  { name: "Server", value: "nginx/1.24.0" },
  { name: "Date", value: "Sun, 23 Mar 2026 12:00:00 GMT" },
  { name: "Cache-Control", value: "public, max-age=3600, must-revalidate" },
  { name: "X-Frame-Options", value: "SAMEORIGIN" },
  { name: "X-Content-Type-Options", value: "nosniff" },
  {
    name: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  {
    name: "Content-Security-Policy",
    value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:",
  },
  { name: "X-XSS-Protection", value: "1; mode=block" },
  { name: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    name: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
  { name: "ETag", value: '"5f3b8c2a-4e8"' },
  { name: "Connection", value: "keep-alive" },
  { name: "Vary", value: "Accept-Encoding" },
]

const SECURITY_HEADERS: string[] = [
  "Strict-Transport-Security",
  "X-Frame-Options",
  "X-Content-Type-Options",
  "Content-Security-Policy",
  "Referrer-Policy",
  "Permissions-Policy",
]

function getSecurityChecks(headers: HeaderEntry[]): SecurityCheck[] {
  const headerNames = new Set(headers.map((h) => h.name.toLowerCase()))

  return [
    {
      name: "HSTS",
      header: "Strict-Transport-Security",
      description: "Enforces HTTPS connections and prevents protocol downgrade attacks",
      present: headerNames.has("strict-transport-security"),
    },
    {
      name: "X-Frame-Options",
      header: "X-Frame-Options",
      description: "Prevents clickjacking by controlling iframe embedding",
      present: headerNames.has("x-frame-options"),
    },
    {
      name: "X-Content-Type-Options",
      header: "X-Content-Type-Options",
      description: "Prevents MIME-type sniffing attacks",
      present: headerNames.has("x-content-type-options"),
    },
    {
      name: "Content Security Policy",
      header: "Content-Security-Policy",
      description: "Controls which resources the browser is allowed to load",
      present: headerNames.has("content-security-policy"),
    },
    {
      name: "Referrer Policy",
      header: "Referrer-Policy",
      description: "Controls how much referrer information is sent with requests",
      present: headerNames.has("referrer-policy"),
    },
    {
      name: "Permissions Policy",
      header: "Permissions-Policy",
      description: "Controls which browser features and APIs can be used",
      present: headerNames.has("permissions-policy"),
    },
  ]
}

function isSecurityHeader(name: string): boolean {
  return SECURITY_HEADERS.some(
    (h) => h.toLowerCase() === name.toLowerCase()
  )
}

export function HttpHeadersInspector() {
  const [url, setUrl] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [mobilePanel, setMobilePanel] = useState<"input" | "results">("input")

  const handleInspect = useCallback(() => {
    if (!url.trim()) return
    setShowResults(true)
    setMobilePanel("results")
  }, [url])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleInspect()
  }

  const securityChecks = getSecurityChecks(MOCK_HEADERS)
  const passedCount = securityChecks.filter((c) => c.present).length
  const totalCount = securityChecks.length

  const headersText = useMemo(() =>
    MOCK_HEADERS.map((h) => `${h.name}: ${h.value}`).join("\n"),
  [])

  const { shareUrl } = useShareableUrl("headers-inspector", { url }, (restored) => {
    const s = restored as { url: string }
    setUrl(s.url)
  })

  const exportOptions = useMemo<ExportOption[]>(() => [
    { label: "Copy Headers", action: () => navigator.clipboard.writeText(headersText) },
    { label: "Download .txt", action: () => {
      const blob = new Blob([headersText], { type: "text/plain" })
      const u = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = u; a.download = "headers.txt"; a.click()
      URL.revokeObjectURL(u)
    }},
  ], [headersText])

  const handlePresetSelect = useCallback((preset: Preset) => {
    setUrl(preset.content)
  }, [])

  const shortcuts = useMemo<Shortcut[]>(() => [
    { key: "mod+enter", label: "Inspect", action: handleInspect },
    { key: "mod+shift+c", label: "Copy Headers", action: () => navigator.clipboard.writeText(headersText) },
  ], [handleInspect, headersText])

  useKeyboardShortcuts(shortcuts)

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <ToolToolbar
        title="HTTP Headers Inspector"
        status={showResults ? { type: "success", label: `${passedCount}/${totalCount} security headers` } : null}
        copyValue={showResults ? headersText : undefined}
        onShare={shareUrl}
        exportOptions={showResults ? exportOptions : undefined}
        presets={HEADERS_PRESETS}
        onPresetSelect={handlePresetSelect}
        shortcuts={shortcuts}
      />
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
      {/* Mobile panel switcher */}
      <div className="md:hidden flex items-center gap-1 px-3 h-8 border-b border-border bg-muted/10 flex-shrink-0">
        <button
          onClick={() => setMobilePanel("input")}
          className={cn(
            "px-2.5 py-1 rounded text-[10px] font-medium uppercase tracking-wider transition-colors",
            mobilePanel === "input"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          Input
        </button>
        <button
          onClick={() => setMobilePanel("results")}
          className={cn(
            "px-2.5 py-1 rounded text-[10px] font-medium uppercase tracking-wider transition-colors",
            mobilePanel === "results"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          Headers
        </button>
      </div>

      {/* Left: URL input */}
      <div
        className={cn(
          "w-full md:w-[320px] lg:w-[360px] flex-shrink-0 flex-col min-h-0 border-b md:border-b-0 md:border-r border-border overflow-y-auto",
          mobilePanel === "input" ? "flex" : "hidden md:flex"
        )}
      >
        <div className="px-3 pt-4 pb-3 border-b border-border">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-2">
            URL
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-8 px-3 text-xs font-mono bg-muted/30 border border-border rounded-md text-foreground outline-none focus:border-foreground/30 transition-colors"
            placeholder="https://example.com"
            spellCheck={false}
          />
        </div>

        <div className="px-3 py-3">
          <Button
            onClick={handleInspect}
            disabled={!url.trim()}
            className="w-full text-xs h-8 gap-1.5"
          >
            <SearchIcon className="h-3.5 w-3.5" />
            Inspect
          </Button>
        </div>

        {/* Info */}
        <div className="px-3 pb-3 mt-auto">
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <div className="flex items-start gap-2">
              <InfoIcon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Enter a URL to inspect its HTTP response headers and analyze
                security header configuration.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right: results */}
      <div
        className={cn(
          "flex-1 flex-col min-h-0 overflow-y-auto",
          mobilePanel === "results" ? "flex" : "hidden md:flex"
        )}
      >
        {!showResults ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <GlobeIcon className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-xs">
                Enter a URL and click Inspect
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {/* Demo banner */}
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 flex items-start gap-2">
              <AlertTriangleIcon className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-amber-500 leading-relaxed">
                Backend required for live inspection — showing example data for demonstration purposes.
              </p>
            </div>

            {/* Security analysis */}
            <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
              <div className="flex items-center justify-between px-3 h-8 border-b border-border bg-muted/10">
                <span className="text-[11px] font-medium text-foreground">
                  Security Analysis
                </span>
                <span
                  className={cn(
                    "text-[10px] font-medium px-2 py-0.5 rounded-full",
                    passedCount === totalCount
                      ? "bg-emerald-500/10 text-emerald-500"
                      : passedCount >= totalCount / 2
                        ? "bg-amber-500/10 text-amber-500"
                        : "bg-destructive/10 text-destructive"
                  )}
                >
                  {passedCount}/{totalCount} passed
                </span>
              </div>
              <div className="divide-y divide-border">
                {securityChecks.map((check) => (
                  <div
                    key={check.name}
                    className="flex items-start gap-2.5 px-3 py-2"
                  >
                    {check.present ? (
                      <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircleIcon className="h-3.5 w-3.5 text-destructive mt-0.5 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-foreground">
                          {check.name}
                        </span>
                        <code className="text-[10px] font-mono text-muted-foreground">
                          {check.header}
                        </code>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {check.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Headers table */}
            <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
              <div className="flex items-center px-3 h-8 border-b border-border bg-muted/10">
                <span className="text-[11px] font-medium text-foreground">
                  All Headers ({MOCK_HEADERS.length})
                </span>
              </div>
              <div className="divide-y divide-border">
                {MOCK_HEADERS.map((header) => {
                  const isSecurity = isSecurityHeader(header.name)
                  return (
                    <div
                      key={header.name}
                      className={cn(
                        "flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 px-3 py-2",
                        isSecurity && "bg-emerald-500/5"
                      )}
                    >
                      <div className="flex items-center gap-1.5 sm:w-[200px] flex-shrink-0">
                        {isSecurity && (
                          <CheckCircleIcon className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                        )}
                        <code className="text-[11px] font-mono font-medium text-foreground">
                          {header.name}
                        </code>
                      </div>
                      <code className="text-[11px] font-mono text-muted-foreground break-all">
                        {header.value}
                      </code>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
