import type { DeviceSpec, Orientation } from "@/types/mockup"

interface DeviceFrameProps {
  device: DeviceSpec
  orientation: Orientation
  colorVariant: string
  children: React.ReactNode
}

export function DeviceFrame({ device, orientation, colorVariant, children }: DeviceFrameProps) {
  const isLandscape = orientation === "landscape"
  const frameW = isLandscape ? device.frame.height : device.frame.width
  const frameH = isLandscape ? device.frame.width : device.frame.height
  const screenX = isLandscape ? device.screen.y : device.screen.x
  const screenY = isLandscape ? device.screen.x : device.screen.y
  const screenW = isLandscape ? device.screen.height : device.screen.width
  const screenH = isLandscape ? device.screen.width : device.screen.height

  return (
    <div className="relative" style={{ width: frameW, height: frameH }}>
      {/* Outer bezel */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          border: `${device.style.bezelWidth.top}px solid ${colorVariant}`,
          borderRadius: device.style.borderRadius,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.1)",
        }}
      />

      {/* Dynamic Island */}
      {device.style.hasDynamicIsland && (
        <div
          className="absolute z-20"
          style={{
            top: isLandscape
              ? "50%"
              : device.style.bezelWidth.top + 10,
            left: isLandscape
              ? device.style.bezelWidth.left + 10
              : "50%",
            transform: isLandscape ? "translateY(-50%)" : "translateX(-50%)",
            width: isLandscape ? 36 : 120,
            height: isLandscape ? 120 : 36,
            background: colorVariant,
            borderRadius: 20,
          }}
        />
      )}

      {/* Screen area */}
      <div
        className="absolute overflow-hidden bg-black"
        style={{
          top: screenY,
          left: screenX,
          width: screenW,
          height: screenH,
          borderRadius: device.screen.borderRadius,
        }}
      >
        {children}
      </div>

      {/* MacBook base */}
      {device.category === "laptop" && (
        <>
          <div
            style={{
              position: "absolute",
              bottom: -14,
              left: -10,
              right: -10,
              height: 14,
              background: `linear-gradient(to bottom, ${colorVariant}, ${adjustBrightness(colorVariant, -20)})`,
              borderRadius: "0 0 4px 4px",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -22,
              left: -30,
              right: -30,
              height: 8,
              background: adjustBrightness(colorVariant, 10),
              borderRadius: "0 0 8px 8px",
            }}
          />
        </>
      )}
    </div>
  )
}

function adjustBrightness(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16)
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`
}
