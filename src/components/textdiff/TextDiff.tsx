import { useState, useRef, useCallback } from "react"
import { DiffEditor, type DiffEditorProps } from "@monaco-editor/react"
import { Button } from "@/components/ui/button"
import { ColumnsIcon, RowsIcon, BookOpenIcon } from "lucide-react"
import { useIsMobile } from "@/hooks/useIsMobile"
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
  const [sideBySide, setSideBySide] = useState(!isMobile)
  const editorRef = useRef<editor.IStandaloneDiffEditor | null>(null)

  const handleEditorDidMount: DiffEditorProps["onMount"] = useCallback((editor: editor.IStandaloneDiffEditor) => {
    editorRef.current = editor
  }, [])

  const handleLoadExample = useCallback(() => {
    if (editorRef.current) {
      const originalEditor = editorRef.current.getOriginalEditor()
      const modifiedEditor = editorRef.current.getModifiedEditor()
      originalEditor.setValue(EXAMPLE_ORIGINAL)
      modifiedEditor.setValue(EXAMPLE_MODIFIED)
    }
  }, [])

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 h-9 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Text Diff
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={handleLoadExample}
            title="Load example"
          >
            <BookOpenIcon className="h-3 w-3" />
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
        </div>
      </div>

      {/* Diff editor */}
      <div className="flex-1 min-h-0">
        <DiffEditor
          height="100%"
          language="plaintext"
          theme="vs-dark"
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
