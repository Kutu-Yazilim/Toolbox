import type { LucideIcon } from "lucide-react"
import {
  TreesIcon,
  DatabaseIcon,
  PaletteIcon,
  LayoutDashboardIcon,
  BracesIcon,
  RegexIcon,
  ShuffleIcon,
  ClockIcon,
  GlobeIcon,
  FileTextIcon,
  CircleDotIcon,
  KeyRoundIcon,
  QrCodeIcon,
  CoinsIcon,
  PenToolIcon,
  MonitorSmartphoneIcon,
  FileOutputIcon,
  NetworkIcon,
  FileIcon,
  FileSpreadsheetIcon,
  PresentationIcon,
  CodeIcon,
  ImageIcon,
  ImagePlusIcon,
  TextIcon,
  MergeIcon,
  SplitIcon,
  ArrowUpDownIcon,
  ArchiveIcon,
  DropletIcon,
  GanttChartIcon,
  FingerprintIcon,
  UsersIcon,
  HashIcon,
  LinkIcon,
  BinaryIcon,
  RulerIcon,
  ShieldIcon,
  LockIcon,
  TerminalIcon,
} from "lucide-react"

export type CategoryId =
  | "dev-tools"
  | "converters"
  | "generators"
  | "design"
  | "network"
  | "pdf"
  | "security"
  | "fun"

export type ToolCategory = {
  id: CategoryId
  label: string
  path: string
  icon: LucideIcon
}

export type SubRoute = {
  id: string
  label: string
  isDefault?: boolean
}

export type ToolEntry = {
  id: string
  label: string
  description: string
  icon: LucideIcon
  categoryId: CategoryId
  path: string
  subRoutes?: SubRoute[]
}

export const CATEGORIES: ToolCategory[] = [
  { id: "dev-tools", label: "Dev Tools", path: "/dev-tools", icon: BracesIcon },
  { id: "converters", label: "Converters", path: "/converters", icon: ShuffleIcon },
  { id: "generators", label: "Generators", path: "/generators", icon: QrCodeIcon },
  { id: "design", label: "Design", path: "/design", icon: PaletteIcon },
  { id: "network", label: "Network", path: "/network", icon: NetworkIcon },
  { id: "pdf", label: "PDF", path: "/pdf", icon: FileIcon },
  { id: "security", label: "Security", path: "/security", icon: ShieldIcon },
  { id: "fun", label: "Fun", path: "/fun", icon: CircleDotIcon },
]

export const TOOLS: ToolEntry[] = [
  // Dev Tools
  {
    id: "tree",
    label: "Tree",
    description: "Generate ASCII tree structures from indented text input",
    icon: TreesIcon,
    categoryId: "dev-tools",
    path: "/dev-tools/tree",
  },
  {
    id: "db-model",
    label: "DB Model",
    description: "Design database schemas with visual ER diagrams using DBML",
    icon: DatabaseIcon,
    categoryId: "dev-tools",
    path: "/dev-tools/db-model",
  },
  {
    id: "json",
    label: "JSON",
    description: "Format, validate, and edit JSON with syntax highlighting",
    icon: BracesIcon,
    categoryId: "dev-tools",
    path: "/dev-tools/json",
    subRoutes: [
      { id: "editor", label: "Editor", isDefault: true },
      { id: "diff", label: "Diff" },
    ],
  },
  {
    id: "regex",
    label: "Regex",
    description: "Test and debug regular expressions with live matching",
    icon: RegexIcon,
    categoryId: "dev-tools",
    path: "/dev-tools/regex",
  },
  {
    id: "api",
    label: "API",
    description: "Build and test REST API requests with response preview",
    icon: GlobeIcon,
    categoryId: "dev-tools",
    path: "/dev-tools/api",
  },
  {
    id: "markdown",
    label: "Markdown",
    description: "Write markdown and preview the rendered output live",
    icon: FileTextIcon,
    categoryId: "dev-tools",
    path: "/dev-tools/markdown",
  },
  {
    id: "sql-formatter",
    label: "SQL Formatter",
    description: "Format, prettify, and minify SQL queries with dialect support",
    icon: DatabaseIcon,
    categoryId: "dev-tools",
    path: "/dev-tools/sql-formatter",
  },
  {
    id: "text-diff",
    label: "Text Diff",
    description: "Compare two texts side-by-side or inline with highlighted differences",
    icon: FileTextIcon,
    categoryId: "dev-tools",
    path: "/dev-tools/text-diff",
  },
  {
    id: "json-to-types",
    label: "JSON to Types",
    description: "Generate TypeScript, Dart, C#, Python, and Java types from JSON",
    icon: BracesIcon,
    categoryId: "dev-tools",
    path: "/dev-tools/json-to-types",
  },
  {
    id: "cron",
    label: "Cron Builder",
    description: "Build cron expressions visually with human-readable descriptions and next run times",
    icon: ClockIcon,
    categoryId: "dev-tools",
    path: "/dev-tools/cron",
  },
  {
    id: "http-status",
    label: "HTTP Status",
    description: "Searchable HTTP status codes reference with request/response examples",
    icon: GlobeIcon,
    categoryId: "dev-tools",
    path: "/dev-tools/http-status",
  },
  {
    id: "chmod",
    label: "Chmod Calculator",
    description: "Calculate Unix file permissions with numeric and symbolic notation",
    icon: TerminalIcon,
    categoryId: "dev-tools",
    path: "/dev-tools/chmod",
  },
  // Converters
  {
    id: "encoder",
    label: "Encoder",
    description: "Encode and decode text in Base64, URL, and more",
    icon: ShuffleIcon,
    categoryId: "converters",
    path: "/converters/encoder",
    subRoutes: [
      { id: "base64", label: "Base64", isDefault: true },
      { id: "url", label: "URL" },
    ],
  },
  {
    id: "timestamp",
    label: "Timestamp",
    description: "Convert between Unix timestamps and human-readable dates",
    icon: ClockIcon,
    categoryId: "converters",
    path: "/converters/timestamp",
  },
  {
    id: "base64-to-file",
    label: "Base64 to File",
    description: "Convert base64 strings to files with preview and download support",
    icon: FileOutputIcon,
    categoryId: "converters",
    path: "/converters/base64-to-file",
  },
  {
    id: "yaml-json",
    label: "YAML ↔ JSON",
    description: "Convert between YAML and JSON formats in real-time",
    icon: FileTextIcon,
    categoryId: "converters",
    path: "/converters/yaml-json",
  },
  {
    id: "number-base",
    label: "Number Base",
    description: "Convert between binary, octal, decimal, and hexadecimal with bit visualization",
    icon: BinaryIcon,
    categoryId: "converters",
    path: "/converters/number-base",
  },
  {
    id: "unit-converter",
    label: "Unit Converter",
    description: "Convert between length, weight, temperature, data size, time, and speed units",
    icon: RulerIcon,
    categoryId: "converters",
    path: "/converters/unit-converter",
  },
  {
    id: "color-format",
    label: "Color Format",
    description: "Convert colors between HEX, RGB, HSL, HSB, and CMYK with live preview",
    icon: PaletteIcon,
    categoryId: "converters",
    path: "/converters/color-format",
  },
  // Generators
  {
    id: "qr-code",
    label: "QR Code",
    description: "Generate styled QR codes with custom colors, dot types, and download as PNG",
    icon: QrCodeIcon,
    categoryId: "generators",
    path: "/generators/qr-code",
  },
  {
    id: "uuid",
    label: "UUID",
    description: "Generate UUID v1, v4, and v7 with bulk generation and format options",
    icon: FingerprintIcon,
    categoryId: "generators",
    path: "/generators/uuid",
  },
  {
    id: "lorem-ipsum",
    label: "Lorem Ipsum",
    description: "Generate placeholder text as paragraphs, sentences, or words",
    icon: TextIcon,
    categoryId: "generators",
    path: "/generators/lorem-ipsum",
  },
  {
    id: "jwt",
    label: "JWT",
    description: "Decode existing JWTs or forge new tokens with custom headers and payloads",
    icon: KeyRoundIcon,
    categoryId: "generators",
    path: "/generators/jwt",
    subRoutes: [
      { id: "decode", label: "Decode", isDefault: true },
      { id: "forge", label: "Forge" },
    ],
  },
  {
    id: "fake-data",
    label: "Fake Data",
    description: "Generate fake names, emails, addresses, and custom JSON datasets",
    icon: UsersIcon,
    categoryId: "generators",
    path: "/generators/fake-data",
  },
  {
    id: "hash",
    label: "Hash Generator",
    description: "Generate MD5, SHA-1, SHA-256, and SHA-512 hashes from text or files",
    icon: HashIcon,
    categoryId: "generators",
    path: "/generators/hash",
  },
  {
    id: "slug",
    label: "Slug Generator",
    description: "Convert text to URL-friendly slugs with transliteration support",
    icon: LinkIcon,
    categoryId: "generators",
    path: "/generators/slug",
  },
  // Design
  {
    id: "colors",
    label: "Colors",
    description: "Generate and explore color palettes with harmony analysis",
    icon: PaletteIcon,
    categoryId: "design",
    path: "/design/colors",
  },
  {
    id: "board",
    label: "Board",
    description: "Draw and design on a freeform canvas board",
    icon: LayoutDashboardIcon,
    categoryId: "design",
    path: "/design/board",
  },
  {
    id: "shapemaker",
    label: "Shape Maker",
    description: "Draw custom shapes with a Figma-like editor and export as Flutter/Dart CustomPainter code",
    icon: PenToolIcon,
    categoryId: "design",
    path: "/design/shapemaker",
  },
  {
    id: "mockup",
    label: "Mockup",
    description: "Place screenshots into device frames and export polished mockups as PNG",
    icon: MonitorSmartphoneIcon,
    categoryId: "design",
    path: "/design/mockup",
  },
  {
    id: "timeline",
    label: "Timeline",
    description: "Create project timelines with priority-based or date-based visualization",
    icon: GanttChartIcon,
    categoryId: "design",
    path: "/design/timeline",
    subRoutes: [
      { id: "priority", label: "Priority & Workload", isDefault: true },
      { id: "date", label: "Date-Based" },
    ],
  },
  // Network
  {
    id: "dns-lookup",
    label: "DNS Lookup",
    description: "DNS lookup across multiple providers",
    icon: NetworkIcon,
    categoryId: "network",
    path: "/network/dns-lookup",
  },
  {
    id: "whats-my-ip",
    label: "What's My IP",
    description: "View your IP address and geolocation info",
    icon: NetworkIcon,
    categoryId: "network",
    path: "/network/whats-my-ip",
  },
  // Security
  {
    id: "password-generator",
    label: "Password Generator",
    description: "Generate secure passwords and passphrases with strength analysis",
    icon: LockIcon,
    categoryId: "security",
    path: "/security/password-generator",
  },
  // Fun
  {
    id: "wheel-of-fate",
    label: "Wheel of Fate",
    description: "Spin a wheel to randomly pick from a list of options",
    icon: CircleDotIcon,
    categoryId: "fun",
    path: "/fun/wheel-of-fate",
  },
  {
    id: "coin-flip",
    label: "Coin Flip",
    description: "Flip a coin with a satisfying 3D animation and track your results history",
    icon: CoinsIcon,
    categoryId: "fun",
    path: "/fun/coin-flip",
  },
  // PDF Tools
  {
    id: "jpg-to-pdf",
    label: "JPG to PDF",
    description: "Convert JPEG images to PDF pages",
    icon: ImageIcon,
    categoryId: "pdf",
    path: "/pdf/jpg-to-pdf",
  },
  {
    id: "png-to-pdf",
    label: "PNG to PDF",
    description: "Convert PNG images to PDF pages",
    icon: ImagePlusIcon,
    categoryId: "pdf",
    path: "/pdf/png-to-pdf",
  },
  {
    id: "pdf-merge",
    label: "Merge PDF",
    description: "Combine multiple PDFs into one",
    icon: MergeIcon,
    categoryId: "pdf",
    path: "/pdf/pdf-merge",
  },
  {
    id: "pdf-split",
    label: "Split PDF",
    description: "Extract pages or split into parts",
    icon: SplitIcon,
    categoryId: "pdf",
    path: "/pdf/pdf-split",
  },
  {
    id: "pdf-reorder",
    label: "Reorder PDF",
    description: "Drag and drop to reorder pages",
    icon: ArrowUpDownIcon,
    categoryId: "pdf",
    path: "/pdf/pdf-reorder",
  },
  {
    id: "pdf-compress",
    label: "Compress PDF",
    description: "Reduce PDF file size",
    icon: ArchiveIcon,
    categoryId: "pdf",
    path: "/pdf/pdf-compress",
  },
  {
    id: "pdf-watermark",
    label: "Watermark PDF",
    description: "Add text or image watermarks",
    icon: DropletIcon,
    categoryId: "pdf",
    path: "/pdf/pdf-watermark",
  },
  {
    id: "docx-to-pdf",
    label: "DOCX to PDF",
    description: "Convert Word documents to PDF",
    icon: FileTextIcon,
    categoryId: "pdf",
    path: "/pdf/docx-to-pdf",
  },
  {
    id: "pptx-to-pdf",
    label: "PPTX to PDF",
    description: "Convert PowerPoint presentations to PDF",
    icon: PresentationIcon,
    categoryId: "pdf",
    path: "/pdf/pptx-to-pdf",
  },
  {
    id: "xlsx-to-pdf",
    label: "XLSX to PDF",
    description: "Convert Excel spreadsheets to PDF",
    icon: FileSpreadsheetIcon,
    categoryId: "pdf",
    path: "/pdf/xlsx-to-pdf",
  },
  {
    id: "csv-to-pdf",
    label: "CSV to PDF",
    description: "Convert CSV spreadsheets to PDF tables",
    icon: FileSpreadsheetIcon,
    categoryId: "pdf",
    path: "/pdf/csv-to-pdf",
  },
  {
    id: "html-to-pdf",
    label: "HTML to PDF",
    description: "Convert HTML pages to PDF",
    icon: CodeIcon,
    categoryId: "pdf",
    path: "/pdf/html-to-pdf",
  },
  {
    id: "markdown-to-pdf",
    label: "Markdown to PDF",
    description: "Convert Markdown documents to PDF",
    icon: TextIcon,
    categoryId: "pdf",
    path: "/pdf/markdown-to-pdf",
  },
]

export function getToolsByCategory(categoryId: CategoryId): ToolEntry[] {
  return TOOLS.filter((tool) => tool.categoryId === categoryId)
}

export function getCategoryByPath(path: string): ToolCategory | undefined {
  return CATEGORIES.find((cat) => cat.path === path)
}

export function getToolByPath(path: string): ToolEntry | undefined {
  return TOOLS.find((tool) => tool.path === path)
}
