import { DownloadIcon, ImageIcon, TrashIcon, RotateCcwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { MockupTransform, ExportScale } from "@/types/mockup"

interface MockupToolbarProps {
  hasImage: boolean
  transform: MockupTransform
  exportScale: ExportScale
  isExporting: boolean
  onExport: () => void
  onTransformChange: (t: Partial<MockupTransform>) => void
  onExportScaleChange: (scale: ExportScale) => void
  onReplaceImage: () => void
  onRemoveImage: () => void
  onResetTransform: () => void
}

export function MockupToolbar({
  hasImage,
  transform,
  exportScale,
  isExporting,
  onExport,
  onTransformChange,
  onExportScaleChange,
  onReplaceImage,
  onRemoveImage,
  onResetTransform,
}: MockupToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-2 bg-background">
      {/* Image actions */}
      <div className="flex items-center gap-1.5">
        {hasImage && (
          <>
            <Button variant="ghost" size="sm" onClick={onReplaceImage} className="h-7 text-xs gap-1.5">
              <ImageIcon className="size-3.5" />
              Replace
            </Button>
            <Button variant="ghost" size="sm" onClick={onRemoveImage} className="h-7 text-xs gap-1.5 text-destructive hover:text-destructive">
              <TrashIcon className="size-3.5" />
              Remove
            </Button>
          </>
        )}
      </div>

      <div className="h-5 w-px bg-border hidden md:block" />

      {/* Transform controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <SliderControl
          label="Rotate X"
          value={transform.rotateX}
          min={-30}
          max={30}
          onChange={(v) => onTransformChange({ rotateX: v })}
        />
        <SliderControl
          label="Rotate Y"
          value={transform.rotateY}
          min={-30}
          max={30}
          onChange={(v) => onTransformChange({ rotateY: v })}
        />
        <button
          onClick={onResetTransform}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          title="Reset transform"
        >
          <RotateCcwIcon className="size-3" />
        </button>
      </div>

      <div className="flex-1" />

      {/* Export controls */}
      <div className="flex items-center gap-2">
        <div className="flex rounded-md border border-border overflow-hidden">
          {([1, 2, 3] as ExportScale[]).map((s) => (
            <button
              key={s}
              onClick={() => onExportScaleChange(s)}
              className={cn(
                "px-2 py-1 text-xs font-medium transition-colors",
                exportScale === s
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              {s}x
            </button>
          ))}
        </div>
        <Button
          size="sm"
          onClick={onExport}
          disabled={!hasImage || isExporting}
          className="h-7 text-xs gap-1.5"
        >
          <DownloadIcon className="size-3.5" />
          {isExporting ? "Exporting..." : "Export PNG"}
        </Button>
      </div>
    </div>
  )
}

function SliderControl({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-muted-foreground whitespace-nowrap w-14">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-20 h-1 accent-primary"
      />
      <span className="text-xs text-muted-foreground w-8 text-right">{value}°</span>
    </div>
  )
}
