"use client"

import { use } from "react"
import { notFound, redirect } from "next/navigation"
import dynamic from "next/dynamic"
import { TOOLS } from "@/config/toolRegistry"
import { RelatedTools } from "@/components/common/RelatedTools"
import { BlogGuideLink } from "@/components/common/BlogGuideLink"
import { ToolFaq } from "@/components/common/ToolFaq"
import type { PdfToolId } from "@/types/pdf"

// ---------------------------------------------------------------------------
// Dynamic tool component imports keyed by tool ID (all ssr: false)
// ---------------------------------------------------------------------------

const TOOL_COMPONENTS: Record<string, React.ComponentType> = {
  // Dev Tools
  "tree": dynamic(() => import("@/components/tree/TreeCreator").then((m) => ({ default: m.TreeCreator })), { ssr: false }),
  "db-model": dynamic(() => import("@/components/db/DbModelling").then((m) => ({ default: m.DbModelling })), { ssr: false }),
  "regex": dynamic(() => import("@/components/regex/RegexPlayground").then((m) => ({ default: m.RegexPlayground })), { ssr: false }),
  "api": dynamic(() => import("@/components/api/ApiRequestBuilder").then((m) => ({ default: m.ApiRequestBuilder })), { ssr: false }),
  "markdown": dynamic(() => import("@/components/markdown/MarkdownPreview").then((m) => ({ default: m.MarkdownPreview })), { ssr: false }),
  "sql-formatter": dynamic(() => import("@/components/sql/SqlFormatter").then((m) => ({ default: m.SqlFormatter })), { ssr: false }),
  "text-diff": dynamic(() => import("@/components/textdiff/TextDiff").then((m) => ({ default: m.TextDiff })), { ssr: false }),
  "json-to-types": dynamic(() => import("@/components/jsontypes/JsonToTypes").then((m) => ({ default: m.JsonToTypes })), { ssr: false }),
  "cron": dynamic(() => import("@/components/cron/CronBuilder").then((m) => ({ default: m.CronBuilder })), { ssr: false }),
  "http-status": dynamic(() => import("@/components/httpstatus/HttpStatusCodes").then((m) => ({ default: m.HttpStatusCodes })), { ssr: false }),
  "chmod": dynamic(() => import("@/components/chmod/ChmodCalculator").then((m) => ({ default: m.ChmodCalculator })), { ssr: false }),
  "env-editor": dynamic(() => import("@/components/enveditor/EnvEditor").then((m) => ({ default: m.EnvEditor })), { ssr: false }),
  "git-builder": dynamic(() => import("@/components/gitbuilder/GitCommandBuilder").then((m) => ({ default: m.GitCommandBuilder })), { ssr: false }),
  "code-screenshot": dynamic(() => import("@/components/codescreenshot/CodeScreenshot").then((m) => ({ default: m.CodeScreenshot })), { ssr: false }),

  // Converters
  "timestamp": dynamic(() => import("@/components/timestamp/TimestampConverter").then((m) => ({ default: m.TimestampConverter })), { ssr: false }),
  "base64-to-file": dynamic(() => import("@/components/base64file/Base64ToFile").then((m) => ({ default: m.Base64ToFile })), { ssr: false }),
  "yaml-json": dynamic(() => import("@/components/yaml/YamlJsonConverter").then((m) => ({ default: m.YamlJsonConverter })), { ssr: false }),
  "number-base": dynamic(() => import("@/components/baseconverter/NumberBaseConverter").then((m) => ({ default: m.NumberBaseConverter })), { ssr: false }),
  "unit-converter": dynamic(() => import("@/components/unitconverter/UnitConverter").then((m) => ({ default: m.UnitConverter })), { ssr: false }),
  "color-format": dynamic(() => import("@/components/colorformat/ColorFormatConverter").then((m) => ({ default: m.ColorFormatConverter })), { ssr: false }),

  // Generators
  "qr-code": dynamic(() => import("@/components/qr/QrGenerator").then((m) => ({ default: m.QrGenerator })), { ssr: false }),
  "uuid": dynamic(() => import("@/components/uuid/UuidGenerator").then((m) => ({ default: m.UuidGenerator })), { ssr: false }),
  "lorem-ipsum": dynamic(() => import("@/components/lorem/LoremIpsumGenerator").then((m) => ({ default: m.LoremIpsumGenerator })), { ssr: false }),
  "fake-data": dynamic(() => import("@/components/fakedata/FakeDataGenerator").then((m) => ({ default: m.FakeDataGenerator })), { ssr: false }),
  "hash": dynamic(() => import("@/components/hash/HashGenerator").then((m) => ({ default: m.HashGenerator })), { ssr: false }),
  "slug": dynamic(() => import("@/components/slug/SlugGenerator").then((m) => ({ default: m.SlugGenerator })), { ssr: false }),

  // Design
  "colors": dynamic(() => import("@/components/color/ColorPicker").then((m) => ({ default: m.ColorPicker })), { ssr: false }),
  "board": dynamic(() => import("@/components/board/BoardEditor").then((m) => ({ default: m.BoardEditor })), { ssr: false }),
  "shapemaker": dynamic(() => import("@/components/shapemaker/ShapeMaker").then((m) => ({ default: m.ShapeMaker })), { ssr: false }),
  "mockup": dynamic(() => import("@/components/mockup/MockupEditor").then((m) => ({ default: m.MockupEditor })), { ssr: false }),
  "gradient": dynamic(() => import("@/components/gradient/GradientGenerator").then((m) => ({ default: m.GradientGenerator })), { ssr: false }),
  "box-shadow": dynamic(() => import("@/components/boxshadow/BoxShadowGenerator").then((m) => ({ default: m.BoxShadowGenerator })), { ssr: false }),
  "icon-editor": dynamic(() => import("@/components/iconeditor/SvgIconEditor").then((m) => ({ default: m.SvgIconEditor })), { ssr: false }),

  // Network
  "dns-lookup": dynamic(() => import("@/components/dnsip/DnsLookup").then((m) => ({ default: m.DnsLookup })), { ssr: false }),
  "whats-my-ip": dynamic(() => import("@/components/dnsip/WhatsMyIp").then((m) => ({ default: m.WhatsMyIp })), { ssr: false }),
  "ssl-checker": dynamic(() => import("@/components/sslchecker/SslCertificateChecker").then((m) => ({ default: m.SslCertificateChecker })), { ssr: false }),
  "headers-inspector": dynamic(() => import("@/components/headersinspector/HttpHeadersInspector").then((m) => ({ default: m.HttpHeadersInspector })), { ssr: false }),
  "speed-test": dynamic(() => import("@/components/speedtest/SpeedTest").then((m) => ({ default: m.SpeedTest })), { ssr: false }),

  // PDF (jpg-to-pdf and png-to-pdf handled separately due to toolId prop)
  "pdf-merge": dynamic(() => import("@/components/pdf/PdfMerge").then((m) => ({ default: m.PdfMerge })), { ssr: false }),
  "pdf-split": dynamic(() => import("@/components/pdf/PdfSplit").then((m) => ({ default: m.PdfSplit })), { ssr: false }),
  "pdf-reorder": dynamic(() => import("@/components/pdf/PdfReorder").then((m) => ({ default: m.PdfReorder })), { ssr: false }),
  "pdf-compress": dynamic(() => import("@/components/pdf/PdfCompress").then((m) => ({ default: m.PdfCompress })), { ssr: false }),
  "pdf-watermark": dynamic(() => import("@/components/pdf/PdfWatermark").then((m) => ({ default: m.PdfWatermark })), { ssr: false }),
  "docx-to-pdf": dynamic(() => import("@/components/pdf/DocxToPdf").then((m) => ({ default: m.DocxToPdf })), { ssr: false }),
  "pptx-to-pdf": dynamic(() => import("@/components/pdf/PptxToPdf").then((m) => ({ default: m.PptxToPdf })), { ssr: false }),
  "xlsx-to-pdf": dynamic(() => import("@/components/pdf/XlsxToPdf").then((m) => ({ default: m.XlsxToPdf })), { ssr: false }),
  "csv-to-pdf": dynamic(() => import("@/components/pdf/CsvToPdf").then((m) => ({ default: m.CsvToPdf })), { ssr: false }),
  "html-to-pdf": dynamic(() => import("@/components/pdf/HtmlToPdf").then((m) => ({ default: m.HtmlToPdf })), { ssr: false }),
  "markdown-to-pdf": dynamic(() => import("@/components/pdf/MarkdownToPdf").then((m) => ({ default: m.MarkdownToPdf })), { ssr: false }),

  // Security
  "password-generator": dynamic(() => import("@/components/password/PasswordGenerator").then((m) => ({ default: m.PasswordGenerator })), { ssr: false }),
  "encryption": dynamic(() => import("@/components/encryption/EncryptionTool").then((m) => ({ default: m.EncryptionTool })), { ssr: false }),
  "cert-decoder": dynamic(() => import("@/components/certdecoder/CertificateDecoder").then((m) => ({ default: m.CertificateDecoder })), { ssr: false }),
  "totp": dynamic(() => import("@/components/totp/TotpGenerator").then((m) => ({ default: m.TotpGenerator })), { ssr: false }),
  "csp-builder": dynamic(() => import("@/components/cspbuilder/CspHeaderBuilder").then((m) => ({ default: m.CspHeaderBuilder })), { ssr: false }),

  // Data Tools
  "csv-viewer": dynamic(() => import("@/components/csvviewer/CsvViewer").then((m) => ({ default: m.CsvViewer })), { ssr: false }),
  "json-path": dynamic(() => import("@/components/jsonpath/JsonPathFinder").then((m) => ({ default: m.JsonPathFinder })), { ssr: false }),
  "data-transformer": dynamic(() => import("@/components/datatransform/DataTransformer").then((m) => ({ default: m.DataTransformer })), { ssr: false }),
  "sql-playground": dynamic(() => import("@/components/sqlplayground/SqlPlayground").then((m) => ({ default: m.SqlPlayground })), { ssr: false }),
  "chart-builder": dynamic(() => import("@/components/chartbuilder/ChartBuilder").then((m) => ({ default: m.ChartBuilder })), { ssr: false }),

  // Image Tools
  "image-resize": dynamic(() => import("@/components/imageresizer/ImageResizer").then((m) => ({ default: m.ImageResizer })), { ssr: false }),
  "image-crop": dynamic(() => import("@/components/imagecropper/ImageCropper").then((m) => ({ default: m.ImageCropper })), { ssr: false }),
  "image-compress": dynamic(() => import("@/components/imagecompressor/ImageCompressor").then((m) => ({ default: m.ImageCompressor })), { ssr: false }),
  "image-format": dynamic(() => import("@/components/formatconverter/ImageFormatConverter").then((m) => ({ default: m.ImageFormatConverter })), { ssr: false }),
  "color-from-image": dynamic(() => import("@/components/colorpicker/ImageColorPicker").then((m) => ({ default: m.ImageColorPicker })), { ssr: false }),
  "placeholder-image": dynamic(() => import("@/components/placeholder/PlaceholderImage").then((m) => ({ default: m.PlaceholderImage })), { ssr: false }),
  "image-to-base64": dynamic(() => import("@/components/imagebase64/ImageToBase64").then((m) => ({ default: m.ImageToBase64 })), { ssr: false }),
  "favicon": dynamic(() => import("@/components/favicon/FaviconGenerator").then((m) => ({ default: m.FaviconGenerator })), { ssr: false }),

  // Fun
  "wheel-of-fate": dynamic(() => import("@/components/wheel/WheelOfFate").then((m) => ({ default: m.WheelOfFate })), { ssr: false }),
  "coin-flip": dynamic(() => import("@/components/coinflip/CoinFlip").then((m) => ({ default: m.CoinFlip })), { ssr: false }),
  "dice-roller": dynamic(() => import("@/components/diceroller/DiceRoller").then((m) => ({ default: m.DiceRoller })), { ssr: false }),
  "random-number": dynamic(() => import("@/components/randomnumber/RandomNumberGenerator").then((m) => ({ default: m.RandomNumberGenerator })), { ssr: false }),
  "team-shuffler": dynamic(() => import("@/components/teamshuffler/TeamShuffler").then((m) => ({ default: m.TeamShuffler })), { ssr: false }),
  "bracket": dynamic(() => import("@/components/bracket/BracketGenerator").then((m) => ({ default: m.BracketGenerator })), { ssr: false }),
  "random-picker": dynamic(() => import("@/components/randompicker/RandomPicker").then((m) => ({ default: m.RandomPicker })), { ssr: false }),
  "magic-8-ball": dynamic(() => import("@/components/magic8ball/Magic8Ball").then((m) => ({ default: m.Magic8Ball })), { ssr: false }),
  "rock-paper-scissors": dynamic(() => import("@/components/rps/RockPaperScissors").then((m) => ({ default: m.RockPaperScissors })), { ssr: false }),
  "would-you-rather": dynamic(() => import("@/components/wouldyourather/WouldYouRather").then((m) => ({ default: m.WouldYouRather })), { ssr: false }),
  "decision-maker": dynamic(() => import("@/components/decisionmaker/DecisionMaker").then((m) => ({ default: m.DecisionMaker })), { ssr: false }),
}

// Tools with sub-routes: redirect base path to default sub-route
const SUB_ROUTE_DEFAULTS: Record<string, string> = {
  "json": "editor",
  "jwt": "decode",
  "encoder": "base64",
  "timeline": "priority",
}

export function ToolPageClient({
  params,
}: {
  params: Promise<{ category: string; tool: string }>
}) {
  const { category, tool: toolSlug } = use(params)
  const path = `/${category}/${toolSlug}`

  // Check for sub-route redirects
  const defaultSub = SUB_ROUTE_DEFAULTS[toolSlug]
  if (defaultSub) {
    redirect(`${path}/${defaultSub}`)
  }

  // Verify tool exists in registry
  const toolEntry = TOOLS.find((t) => t.path === path)
  if (!toolEntry) notFound()

  // Special handling for ImageToPdf variants that need toolId prop
  if (toolEntry.id === "jpg-to-pdf" || toolEntry.id === "png-to-pdf") {
    const ImageToPdf = dynamic(
      () => import("@/components/pdf/ImageToPdf").then((m) => ({ default: m.ImageToPdf })),
      { ssr: false },
    )
    return (
      <>
        <ImageToPdf toolId={toolEntry.id as PdfToolId} />
        <BlogGuideLink toolId={toolEntry.id} />
        <ToolFaq toolId={toolEntry.id} />
        <RelatedTools />
      </>
    )
  }

  // Look up component by tool ID
  const Component = TOOL_COMPONENTS[toolEntry.id]
  if (!Component) notFound()

  return (
    <>
      <Component />
      <BlogGuideLink toolId={toolEntry.id} />
      <ToolFaq toolId={toolEntry.id} />
      <RelatedTools />
    </>
  )
}
