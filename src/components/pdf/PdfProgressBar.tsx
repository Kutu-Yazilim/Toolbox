import type { PdfProcessingState } from "@/types/pdf"
import { cn } from "@/lib/utils"
import { LoaderIcon, CheckCircleIcon, AlertCircleIcon } from "lucide-react"

interface PdfProgressBarProps {
  state: PdfProcessingState
  onRetry?: () => void
}

const STATUS_CONFIG = {
  idle: { color: "bg-muted", icon: null, spinning: false },
  "loading-wasm": { color: "bg-primary", icon: LoaderIcon, spinning: true },
  reading: { color: "bg-primary", icon: LoaderIcon, spinning: true },
  processing: { color: "bg-primary", icon: LoaderIcon, spinning: true },
  done: { color: "bg-green-500", icon: CheckCircleIcon, spinning: false },
  error: { color: "bg-destructive", icon: AlertCircleIcon, spinning: false },
} as const

export function PdfProgressBar({ state, onRetry }: PdfProgressBarProps) {
  if (state.status === "idle") return null

  const config = STATUS_CONFIG[state.status]
  const Icon = config.icon
  const isIndeterminate = state.progress === 0 && state.status === "processing"

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {Icon && (
          <Icon
            className={cn(
              "size-4 flex-shrink-0",
              config.spinning && "animate-spin",
              state.status === "done" && "text-green-500",
              state.status === "error" && "text-destructive"
            )}
          />
        )}
        <span className="text-sm text-muted-foreground flex-1 truncate">
          {state.message}
        </span>
        {state.progress > 0 && state.status === "processing" && (
          <span className="text-xs text-muted-foreground font-mono">
            {Math.round(state.progress)}%
          </span>
        )}
      </div>

      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        {isIndeterminate ? (
          <div
            className={cn("h-full rounded-full", config.color, "animate-pulse")}
            style={{ width: "100%" }}
          />
        ) : (
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              config.color
            )}
            style={{ width: `${state.status === "done" ? 100 : state.progress}%` }}
          />
        )}
      </div>

      {state.status === "error" && state.error && (
        <div className="flex items-center gap-2">
          <p className="text-xs text-destructive flex-1">{state.error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs text-primary hover:underline flex-shrink-0"
            >
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  )
}
