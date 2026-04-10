"use client"

import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  SearchIcon,
  ShieldCheckIcon,
  ShieldAlertIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  InfoIcon,
  AlertTriangleIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useShareableUrl } from "@/hooks/useShareableUrl"
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { type Preset } from "@/components/shared/PresetsDrawer"
import { SSL_PRESETS } from "./sslPresets"

// TODO: Replace mock data with real backend API calls when available.
// Browser-side JS cannot access TLS certificate details due to CORS and
// Web Security restrictions. A backend endpoint (e.g. Node.js with `tls`
// module or an external API like SSLLabs) is required for live checks.

type CertificateInfo = {
  subject: string
  issuer: string
  validFrom: string
  validTo: string
  serialNumber: string
  fingerprint: string
  signatureAlgorithm: string
  keySize: number
  keyType: string
  sans: string[]
  isValid: boolean
}

type CertChainEntry = {
  label: string
  type: "root" | "intermediate" | "leaf"
  cert: CertificateInfo
}

const MOCK_CHAIN: CertChainEntry[] = [
  {
    label: "Root CA",
    type: "root",
    cert: {
      subject: "ISRG Root X1",
      issuer: "ISRG Root X1",
      validFrom: "2015-06-04T00:00:00Z",
      validTo: "2035-06-04T00:00:00Z",
      serialNumber: "82:10:CF:B0:D2:40:E3:59:44:63:E0:BB:63:82:8B:00",
      fingerprint: "96:BC:EC:06:26:49:76:F3:74:60:77:9A:CF:28:C5:A7:CF:E8:A3:C0:AA:E1:1A:8F:FC:EE:05:C0:BD:DF:08:C6",
      signatureAlgorithm: "SHA-256 with RSA",
      keySize: 4096,
      keyType: "RSA",
      sans: [],
      isValid: true,
    },
  },
  {
    label: "Intermediate",
    type: "intermediate",
    cert: {
      subject: "R3",
      issuer: "ISRG Root X1",
      validFrom: "2020-09-04T00:00:00Z",
      validTo: "2025-09-15T16:00:00Z",
      serialNumber: "91:2B:08:4A:CF:0C:18:A7:53:F6:D6:2E:25:A7:5F:5A",
      fingerprint: "67:AD:D1:16:6B:02:0A:E6:1B:8F:5F:C9:68:13:C0:4C:2A:A5:89:96:07:96:86:55:72:A3:C7:E7:37:61:3D:FD",
      signatureAlgorithm: "SHA-256 with RSA",
      keySize: 2048,
      keyType: "RSA",
      sans: [],
      isValid: true,
    },
  },
  {
    label: "Leaf (Server)",
    type: "leaf",
    cert: {
      subject: "example.com",
      issuer: "R3",
      validFrom: "2024-01-15T00:00:00Z",
      validTo: "2025-04-15T23:59:59Z",
      serialNumber: "04:2E:FC:AE:14:5D:6E:9B:3C:7A:4D:2B:8E:1F:A7:03",
      fingerprint: "A3:0B:1E:4C:D7:8F:92:56:3A:1B:C4:E0:7D:8F:2A:15:6B:9C:D3:E4:F5:A6:B7:C8:D9:E0:F1:02:13:24:35:46",
      signatureAlgorithm: "SHA-256 with RSA",
      keySize: 2048,
      keyType: "RSA",
      sans: ["example.com", "www.example.com", "mail.example.com"],
      isValid: true,
    },
  },
]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  })
}

function daysUntil(iso: string): number {
  const now = new Date()
  const target = new Date(iso)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function SslCertificateChecker() {
  const [domain, setDomain] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [expandedCerts, setExpandedCerts] = useState<Set<number>>(new Set([2]))
  const [mobilePanel, setMobilePanel] = useState<"input" | "results">("input")

  const handleCheck = useCallback(() => {
    if (!domain.trim()) return
    setShowResults(true)
    setMobilePanel("results")
  }, [domain])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleCheck()
  }

  const { shareUrl } = useShareableUrl("ssl-checker", { domain }, (restored) => {
    const s = restored as { domain: string }
    setDomain(s.domain)
  })

  const handlePresetSelect = useCallback((preset: Preset) => {
    setDomain(preset.content)
  }, [])

  const shortcuts = useMemo<Shortcut[]>(() => [
    { key: "mod+enter", label: "Check Certificate", action: handleCheck },
  ], [handleCheck])

  useKeyboardShortcuts(shortcuts)

  const toggleCert = (index: number) => {
    setExpandedCerts((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const leafCert = MOCK_CHAIN[2].cert
  const expiryDays = daysUntil(leafCert.validTo)

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <ToolToolbar
        title="SSL Certificate Checker"
        status={showResults ? { type: "success", label: domain } : null}
        onShare={shareUrl}
        presets={SSL_PRESETS}
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
          Certificate
        </button>
      </div>

      {/* Left: domain input */}
      <div
        className={cn(
          "w-full md:w-[320px] lg:w-[360px] flex-shrink-0 flex-col min-h-0 border-b md:border-b-0 md:border-r border-border overflow-y-auto",
          mobilePanel === "input" ? "flex" : "hidden md:flex"
        )}
      >
        <div className="px-3 pt-4 pb-3 border-b border-border">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-2">
            Domain
          </label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-8 px-3 text-xs font-mono bg-muted/30 border border-border rounded-md text-foreground outline-none focus:border-foreground/30 transition-colors"
            placeholder="example.com"
            spellCheck={false}
          />
        </div>

        <div className="px-3 py-3">
          <Button
            onClick={handleCheck}
            disabled={!domain.trim()}
            className="w-full text-xs h-8 gap-1.5"
          >
            <SearchIcon className="h-3.5 w-3.5" />
            Check
          </Button>
        </div>

        {/* Info */}
        <div className="px-3 pb-3 mt-auto">
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <div className="flex items-start gap-2">
              <InfoIcon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Enter any domain to inspect its SSL/TLS certificate chain,
                validity, and configuration details.
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
              <ShieldCheckIcon className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-xs">
                Enter a domain and click Check
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {/* Demo banner */}
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 flex items-start gap-2">
              <AlertTriangleIcon className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-amber-500 leading-relaxed">
                Backend required for live checks — showing example data for demonstration purposes.
              </p>
            </div>

            {/* Summary card */}
            <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
              <div className="flex items-center justify-between px-3 h-8 border-b border-border bg-muted/10">
                <span className="text-[11px] font-medium text-foreground">
                  Summary
                </span>
                <ShieldCheckIcon className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <div className="p-3 space-y-2">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <DetailRow label="Domain" value={leafCert.subject} />
                  <DetailRow label="Issuer" value={leafCert.issuer} />
                  <DetailRow label="Valid From" value={formatDate(leafCert.validFrom)} />
                  <DetailRow label="Valid Until" value={formatDate(leafCert.validTo)} />
                  <DetailRow label="Key" value={`${leafCert.keyType} ${leafCert.keySize}-bit`} />
                  <DetailRow label="Signature" value={leafCert.signatureAlgorithm} />
                </div>
                <div className="pt-1 border-t border-border mt-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                      expiryDays > 30
                        ? "bg-emerald-500/10 text-emerald-500"
                        : expiryDays > 0
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-destructive/10 text-destructive"
                    )}
                  >
                    {expiryDays > 0 ? (
                      <>
                        <ShieldCheckIcon className="h-3 w-3" />
                        Expires in {expiryDays} days
                      </>
                    ) : (
                      <>
                        <ShieldAlertIcon className="h-3 w-3" />
                        Certificate expired
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* SANs */}
            <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
              <div className="flex items-center px-3 h-8 border-b border-border bg-muted/10">
                <span className="text-[11px] font-medium text-foreground">
                  Subject Alternative Names ({leafCert.sans.length})
                </span>
              </div>
              <div className="p-3">
                <div className="flex flex-wrap gap-1.5">
                  {leafCert.sans.map((san) => (
                    <span
                      key={san}
                      className="px-2 py-0.5 rounded-md bg-muted/50 text-[11px] font-mono text-foreground"
                    >
                      {san}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Certificate Chain */}
            <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
              <div className="flex items-center px-3 h-8 border-b border-border bg-muted/10">
                <span className="text-[11px] font-medium text-foreground">
                  Certificate Chain
                </span>
              </div>
              <div className="divide-y divide-border">
                {MOCK_CHAIN.map((entry, index) => {
                  const expanded = expandedCerts.has(index)
                  return (
                    <div key={index}>
                      <button
                        onClick={() => toggleCert(index)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/30 transition-colors"
                      >
                        {expanded ? (
                          <ChevronDownIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronRightIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        )}
                        <ChainBadge type={entry.type} />
                        <span className="text-xs font-medium text-foreground">
                          {entry.cert.subject}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {entry.label}
                        </span>
                      </button>
                      {expanded && (
                        <div className="px-3 pb-3 pl-9 space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                            <DetailRow label="Subject" value={entry.cert.subject} />
                            <DetailRow label="Issuer" value={entry.cert.issuer} />
                            <DetailRow label="Valid From" value={formatDate(entry.cert.validFrom)} />
                            <DetailRow label="Valid Until" value={formatDate(entry.cert.validTo)} />
                            <DetailRow label="Key" value={`${entry.cert.keyType} ${entry.cert.keySize}-bit`} />
                            <DetailRow label="Signature" value={entry.cert.signatureAlgorithm} />
                          </div>
                          <div className="space-y-1.5 pt-1">
                            <DetailRow label="Serial" value={entry.cert.serialNumber} mono />
                            <DetailRow label="Fingerprint (SHA-256)" value={entry.cert.fingerprint} mono />
                          </div>
                        </div>
                      )}
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

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div>
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">
        {label}
      </span>
      <span
        className={cn(
          "text-[11px] text-foreground break-all",
          mono && "font-mono"
        )}
      >
        {value}
      </span>
    </div>
  )
}

function ChainBadge({ type }: { type: "root" | "intermediate" | "leaf" }) {
  const styles = {
    root: "bg-purple-500/10 text-purple-500",
    intermediate: "bg-blue-500/10 text-blue-500",
    leaf: "bg-emerald-500/10 text-emerald-500",
  }

  const labels = {
    root: "ROOT",
    intermediate: "INT",
    leaf: "LEAF",
  }

  return (
    <span
      className={cn(
        "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex-shrink-0",
        styles[type]
      )}
    >
      {labels[type]}
    </span>
  )
}
