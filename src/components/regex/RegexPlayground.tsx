"use client"

import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    CopyIcon,
    CheckIcon,
    AlertCircleIcon,
    ChevronDownIcon,
} from "lucide-react"

interface MatchResult {
    index: number
    value: string
    groups: Record<string, string>
}

const FLAG_OPTIONS = [
    { flag: "g", label: "global", desc: "Find all matches" },
    { flag: "i", label: "insensitive", desc: "Case insensitive" },
    { flag: "m", label: "multiline", desc: "^ and $ match line starts/ends" },
    { flag: "s", label: "dotAll", desc: ". matches newlines" },
    { flag: "u", label: "unicode", desc: "Unicode support" },
] as const

const COMMON_PATTERNS = [
    { name: "Email", pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}", flags: "g" },
    { name: "URL", pattern: "https?://[\\w\\-._~:/?#\\[\\]@!$&'()*+,;=%]+", flags: "g" },
    { name: "IPv4", pattern: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b", flags: "g" },
    { name: "Phone (US)", pattern: "\\+?1?[\\s.-]?\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}", flags: "g" },
    { name: "Date (YYYY-MM-DD)", pattern: "\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])", flags: "g" },
    { name: "Hex Color", pattern: "#(?:[0-9a-fA-F]{3}){1,2}\\b", flags: "gi" },
    { name: "UUID", pattern: "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", flags: "gi" },
]

const EXAMPLE_TEST = `Hello, my email is alice@example.com and you can reach Bob at bob@test.org.
Visit https://example.com or http://test.io/path?q=1 for more info.
My IP is 192.168.1.100 and the server is at 10.0.0.1.
Call me at +1 (555) 123-4567 or 555.987.6543.
Important dates: 2024-01-15, 2025-12-31, 2026-02-17.
Colors used: #FF5733, #3b82f6, #0f0.
Session ID: 550e8400-e29b-41d4-a716-446655440000.`

export function RegexPlayground() {
    const [pattern, setPattern] = useState("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}")
    const [flags, setFlags] = useState("g")
    const [testString, setTestString] = useState(EXAMPLE_TEST)
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [showPresets, setShowPresets] = useState(false)
    const presetsRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Close presets dropdown on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (presetsRef.current && !presetsRef.current.contains(e.target as Node)) {
                setShowPresets(false)
            }
        }
        if (showPresets) document.addEventListener("mousedown", handleClick)
        return () => document.removeEventListener("mousedown", handleClick)
    }, [showPresets])

    const toggleFlag = useCallback((flag: string) => {
        setFlags(prev => prev.includes(flag) ? prev.replace(flag, "") : prev + flag)
    }, [])

    const regex = useMemo(() => {
        if (!pattern) return null
        try {
            const r = new RegExp(pattern, flags)
            setError(null)
            return r
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Invalid regex")
            return null
        }
    }, [pattern, flags])

    const matches: MatchResult[] = useMemo(() => {
        if (!regex || !testString) return []
        const results: MatchResult[] = []
        try {
            if (flags.includes("g")) {
                let match: RegExpExecArray | null
                const r = new RegExp(regex.source, regex.flags)
                while ((match = r.exec(testString)) !== null) {
                    results.push({
                        index: match.index,
                        value: match[0],
                        groups: match.groups ? { ...match.groups } : {},
                    })
                    if (!match[0]) r.lastIndex++ // prevent infinite loop on zero-width matches
                }
            } else {
                const match = regex.exec(testString)
                if (match) {
                    results.push({
                        index: match.index,
                        value: match[0],
                        groups: match.groups ? { ...match.groups } : {},
                    })
                }
            }
        } catch {
            // silently ignore execution errors
        }
        return results
    }, [regex, flags, testString])

    // Build highlighted HTML segments
    const highlightedSegments = useMemo(() => {
        if (!regex || !testString || matches.length === 0) {
            return [{ text: testString, isMatch: false }]
        }

        const segments: { text: string; isMatch: boolean; matchIndex?: number }[] = []
        let lastIndex = 0

        matches.forEach((m, i) => {
            if (m.index > lastIndex) {
                segments.push({ text: testString.slice(lastIndex, m.index), isMatch: false })
            }
            segments.push({ text: m.value, isMatch: true, matchIndex: i })
            lastIndex = m.index + m.value.length
        })

        if (lastIndex < testString.length) {
            segments.push({ text: testString.slice(lastIndex), isMatch: false })
        }

        return segments
    }, [regex, testString, matches])

    const handleCopyPattern = async () => {
        await navigator.clipboard.writeText(`/${pattern}/${flags}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const loadPreset = (preset: typeof COMMON_PATTERNS[0]) => {
        setPattern(preset.pattern)
        setFlags(preset.flags)
        setShowPresets(false)
    }

    return (
        <div className="h-full flex flex-col min-h-0">
            {/* Pattern bar */}
            <div className="flex flex-wrap items-center gap-2 px-3 py-2 md:py-0 md:h-10 border-b border-border flex-shrink-0">
                <span className="text-muted-foreground font-mono text-sm select-none">/</span>
                <input
                    type="text"
                    value={pattern}
                    onChange={e => setPattern(e.target.value)}
                    className="flex-1 bg-transparent text-sm font-mono text-foreground outline-none placeholder:text-muted-foreground/50"
                    placeholder="Enter regex pattern..."
                    spellCheck={false}
                />
                <span className="text-muted-foreground font-mono text-sm select-none">/</span>

                {/* Flags */}
                <div className="flex items-center gap-0.5">
                    {FLAG_OPTIONS.map(f => (
                        <button
                            key={f.flag}
                            onClick={() => toggleFlag(f.flag)}
                            title={`${f.label}: ${f.desc}`}
                            className={`w-5 h-5 rounded text-xs font-mono font-bold transition-colors ${
                                flags.includes(f.flag)
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                        >
                            {f.flag}
                        </button>
                    ))}
                </div>

                <div className="w-px h-4 bg-border mx-0.5" />

                {/* Presets dropdown */}
                <div className="relative" ref={presetsRef}>
                    <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setShowPresets(!showPresets)}
                        title="Common patterns"
                    >
                        <span className="text-[10px]">Presets</span>
                        <ChevronDownIcon className="h-3 w-3" />
                    </Button>
                    {showPresets && (
                        <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-md shadow-lg py-1 min-w-[180px]">
                            {COMMON_PATTERNS.map(p => (
                                <button
                                    key={p.name}
                                    onClick={() => loadPreset(p)}
                                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                                >
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <Button variant="ghost" size="xs" onClick={handleCopyPattern} title="Copy regex">
                    {copied ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
                </Button>

                {error && (
                    <span className="text-destructive text-xs flex items-center gap-1 flex-shrink-0">
                        <AlertCircleIcon className="h-3 w-3" />
                        Invalid
                    </span>
                )}
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0">
                {/* Test string panel */}
                <div className="flex-1 flex flex-col min-h-0 md:border-r border-border">
                    <div className="px-3 h-7 flex items-center border-b border-border flex-shrink-0">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Test String</span>
                        <span className="text-[10px] text-muted-foreground ml-auto">
                            {matches.length} match{matches.length !== 1 ? "es" : ""}
                        </span>
                    </div>
                    <div className="flex-1 min-h-0 relative">
                        {/* Highlight layer */}
                        <div
                            className="absolute inset-0 px-3 py-2 text-sm font-mono leading-relaxed whitespace-pre-wrap break-words overflow-y-auto pointer-events-none"
                            aria-hidden="true"
                        >
                            {highlightedSegments.map((seg, i) =>
                                seg.isMatch ? (
                                    <mark
                                        key={i}
                                        className="bg-amber-400/30 text-transparent border-b-2 border-amber-400 rounded-sm"
                                    >
                                        {seg.text}
                                    </mark>
                                ) : (
                                    <span key={i} className="text-transparent">{seg.text}</span>
                                )
                            )}
                        </div>
                        {/* Textarea layer */}
                        <textarea
                            ref={textareaRef}
                            value={testString}
                            onChange={e => setTestString(e.target.value)}
                            className="absolute inset-0 w-full h-full px-3 py-2 text-sm font-mono leading-relaxed bg-transparent text-foreground resize-none outline-none whitespace-pre-wrap break-words overflow-y-auto"
                            placeholder="Enter test string..."
                            spellCheck={false}
                        />
                    </div>
                </div>

                {/* Matches panel */}
                <div className="w-full md:w-80 md:flex-shrink-0 max-h-60 md:max-h-none border-t md:border-t-0 border-border flex flex-col min-h-0">
                    <div className="px-3 h-7 flex items-center border-b border-border flex-shrink-0">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Matches</span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {matches.length === 0 ? (
                            <div className="p-3 text-xs text-muted-foreground text-center">
                                {!pattern ? "Enter a pattern to start matching" :
                                 error ? "Fix the pattern error first" :
                                 "No matches found"}
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {matches.map((match, i) => (
                                    <div key={i} className="px-3 py-2">
                                        <div className="flex items-baseline justify-between gap-2 mb-1">
                                            <span className="text-[10px] text-muted-foreground font-medium">
                                                Match {i + 1}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">
                                                idx {match.index}
                                            </span>
                                        </div>
                                        <code className="text-xs font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded block break-all">
                                            {match.value}
                                        </code>
                                        {Object.keys(match.groups).length > 0 && (
                                            <div className="mt-1.5 space-y-0.5">
                                                <span className="text-[10px] text-muted-foreground">Groups:</span>
                                                {Object.entries(match.groups).map(([key, val]) => (
                                                    <div key={key} className="flex items-baseline gap-1.5 text-[11px]">
                                                        <span className="text-blue-400 font-mono">{key}:</span>
                                                        <span className="font-mono text-foreground/80">{val}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
