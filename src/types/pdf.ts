import type { LucideIcon } from "lucide-react"

export type PdfToolId =
  | "csv-to-pdf"
  | "xlsx-to-pdf"
  | "docx-to-pdf"
  | "pptx-to-pdf"
  | "html-to-pdf"
  | "jpg-to-pdf"
  | "png-to-pdf"
  | "markdown-to-pdf"
  | "pdf-merge"
  | "pdf-split"
  | "pdf-reorder"
  | "pdf-compress"
  | "pdf-watermark"

export type PdfToolCategory = "convert" | "manage"

export interface PdfToolDefinition {
  id: PdfToolId
  label: string
  description: string
  icon: LucideIcon
  category: PdfToolCategory
  acceptedMimeTypes: string[]
  acceptedExtensions: string[]
  multiFile: boolean
}

export type PdfProcessingStatus =
  | "idle"
  | "loading-wasm"
  | "reading"
  | "processing"
  | "done"
  | "error"

export interface PdfProcessingState {
  status: PdfProcessingStatus
  progress: number
  message: string
  error: string | null
}

export type PageSize = "a4" | "letter" | "legal" | "fit"
export type Orientation = "portrait" | "landscape" | "auto"
export type MarginSize = "none" | "small" | "normal" | "wide"

export interface PageOptions {
  pageSize: PageSize
  orientation: Orientation
  margin: MarginSize
}

export interface CsvOptions extends PageOptions {
  delimiter: "," | ";" | "\t"
  hasHeader: boolean
  fontSize: number
}

export interface PdfImageData {
  dataUrl: string
  width: number
  height: number
  name: string
}

export type CompressionLevel = "screen" | "ebook" | "printer" | "prepress"

export type SplitMode = "range" | "every-n" | "extract"

export interface SplitConfig {
  mode: SplitMode
  ranges: string
  everyN: number
}

export type WatermarkPosition =
  | "center"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "diagonal"
  | "mosaic"

export interface WatermarkConfig {
  type: "text" | "image"
  text: string
  fontSize: number
  color: string
  imageData: Uint8Array | null
  imageFormat: "png" | "jpg"
  scale: number
  opacity: number
  rotation: number
  position: WatermarkPosition
  pages: "all" | "odd" | "even" | string
  layer: "foreground" | "background"
}

export const INITIAL_PROCESSING_STATE: PdfProcessingState = {
  status: "idle",
  progress: 0,
  message: "",
  error: null,
}
