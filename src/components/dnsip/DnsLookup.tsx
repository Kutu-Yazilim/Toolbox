import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  SearchIcon,
  LoaderIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  CopyIcon,
  CheckIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DNS_RECORD_TYPES,
  DNS_PROVIDERS,
  type DnsRecordType,
  type DnsResult,
} from "@/utils/dnsUtils"

type ProviderState = {
  loading: boolean
  result: DnsResult | null
}

export function DnsLookup() {
  const [domain, setDomain] = useState("")
  const [recordType, setRecordType] = useState<DnsRecordType>("A")
  const [providers, setProviders] = useState<Map<string, ProviderState>>(
    new Map()
  )
  const [mobilePanel, setMobilePanel] = useState<"input" | "results">("input")
  const [copied, setCopied] = useState<string | null>(null)

  const handleLookup = useCallback(() => {
    const trimmed = domain.trim()
    if (!trimmed) return

    setMobilePanel("results")

    const initial = new Map<string, ProviderState>()
    for (const p of DNS_PROVIDERS) {
      initial.set(p.name, { loading: true, result: null })
    }
    setProviders(initial)

    for (const provider of DNS_PROVIDERS) {
      provider.resolve(trimmed, recordType).then((result) => {
        setProviders((prev) => {
          const next = new Map(prev)
          next.set(provider.name, { loading: false, result })
          return next
        })
      })
    }
  }, [domain, recordType])

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLookup()
  }

  return (
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
          Query
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
          Results
        </button>
      </div>

      {/* Left: query config */}
      <div
        className={cn(
          "w-full md:w-[320px] lg:w-[360px] flex-shrink-0 flex-col min-h-0 border-b md:border-b-0 md:border-r border-border overflow-y-auto",
          mobilePanel === "input" ? "flex" : "hidden md:flex"
        )}
      >
        {/* Domain input */}
        <div className="px-3 pt-4 pb-3 border-b border-border">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-2">
            Domain
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 h-8 px-3 text-xs font-mono bg-muted/30 border border-border rounded-md text-foreground outline-none focus:border-foreground/30 transition-colors"
              placeholder="example.com"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Record type */}
        <div className="px-3 pt-3 pb-3 border-b border-border">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-2">
            Record Type
          </label>
          <div className="flex flex-wrap gap-1.5">
            {DNS_RECORD_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setRecordType(t)}
                className={cn(
                  "px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-colors",
                  recordType === t
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Lookup button */}
        <div className="px-3 py-3">
          <Button
            onClick={handleLookup}
            disabled={!domain.trim()}
            className="w-full text-xs h-8 gap-1.5"
          >
            <SearchIcon className="h-3.5 w-3.5" />
            Lookup
          </Button>
        </div>

        {/* Provider legend */}
        <div className="px-3 pb-3 mt-auto">
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Providers
          </div>
          <div className="space-y-1">
            {DNS_PROVIDERS.map((p) => (
              <div
                key={p.name}
                className="text-[11px] text-muted-foreground/80"
              >
                {p.name}
              </div>
            ))}
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
        <div className="flex items-center px-3 h-8 border-b border-border bg-muted/20 flex-shrink-0">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Results
          </span>
        </div>

        {providers.size === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <SearchIcon className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-xs">
                Enter a domain and click Lookup
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {DNS_PROVIDERS.map((provider) => {
              const state = providers.get(provider.name)
              if (!state) return null

              return (
                <div
                  key={provider.name}
                  className="rounded-lg border border-border bg-muted/20 overflow-hidden"
                >
                  {/* Provider header */}
                  <div className="flex items-center justify-between px-3 h-8 border-b border-border bg-muted/10">
                    <span className="text-[11px] font-medium text-foreground">
                      {provider.name}
                    </span>
                    <div className="flex items-center gap-2">
                      {state.loading ? (
                        <LoaderIcon className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
                      ) : state.result?.status === "resolved" ? (
                        <>
                          <span className="text-[10px] text-muted-foreground">
                            {state.result.responseTimeMs}ms
                          </span>
                          <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500" />
                        </>
                      ) : state.result?.status === "nxdomain" ? (
                        <>
                          <span className="text-[10px] text-muted-foreground">
                            {state.result.responseTimeMs}ms
                          </span>
                          <AlertTriangleIcon className="h-3.5 w-3.5 text-amber-500" />
                        </>
                      ) : (
                        <XCircleIcon className="h-3.5 w-3.5 text-destructive" />
                      )}
                    </div>
                  </div>

                  {/* Provider body */}
                  <div className="px-3 py-2">
                    {state.loading && (
                      <span className="text-xs text-muted-foreground">
                        Resolving...
                      </span>
                    )}

                    {!state.loading && state.result?.status === "resolved" && (
                      <div className="space-y-1">
                        {state.result.answers.length === 0 ? (
                          <span className="text-xs text-muted-foreground">
                            No records found
                          </span>
                        ) : (
                          state.result.answers.map((answer, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between gap-2"
                            >
                              <code className="text-xs font-mono text-foreground break-all">
                                {answer.data}
                              </code>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-[10px] text-muted-foreground">
                                  TTL {answer.TTL}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  onClick={() =>
                                    handleCopy(
                                      answer.data,
                                      `${provider.name}-${i}`
                                    )
                                  }
                                >
                                  {copied === `${provider.name}-${i}` ? (
                                    <CheckIcon className="h-3 w-3" />
                                  ) : (
                                    <CopyIcon className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {!state.loading && state.result?.status === "nxdomain" && (
                      <span className="text-xs text-amber-500">
                        NXDOMAIN — domain does not exist
                      </span>
                    )}

                    {!state.loading && state.result?.status === "error" && (
                      <span className="text-xs text-destructive">
                        {state.result.errorMessage}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
