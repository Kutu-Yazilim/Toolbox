import { useState } from "react"
import { DiffEditor } from "@monaco-editor/react"
import { Button } from "@/components/ui/button"
import { ColumnsIcon, RowsIcon } from "lucide-react"
import { useIsMobile } from "@/hooks/useIsMobile"

export function TextDiff() {
  const isMobile = useIsMobile()
  const [original, setOriginal] = useState("")
  const [modified, setModified] = useState("")
  const [sideBySide, setSideBySide] = useState(!isMobile)

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
          original={original}
          modified={modified}
          theme="vs-dark"
          onMount={(_editor) => {
            const modifiedEditor = _editor.getModifiedEditor()
            const originalEditor = _editor.getOriginalEditor()
            modifiedEditor.onDidChangeModelContent(() => {
              setModified(modifiedEditor.getValue())
            })
            originalEditor.onDidChangeModelContent(() => {
              setOriginal(originalEditor.getValue())
            })
          }}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            scrollBeyondLastLine: false,
            wordWrap: "on",
            renderSideBySide: sideBySide,
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
