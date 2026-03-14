import type { PdfToolDefinition } from "@/types/pdf"
import { cn } from "@/lib/utils"

interface PdfToolCardProps {
  tool: PdfToolDefinition
  onClick: () => void
}

export function PdfToolCard({ tool, onClick }: PdfToolCardProps) {
  const Icon = tool.icon

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg text-left transition-colors w-full",
        "bg-muted/30 hover:bg-muted/60 border border-transparent hover:border-border"
      )}
    >
      <div
        className={cn(
          "size-9 rounded-lg flex items-center justify-center flex-shrink-0",
          tool.category === "convert"
            ? "bg-primary/10 text-primary"
            : "bg-green-500/10 text-green-500"
        )}
      >
        <Icon className="size-4.5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{tool.label}</p>
        <p className="text-xs text-muted-foreground truncate">
          {tool.description}
        </p>
      </div>
    </button>
  )
}
