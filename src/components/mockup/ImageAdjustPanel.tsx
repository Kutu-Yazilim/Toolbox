import { RotateCwIcon, ZoomInIcon, MoveIcon, RotateCcwIcon, CropIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ImageTransform } from "@/types/mockup"

interface ImageAdjustPanelProps {
  imageTransform: ImageTransform
  onChange: (partial: Partial<ImageTransform>) => void
  onReset: () => void
  onOpenCrop: () => void
}

export function ImageAdjustPanel({ imageTransform, onChange, onReset, onOpenCrop }: ImageAdjustPanelProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">Image Adjust</label>
        <button
          onClick={onReset}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          title="Reset image adjustments"
        >
          <RotateCcwIcon className="size-3" />
          Reset
        </button>
      </div>

      {/* Crop button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onOpenCrop}
        className="w-full h-8 text-xs gap-1.5"
      >
        <CropIcon className="size-3.5" />
        Crop Image
      </Button>

      {/* Rotation */}
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <RotateCwIcon className="size-3" />
          Rotation
        </label>
        <div className="flex gap-1">
          {[0, 90, 180, 270].map((deg) => (
            <button
              key={deg}
              onClick={() => onChange({ rotation: deg })}
              className={`flex-1 px-2 py-1 text-xs rounded border transition-colors ${
                imageTransform.rotation === deg
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {deg}°
            </button>
          ))}
        </div>
      </div>

      {/* Zoom */}
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <ZoomInIcon className="size-3" />
          Zoom
          <span className="ml-auto text-xs tabular-nums">{imageTransform.scale.toFixed(1)}x</span>
        </label>
        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={imageTransform.scale}
          onChange={(e) => onChange({ scale: Number(e.target.value) })}
          className="w-full h-1 accent-primary"
        />
      </div>

      {/* Pan hint */}
      {imageTransform.scale > 1 && (
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <MoveIcon className="size-3" />
          Drag the image to reposition
        </p>
      )}
    </div>
  )
}
