"use client"

export interface TreeOptionsType {
    rootSymbol: string
    branchStyle: "ascii" | "unicode" | "minimal"
    trailingSlash: boolean
    fullPath: boolean
}

export const defaultTreeOptions: TreeOptionsType = {
    rootSymbol: ".",
    branchStyle: "unicode",
    trailingSlash: false,
    fullPath: false,
}

interface TreeOptionsProps {
    options: TreeOptionsType
    onChange: (options: TreeOptionsType) => void
}

const BRANCH_STYLES: { value: TreeOptionsType["branchStyle"]; label: string }[] = [
    { value: "unicode", label: "Unicode" },
    { value: "ascii", label: "ASCII" },
    { value: "minimal", label: "Minimal" },
]

export function TreeOptions({ options, onChange }: TreeOptionsProps) {
    const updateOption = <K extends keyof TreeOptionsType>(
        key: K,
        value: TreeOptionsType[K]
    ) => {
        onChange({ ...options, [key]: value })
    }

    return (
        <>
            {/* Branch style pills */}
            {BRANCH_STYLES.map(s => (
                <button
                    key={s.value}
                    onClick={() => updateOption("branchStyle", s.value)}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                        options.branchStyle === s.value
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                >
                    {s.label}
                </button>
            ))}

            <div className="w-px h-4 bg-border mx-0.5" />

            {/* Root symbol */}
            <span className="text-[10px] text-muted-foreground">Root</span>
            <input
                type="text"
                value={options.rootSymbol}
                onChange={(e) => updateOption("rootSymbol", e.target.value || ".")}
                className="w-8 h-5 px-1 text-[11px] font-mono text-center bg-muted/30 border border-border rounded outline-none focus:border-ring text-foreground"
                spellCheck={false}
            />

            <div className="w-px h-4 bg-border mx-0.5" />

            {/* Trailing slash toggle */}
            <button
                onClick={() => updateOption("trailingSlash", !options.trailingSlash)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    options.trailingSlash
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                title="Add trailing slashes to directories"
            >
                dir/
            </button>

            {/* Full path toggle */}
            <button
                onClick={() => updateOption("fullPath", !options.fullPath)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    options.fullPath
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                title="Show full paths"
            >
                Full Path
            </button>
        </>
    )
}
