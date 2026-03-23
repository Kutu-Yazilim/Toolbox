import { useState, useMemo, useCallback, useRef } from "react"
import {
  CopyIcon,
  CheckIcon,
  DownloadIcon,
  SearchIcon as SearchLucide,
  Home,
  Search,
  Settings,
  User,
  Mail,
  Heart,
  Star,
  Plus,
  Minus,
  Check,
  X,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Menu,
  Bell,
  Camera,
  Clock,
  Download,
  Upload,
  Edit,
  Trash,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Globe,
  Map,
  Phone,
  Image,
  File,
  Folder,
  Code,
  Terminal,
  Database,
  Server,
  Cloud,
  Wifi,
  Bluetooth,
  Battery,
  Zap,
  Sun,
  Moon,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Send,
  Share,
  Bookmark,
  Tag,
  Filter,
  Layers,
  Grid,
  List,
  Calendar,
  Clipboard,
  Link,
  ExternalLink,
  Maximize,
  Minimize,
  RefreshCw,
  RotateCw,
  Scissors,
  Copy,
  Save,
  Printer,
  AlertTriangle,
  Info,
  HelpCircle,
  Shield,
  Key,
  Award,
  Gift,
  Music,
  Video,
  Mic,
} from "lucide-react"
import { Button } from "@/components/ui/button"

// ---------------------------------------------------------------------------
// Icon map
// ---------------------------------------------------------------------------

const ICON_MAP: Record<
  string,
  React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
> = {
  Home,
  Search,
  Settings,
  User,
  Mail,
  Heart,
  Star,
  Plus,
  Minus,
  Check,
  X,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Menu,
  Bell,
  Camera,
  Clock,
  Download,
  Upload,
  Edit,
  Trash,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Globe,
  Map,
  Phone,
  Image,
  File,
  Folder,
  Code,
  Terminal,
  Database,
  Server,
  Cloud,
  Wifi,
  Bluetooth,
  Battery,
  Zap,
  Sun,
  Moon,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Send,
  Share,
  Bookmark,
  Tag,
  Filter,
  Layers,
  Grid,
  List,
  Calendar,
  Clipboard,
  Link,
  ExternalLink,
  Maximize,
  Minimize,
  RefreshCw,
  RotateCw,
  Scissors,
  Copy,
  Save,
  Printer,
  AlertTriangle,
  Info,
  HelpCircle,
  Shield,
  Key,
  Award,
  Gift,
  Music,
  Video,
  Mic,
}

const ICON_NAMES = Object.keys(ICON_MAP)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type CopiedKey = "react" | "flutter" | null

function toSnakeCase(name: string): string {
  return name.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase()
}

function hexToFlutterColor(hex: string): string {
  const clean = hex.replace("#", "")
  if (clean.length === 6) return `Color(0xFF${clean.toUpperCase()})`
  return `Color(0x${clean.toUpperCase()})`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SvgIconEditor() {
  const [selectedIcon, setSelectedIcon] = useState("Home")
  const [searchQuery, setSearchQuery] = useState("")
  const [size, setSize] = useState(48)
  const [color, setColor] = useState("#000000")
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [bgColor, setBgColor] = useState("#ffffff")
  const [bgTransparent, setBgTransparent] = useState(true)
  const [copied, setCopied] = useState<CopiedKey>(null)

  const previewRef = useRef<HTMLDivElement>(null)

  const filteredIcons = useMemo(() => {
    if (!searchQuery.trim()) return ICON_NAMES
    const q = searchQuery.toLowerCase()
    return ICON_NAMES.filter((name) => name.toLowerCase().includes(q))
  }, [searchQuery])

  const IconComponent = ICON_MAP[selectedIcon]

  // ---- Copy helpers ----

  const copyToClipboard = useCallback(
    (text: string, key: CopiedKey) => {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(key)
        setTimeout(() => setCopied(null), 2000)
      })
    },
    [],
  )

  const reactCode = `<${selectedIcon} size={${size}} color="${color}" strokeWidth={${strokeWidth}} />`
  const flutterCode = `Icon(Icons.${toSnakeCase(selectedIcon)}, size: ${size}, color: ${hexToFlutterColor(color)})`

  // ---- SVG export ----

  const downloadSvg = useCallback(() => {
    const svgEl = previewRef.current?.querySelector("svg")
    if (!svgEl) return
    const clone = svgEl.cloneNode(true) as SVGElement
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")
    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(clone)
    const blob = new Blob([svgString], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${selectedIcon}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }, [selectedIcon])

  // ---- PNG export ----

  const downloadPng = useCallback(() => {
    const svgEl = previewRef.current?.querySelector("svg")
    if (!svgEl) return
    const clone = svgEl.cloneNode(true) as SVGElement
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")
    clone.setAttribute("width", String(size))
    clone.setAttribute("height", String(size))
    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(clone)
    const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`

    const img = new window.Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      if (!bgTransparent) {
        ctx.fillStyle = bgColor
        ctx.fillRect(0, 0, size, size)
      }
      ctx.drawImage(img, 0, 0, size, size)
      const pngUrl = canvas.toDataURL("image/png")
      const a = document.createElement("a")
      a.href = pngUrl
      a.download = `${selectedIcon}.png`
      a.click()
    }
    img.src = svgDataUrl
  }, [selectedIcon, size, bgColor, bgTransparent])

  // ---- Render ----

  return (
    <div className="flex h-full gap-4 overflow-hidden p-4">
      {/* Left panel — icon browser */}
      <div className="flex w-[30%] min-w-[220px] flex-col gap-3 overflow-hidden">
        <div className="relative">
          <SearchLucide
            size={16}
            className="text-semantic-fg-muted absolute left-3 top-1/2 -translate-y-1/2"
          />
          <input
            type="text"
            placeholder="Search icons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-semantic-bg-default border-semantic-border-default text-semantic-fg-default placeholder:text-semantic-fg-muted w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <p className="text-semantic-fg-muted text-xs">
          {filteredIcons.length} icon{filteredIcons.length !== 1 ? "s" : ""}
        </p>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-4 gap-2">
            {filteredIcons.map((name) => {
              const Ic = ICON_MAP[name]
              return (
                <button
                  key={name}
                  onClick={() => setSelectedIcon(name)}
                  title={name}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition-colors ${
                    name === selectedIcon
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-semantic-border-default hover:bg-semantic-bg-subtle"
                  }`}
                >
                  <Ic size={20} />
                  <span className="text-semantic-fg-muted w-full truncate text-center text-[10px]">
                    {name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Middle panel — preview */}
      <div className="flex w-[40%] flex-col items-center justify-center gap-4">
        <div
          className="border-semantic-border-default flex items-center justify-center rounded-xl border"
          style={{
            width: Math.max(size + 48, 200),
            height: Math.max(size + 48, 200),
            backgroundColor: bgTransparent ? "transparent" : bgColor,
            backgroundImage: bgTransparent
              ? "repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%)"
              : "none",
            backgroundSize: "16px 16px",
          }}
          ref={previewRef}
        >
          {IconComponent && (
            <IconComponent size={size} color={color} strokeWidth={strokeWidth} />
          )}
        </div>
        <p className="text-semantic-fg-default text-lg font-medium">
          {selectedIcon}
        </p>
      </div>

      {/* Right panel — customization + export */}
      <div className="flex w-[30%] min-w-[220px] flex-col gap-5 overflow-y-auto">
        {/* Customization */}
        <section className="flex flex-col gap-4">
          <h3 className="text-semantic-fg-default text-sm font-semibold">
            Customize
          </h3>

          {/* Size */}
          <label className="flex flex-col gap-1">
            <span className="text-semantic-fg-muted text-xs">
              Size: {size}px
            </span>
            <input
              type="range"
              min={16}
              max={512}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </label>

          {/* Stroke width */}
          <label className="flex flex-col gap-1">
            <span className="text-semantic-fg-muted text-xs">
              Stroke width: {strokeWidth}
            </span>
            <input
              type="range"
              min={0.5}
              max={4}
              step={0.5}
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </label>

          {/* Color */}
          <label className="flex items-center gap-2">
            <span className="text-semantic-fg-muted text-xs">Color</span>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded border-none"
            />
            <span className="text-semantic-fg-muted text-xs">{color}</span>
          </label>

          {/* Background */}
          <div className="flex flex-col gap-1">
            <span className="text-semantic-fg-muted text-xs">Background</span>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={bgTransparent}
                onChange={(e) => setBgTransparent(e.target.checked)}
                className="accent-blue-500"
              />
              <span className="text-semantic-fg-muted text-xs">Transparent</span>
            </label>
            {!bgTransparent && (
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded border-none"
                />
                <span className="text-semantic-fg-muted text-xs">{bgColor}</span>
              </div>
            )}
          </div>
        </section>

        {/* Export */}
        <section className="flex flex-col gap-3">
          <h3 className="text-semantic-fg-default text-sm font-semibold">
            Export
          </h3>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={downloadSvg}>
              <DownloadIcon size={14} className="mr-1" />
              SVG
            </Button>
            <Button variant="outline" size="sm" onClick={downloadPng}>
              <DownloadIcon size={14} className="mr-1" />
              PNG
            </Button>
          </div>

          {/* React code */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-semantic-fg-muted text-xs">React</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(reactCode, "react")}
              >
                {copied === "react" ? (
                  <CheckIcon size={14} />
                ) : (
                  <CopyIcon size={14} />
                )}
              </Button>
            </div>
            <pre className="bg-semantic-bg-subtle text-semantic-fg-default overflow-x-auto rounded-md p-2 text-xs">
              {reactCode}
            </pre>
          </div>

          {/* Flutter code */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-semantic-fg-muted text-xs">Flutter</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(flutterCode, "flutter")}
              >
                {copied === "flutter" ? (
                  <CheckIcon size={14} />
                ) : (
                  <CopyIcon size={14} />
                )}
              </Button>
            </div>
            <pre className="bg-semantic-bg-subtle text-semantic-fg-default overflow-x-auto rounded-md p-2 text-xs">
              {flutterCode}
            </pre>
          </div>
        </section>
      </div>
    </div>
  )
}
