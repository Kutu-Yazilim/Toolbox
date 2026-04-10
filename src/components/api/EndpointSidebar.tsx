"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { BookOpenIcon, SearchIcon, XIcon, ChevronRightIcon, ChevronDownIcon, TrashIcon, PanelLeftCloseIcon } from "lucide-react"
import { type ParsedOpenApiSpec, type OpenApiEndpoint } from "@/utils/openApiParser"
import { METHOD_COLORS_MUTED } from "./apiTypes"
import { cn } from "@/lib/utils"

interface EndpointSidebarProps {
    spec: ParsedOpenApiSpec
    search: string
    onSearchChange: (val: string) => void
    onSelect: (endpoint: OpenApiEndpoint) => void
    onClose: () => void
    onClear: () => void
    className?: string
}

export function EndpointSidebar({ spec, search, onSearchChange, onSelect, onClose, onClear, className }: EndpointSidebarProps) {
    const [collapsedTags, setCollapsedTags] = useState<Set<string>>(new Set())

    const filteredEndpoints = useMemo(() => {
        if (!search.trim()) return spec.endpoints
        const q = search.toLowerCase()
        return spec.endpoints.filter(
            ep => ep.path.toLowerCase().includes(q)
                || ep.summary.toLowerCase().includes(q)
                || ep.method.toLowerCase().includes(q)
        )
    }, [spec.endpoints, search])

    const groupedByTag = useMemo(() => {
        const groups: Record<string, OpenApiEndpoint[]> = {}
        for (const ep of filteredEndpoints) {
            if (!groups[ep.tag]) groups[ep.tag] = []
            groups[ep.tag].push(ep)
        }
        return groups
    }, [filteredEndpoints])

    const toggleTag = (tag: string) => {
        setCollapsedTags(prev => {
            const next = new Set(prev)
            if (next.has(tag)) next.delete(tag)
            else next.add(tag)
            return next
        })
    }

    return (
        <div className={cn("flex flex-col bg-background h-full w-full md:w-[240px]", className)}>
            {/* Sidebar header */}
            <div className="flex items-center justify-between px-2 h-9 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-1 min-w-0">
                    <BookOpenIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-[11px] font-medium text-foreground truncate">{spec.title}</span>
                    {spec.version && (
                        <span className="text-[9px] text-muted-foreground flex-shrink-0">v{spec.version}</span>
                    )}
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                    <Button variant="ghost" size="xs" onClick={onClear} title="Remove spec">
                        <TrashIcon className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="xs" onClick={onClose} title="Hide sidebar">
                        <PanelLeftCloseIcon className="h-3 w-3" />
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="px-2 py-1.5 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-1.5 h-6 px-2 bg-muted/30 border border-border rounded">
                    <SearchIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => onSearchChange(e.target.value)}
                        placeholder="Search endpoints..."
                        className="flex-1 min-w-0 text-[11px] bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                        spellCheck={false}
                    />
                    {search && (
                        <button onClick={() => onSearchChange("")} className="text-muted-foreground hover:text-foreground">
                            <XIcon className="h-3 w-3" />
                        </button>
                    )}
                </div>
            </div>

            {/* Endpoint list */}
            <div className="flex-1 overflow-y-auto min-h-0">
                {Object.keys(groupedByTag).length === 0 ? (
                    <div className="px-3 py-4 text-[11px] text-muted-foreground text-center">
                        No endpoints found
                    </div>
                ) : (
                    Object.entries(groupedByTag).map(([tag, endpoints]) => (
                        <div key={tag}>
                            {/* Tag header */}
                            <button
                                onClick={() => toggleTag(tag)}
                                className="flex items-center gap-1 w-full px-2 py-1.5 text-left hover:bg-muted/30 transition-colors"
                            >
                                {collapsedTags.has(tag) ? (
                                    <ChevronRightIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                ) : (
                                    <ChevronDownIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                )}
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                                    {tag}
                                </span>
                                <span className="text-[9px] text-muted-foreground/60 ml-auto flex-shrink-0">
                                    {endpoints.length}
                                </span>
                            </button>

                            {/* Endpoints under tag */}
                            {!collapsedTags.has(tag) && endpoints.map((ep, i) => (
                                <button
                                    key={`${ep.method}-${ep.path}-${i}`}
                                    onClick={() => onSelect(ep)}
                                    className="flex items-start gap-1.5 w-full px-2 py-1.5 pl-5 text-left hover:bg-muted/40 transition-colors group"
                                    title={ep.summary}
                                >
                                    <span className={`text-[9px] font-mono font-bold flex-shrink-0 mt-px ${METHOD_COLORS_MUTED[ep.method] ?? "text-muted-foreground"}`}>
                                        {ep.method.slice(0, 3)}
                                    </span>
                                    <span className="text-[11px] font-mono text-foreground/80 truncate group-hover:text-foreground">
                                        {ep.path}
                                    </span>
                                </button>
                            ))}
                        </div>
                    ))
                )}
            </div>

            {/* Footer stats */}
            <div className="px-2 py-1 border-t border-border flex-shrink-0">
                <span className="text-[9px] text-muted-foreground">
                    {spec.endpoints.length} endpoint{spec.endpoints.length !== 1 ? "s" : ""}
                    {search && ` (${filteredEndpoints.length} shown)`}
                </span>
            </div>
        </div>
    )
}
