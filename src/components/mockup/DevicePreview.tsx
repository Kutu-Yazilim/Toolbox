import { useRef, useState, useEffect } from "react"
import { DeviceFrame } from "./DeviceFrame"
import { ScreenImage } from "./ScreenImage"
import type { DeviceSpec, Orientation, MockupBackground, MockupTransform, ImageTransform } from "@/types/mockup"

interface DevicePreviewProps {
  device: DeviceSpec
  image: string | null
  orientation: Orientation
  colorVariant: string
  variantSlug: string
  background: MockupBackground
  transform: MockupTransform
  imageTransform: ImageTransform
  onImagePan: (deltaX: number, deltaY: number) => void
}

export function DevicePreview({
  device,
  image,
  orientation,
  colorVariant,
  variantSlug,
  background,
  transform,
  imageTransform,
  onImagePan,
}: DevicePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scaleFactor, setScaleFactor] = useState(1)

  const isLandscape = orientation === "landscape"
  const frameW = isLandscape ? device.frame.height : device.frame.width
  const frameH = isLandscape ? device.frame.width : device.frame.height
  const totalH = frameH + (device.category === "laptop" && !device.frameImage ? 30 : 0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const padX = 80
      const padY = 80
      const scaleX = (width - padX) / frameW
      const scaleY = (height - padY) / totalH
      setScaleFactor(Math.min(scaleX, scaleY, 1))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [frameW, totalH])

  const computedBg = background.type === "solid"
    ? background.color
    : background.type === "gradient"
    ? `linear-gradient(${background.gradientAngle}deg, ${background.gradientFrom}, ${background.gradientTo})`
    : "repeating-conic-gradient(#e0e0e0 0% 25%, #fff 0% 50%) 0 0 / 20px 20px"

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center overflow-hidden relative"
      style={{ background: computedBg }}
    >
      <div
        style={{
          perspective: `${transform.perspective}px`,
          transformStyle: "preserve-3d",
        }}
      >
        <div
          style={{
            transform: `scale(${scaleFactor}) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg)`,
            transition: "transform 0.3s ease",
            transformOrigin: "center center",
          }}
        >
          <DeviceFrame device={device} orientation={orientation} colorVariant={colorVariant} variantSlug={variantSlug}>
            {image ? (
              <ScreenImage
                src={image}
                imageTransform={imageTransform}
                orientation={orientation}
                frameRotatesForLandscape={!!device.frameImage}
                onPan={onImagePan}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-white/30 text-sm">
                Upload an image
              </div>
            )}
          </DeviceFrame>
        </div>
      </div>
    </div>
  )
}
