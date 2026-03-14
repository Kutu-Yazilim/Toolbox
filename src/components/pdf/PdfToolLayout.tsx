import { ArrowLeftIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PdfToolLayoutProps {
  title: string
  description?: string
  onBack: () => void
  children: React.ReactNode
}

export function PdfToolLayout({
  title,
  description,
  onBack,
  children,
}: PdfToolLayoutProps) {
  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-border flex-shrink-0 bg-muted/10">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="size-8 flex-shrink-0"
        >
          <ArrowLeftIcon className="size-4" />
        </Button>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold truncate">{title}</h2>
          {description && (
            <p className="text-xs text-muted-foreground truncate">{description}</p>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-6">{children}</div>
      </div>
    </div>
  )
}
