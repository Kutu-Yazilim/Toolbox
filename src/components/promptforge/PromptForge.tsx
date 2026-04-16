"use client"

import { useCallback, useMemo } from "react"
import {
    CheckCircle2Icon,
    CircleIcon,
    InfoIcon,
    PlusIcon,
    TrashIcon,
    WandSparklesIcon,
    XCircleIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useShareableUrl } from "@/hooks/useShareableUrl"
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { type Preset } from "@/components/shared/PresetsDrawer"
import { type ExportOption } from "@/components/shared/ExportMenu"
import { Button } from "@/components/ui/button"
import { PROMPT_FORGE_PRESETS } from "./promptForgePresets"
import { composePrompt } from "./promptComposer"
import { grade, scoreBuilder, scoreRaw, type ScoreResult } from "./promptAnalyzer"
import {
    DEFAULT_STATE,
    INTENT_DESCRIPTIONS,
    INTENT_LABELS,
    SCOPE_DESCRIPTIONS,
    AUTONOMY_DESCRIPTIONS,
    type BuilderState,
    type Example,
    type Intent,
    type Mode,
    type PromptForgeState,
    type Scope,
    type Autonomy,
} from "./promptTypes"

const INTENT_IDS: Intent[] = [
    "implement",
    "fix",
    "refactor",
    "investigate",
    "review",
    "test",
    "document",
    "optimize",
    "migrate",
]

const SCOPE_IDS: Scope[] = ["minimal", "standard", "comprehensive"]
const AUTONOMY_IDS: Autonomy[] = ["proceed", "confirm"]

export function PromptForge() {
    const [state, setState] = useLocalStorage<PromptForgeState>("prompt-forge", DEFAULT_STATE)

    const composed = useMemo(() => composePrompt(state.builder), [state.builder])

    const analysis: ScoreResult = useMemo(
        () => (state.mode === "build" ? scoreBuilder(state.builder) : scoreRaw(state.raw)),
        [state.mode, state.builder, state.raw],
    )

    const { shareUrl } = useShareableUrl<PromptForgeState>("prompt-forge", state, (restored) => {
        setState(restored)
    })

    const setMode = useCallback(
        (mode: Mode) => setState((prev) => ({ ...prev, mode })),
        [setState],
    )

    const updateBuilder = useCallback(
        (patch: Partial<BuilderState>) =>
            setState((prev) => ({ ...prev, builder: { ...prev.builder, ...patch } })),
        [setState],
    )

    const setRaw = useCallback(
        (raw: string) => setState((prev) => ({ ...prev, raw })),
        [setState],
    )

    const addExample = useCallback(
        () =>
            setState((prev) => ({
                ...prev,
                builder: {
                    ...prev.builder,
                    examples: [...prev.builder.examples, { description: "", given: "", expected: "" }],
                },
            })),
        [setState],
    )

    const updateExample = useCallback(
        (index: number, patch: Partial<Example>) =>
            setState((prev) => ({
                ...prev,
                builder: {
                    ...prev.builder,
                    examples: prev.builder.examples.map((ex, i) =>
                        i === index ? { ...ex, ...patch } : ex,
                    ),
                },
            })),
        [setState],
    )

    const removeExample = useCallback(
        (index: number) =>
            setState((prev) => ({
                ...prev,
                builder: {
                    ...prev.builder,
                    examples: prev.builder.examples.filter((_, i) => i !== index),
                },
            })),
        [setState],
    )

    const resetBuilder = useCallback(
        () => setState((prev) => ({ ...prev, builder: DEFAULT_STATE.builder })),
        [setState],
    )

    const handlePresetSelect = useCallback(
        (preset: Preset) => {
            const data = JSON.parse(preset.content) as BuilderState
            setState((prev) => ({ ...prev, mode: "build", builder: data }))
        },
        [setState],
    )

    const copyValue = state.mode === "build" ? composed : state.raw

    const handleDownload = useCallback(() => {
        const blob = new Blob([copyValue || ""], { type: "text/plain" })
        const a = document.createElement("a")
        a.href = URL.createObjectURL(blob)
        a.download = "prompt.md"
        a.click()
        URL.revokeObjectURL(a.href)
    }, [copyValue])

    const exportOptions: ExportOption[] = useMemo(
        () => [{ label: "Download prompt as .md", action: handleDownload }],
        [handleDownload],
    )

    const shortcuts: Shortcut[] = useMemo(
        () => [
            {
                key: "mod+shift+c",
                label: "Copy prompt",
                action: () => {
                    if (copyValue) void navigator.clipboard.writeText(copyValue)
                },
            },
            {
                key: "mod+shift+b",
                label: "Switch to Build mode",
                action: () => setMode("build"),
            },
            {
                key: "mod+shift+a",
                label: "Switch to Analyze mode",
                action: () => setMode("analyze"),
            },
        ],
        [copyValue, setMode],
    )

    useKeyboardShortcuts(shortcuts)

    const scoreGrade = grade(analysis.total)

    return (
        <div className="flex h-full flex-col">
            <ToolToolbar
                title="Prompt Forge"
                copyValue={copyValue || undefined}
                onShare={shareUrl}
                exportOptions={exportOptions}
                presets={PROMPT_FORGE_PRESETS}
                onPresetSelect={handlePresetSelect}
                shortcuts={shortcuts}
            />

            {/* ── Mode tabs ───────────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2 flex-shrink-0">
                <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
                    <ModeButton
                        active={state.mode === "build"}
                        label="Build"
                        onClick={() => setMode("build")}
                    />
                    <ModeButton
                        active={state.mode === "analyze"}
                        label="Analyze"
                        onClick={() => setMode("analyze")}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <ScoreBadge score={analysis.total} grade={scoreGrade} />
                    {state.mode === "build" && (
                        <Button variant="ghost" size="xs" onClick={resetBuilder} title="Clear all fields">
                            <TrashIcon className="h-3 w-3" /> Clear
                        </Button>
                    )}
                </div>
            </div>

            {/* ── Intro bar ───────────────────────────────────────────── */}
            <div className="flex items-start gap-2 border-b border-border bg-muted/20 px-4 py-2 text-xs text-muted-foreground flex-shrink-0">
                <InfoIcon className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {state.mode === "build" ? (
                    <span>
                        Fill in the fields on the left. The right panel previews the XML-structured prompt I
                        parse best — copy it into Claude Code, Cursor, or any agentic coder.
                    </span>
                ) : (
                    <span>
                        Paste an existing prompt. I&apos;ll score it against what agentic coders actually use
                        and tell you what&apos;s missing.
                    </span>
                )}
            </div>

            {/* ── Content ─────────────────────────────────────────────── */}
            {state.mode === "build" ? (
                <div className="grid min-h-0 flex-1 gap-0 md:grid-cols-2">
                    <div className="flex min-h-0 flex-col overflow-y-auto border-border p-4 md:border-r">
                        <BuilderForm
                            state={state.builder}
                            onChange={updateBuilder}
                            onAddExample={addExample}
                            onUpdateExample={updateExample}
                            onRemoveExample={removeExample}
                        />
                    </div>
                    <div className="flex min-h-0 flex-col overflow-y-auto p-4">
                        <OutputPanel composed={composed} analysis={analysis} />
                    </div>
                </div>
            ) : (
                <div className="grid min-h-0 flex-1 gap-0 md:grid-cols-2">
                    <div className="flex min-h-0 flex-col border-border p-4 md:border-r">
                        <label className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Paste your prompt
                        </label>
                        <textarea
                            value={state.raw}
                            onChange={(e) => setRaw(e.target.value)}
                            placeholder="Paste the prompt you're about to send an agent. You'll get a score and a checklist of what to add."
                            spellCheck={false}
                            className="min-h-0 flex-1 resize-none rounded-md border border-border bg-background p-3 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-muted-foreground"
                        />
                    </div>
                    <div className="flex min-h-0 flex-col overflow-y-auto p-4">
                        <AnalysisPanel analysis={analysis} />
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Mode button ────────────────────────────────────────────────────────────

function ModeButton({
    active,
    label,
    onClick,
}: {
    active: boolean
    label: string
    onClick: () => void
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "rounded px-3 py-1 text-xs font-medium transition-colors",
                active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground",
            )}
        >
            {label}
        </button>
    )
}

// ─── Score badge ────────────────────────────────────────────────────────────

function ScoreBadge({
    score,
    grade,
}: {
    score: number
    grade: { label: string; tone: "bad" | "ok" | "good" | "great" }
}) {
    const toneClass = {
        bad: "text-destructive border-destructive/30 bg-destructive/10",
        ok: "text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10",
        good: "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
        great: "text-emerald-600 dark:text-emerald-400 border-emerald-500/40 bg-emerald-500/15",
    }[grade.tone]

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold",
                toneClass,
            )}
            title={`${grade.label} — ${score}/100`}
        >
            <WandSparklesIcon className="h-3 w-3" />
            {score}/100 · {grade.label}
        </span>
    )
}

// ─── Builder form ───────────────────────────────────────────────────────────

function BuilderForm({
    state,
    onChange,
    onAddExample,
    onUpdateExample,
    onRemoveExample,
}: {
    state: BuilderState
    onChange: (patch: Partial<BuilderState>) => void
    onAddExample: () => void
    onUpdateExample: (index: number, patch: Partial<Example>) => void
    onRemoveExample: (index: number) => void
}) {
    return (
        <div className="flex flex-col gap-5">
            {/* Intent */}
            <Section label="Intent" hint="What kind of work is this?">
                <div className="flex flex-wrap gap-1.5">
                    {INTENT_IDS.map((id) => (
                        <button
                            key={id}
                            onClick={() => onChange({ intent: id })}
                            className={cn(
                                "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                                state.intent === id
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border bg-muted text-muted-foreground hover:border-muted-foreground hover:text-foreground",
                            )}
                        >
                            {INTENT_LABELS[id]}
                        </button>
                    ))}
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground/70">
                    {INTENT_DESCRIPTIONS[state.intent]}
                </p>
            </Section>

            {/* Task */}
            <Section
                label="Task"
                required
                hint="One or two sentences. Include the what, the where, and the desired outcome."
            >
                <textarea
                    value={state.task}
                    onChange={(e) => onChange({ task: e.target.value })}
                    placeholder="e.g. Fix the race condition in src/lib/session-cache.ts that drops one of two concurrent writes"
                    rows={3}
                    spellCheck={false}
                    className={fieldClass}
                />
            </Section>

            {/* Context */}
            <Section
                label="Context"
                hint="Why this matters. What users see, what the system does today, what led here."
            >
                <textarea
                    value={state.context}
                    onChange={(e) => onChange({ context: e.target.value })}
                    placeholder="e.g. Users are intermittently logged out when multiple tabs refresh at once. The session token is reset because concurrent writes overwrite each other."
                    rows={3}
                    spellCheck={false}
                    className={fieldClass}
                />
            </Section>

            {/* Prior work */}
            <Section
                label="Prior work & rule-outs"
                hint="What you already tried or ruled out, so the agent doesn't repeat failed paths."
            >
                <textarea
                    value={state.prior}
                    onChange={(e) => onChange({ prior: e.target.value })}
                    placeholder={"e.g.\nRuled out Redis locking (works in isolation)\nChecked middleware/session.ts — not the source"}
                    rows={3}
                    spellCheck={false}
                    className={fieldClass}
                />
            </Section>

            {/* Files */}
            <Section
                label="Relevant files / locations"
                hint="One per line. Include line numbers or symbol names when you can. Mark anything read-only."
            >
                <textarea
                    value={state.files}
                    onChange={(e) => onChange({ files: e.target.value })}
                    placeholder={"e.g.\nsrc/lib/session-cache.ts\nsrc/middleware/session.ts (context only, do not modify)"}
                    rows={3}
                    spellCheck={false}
                    className={fieldClass + " font-mono"}
                />
            </Section>

            {/* Constraints */}
            <Section
                label="Constraints"
                hint="What must NOT change. Invariants, technical non-negotiables, style rules."
            >
                <textarea
                    value={state.constraints}
                    onChange={(e) => onChange({ constraints: e.target.value })}
                    placeholder={"e.g.\nKeep SessionCache public API unchanged\nNo new dependencies\nExisting tests must still pass"}
                    rows={3}
                    spellCheck={false}
                    className={fieldClass}
                />
            </Section>

            {/* Success criteria */}
            <Section
                label="Success criteria"
                hint="How you'll know it's done. Tests that pass, observable behaviors, metrics."
            >
                <textarea
                    value={state.successCriteria}
                    onChange={(e) => onChange({ successCriteria: e.target.value })}
                    placeholder={"e.g.\nConcurrent writes 10ms apart no longer produce a lost-update\nAll existing session-cache tests pass\nNew test added covering the race condition"}
                    rows={3}
                    spellCheck={false}
                    className={fieldClass}
                />
            </Section>

            {/* Examples */}
            <Section
                label="Examples"
                hint="Optional but powerful. 1–3 concrete input/output pairs steer format better than prose."
            >
                <div className="flex flex-col gap-2.5">
                    {state.examples.map((ex, i) => (
                        <div
                            key={i}
                            className="flex flex-col gap-2 rounded-md border border-border bg-muted/20 p-2.5"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                                    Example {i + 1}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => onRemoveExample(i)}
                                    title="Remove example"
                                >
                                    <TrashIcon className="h-3 w-3" />
                                </Button>
                            </div>
                            <input
                                value={ex.description}
                                onChange={(e) => onUpdateExample(i, { description: e.target.value })}
                                placeholder="Describe the example (optional)"
                                className={fieldClassInput}
                            />
                            <textarea
                                value={ex.given}
                                onChange={(e) => onUpdateExample(i, { given: e.target.value })}
                                placeholder="Given / input"
                                rows={2}
                                spellCheck={false}
                                className={fieldClass + " font-mono"}
                            />
                            <textarea
                                value={ex.expected}
                                onChange={(e) => onUpdateExample(i, { expected: e.target.value })}
                                placeholder="Expected / output"
                                rows={2}
                                spellCheck={false}
                                className={fieldClass + " font-mono"}
                            />
                        </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={onAddExample}>
                        <PlusIcon className="h-3 w-3" /> Add example
                    </Button>
                </div>
            </Section>

            {/* Output format */}
            <Section
                label="Output format"
                hint="Optional. If you want a specific shape back (diff, JSON, markdown), say so."
            >
                <input
                    value={state.outputFormat}
                    onChange={(e) => onChange({ outputFormat: e.target.value })}
                    placeholder="e.g. Unified diff, Markdown with H2 sections, JSON matching schema X"
                    className={fieldClassInput}
                />
            </Section>

            {/* Scope */}
            <Section label="Scope" hint="How much should the agent do?">
                <div className="flex flex-wrap gap-1.5">
                    {SCOPE_IDS.map((s) => (
                        <button
                            key={s}
                            onClick={() => onChange({ scope: s })}
                            className={cn(
                                "rounded-md border px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                                state.scope === s
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border bg-muted text-muted-foreground hover:border-muted-foreground hover:text-foreground",
                            )}
                        >
                            {s}
                        </button>
                    ))}
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground/70">
                    {SCOPE_DESCRIPTIONS[state.scope]}
                </p>
            </Section>

            {/* Autonomy */}
            <Section label="Autonomy" hint="Should the agent ask first or just do it?">
                <div className="flex flex-wrap gap-1.5">
                    {AUTONOMY_IDS.map((a) => (
                        <button
                            key={a}
                            onClick={() => onChange({ autonomy: a })}
                            className={cn(
                                "rounded-md border px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                                state.autonomy === a
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border bg-muted text-muted-foreground hover:border-muted-foreground hover:text-foreground",
                            )}
                        >
                            {a === "proceed" ? "Proceed" : "Confirm first"}
                        </button>
                    ))}
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground/70">
                    {AUTONOMY_DESCRIPTIONS[state.autonomy]}
                </p>
            </Section>

            {/* Persona */}
            <Section
                label="Role / persona"
                hint="Optional. A single sentence role that sharpens tone and focus."
            >
                <input
                    value={state.persona}
                    onChange={(e) => onChange({ persona: e.target.value })}
                    placeholder="e.g. You are a senior engineer reviewing a pull request."
                    className={fieldClassInput}
                />
            </Section>
        </div>
    )
}

// ─── Output panel (Build mode) ──────────────────────────────────────────────

function OutputPanel({ composed, analysis }: { composed: string; analysis: ScoreResult }) {
    return (
        <div className="flex min-h-0 flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Composed prompt
                </span>
                <span className="text-[11px] text-muted-foreground/70">
                    {composed ? `${composed.length.toLocaleString()} chars` : "empty"}
                </span>
            </div>
            <pre className="flex-1 overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-muted/20 p-3 font-mono text-[12px] leading-relaxed text-foreground">
                {composed || "Start with a task on the left. The XML-structured prompt will appear here as you type."}
            </pre>
            <div>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Checklist
                </span>
                <ChecklistList analysis={analysis} />
            </div>
        </div>
    )
}

// ─── Analysis panel (Analyze mode) ──────────────────────────────────────────

function AnalysisPanel({ analysis }: { analysis: ScoreResult }) {
    const missing = analysis.checks.filter((c) => !c.passed)
    return (
        <div className="flex min-h-0 flex-col gap-4">
            <div>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Checklist
                </span>
                <ChecklistList analysis={analysis} />
            </div>

            <div>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Suggestions
                </span>
                {missing.length === 0 ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                        Nothing to suggest — this prompt covers the signals an agentic coder uses to act
                        confidently.
                    </p>
                ) : (
                    <ul className="mt-2 flex flex-col gap-2">
                        {missing.map((c) => (
                            <li
                                key={c.id}
                                className="flex gap-2 rounded-md border border-border bg-muted/20 p-2.5 text-xs leading-relaxed"
                            >
                                <XCircleIcon className="h-3.5 w-3.5 shrink-0 text-destructive mt-0.5" />
                                <div className="flex flex-col gap-0.5">
                                    <span className="font-medium text-foreground">{c.label}</span>
                                    <span className="text-muted-foreground">{c.hint}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}

function ChecklistList({ analysis }: { analysis: ScoreResult }) {
    return (
        <ul className="mt-2 flex flex-col gap-1">
            {analysis.checks.map((c) => (
                <li key={c.id} className="flex items-start gap-2 text-xs">
                    {c.passed ? (
                        <CheckCircle2Icon className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
                    ) : (
                        <CircleIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 mt-0.5" />
                    )}
                    <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-2">
                        <span className={cn(c.passed ? "text-foreground" : "text-muted-foreground")}>
                            {c.label}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground/60">
                            +{c.weight}
                        </span>
                    </div>
                </li>
            ))}
        </ul>
    )
}

// ─── Shared field styles ────────────────────────────────────────────────────

const fieldClass =
    "w-full resize-none rounded-md border border-border bg-background p-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-muted-foreground"

const fieldClassInput =
    "h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-muted-foreground"

// ─── Section wrapper ────────────────────────────────────────────────────────

function Section({
    label,
    required,
    hint,
    children,
}: {
    label: string
    required?: boolean
    hint?: string
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    {label}
                    {required && <span className="ml-1 text-destructive">*</span>}
                </span>
            </div>
            {hint && (
                <p className="-mt-0.5 text-[11px] leading-relaxed text-muted-foreground/70">{hint}</p>
            )}
            {children}
        </div>
    )
}
