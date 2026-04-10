"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
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
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useFileImport } from "@/hooks/useFileImport"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { type Preset } from "@/components/shared/PresetsDrawer"
import { MOCKUP_PRESETS } from "./presets"

const DEFAULT_IMAGE_TRANSFORM: ImageTransform = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
}

type MockupSettings = {
  deviceId: string
  orientation: Orientation
  colorVariant: string
  variantSlug: string
  background: MockupBackground
}

const DEFAULT_MOCKUP_SETTINGS: MockupSettings = {
  deviceId: "iphone-16-pro",
  orientation: "portrait",
  colorVariant: "#1a1a1a",
  variantSlug: "black-titanium",
  background: {
    type: "solid",
    color: "#f5f5f5",
    gradientFrom: "#667eea",
    gradientTo: "#764ba2",
    gradientAngle: 135,
  },
}

export function MockupEditor() {
  const [savedSettings, setSavedSettings] = useLocalStorage<MockupSettings>("mockup-editor-settings", DEFAULT_MOCKUP_SETTINGS)
  const [image, setImage] = useState<string | null>(null)
  const [deviceId, setDeviceId] = useState(savedSettings.deviceId)
  const [orientation, setOrientation] = useState<Orientation>(savedSettings.orientation)
  const [colorVariant, setColorVariant] = useState(savedSettings.colorVariant)
  const [variantSlug, setVariantSlug] = useState(savedSettings.variantSlug)
  const [background, setBackground] = useState<MockupBackground>(savedSettings.background)
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

  // Persist settings
  useEffect(() => {
    const timer = setTimeout(() => setSavedSettings({ deviceId, orientation, colorVariant, variantSlug, background }), 500)
    return () => clearTimeout(timer)
  }, [deviceId, orientation, colorVariant, variantSlug, background, setSavedSettings])

  // File import for screenshot images
  const { dropzoneProps, isDragging } = useFileImport({
    accept: [".png", ".jpg", ".jpeg", ".webp"],
    readAs: "dataURL",
    onImport: useCallback((content: string) => {
      setImage(content)
    }, []),
  })

  // Presets
  const handlePresetSelect = useCallback((preset: Preset) => {
    const data = JSON.parse(preset.content)
    if (data.deviceId) setDeviceId(data.deviceId)
    if (data.orientation) setOrientation(data.orientation)
    if (data.colorVariant) setColorVariant(data.colorVariant)
    if (data.variantSlug) setVariantSlug(data.variantSlug)
    if (data.background) setBackground((prev) => ({ ...prev, ...data.background }))
    if (data.transform) setTransform((prev) => ({ ...prev, ...data.transform }))
  }, [])

  // Export options
  const exportOptions = useMemo(() => [
    {
      label: "Export PNG",
      action: handleExport,
    },
  ], [handleExport])

  // Keyboard shortcuts
  const shortcuts = useMemo(() => [
    { key: "mod+e", label: "Export Mockup", action: handleExport },
    { key: "mod+o", label: "Upload Image", action: () => fileInputRef.current?.click() },
    { key: "mod+shift+r", label: "Reset Transform", action: () => setTransform({ perspective: 1200, rotateX: 0, rotateY: 0 }) },
  ], [handleExport])

  useKeyboardShortcuts(shortcuts)

  return (
    <div className="flex flex-col h-full" {...dropzoneProps}>
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-lg">
          <span className="text-sm font-medium text-primary">Drop image here</span>
        </div>
      )}
      <ToolToolbar
        title="Mockup Editor"
        exportOptions={exportOptions}
        presets={MOCKUP_PRESETS}
        onPresetSelect={handlePresetSelect}
        shortcuts={shortcuts}
      />
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
