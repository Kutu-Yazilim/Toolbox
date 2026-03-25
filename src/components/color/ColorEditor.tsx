"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  rgbToHsb,
  hsbToRgb,
  rgbToCmyk,
  isValidHex,
} from "@/utils/colorUtils"
import type { RGB, HSL, HSB } from "@/types/color"
import { XIcon, CopyIcon, CheckIcon } from "lucide-react"

interface ColorEditorProps {
  hex: string
  colorName?: string
  onChange: (hex: string) => void
  onClose: () => void
  textColor: string
}

type ColorMode = "hex" | "rgb" | "hsl" | "hsb" | "cmyk"

export function ColorEditor({ hex, colorName, onChange, onClose, textColor }: ColorEditorProps) {
  const [mode, setMode] = useState<ColorMode>("hex")
  const [hexInput, setHexInput] = useState(hex.replace("#", ""))
  const [rgb, setRgb] = useState<RGB>(hexToRgb(hex))
  const [hsl, setHsl] = useState<HSL>(rgbToHsl(hexToRgb(hex)))
  const [hsb, setHsb] = useState<HSB>(rgbToHsb(hexToRgb(hex)))
  const [copied, setCopied] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const newRgb = hexToRgb(hex)
    setRgb(newRgb)
    setHsl(rgbToHsl(newRgb))
    setHsb(rgbToHsb(newRgb))
    setHexInput(hex.replace("#", ""))
  }, [hex])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (editorRef.current && !editorRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  const handleHexChange = (value: string) => {
    const clean = value.replace("#", "").slice(0, 6)
    setHexInput(clean)
    if (clean.length === 6 && isValidHex(clean)) {
      onChange(`#${clean.toUpperCase()}`)
    }
  }

  const handleRgbChange = (channel: keyof RGB, value: string) => {
    const num = Math.max(0, Math.min(255, parseInt(value) || 0))
    const newRgb = { ...rgb, [channel]: num }
    setRgb(newRgb)
    onChange(rgbToHex(newRgb))
  }

  const handleHslChange = (channel: keyof HSL, value: string) => {
    const max = channel === "h" ? 360 : 100
    const num = Math.max(0, Math.min(max, parseInt(value) || 0))
    const newHsl = { ...hsl, [channel]: num }
    setHsl(newHsl)
    onChange(rgbToHex(hslToRgb(newHsl)))
  }

  const handleHsbChange = (channel: keyof HSB, value: string) => {
    const max = channel === "h" ? 360 : 100
    const num = Math.max(0, Math.min(max, parseInt(value) || 0))
    const newHsb = { ...hsb, [channel]: num }
    setHsb(newHsb)
    onChange(rgbToHex(hsbToRgb(newHsb)))
  }

  const copyColor = () => {
    let text = hex
    switch (mode) {
      case "rgb":
        text = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
        break
      case "hsl":
        text = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
        break
      case "hsb":
        text = `hsb(${hsb.h}, ${hsb.s}%, ${hsb.b}%)`
        break
      case "cmyk": {
        const cmyk = rgbToCmyk(hexToRgb(hex))
        text = `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`
        break
      }
    }
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const modes: ColorMode[] = ["hex", "rgb", "hsl", "hsb", "cmyk"]
  const cmyk = rgbToCmyk(hexToRgb(hex))

  const inputClass = "w-full bg-transparent border-b border-current/30 text-center text-sm py-1 outline-none focus:border-current/60 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
  const labelClass = "text-[10px] uppercase opacity-50 font-medium"

  return (
    <div
      ref={editorRef}
      className="absolute inset-x-4 bottom-24 z-50 rounded-lg p-4 flex flex-col gap-3"
      style={{ color: textColor, backgroundColor: `${textColor === "#FFFFFF" ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.9)"}` }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium opacity-70">{colorName ?? hex}</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={copyColor}
            className="hover:bg-current/10"
            style={{ color: textColor }}
          >
            {copied ? <CheckIcon className="size-3" /> : <CopyIcon className="size-3" />}
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            className="hover:bg-current/10"
            style={{ color: textColor }}
          >
            <XIcon className="size-3" />
          </Button>
        </div>
      </div>

      {/* Color mode tabs */}
      <div className="flex gap-1">
        {modes.map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "flex-1 text-[10px] uppercase font-medium py-1 rounded transition-colors",
              mode === m ? "bg-current/20" : "hover:bg-current/10 opacity-50"
            )}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Color inputs */}
      <div className="flex gap-3">
        {mode === "hex" && (
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="flex items-center gap-1 w-full">
              <span className="text-sm opacity-50">#</span>
              <input
                type="text"
                value={hexInput}
                onChange={(e) => handleHexChange(e.target.value)}
                className={inputClass}
                maxLength={6}
                spellCheck={false}
              />
            </div>
            <span className={labelClass}>Hex</span>
          </div>
        )}

        {mode === "rgb" && (
          <>
            {(["r", "g", "b"] as const).map((ch) => (
              <div key={ch} className="flex-1 flex flex-col items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={rgb[ch]}
                  onChange={(e) => handleRgbChange(ch, e.target.value)}
                  className={inputClass}
                />
                <span className={labelClass}>{ch.toUpperCase()}</span>
              </div>
            ))}
          </>
        )}

        {mode === "hsl" && (
          <>
            {(["h", "s", "l"] as const).map((ch) => (
              <div key={ch} className="flex-1 flex flex-col items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={ch === "h" ? 360 : 100}
                  value={hsl[ch]}
                  onChange={(e) => handleHslChange(ch, e.target.value)}
                  className={inputClass}
                />
                <span className={labelClass}>
                  {ch === "h" ? "H°" : ch === "s" ? "S%" : "L%"}
                </span>
              </div>
            ))}
          </>
        )}

        {mode === "hsb" && (
          <>
            {(["h", "s", "b"] as const).map((ch) => (
              <div key={ch} className="flex-1 flex flex-col items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={ch === "h" ? 360 : 100}
                  value={hsb[ch]}
                  onChange={(e) => handleHsbChange(ch, e.target.value)}
                  className={inputClass}
                />
                <span className={labelClass}>
                  {ch === "h" ? "H°" : ch === "s" ? "S%" : "B%"}
                </span>
              </div>
            ))}
          </>
        )}

        {mode === "cmyk" && (
          <>
            {(["c", "m", "y", "k"] as const).map((ch) => (
              <div key={ch} className="flex-1 flex flex-col items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={cmyk[ch]}
                  readOnly
                  className={cn(inputClass, "opacity-70")}
                />
                <span className={labelClass}>{ch.toUpperCase()}%</span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Hue slider */}
      <div className="flex flex-col gap-1">
        <input
          type="range"
          min={0}
          max={360}
          value={hsl.h}
          onChange={(e) => {
            const newH = parseInt(e.target.value)
            const newHsl = { ...hsl, h: newH }
            setHsl(newHsl)
            onChange(rgbToHex(hslToRgb(newHsl)))
          }}
          className="w-full h-3 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gray-400 [&::-webkit-slider-thumb]:shadow-md"
          style={{
            background: `linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))`,
          }}
        />
        <span className={cn(labelClass, "text-center")}>Hue</span>
      </div>

      {/* Saturation slider */}
      <div className="flex flex-col gap-1">
        <input
          type="range"
          min={0}
          max={100}
          value={hsl.s}
          onChange={(e) => {
            const newS = parseInt(e.target.value)
            const newHsl = { ...hsl, s: newS }
            setHsl(newHsl)
            onChange(rgbToHex(hslToRgb(newHsl)))
          }}
          className="w-full h-3 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gray-400 [&::-webkit-slider-thumb]:shadow-md"
          style={{
            background: `linear-gradient(to right, hsl(${hsl.h},0%,${hsl.l}%), hsl(${hsl.h},100%,${hsl.l}%))`,
          }}
        />
        <span className={cn(labelClass, "text-center")}>Saturation</span>
      </div>

      {/* Lightness slider */}
      <div className="flex flex-col gap-1">
        <input
          type="range"
          min={0}
          max={100}
          value={hsl.l}
          onChange={(e) => {
            const newL = parseInt(e.target.value)
            const newHsl = { ...hsl, l: newL }
            setHsl(newHsl)
            onChange(rgbToHex(hslToRgb(newHsl)))
          }}
          className="w-full h-3 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gray-400 [&::-webkit-slider-thumb]:shadow-md"
          style={{
            background: `linear-gradient(to right, hsl(${hsl.h},${hsl.s}%,0%), hsl(${hsl.h},${hsl.s}%,50%), hsl(${hsl.h},${hsl.s}%,100%))`,
          }}
        />
        <span className={cn(labelClass, "text-center")}>Lightness</span>
      </div>
    </div>
  )
}
