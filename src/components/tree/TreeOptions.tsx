import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

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

export function TreeOptions({ options, onChange }: TreeOptionsProps) {
    const updateOption = <K extends keyof TreeOptionsType>(
        key: K,
        value: TreeOptionsType[K]
    ) => {
        onChange({ ...options, [key]: value })
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Root Symbol</label>
                    <input
                        type="text"
                        value={options.rootSymbol}
                        onChange={(e) => updateOption("rootSymbol", e.target.value || ".")}
                        className="flex h-9 w-full max-w-[200px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        placeholder="."
                    />
                    <p className="text-xs text-muted-foreground">
                        The symbol shown at the top of the tree (default: ".")
                    </p>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Branch Style</label>
                    <div className="flex gap-2">
                        {(["unicode", "ascii", "minimal"] as const).map((style) => (
                            <Button
                                key={style}
                                variant={options.branchStyle === style ? "default" : "outline"}
                                size="sm"
                                onClick={() => updateOption("branchStyle", style)}
                                className="capitalize"
                            >
                                {style}
                            </Button>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {options.branchStyle === "unicode" && "├──, └──, │ (default)"}
                        {options.branchStyle === "ascii" && "+-- and |"}
                        {options.branchStyle === "minimal" && "Simple dashes"}
                    </p>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-sm font-medium">Trailing Slashes</label>
                        <p className="text-xs text-muted-foreground">
                            Add "/" after directories
                        </p>
                    </div>
                    <Button
                        variant={options.trailingSlash ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateOption("trailingSlash", !options.trailingSlash)}
                    >
                        {options.trailingSlash ? "On" : "Off"}
                    </Button>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-sm font-medium">Full Path Mode</label>
                        <p className="text-xs text-muted-foreground">
                            Show complete paths for each item
                        </p>
                    </div>
                    <Button
                        variant={options.fullPath ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateOption("fullPath", !options.fullPath)}
                    >
                        {options.fullPath ? "On" : "Off"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
