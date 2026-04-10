"use client"

import { useState } from "react"
import { DiffEditor } from "@monaco-editor/react"
import { useIsMobile } from "@/hooks/useIsMobile"
import { useTheme } from "@/hooks/useTheme"

export function JsonDiff() {
    const isMobile = useIsMobile()
    const { isDark } = useTheme()
    const [diffOriginal, setDiffOriginal] = useState("")
    const [diffModified, setDiffModified] = useState("")

    return (
        <div className="h-full flex flex-col min-h-0">
            {/* Diff toolbar */}
            <div className="flex items-center justify-between px-3 h-9 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">JSON Diff</span>
                </div>
                <span className="text-[10px] text-muted-foreground">Edit both sides to compare</span>
            </div>

            {/* Diff editor */}
            <div className="flex-1 min-h-0">
                <DiffEditor
                    height="100%"
                    language="json"
                    original={diffOriginal}
                    modified={diffModified}
                    theme={isDark ? "vs-dark" : "light"}
                    onMount={(_editor) => {
                        const modifiedEditor = _editor.getModifiedEditor()
                        const originalEditor = _editor.getOriginalEditor()
                        modifiedEditor.onDidChangeModelContent(() => {
                            setDiffModified(modifiedEditor.getValue())
                        })
                        originalEditor.onDidChangeModelContent(() => {
                            setDiffOriginal(originalEditor.getValue())
                        })
                    }}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        scrollBeyondLastLine: false,
                        wordWrap: "on",
                        renderSideBySide: !isMobile,
                        automaticLayout: true,
                        padding: { top: 8 },
                        scrollbar: {
                            verticalScrollbarSize: 8,
                            horizontalScrollbarSize: 8,
                        },
                    }}
                />
            </div>
        </div>
    )
}
