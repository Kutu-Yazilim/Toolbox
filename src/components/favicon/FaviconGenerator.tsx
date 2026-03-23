import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  UploadIcon,
  DownloadIcon,
  CopyIcon,
  CheckIcon,
  AlertTriangleIcon,
  ImageIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import JSZip from "jszip"

type FaviconSize = {
  width: number
  height: number
  filename: string
  label: string
  rel: string
  type: string
}

const FAVICON_SIZES: FaviconSize[] = [
  {
    width: 16,
    height: 16,
    filename: "favicon-16x16.png",
    label: "16×16",
    rel: "icon",
    type: "image/png",
  },
  {
    width: 32,
    height: 32,
    filename: "favicon-32x32.png",
    label: "32×32",
    rel: "icon",
    type: "image/png",
  },
  {
    width: 48,
    height: 48,
    filename: "favicon-48x48.png",
    label: "48×48",
    rel: "icon",
    type: "image/png",
  },
  {
    width: 180,
    height: 180,
    filename: "apple-touch-icon.png",
    label: "180×180",
    rel: "apple-touch-icon",
    type: "image/png",
  },
  {
    width: 192,
    height: 192,
    filename: "android-chrome-192x192.png",
    label: "192×192",
    rel: "icon",
    type: "image/png",
  },
  {
    width: 512,
    height: 512,
    filename: "android-chrome-512x512.png",
    label: "512×512",
    rel: "icon",
    type: "image/png",
  },
]

const HTML_TAGS = `<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png">
<link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png">`

type GeneratedFavicon = {
  size: FaviconSize
  blob: Blob
  url: string
}

export function FaviconGenerator() {
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null)
  const [sourceName, setSourceName] = useState("")
  const [isSquare, setIsSquare] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [favicons, setFavicons] = useState<GeneratedFavicon[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        setSourceImage(img)
        setSourceName(file.name)
        setIsSquare(img.naturalWidth === img.naturalHeight)
        setFavicons([])
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) loadImage(file)
    },
    [loadImage],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) loadImage(file)
    },
    [loadImage],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const generateFavicons = useCallback(async () => {
    if (!sourceImage) return

    setIsGenerating(true)

    // Clean up old URLs
    favicons.forEach((f) => URL.revokeObjectURL(f.url))

    const generated: GeneratedFavicon[] = []

    for (const size of FAVICON_SIZES) {
      const canvas = document.createElement("canvas")
      canvas.width = size.width
      canvas.height = size.height
      const ctx = canvas.getContext("2d")
      if (!ctx) continue

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"
      ctx.drawImage(sourceImage, 0, 0, size.width, size.height)

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (b) => resolve(b!),
          "image/png",
        )
      })

      generated.push({
        size,
        blob,
        url: URL.createObjectURL(blob),
      })
    }

    setFavicons(generated)
    setIsGenerating(false)
  }, [sourceImage, favicons])

  const downloadZip = useCallback(async () => {
    if (favicons.length === 0) return

    const zip = new JSZip()
    for (const favicon of favicons) {
      zip.file(favicon.size.filename, favicon.blob)
    }

    const content = await zip.generateAsync({ type: "blob" })
    const url = URL.createObjectURL(content)
    const a = document.createElement("a")
    a.href = url
    a.download = "favicons.zip"
    a.click()
    URL.revokeObjectURL(url)
  }, [favicons])

  const copyHtmlTags = useCallback(async () => {
    await navigator.clipboard.writeText(HTML_TAGS)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4">
      {/* Upload area */}
      <div
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
        )}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        {sourceImage ? (
          <div className="flex flex-col items-center gap-3">
            <img
              src={sourceImage.src}
              alt="Source"
              className="h-32 w-32 rounded-md border border-border object-contain"
            />
            <p className="text-sm text-muted-foreground">{sourceName}</p>
            <p className="text-xs text-muted-foreground">
              {sourceImage.naturalWidth} × {sourceImage.naturalHeight}px
            </p>
            {!isSquare && (
              <div className="flex items-center gap-1.5 rounded-md bg-yellow-500/10 px-3 py-1.5 text-xs text-yellow-600 dark:text-yellow-400">
                <AlertTriangleIcon className="h-3.5 w-3.5" />
                Image is not square. Favicons may appear distorted.
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Click or drag to replace
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <UploadIcon className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">
              Drop an image here or click to upload
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, SVG, or WebP — ideally square
            </p>
          </div>
        )}
      </div>

      {/* Generate button */}
      {sourceImage && (
        <div className="flex justify-center">
          <Button onClick={generateFavicons} disabled={isGenerating}>
            <ImageIcon className="mr-2 h-4 w-4" />
            {isGenerating ? "Generating..." : "Generate Favicons"}
          </Button>
        </div>
      )}

      {/* Preview grid */}
      {favicons.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-foreground">Preview</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
            {favicons.map((favicon) => (
              <div
                key={favicon.size.filename}
                className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-3"
              >
                <div className="flex h-20 w-20 items-center justify-center">
                  <img
                    src={favicon.url}
                    alt={favicon.size.label}
                    className="max-h-full max-w-full"
                    style={{
                      imageRendering:
                        favicon.size.width <= 32 ? "pixelated" : "auto",
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-foreground">
                  {favicon.size.label}
                </span>
                <span className="truncate text-[10px] text-muted-foreground">
                  {favicon.size.filename}
                </span>
              </div>
            ))}
          </div>

          {/* Download ZIP */}
          <div className="flex justify-center">
            <Button onClick={downloadZip}>
              <DownloadIcon className="mr-2 h-4 w-4" />
              Download ZIP
            </Button>
          </div>

          {/* HTML tags */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-foreground">
                HTML Link Tags
              </h2>
              <Button variant="outline" size="sm" onClick={copyHtmlTags}>
                {copied ? (
                  <CheckIcon className="mr-1.5 h-3.5 w-3.5" />
                ) : (
                  <CopyIcon className="mr-1.5 h-3.5 w-3.5" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <pre className="overflow-x-auto rounded-lg border border-border bg-muted/50 p-4 text-xs text-foreground">
              {HTML_TAGS}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
