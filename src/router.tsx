import React, { Suspense } from "react"
import {
  createBrowserRouter,
  Navigate,
} from "react-router"

import { RootLayout } from "@/layouts/RootLayout"
import { CategoryLayout } from "@/layouts/CategoryLayout"
import { JsonLayout } from "@/layouts/JsonLayout"
import { JwtLayout } from "@/layouts/JwtLayout"
import { EncoderLayout } from "@/layouts/EncoderLayout"

import { RouteErrorBoundary } from "@/components/common/RouteErrorBoundary"
import { CategoryLandingPage } from "@/components/common/CategoryLandingPage"
import { NotFoundPage } from "@/components/common/NotFoundPage"

import type { PdfToolId } from "@/types/pdf"

// ---------------------------------------------------------------------------
// Lazy-loaded tool components
// ---------------------------------------------------------------------------

const WelcomePage = React.lazy(() =>
  import("@/components/welcome/WelcomePage").then((m) => ({
    default: m.WelcomePage,
  })),
)

// JSON
const JsonEditor = React.lazy(() =>
  import("@/components/json/JsonEditor").then((m) => ({
    default: m.JsonEditor,
  })),
)
const JsonDiff = React.lazy(() =>
  import("@/components/json/JsonDiff").then((m) => ({ default: m.JsonDiff })),
)

// Regex / API / Markdown / DB / Tree
const RegexPlayground = React.lazy(() =>
  import("@/components/regex/RegexPlayground").then((m) => ({
    default: m.RegexPlayground,
  })),
)
const ApiRequestBuilder = React.lazy(() =>
  import("@/components/api/ApiRequestBuilder").then((m) => ({
    default: m.ApiRequestBuilder,
  })),
)
const MarkdownPreview = React.lazy(() =>
  import("@/components/markdown/MarkdownPreview").then((m) => ({
    default: m.MarkdownPreview,
  })),
)
const DbModelling = React.lazy(() =>
  import("@/components/db/DbModelling").then((m) => ({
    default: m.DbModelling,
  })),
)
const TreeCreator = React.lazy(() =>
  import("@/components/tree/TreeCreator").then((m) => ({
    default: m.TreeCreator,
  })),
)

// JWT
const JwtDecode = React.lazy(() =>
  import("@/components/jwt/JwtDecode").then((m) => ({
    default: m.JwtDecode,
  })),
)
const JwtForge = React.lazy(() =>
  import("@/components/jwt/JwtForge").then((m) => ({ default: m.JwtForge })),
)

// Encoder
const Base64Encoder = React.lazy(() =>
  import("@/components/encoder/Base64Encoder").then((m) => ({
    default: m.Base64Encoder,
  })),
)
const UrlEncoder = React.lazy(() =>
  import("@/components/encoder/UrlEncoder").then((m) => ({
    default: m.UrlEncoder,
  })),
)

// Converters
const TimestampConverter = React.lazy(() =>
  import("@/components/timestamp/TimestampConverter").then((m) => ({
    default: m.TimestampConverter,
  })),
)
const Base64ToFile = React.lazy(() =>
  import("@/components/base64file/Base64ToFile").then((m) => ({
    default: m.Base64ToFile,
  })),
)
const YamlJsonConverter = React.lazy(() =>
  import("@/components/yaml/YamlJsonConverter").then((m) => ({
    default: m.YamlJsonConverter,
  })),
)

// Dev Tools
const SqlFormatter = React.lazy(() =>
  import("@/components/sql/SqlFormatter").then((m) => ({
    default: m.SqlFormatter,
  })),
)
const TextDiff = React.lazy(() =>
  import("@/components/textdiff/TextDiff").then((m) => ({
    default: m.TextDiff,
  })),
)
const JsonToTypes = React.lazy(() =>
  import("@/components/jsontypes/JsonToTypes").then((m) => ({
    default: m.JsonToTypes,
  })),
)

// Generators
const QrGenerator = React.lazy(() =>
  import("@/components/qr/QrGenerator").then((m) => ({
    default: m.QrGenerator,
  })),
)

// Design
const ColorPicker = React.lazy(() =>
  import("@/components/color/ColorPicker").then((m) => ({
    default: m.ColorPicker,
  })),
)
const BoardEditor = React.lazy(() =>
  import("@/components/board/BoardEditor").then((m) => ({
    default: m.BoardEditor,
  })),
)
const ShapeMaker = React.lazy(() =>
  import("@/components/shapemaker/ShapeMaker").then((m) => ({
    default: m.ShapeMaker,
  })),
)
const MockupEditor = React.lazy(() =>
  import("@/components/mockup/MockupEditor").then((m) => ({
    default: m.MockupEditor,
  })),
)

// Network
const DnsLookup = React.lazy(() =>
  import("@/components/dnsip/DnsLookup").then((m) => ({
    default: m.DnsLookup,
  })),
)
const WhatsMyIp = React.lazy(() =>
  import("@/components/dnsip/WhatsMyIp").then((m) => ({
    default: m.WhatsMyIp,
  })),
)

// PDF
const ImageToPdf = React.lazy(() =>
  import("@/components/pdf/ImageToPdf").then((m) => ({
    default: m.ImageToPdf,
  })),
)
const PdfMerge = React.lazy(() =>
  import("@/components/pdf/PdfMerge").then((m) => ({
    default: m.PdfMerge,
  })),
)
const PdfSplit = React.lazy(() =>
  import("@/components/pdf/PdfSplit").then((m) => ({ default: m.PdfSplit })),
)
const PdfReorder = React.lazy(() =>
  import("@/components/pdf/PdfReorder").then((m) => ({
    default: m.PdfReorder,
  })),
)
const PdfCompress = React.lazy(() =>
  import("@/components/pdf/PdfCompress").then((m) => ({
    default: m.PdfCompress,
  })),
)
const PdfWatermark = React.lazy(() =>
  import("@/components/pdf/PdfWatermark").then((m) => ({
    default: m.PdfWatermark,
  })),
)
const DocxToPdf = React.lazy(() =>
  import("@/components/pdf/DocxToPdf").then((m) => ({
    default: m.DocxToPdf,
  })),
)
const PptxToPdf = React.lazy(() =>
  import("@/components/pdf/PptxToPdf").then((m) => ({
    default: m.PptxToPdf,
  })),
)
const XlsxToPdf = React.lazy(() =>
  import("@/components/pdf/XlsxToPdf").then((m) => ({
    default: m.XlsxToPdf,
  })),
)
const CsvToPdf = React.lazy(() =>
  import("@/components/pdf/CsvToPdf").then((m) => ({ default: m.CsvToPdf })),
)
const HtmlToPdf = React.lazy(() =>
  import("@/components/pdf/HtmlToPdf").then((m) => ({
    default: m.HtmlToPdf,
  })),
)
const MarkdownToPdf = React.lazy(() =>
  import("@/components/pdf/MarkdownToPdf").then((m) => ({
    default: m.MarkdownToPdf,
  })),
)

// Fun
const WheelOfFate = React.lazy(() =>
  import("@/components/wheel/WheelOfFate").then((m) => ({
    default: m.WheelOfFate,
  })),
)
const CoinFlip = React.lazy(() =>
  import("@/components/coinflip/CoinFlip").then((m) => ({
    default: m.CoinFlip,
  })),
)

// ---------------------------------------------------------------------------
// Wrapper helpers
// ---------------------------------------------------------------------------

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>
}

function lazy_(C: React.LazyExoticComponent<React.ComponentType>) {
  return (
    <Lazy>
      <C />
    </Lazy>
  )
}

/** Wrapper for ImageToPdf so we can pass toolId through the route element */
function JpgToPdfRoute() {
  return (
    <Lazy>
      <ImageToPdf toolId={"jpg-to-pdf" as PdfToolId} />
    </Lazy>
  )
}

function PngToPdfRoute() {
  return (
    <Lazy>
      <ImageToPdf toolId={"png-to-pdf" as PdfToolId} />
    </Lazy>
  )
}

// ---------------------------------------------------------------------------
// Router definition
// ---------------------------------------------------------------------------

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: lazy_(WelcomePage),
      },
      {
        path: "dev-tools",
        element: <CategoryLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          { index: true, element: <CategoryLandingPage /> },
          {
            path: "json",
            element: <JsonLayout />,
            children: [
              { index: true, element: <Navigate to="editor" replace /> },
              { path: "editor", element: lazy_(JsonEditor) },
              { path: "diff", element: lazy_(JsonDiff) },
            ],
          },
          { path: "regex", element: lazy_(RegexPlayground) },
          { path: "api", element: lazy_(ApiRequestBuilder) },
          {
            path: "jwt",
            element: <JwtLayout />,
            children: [
              { index: true, element: <Navigate to="decode" replace /> },
              { path: "decode", element: lazy_(JwtDecode) },
              { path: "forge", element: lazy_(JwtForge) },
            ],
          },
          { path: "markdown", element: lazy_(MarkdownPreview) },
          { path: "db-model", element: lazy_(DbModelling) },
          { path: "tree", element: lazy_(TreeCreator) },
          { path: "sql-formatter", element: lazy_(SqlFormatter) },
          { path: "text-diff", element: lazy_(TextDiff) },
          { path: "json-to-types", element: lazy_(JsonToTypes) },
        ],
      },
      {
        path: "converters",
        element: <CategoryLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          { index: true, element: <CategoryLandingPage /> },
          {
            path: "encoder",
            element: <EncoderLayout />,
            children: [
              { index: true, element: <Navigate to="base64" replace /> },
              { path: "base64", element: lazy_(Base64Encoder) },
              { path: "url", element: lazy_(UrlEncoder) },
            ],
          },
          { path: "timestamp", element: lazy_(TimestampConverter) },
          { path: "base64-to-file", element: lazy_(Base64ToFile) },
          { path: "yaml-json", element: lazy_(YamlJsonConverter) },
        ],
      },
      {
        path: "generators",
        element: <CategoryLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          { index: true, element: <CategoryLandingPage /> },
          { path: "qr-code", element: lazy_(QrGenerator) },
        ],
      },
      {
        path: "design",
        element: <CategoryLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          { index: true, element: <CategoryLandingPage /> },
          { path: "colors", element: lazy_(ColorPicker) },
          { path: "board", element: lazy_(BoardEditor) },
          { path: "shapemaker", element: lazy_(ShapeMaker) },
          { path: "mockup", element: lazy_(MockupEditor) },
        ],
      },
      {
        path: "network",
        element: <CategoryLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          { index: true, element: <CategoryLandingPage /> },
          { path: "dns-lookup", element: lazy_(DnsLookup) },
          { path: "whats-my-ip", element: lazy_(WhatsMyIp) },
        ],
      },
      {
        path: "pdf",
        element: <CategoryLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          { index: true, element: <CategoryLandingPage /> },
          { path: "jpg-to-pdf", element: <JpgToPdfRoute /> },
          { path: "png-to-pdf", element: <PngToPdfRoute /> },
          { path: "merge", element: lazy_(PdfMerge) },
          { path: "split", element: lazy_(PdfSplit) },
          { path: "reorder", element: lazy_(PdfReorder) },
          { path: "compress", element: lazy_(PdfCompress) },
          { path: "watermark", element: lazy_(PdfWatermark) },
          { path: "docx-to-pdf", element: lazy_(DocxToPdf) },
          { path: "pptx-to-pdf", element: lazy_(PptxToPdf) },
          { path: "xlsx-to-pdf", element: lazy_(XlsxToPdf) },
          { path: "csv-to-pdf", element: lazy_(CsvToPdf) },
          { path: "html-to-pdf", element: lazy_(HtmlToPdf) },
          { path: "markdown-to-pdf", element: lazy_(MarkdownToPdf) },
        ],
      },
      {
        path: "fun",
        element: <CategoryLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          { index: true, element: <CategoryLandingPage /> },
          { path: "wheel-of-fate", element: lazy_(WheelOfFate) },
          { path: "coin-flip", element: lazy_(CoinFlip) },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
])
