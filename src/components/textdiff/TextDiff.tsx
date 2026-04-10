"use client"

import { useState, useRef, useCallback, useMemo } from "react"
import { DiffEditor, type DiffEditorProps } from "@monaco-editor/react"
import { Button } from "@/components/ui/button"
import { ColumnsIcon, RowsIcon } from "lucide-react"
import { useIsMobile } from "@/hooks/useIsMobile"
import { useTheme } from "@/hooks/useTheme"
import { useShareableUrl } from "@/hooks/useShareableUrl"
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { type Preset } from "@/components/shared/PresetsDrawer"
import { TEXT_DIFF_PRESETS } from "./textDiffPresets"
import type { editor } from "monaco-editor"

const EXAMPLE_ORIGINAL = `function greet(name) {
  console.log("Hello, " + name);
  return name;
}

const users = ["Alice", "Bob", "Charlie"];
for (let i = 0; i < users.length; i++) {
  greet(users[i]);
}`

const EXAMPLE_MODIFIED = `function greet(name: string): string {
  console.log(\`Hello, \${name}!\`);
  return name.trim();
}

const users: string[] = ["Alice", "Bob", "Charlie", "Diana"];
for (const user of users) {
  greet(user);
}`

export function TextDiff() {
  const isMobile = useIsMobile()
  const { isDark } = useTheme()
  const [sideBySide, setSideBySide] = useState(!isMobile)
  const editorRef = useRef<editor.IStandaloneDiffEditor | null>(null)

  const getTexts = useCallback(() => {
    if (!editorRef.current) return { original: "", modified: "" }
    return {
      original: editorRef.current.getOriginalEditor().getValue(),
      modified: editorRef.current.getModifiedEditor().getValue(),
    }
  }, [])

  const { shareUrl } = useShareableUrl("text-diff", getTexts(), (restored) => {
    if (editorRef.current) {
      editorRef.current.getOriginalEditor().setValue(restored.original)
      editorRef.current.getModifiedEditor().setValue(restored.modified)
    }
  })

  const handleEditorDidMount: DiffEditorProps["onMount"] = useCallback((editor: editor.IStandaloneDiffEditor) => {
    editorRef.current = editor
  }, [])

  const handleLoadExample = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.getOriginalEditor().setValue(EXAMPLE_ORIGINAL)
      editorRef.current.getModifiedEditor().setValue(EXAMPLE_MODIFIED)
    }
  }, [])

  const handlePresetSelect = useCallback((preset: Preset) => {
    if (!editorRef.current) return
    const data = JSON.parse(preset.content)
    editorRef.current.getOriginalEditor().setValue(data.original)
    editorRef.current.getModifiedEditor().setValue(data.modified)
  }, [])

  const handleSwapSides = useCallback(() => {
    if (!editorRef.current) return
    const orig = editorRef.current.getOriginalEditor().getValue()
    const mod = editorRef.current.getModifiedEditor().getValue()
    editorRef.current.getOriginalEditor().setValue(mod)
    editorRef.current.getModifiedEditor().setValue(orig)
  }, [])

  const shortcuts: Shortcut[] = useMemo(() => [
    { key: "mod+shift+v", label: "Toggle side-by-side", action: () => setSideBySide(p => !p) },
    { key: "mod+shift+s", label: "Swap sides", action: handleSwapSides },
    { key: "mod+shift+e", label: "Load example", action: handleLoadExample },
  ], [handleSwapSides, handleLoadExample])

  useKeyboardShortcuts(shortcuts)

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Toolbar */}
      <ToolToolbar
        title="Text Diff"
        onShare={shareUrl}
        presets={TEXT_DIFF_PRESETS}
        onPresetSelect={handlePresetSelect}
        shortcuts={shortcuts}
        actions={
          <>
            <Button
              variant="ghost"
              size="xs"
              onClick={handleLoadExample}
              title="Load example"
            >
              <span className="text-[10px]">Example</span>
            </Button>
            <div className="w-px h-4 bg-border mx-0.5" />
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setSideBySide(true)}
              title="Side by side"
              className={sideBySide ? "bg-accent" : ""}
            >
              <ColumnsIcon className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setSideBySide(false)}
              title="Inline"
              className={!sideBySide ? "bg-accent" : ""}
            >
              <RowsIcon className="h-3 w-3" />
            </Button>
            <div className="w-px h-4 bg-border mx-0.5" />
            <span className="text-[10px] text-muted-foreground">Edit both sides to compare</span>
          </>
        }
      />

      {/* Diff editor */}
      <div className="flex-1 min-h-0">
        <DiffEditor
          height="100%"
          language="plaintext"
          theme={isDark ? "vs-dark" : "light"}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            scrollBeyondLastLine: false,
            wordWrap: "on",
            renderSideBySide: sideBySide,
            originalEditable: true,
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
