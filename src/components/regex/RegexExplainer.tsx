"use client"

interface ExplainToken {
    token: string
    description: string
    depth: number
}

const ESCAPE_MAP: Record<string, string> = {
    d: "Any digit (0-9)",
    D: "Any non-digit",
    w: "Any word character (a-z, A-Z, 0-9, _)",
    W: "Any non-word character",
    s: "Any whitespace character",
    S: "Any non-whitespace character",
    b: "Word boundary",
    B: "Non-word boundary",
    n: "Newline",
    r: "Carriage return",
    t: "Tab character",
}

function parseRegex(pattern: string): ExplainToken[] {
    const tokens: ExplainToken[] = []
    let i = 0
    let depth = 0
    let groupIndex = 0

    while (i < pattern.length) {
        const ch = pattern[i]

        if (ch === "\\") {
            i++
            if (i >= pattern.length) {
                tokens.push({ token: "\\", description: "Trailing backslash", depth })
                break
            }
            const next = pattern[i]
            if (ESCAPE_MAP[next]) {
                tokens.push({ token: `\\${next}`, description: ESCAPE_MAP[next], depth })
            } else if (/\d/.test(next)) {
                tokens.push({ token: `\\${next}`, description: `Back-reference to group ${next}`, depth })
            } else {
                tokens.push({ token: `\\${next}`, description: `Literal "${next}"`, depth })
            }
            i++
            continue
        }

        if (ch === "[") {
            const start = i
            let negated = false
            i++
            if (i < pattern.length && pattern[i] === "^") {
                negated = true
                i++
            }
            while (i < pattern.length && pattern[i] !== "]") {
                if (pattern[i] === "\\" && i + 1 < pattern.length) i++
                i++
            }
            if (i < pattern.length) i++
            const charClass = pattern.slice(start, i)
            const inner = charClass.slice(negated ? 2 : 1, -1)
            const prefix = negated ? "Any character NOT in" : "Any character in"
            tokens.push({ token: charClass, description: `${prefix}: ${inner}`, depth })
            continue
        }

        if (ch === "(") {
            i++
            if (i < pattern.length && pattern[i] === "?") {
                i++
                if (i < pattern.length && pattern[i] === ":") {
                    i++
                    tokens.push({ token: "(?:", description: "Non-capturing group", depth })
                } else if (i < pattern.length && pattern[i] === "=") {
                    i++
                    tokens.push({ token: "(?=", description: "Positive lookahead", depth })
                } else if (i < pattern.length && pattern[i] === "!") {
                    i++
                    tokens.push({ token: "(?!", description: "Negative lookahead", depth })
                } else if (i + 1 < pattern.length && pattern[i] === "<" && pattern[i + 1] === "=") {
                    i += 2
                    tokens.push({ token: "(?<=", description: "Positive lookbehind", depth })
                } else if (i + 1 < pattern.length && pattern[i] === "<" && pattern[i + 1] === "!") {
                    i += 2
                    tokens.push({ token: "(?<!", description: "Negative lookbehind", depth })
                } else if (i < pattern.length && pattern[i] === "<") {
                    i++
                    const nameStart = i
                    while (i < pattern.length && pattern[i] !== ">") i++
                    const name = pattern.slice(nameStart, i)
                    if (i < pattern.length) i++
                    groupIndex++
                    tokens.push({ token: `(?<${name}>`, description: `Named capture group "${name}" (group ${groupIndex})`, depth })
                } else {
                    tokens.push({ token: "(?", description: "Group modifier", depth })
                }
            } else {
                groupIndex++
                tokens.push({ token: "(", description: `Capture group ${groupIndex}`, depth })
            }
            depth++
            continue
        }

        if (ch === ")") {
            depth = Math.max(0, depth - 1)
            tokens.push({ token: ")", description: "End of group", depth })
            i++
            continue
        }

        if (ch === "{") {
            const start = i
            i++
            while (i < pattern.length && pattern[i] !== "}") i++
            if (i < pattern.length) i++
            const quantifier = pattern.slice(start, i)
            const inner = quantifier.slice(1, -1)
            const parts = inner.split(",")
            if (parts.length === 1) {
                tokens.push({ token: quantifier, description: `Exactly ${parts[0]} times`, depth })
            } else if (parts[1] === "") {
                tokens.push({ token: quantifier, description: `${parts[0]} or more times`, depth })
            } else {
                tokens.push({ token: quantifier, description: `Between ${parts[0]} and ${parts[1]} times`, depth })
            }
            continue
        }

        if (ch === "^") {
            tokens.push({ token: "^", description: "Start of string (or line in multiline mode)", depth })
            i++
            continue
        }

        if (ch === "$") {
            tokens.push({ token: "$", description: "End of string (or line in multiline mode)", depth })
            i++
            continue
        }

        if (ch === ".") {
            tokens.push({ token: ".", description: "Any character (except newline)", depth })
            i++
            continue
        }

        if (ch === "|") {
            tokens.push({ token: "|", description: "Or (alternation)", depth })
            i++
            continue
        }

        if (ch === "*") {
            const lazy = i + 1 < pattern.length && pattern[i + 1] === "?"
            tokens.push({
                token: lazy ? "*?" : "*",
                description: lazy ? "Zero or more (lazy/non-greedy)" : "Zero or more of the preceding",
                depth,
            })
            i += lazy ? 2 : 1
            continue
        }

        if (ch === "+") {
            const lazy = i + 1 < pattern.length && pattern[i + 1] === "?"
            tokens.push({
                token: lazy ? "+?" : "+",
                description: lazy ? "One or more (lazy/non-greedy)" : "One or more of the preceding",
                depth,
            })
            i += lazy ? 2 : 1
            continue
        }

        if (ch === "?") {
            tokens.push({ token: "?", description: "Optional (zero or one)", depth })
            i++
            continue
        }

        tokens.push({ token: ch, description: `Literal "${ch}"`, depth })
        i++
    }

    return tokens
}

interface RegexExplainerProps {
    pattern: string
}

export function RegexExplainer({ pattern }: RegexExplainerProps) {
    if (!pattern) {
        return (
            <div className="p-4 text-xs text-muted-foreground text-center">
                Enter a pattern to see its breakdown
            </div>
        )
    }

    const tokens = parseRegex(pattern)

    return (
        <div className="divide-y divide-border">
            {tokens.map((t, i) => (
                <div key={i} className="flex items-baseline gap-3 px-3 py-2" style={{ paddingLeft: `${12 + t.depth * 16}px` }}>
                    <code className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
                        {t.token}
                    </code>
                    <span className="text-xs text-muted-foreground">{t.description}</span>
                </div>
            ))}
        </div>
    )
}
