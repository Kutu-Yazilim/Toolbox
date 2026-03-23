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
import { TimelineLayout } from "@/layouts/TimelineLayout"

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
const NumberBaseConverter = React.lazy(() =>
  import("@/components/baseconverter/NumberBaseConverter").then((m) => ({
    default: m.NumberBaseConverter,
  })),
)
const UnitConverter = React.lazy(() =>
  import("@/components/unitconverter/UnitConverter").then((m) => ({
    default: m.UnitConverter,
  })),
)
const ColorFormatConverter = React.lazy(() =>
  import("@/components/colorformat/ColorFormatConverter").then((m) => ({
    default: m.ColorFormatConverter,
  })),
)

// Dev Tools
const SqlFormatter = React.lazy(() =>
  import("@/components/sql/SqlFormatter").then((m) => ({
    default: m.SqlFormatter,
  })),
)
const CronBuilder = React.lazy(() =>
  import("@/components/cron/CronBuilder").then((m) => ({
    default: m.CronBuilder,
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
const HttpStatusCodes = React.lazy(() =>
  import("@/components/httpstatus/HttpStatusCodes").then((m) => ({
    default: m.HttpStatusCodes,
  })),
)
const ChmodCalculator = React.lazy(() =>
  import("@/components/chmod/ChmodCalculator").then((m) => ({
    default: m.ChmodCalculator,
  })),
)
const EnvEditor = React.lazy(() =>
  import("@/components/enveditor/EnvEditor").then((m) => ({
    default: m.EnvEditor,
  })),
)
const GitCommandBuilder = React.lazy(() =>
  import("@/components/gitbuilder/GitCommandBuilder").then((m) => ({
    default: m.GitCommandBuilder,
  })),
)
const CodeScreenshot = React.lazy(() =>
  import("@/components/codescreenshot/CodeScreenshot").then((m) => ({
    default: m.CodeScreenshot,
  })),
)

// Generators
const QrGenerator = React.lazy(() =>
  import("@/components/qr/QrGenerator").then((m) => ({
    default: m.QrGenerator,
  })),
)
const UuidGenerator = React.lazy(() =>
  import("@/components/uuid/UuidGenerator").then((m) => ({
    default: m.UuidGenerator,
  })),
)
const LoremIpsumGenerator = React.lazy(() =>
  import("@/components/lorem/LoremIpsumGenerator").then((m) => ({
    default: m.LoremIpsumGenerator,
  })),
)

// Slug
const SlugGenerator = React.lazy(() =>
  import("@/components/slug/SlugGenerator").then((m) => ({
    default: m.SlugGenerator,
  })),
)

// Fake Data
const FakeDataGenerator = React.lazy(() =>
  import("@/components/fakedata/FakeDataGenerator").then((m) => ({
    default: m.FakeDataGenerator,
  })),
)

// Hash
const HashGenerator = React.lazy(() =>
  import("@/components/hash/HashGenerator").then((m) => ({
    default: m.HashGenerator,
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

// Gradient
const GradientGenerator = React.lazy(() =>
  import("@/components/gradient/GradientGenerator").then((m) => ({
    default: m.GradientGenerator,
  })),
)

// Box Shadow
const BoxShadowGenerator = React.lazy(() =>
  import("@/components/boxshadow/BoxShadowGenerator").then((m) => ({
    default: m.BoxShadowGenerator,
  })),
)

// Icon Editor
const SvgIconEditor = React.lazy(() =>
  import("@/components/iconeditor/SvgIconEditor").then((m) => ({
    default: m.SvgIconEditor,
  })),
)

// Timeline
const PriorityTimeline = React.lazy(() =>
  import("@/components/timeline/PriorityTimeline").then((m) => ({
    default: m.PriorityTimeline,
  })),
)
const DateTimeline = React.lazy(() =>
  import("@/components/timeline/DateTimeline").then((m) => ({
    default: m.DateTimeline,
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
const SslCertificateChecker = React.lazy(() =>
  import("@/components/sslchecker/SslCertificateChecker").then((m) => ({
    default: m.SslCertificateChecker,
  })),
)
const HttpHeadersInspector = React.lazy(() =>
  import("@/components/headersinspector/HttpHeadersInspector").then((m) => ({
    default: m.HttpHeadersInspector,
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

// Security
const PasswordGenerator = React.lazy(() =>
  import("@/components/password/PasswordGenerator").then((m) => ({
    default: m.PasswordGenerator,
  })),
)
const EncryptionTool = React.lazy(() =>
  import("@/components/encryption/EncryptionTool").then((m) => ({
    default: m.EncryptionTool,
  })),
)
const CertificateDecoder = React.lazy(() =>
  import("@/components/certdecoder/CertificateDecoder").then((m) => ({
    default: m.CertificateDecoder,
  })),
)
const TotpGenerator = React.lazy(() =>
  import("@/components/totp/TotpGenerator").then((m) => ({
    default: m.TotpGenerator,
  })),
)
const CspHeaderBuilder = React.lazy(() =>
  import("@/components/cspbuilder/CspHeaderBuilder").then((m) => ({
    default: m.CspHeaderBuilder,
  })),
)

// Data Tools
const CsvViewer = React.lazy(() =>
  import("@/components/csvviewer/CsvViewer").then((m) => ({
    default: m.CsvViewer,
  })),
)
const JsonPathFinder = React.lazy(() =>
  import("@/components/jsonpath/JsonPathFinder").then((m) => ({
    default: m.JsonPathFinder,
  })),
)
const DataTransformer = React.lazy(() =>
  import("@/components/datatransform/DataTransformer").then((m) => ({
    default: m.DataTransformer,
  })),
)
const SqlPlayground = React.lazy(() =>
  import("@/components/sqlplayground/SqlPlayground").then((m) => ({
    default: m.SqlPlayground,
  })),
)
const ChartBuilder = React.lazy(() =>
  import("@/components/chartbuilder/ChartBuilder").then((m) => ({
    default: m.ChartBuilder,
  })),
)

// Image Tools
const ImageResizer = React.lazy(() =>
  import("@/components/imageresizer/ImageResizer").then((m) => ({
    default: m.ImageResizer,
  })),
)
const ImageCropper = React.lazy(() =>
  import("@/components/imagecropper/ImageCropper").then((m) => ({
    default: m.ImageCropper,
  })),
)
const ImageCompressor = React.lazy(() =>
  import("@/components/imagecompressor/ImageCompressor").then((m) => ({
    default: m.ImageCompressor,
  })),
)
const ImageFormatConverter = React.lazy(() =>
  import("@/components/formatconverter/ImageFormatConverter").then((m) => ({
    default: m.ImageFormatConverter,
  })),
)
const ImageColorPicker = React.lazy(() =>
  import("@/components/colorpicker/ImageColorPicker").then((m) => ({
    default: m.ImageColorPicker,
  })),
)
const PlaceholderImage = React.lazy(() =>
  import("@/components/placeholder/PlaceholderImage").then((m) => ({
    default: m.PlaceholderImage,
  })),
)
const ImageToBase64 = React.lazy(() =>
  import("@/components/imagebase64/ImageToBase64").then((m) => ({
    default: m.ImageToBase64,
  })),
)
const FaviconGenerator = React.lazy(() =>
  import("@/components/favicon/FaviconGenerator").then((m) => ({
    default: m.FaviconGenerator,
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
const DiceRoller = React.lazy(() =>
  import("@/components/diceroller/DiceRoller").then((m) => ({
    default: m.DiceRoller,
  })),
)
const RandomNumberGenerator = React.lazy(() =>
  import("@/components/randomnumber/RandomNumberGenerator").then((m) => ({
    default: m.RandomNumberGenerator,
  })),
)
const TeamShuffler = React.lazy(() =>
  import("@/components/teamshuffler/TeamShuffler").then((m) => ({
    default: m.TeamShuffler,
  })),
)
const BracketGenerator = React.lazy(() =>
  import("@/components/bracket/BracketGenerator").then((m) => ({
    default: m.BracketGenerator,
  })),
)
const RandomPicker = React.lazy(() =>
  import("@/components/randompicker/RandomPicker").then((m) => ({
    default: m.RandomPicker,
  })),
)
const Magic8Ball = React.lazy(() =>
  import("@/components/magic8ball/Magic8Ball").then((m) => ({
    default: m.Magic8Ball,
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
          { path: "cron", element: lazy_(CronBuilder) },
          { path: "http-status", element: lazy_(HttpStatusCodes) },
          { path: "chmod", element: lazy_(ChmodCalculator) },
          { path: "env-editor", element: lazy_(EnvEditor) },
          { path: "git-builder", element: lazy_(GitCommandBuilder) },
          { path: "code-screenshot", element: lazy_(CodeScreenshot) },
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
          { path: "number-base", element: lazy_(NumberBaseConverter) },
          { path: "unit-converter", element: lazy_(UnitConverter) },
          { path: "color-format", element: lazy_(ColorFormatConverter) },
        ],
      },
      {
        path: "generators",
        element: <CategoryLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          { index: true, element: <CategoryLandingPage /> },
          { path: "qr-code", element: lazy_(QrGenerator) },
          { path: "uuid", element: lazy_(UuidGenerator) },
          { path: "lorem-ipsum", element: lazy_(LoremIpsumGenerator) },
          { path: "fake-data", element: lazy_(FakeDataGenerator) },
          { path: "hash", element: lazy_(HashGenerator) },
          { path: "slug", element: lazy_(SlugGenerator) },
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
          { path: "gradient", element: lazy_(GradientGenerator) },
          { path: "box-shadow", element: lazy_(BoxShadowGenerator) },
          { path: "icon-editor", element: lazy_(SvgIconEditor) },
          {
            path: "timeline",
            element: <TimelineLayout />,
            children: [
              { index: true, element: <Navigate to="priority" replace /> },
              { path: "priority", element: lazy_(PriorityTimeline) },
              { path: "date", element: lazy_(DateTimeline) },
            ],
          },
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
          { path: "ssl-checker", element: lazy_(SslCertificateChecker) },
          { path: "headers-inspector", element: lazy_(HttpHeadersInspector) },
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
        path: "security",
        element: <CategoryLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          { index: true, element: <CategoryLandingPage /> },
          { path: "password-generator", element: lazy_(PasswordGenerator) },
          { path: "encryption", element: lazy_(EncryptionTool) },
          { path: "cert-decoder", element: lazy_(CertificateDecoder) },
          { path: "totp", element: lazy_(TotpGenerator) },
          { path: "csp-builder", element: lazy_(CspHeaderBuilder) },
        ],
      },
      {
        path: "data-tools",
        element: <CategoryLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          { index: true, element: <CategoryLandingPage /> },
          { path: "csv-viewer", element: lazy_(CsvViewer) },
          { path: "json-path", element: lazy_(JsonPathFinder) },
          { path: "data-transformer", element: lazy_(DataTransformer) },
          { path: "sql-playground", element: lazy_(SqlPlayground) },
          { path: "chart-builder", element: lazy_(ChartBuilder) },
        ],
      },
      {
        path: "image-tools",
        element: <CategoryLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          { index: true, element: <CategoryLandingPage /> },
          { path: "resize", element: lazy_(ImageResizer) },
          { path: "crop", element: lazy_(ImageCropper) },
          { path: "compress", element: lazy_(ImageCompressor) },
          { path: "format", element: lazy_(ImageFormatConverter) },
          { path: "color-picker", element: lazy_(ImageColorPicker) },
          { path: "placeholder", element: lazy_(PlaceholderImage) },
          { path: "to-base64", element: lazy_(ImageToBase64) },
          { path: "favicon", element: lazy_(FaviconGenerator) },
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
          { path: "dice-roller", element: lazy_(DiceRoller) },
          { path: "random-number", element: lazy_(RandomNumberGenerator) },
          { path: "team-shuffler", element: lazy_(TeamShuffler) },
          { path: "bracket", element: lazy_(BracketGenerator) },
          { path: "random-picker", element: lazy_(RandomPicker) },
          { path: "magic-8-ball", element: lazy_(Magic8Ball) },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
])
