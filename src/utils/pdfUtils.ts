import type { MarginSize, PageSize } from "@/types/pdf"

export const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
  legal: { width: 612, height: 1008 },
} as const

export const MARGINS: Record<MarginSize, number> = {
  none: 0,
  small: 18,
  normal: 36,
  wide: 72,
} as const

export function getPageDimensions(size: PageSize, landscape: boolean) {
  if (size === "fit") return null
  const dims = PAGE_SIZES[size]
  return landscape
    ? { width: dims.height, height: dims.width }
    : { width: dims.width, height: dims.height }
}

export function downloadPdf(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = bytes / Math.pow(1024, i)
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export function parsePageRanges(input: string, maxPage: number): number[] {
  const pages = new Set<number>()
  const parts = input.split(",").map((s) => s.trim())

  for (const part of parts) {
    if (part.includes("-")) {
      const [startStr, endStr] = part.split("-").map((s) => s.trim())
      const start = Math.max(1, parseInt(startStr, 10))
      const end = Math.min(maxPage, parseInt(endStr, 10))
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          pages.add(i - 1) // convert to 0-indexed
        }
      }
    } else {
      const page = parseInt(part, 10)
      if (!isNaN(page) && page >= 1 && page <= maxPage) {
        pages.add(page - 1)
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b)
}

export class EncryptedPdfError extends Error {
  constructor() {
    super("This PDF is password-protected. Please remove the password before processing.")
    this.name = "EncryptedPdfError"
  }
}

export async function validatePdf(buffer: ArrayBuffer): Promise<void> {
  const bytes = new Uint8Array(buffer.slice(0, 1024))
  const header = new TextDecoder("latin1").decode(bytes)
  if (!header.startsWith("%PDF")) {
    throw new Error("This file does not appear to be a valid PDF.")
  }
  // Check for encryption dictionary markers in the trailer
  const trailer = new TextDecoder("latin1").decode(new Uint8Array(buffer.slice(-2048)))
  if (trailer.includes("/Encrypt")) {
    throw new EncryptedPdfError()
  }
}

export function friendlyPdfError(err: unknown): string {
  if (err instanceof EncryptedPdfError) return err.message
  if (err instanceof Error) {
    const msg = err.message.toLowerCase()
    if (msg.includes("password") || msg.includes("encrypt")) {
      return "This PDF is password-protected. Please remove the password before processing."
    }
    if (msg.includes("invalid pdf") || msg.includes("not a pdf")) {
      return "This file does not appear to be a valid PDF."
    }
    return err.message
  }
  return "An unexpected error occurred while processing the PDF."
}

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? ""
}

export function validateFileType(
  file: File,
  acceptedMimeTypes: string[],
  acceptedExtensions: string[]
): boolean {
  const ext = getFileExtension(file.name)
  if (acceptedExtensions.includes(`.${ext}`)) return true
  if (acceptedMimeTypes.includes(file.type)) return true
  return false
}
