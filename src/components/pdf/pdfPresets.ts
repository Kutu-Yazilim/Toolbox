import type { Preset } from "@/components/shared/PresetsDrawer"

export const IMAGE_TO_PDF_PRESETS: Preset[] = [
  {
    name: "A4 Portrait",
    category: "Page Layout",
    description: "Standard A4 page in portrait orientation",
    content: JSON.stringify({ pageSize: "a4", orientation: "portrait", margin: "normal" }),
  },
  {
    name: "A4 Landscape",
    category: "Page Layout",
    description: "Standard A4 page in landscape orientation",
    content: JSON.stringify({ pageSize: "a4", orientation: "landscape", margin: "normal" }),
  },
  {
    name: "Letter Landscape",
    category: "Page Layout",
    description: "US Letter page in landscape orientation",
    content: JSON.stringify({ pageSize: "letter", orientation: "landscape", margin: "normal" }),
  },
  {
    name: "Fit to Image",
    category: "Page Layout",
    description: "Page sized to fit each image exactly",
    content: JSON.stringify({ pageSize: "fit", orientation: "auto", margin: "none" }),
  },
  {
    name: "Photo Book",
    category: "Page Layout",
    description: "A4 landscape with no margins for full-bleed photos",
    content: JSON.stringify({ pageSize: "a4", orientation: "landscape", margin: "none" }),
  },
]

export const PDF_WATERMARK_PRESETS: Preset[] = [
  {
    name: "Confidential",
    category: "Text Watermarks",
    description: "Red diagonal confidential stamp",
    content: JSON.stringify({ text: "CONFIDENTIAL", fontSize: 48, color: "#ff0000", opacity: 0.3, rotation: -45, position: "diagonal" }),
  },
  {
    name: "Draft",
    category: "Text Watermarks",
    description: "Gray diagonal draft watermark",
    content: JSON.stringify({ text: "DRAFT", fontSize: 60, color: "#888888", opacity: 0.2, rotation: -45, position: "diagonal" }),
  },
  {
    name: "Sample",
    category: "Text Watermarks",
    description: "Blue diagonal sample watermark",
    content: JSON.stringify({ text: "SAMPLE", fontSize: 54, color: "#3b82f6", opacity: 0.25, rotation: -45, position: "diagonal" }),
  },
  {
    name: "Do Not Copy",
    category: "Text Watermarks",
    description: "Red mosaic do-not-copy watermark",
    content: JSON.stringify({ text: "DO NOT COPY", fontSize: 36, color: "#dc2626", opacity: 0.15, rotation: -30, position: "mosaic" }),
  },
  {
    name: "Approved",
    category: "Text Watermarks",
    description: "Green center-aligned approved stamp",
    content: JSON.stringify({ text: "APPROVED", fontSize: 48, color: "#16a34a", opacity: 0.3, rotation: 0, position: "center" }),
  },
]

export const CSV_TO_PDF_PRESETS: Preset[] = [
  {
    name: "Compact Report",
    category: "Formatting",
    description: "A4 portrait with small font, ideal for dense data",
    content: JSON.stringify({ pageSize: "a4", orientation: "portrait", fontSize: 6, hasHeader: "yes", showRowNumbers: "no" }),
  },
  {
    name: "Wide Table",
    category: "Formatting",
    description: "A4 landscape with medium font for wide tables",
    content: JSON.stringify({ pageSize: "a4", orientation: "landscape", fontSize: 8, hasHeader: "yes", showRowNumbers: "no" }),
  },
  {
    name: "Numbered Rows",
    category: "Formatting",
    description: "A4 portrait with row numbers enabled",
    content: JSON.stringify({ pageSize: "a4", orientation: "portrait", fontSize: 10, hasHeader: "yes", showRowNumbers: "yes" }),
  },
  {
    name: "Letter Landscape",
    category: "Formatting",
    description: "US Letter landscape layout",
    content: JSON.stringify({ pageSize: "letter", orientation: "landscape", fontSize: 10, hasHeader: "yes", showRowNumbers: "no" }),
  },
]

export const HTML_TO_PDF_PRESETS: Preset[] = [
  {
    name: "A4 with Margins",
    category: "Page Layout",
    description: "Standard A4 portrait with normal margins",
    content: JSON.stringify({ pageSize: "a4", orientation: "portrait", margin: "normal" }),
  },
  {
    name: "A4 Landscape",
    category: "Page Layout",
    description: "A4 landscape for wide content",
    content: JSON.stringify({ pageSize: "a4", orientation: "landscape", margin: "normal" }),
  },
  {
    name: "Letter No Margins",
    category: "Page Layout",
    description: "US Letter with no margins",
    content: JSON.stringify({ pageSize: "letter", orientation: "portrait", margin: "none" }),
  },
  {
    name: "Compact",
    category: "Page Layout",
    description: "A4 portrait with small margins",
    content: JSON.stringify({ pageSize: "a4", orientation: "portrait", margin: "small" }),
  },
]

export const MARKDOWN_TO_PDF_PRESETS: Preset[] = [
  {
    name: "A4 with Margins",
    category: "Page Layout",
    description: "Standard A4 portrait with normal margins",
    content: JSON.stringify({ pageSize: "a4", orientation: "portrait", margin: "normal" }),
  },
  {
    name: "A4 Landscape",
    category: "Page Layout",
    description: "A4 landscape for wide content",
    content: JSON.stringify({ pageSize: "a4", orientation: "landscape", margin: "normal" }),
  },
  {
    name: "Letter Portrait",
    category: "Page Layout",
    description: "US Letter portrait with normal margins",
    content: JSON.stringify({ pageSize: "letter", orientation: "portrait", margin: "normal" }),
  },
  {
    name: "No Margins",
    category: "Page Layout",
    description: "A4 portrait with no margins",
    content: JSON.stringify({ pageSize: "a4", orientation: "portrait", margin: "none" }),
  },
]

export const PDF_SPLIT_PRESETS: Preset[] = [
  {
    name: "Split Every Page",
    category: "Split Mode",
    description: "Extract each page as a separate PDF",
    content: JSON.stringify({ mode: "every-n", everyN: 1 }),
  },
  {
    name: "Split Every 2 Pages",
    category: "Split Mode",
    description: "Split into 2-page chunks",
    content: JSON.stringify({ mode: "every-n", everyN: 2 }),
  },
  {
    name: "Split Every 5 Pages",
    category: "Split Mode",
    description: "Split into 5-page chunks",
    content: JSON.stringify({ mode: "every-n", everyN: 5 }),
  },
]

export const PDF_COMPRESS_PRESETS: Preset[] = [
  {
    name: "Maximum Compression",
    category: "Quality",
    description: "Smallest file size, lower quality",
    content: JSON.stringify({ level: "screen" }),
  },
  {
    name: "Recommended",
    category: "Quality",
    description: "Good balance of size and quality",
    content: JSON.stringify({ level: "ebook" }),
  },
  {
    name: "High Quality",
    category: "Quality",
    description: "Less compression, better quality",
    content: JSON.stringify({ level: "printer" }),
  },
  {
    name: "Minimal Compression",
    category: "Quality",
    description: "Highest quality, least compression",
    content: JSON.stringify({ level: "prepress" }),
  },
]

export const XLSX_TO_PDF_PRESETS: Preset[] = [
  {
    name: "A4 Landscape",
    category: "Page Layout",
    description: "A4 landscape, good for wide spreadsheets",
    content: JSON.stringify({ pageSize: "a4", orientation: "landscape", fontSize: 10 }),
  },
  {
    name: "A4 Portrait Small",
    category: "Page Layout",
    description: "A4 portrait with small font for dense data",
    content: JSON.stringify({ pageSize: "a4", orientation: "portrait", fontSize: 8 }),
  },
  {
    name: "Letter Landscape",
    category: "Page Layout",
    description: "US Letter landscape layout",
    content: JSON.stringify({ pageSize: "letter", orientation: "landscape", fontSize: 10 }),
  },
  {
    name: "Large Print",
    category: "Page Layout",
    description: "A4 landscape with large font",
    content: JSON.stringify({ pageSize: "a4", orientation: "landscape", fontSize: 12 }),
  },
]
