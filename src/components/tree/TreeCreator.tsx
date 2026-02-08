import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CopyIcon, DownloadIcon, RefreshCwIcon } from "lucide-react"
import { TreeOptions, type TreeOptionsType, defaultTreeOptions } from "./TreeOptions"
import { generateTree } from "@/utils/treeGenerator"

const EXAMPLE_INPUT = `lib
  navigation
    components
    providers
    shells
    app_router.dart
  theme
    providers
      app_color_provider.dart
      app_theme_provider.dart
    colors
      tailwind_colors.dart
      app_colors.dart
    app_size.dart
    app_text_style.dart
    app_color_scheme.dart
  features
    \${feature_name}
      models
        dtos
      interfaces
      repositories
        local_\${feature_name}_repository.dart
        remote_\${feature_name}_repository.dart
      services
        \${feature_name}_service.dart
      presentation
        components
        \${feature_name}_page.dart
      providers
      utils
  shared
    models
    interfaces
    services
    components
    utils
    functions
    constants
    enums
    extensions
    hooks`

export function TreeCreator() {
    const [input, setInput] = useState(EXAMPLE_INPUT)
    const [options, setOptions] = useState<TreeOptionsType>(defaultTreeOptions)
    const [copied, setCopied] = useState(false)

    const output = useMemo(() => {
        return generateTree(input, options)
    }, [input, options])

    const handleCopy = async () => {
        await navigator.clipboard.writeText(output)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleDownload = () => {
        const blob = new Blob([output], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "tree-structure.txt"
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleReset = () => {
        setInput(EXAMPLE_INPUT)
        setOptions(defaultTreeOptions)
    }

    return (
        <div className="grid gap-4 lg:grid-cols-2 h-[calc(100vh-140px)] min-h-[600px]">
            <div className="flex flex-col gap-4">
                <Card className="flex-1 flex flex-col">
                    <CardHeader className="pb-3 flex-shrink-0">
                        <CardTitle className="text-lg flex items-center justify-between">
                            Input
                            <Button variant="ghost" size="sm" onClick={handleReset}>
                                <RefreshCwIcon className="h-4 w-4 mr-1" />
                                Reset
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0">
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Enter your tree structure using indentation..."
                            className="font-mono text-sm h-full resize-none"
                            spellCheck={false}
                        />
                    </CardContent>
                </Card>

                <TreeOptions options={options} onChange={setOptions} />
            </div>

            <Card className="flex flex-col">
                <CardHeader className="pb-3 flex-shrink-0">
                    <CardTitle className="text-lg flex items-center justify-between">
                        Output
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleCopy}>
                                <CopyIcon className="h-4 w-4 mr-1" />
                                {copied ? "Copied!" : "Copy"}
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleDownload}>
                                <DownloadIcon className="h-4 w-4 mr-1" />
                                Download
                            </Button>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 min-h-0">
                    <pre className="font-mono text-sm bg-muted p-4 rounded-lg overflow-auto h-full whitespace-pre">
                        {output || "Your tree structure will appear here..."}
                    </pre>
                </CardContent>
            </Card>
        </div>
    )
}
