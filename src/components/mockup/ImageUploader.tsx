import { useRef, useState, useEffect, useCallback } from "react"
import { UploadIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageUploaderProps {
  onImageUpload: (dataUrl: string, naturalSize: { w: number; h: number }) => void
}

export function ImageUploader({ onImageUpload }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const processFile = useCallback(
    (file: File) => {
      if (file.size > 20 * 1024 * 1024) return
      if (!file.type.startsWith("image/")) return

      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        const img = new Image()
        img.onload = () => {
          onImageUpload(dataUrl, { w: img.naturalWidth, h: img.naturalHeight })
        }
        img.src = dataUrl
      }
      reader.readAsDataURL(file)
    },
    [onImageUpload]
  )

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile()
          if (file) processFile(file)
        }
      }
    }
    document.addEventListener("paste", handlePaste)
    return () => document.removeEventListener("paste", handlePaste)
  }, [processFile])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-4 p-12 w-full max-w-md cursor-pointer transition-colors",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadIcon className="h-12 w-12 text-muted-foreground/50" />
        <p className="text-muted-foreground text-sm text-center">
          Drop image here or click to browse
        </p>
        <p className="text-muted-foreground/50 text-xs">
          PNG, JPG, WebP — max 20 MB
        </p>
        <p className="text-muted-foreground/40 text-xs">
          or paste from clipboard (Ctrl+V)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}
