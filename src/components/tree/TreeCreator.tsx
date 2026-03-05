import { useState, useMemo, type KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import {
    CopyIcon,
    DownloadIcon,
    RefreshCwIcon,
    CheckIcon,
} from "lucide-react"
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

    const handleInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key !== "Tab" || event.shiftKey) {
            return
        }

        event.preventDefault()
        const textarea = event.currentTarget
        const indent = "  "
        const selectionStart = textarea.selectionStart
        const selectionEnd = textarea.selectionEnd

        textarea.setRangeText(indent, selectionStart, selectionEnd, "end")
        setInput(textarea.value)
    }

    return (
        <div className="h-full flex flex-col min-h-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 h-9 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mr-1">Tree</span>
                    <div className="w-px h-4 bg-border mx-0.5" />
                    <TreeOptions options={options} onChange={setOptions} />
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="xs" onClick={handleReset} title="Reset to example">
                        <RefreshCwIcon className="h-3 w-3" />
                    </Button>
                    <div className="w-px h-4 bg-border mx-0.5" />
                    <Button variant="ghost" size="xs" onClick={handleCopy} title="Copy output">
                        {copied ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
                    </Button>
                    <Button variant="ghost" size="xs" onClick={handleDownload} title="Download .txt">
                        <DownloadIcon className="h-3 w-3" />
                    </Button>
                </div>
            </div>

            {/* Two-panel layout */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0 gap-px bg-border">
                {/* Input panel */}
                <div className="flex flex-col bg-background w-full md:w-1/2 h-1/2 md:h-auto min-h-0">
                    <div className="flex items-center px-3 h-7 border-b border-border flex-shrink-0">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Input</span>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        placeholder="Enter your tree structure using indentation..."
                        className="flex-1 w-full px-3 py-2 text-sm font-mono bg-transparent text-foreground resize-none outline-none"
                        spellCheck={false}
                    />
                </div>

                {/* Output panel */}
                <div className="flex-1 flex flex-col bg-background min-w-0 h-1/2 md:h-auto min-h-0">
                    <div className="flex items-center px-3 h-7 border-b border-border flex-shrink-0">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Output</span>
                    </div>
                    <pre className="flex-1 px-3 py-2 text-sm font-mono text-foreground overflow-auto whitespace-pre min-h-0">
                        {output || "Your tree structure will appear here..."}
                    </pre>
                </div>
            </div>
        </div>
    )
}
