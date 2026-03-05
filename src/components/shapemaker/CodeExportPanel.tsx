import { useState, useMemo } from "react"
import type { Layer, CodeGenOptions } from "@/types/shapemaker"
import { generateFlutterCode } from "@/utils/shapemakerCodegen"
import { Button } from "@/components/ui/button"
import { CopyIcon, CheckIcon, DownloadIcon } from "lucide-react"

type Props = {
  layers: Layer[]
  canvasWidth: number
  canvasHeight: number
}

export function CodeExportPanel({ layers, canvasWidth, canvasHeight }: Props) {
  const [className, setClassName] = useState("MyShape")
  const [responsive, setResponsive] = useState(true)
  const [includeSize, setIncludeSize] = useState(true)
  const [copied, setCopied] = useState(false)

  const opts: CodeGenOptions = useMemo(
    () => ({
      className,
      responsive,
      includeSize,
      canvasWidth,
      canvasHeight,
    }),
    [className, responsive, includeSize, canvasWidth, canvasHeight]
  )

  const code = useMemo(
    () => generateFlutterCode(layers, opts),
    [layers, opts]
  )

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${className.replace(/([A-Z])/g, "_$1").replace(/^_/, "").toLowerCase()}.dart`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Options */}
      <div className="p-3 border-b border-border space-y-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-20 flex-shrink-0">
            Class name
          </span>
          <input
            type="text"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="flex-1 px-2 py-1 text-xs font-mono bg-muted/30 border border-border rounded outline-none focus:ring-1 focus:ring-ring min-w-0"
          />
        </div>

        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={responsive}
            onChange={(e) => setResponsive(e.target.checked)}
            className="accent-primary"
          />
          <span className="text-muted-foreground">
            Responsive (use size.width/height)
          </span>
        </label>

        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={includeSize}
            onChange={(e) => setIncludeSize(e.target.checked)}
            className="accent-primary"
          />
          <span className="text-muted-foreground">Include fixed size</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border flex-shrink-0">
        <Button
          variant="outline"
          size="xs"
          onClick={handleCopy}
          className="gap-1"
        >
          {copied ? (
            <CheckIcon className="h-3 w-3 text-green-500" />
          ) : (
            <CopyIcon className="h-3 w-3" />
          )}
          {copied ? "Copied!" : "Copy"}
        </Button>
        <Button
          variant="outline"
          size="xs"
          onClick={handleDownload}
          className="gap-1"
        >
          <DownloadIcon className="h-3 w-3" />
          Download .dart
        </Button>
      </div>

      {/* Code preview */}
      <div className="flex-1 overflow-auto min-h-0">
        <pre className="p-3 text-xs font-mono leading-relaxed text-foreground whitespace-pre overflow-x-auto">
          {code}
        </pre>
      </div>
    </div>
  )
}
