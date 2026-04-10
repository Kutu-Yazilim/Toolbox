"use client"

import { useState, useCallback, useRef, type DragEvent } from "react"

interface UseFileImportOptions {
    accept: string[]
    maxSize?: number
    onImport: (content: string, filename: string) => void
    readAs?: "text" | "dataURL" | "arrayBuffer"
}

interface UseFileImportResult {
    dropzoneProps: {
        onDragOver: (e: DragEvent) => void
        onDragEnter: (e: DragEvent) => void
        onDragLeave: (e: DragEvent) => void
        onDrop: (e: DragEvent) => void
    }
    openFilePicker: () => void
    isDragging: boolean
}

export function useFileImport({
    accept,
    maxSize = 5 * 1024 * 1024,
    onImport,
    readAs = "text",
}: UseFileImportOptions): UseFileImportResult {
    const [isDragging, setIsDragging] = useState(false)
    const inputRef = useRef<HTMLInputElement | null>(null)
    const dragCounterRef = useRef(0)

    const isValidFile = useCallback((file: File): boolean => {
        if (file.size > maxSize) return false
        if (accept.length === 0) return true
        const ext = `.${file.name.split(".").pop()?.toLowerCase()}`
        return accept.some(a => a.toLowerCase() === ext || file.type.includes(a.replace(".", "")))
    }, [accept, maxSize])

    const readFile = useCallback((file: File) => {
        const reader = new FileReader()
        reader.onload = () => {
            const result = reader.result
            if (typeof result === "string") {
                onImport(result, file.name)
            } else if (result instanceof ArrayBuffer) {
                const bytes = new Uint8Array(result)
                let binary = ""
                bytes.forEach(b => binary += String.fromCharCode(b))
                onImport(btoa(binary), file.name)
            }
        }
        if (readAs === "text") reader.readAsText(file)
        else if (readAs === "dataURL") reader.readAsDataURL(file)
        else reader.readAsArrayBuffer(file)
    }, [onImport, readAs])

    const handleDragOver = useCallback((e: DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }, [])

    const handleDragEnter = useCallback((e: DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        dragCounterRef.current++
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        dragCounterRef.current--
        if (dragCounterRef.current === 0) setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e: DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
        dragCounterRef.current = 0

        const files = Array.from(e.dataTransfer.files)
        const validFile = files.find(f => isValidFile(f))
        if (validFile) readFile(validFile)
    }, [isValidFile, readFile])

    const openFilePicker = useCallback(() => {
        if (!inputRef.current) {
            const input = document.createElement("input")
            input.type = "file"
            input.accept = accept.join(",")
            input.style.display = "none"
            input.onchange = () => {
                const file = input.files?.[0]
                if (file && isValidFile(file)) readFile(file)
                input.remove()
                inputRef.current = null
            }
            document.body.appendChild(input)
            inputRef.current = input
        }
        inputRef.current.click()
    }, [accept, isValidFile, readFile])

    return {
        dropzoneProps: {
            onDragOver: handleDragOver,
            onDragEnter: handleDragEnter,
            onDragLeave: handleDragLeave,
            onDrop: handleDrop,
        },
        openFilePicker,
        isDragging,
    }
}
