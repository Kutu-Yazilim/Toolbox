"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { hexToRgb, rgbToHsl } from "@/utils/colorUtils"
import type { PaletteColor, ExportFormat } from "@/types/color"
import { toPng } from "html-to-image"
import { jsPDF } from "jspdf"
import {
  XIcon,
  CopyIcon,
  CheckIcon,
  DownloadIcon,
  ImageIcon,
  FileTextIcon,
  CodeIcon,
  LinkIcon,
  PaletteIcon,
} from "lucide-react"

interface ExportDialogProps {
  colors: PaletteColor[]
  onClose: () => void
  paletteRef: React.RefObject<HTMLDivElement | null>
}

export function ExportDialog({ colors, onClose, paletteRef }: ExportDialogProps) {
  const [activeFormat, setActiveFormat] = useState<ExportFormat>("png")
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  const hexValues = colors.map((c) => c.hex)

  const getCodeContent = (): string => {
    switch (activeFormat) {
      case "url":
        return `${window.location.origin}${window.location.pathname}#colors=${hexValues.map((h) => h.replace("#", "")).join("-")}`
      case "json":
        return JSON.stringify(
          {
            palette: colors.map((c) => {
              const rgb = hexToRgb(c.hex)
              const hsl = rgbToHsl(rgb)
              return {
                hex: c.hex,
                rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
                hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
              }
            }),
          },
          null,
          2
        )
      case "dart":
        return [
          "import 'package:flutter/material.dart';",
          "",
          "class AppColors {",
          ...colors.map((c, i) => {
            const rgb = hexToRgb(c.hex)
            return `  static const Color color${i + 1} = Color.fromARGB(255, ${rgb.r}, ${rgb.g}, ${rgb.b}); // ${c.hex}`
          }),
          "",
          "  static const List<Color> palette = [",
          ...colors.map((_, i) => `    color${i + 1},`),
          "  ];",
          "}",
        ].join("\n")
      case "css":
        return [
          ":root {",
          ...colors.map((c, i) => `  --color-${i + 1}: ${c.hex};`),
          "}",
        ].join("\n")
      case "scss":
        return colors
          .map((c, i) => `$color-${i + 1}: ${c.hex};`)
          .join("\n")
      case "tailwind":
        return [
          "// tailwind.config.js",
          "module.exports = {",
          "  theme: {",
          "    extend: {",
          "      colors: {",
          "        palette: {",
          ...colors.map((c, i) => `          '${i + 1}': '${c.hex}',`),
          "        },",
          "      },",
          "    },",
          "  },",
          "}",
        ].join("\n")
      case "svg":
        return [
          `<svg xmlns="http://www.w3.org/2000/svg" width="${colors.length * 120}" height="120" viewBox="0 0 ${colors.length * 120} 120">`,
          ...colors.map(
            (c, i) =>
              `  <rect x="${i * 120}" y="0" width="120" height="120" fill="${c.hex}" />`
          ),
          ...colors.map(
            (c, i) =>
              `  <text x="${i * 120 + 60}" y="110" text-anchor="middle" font-family="monospace" font-size="11" fill="${getTextColor(c.hex)}">${c.hex}</text>`
          ),
          "</svg>",
        ].join("\n")
      default:
        return ""
    }
  }

  function getTextColor(hex: string): string {
    const rgb = hexToRgb(hex)
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
    return luminance > 0.5 ? "#000000" : "#FFFFFF"
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getCodeContent())
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      switch (activeFormat) {
        case "png": {
          if (paletteRef.current) {
            const dataUrl = await toPng(paletteRef.current, {
              quality: 1,
              pixelRatio: 2,
            })
            const a = document.createElement("a")
            a.href = dataUrl
            a.download = "palette.png"
            a.click()
          }
          break
        }
        case "pdf": {
          const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
          const pageWidth = doc.internal.pageSize.getWidth()
          const pageHeight = doc.internal.pageSize.getHeight()
          const margin = 15
          const swatchWidth = (pageWidth - margin * 2) / colors.length
          const swatchHeight = pageHeight - margin * 2 - 20

          // Title
          doc.setFontSize(14)
          doc.setTextColor(60, 60, 60)
          doc.text("Color Palette", margin, margin)

          // Color swatches
          colors.forEach((c, i) => {
            const rgb = hexToRgb(c.hex)
            const x = margin + i * swatchWidth
            const y = margin + 8
            doc.setFillColor(rgb.r, rgb.g, rgb.b)
            doc.rect(x, y, swatchWidth - 2, swatchHeight, "F")

            // Hex label below
            doc.setFontSize(9)
            doc.setTextColor(60, 60, 60)
            doc.text(c.hex, x + swatchWidth / 2 - 1, y + swatchHeight + 6, { align: "center" })
          })

          doc.save("palette.pdf")
          break
        }
        case "svg":
          downloadFile(getCodeContent(), "palette.svg", "image/svg+xml")
          break
        case "json":
          downloadFile(getCodeContent(), "palette.json", "application/json")
          break
        case "dart":
          downloadFile(getCodeContent(), "app_colors.dart", "text/plain")
          break
        case "css":
          downloadFile(getCodeContent(), "palette.css", "text/css")
          break
        case "scss":
          downloadFile(getCodeContent(), "palette.scss", "text/plain")
          break
        case "tailwind":
          downloadFile(getCodeContent(), "tailwind-colors.js", "text/javascript")
          break
        case "url":
          navigator.clipboard.writeText(getCodeContent())
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
          break
      }
    } finally {
      setExporting(false)
    }
  }

  const formats: { value: ExportFormat; label: string; icon: React.ReactNode }[] = [
    { value: "png", label: "PNG", icon: <ImageIcon className="size-4" /> },
    { value: "pdf", label: "PDF", icon: <FileTextIcon className="size-4" /> },
    { value: "svg", label: "SVG", icon: <PaletteIcon className="size-4" /> },
    { value: "json", label: "JSON", icon: <CodeIcon className="size-4" /> },
    { value: "dart", label: "Dart", icon: <CodeIcon className="size-4" /> },
    { value: "css", label: "CSS", icon: <CodeIcon className="size-4" /> },
    { value: "scss", label: "SCSS", icon: <CodeIcon className="size-4" /> },
    { value: "tailwind", label: "Tailwind", icon: <CodeIcon className="size-4" /> },
    { value: "url", label: "URL", icon: <LinkIcon className="size-4" /> },
  ]

  const codeContent = getCodeContent()
  const hasPreview = !["png", "pdf"].includes(activeFormat)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        ref={dialogRef}
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Export Palette</h2>
          <Button variant="ghost" size="icon-xs" onClick={onClose}>
            <XIcon className="size-4" />
          </Button>
        </div>

        {/* Palette preview bar */}
        <div className="flex h-16 mx-6 mt-4 rounded-lg overflow-hidden border border-border">
          {colors.map((c) => (
            <div
              key={c.id}
              className="flex-1 flex items-end justify-center pb-1"
              style={{ backgroundColor: c.hex }}
            >
              <span
                className="text-[10px] font-mono font-medium"
                style={{ color: getTextColor(c.hex) }}
              >
                {c.hex}
              </span>
            </div>
          ))}
        </div>

        {/* Format selector */}
        <div className="flex flex-wrap gap-2 px-6 py-3">
          {formats.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFormat(f.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                activeFormat === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {f.icon}
              {f.label}
            </button>
          ))}
        </div>

        {/* Code preview */}
        {hasPreview && (
          <div className="mx-6 relative">
            <pre className="bg-muted rounded-lg p-4 text-sm font-mono overflow-auto max-h-48 text-foreground">
              {codeContent}
            </pre>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={copyToClipboard}
              className="absolute top-2 right-2"
            >
              {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
            </Button>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border mt-auto">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {activeFormat === "url" ? (
              <>
                <CopyIcon className="size-4" />
                Copy URL
              </>
            ) : (
              <>
                <DownloadIcon className="size-4" />
                {exporting ? "Exporting..." : `Export ${activeFormat.toUpperCase()}`}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
