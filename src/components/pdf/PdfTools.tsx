import { useState, lazy, Suspense } from "react"
import type { PdfToolId } from "@/types/pdf"
import { PdfToolsHub } from "@/components/pdf/PdfToolsHub"
import { PdfToolLayout } from "@/components/pdf/PdfToolLayout"
import { getToolDefinition } from "@/components/pdf/pdfToolCatalog"
import { LoaderIcon } from "lucide-react"

const ImageToPdf = lazy(() =>
  import("@/components/pdf/ImageToPdf").then((m) => ({ default: m.ImageToPdf }))
)
const PdfMerge = lazy(() =>
  import("@/components/pdf/PdfMerge").then((m) => ({ default: m.PdfMerge }))
)
const PdfSplit = lazy(() =>
  import("@/components/pdf/PdfSplit").then((m) => ({ default: m.PdfSplit }))
)
const PdfReorder = lazy(() =>
  import("@/components/pdf/PdfReorder").then((m) => ({ default: m.PdfReorder }))
)
const PdfCompress = lazy(() =>
  import("@/components/pdf/PdfCompress").then((m) => ({ default: m.PdfCompress }))
)
const PdfWatermark = lazy(() =>
  import("@/components/pdf/PdfWatermark").then((m) => ({ default: m.PdfWatermark }))
)
const DocxToPdf = lazy(() =>
  import("@/components/pdf/DocxToPdf").then((m) => ({ default: m.DocxToPdf }))
)
const PptxToPdf = lazy(() =>
  import("@/components/pdf/PptxToPdf").then((m) => ({ default: m.PptxToPdf }))
)
const XlsxToPdf = lazy(() =>
  import("@/components/pdf/XlsxToPdf").then((m) => ({ default: m.XlsxToPdf }))
)
const CsvToPdf = lazy(() =>
  import("@/components/pdf/CsvToPdf").then((m) => ({ default: m.CsvToPdf }))
)
const HtmlToPdf = lazy(() =>
  import("@/components/pdf/HtmlToPdf").then((m) => ({ default: m.HtmlToPdf }))
)
const MarkdownToPdf = lazy(() =>
  import("@/components/pdf/MarkdownToPdf").then((m) => ({
    default: m.MarkdownToPdf,
  }))
)

function ToolFallback() {
  return (
    <div className="flex items-center justify-center h-40">
      <LoaderIcon className="size-5 animate-spin text-muted-foreground" />
    </div>
  )
}

function renderTool(toolId: PdfToolId) {
  switch (toolId) {
    case "jpg-to-pdf":
    case "png-to-pdf":
      return <ImageToPdf toolId={toolId} />
    case "pdf-merge":
      return <PdfMerge />
    case "pdf-split":
      return <PdfSplit />
    case "pdf-reorder":
      return <PdfReorder />
    case "pdf-compress":
      return <PdfCompress />
    case "pdf-watermark":
      return <PdfWatermark />
    case "docx-to-pdf":
      return <DocxToPdf />
    case "pptx-to-pdf":
      return <PptxToPdf />
    case "xlsx-to-pdf":
      return <XlsxToPdf />
    case "csv-to-pdf":
      return <CsvToPdf />
    case "html-to-pdf":
      return <HtmlToPdf />
    case "markdown-to-pdf":
      return <MarkdownToPdf />
    default:
      return <p className="text-sm text-muted-foreground">Tool not implemented yet.</p>
  }
}

export function PdfTools() {
  const [activeTool, setActiveTool] = useState<PdfToolId | null>(null)

  if (!activeTool) {
    return <PdfToolsHub onSelectTool={setActiveTool} />
  }

  const toolDef = getToolDefinition(activeTool)

  return (
    <PdfToolLayout
      title={toolDef?.label ?? "PDF Tool"}
      description={toolDef?.description}
      onBack={() => setActiveTool(null)}
    >
      <Suspense fallback={<ToolFallback />}>{renderTool(activeTool)}</Suspense>
    </PdfToolLayout>
  )
}
