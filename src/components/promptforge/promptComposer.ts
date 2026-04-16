import {
    AUTONOMY_DESCRIPTIONS,
    INTENT_LABELS,
    SCOPE_DESCRIPTIONS,
    type BuilderState,
    type Example,
} from "./promptTypes"

function bulletize(raw: string): string {
    return raw
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => (line.startsWith("- ") || line.startsWith("* ") ? line : `- ${line}`))
        .join("\n")
}

function formatExample(example: Example, index: number): string | null {
    const description = example.description.trim()
    const given = example.given.trim()
    const expected = example.expected.trim()
    if (!description && !given && !expected) return null

    const lines: string[] = []
    if (description) lines.push(description)
    if (given) lines.push(`Input:\n${given}`)
    if (expected) lines.push(`Expected:\n${expected}`)

    return `<example index="${index + 1}">\n${lines.join("\n\n")}\n</example>`
}

function hasTaskContent(state: BuilderState): boolean {
    return state.task.trim().length > 0
}

export function composePrompt(state: BuilderState): string {
    if (!hasTaskContent(state)) return ""

    const sections: string[] = []

    if (state.persona.trim()) {
        sections.push(`<role>\n${state.persona.trim()}\n</role>`)
    }

    const intentVerb = INTENT_LABELS[state.intent]
    const taskText = state.task.trim()
    const firstWord = taskText.split(/\s+/)[0]?.toLowerCase() ?? ""
    const intentFirstWord = intentVerb.split(/\s+/)[0]?.toLowerCase() ?? ""
    const taskBody =
        firstWord && firstWord === intentFirstWord ? taskText : `${intentVerb}: ${taskText}`
    sections.push(`<task>\n${taskBody}\n</task>`)

    if (state.context.trim()) {
        sections.push(`<context>\n${state.context.trim()}\n</context>`)
    }

    if (state.prior.trim()) {
        sections.push(`<prior_investigation>\n${state.prior.trim()}\n</prior_investigation>`)
    }

    if (state.files.trim()) {
        sections.push(`<relevant_files>\n${bulletize(state.files)}\n</relevant_files>`)
    }

    if (state.constraints.trim()) {
        sections.push(`<constraints>\n${bulletize(state.constraints)}\n</constraints>`)
    }

    if (state.successCriteria.trim()) {
        sections.push(`<success_criteria>\n${bulletize(state.successCriteria)}\n</success_criteria>`)
    }

    const exampleBlocks = state.examples
        .map((ex, i) => formatExample(ex, i))
        .filter((x): x is string => Boolean(x))
    if (exampleBlocks.length > 0) {
        sections.push(`<examples>\n${exampleBlocks.join("\n")}\n</examples>`)
    }

    sections.push(`<scope>\n${SCOPE_DESCRIPTIONS[state.scope]}\n</scope>`)

    if (state.outputFormat.trim()) {
        sections.push(`<output_format>\n${state.outputFormat.trim()}\n</output_format>`)
    }

    sections.push(`<autonomy>\n${AUTONOMY_DESCRIPTIONS[state.autonomy]}\n</autonomy>`)

    return sections.join("\n\n")
}
