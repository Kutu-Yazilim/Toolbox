import type {
  BoardElement,
  Camera,
  Point,
  ElementStyle,
  GridSettings,
  ArrowElement,
} from "@/types/board"
import { getElementBounds, getElementCenter } from "./transforms"
import { drawElement, buildFontString } from "./rendering"
import {
  EXPORT_PADDING,
  EXPORT_SVG_PADDING,
  EXPORT_EMPTY_WIDTH,
  EXPORT_EMPTY_HEIGHT,
  RETINA_SCALE,
  FONT_FAMILY_MAP,
  TEXT_PADDING,
  STICKY_PADDING,
  LINE_HEIGHT_MULTIPLIER,
  STICKY_LINE_HEIGHT_MULTIPLIER,
  ARROW_HEAD_BASE_SIZE,
  ARROW_HEAD_STROKE_MULTIPLIER,
  ARROWHEAD_ANGLE,
} from "./constants"

// ── XML Escape ──────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

// ── Export to PNG ────────────────────────────────────────────────

export function exportBoardToPng(
  elements: BoardElement[],
  padding = EXPORT_PADDING,
  transparentBg = false,
  scale: 1 | 2 | 3 = RETINA_SCALE as 1 | 2 | 3
): Promise<string> {
  return new Promise((resolve) => {
    if (elements.length === 0) {
      const canvas = document.createElement("canvas")
      canvas.width = EXPORT_EMPTY_WIDTH
      canvas.height = EXPORT_EMPTY_HEIGHT
      const ctx = canvas.getContext("2d")!
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, EXPORT_EMPTY_WIDTH, EXPORT_EMPTY_HEIGHT)
      ctx.fillStyle = "#999999"
      ctx.font = "16px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText("Empty board", EXPORT_EMPTY_WIDTH / 2, EXPORT_EMPTY_HEIGHT / 2)
      resolve(canvas.toDataURL("image/png"))
      return
    }

    // Calculate bounds of all elements
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const el of elements) {
      const b = getElementBounds(el)
      minX = Math.min(minX, b.x)
      minY = Math.min(minY, b.y)
      maxX = Math.max(maxX, b.x + b.width)
      maxY = Math.max(maxY, b.y + b.height)
    }

    const width = maxX - minX + padding * 2
    const height = maxY - minY + padding * 2

    const canvas = document.createElement("canvas")
    canvas.width = width * scale
    canvas.height = height * scale
    const ctx = canvas.getContext("2d")!
    ctx.scale(scale, scale)

    // Background
    if (!transparentBg) {
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, width, height)
    }

    // Render with offset camera
    ctx.translate(-minX + padding, -minY + padding)

    for (const el of elements) {
      if (el.visible) drawElement(ctx, el)
    }

    resolve(canvas.toDataURL("image/png"))
  })
}

/** Copy board to clipboard as PNG */
export async function copyBoardToPngClipboard(
  elements: BoardElement[],
  transparentBg = false
): Promise<void> {
  if (elements.length === 0) return

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const el of elements) {
    const b = getElementBounds(el)
    minX = Math.min(minX, b.x)
    minY = Math.min(minY, b.y)
    maxX = Math.max(maxX, b.x + b.width)
    maxY = Math.max(maxY, b.y + b.height)
  }

  const width = maxX - minX + EXPORT_PADDING * 2
  const height = maxY - minY + EXPORT_PADDING * 2

  const canvas = document.createElement("canvas")
  canvas.width = width * RETINA_SCALE
  canvas.height = height * RETINA_SCALE
  const ctx = canvas.getContext("2d")!
  ctx.scale(RETINA_SCALE, RETINA_SCALE)

  if (!transparentBg) {
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, width, height)
  }

  ctx.translate(-minX + EXPORT_PADDING, -minY + EXPORT_PADDING)
  for (const el of elements) {
    if (el.visible) drawElement(ctx, el)
  }

  return new Promise<void>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error("Failed to create blob")); return }
      navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]).then(resolve).catch(reject)
    }, "image/png")
  })
}

// ── SVG Export ───────────────────────────────────────────────────

function svgStrokeDasharray(style: ElementStyle): string {
  if (style.strokeStyle === "dashed") return `stroke-dasharray="8 4"`
  if (style.strokeStyle === "dotted") return `stroke-dasharray="2 4"`
  return ""
}

function svgTransform(el: BoardElement): string {
  if (el.rotation === 0) return ""
  const center = getElementCenter(el)
  const deg = (el.rotation * 180) / Math.PI
  return `transform="rotate(${deg} ${center.x} ${center.y})"`
}

function svgFontString(style: ElementStyle): string {
  const family = FONT_FAMILY_MAP[style.fontFamily] || style.fontFamily
  return `font-family="${escapeXml(family)}" font-size="${style.fontSize}" font-weight="${style.fontWeight || "normal"}" font-style="${style.fontStyle || "normal"}"`
}

function elementToSvg(el: BoardElement): string {
  if (!el.visible) return ""
  const { style } = el
  const opacity = style.opacity !== 1 ? `opacity="${style.opacity}"` : ""
  const dash = svgStrokeDasharray(style)
  const transform = svgTransform(el)
  const strokeAttr = style.strokeColor !== "transparent" ? `stroke="${style.strokeColor}" stroke-width="${style.strokeWidth}"` : `stroke="none"`
  const fillAttr = style.fillColor !== "transparent" ? `fill="${style.fillColor}"` : `fill="none"`

  switch (el.type) {
    case "rectangle": {
      const x = Math.min(el.x, el.x + el.width)
      const y = Math.min(el.y, el.y + el.height)
      const w = Math.abs(el.width)
      const h = Math.abs(el.height)
      let svg = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${style.borderRadius}" ${fillAttr} ${strokeAttr} ${dash} ${opacity} ${transform} />`
      if (el.text) {
        svg += svgTextBlock(style, el.text, x, y, w, h, el)
      }
      return svg
    }
    case "ellipse": {
      const cx = el.x + el.width / 2
      const cy = el.y + el.height / 2
      const rx = Math.abs(el.width) / 2
      const ry = Math.abs(el.height) / 2
      let svg = `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ${fillAttr} ${strokeAttr} ${dash} ${opacity} ${transform} />`
      if (el.text) {
        const x = Math.min(el.x, el.x + el.width)
        const y = Math.min(el.y, el.y + el.height)
        svg += svgTextBlock(style, el.text, x, y, Math.abs(el.width), Math.abs(el.height), el)
      }
      return svg
    }
    case "diamond": {
      const cx = el.x + el.width / 2
      const cy = el.y + el.height / 2
      const hw = Math.abs(el.width) / 2
      const hh = Math.abs(el.height) / 2
      const points = `${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`
      let svg = `<polygon points="${points}" ${fillAttr} ${strokeAttr} ${dash} ${opacity} ${transform} />`
      if (el.text) {
        const x = Math.min(el.x, el.x + el.width)
        const y = Math.min(el.y, el.y + el.height)
        svg += svgTextBlock(style, el.text, x, y, Math.abs(el.width), Math.abs(el.height), el)
      }
      return svg
    }
    case "line": {
      if (el.points.length < 2) return ""
      const pts = el.points.map((p) => `${p.x},${p.y}`).join(" ")
      return `<polyline points="${pts}" fill="none" ${strokeAttr} ${dash} ${opacity} ${transform} stroke-linecap="round" stroke-linejoin="round" />`
    }
    case "arrow": {
      if (el.points.length < 2) return ""
      const start = el.points[0]
      const end = el.points[el.points.length - 1]
      const hasCurve = el.controlPointOffset && (el.controlPointOffset.x !== 0 || el.controlPointOffset.y !== 0)
      const headLen = ARROW_HEAD_BASE_SIZE + style.strokeWidth * ARROW_HEAD_STROKE_MULTIPLIER

      let pathD: string
      let endAngle: number
      let startAngle: number

      if (hasCurve) {
        const cpx = (start.x + end.x) / 2 + el.controlPointOffset!.x
        const cpy = (start.y + end.y) / 2 + el.controlPointOffset!.y
        pathD = `M ${start.x} ${start.y} Q ${cpx} ${cpy} ${end.x} ${end.y}`
        endAngle = Math.atan2(end.y - cpy, end.x - cpx)
        startAngle = Math.atan2(start.y - cpy, start.x - cpx)
      } else {
        pathD = `M ${start.x} ${start.y} L ${end.x} ${end.y}`
        endAngle = Math.atan2(end.y - start.y, end.x - start.x)
        startAngle = Math.atan2(start.y - end.y, start.x - end.x)
      }

      let svg = `<path d="${pathD}" fill="none" ${strokeAttr} ${dash} ${opacity} ${transform} stroke-linecap="round" stroke-linejoin="round" />`

      svg += arrowheadSvg(end, endAngle, headLen, style.strokeColor)

      if (el.bidirectional) {
        svg += arrowheadSvg(start, startAngle, headLen, style.strokeColor)
      }

      return svg
    }
    case "draw": {
      if (el.points.length < 2) return ""
      let d = `M ${el.points[0].x} ${el.points[0].y}`
      for (let i = 1; i < el.points.length - 1; i++) {
        const xc = (el.points[i].x + el.points[i + 1].x) / 2
        const yc = (el.points[i].y + el.points[i + 1].y) / 2
        d += ` Q ${el.points[i].x} ${el.points[i].y} ${xc} ${yc}`
      }
      const last = el.points[el.points.length - 1]
      d += ` L ${last.x} ${last.y}`
      return `<path d="${d}" fill="none" ${strokeAttr} ${dash} ${opacity} ${transform} stroke-linecap="round" stroke-linejoin="round" />`
    }
    case "text": {
      if (!el.text) return ""
      const textColor = style.textColor || (style.strokeColor === "transparent" ? "#1e1e1e" : style.strokeColor)
      const lines = el.text.split("\n")
      const lineHeight = style.fontSize * LINE_HEIGHT_MULTIPLIER
      let anchor = "start"
      let textX = el.x
      if (style.textAlign === "center") { anchor = "middle"; textX = el.x + el.width / 2 }
      else if (style.textAlign === "right") { anchor = "end"; textX = el.x + el.width }

      let svg = `<text x="${textX}" y="${el.y + style.fontSize}" ${svgFontString(style)} fill="${textColor}" text-anchor="${anchor}" ${opacity} ${transform}>`
      for (let i = 0; i < lines.length; i++) {
        if (i === 0) {
          svg += `<tspan x="${textX}" dy="0">${escapeXml(lines[i])}</tspan>`
        } else {
          svg += `<tspan x="${textX}" dy="${lineHeight}">${escapeXml(lines[i])}</tspan>`
        }
      }
      svg += `</text>`
      return svg
    }
    case "sticky": {
      const r = style.borderRadius
      const x = el.x
      const y = el.y
      const w = el.width
      const h = el.height
      let svg = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${style.fillColor}" ${strokeAttr} ${opacity} ${transform} />`
      if (el.text) {
        const textColor = style.textColor || "#1e1e1e"
        const lineHeight = style.fontSize * STICKY_LINE_HEIGHT_MULTIPLIER
        const lines = el.text.split("\n")
        let anchor = "start"
        let textX = x + STICKY_PADDING
        if (style.textAlign === "center") { anchor = "middle"; textX = x + w / 2 }
        else if (style.textAlign === "right") { anchor = "end"; textX = x + w - STICKY_PADDING }

        svg += `<text x="${textX}" y="${y + STICKY_PADDING + style.fontSize}" ${svgFontString(style)} fill="${textColor}" text-anchor="${anchor}" ${opacity} ${transform}>`
        for (let i = 0; i < lines.length; i++) {
          if (i === 0) {
            svg += `<tspan x="${textX}" dy="0">${escapeXml(lines[i])}</tspan>`
          } else {
            svg += `<tspan x="${textX}" dy="${lineHeight}">${escapeXml(lines[i])}</tspan>`
          }
        }
        svg += `</text>`
      }
      return svg
    }
    case "image": {
      if (!el.imageData) return ""
      const x = Math.min(el.x, el.x + el.width)
      const y = Math.min(el.y, el.y + el.height)
      const w = Math.abs(el.width)
      const h = Math.abs(el.height)
      // Embed image as base64 data URI
      return `<image href="${el.imageData}" x="${x}" y="${y}" width="${w}" height="${h}" ${opacity} ${transform} />`
    }
    case "group":
      // Groups are virtual containers, children are exported individually
      return ""
  }
}

function arrowheadSvg(tip: Point, angle: number, headLen: number, color: string): string {
  const p1x = tip.x - headLen * Math.cos(angle - ARROWHEAD_ANGLE)
  const p1y = tip.y - headLen * Math.sin(angle - ARROWHEAD_ANGLE)
  const p2x = tip.x - headLen * Math.cos(angle + ARROWHEAD_ANGLE)
  const p2y = tip.y - headLen * Math.sin(angle + ARROWHEAD_ANGLE)
  return `<polygon points="${tip.x},${tip.y} ${p1x},${p1y} ${p2x},${p2y}" fill="${color}" />`
}

function svgTextBlock(style: ElementStyle, text: string, x: number, y: number, w: number, h: number, el: BoardElement): string {
  const textColor = style.textColor || "#1e1e1e"
  const lineHeight = style.fontSize * LINE_HEIGHT_MULTIPLIER
  const lines = text.split("\n")
  const totalTextHeight = lines.length * lineHeight
  const startY = y + Math.max(TEXT_PADDING, (h - totalTextHeight) / 2) + style.fontSize

  let anchor = "start"
  let textX = x + TEXT_PADDING
  if (style.textAlign === "center") { anchor = "middle"; textX = x + w / 2 }
  else if (style.textAlign === "right") { anchor = "end"; textX = x + w - TEXT_PADDING }

  const transform = svgTransform(el)
  let svg = `<text x="${textX}" y="${startY}" ${svgFontString(style)} fill="${textColor}" text-anchor="${anchor}" ${transform}>`
  for (let i = 0; i < lines.length; i++) {
    if (i === 0) {
      svg += `<tspan x="${textX}" dy="0">${escapeXml(lines[i])}</tspan>`
    } else {
      svg += `<tspan x="${textX}" dy="${lineHeight}">${escapeXml(lines[i])}</tspan>`
    }
  }
  svg += `</text>`
  return svg
}

export function exportBoardToSvg(elements: BoardElement[], padding = EXPORT_SVG_PADDING, transparentBg = false): string {
  if (elements.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${EXPORT_EMPTY_WIDTH} ${EXPORT_EMPTY_HEIGHT}" width="${EXPORT_EMPTY_WIDTH}" height="${EXPORT_EMPTY_HEIGHT}">
  <rect width="${EXPORT_EMPTY_WIDTH}" height="${EXPORT_EMPTY_HEIGHT}" fill="#ffffff"/>
  <text x="${EXPORT_EMPTY_WIDTH / 2}" y="${EXPORT_EMPTY_HEIGHT / 2}" text-anchor="middle" fill="#999999" font-size="16" font-family="sans-serif">Empty board</text>
</svg>`
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const el of elements) {
    const b = getElementBounds(el)
    minX = Math.min(minX, b.x)
    minY = Math.min(minY, b.y)
    maxX = Math.max(maxX, b.x + b.width)
    maxY = Math.max(maxY, b.y + b.height)
  }

  const width = maxX - minX + padding * 2
  const height = maxY - minY + padding * 2
  const vbX = minX - padding
  const vbY = minY - padding

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX} ${vbY} ${width} ${height}" width="${width}" height="${height}">\n`
  if (!transparentBg) {
    svg += `  <rect x="${vbX}" y="${vbY}" width="${width}" height="${height}" fill="#ffffff"/>\n`
  }

  for (const el of elements) {
    const elSvg = elementToSvg(el)
    if (elSvg) svg += `  ${elSvg}\n`
  }

  svg += `</svg>`
  return svg
}

// ── JSON Export/Import ──────────────────────────────────────────

export function exportBoardToJson(
  elements: BoardElement[],
  camera: Camera,
  grid: GridSettings
): string {
  return JSON.stringify({ version: "2.0", elements, camera, grid }, null, 2)
}

export function importBoardFromJson(json: string): {
  elements: BoardElement[]
  camera: Camera
  grid: GridSettings
} {
  const data = JSON.parse(json) as {
    version?: string
    elements: BoardElement[]
    camera?: Camera
    grid?: GridSettings
  }

  const camera: Camera = data.camera ?? { x: 0, y: 0, zoom: 1 }
  const grid: GridSettings = data.grid ?? { enabled: true, size: 20 }

  // Normalize elements - apply defaults for missing fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const elements = (data.elements || []).map((el: any) => {
    const normalized = { ...el }
    if (normalized.visible === undefined) normalized.visible = true
    if (normalized.name === undefined) normalized.name = null
    if (normalized.groupId === undefined) normalized.groupId = null

    // Normalize richText for text/sticky
    if ((normalized.type === "text" || normalized.type === "sticky") && !normalized.richText) {
      normalized.richText = []
    }
    // Normalize richLabel for arrow
    if (normalized.type === "arrow" && !normalized.richLabel) {
      normalized.richLabel = []
    }
    // Normalize arrow fields
    if (normalized.type === "arrow") {
      if (normalized.startConnection === undefined) normalized.startConnection = null
      if (normalized.endConnection === undefined) normalized.endConnection = null
      if (normalized.controlPointOffset === undefined) normalized.controlPointOffset = null
      if (normalized.bidirectional === undefined) normalized.bidirectional = false
      if (normalized.label === undefined) normalized.label = ""
    }
    // Normalize sticky
    if (normalized.type === "sticky" && !normalized.stickyColor) {
      normalized.stickyColor = normalized.style?.fillColor || "#FEF3C7"
    }
    // Normalize rectangle
    if (normalized.type === "rectangle" && normalized.borderRadius === undefined) {
      normalized.borderRadius = normalized.style?.borderRadius || 0
    }
    // Normalize image
    if (normalized.type === "image" && normalized.imageData === undefined) {
      normalized.imageData = ""
    }
    // Normalize group
    if (normalized.type === "group") {
      if (normalized.isGroup === undefined) normalized.isGroup = true
      if (normalized.childIds === undefined) normalized.childIds = []
    }
    return normalized as BoardElement
  })

  return { elements, camera, grid }
}
