import { useState, useEffect, useCallback, useRef } from "react"
import { cn } from "@/lib/utils"
import {
  getContrastTextColor,
  hexToRgb,
  rgbToHsl,
  rgbToCmyk,
  rgbToLab,
  rgbToXyz,
  rgbToLch,
  rgbToLuv,
  rgbToHwb,
  getContrastRatio,
  generateShades,
  getColorPsychology,
} from "@/utils/colorUtils"
import { fetchFullColorDetail, type ColorDetailData } from "@/services/colorApi"
import {
  XIcon,
  CopyIcon,
  CheckIcon,
  ExternalLinkIcon,
  Loader2Icon,
  SparklesIcon,
  MoreHorizontalIcon,
} from "lucide-react"

interface ColorDetailPanelProps {
  hex: string
  onClose: () => void
  onSelectColor?: (hex: string) => void
}

function ColorDetailPanelInner({ hex, onClose, onSelectColor }: ColorDetailPanelProps) {
  const [data, setData] = useState<ColorDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const cleanHex = hex.startsWith("#") ? hex : `#${hex}`
  const textColor = getContrastTextColor(cleanHex)
  const psychology = getColorPsychology(cleanHex)
  const shades = generateShades(cleanHex, 12)

  useEffect(() => {
    let cancelled = false

    fetchFullColorDetail(cleanHex).then((result) => {
      if (!cancelled) {
        setData(result)
        setLoading(false)
      }
    })

    return () => { cancelled = true }
  }, [cleanHex])

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      setIsScrolled(scrollRef.current.scrollTop > 180)
    }
  }, [])

  const copyToClipboard = (value: string, field: string) => {
    navigator.clipboard.writeText(value)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 1500)
  }

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [onClose])

  const displayName = data?.creativeName
    ? `~${data.creativeName}`
    : `~${data?.standardName ?? "Loading..."}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md max-h-[90vh] bg-card rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-border/50 z-10">
        {/* Sticky header - appears when scrolled */}
        <div
          className={cn(
            "absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 transition-all duration-300",
            isScrolled
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-full pointer-events-none"
          )}
          style={{
            backgroundColor: cleanHex,
            color: textColor,
          }}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="font-bold text-base truncate">{displayName}</span>
            <span className="text-xs opacity-70 font-mono flex-shrink-0">#{data?.conversions.hex ?? cleanHex.replace("#", "").toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => copyToClipboard(cleanHex, "header-hex")}
              className="p-1.5 rounded-lg transition-all hover:scale-110"
              style={{ backgroundColor: `${textColor}15` }}
              title="Copy hex"
            >
              {copiedField === "header-hex" ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-all hover:scale-110"
              style={{ backgroundColor: `${textColor}15` }}
              title="Close"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overscroll-contain"
        >
          {/* Color swatch area */}
          <div
            className="relative h-48 flex items-end"
            style={{ backgroundColor: cleanHex }}
          >
            {/* Top-right buttons on swatch */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5" style={{ color: textColor }}>
              <button
                className="p-2 rounded-xl transition-all hover:scale-110"
                style={{ backgroundColor: `${textColor}15` }}
                title="Color info"
              >
                <SparklesIcon className="size-4" />
              </button>
              <button
                className="p-2 rounded-xl transition-all hover:scale-110"
                style={{ backgroundColor: `${textColor}15` }}
                title="More options"
                onClick={() => copyToClipboard(cleanHex, "swatch")}
              >
                {copiedField === "swatch" ? <CheckIcon className="size-4" /> : <MoreHorizontalIcon className="size-4" />}
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl transition-all hover:scale-110"
                style={{ backgroundColor: `${textColor}15` }}
                title="Close"
              >
                <XIcon className="size-4" />
              </button>
            </div>
          </div>

          {/* Main content */}
          <div className="px-5 pb-5">
            {/* Name + Hex */}
            <div className="pt-5 pb-2">
              <div className="flex items-baseline gap-3">
                <h2 className="text-xl font-bold text-foreground">{displayName}</h2>
                <button
                  onClick={() => copyToClipboard(cleanHex, "name-hex")}
                  className="text-sm text-muted-foreground font-mono hover:text-foreground transition-colors"
                  title="Copy hex"
                >
                  {copiedField === "name-hex" ? "Copied!" : `#${cleanHex.replace("#", "").toUpperCase()}`}
                </button>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {psychology.description}
              </p>
            </div>

            <Divider />

            {/* Psychology */}
            <Section title="Psychology">
              <TagList tags={psychology.psychology} />
            </Section>

            <Divider />

            {/* Meaning */}
            <Section title="Meaning">
              <TagList tags={psychology.meaning} />
            </Section>

            <Divider />

            {/* Applications */}
            <Section title="Applications">
              <TagList tags={psychology.applications} />
            </Section>

            <Divider />

            {/* Conversion */}
            <Section title="Conversion">
              {loading ? (
                <LoadingBlock />
              ) : data ? (
                <div className="grid grid-cols-3 gap-2">
                  <ConversionCard label="HEX" value={data.conversions.hex} onCopy={() => copyToClipboard(data.conversions.hex, "hex")} copied={copiedField === "hex"} />
                  <ConversionCard label="RGB" value={data.conversions.rgb} onCopy={() => copyToClipboard(data.conversions.rgb, "rgb")} copied={copiedField === "rgb"} />
                  <ConversionCard label="HSL" value={data.conversions.hsl} onCopy={() => copyToClipboard(data.conversions.hsl, "hsl")} copied={copiedField === "hsl"} />
                  <ConversionCard label="CMYK" value={data.conversions.cmyk} onCopy={() => copyToClipboard(data.conversions.cmyk, "cmyk")} copied={copiedField === "cmyk"} />
                  <ConversionCard label="LAB" value={data.conversions.lab} onCopy={() => copyToClipboard(data.conversions.lab, "lab")} copied={copiedField === "lab"} />
                  <ConversionCard label="LCH" value={data.conversions.lch} onCopy={() => copyToClipboard(data.conversions.lch, "lch")} copied={copiedField === "lch"} />
                  <ConversionCard label="XYZ" value={data.conversions.xyz} onCopy={() => copyToClipboard(data.conversions.xyz, "xyz")} copied={copiedField === "xyz"} />
                  <ConversionCard label="LUV" value={data.conversions.luv} onCopy={() => copyToClipboard(data.conversions.luv, "luv")} copied={copiedField === "luv"} />
                  <ConversionCard label="HWB" value={data.conversions.hwb} onCopy={() => copyToClipboard(data.conversions.hwb, "hwb")} copied={copiedField === "hwb"} />
                </div>
              ) : (
                <FallbackConversions hex={cleanHex} />
              )}
            </Section>

            <Divider />

            {/* Harmonies */}
            <Section title="Harmonies">
              {loading ? (
                <LoadingBlock />
              ) : data ? (
                <div className="grid grid-cols-2 gap-2.5">
                  <HarmonyCard
                    label="Analogous"
                    colors={data.harmonies.analogous}
                    onSelect={onSelectColor}
                  />
                  <HarmonyCard
                    label="Complementary"
                    colors={data.harmonies.complementary}
                    onSelect={onSelectColor}
                  />
                  <HarmonyCard
                    label="Split Complementary"
                    colors={data.harmonies.splitComplementary}
                    onSelect={onSelectColor}
                  />
                  <HarmonyCard
                    label="Triadic"
                    colors={data.harmonies.triadic}
                    onSelect={onSelectColor}
                  />
                  <HarmonyCard
                    label="Tetradic"
                    colors={data.harmonies.tetradic}
                    onSelect={onSelectColor}
                  />
                  <HarmonyCard
                    label="Square"
                    colors={data.harmonies.square}
                    onSelect={onSelectColor}
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Unable to load harmonies</p>
              )}
            </Section>

            <Divider />

            {/* Shades */}
            <Section title="Shades">
              <div className="bg-muted/50 rounded-xl p-3">
                <div className="flex gap-0.5 h-10 rounded-lg overflow-hidden">
                  {shades.map((shade, i) => (
                    <button
                      key={i}
                      className="flex-1 transition-all hover:flex-[2] group relative"
                      style={{ backgroundColor: shade }}
                      onClick={() => {
                        copyToClipboard(shade, `shade-${i}`)
                        onSelectColor?.(shade)
                      }}
                      title={shade}
                    >
                      <span
                        className="absolute inset-0 flex items-center justify-center text-[8px] font-mono opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: getContrastTextColor(shade) }}
                      >
                        {copiedField === `shade-${i}` ? "✓" : ""}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </Section>

            <Divider />

            {/* Similar Colors */}
            <Section title="Similar colors">
              {loading ? (
                <LoadingBlock />
              ) : data && data.similarColors.length > 0 ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {data.similarColors.map((sc, i) => (
                    <button
                      key={i}
                      onClick={() => onSelectColor?.(sc.hex)}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left group"
                    >
                      <div
                        className="w-10 h-10 rounded-lg shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: sc.hex }}
                      />
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-foreground block truncate">
                          {sc.name}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {sc.hex.replace("#", "").toUpperCase()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Unable to load similar colors</p>
              )}
            </Section>

            <Divider />

            {/* Accessibility */}
            <Section title="Accessibility">
              {loading ? (
                <LoadingBlock />
              ) : data ? (
                <div className="space-y-2">
                  <AccessibilityRow
                    label="On white"
                    ratio={data.accessibility.contrastOnWhite}
                    rating={data.accessibility.wcagWhite.rating}
                    score={data.accessibility.wcagWhite.score}
                    previewBg="#FFFFFF"
                    previewFg={cleanHex}
                  />
                  <AccessibilityRow
                    label="On black"
                    ratio={data.accessibility.contrastOnBlack}
                    rating={data.accessibility.wcagBlack.rating}
                    score={data.accessibility.wcagBlack.score}
                    previewBg="#000000"
                    previewFg={cleanHex}
                  />
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-muted/50">
                    <span className="text-sm text-foreground">Color Blind Friendly</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono">
                        {data.accessibility.colorBlindSimilarity}% SIMILAR
                      </span>
                      <RatingBadge rating={data.accessibility.colorBlindRating} score={
                        data.accessibility.colorBlindRating === "EXCELLENT" ? "5/5" :
                        data.accessibility.colorBlindRating === "GOOD" ? "3/5" : "2/5"
                      } />
                    </div>
                  </div>
                </div>
              ) : (
                <FallbackAccessibility hex={cleanHex} />
              )}
            </Section>

            {/* View more link */}
            <div className="mt-5 mb-1">
              <a
                href={`https://coolors.co/${cleanHex.replace("#", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-border hover:bg-muted/50 transition-colors group"
              >
                <span className="text-sm font-medium text-foreground">View more about this color</span>
                <ExternalLinkIcon className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </a>
            </div>

            {/* Powered by */}
            <p className="text-center text-[10px] text-muted-foreground/50 mt-3">
              Powered by thecolorapi.com & color.pizza
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Wrapper that uses key to force remount on hex change (avoids setState in effect issues)
export function ColorDetailPanel(props: ColorDetailPanelProps) {
  return <ColorDetailPanelInner key={props.hex} {...props} />
}

// ── Sub-components ─────────────────────────────────────────────

function Divider() {
  return <div className="border-t border-border/50 my-4" />
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-foreground mb-3">{title}</h3>
      {children}
    </div>
  )
}

function TagList({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, i) => (
        <span
          key={i}
          className="px-3 py-1.5 text-xs font-medium text-foreground bg-muted/70 rounded-lg border border-border/50"
        >
          {tag}
        </span>
      ))}
    </div>
  )
}

function LoadingBlock() {
  return (
    <div className="flex items-center justify-center py-6">
      <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
    </div>
  )
}

function ConversionCard({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string
  value: string
  onCopy: () => void
  copied: boolean
}) {
  return (
    <button
      onClick={onCopy}
      className="flex flex-col gap-1 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left group"
      title={`Copy ${label}`}
    >
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span className="text-xs font-bold text-foreground font-mono truncate w-full">
        {copied ? "Copied!" : value}
      </span>
    </button>
  )
}

function HarmonyCard({
  label,
  colors,
  onSelect,
}: {
  label: string
  colors: string[]
  onSelect?: (hex: string) => void
}) {
  return (
    <div className="p-3 rounded-xl bg-muted/50">
      <span className="text-[11px] font-medium text-foreground mb-2 block">{label}</span>
      <div className="flex gap-1">
        {colors.slice(0, 5).map((color, i) => (
          <button
            key={i}
            className="w-8 h-8 rounded-md shadow-sm hover:scale-110 transition-transform border border-black/5"
            style={{ backgroundColor: color }}
            onClick={() => onSelect?.(color)}
            title={color}
          />
        ))}
      </div>
    </div>
  )
}

function AccessibilityRow({
  label,
  ratio,
  rating,
  score,
  previewBg,
  previewFg,
}: {
  label: string
  ratio: number
  rating: string
  score: string
  previewBg: string
  previewFg: string
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-muted/50">
      <div className="flex items-center gap-3">
        <div
          className="w-5 h-5 rounded-md border border-border/30 flex items-center justify-center text-[8px] font-bold"
          style={{ backgroundColor: previewBg, color: previewFg }}
        >
          A
        </div>
        <span className="text-sm text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground font-mono">{ratio}:1</span>
        <RatingBadge rating={rating} score={score} />
      </div>
    </div>
  )
}

function RatingBadge({ rating, score }: { rating: string; score: string }) {
  const isGood = rating === "GOOD" || rating === "EXCELLENT"
  return (
    <span
      className={cn(
        "text-[10px] font-bold px-2 py-0.5 rounded-md",
        isGood
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      )}
    >
      {rating} {score}
    </span>
  )
}

// Fallback when API fails - use local calculations
function FallbackConversions({ hex }: { hex: string }) {
  const rgb = hexToRgb(hex)
  const hsl = rgbToHsl(rgb)
  const cmyk = rgbToCmyk(rgb)
  const lab = rgbToLab(rgb)
  const xyz = rgbToXyz(rgb)
  const lch = rgbToLch(rgb)
  const luv = rgbToLuv(rgb)
  const hwb = rgbToHwb(rgb)

  return (
    <div className="grid grid-cols-3 gap-2">
      <ConversionCard label="HEX" value={hex.replace("#", "").toUpperCase()} onCopy={() => {}} copied={false} />
      <ConversionCard label="RGB" value={`${rgb.r}, ${rgb.g}, ${rgb.b}`} onCopy={() => {}} copied={false} />
      <ConversionCard label="HSL" value={`${hsl.h}, ${hsl.s}, ${hsl.l}`} onCopy={() => {}} copied={false} />
      <ConversionCard label="CMYK" value={`${cmyk.c}, ${cmyk.m}, ${cmyk.y}, ${cmyk.k}`} onCopy={() => {}} copied={false} />
      <ConversionCard label="LAB" value={`${lab.l}, ${lab.a}, ${lab.b}`} onCopy={() => {}} copied={false} />
      <ConversionCard label="LCH" value={`${lch.l}, ${lch.c}, ${lch.h}`} onCopy={() => {}} copied={false} />
      <ConversionCard label="XYZ" value={`${xyz.x}, ${xyz.y}, ${xyz.z}`} onCopy={() => {}} copied={false} />
      <ConversionCard label="LUV" value={`${luv.l}, ${luv.u}, ${luv.v}`} onCopy={() => {}} copied={false} />
      <ConversionCard label="HWB" value={`${hwb.h}, ${hwb.w}, ${hwb.b}`} onCopy={() => {}} copied={false} />
    </div>
  )
}

function FallbackAccessibility({ hex }: { hex: string }) {
  const contrastOnWhite = Math.round(getContrastRatio(hex, "#FFFFFF") * 100) / 100
  const contrastOnBlack = Math.round(getContrastRatio(hex, "#000000") * 100) / 100

  const getR = (r: number) => {
    if (r >= 7) return { rating: "EXCELLENT", score: "5/5" }
    if (r >= 4.5) return { rating: "GOOD", score: "4/5" }
    if (r >= 3) return { rating: "GOOD", score: "3/5" }
    return { rating: "POOR", score: "2/5" }
  }

  return (
    <div className="space-y-2">
      <AccessibilityRow label="On white" ratio={contrastOnWhite} rating={getR(contrastOnWhite).rating} score={getR(contrastOnWhite).score} previewBg="#FFFFFF" previewFg={hex} />
      <AccessibilityRow label="On black" ratio={contrastOnBlack} rating={getR(contrastOnBlack).rating} score={getR(contrastOnBlack).score} previewBg="#000000" previewFg={hex} />
    </div>
  )
}
