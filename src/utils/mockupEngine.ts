import type { DeviceSpec, Orientation, MockupBackground, ExportScale } from "@/types/mockup"
import { getFrameImagePath } from "@/types/mockup"
import { loadFrameImage } from "./deviceFrameLoader"

export interface ExportOptions {
  image: string
  device: DeviceSpec
  orientation: Orientation
  colorVariant: string
  variantSlug: string
  background: MockupBackground
  exportScale: ExportScale
}

export async function exportMockup(options: ExportOptions): Promise<Blob> {
  const { image, device, orientation, colorVariant, variantSlug, background, exportScale } = options

  const isLandscape = orientation === "landscape"
  const frameW = isLandscape ? device.frame.height : device.frame.width
  const frameH = isLandscape ? device.frame.width : device.frame.height

  const padding = 60
  const totalW = frameW + padding * 2
  const totalH = frameH + padding * 2 + (device.category === "laptop" && !device.frameImage ? 30 : 0)
  const canvasW = totalW * exportScale
  const canvasH = totalH * exportScale

  const canvas = document.createElement("canvas")
  canvas.width = canvasW
  canvas.height = canvasH
  const ctx = canvas.getContext("2d")!
  ctx.scale(exportScale, exportScale)

  // Draw background
  if (background.type === "solid") {
    ctx.fillStyle = background.color
    ctx.fillRect(0, 0, totalW, totalH)
  } else if (background.type === "gradient") {
    const angle = background.gradientAngle * (Math.PI / 180)
    const cx = totalW / 2
    const cy = totalH / 2
    const len = Math.sqrt(totalW * totalW + totalH * totalH) / 2
    const grad = ctx.createLinearGradient(
      cx - Math.cos(angle) * len,
      cy - Math.sin(angle) * len,
      cx + Math.cos(angle) * len,
      cy + Math.sin(angle) * len
    )
    grad.addColorStop(0, background.gradientFrom)
    grad.addColorStop(1, background.gradientTo)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, totalW, totalH)
  }
  // transparent: leave canvas transparent

  // Load user image
  const userImg = await loadImage(image)

  if (device.frameImage) {
    await exportWithFrameImage(ctx, userImg, device, isLandscape, variantSlug, padding, frameW, frameH)
  } else {
    exportWithCSS(ctx, userImg, device, isLandscape, colorVariant, padding, frameW, frameH)
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/png")
  })
}

async function exportWithFrameImage(
  ctx: CanvasRenderingContext2D,
  userImg: HTMLImageElement,
  device: DeviceSpec,
  isLandscape: boolean,
  variantSlug: string,
  padding: number,
  frameW: number,
  frameH: number,
) {
  const fi = device.frameImage!
  const scale = device.frame.width / fi.nativeWidth
  const frameImagePath = getFrameImagePath(device.id, variantSlug)
  const frameImg = await loadFrameImage(frameImagePath)

  if (isLandscape) {
    // For landscape: translate to center, rotate, then draw in portrait coords
    ctx.save()
    const cx = padding + frameW / 2
    const cy = padding + frameH / 2
    ctx.translate(cx, cy)
    ctx.rotate(Math.PI / 2)
    // After rotation, we're in portrait coordinate space centered at origin
    const halfW = device.frame.width / 2
    const halfH = device.frame.height / 2

    // Screen in portrait coords
    const screenX = fi.nativeScreen.x * scale - halfW
    const screenY = fi.nativeScreen.y * scale - halfH
    const screenW = fi.nativeScreen.width * scale
    const screenH = fi.nativeScreen.height * scale

    // Draw user image clipped to screen
    ctx.save()
    roundedRect(ctx, screenX, screenY, screenW, screenH, device.screen.borderRadius)
    ctx.clip()
    drawCover(ctx, userImg, screenX, screenY, screenW, screenH)
    ctx.restore()

    // Draw frame image overlay
    ctx.drawImage(frameImg, -halfW, -halfH, device.frame.width, device.frame.height)
    ctx.restore()
  } else {
    const bx = padding
    const by = padding
    const screenX = bx + fi.nativeScreen.x * scale
    const screenY = by + fi.nativeScreen.y * scale
    const screenW = fi.nativeScreen.width * scale
    const screenH = fi.nativeScreen.height * scale

    // Draw user image clipped to screen
    ctx.save()
    roundedRect(ctx, screenX, screenY, screenW, screenH, device.screen.borderRadius)
    ctx.clip()
    drawCover(ctx, userImg, screenX, screenY, screenW, screenH)
    ctx.restore()

    // Draw frame image overlay
    ctx.drawImage(frameImg, bx, by, frameW, frameH)
  }
}

function exportWithCSS(
  ctx: CanvasRenderingContext2D,
  userImg: HTMLImageElement,
  device: DeviceSpec,
  isLandscape: boolean,
  colorVariant: string,
  padding: number,
  frameW: number,
  frameH: number,
) {
  // Calculate screen region
  const screenX = padding + (isLandscape ? device.screen.y : device.screen.x)
  const screenY = padding + (isLandscape ? device.screen.x : device.screen.y)
  const screenW = isLandscape ? device.screen.height : device.screen.width
  const screenH = isLandscape ? device.screen.width : device.screen.height

  // Draw user image into screen area (cover fit)
  ctx.save()
  roundedRect(ctx, screenX, screenY, screenW, screenH, device.screen.borderRadius)
  ctx.clip()
  drawCover(ctx, userImg, screenX, screenY, screenW, screenH)
  ctx.restore()

  // Draw device bezel
  const bx = padding
  const by = padding

  // Bezel fill
  ctx.save()
  roundedRect(ctx, bx, by, frameW, frameH, device.style.borderRadius)
  // Cut out screen area
  roundedRect(ctx, screenX, screenY, screenW, screenH, device.screen.borderRadius)
  ctx.clip("evenodd")
  ctx.fillStyle = colorVariant
  ctx.fillRect(bx, by, frameW, frameH)
  ctx.restore()

  // Bezel border
  ctx.save()
  ctx.strokeStyle = "rgba(0,0,0,0.15)"
  ctx.lineWidth = 1
  roundedRect(ctx, bx, by, frameW, frameH, device.style.borderRadius)
  ctx.stroke()
  ctx.restore()

  // Dynamic Island
  if (device.style.hasDynamicIsland) {
    ctx.save()
    const diW = isLandscape ? 36 : 120
    const diH = isLandscape ? 120 : 36
    const diX = isLandscape
      ? bx + device.style.bezelWidth.left + 10
      : bx + frameW / 2 - diW / 2
    const diY = isLandscape
      ? by + frameH / 2 - diH / 2
      : by + device.style.bezelWidth.top + 10
    roundedRect(ctx, diX, diY, diW, diH, 20)
    ctx.fillStyle = colorVariant
    ctx.fill()
    ctx.restore()
  }

  // Laptop base
  if (device.category === "laptop") {
    ctx.save()
    // Hinge
    ctx.fillStyle = colorVariant
    roundedRect(ctx, bx - 10, by + frameH, frameW + 20, 14, 0)
    ctx.fill()
    // Base
    ctx.fillStyle = adjustBrightness(colorVariant, 15)
    roundedRect(ctx, bx - 30, by + frameH + 14, frameW + 60, 8, 4)
    ctx.fill()
    ctx.restore()
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number, w: number, h: number
) {
  const imgRatio = img.naturalWidth / img.naturalHeight
  const areaRatio = w / h

  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight

  if (imgRatio > areaRatio) {
    sw = img.naturalHeight * areaRatio
    sx = (img.naturalWidth - sw) / 2
  } else {
    sh = img.naturalWidth / areaRatio
    sy = (img.naturalHeight - sh) / 2
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function adjustBrightness(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16)
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
