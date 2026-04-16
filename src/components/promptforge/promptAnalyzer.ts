import type { BuilderState, Example } from "./promptTypes"

export interface Check {
    id: string
    label: string
    weight: number
    passed: boolean
    hint: string
}

export interface ScoreResult {
    total: number
    checks: Check[]
}

const FILE_PATH_PATTERN =
    /[\w\-./@]+\.(tsx?|jsx?|mjs|cjs|py|go|rs|java|rb|php|css|scss|sass|less|html?|md|mdx|json|ya?ml|toml|sql|sh|bash|zsh|c|cpp|cc|cxx|h|hpp|swift|kt|kts|scala|dart|vue|svelte|astro|lua|ex|exs|erl|clj|cljs|hs|ml|fs|fsx|r|nim|zig|odin|v)\b/i

const LINE_REF_PATTERN = /\b(line|lines?|L)\s?\d+|:\d+(?::\d+)?\b/i

const IMPERATIVE_PATTERN =
    /\b(fix|add|remove|refactor|implement|create|delete|update|rename|change|write|build|design|investigate|review|audit|migrate|port|optimize|test|replace|extract|inline|split|merge|debug|diagnose|document|explain)\b/i

const CONTEXT_PATTERN =
    /\b(because|so that|why|context|background|currently|we need|users? are|the issue is|when|after|before|currently|historically|previously)\b/i

const SUCCESS_PATTERN =
    /\b(should|must|expected?|passe?s?|verify|validate|acceptance|success|return(s)?|produce(s)?|outputs?|behaves?|result in|criteria|done when)\b/i

const CONSTRAINT_PATTERN =
    /\b(don'?t|do not|never|must not|avoid|without|keep|preserve|maintain|unchanged|no new|not introduce|compatible|backward|backwards)\b/i

const SCOPE_PATTERN =
    /\b(only|just|minimal|smallest?|scope|limited to|focus on|restrict|in scope|out of scope)\b/i

const EXAMPLES_PATTERN = /\b(example|e\.g\.|for instance|input:|output:|given|expected:)\b/i

const FORMAT_PATTERN =
    /\b(format|json|ya?ml|diff|patch|code ?block|markdown|plain text|bullet(s|ed)?|list|xml|table|prose)\b/i

const XML_PATTERN = /<([a-z_][a-z0-9_-]*)>[\s\S]*?<\/\1>/i

const VAGUE_TASK_PATTERN = /^(fix|do|make|help( me)?|solve|handle|improve)\s+\w+\.?$/i

function countWords(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length
}

function makeCheck(
    id: string,
    label: string,
    weight: number,
    passed: boolean,
    hint: string,
): Check {
    return { id, label, weight, passed, hint }
}

function exampleHasContent(ex: Example): boolean {
    return (
        ex.description.trim().length > 0 ||
        ex.given.trim().length > 0 ||
        ex.expected.trim().length > 0
    )
}

export function scoreBuilder(state: BuilderState): ScoreResult {
    const taskWordCount = countWords(state.task)
    const taskLooksVague = VAGUE_TASK_PATTERN.test(state.task.trim())

    const checks: Check[] = [
        makeCheck(
            "task-present",
            "Task is defined",
            14,
            state.task.trim().length > 0,
            "State the concrete action you want performed. Without this, the agent has nothing to act on.",
        ),
        makeCheck(
            "task-specific",
            "Task is specific",
            10,
            taskWordCount >= 6 && !taskLooksVague,
            "Avoid one-word goals like 'fix bug'. Include the what + where + desired outcome.",
        ),
        makeCheck(
            "context",
            "Context explains why",
            12,
            state.context.trim().length >= 20,
            "Explain why the task matters. Claude generalizes better from motivation than from rules.",
        ),
        makeCheck(
            "success",
            "Success criteria stated",
            13,
            state.successCriteria.trim().length >= 10,
            "Tell the agent how it will know the task is done: tests that must pass, behaviors, or metrics.",
        ),
        makeCheck(
            "files",
            "Relevant files listed",
            10,
            state.files.trim().length > 0,
            "Point to file paths, symbols, or line numbers. Grounds the agent instead of letting it guess.",
        ),
        makeCheck(
            "constraints",
            "Constraints spelled out",
            10,
            state.constraints.trim().length > 0,
            "List what must NOT change, invariants, or non-negotiable technical choices.",
        ),
        makeCheck(
            "prior",
            "Prior attempts / rule-outs",
            7,
            state.prior.trim().length >= 10,
            "Mention what you already tried. Stops the agent repeating failed paths.",
        ),
        makeCheck(
            "examples",
            "Examples provided",
            8,
            state.examples.some(exampleHasContent),
            "One or two concrete input/output pairs steer output format far better than prose rules.",
        ),
        makeCheck(
            "output-format",
            "Output format described",
            5,
            state.outputFormat.trim().length > 0,
            "If you want a specific shape back (diff, code block, JSON, prose), say so explicitly.",
        ),
        makeCheck(
            "persona",
            "Role / persona set",
            3,
            state.persona.trim().length > 0,
            "Optional. A short role line can sharpen tone and focus.",
        ),
        makeCheck(
            "scope",
            "Scope selected",
            4,
            true,
            "",
        ),
        makeCheck(
            "autonomy",
            "Autonomy preference set",
            4,
            true,
            "",
        ),
    ]

    return finalize(checks)
}

export function scoreRaw(text: string): ScoreResult {
    const trimmed = text.trim()
    const wordCount = countWords(trimmed)

    const hasImperative = IMPERATIVE_PATTERN.test(trimmed)
    const hasFile = FILE_PATH_PATTERN.test(trimmed)
    const hasLine = LINE_REF_PATTERN.test(trimmed)
    const hasContext = CONTEXT_PATTERN.test(trimmed)
    const hasSuccess = SUCCESS_PATTERN.test(trimmed)
    const hasConstraints = CONSTRAINT_PATTERN.test(trimmed)
    const hasScope = SCOPE_PATTERN.test(trimmed)
    const hasExamples = EXAMPLES_PATTERN.test(trimmed)
    const hasFormat = FORMAT_PATTERN.test(trimmed)
    const hasXml = XML_PATTERN.test(trimmed)
    const hasReasonableLength = wordCount >= 15 && wordCount <= 2000
    const looksLikePoliteQuestion =
        /^(can you|could you|would you|please|i was wondering|hey|hi claude)/i.test(trimmed)

    const lengthHint =
        wordCount < 15
            ? "Too short. Add the what, where, and why."
            : wordCount > 2000
              ? "Long prompts lose the agent's attention. Trim repetition and move reference material into <context>."
              : ""

    const checks: Check[] = [
        makeCheck(
            "imperative",
            "Uses a clear imperative verb",
            12,
            hasImperative && !looksLikePoliteQuestion,
            "Say 'Fix …' or 'Refactor …', not 'Can you maybe look at …'. Agents follow imperatives more reliably.",
        ),
        makeCheck(
            "specific",
            "Has enough specificity",
            10,
            wordCount >= 25 && hasImperative,
            "One-liners underperform. Add the object, the location, and the desired outcome.",
        ),
        makeCheck(
            "files",
            "References concrete files",
            12,
            hasFile,
            "Name file paths (e.g. src/foo/bar.ts) so the agent knows where to look without guessing.",
        ),
        makeCheck(
            "lines",
            "Points to lines or symbols",
            5,
            hasLine,
            "Line numbers or function names make the task addressable rather than exploratory.",
        ),
        makeCheck(
            "context",
            "Provides context / why",
            12,
            hasContext,
            "Explain the situation. 'Users are seeing X because Y' beats 'it's broken'.",
        ),
        makeCheck(
            "success",
            "Describes what 'done' looks like",
            12,
            hasSuccess,
            "State success criteria: tests that pass, behaviors observable, metrics hit.",
        ),
        makeCheck(
            "constraints",
            "Lists constraints",
            8,
            hasConstraints,
            "Spell out what must not change. Agents will refactor freely in the absence of guardrails.",
        ),
        makeCheck(
            "scope",
            "Scopes the work",
            6,
            hasScope,
            "Use words like 'only this file' or 'minimal fix' to prevent over-engineering.",
        ),
        makeCheck(
            "examples",
            "Includes examples",
            6,
            hasExamples,
            "Concrete input/output pairs steer format and edge-case handling better than rules.",
        ),
        makeCheck(
            "format",
            "Output format described",
            4,
            hasFormat,
            "If the reply shape matters (diff, JSON, code block), say so. Otherwise the agent picks.",
        ),
        makeCheck(
            "length",
            "Reasonable length",
            4,
            hasReasonableLength,
            lengthHint,
        ),
        makeCheck(
            "structure",
            "Uses structural XML tags",
            5,
            hasXml,
            "Wrap sections in <task>, <context>, <constraints> etc. Reduces ambiguous parsing.",
        ),
    ]

    return finalize(checks)
}

function finalize(checks: Check[]): ScoreResult {
    const max = checks.reduce((sum, c) => sum + c.weight, 0)
    const got = checks.filter((c) => c.passed).reduce((sum, c) => sum + c.weight, 0)
    const total = max > 0 ? Math.round((got / max) * 100) : 0
    return { total, checks }
}

export function grade(score: number): { label: string; tone: "bad" | "ok" | "good" | "great" } {
    if (score >= 85) return { label: "Excellent", tone: "great" }
    if (score >= 65) return { label: "Solid", tone: "good" }
    if (score >= 40) return { label: "Needs work", tone: "ok" }
    return { label: "Weak", tone: "bad" }
}
