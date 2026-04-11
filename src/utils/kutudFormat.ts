import type { BoardElement, Camera, ElementStyle, ConnectionSide } from "@/types/board"
import { DEFAULT_STYLE } from "@/types/board"

// ── .kutud File Format ──────────────────────────────────────────
//
// XML-based format for saving and loading board state.
// File extension: .kutud (Kutu Diagram)

interface KutudData {
  elements: BoardElement[]
  camera: Camera
  gridEnabled: boolean
  gridSize: number
}

// ── Serialize to XML ────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function getElementText(el: BoardElement): string {
  if ("text" in el) return (el as { text: string }).text
  return ""
}

function getElementPoints(el: BoardElement): { x: number; y: number }[] {
  if ("points" in el) return (el as { points: { x: number; y: number }[] }).points
  return []
}

export function serializeToKutud(data: KutudData): string {
  const lines: string[] = []
  lines.push('<?xml version="1.0" encoding="UTF-8"?>')
  lines.push('<kutud version="1.0">')
  lines.push("  <board>")
  lines.push(`    <camera x="${data.camera.x}" y="${data.camera.y}" zoom="${data.camera.zoom}" />`)
  lines.push(`    <grid enabled="${data.gridEnabled}" size="${data.gridSize}" />`)
  lines.push("    <elements>")

  for (const el of data.elements) {
    const text = getElementText(el)
    const points = getElementPoints(el)

    lines.push(
      `      <element id="${escapeXml(el.id)}" type="${el.type}" x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rotation="${el.rotation}" locked="${el.locked}" visible="${el.visible}" name="${el.name ? escapeXml(el.name) : ""}" groupId="${el.groupId || ""}">`
    )
    const s = el.style
    lines.push(
      `        <style stroke="${escapeXml(s.strokeColor)}" fill="${escapeXml(s.fillColor)}" strokeWidth="${s.strokeWidth}" opacity="${s.opacity}" fontSize="${s.fontSize}" fontFamily="${escapeXml(s.fontFamily)}" textAlign="${s.textAlign}" strokeStyle="${s.strokeStyle}" borderRadius="${s.borderRadius}" fontWeight="${s.fontWeight || "normal"}" fontStyle="${s.fontStyle || "normal"}" textColor="${escapeXml(s.textColor || "")}" />`
    )
    lines.push(`        <text>${escapeXml(text)}</text>`)

    if (points.length > 0) {
      lines.push("        <points>")
      for (const p of points) {
        lines.push(`          <point x="${p.x}" y="${p.y}" />`)
      }
      lines.push("        </points>")
    } else {
      lines.push("        <points />")
    }

    // Connection data for arrows
    if (el.type === "arrow") {
      if (el.startConnection) {
        lines.push(`        <startConnection elementId="${escapeXml(el.startConnection.elementId)}" side="${el.startConnection.side}" />`)
      }
      if (el.endConnection) {
        lines.push(`        <endConnection elementId="${escapeXml(el.endConnection.elementId)}" side="${el.endConnection.side}" />`)
      }
      if (el.controlPointOffset) {
        lines.push(`        <controlPointOffset x="${el.controlPointOffset.x}" y="${el.controlPointOffset.y}" />`)
      }
      if (el.bidirectional) {
        lines.push(`        <bidirectional value="true" />`)
      }
      if (el.label) {
        lines.push(`        <label>${escapeXml(el.label)}</label>`)
      }
    }

    // Image data
    if (el.type === "image" && el.imageData) {
      lines.push(`        <imageData>${escapeXml(el.imageData)}</imageData>`)
    }

    // Group data
    if (el.type === "group") {
      lines.push(`        <childIds>${el.childIds.join(",")}</childIds>`)
    }

    // Rectangle border radius
    if (el.type === "rectangle") {
      lines.push(`        <borderRadius value="${el.borderRadius}" />`)
    }

    // Sticky color
    if (el.type === "sticky") {
      lines.push(`        <stickyColor value="${escapeXml(el.stickyColor)}" />`)
    }

    lines.push("      </element>")
  }

  lines.push("    </elements>")
  lines.push("  </board>")
  lines.push("</kutud>")

  return lines.join("\n")
}

// ── Parse from XML ──────────────────────────────────────────────

export function parseKutud(xml: string): KutudData {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, "text/xml")

  const parserError = doc.querySelector("parsererror")
  if (parserError) {
    throw new Error("Invalid .kutud file: " + parserError.textContent)
  }

  const kutud = doc.querySelector("kutud")
  if (!kutud) throw new Error("Invalid .kutud file: missing <kutud> root element")

  // Parse camera
  const cameraEl = doc.querySelector("camera")
  const camera: Camera = {
    x: parseFloat(cameraEl?.getAttribute("x") || "0"),
    y: parseFloat(cameraEl?.getAttribute("y") || "0"),
    zoom: parseFloat(cameraEl?.getAttribute("zoom") || "1"),
  }

  // Parse grid
  const gridEl = doc.querySelector("grid")
  const gridEnabled = gridEl?.getAttribute("enabled") === "true"
  const gridSize = parseInt(gridEl?.getAttribute("size") || "20")

  // Parse elements
  const elements: BoardElement[] = []
  const elementNodes = doc.querySelectorAll("element")

  elementNodes.forEach((node) => {
    const styleNode = node.querySelector("style")
    const textNode = node.querySelector("text")
    const pointNodes = node.querySelectorAll("point")

    const style: ElementStyle = {
      strokeColor: styleNode?.getAttribute("stroke") || DEFAULT_STYLE.strokeColor,
      fillColor: styleNode?.getAttribute("fill") || DEFAULT_STYLE.fillColor,
      strokeWidth: parseFloat(styleNode?.getAttribute("strokeWidth") || String(DEFAULT_STYLE.strokeWidth)),
      opacity: parseFloat(styleNode?.getAttribute("opacity") || String(DEFAULT_STYLE.opacity)),
      fontSize: parseFloat(styleNode?.getAttribute("fontSize") || String(DEFAULT_STYLE.fontSize)),
      fontFamily: styleNode?.getAttribute("fontFamily") || DEFAULT_STYLE.fontFamily,
      textAlign: (styleNode?.getAttribute("textAlign") as ElementStyle["textAlign"]) || DEFAULT_STYLE.textAlign,
      strokeStyle: (styleNode?.getAttribute("strokeStyle") as ElementStyle["strokeStyle"]) || DEFAULT_STYLE.strokeStyle,
      borderRadius: parseFloat(styleNode?.getAttribute("borderRadius") || String(DEFAULT_STYLE.borderRadius)),
      fontWeight: (styleNode?.getAttribute("fontWeight") as ElementStyle["fontWeight"]) || DEFAULT_STYLE.fontWeight,
      fontStyle: (styleNode?.getAttribute("fontStyle") as ElementStyle["fontStyle"]) || DEFAULT_STYLE.fontStyle,
      textColor: styleNode?.getAttribute("textColor") || DEFAULT_STYLE.textColor,
    }

    const points = Array.from(pointNodes).map((p) => ({
      x: parseFloat(p.getAttribute("x") || "0"),
      y: parseFloat(p.getAttribute("y") || "0"),
    }))

    const id = node.getAttribute("id") || `el-${Date.now()}-${Math.random()}`
    const type = (node.getAttribute("type") || "rectangle") as BoardElement["type"]
    const x = parseFloat(node.getAttribute("x") || "0")
    const y = parseFloat(node.getAttribute("y") || "0")
    const width = parseFloat(node.getAttribute("width") || "0")
    const height = parseFloat(node.getAttribute("height") || "0")
    const rotation = parseFloat(node.getAttribute("rotation") || "0")
    const locked = node.getAttribute("locked") === "true"
    const visible = node.getAttribute("visible") !== "false" // default true for backward compat
    const nameAttr = node.getAttribute("name")
    const name = nameAttr && nameAttr.length > 0 ? nameAttr : null
    const groupIdAttr = node.getAttribute("groupId")
    const groupId = groupIdAttr && groupIdAttr.length > 0 ? groupIdAttr : null
    const text = textNode?.textContent || ""

    const common = { id, x, y, width, height, rotation, locked, visible, name, groupId, style }

    // Parse connection data
    const startConnNode = node.querySelector("startConnection")
    const endConnNode = node.querySelector("endConnection")
    const startConnection = startConnNode ? {
      elementId: startConnNode.getAttribute("elementId") || "",
      side: (startConnNode.getAttribute("side") || "top") as ConnectionSide,
    } : null
    const endConnection = endConnNode ? {
      elementId: endConnNode.getAttribute("elementId") || "",
      side: (endConnNode.getAttribute("side") || "top") as ConnectionSide,
    } : null

    switch (type) {
      case "rectangle": {
        const brNode = node.querySelector("borderRadius")
        const borderRadius = brNode ? parseFloat(brNode.getAttribute("value") || "0") : style.borderRadius
        elements.push({ ...common, type: "rectangle", text, borderRadius })
        break
      }
      case "ellipse":
        elements.push({ ...common, type: "ellipse", text })
        break
      case "diamond":
        elements.push({ ...common, type: "diamond", text })
        break
      case "text":
        elements.push({ ...common, type: "text", text, richText: [] })
        break
      case "sticky": {
        const scNode = node.querySelector("stickyColor")
        const stickyColor = scNode ? scNode.getAttribute("value") || "#FEF3C7" : style.fillColor || "#FEF3C7"
        elements.push({ ...common, type: "sticky", text, richText: [], stickyColor })
        break
      }
      case "image": {
        const imgNode = node.querySelector("imageData")
        const imageData = imgNode?.textContent || ""
        elements.push({ ...common, type: "image", imageData })
        break
      }
      case "draw":
        elements.push({ ...common, type: "draw", points })
        break
      case "line": {
        const linePoints: [{ x: number; y: number }, { x: number; y: number }] = points.length >= 2
          ? [points[0], points[1]]
          : [{ x: 0, y: 0 }, { x: 0, y: 0 }]
        elements.push({ ...common, type: "line", points: linePoints })
        break
      }
      case "arrow": {
        const arrowPoints: [{ x: number; y: number }, { x: number; y: number }] = points.length >= 2
          ? [points[0], points[1]]
          : [{ x: 0, y: 0 }, { x: 0, y: 0 }]
        const cpNode = node.querySelector("controlPointOffset")
        const controlPointOffset = cpNode ? {
          x: parseFloat(cpNode.getAttribute("x") || "0"),
          y: parseFloat(cpNode.getAttribute("y") || "0"),
        } : null
        const biNode = node.querySelector("bidirectional")
        const bidirectional = biNode?.getAttribute("value") === "true"
        const labelNode = node.querySelector("label")
        const label = labelNode?.textContent || ""
        elements.push({
          ...common, type: "arrow", points: arrowPoints,
          startConnection, endConnection, controlPointOffset,
          bidirectional, label, richLabel: [],
        })
        break
      }
      case "group": {
        const childIdsNode = node.querySelector("childIds")
        const childIdsStr = childIdsNode?.textContent || ""
        const childIds = childIdsStr ? childIdsStr.split(",").filter(Boolean) : []
        elements.push({ ...common, type: "group", isGroup: true, childIds })
        break
      }
    }
  })

  return { elements, camera, gridEnabled, gridSize }
}

// ── File Download ───────────────────────────────────────────────

export function downloadKutud(data: KutudData, filename = "board.kutud") {
  const xml = serializeToKutud(data)
  const blob = new Blob([xml], { type: "application/xml" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── File Upload ─────────────────────────────────────────────────

export function readKutudFile(file: File): Promise<KutudData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = parseKutud(reader.result as string)
        resolve(data)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsText(file)
  })
}
