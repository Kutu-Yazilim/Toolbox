import { useState, useMemo } from "react"
import { SearchIcon, ChevronDownIcon, ChevronRightIcon } from "lucide-react"
import {
  HTTP_STATUS_CODES,
  CATEGORY_LABELS,
  CATEGORY_STYLES,
  type HttpStatusCategory,
  type HttpStatusCode,
} from "@/data/httpStatusCodes"

export function HttpStatusCodes() {
  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const filtered = useMemo(() => {
    if (!search.trim()) return HTTP_STATUS_CODES
    const q = search.toLowerCase()
    return HTTP_STATUS_CODES.filter(
      (s) =>
        String(s.code).includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q),
    )
  }, [search])

  const grouped = useMemo(() => {
    const groups: Record<HttpStatusCategory, HttpStatusCode[]> = {
      "1xx": [],
      "2xx": [],
      "3xx": [],
      "4xx": [],
      "5xx": [],
    }
    for (const code of filtered) {
      groups[code.category].push(code)
    }
    return groups
  }, [filtered])

  const toggleExpanded = (code: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 h-9 border-b border-border flex-shrink-0">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          HTTP Status Codes
        </span>
        <span className="text-[10px] text-muted-foreground">
          {filtered.length} codes
        </span>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-border flex-shrink-0">
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, name, or description…"
            className="w-full h-8 text-sm bg-transparent border border-border rounded-md pl-8 pr-3 text-foreground outline-none placeholder:text-muted-foreground"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Status codes list */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-3 space-y-4">
          {(Object.keys(grouped) as HttpStatusCategory[]).map((cat) => {
            const codes = grouped[cat]
            if (codes.length === 0) return null
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded ${CATEGORY_STYLES[cat]}`}
                  >
                    {cat}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {CATEGORY_LABELS[cat]}
                  </span>
                </div>
                <div className="space-y-1">
                  {codes.map((status) => {
                    const isOpen = expanded.has(status.code)
                    return (
                      <div
                        key={status.code}
                        className="border border-border rounded-md overflow-hidden"
                      >
                        <button
                          onClick={() => toggleExpanded(status.code)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent/50 transition-colors"
                        >
                          {isOpen ? (
                            <ChevronDownIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <ChevronRightIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          )}
                          <span
                            className={`text-sm font-mono font-semibold ${CATEGORY_STYLES[status.category].split(" ")[1]}`}
                          >
                            {status.code}
                          </span>
                          <span className="text-sm font-medium text-foreground">
                            {status.name}
                          </span>
                        </button>
                        {isOpen && (
                          <div className="px-3 pb-3 pt-1 border-t border-border">
                            <p className="text-sm text-muted-foreground mb-3">
                              {status.description}
                            </p>
                            {status.example && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div>
                                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">
                                    Request
                                  </span>
                                  <pre className="text-xs font-mono bg-muted/50 rounded p-2 overflow-x-auto whitespace-pre-wrap">
                                    {status.example.request}
                                  </pre>
                                </div>
                                <div>
                                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">
                                    Response
                                  </span>
                                  <pre className="text-xs font-mono bg-muted/50 rounded p-2 overflow-x-auto whitespace-pre-wrap">
                                    {status.example.response}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
