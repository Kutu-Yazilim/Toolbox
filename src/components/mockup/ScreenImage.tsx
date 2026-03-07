import { useRef, useCallback } from "react"
import type { ImageTransform, Orientation } from "@/types/mockup"

interface ScreenImageProps {
  src: string
  imageTransform: ImageTransform
  orientation: Orientation
  /** Whether the device frame uses rotation-based landscape (image-based frames rotate the whole frame) */
  frameRotatesForLandscape: boolean
  onPan: (deltaX: number, deltaY: number) => void
}

export function ScreenImage({
  src,
  imageTransform,
  orientation,
  frameRotatesForLandscape,
  onPan,
}: ScreenImageProps) {
  const dragRef = useRef<{ startX: number; startY: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // When using image-based frames, landscape is achieved by rotating the entire frame 90°.
  // The image inside gets rotated too, so we counter-rotate it to keep it upright.
  const counterRotation =
    orientation === "landscape" && frameRotatesForLandscape ? -90 : 0
  const totalRotation = imageTransform.rotation + counterRotation

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (imageTransform.scale <= 1) return
      e.preventDefault()
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      dragRef.current = { startX: e.clientX, startY: e.clientY }
    },
    [imageTransform.scale]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const dx = ((e.clientX - dragRef.current.startX) / rect.width) * 100
      const dy = ((e.clientY - dragRef.current.startY) / rect.height) * 100
      dragRef.current = { startX: e.clientX, startY: e.clientY }
      onPan(dx, dy)
    },
    [onPan]
  )

  const handlePointerUp = useCallback(() => {
    dragRef.current = null
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden"
      style={{ cursor: imageTransform.scale > 1 ? "grab" : "default" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <img
        src={src}
        draggable={false}
        alt="Mockup screenshot"
        className="w-full h-full object-cover"
        style={{
          transform: `translate(${imageTransform.offsetX}%, ${imageTransform.offsetY}%) scale(${imageTransform.scale}) rotate(${totalRotation}deg)`,
          transformOrigin: "center center",
          pointerEvents: "none",
        }}
      />
    </div>
  )
}
