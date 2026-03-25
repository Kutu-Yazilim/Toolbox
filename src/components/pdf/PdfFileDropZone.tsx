"use client"

import { useState, useRef, useCallback } from "react"
import { UploadIcon, XIcon, FileIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { validateFileType, formatFileSize } from "@/utils/pdfUtils"

interface PdfFileDropZoneProps {
  acceptedMimeTypes: string[]
  acceptedExtensions: string[]
  multiple: boolean
  maxSizeMb?: number
  onFiles: (files: File[]) => void
  label?: string
}

export function PdfFileDropZone({
  acceptedMimeTypes,
  acceptedExtensions,
  multiple,
  maxSizeMb = 100,
  onFiles,
  label,
}: PdfFileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return
      setError(null)

      const validFiles: File[] = []
      for (const file of Array.from(files)) {
        if (!validateFileType(file, acceptedMimeTypes, acceptedExtensions)) {
          setError(
            `"${file.name}" is not a supported file type. Accepted: ${acceptedExtensions.join(", ")}`
          )
          return
        }
        const sizeMb = file.size / (1024 * 1024)
        if (sizeMb > maxSizeMb) {
          setError(
            `"${file.name}" exceeds the ${maxSizeMb}MB limit (${formatFileSize(file.size)})`
          )
          return
        }
        validFiles.push(file)
      }

      if (!multiple && validFiles.length > 1) {
        setError("Only one file is allowed")
        return
      }

      if (multiple) {
        const merged = [...selectedFiles, ...validFiles]
        setSelectedFiles(merged)
        onFiles(merged)
      } else {
        setSelectedFiles(validFiles)
        onFiles(validFiles)
      }
    },
    [acceptedMimeTypes, acceptedExtensions, multiple, maxSizeMb, onFiles, selectedFiles]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const removeFile = useCallback(
    (index: number) => {
      const updated = selectedFiles.filter((_, i) => i !== index)
      setSelectedFiles(updated)
      onFiles(updated)
    },
    [selectedFiles, onFiles]
  )

  const moveFile = useCallback(
    (from: number, to: number) => {
      const updated = [...selectedFiles]
      const [moved] = updated.splice(from, 1)
      updated.splice(to, 0, moved)
      setSelectedFiles(updated)
      onFiles(updated)
    },
    [selectedFiles, onFiles]
  )

  const acceptStr = [...acceptedExtensions, ...acceptedMimeTypes].join(",")

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/20 hover:border-muted-foreground/40 hover:bg-muted/30"
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptStr}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <UploadIcon className="size-10 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-sm font-medium text-foreground">
          {label ?? "Drop files here or click to browse"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {acceptedExtensions.join(", ")} {multiple ? " — multiple files allowed" : ""}
        </p>
      </div>

      {error && (
        <p className="text-xs text-destructive px-1">{error}</p>
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-1.5">
          {selectedFiles.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              draggable={multiple}
              onDragStart={(e) => e.dataTransfer.setData("text/plain", String(i))}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const from = parseInt(e.dataTransfer.getData("text/plain"), 10)
                if (!isNaN(from) && from !== i) moveFile(from, i)
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 text-sm",
                multiple && "cursor-grab active:cursor-grabbing"
              )}
            >
              <FileIcon className="size-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate flex-1">{file.name}</span>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {formatFileSize(file.size)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile(i)
                }}
                className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
              >
                <XIcon className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
