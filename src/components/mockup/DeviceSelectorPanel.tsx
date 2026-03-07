import { useState } from "react"
import { RotateCcwIcon, SmartphoneIcon, TabletIcon, LaptopIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { DEVICE_CATALOG } from "@/types/mockup"
import type { Orientation } from "@/types/mockup"

interface DeviceSelectorPanelProps {
  selectedDeviceId: string
  orientation: Orientation
  colorVariant: string
  onDeviceChange: (deviceId: string) => void
  onOrientationToggle: () => void
  onColorVariantChange: (color: string, slug: string) => void
}

const CATEGORIES = [
  { value: "phone" as const, label: "Phone", icon: SmartphoneIcon },
  { value: "tablet" as const, label: "Tablet", icon: TabletIcon },
  { value: "laptop" as const, label: "Laptop", icon: LaptopIcon },
]

export function DeviceSelectorPanel({
  selectedDeviceId,
  orientation,
  colorVariant,
  onDeviceChange,
  onOrientationToggle,
  onColorVariantChange,
}: DeviceSelectorPanelProps) {
  const [activeCategory, setActiveCategory] = useState<"phone" | "tablet" | "laptop">("phone")

  const filteredDevices = DEVICE_CATALOG.filter((d) => d.category === activeCategory)
  const selectedDevice = DEVICE_CATALOG.find((d) => d.id === selectedDeviceId)

  return (
    <div className="space-y-4">
      {/* Category tabs */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">Device</label>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {CATEGORIES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setActiveCategory(value)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                activeCategory === value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Device grid */}
      <div className="grid grid-cols-2 gap-2">
        {filteredDevices.map((device) => (
          <button
            key={device.id}
            onClick={() => {
              onDeviceChange(device.id)
              onColorVariantChange(device.colorVariants[0].color, device.colorVariants[0].slug)
            }}
            className={cn(
              "p-3 rounded-lg border text-center transition-colors",
              device.id === selectedDeviceId
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            )}
          >
            <div
              className="mx-auto mb-2"
              style={{
                width: device.frame.width * 0.08,
                height: device.frame.height * 0.08,
                border: "2px solid currentColor",
                borderRadius: device.style.borderRadius * 0.08,
              }}
            />
            <span className="text-xs">{device.name}</span>
          </button>
        ))}
      </div>

      {/* Orientation toggle */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">Orientation</label>
        <button
          onClick={onOrientationToggle}
          className={cn(
            "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors",
            "hover:bg-muted"
          )}
        >
          <RotateCcwIcon className="size-3.5" />
          {orientation === "portrait" ? "Portrait" : "Landscape"}
        </button>
      </div>

      {/* Color variants */}
      {selectedDevice && (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Color</label>
          <div className="flex gap-2 flex-wrap">
            {selectedDevice.colorVariants.map((v) => (
              <button
                key={v.name}
                onClick={() => onColorVariantChange(v.color, v.slug)}
                title={v.name}
                className={cn(
                  "size-7 rounded-full border-2 transition-transform hover:scale-110",
                  v.color === colorVariant ? "border-primary ring-2 ring-primary/30" : "border-border"
                )}
                style={{ backgroundColor: v.color }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
