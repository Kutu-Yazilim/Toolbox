export type Intent =
    | "implement"
    | "fix"
    | "refactor"
    | "investigate"
    | "review"
    | "test"
    | "document"
    | "optimize"
    | "migrate"

export type Scope = "minimal" | "standard" | "comprehensive"

export type Autonomy = "proceed" | "confirm"

export type Mode = "build" | "analyze"

export interface Example {
    description: string
    given: string
    expected: string
}

export interface BuilderState {
    persona: string
    intent: Intent
    task: string
    context: string
    prior: string
    files: string
    constraints: string
    successCriteria: string
    examples: Example[]
    scope: Scope
    outputFormat: string
    autonomy: Autonomy
}

export interface PromptForgeState {
    mode: Mode
    builder: BuilderState
    raw: string
}

export const INTENT_LABELS: Record<Intent, string> = {
    implement: "Implement",
    fix: "Fix",
    refactor: "Refactor",
    investigate: "Investigate",
    review: "Review",
    test: "Write tests for",
    document: "Document",
    optimize: "Optimize",
    migrate: "Migrate",
}

export const INTENT_DESCRIPTIONS: Record<Intent, string> = {
    implement: "Build a new feature or capability from scratch",
    fix: "Diagnose and repair a bug or defect",
    refactor: "Restructure code without changing behavior",
    investigate: "Research a question, no code changes unless asked",
    review: "Audit existing code and surface findings",
    test: "Write or expand a test suite",
    document: "Add or improve documentation and comments",
    optimize: "Improve performance or resource usage",
    migrate: "Move code between versions, frameworks, or APIs",
}

export const SCOPE_DESCRIPTIONS: Record<Scope, string> = {
    minimal:
        "Make the smallest change that solves the problem. Do not refactor, clean up, or add features beyond what is strictly required.",
    standard:
        "Solve the problem fully. Do not add speculative features, abstractions, or 'improvements' outside the stated scope.",
    comprehensive:
        "Produce a thorough, production-ready solution. Include edge cases, defensive handling at system boundaries, tests, and relevant documentation.",
}

export const AUTONOMY_DESCRIPTIONS: Record<Autonomy, string> = {
    proceed:
        "Proceed with implementation. Use tools to discover missing details rather than asking. For genuinely ambiguous decisions, pick the most conservative option and note the choice.",
    confirm:
        "Before making changes, state your plan in one short paragraph. Ask for confirmation on any decision that is non-obvious or would touch files outside the ones listed above.",
}

export const DEFAULT_BUILDER_STATE: BuilderState = {
    persona: "",
    intent: "fix",
    task: "",
    context: "",
    prior: "",
    files: "",
    constraints: "",
    successCriteria: "",
    examples: [],
    scope: "standard",
    outputFormat: "",
    autonomy: "proceed",
}

export const DEFAULT_STATE: PromptForgeState = {
    mode: "build",
    builder: DEFAULT_BUILDER_STATE,
    raw: "",
}
