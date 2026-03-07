import { getFrameImagePath } from "@/types/mockup"
import type { DeviceColorVariant } from "@/types/mockup"

const cache = new Map<string, HTMLImageElement>()
const pending = new Map<string, Promise<HTMLImageElement>>()

export function loadFrameImage(path: string): Promise<HTMLImageElement> {
  const cached = cache.get(path)
  if (cached) return Promise.resolve(cached)

  const inflight = pending.get(path)
  if (inflight) return inflight

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      cache.set(path, img)
      pending.delete(path)
      resolve(img)
    }
    img.onerror = () => {
      pending.delete(path)
      reject(new Error(`Failed to load frame image: ${path}`))
    }
    img.src = path
  })

  pending.set(path, promise)
  return promise
}

export function preloadDeviceFrames(
  deviceId: string,
  variants: DeviceColorVariant[]
): void {
  for (const variant of variants) {
    const path = getFrameImagePath(deviceId, variant.slug)
    loadFrameImage(path).catch(() => {
      // Silently ignore preload failures
    })
  }
}
