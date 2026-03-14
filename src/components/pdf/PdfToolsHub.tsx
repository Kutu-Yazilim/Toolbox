import type { PdfToolId, PdfToolDefinition } from "@/types/pdf"
import { PdfToolCard } from "@/components/pdf/PdfToolCard"
import { PDF_TOOL_CATALOG } from "@/components/pdf/pdfToolCatalog"

interface PdfToolsHubProps {
  onSelectTool: (id: PdfToolId) => void
}

const CONVERT_TOOLS = PDF_TOOL_CATALOG.filter((t) => t.category === "convert")
const MANAGE_TOOLS = PDF_TOOL_CATALOG.filter((t) => t.category === "manage")

function ToolSection({
  title,
  tools,
  onSelect,
}: {
  title: string
  tools: PdfToolDefinition[]
  onSelect: (id: PdfToolId) => void
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
        {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {tools.map((tool) => (
          <PdfToolCard
            key={tool.id}
            tool={tool}
            onClick={() => onSelect(tool.id)}
          />
        ))}
      </div>
    </div>
  )
}

export function PdfToolsHub({ onSelectTool }: PdfToolsHubProps) {
  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-lg font-bold">PDF Tools</h1>
          <p className="text-sm text-muted-foreground">
            Convert, merge, split, compress, and more — all processed locally in
            your browser.
          </p>
        </div>
        <ToolSection
          title="Convert to PDF"
          tools={CONVERT_TOOLS}
          onSelect={onSelectTool}
        />
        <ToolSection
          title="Manage PDF"
          tools={MANAGE_TOOLS}
          onSelect={onSelectTool}
        />
      </div>
    </div>
  )
}
