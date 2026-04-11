"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { XIcon, UploadIcon, ImageIcon } from "lucide-react"
import { extractColors } from "./colorExtractor"

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"]
const MAX_DIMENSION = 200
const DEFAULT_COLOR_COUNT = 5
const MIN_COLOR_COUNT = 3
const MAX_COLOR_COUNT = 12

interface ImageExtractorModalProps {
    onUseAsPalette: (colors: string[]) => void
    onAddToPalette: (colors: string[]) => void
    onClose: () => void
}

export function ImageExtractorModal({ onUseAsPalette, onAddToPalette, onClose }: ImageExtractorModalProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null)
    const [colors, setColors] = useState<string[]>([])
    const [colorCount, setColorCount] = useState(DEFAULT_COLOR_COUNT)
    const [isDragging, setIsDragging] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const processImage = useCallback((file: File) => {
        if (!ACCEPTED_TYPES.includes(file.type)) return

        const reader = new FileReader()
        reader.onload = () => {
            const src = reader.result as string
            setImageSrc(src)

            const img = new Image()
            img.onload = () => {
                const canvas = canvasRef.current
                if (!canvas) return

                // Downscale to max dimension
                let width = img.width
                let height = img.height
                if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
                    width = Math.round(width * ratio)
                    height = Math.round(height * ratio)
                }

                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext("2d")
                if (!ctx) return

                ctx.drawImage(img, 0, 0, width, height)
                const imageData = ctx.getImageData(0, 0, width, height)
                setColors(extractColors(imageData, colorCount))
            }
            img.src = src
        }
        reader.readAsDataURL(file)
    }, [colorCount])

    const reExtract = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        setColors(extractColors(imageData, colorCount))
    }, [colorCount])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) processImage(file)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) processImage(file)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[85%]">
                {/* Header */}
                <div className="flex items-center justify-between px-4 h-10 border-b border-border flex-shrink-0">
                    <span className="text-sm font-medium text-foreground">Extract Colors from Image</span>
                    <Button variant="ghost" size="xs" onClick={onClose}>
                        <XIcon className="h-3 w-3" />
                    </Button>
                </div>

                {/* Body */}
                <div className="flex-1 flex flex-col gap-3 p-4 min-h-0 overflow-y-auto">
                    {/* Hidden canvas for pixel processing */}
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Upload area */}
                    {!imageSrc ? (
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer ${
                                isDragging
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-muted-foreground"
                            }`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <ImageIcon className="h-10 w-10 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Drop image here or click to browse</span>
                            <span className="text-xs text-muted-foreground">PNG, JPG, WEBP, SVG</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={imageSrc}
                                alt="Uploaded"
                                className="max-h-[300px] w-full object-contain rounded-md border border-border"
                            />
                            <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => {
                                    setImageSrc(null)
                                    setColors([])
                                }}
                            >
                                <span className="text-xs text-muted-foreground">Change image</span>
                            </Button>
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp,.svg"
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    {/* Color count slider */}
                    {imageSrc && (
                        <div className="flex items-center gap-3">
                            <label className="text-xs text-muted-foreground whitespace-nowrap">
                                Colors: {colorCount}
                            </label>
                            <input
                                type="range"
                                min={MIN_COLOR_COUNT}
                                max={MAX_COLOR_COUNT}
                                value={colorCount}
                                onChange={e => setColorCount(Number(e.target.value))}
                                className="flex-1 accent-primary"
                            />
                        </div>
                    )}

                    {/* Extracted palette */}
                    {colors.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <span className="text-xs text-muted-foreground">Extracted Colors</span>
                            <div className="flex flex-wrap gap-2">
                                {colors.map((color, i) => (
                                    <div key={`${color}-${i}`} className="flex flex-col items-center gap-1">
                                        <div
                                            className="w-10 h-10 rounded-md border border-border shadow-sm"
                                            style={{ backgroundColor: color }}
                                        />
                                        <span className="text-[10px] font-mono text-muted-foreground">{color}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-4 h-12 border-t border-border flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <span className="text-xs">Cancel</span>
                    </Button>
                    {colors.length > 0 && (
                        <>
                            <Button variant="outline" size="sm" onClick={reExtract}>
                                <span className="text-xs">Re-extract</span>
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => onAddToPalette(colors)}>
                                <span className="text-xs">Add to Palette</span>
                            </Button>
                            <Button variant="default" size="sm" onClick={() => onUseAsPalette(colors)}>
                                <UploadIcon className="h-3 w-3" />
                                <span className="text-xs">Use as Palette</span>
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
