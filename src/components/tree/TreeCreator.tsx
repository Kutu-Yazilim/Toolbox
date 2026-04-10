"use client"

import { useState, useMemo, useCallback, useRef } from "react"
import Editor from "@monaco-editor/react"
import { toPng } from "html-to-image"
import { RefreshCwIcon, UploadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TreeOptions, type TreeOptionsType, defaultTreeOptions } from "./TreeOptions"
import { VisualTreeView } from "./VisualTreeView"
import { TREE_PRESETS } from "./treePresets"
import { generateTree, generateMarkdownTree, parseInput } from "@/utils/treeGenerator"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useShareableUrl } from "@/hooks/useShareableUrl"
import { useFileImport } from "@/hooks/useFileImport"
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts"
import { useTheme } from "@/hooks/useTheme"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import type { Preset } from "@/components/shared/PresetsDrawer"

const STORAGE_KEY = "kutu-tree-generator"
const TOOL_ID = "tree-generator"

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

type OutputTab = "text" | "visual"

interface PersistedState {
    input: string
    options: TreeOptionsType
}

const DEFAULT_STATE: PersistedState = {
    input: EXAMPLE_INPUT,
    options: defaultTreeOptions,
}

export function TreeCreator() {
    const [persisted, setPersisted] = useLocalStorage<PersistedState>(STORAGE_KEY, DEFAULT_STATE)
    const [activeTab, setActiveTab] = useState<OutputTab>("text")
    const outputRef = useRef<HTMLDivElement>(null)
    const { isDark } = useTheme()

    const input = persisted.input
    const options = persisted.options

    const setInput = useCallback((value: string) => {
        setPersisted((prev) => ({ ...prev, input: value }))
    }, [setPersisted])

    const setOptions = useCallback((value: TreeOptionsType) => {
        setPersisted((prev) => ({ ...prev, options: value }))
    }, [setPersisted])

    const output = useMemo(() => generateTree(input, options), [input, options])
    const nodes = useMemo(() => parseInput(input, { stripComments: options.stripComments }), [input, options.stripComments])

    const handleRestore = useCallback((state: PersistedState) => {
        setPersisted(state)
    }, [setPersisted])

    const { shareUrl } = useShareableUrl<PersistedState>(TOOL_ID, persisted, handleRestore)

    const { dropzoneProps, openFilePicker, isDragging } = useFileImport({
        accept: [".txt"],
        onImport: (content) => setInput(content),
    })

    const handleReset = useCallback(() => {
        setPersisted(DEFAULT_STATE)
    }, [setPersisted])

    const handleDownloadTxt = useCallback(() => {
        const blob = new Blob([output], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "tree-structure.txt"
        a.click()
        URL.revokeObjectURL(url)
    }, [output])

    const handleExportPng = useCallback(async () => {
        if (!outputRef.current) return
        const dataUrl = await toPng(outputRef.current, {
            backgroundColor: isDark ? "#09090b" : "#ffffff",
            style: { padding: "16px" },
        })
        const a = document.createElement("a")
        a.href = dataUrl
        a.download = "tree-structure.png"
        a.click()
    }, [isDark])

    const handleExportMarkdown = useCallback(() => {
        const md = generateMarkdownTree(input, options)
        const blob = new Blob([md], { type: "text/markdown" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "tree-structure.md"
        a.click()
        URL.revokeObjectURL(url)
    }, [input, options])

    const handlePresetSelect = useCallback((preset: Preset) => {
        setInput(preset.content)
    }, [setInput])

    const exportOptions = useMemo(() => [
        { label: "Download as .txt", action: handleDownloadTxt },
        { label: "Export as PNG", action: handleExportPng },
        { label: "Export as Markdown", action: handleExportMarkdown },
    ], [handleDownloadTxt, handleExportPng, handleExportMarkdown])

    const shortcuts: Shortcut[] = useMemo(() => [
        { key: "mod+s", label: "Share URL", action: () => void shareUrl() },
        { key: "mod+shift+c", label: "Copy output", action: () => void navigator.clipboard.writeText(output) },
        { key: "mod+shift+e", label: "Export PNG", action: () => void handleExportPng() },
        { key: "mod+o", label: "Import file", action: openFilePicker },
        { key: "mod+shift+r", label: "Reset", action: handleReset },
    ], [shareUrl, output, handleExportPng, openFilePicker, handleReset])

    useKeyboardShortcuts(shortcuts)

    const OUTPUT_TABS: { value: OutputTab; label: string }[] = [
        { value: "text", label: "Text" },
        { value: "visual", label: "Visual" },
    ]

    return (
        <div className="h-full flex flex-col min-h-0" {...dropzoneProps}>
            <ToolToolbar
                title="Tree"
                copyValue={output}
                onShare={shareUrl}
                exportOptions={exportOptions}
                presets={TREE_PRESETS}
                onPresetSelect={handlePresetSelect}
                shortcuts={shortcuts}
                actions={
                    <div className="flex items-center gap-1.5">
                        <TreeOptions options={options} onChange={setOptions} />
                        <div className="w-px h-4 bg-border mx-0.5" />
                        <Button variant="ghost" size="xs" onClick={openFilePicker} title="Import .txt file">
                            <UploadIcon className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="xs" onClick={handleReset} title="Reset to example">
                            <RefreshCwIcon className="h-3 w-3" />
                        </Button>
                    </div>
                }
            />

            {/* Drag overlay */}
            {isDragging && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-lg">
                    <span className="text-sm font-medium text-primary">Drop .txt file to import</span>
                </div>
            )}

            {/* Two-panel layout */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0 gap-px bg-border">
                {/* Input panel */}
                <div className="flex flex-col bg-background w-full md:w-1/2 h-1/2 md:h-auto min-h-0">
                    <div className="flex items-center px-3 h-7 border-b border-border flex-shrink-0">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Input</span>
                    </div>
                    <div className="flex-1 min-h-0">
                        <Editor
                            value={input}
                            onChange={(value) => setInput(value ?? "")}
                            language="plaintext"
                            theme={isDark ? "vs-dark" : "light"}
                            options={{
                                minimap: { enabled: false },
                                lineNumbers: "off",
                                glyphMargin: false,
                                folding: false,
                                scrollBeyondLastLine: false,
                                renderLineHighlight: "none",
                                fontSize: 13,
                                fontFamily: "monospace",
                                tabSize: 2,
                                insertSpaces: true,
                                wordWrap: "on",
                                overviewRulerLanes: 0,
                                hideCursorInOverviewRuler: true,
                                overviewRulerBorder: false,
                                scrollbar: {
                                    vertical: "auto",
                                    horizontal: "auto",
                                    verticalScrollbarSize: 8,
                                    horizontalScrollbarSize: 8,
                                },
                                padding: { top: 8, bottom: 8 },
                            }}
                        />
                    </div>
                </div>

                {/* Output panel */}
                <div className="flex-1 flex flex-col bg-background min-w-0 h-1/2 md:h-auto min-h-0">
                    <div className="flex items-center px-3 h-7 border-b border-border flex-shrink-0">
                        {OUTPUT_TABS.map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => setActiveTab(tab.value)}
                                className={`text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded transition-colors ${
                                    activeTab === tab.value
                                        ? "text-foreground bg-muted"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div ref={outputRef} className="flex-1 min-h-0 overflow-auto">
                        {activeTab === "text" ? (
                            <pre className="px-3 py-2 text-sm font-mono text-foreground whitespace-pre min-h-full">
                                {output || <span className="text-muted-foreground">Your tree structure will appear here...</span>}
                            </pre>
                        ) : (
                            <VisualTreeView nodes={nodes} rootSymbol={options.rootSymbol} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
