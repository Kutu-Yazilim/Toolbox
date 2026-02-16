import type { BoardElement, Camera, ElementStyle, ConnectionSide } from "@/types/board"
import { DEFAULT_STYLE } from "@/types/board"

// ── .kutud File Format ──────────────────────────────────────────
//
// XML-based format for saving and loading board state.
// File extension: .kutud (Kutu Diagram)
//
// Example:
// <?xml version="1.0" encoding="UTF-8"?>
// <kutud version="1.0">
//   <board>
//     <camera x="0" y="0" zoom="1" />
//     <grid enabled="true" size="20" />
//     <elements>
//       <element id="el-1" type="rectangle" x="100" y="100" width="200" height="150" rotation="0" locked="false">
//         <style stroke="#1e1e1e" fill="transparent" strokeWidth="2" opacity="1" fontSize="16"
//                fontFamily="sans-serif" textAlign="center" strokeStyle="solid" borderRadius="0" />
//         <text></text>
//         <points />
//       </element>
//     </elements>
//   </board>
// </kutud>

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

export function serializeToKutud(data: KutudData): string {
  const lines: string[] = []
  lines.push('<?xml version="1.0" encoding="UTF-8"?>')
  lines.push('<kutud version="1.0">')
  lines.push("  <board>")
  lines.push(`    <camera x="${data.camera.x}" y="${data.camera.y}" zoom="${data.camera.zoom}" />`)
  lines.push(`    <grid enabled="${data.gridEnabled}" size="${data.gridSize}" />`)
  lines.push("    <elements>")

  for (const el of data.elements) {
    lines.push(
      `      <element id="${escapeXml(el.id)}" type="${el.type}" x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rotation="${el.rotation}" locked="${el.locked}">`
    )
    const s = el.style
    lines.push(
      `        <style stroke="${escapeXml(s.strokeColor)}" fill="${escapeXml(s.fillColor)}" strokeWidth="${s.strokeWidth}" opacity="${s.opacity}" fontSize="${s.fontSize}" fontFamily="${escapeXml(s.fontFamily)}" textAlign="${s.textAlign}" strokeStyle="${s.strokeStyle}" borderRadius="${s.borderRadius}" />`
    )
    lines.push(`        <text>${escapeXml(el.text)}</text>`)

    if (el.points.length > 0) {
      lines.push("        <points>")
      for (const p of el.points) {
        lines.push(`          <point x="${p.x}" y="${p.y}" />`)
      }
      lines.push("        </points>")
    } else {
      lines.push("        <points />")
    }

    // Connection data for arrows
    if (el.startConnection) {
      lines.push(`        <startConnection elementId="${escapeXml(el.startConnection.elementId)}" side="${el.startConnection.side}" />`)
    }
    if (el.endConnection) {
      lines.push(`        <endConnection elementId="${escapeXml(el.endConnection.elementId)}" side="${el.endConnection.side}" />`)
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
    }

    const points = Array.from(pointNodes).map((p) => ({
      x: parseFloat(p.getAttribute("x") || "0"),
      y: parseFloat(p.getAttribute("y") || "0"),
    }))

    const element: BoardElement = {
      id: node.getAttribute("id") || `el-${Date.now()}-${Math.random()}`,
      type: (node.getAttribute("type") || "rectangle") as BoardElement["type"],
      x: parseFloat(node.getAttribute("x") || "0"),
      y: parseFloat(node.getAttribute("y") || "0"),
      width: parseFloat(node.getAttribute("width") || "0"),
      height: parseFloat(node.getAttribute("height") || "0"),
      rotation: parseFloat(node.getAttribute("rotation") || "0"),
      locked: node.getAttribute("locked") === "true",
      text: textNode?.textContent || "",
      style,
      points,
    }

    // Parse connection data
    const startConn = node.querySelector("startConnection")
    if (startConn) {
      element.startConnection = {
        elementId: startConn.getAttribute("elementId") || "",
        side: (startConn.getAttribute("side") || "top") as ConnectionSide,
      }
    }
    const endConn = node.querySelector("endConnection")
    if (endConn) {
      element.endConnection = {
        elementId: endConn.getAttribute("elementId") || "",
        side: (endConn.getAttribute("side") || "top") as ConnectionSide,
      }
    }

    elements.push(element)
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
