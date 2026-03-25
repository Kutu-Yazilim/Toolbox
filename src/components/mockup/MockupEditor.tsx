"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { ImageUploader } from "./ImageUploader"
import { DevicePreview } from "./DevicePreview"
import { DeviceSelectorPanel } from "./DeviceSelectorPanel"
import { MockupToolbar } from "./MockupToolbar"
import { BackgroundPicker } from "./BackgroundPicker"
import { ImageAdjustPanel } from "./ImageAdjustPanel"
import { CropModal } from "./CropModal"
import { exportMockup, downloadBlob } from "@/utils/mockupEngine"
import { DEVICE_CATALOG } from "@/types/mockup"
import type { Orientation, ExportScale, MockupBackground, MockupTransform, ImageTransform } from "@/types/mockup"
import { preloadDeviceFrames } from "@/utils/deviceFrameLoader"

const DEFAULT_IMAGE_TRANSFORM: ImageTransform = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
}

export function MockupEditor() {
  const [image, setImage] = useState<string | null>(null)
  const [deviceId, setDeviceId] = useState("iphone-16-pro")
  const [orientation, setOrientation] = useState<Orientation>("portrait")
  const [colorVariant, setColorVariant] = useState("#1a1a1a")
  const [variantSlug, setVariantSlug] = useState("black-titanium")
  const [background, setBackground] = useState<MockupBackground>({
    type: "solid",
    color: "#f5f5f5",
    gradientFrom: "#667eea",
    gradientTo: "#764ba2",
    gradientAngle: 135,
  })
  const [transform, setTransform] = useState<MockupTransform>({
    perspective: 1200,
    rotateX: 0,
    rotateY: 0,
  })
  const [imageTransform, setImageTransform] = useState<ImageTransform>(DEFAULT_IMAGE_TRANSFORM)
  const [exportScale, setExportScale] = useState<ExportScale>(2)
  const [isExporting, setIsExporting] = useState(false)
  const [cropOpen, setCropOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const device = DEVICE_CATALOG.find((d) => d.id === deviceId) ?? DEVICE_CATALOG[0]

  // Preload frame images when device changes
  useEffect(() => {
    if (device.frameImage) {
      preloadDeviceFrames(device.id, device.colorVariants)
    }
  }, [device.id])

  const handleImageUpload = (dataUrl: string) => {
    setImage(dataUrl)
  }

  const handleExport = async () => {
    if (!image) return
    setIsExporting(true)
    try {
      const blob = await exportMockup({
        image,
        device,
        orientation,
        colorVariant,
        variantSlug,
        background,
        exportScale,
        imageTransform,
      })
      downloadBlob(blob, `mockup-${device.id}.png`)
    } finally {
      setIsExporting(false)
    }
  }

  const handleBackgroundChange = (partial: Partial<MockupBackground>) => {
    setBackground((prev) => ({ ...prev, ...partial }))
  }

  const handleTransformChange = (partial: Partial<MockupTransform>) => {
    setTransform((prev) => ({ ...prev, ...partial }))
  }

  const handleImageTransformChange = (partial: Partial<ImageTransform>) => {
    setImageTransform((prev) => ({ ...prev, ...partial }))
  }

  const handleImagePan = useCallback((deltaX: number, deltaY: number) => {
    setImageTransform((prev) => {
      // Clamp pan to reasonable bounds based on zoom level
      const maxOffset = (prev.scale - 1) * 50
      return {
        ...prev,
        offsetX: Math.max(-maxOffset, Math.min(maxOffset, prev.offsetX + deltaX)),
        offsetY: Math.max(-maxOffset, Math.min(maxOffset, prev.offsetY + deltaY)),
      }
    })
  }, [])

  return (
    <div className="flex flex-col h-full">
      <MockupToolbar
        hasImage={!!image}
        transform={transform}
        exportScale={exportScale}
        isExporting={isExporting}
        onExport={handleExport}
        onTransformChange={handleTransformChange}
        onExportScaleChange={setExportScale}
        onReplaceImage={() => fileInputRef.current?.click()}
        onRemoveImage={() => setImage(null)}
        onResetTransform={() => setTransform({ perspective: 1200, rotateX: 0, rotateY: 0 })}
      />

      <div className="flex flex-1 min-h-0 flex-col md:flex-row">
        {/* Main preview area */}
        <div className="flex-1 flex min-h-0">
          {image ? (
            <DevicePreview
              device={device}
              image={image}
              orientation={orientation}
              colorVariant={colorVariant}
              variantSlug={variantSlug}
              background={background}
              transform={transform}
              imageTransform={imageTransform}
              onImagePan={handleImagePan}
            />
          ) : (
            <ImageUploader onImageUpload={handleImageUpload} />
          )}
        </div>

        {/* Right sidebar */}
        <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-border overflow-y-auto p-4 space-y-6 flex-shrink-0">
          <DeviceSelectorPanel
            selectedDeviceId={deviceId}
            orientation={orientation}
            colorVariant={colorVariant}
            onDeviceChange={setDeviceId}
            onOrientationToggle={() =>
              setOrientation((o) => (o === "portrait" ? "landscape" : "portrait"))
            }
            onColorVariantChange={(color, slug) => {
              setColorVariant(color)
              setVariantSlug(slug)
            }}
          />
          <div className="h-px bg-border" />
          <BackgroundPicker background={background} onChange={handleBackgroundChange} />
          {image && (
            <>
              <div className="h-px bg-border" />
              <ImageAdjustPanel
                imageTransform={imageTransform}
                onChange={handleImageTransformChange}
                onReset={() => setImageTransform(DEFAULT_IMAGE_TRANSFORM)}
                onOpenCrop={() => setCropOpen(true)}
              />
            </>
          )}
        </div>
      </div>

      {/* Crop modal */}
      {image && (
        <CropModal
          open={cropOpen}
          onOpenChange={setCropOpen}
          imageSrc={image}
          device={device}
          orientation={orientation}
          onApply={(croppedImage) => {
            setImage(croppedImage)
            setImageTransform(DEFAULT_IMAGE_TRANSFORM)
          }}
        />
      )}

      {/* Hidden file input for replace image */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (!file) return
          const reader = new FileReader()
          reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string
            setImage(dataUrl)
          }
          reader.readAsDataURL(file)
          e.target.value = ""
        }}
      />
    </div>
  )
}
