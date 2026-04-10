"use client"

import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircleIcon, ReplaceIcon } from "lucide-react"
import Editor, { type OnMount } from "@monaco-editor/react"
import type * as monacoEditor from "monaco-editor"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useShareableUrl } from "@/hooks/useShareableUrl"
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts"
import { useTheme } from "@/hooks/useTheme"
import { RegexExplainer } from "./RegexExplainer"
import { RegexCodeGen } from "./RegexCodeGen"
import { GroupsTable, type GroupRow, GROUP_COLORS } from "./GroupsTable"
import { REGEX_PRESETS, type RegexPreset } from "./regexPresets"
import type { Preset } from "@/components/shared/PresetsDrawer"
import type { ExportOption } from "@/components/shared/ExportMenu"

const STORAGE_KEY = "kutu-regex"
const TOOL_ID = "regex"

const FLAG_OPTIONS = [
    { flag: "g", label: "global", desc: "Find all matches" },
    { flag: "i", label: "insensitive", desc: "Case insensitive" },
    { flag: "m", label: "multiline", desc: "^ and $ match line starts/ends" },
    { flag: "s", label: "dotAll", desc: ". matches newlines" },
    { flag: "u", label: "unicode", desc: "Unicode support" },
] as const

const DEFAULT_TEST_STRING = `Hello, my email is alice@example.com and you can reach Bob at bob@test.org.
Visit https://example.com or http://test.io/path?q=1 for more info.
My IP is 192.168.1.100 and the server is at 10.0.0.1.
Call me at +1 (555) 123-4567 or 555.987.6543.
Important dates: 2024-01-15, 2025-12-31, 2026-02-17.
Colors used: #FF5733, #3b82f6, #0f0.
Session ID: 550e8400-e29b-41d4-a716-446655440000.`

const DEFAULT_PATTERN = "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}"
const DEFAULT_FLAGS = "g"

const MATCH_DECORATION_CLASS = "regex-match-highlight"

const CAPTURE_DECORATION_CLASSES = [
    "regex-group-0",
    "regex-group-1",
    "regex-group-2",
    "regex-group-3",
    "regex-group-4",
    "regex-group-5",
    "regex-group-6",
    "regex-group-7",
] as const

interface MatchResult {
    index: number
    value: string
    groups: Record<string, string>
    captureGroups: { index: number; value: string; name: string | null }[]
}

interface RegexState {
    pattern: string
    flags: string
    testString: string
    replaceText: string
    showReplace: boolean
}

function computeMatches(pattern: string, flags: string, testString: string): { matches: MatchResult[]; error: string | null } {
    if (!pattern) return { matches: [], error: null }

    let regex: RegExp
    try {
        regex = new RegExp(pattern, flags)
    } catch (e: unknown) {
        return { matches: [], error: e instanceof Error ? e.message : "Invalid regex" }
    }

    const results: MatchResult[] = []
    try {
        if (flags.includes("g")) {
            let match: RegExpExecArray | null
            const r = new RegExp(regex.source, regex.flags)
            while ((match = r.exec(testString)) !== null) {
                results.push(buildMatchResult(match))
                if (!match[0]) r.lastIndex++
            }
        } else {
            const match = regex.exec(testString)
            if (match) results.push(buildMatchResult(match))
        }
    } catch {
        // silently ignore execution errors
    }

    return { matches: results, error: null }
}

function buildMatchResult(match: RegExpExecArray): MatchResult {
    const captureGroups: MatchResult["captureGroups"] = []
    for (let g = 1; g < match.length; g++) {
        if (match[g] !== undefined) {
            const name = match.groups ? Object.entries(match.groups).find(([, v]) => v === match[g])?.[0] ?? null : null
            const groupStart = match[0].indexOf(match[g])
            captureGroups.push({
                index: groupStart >= 0 ? match.index + groupStart : match.index,
                value: match[g],
                name,
            })
        }
    }
    return {
        index: match.index,
        value: match[0],
        groups: match.groups ? { ...match.groups } : {},
        captureGroups,
    }
}

function computeGroupRows(matches: MatchResult[]): GroupRow[] {
    const rows: GroupRow[] = []
    for (let mi = 0; mi < matches.length; mi++) {
        for (const cg of matches[mi].captureGroups) {
            rows.push({
                matchIndex: mi,
                groupIndex: matches[mi].captureGroups.indexOf(cg) + 1,
                groupName: cg.name,
                value: cg.value,
                startIndex: cg.index,
            })
        }
    }
    return rows
}

function computeReplacePreview(testString: string, pattern: string, flags: string, replaceText: string): string | null {
    if (!pattern || !replaceText) return null
    try {
        const regex = new RegExp(pattern, flags)
        return testString.replace(regex, replaceText)
    } catch {
        return null
    }
}

function injectDecorationStyles() {
    const STYLE_ID = "regex-playground-decorations"
    if (typeof document === "undefined") return
    if (document.getElementById(STYLE_ID)) return

    const matchBg = "rgba(250, 204, 21, 0.25)"
    const matchBorder = "rgba(250, 204, 21, 0.8)"
    const groupBgColors = [
        "rgba(96, 165, 250, 0.25)",
        "rgba(52, 211, 153, 0.25)",
        "rgba(192, 132, 252, 0.25)",
        "rgba(251, 146, 60, 0.25)",
        "rgba(244, 114, 182, 0.25)",
        "rgba(34, 211, 238, 0.25)",
        "rgba(250, 204, 21, 0.25)",
        "rgba(248, 113, 113, 0.25)",
    ]
    const groupBorderColors = [
        "rgba(96, 165, 250, 0.8)",
        "rgba(52, 211, 153, 0.8)",
        "rgba(192, 132, 252, 0.8)",
        "rgba(251, 146, 60, 0.8)",
        "rgba(244, 114, 182, 0.8)",
        "rgba(34, 211, 238, 0.8)",
        "rgba(250, 204, 21, 0.8)",
        "rgba(248, 113, 113, 0.8)",
    ]

    let css = `.${MATCH_DECORATION_CLASS} { background: ${matchBg}; border-bottom: 2px solid ${matchBorder}; }\n`
    for (let i = 0; i < CAPTURE_DECORATION_CLASSES.length; i++) {
        css += `.${CAPTURE_DECORATION_CLASSES[i]} { background: ${groupBgColors[i]}; border-bottom: 2px solid ${groupBorderColors[i]}; }\n`
    }

    const style = document.createElement("style")
    style.id = STYLE_ID
    style.textContent = css
    document.head.appendChild(style)
}

export function RegexPlayground() {
    const [state, setState] = useLocalStorage<RegexState>(STORAGE_KEY, {
        pattern: DEFAULT_PATTERN,
        flags: DEFAULT_FLAGS,
        testString: DEFAULT_TEST_STRING,
        replaceText: "",
        showReplace: false,
    })

    const { isDark } = useTheme()
    const editorRef = useRef<Parameters<OnMount>[0] | null>(null)
    const monacoRef = useRef<Parameters<OnMount>[1] | null>(null)
    const decorationsRef = useRef<ReturnType<Parameters<OnMount>[0]["createDecorationsCollection"]> | null>(null)
    const [activeTab, setActiveTab] = useState("matches")

    const setPattern = useCallback((p: string) => setState(prev => ({ ...prev, pattern: p })), [setState])
    const setFlags = useCallback((f: string) => setState(prev => ({ ...prev, flags: f })), [setState])
    const setTestString = useCallback((t: string) => setState(prev => ({ ...prev, testString: t })), [setState])
    const setReplaceText = useCallback((r: string) => setState(prev => ({ ...prev, replaceText: r })), [setState])
    const toggleReplace = useCallback(() => setState(prev => ({ ...prev, showReplace: !prev.showReplace })), [setState])

    const toggleFlag = useCallback((flag: string) => {
        setFlags(state.flags.includes(flag) ? state.flags.replace(flag, "") : state.flags + flag)
    }, [state.flags, setFlags])

    const { matches, error } = useMemo(
        () => computeMatches(state.pattern, state.flags, state.testString),
        [state.pattern, state.flags, state.testString],
    )

    const groupRows = useMemo(() => computeGroupRows(matches), [matches])

    const replacePreview = useMemo(
        () => state.showReplace ? computeReplacePreview(state.testString, state.pattern, state.flags, state.replaceText) : null,
        [state.testString, state.pattern, state.flags, state.replaceText, state.showReplace],
    )

    const onRestoreState = useCallback((restored: RegexState) => {
        setState(restored)
    }, [setState])

    const { shareUrl } = useShareableUrl<RegexState>(TOOL_ID, state, onRestoreState)

    // Presets adapted for ToolToolbar
    const presets: Preset[] = useMemo(() =>
        REGEX_PRESETS.map((p: RegexPreset) => ({
            name: p.name,
            category: p.category,
            description: p.description,
            content: p.content,
        })),
        [],
    )

    const handlePresetSelect = useCallback((preset: Preset) => {
        const full = REGEX_PRESETS.find(p => p.name === preset.name && p.content === preset.content)
        if (full) {
            setState({
                pattern: full.content,
                flags: full.flags,
                testString: full.testString,
                replaceText: "",
                showReplace: false,
            })
        }
    }, [setState])

    const exportOptions: ExportOption[] = useMemo(() => [
        {
            label: "Copy regex",
            action: async () => {
                await navigator.clipboard.writeText(`/${state.pattern}/${state.flags}`)
            },
        },
        {
            label: "Copy as JavaScript",
            action: async () => {
                const snippet = `const regex = /${state.pattern}/${state.flags};`
                await navigator.clipboard.writeText(snippet)
            },
        },
    ], [state.pattern, state.flags])

    const shortcuts: Shortcut[] = useMemo(() => [
        { key: "mod+shift+r", label: "Toggle Replace", action: toggleReplace },
    ], [toggleReplace])

    useKeyboardShortcuts(shortcuts)

    // Apply Monaco decorations when matches change
    useEffect(() => {
        const editor = editorRef.current
        const monaco = monacoRef.current
        if (!editor || !monaco) return

        const model = editor.getModel()
        if (!model) return

        const decorations: monacoEditor.editor.IModelDeltaDecoration[] = []

        for (const match of matches) {
            const startPos = model.getPositionAt(match.index)
            const endPos = model.getPositionAt(match.index + match.value.length)
            decorations.push({
                range: new monaco.Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column),
                options: { inlineClassName: MATCH_DECORATION_CLASS },
            })

            for (const cg of match.captureGroups) {
                const cgIdx = match.captureGroups.indexOf(cg)
                const cgStart = model.getPositionAt(cg.index)
                const cgEnd = model.getPositionAt(cg.index + cg.value.length)
                decorations.push({
                    range: new monaco.Range(cgStart.lineNumber, cgStart.column, cgEnd.lineNumber, cgEnd.column),
                    options: { inlineClassName: CAPTURE_DECORATION_CLASSES[cgIdx % CAPTURE_DECORATION_CLASSES.length] },
                })
            }
        }

        if (decorationsRef.current) {
            decorationsRef.current.set(decorations)
        } else {
            decorationsRef.current = editor.createDecorationsCollection(decorations)
        }
    }, [matches])

    const handleEditorMount: OnMount = useCallback((editor, monaco) => {
        editorRef.current = editor
        monacoRef.current = monaco
        injectDecorationStyles()
    }, [])

    const handleEditorChange = useCallback((value: string | undefined) => {
        setTestString(value ?? "")
    }, [setTestString])

    const statusIndicator = useMemo(() => {
        if (error) return { type: "error" as const, label: "Invalid pattern" }
        if (matches.length > 0) return { type: "success" as const, label: `${matches.length} match${matches.length !== 1 ? "es" : ""}` }
        if (state.pattern) return { type: "info" as const, label: "No matches" }
        return null
    }, [error, matches.length, state.pattern])

    return (
        <div className="h-full flex flex-col min-h-0">
            <ToolToolbar
                title="Regex Playground"
                status={statusIndicator}
                copyValue={`/${state.pattern}/${state.flags}`}
                onShare={shareUrl}
                exportOptions={exportOptions}
                presets={presets}
                onPresetSelect={handlePresetSelect}
                shortcuts={shortcuts}
            >
                <Button
                    variant={state.showReplace ? "secondary" : "ghost"}
                    size="xs"
                    onClick={toggleReplace}
                    title="Toggle Replace"
                    className="ml-2"
                >
                    <ReplaceIcon className="h-3 w-3" />
                    <span className="text-[10px]">Replace</span>
                </Button>
            </ToolToolbar>

            {/* Pattern input bar */}
            <div className="flex flex-col border-b border-border flex-shrink-0">
                <div className="flex flex-wrap items-center gap-2 px-3 py-2 md:py-0 md:h-10">
                    <span className="text-muted-foreground font-mono text-sm select-none">/</span>
                    <input
                        type="text"
                        value={state.pattern}
                        onChange={e => setPattern(e.target.value)}
                        className="flex-1 bg-transparent text-sm font-mono text-foreground outline-none placeholder:text-muted-foreground/50"
                        placeholder="Enter regex pattern..."
                        spellCheck={false}
                    />
                    <span className="text-muted-foreground font-mono text-sm select-none">/</span>

                    <div className="flex items-center gap-0.5">
                        {FLAG_OPTIONS.map(f => (
                            <button
                                key={f.flag}
                                onClick={() => toggleFlag(f.flag)}
                                title={`${f.label}: ${f.desc}`}
                                className={`w-5 h-5 rounded text-xs font-mono font-bold transition-colors ${
                                    state.flags.includes(f.flag)
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                            >
                                {f.flag}
                            </button>
                        ))}
                    </div>

                    {error && (
                        <span className="text-destructive text-xs flex items-center gap-1 flex-shrink-0">
                            <AlertCircleIcon className="h-3 w-3" />
                            <span className="hidden sm:inline">{error}</span>
                            <span className="sm:hidden">Invalid</span>
                        </span>
                    )}
                </div>

                {state.showReplace && (
                    <div className="flex items-center gap-2 px-3 py-2 border-t border-border">
                        <span className="text-muted-foreground text-xs font-medium shrink-0">Replace:</span>
                        <input
                            type="text"
                            value={state.replaceText}
                            onChange={e => setReplaceText(e.target.value)}
                            className="flex-1 bg-transparent text-sm font-mono text-foreground outline-none placeholder:text-muted-foreground/50"
                            placeholder="Replacement string ($1, $2, $&, ...)"
                            spellCheck={false}
                        />
                    </div>
                )}
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0">
                {/* Left: Editor + replace preview */}
                <div className="flex-1 flex flex-col min-h-0 md:border-r border-border">
                    <div className="px-3 h-7 flex items-center border-b border-border flex-shrink-0">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Test String</span>
                    </div>
                    <div className="flex-1 min-h-0">
                        <Editor
                            value={state.testString}
                            onChange={handleEditorChange}
                            onMount={handleEditorMount}
                            language="plaintext"
                            theme={isDark ? "vs-dark" : "light"}
                            options={{
                                minimap: { enabled: false },
                                lineNumbers: "on",
                                wordWrap: "on",
                                fontSize: 13,
                                fontFamily: "monospace",
                                scrollBeyondLastLine: false,
                                renderLineHighlight: "none",
                                overviewRulerBorder: false,
                                overviewRulerLanes: 0,
                                hideCursorInOverviewRuler: true,
                                scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
                                padding: { top: 8, bottom: 8 },
                                contextmenu: false,
                            }}
                        />
                    </div>
                    {replacePreview !== null && (
                        <div className="border-t border-border flex-shrink-0">
                            <div className="px-3 h-7 flex items-center border-b border-border">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Replace Preview</span>
                            </div>
                            <pre className="px-3 py-2 text-sm font-mono text-foreground/80 whitespace-pre-wrap break-words overflow-auto max-h-40">
                                {replacePreview}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Right panel with tabs */}
                <div className="w-full md:w-80 lg:w-96 md:flex-shrink-0 max-h-72 md:max-h-none border-t md:border-t-0 border-border flex flex-col min-h-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                        <TabsList variant="line" className="px-3 h-8 shrink-0 border-b border-border w-full">
                            <TabsTrigger value="matches" className="text-[11px]">
                                Matches
                                {matches.length > 0 && (
                                    <span className="ml-1 text-[10px] bg-primary/20 text-primary px-1 rounded">{matches.length}</span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="groups" className="text-[11px]">
                                Groups
                                {groupRows.length > 0 && (
                                    <span className="ml-1 text-[10px] bg-primary/20 text-primary px-1 rounded">{groupRows.length}</span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="explain" className="text-[11px]">Explain</TabsTrigger>
                            <TabsTrigger value="codegen" className="text-[11px]">Code Gen</TabsTrigger>
                        </TabsList>

                        <TabsContent value="matches" className="flex-1 overflow-y-auto min-h-0">
                            {matches.length === 0 ? (
                                <div className="p-3 text-xs text-muted-foreground text-center">
                                    {!state.pattern ? "Enter a pattern to start matching" :
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
                                            {match.captureGroups.length > 0 && (
                                                <div className="mt-1.5 space-y-0.5">
                                                    <span className="text-[10px] text-muted-foreground">Groups:</span>
                                                    {match.captureGroups.map((cg, gi) => {
                                                        const colorClass = GROUP_COLORS[gi % GROUP_COLORS.length]
                                                        return (
                                                            <div key={gi} className="flex items-baseline gap-1.5 text-[11px]">
                                                                <span className={`font-mono px-1 rounded ${colorClass}`}>
                                                                    {cg.name ?? `$${gi + 1}`}:
                                                                </span>
                                                                <span className="font-mono text-foreground/80">{cg.value}</span>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="groups" className="flex-1 min-h-0">
                            <GroupsTable groups={groupRows} />
                        </TabsContent>

                        <TabsContent value="explain" className="flex-1 overflow-y-auto min-h-0">
                            <RegexExplainer pattern={state.pattern} />
                        </TabsContent>

                        <TabsContent value="codegen" className="flex-1 min-h-0">
                            <RegexCodeGen
                                pattern={state.pattern}
                                flags={state.flags}
                                replacement={state.showReplace && state.replaceText ? state.replaceText : null}
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
