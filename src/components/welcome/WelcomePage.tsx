"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import Link from "next/link"
import { MoonIcon, SunIcon, SearchIcon, StarIcon, ArrowUpRightIcon } from "lucide-react"
import { TOOLS, CATEGORIES, getToolsByCategory, type CategoryId } from "@/config/toolRegistry"
import { useFavorites } from "@/hooks/useFavorites"
import { useTheme } from "@/hooks/useTheme"
import { useLocale } from "@/i18n/LocaleContext"
import { getToolLabel, getToolDescription } from "@/i18n/toolTranslations"
import { cn } from "@/lib/utils"

type FilterTab = CategoryId | "all" | "favorites"

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"]

const CATEGORY_BLURBS: Record<CategoryId, { en: string; tr: string }> = {
  "dev-tools": {
    en: "Everyday companions for people who ship code.",
    tr: "Kod yazanlar için günlük kutu.",
  },
  converters: {
    en: "From one format into another, and back.",
    tr: "Biçimden biçime, geri ve ileri.",
  },
  generators: {
    en: "A blank page and dependable randomness.",
    tr: "Boş bir sayfa ve güvenilir rastlantı.",
  },
  design: {
    en: "A canvas for the eye.",
    tr: "Göze iyi gelen tuval.",
  },
  network: {
    en: "The internet is still an incredible thing.",
    tr: "İnternet hâlâ olağanüstü bir şey.",
  },
  pdf: {
    en: "Thirteen small steps for every document.",
    tr: "Her belge için on üç küçük adım.",
  },
  security: {
    en: "Small doors, sturdy hinges.",
    tr: "Küçük kapılar, sağlam menteşeler.",
  },
  "data-tools": {
    en: "Rows, columns, and the shapes they hide.",
    tr: "Satırlar, sütunlar ve sakladıkları şekiller.",
  },
  "image-tools": {
    en: "Pixels, resized gently.",
    tr: "Piksellere nazik bir dokunuş.",
  },
  fun: {
    en: "For when the decision is the point.",
    tr: "Karar verme anının kendisi için.",
  },
}

const HERO = {
  en: {
    eyebrow: "The Kutu Toolbox",
    meta: "№ 2026 · İstanbul · Est. Kutu Yazılım",
    line1a: "Eighty-four",
    line1b: "crafted",
    line1c: " tools",
    line1d: "for quiet work.",
    lead: "A considered collection of small, fast utilities — format, convert, generate, compose. No accounts, no ads, no telemetry; everything runs in your browser.",
    browseAll: "Browse all",
    pressSearch: "or press",
    offlineFirst: "offline-first",
    noAds: "no ads",
    openSource: "open source",
    volume: "Vol. I",
    tools: "tools",
    categories: "categories",
  },
  tr: {
    eyebrow: "Kutu Araç Takımı",
    meta: "№ 2026 · İstanbul · Kutu Yazılım",
    line1a: "Seksen dört",
    line1b: "itinalı",
    line1c: " araç",
    line1d: "sessiz çalışma için.",
    lead: "Düşünülmüş küçük ve hızlı araçların bir koleksiyonu — biçimlendir, dönüştür, üret, kur. Hesap yok, reklam yok, telemetri yok; her şey tarayıcında çalışır.",
    browseAll: "Hepsini gez",
    pressSearch: "ya da bas",
    offlineFirst: "çevrimdışı çalışır",
    noAds: "reklam yok",
    openSource: "açık kaynak",
    volume: "Cilt I",
    tools: "araç",
    categories: "kategori",
  },
}

const PHILOSOPHY = {
  en: {
    eyebrow: "Philosophy",
    title: "A quiet workshop.",
    principles: [
      {
        n: "1",
        head: "Small, finished things.",
        body: "Each tool does one honest job. When it is done, it steps aside.",
      },
      {
        n: "2",
        head: "Runs in your browser.",
        body: "No uploads, no accounts. Your data never leaves your machine — and we prefer it that way.",
      },
      {
        n: "3",
        head: "Keyboard-first.",
        body: "Type / to search. Press Cmd+K for the palette. Your hands never need to leave the keys.",
      },
      {
        n: "4",
        head: "Designed with care.",
        body: "Paper tones, considered typography, honest rules. We believe utility and beauty are not opposed.",
      },
    ],
  },
  tr: {
    eyebrow: "Felsefe",
    title: "Sessiz bir atölye.",
    principles: [
      {
        n: "1",
        head: "Küçük, bitmiş işler.",
        body: "Her araç tek bir işi dürüstçe yapar. Bittiğinde usulca kenara çekilir.",
      },
      {
        n: "2",
        head: "Tarayıcında çalışır.",
        body: "Yükleme yok, hesap yok. Verin cihazından çıkmaz — biz de böyle olmasını tercih ediyoruz.",
      },
      {
        n: "3",
        head: "Klavye öncelikli.",
        body: "/ tuşu aramayı açar. Cmd+K komut paletini getirir. Ellerin tuşlardan ayrılmak zorunda değil.",
      },
      {
        n: "4",
        head: "Özenle tasarlanmış.",
        body: "Kağıt tonları, düşünülmüş tipografi, dürüst çizgiler. Kullanışlılığın ve güzelliğin karşıt olduğuna inanmıyoruz.",
      },
    ],
  },
}

const CHANGELOG = {
  en: [
    { date: "17 Apr 2026", title: "Porcelain & Ion — a new palette, inside and out.", tag: "v1.5" },
    { date: "02 Apr 2026", title: "Password generator now shows an entropy readout.", tag: "v1.4" },
    { date: "21 Mar 2026", title: "Dark mode, like a full moon instead of double ink.", tag: "v1.3" },
    { date: "08 Mar 2026", title: "Keyboard shortcuts: / for search, ⌘K to open the palette.", tag: "v1.2" },
    { date: "14 Feb 2026", title: "Kutu's first release — we open with 63 tools.", tag: "v1.0" },
  ],
  tr: [
    { date: "17 Nis 2026", title: "Porcelain & Ion — içten dışa yepyeni bir palet.", tag: "v1.5" },
    { date: "02 Nis 2026", title: "Şifre üreticisi artık entropi çubuğu gösteriyor.", tag: "v1.4" },
    { date: "21 Mar 2026", title: "Koyu mod, çift mürekkep yerine bir dolunay gibi.", tag: "v1.3" },
    { date: "08 Mar 2026", title: "Klavye kısayolları: / aramayı açar, ⌘K paleti açar.", tag: "v1.2" },
    { date: "14 Şub 2026", title: "Kutu'nun ilk sürümü — 63 araçla başlıyoruz.", tag: "v1.0" },
  ],
}

function KutuMark({ size = 22 }: { size?: number }) {
  return (
    <img
      src="/LogoOnlyCircularSVG.svg"
      alt="Kutu Yazılım"
      width={size}
      height={size}
      className="rounded-full"
      style={{ width: size, height: size }}
    />
  )
}

function CrateAnim() {
  const [opened, setOpened] = useState(false)
  useEffect(() => {
    const id = window.setTimeout(() => setOpened(true), 380)
    return () => window.clearTimeout(id)
  }, [])

  // Isometric box geometry (viewBox 0 0 400 400)
  //   Front face : (80,200) · (300,200) · (300,360) · (80,360)
  //   Depth offset: dx = +36, dy = -32 (up-right)
  //   Back top-left  BTL = (116, 168)   Back top-right  BTR = (336, 168)
  //   Back bottom-right BBR = (336, 328)
  const FBL = [80, 360]
  const FBR = [300, 360]
  const FTL = [80, 200]
  const FTR = [300, 200]
  const BBR = [336, 328]
  const BTL = [116, 168]
  const BTR = [336, 168]

  const words = [
    { label: "JSON", x: 8, y: 6, s: 26, accent: true, bold: true },
    { label: "UUID", x: 44, y: 2, s: 22 },
    { label: "QR", x: 72, y: 7, s: 32, bold: true },
    { label: "chmod 755", x: 64, y: 24, s: 14 },
    { label: "regex /.+/", x: 2, y: 32, s: 14 },
    { label: "#B5502E", x: 30, y: 16, s: 15, accent: true },
    { label: "SHA-256", x: 50, y: 36, s: 13 },
    { label: "d20", x: 18, y: 20, s: 22 },
    { label: "SQL·fmt", x: 78, y: 30, s: 13 },
    { label: "PDF", x: 86, y: 14, s: 22, bold: true },
  ]

  return (
    <div
      className="relative w-full max-w-[560px] ml-auto select-none"
      style={{ aspectRatio: "1 / 1", perspective: "1200px" }}
    >
      {/* Rising tool words — positioned above the box */}
      <div className="absolute inset-0 pointer-events-none">
        {words.map((w, i) => (
          <div
            key={i}
            className="font-mono-kutu absolute whitespace-nowrap"
            style={{
              left: `${w.x}%`,
              top: `${w.y}%`,
              fontSize: w.s,
              color: w.accent ? "var(--ion)" : "var(--ink-2)",
              opacity: opened ? 1 : 0,
              transform: opened ? "translateY(0)" : "translateY(40px)",
              transition: `opacity .8s ease ${0.25 + i * 0.08}s, transform 1s cubic-bezier(.2,.8,.2,1) ${0.25 + i * 0.08}s`,
              fontWeight: w.bold ? 600 : 400,
              letterSpacing: w.accent ? "0.02em" : "0",
            }}
          >
            {w.label}
          </div>
        ))}
      </div>

      {/* Crate SVG */}
      <svg
        viewBox="0 0 400 400"
        className="absolute bottom-0 left-0 w-full h-full"
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id="frontShade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--paper)" stopOpacity="1" />
            <stop offset="1" stopColor="var(--paper-2)" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="sideShade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="var(--paper-2)" stopOpacity="1" />
            <stop offset="1" stopColor="var(--paper-3)" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="insideShade" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0" stopColor="var(--paper-3)" stopOpacity="1" />
            <stop offset="1" stopColor="var(--paper-2)" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="lidShade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--paper)" stopOpacity="1" />
            <stop offset="1" stopColor="var(--paper-2)" stopOpacity="1" />
          </linearGradient>
          <filter id="boxShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="14" stdDeviation="10" floodColor="var(--ink)" floodOpacity="0.22" />
          </filter>
        </defs>

        {/* Soft ground shadow */}
        <ellipse
          cx="200"
          cy="372"
          rx="140"
          ry="10"
          fill="var(--ink)"
          opacity="0.18"
        />

        <g filter="url(#boxShadow)">
          {/* Inside back wall + floor — a single shaded parallelogram seen through the opening */}
          <polygon
            points={`${FTL[0]},${FTL[1]} ${FTR[0]},${FTR[1]} ${BTR[0]},${BTR[1]} ${BTL[0]},${BTL[1]}`}
            fill="url(#insideShade)"
            stroke="var(--ink)"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />

          {/* Inner shadow gradient along the back edge to suggest depth */}
          <polygon
            points={`${BTL[0] + 6},${BTL[1] + 4} ${BTR[0] - 6},${BTR[1] + 4} ${FTR[0] - 12},${FTR[1] - 10} ${FTL[0] + 12},${FTL[1] - 10}`}
            fill="var(--ink)"
            opacity="0.18"
          />

          {/* Right side face (in shadow) */}
          <polygon
            points={`${FTR[0]},${FTR[1]} ${BTR[0]},${BTR[1]} ${BBR[0]},${BBR[1]} ${FBR[0]},${FBR[1]}`}
            fill="url(#sideShade)"
            stroke="var(--ink)"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />

          {/* Front face (main plank) */}
          <polygon
            points={`${FBL[0]},${FBL[1]} ${FBR[0]},${FBR[1]} ${FTR[0]},${FTR[1]} ${FTL[0]},${FTL[1]}`}
            fill="url(#frontShade)"
            stroke="var(--ink)"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />

          {/* Horizontal plank seams on the front */}
          <line x1={FBL[0] + 10} y1={FBL[1] - 48} x2={FBR[0] - 10} y2={FBR[1] - 48} stroke="var(--ink)" strokeWidth="0.6" opacity="0.25" />
          <line x1={FBL[0] + 10} y1={FBL[1] - 100} x2={FBR[0] - 10} y2={FBR[1] - 100} stroke="var(--ink)" strokeWidth="0.6" opacity="0.25" />

          {/* Plank seam on the side */}
          <line
            x1={FBR[0] + 14}
            y1={FBR[1] - 54}
            x2={BBR[0] - 2}
            y2={BBR[1] - 54 + 2}
            stroke="var(--ink)"
            strokeWidth="0.5"
            opacity="0.22"
          />

          {/* Iron corner brackets at the front corners */}
          <path
            d={`M${FBL[0] - 1},${FBL[1] - 18} L${FBL[0] - 1},${FBL[1] + 1} L${FBL[0] + 16},${FBL[1] + 1}`}
            stroke="var(--ink-2)"
            strokeWidth="1.6"
            fill="none"
          />
          <path
            d={`M${FBR[0] + 1},${FBR[1] - 18} L${FBR[0] + 1},${FBR[1] + 1} L${FBR[0] - 16},${FBR[1] + 1}`}
            stroke="var(--ink-2)"
            strokeWidth="1.6"
            fill="none"
          />

          {/* Stamp on front face */}
          <g transform={`translate(${FTL[0] + 28}, ${FTL[1] + 36})`}>
            <rect
              width="124"
              height="58"
              fill="none"
              stroke="var(--ion)"
              strokeWidth="1.6"
            />
            <text
              x="62"
              y="26"
              textAnchor="middle"
              fontFamily="var(--font-display), Georgia, serif"
              fontStyle="italic"
              fontSize="20"
              fill="var(--ion)"
            >
              Kutu
            </text>
            <text
              x="62"
              y="46"
              textAnchor="middle"
              fontFamily="var(--font-mono), monospace"
              fontSize="9"
              letterSpacing="3"
              fill="var(--ion)"
            >
              TOOLBOX · 84
            </text>
          </g>

          {/* Wax seal */}
          <circle cx={FBR[0] - 36} cy={FBR[1] - 32} r="16" fill="var(--ion)" />
          <circle
            cx={FBR[0] - 36}
            cy={FBR[1] - 32}
            r="12.5"
            fill="none"
            stroke="var(--ink)"
            strokeWidth="0.8"
            opacity="0.55"
          />
          <text
            x={FBR[0] - 36}
            y={FBR[1] - 26}
            textAnchor="middle"
            fontFamily="var(--font-display), Georgia, serif"
            fontStyle="italic"
            fontSize="17"
            fill="var(--ink)"
          >
            K
          </text>

          {/* LID — parallelogram that hinges from the back edge */}
          <g
            style={{
              transformOrigin: `${(BTL[0] + BTR[0]) / 2}px ${BTL[1]}px`,
              transform: opened
                ? "perspective(1000px) rotateX(112deg)"
                : "rotateX(0deg)",
              transition: "transform 1.6s cubic-bezier(.2,.9,.2,1)",
            }}
          >
            <polygon
              points={`${FTL[0]},${FTL[1]} ${FTR[0]},${FTR[1]} ${BTR[0]},${BTR[1]} ${BTL[0]},${BTL[1]}`}
              fill="url(#lidShade)"
              stroke="var(--ink)"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            {/* Lid underside bevel */}
            <polygon
              points={`${FTL[0] + 10},${FTL[1] - 4} ${FTR[0] - 10},${FTR[1] - 4} ${BTR[0] - 10},${BTR[1] + 6} ${BTL[0] + 10},${BTL[1] + 6}`}
              fill="none"
              stroke="var(--ink)"
              strokeWidth="0.6"
              opacity="0.3"
            />
            {/* Hinge dots at the back edge */}
            <circle cx={BTL[0] + 30} cy={BTL[1] + 1} r="2.2" fill="var(--ink-2)" />
            <circle cx={BTR[0] - 30} cy={BTR[1] + 1} r="2.2" fill="var(--ink-2)" />
          </g>
        </g>
      </svg>
    </div>
  )
}

export function WelcomePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<FilterTab>("all")
  const searchRef = useRef<HTMLInputElement>(null)
  const [favoriteIds, toggleFavorite, isFavorite] = useFavorites()
  const { locale, setLocale } = useLocale()
  const { isDark, toggleTheme } = useTheme()

  const t = HERO[locale]
  const phil = PHILOSOPHY[locale]
  const changelog = CHANGELOG[locale]

  // Global "/" shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const filteredTools = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return TOOLS.filter((tool) => {
      const matchesCat =
        activeCategory === "all" ||
        (activeCategory === "favorites"
          ? favoriteIds.includes(tool.id)
          : tool.categoryId === activeCategory)
      const matchesSearch =
        !q ||
        tool.label.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        getToolLabel(tool, locale).toLowerCase().includes(q)
      return matchesCat && matchesSearch
    })
  }, [searchQuery, activeCategory, favoriteIds, locale])

  const isFiltering = searchQuery.trim() !== "" || activeCategory !== "all"

  const jumpToIndex = () =>
    document.getElementById("index")?.scrollIntoView({ behavior: "smooth", block: "start" })

  return (
    <div className="min-h-full w-full overflow-y-auto">
      {/* ─── Top nav ─── */}
      <header
        className="sticky top-0 z-50 border-b border-rule"
        style={{
          background: "color-mix(in oklab, var(--paper) 92%, transparent)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="mx-auto max-w-[1360px] px-6 md:px-10 h-14 flex items-center gap-6">
          <a href="#top" className="flex items-center gap-2.5 text-ink no-underline">
            <KutuMark size={22} />
            <span className="font-display text-xl" style={{ letterSpacing: "-0.02em" }}>
              Kutu
            </span>
            <span
              className="font-mono-kutu text-[10.5px] -ml-0.5"
              style={{ color: "var(--ink-4)" }}
            >
              / TOOLBOX
            </span>
          </a>

          <nav className="hidden md:flex gap-5 ml-2">
            <a
              href="#index"
              className="font-mono-kutu text-[12px] no-underline"
              style={{ color: "var(--ink-2)" }}
            >
              Index
            </a>
            <a
              href="#philosophy"
              className="font-mono-kutu text-[12px] no-underline"
              style={{ color: "var(--ink-2)" }}
            >
              Philosophy
            </a>
            <a
              href="#changelog"
              className="font-mono-kutu text-[12px] no-underline"
              style={{ color: "var(--ink-2)" }}
            >
              Changelog
            </a>
          </nav>

          <div className="flex-1" />

          <div className="flex items-center gap-2.5">
            <div
              className="flex rounded-full p-0.5 border"
              style={{ borderColor: "var(--rule)" }}
            >
              {(["en", "tr"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLocale(l)}
                  className="font-mono-kutu px-2.5 py-1 rounded-full text-[10.5px] transition-colors"
                  style={{
                    background: locale === l ? "var(--ink)" : "transparent",
                    color: locale === l ? "var(--paper)" : "var(--ink-2)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full grid place-items-center transition-colors"
              style={{
                border: "1px solid var(--rule)",
                background: "transparent",
                color: "var(--ink-2)",
                cursor: "pointer",
              }}
              aria-label="Toggle theme"
            >
              {isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        {/* ─── Hero ─── */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-[1360px] px-6 md:px-10 pt-14">
            <div className="flex flex-wrap justify-between items-end gap-6">
              <div className="space-y-1">
                <div className="eyebrow">{t.eyebrow}</div>
                <div className="font-mono-kutu text-[11px]" style={{ color: "var(--ink-4)" }}>
                  {t.meta}
                </div>
              </div>
              <div
                className="font-mono-kutu text-[11px] text-right"
                style={{ color: "var(--ink-4)" }}
              >
                {t.volume} · {TOOLS.length} {t.tools} · {CATEGORIES.length} {t.categories}
              </div>
            </div>

            <hr className="kutu-rule-double mt-5" />
          </div>

          <div className="mx-auto max-w-[1360px] px-6 md:px-10 pt-12 pb-9">
            <div
              className="grid gap-12 items-center"
              style={{
                gridTemplateColumns: "minmax(0, 1.2fr) minmax(380px, 1fr)",
              }}
            >
              <div className="min-w-0">
                <h1
                  className="font-display m-0"
                  style={{
                    fontSize: "clamp(48px, 7.5vw, 108px)",
                    lineHeight: 0.92,
                    letterSpacing: "-0.035em",
                    overflowWrap: "break-word",
                  }}
                >
                  {t.line1a}
                  <br />
                  <span className="font-display-italic" style={{ color: "var(--ion)" }}>
                    {t.line1b}
                  </span>
                  {t.line1c}
                  <br />
                  {t.line1d}
                </h1>
                <p
                  className="mt-7 max-w-[520px]"
                  style={{ fontSize: 17, lineHeight: 1.55, color: "var(--ink-2)" }}
                >
                  {t.lead}
                </p>
              </div>
              <div className="min-w-[380px] hidden md:block">
                <CrateAnim />
              </div>
            </div>
          </div>

          {/* Action rule */}
          <div className="mx-auto max-w-[1360px] px-6 md:px-10 flex flex-wrap items-center justify-between gap-4 pt-3 pb-9">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={jumpToIndex}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[4px] transition-all font-mono-kutu"
                style={{
                  background: "var(--ink)",
                  color: "var(--paper)",
                  border: "1px solid var(--ink)",
                  fontSize: 12,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--ion)"
                  e.currentTarget.style.borderColor = "var(--ion)"
                  e.currentTarget.style.transform = "translateY(-1px)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--ink)"
                  e.currentTarget.style.borderColor = "var(--ink)"
                  e.currentTarget.style.transform = "translateY(0)"
                }}
              >
                {t.browseAll}
                <ArrowUpRightIcon className="size-4" />
              </button>
              <span className="font-mono-kutu text-[11px]" style={{ color: "var(--ink-3)" }}>
                {t.pressSearch} <span className="kbd">/</span>
              </span>
            </div>
            <div className="font-mono-kutu text-[11px]" style={{ color: "var(--ink-4)" }}>
              {t.offlineFirst} · {t.noAds} · {t.openSource}
            </div>
          </div>
          <hr className="kutu-rule" />
        </section>

        {/* ─── Index — search + category chips ─── */}
        <section
          id="index"
          className="border-b"
          style={{ borderColor: "var(--rule)", background: "var(--paper)" }}
        >
          <div className="mx-auto max-w-[1360px] px-6 md:px-10 py-10">
            <div className="flex flex-wrap items-end justify-between gap-6 mb-6">
              <div>
                <div className="eyebrow">{locale === "tr" ? "Dizin" : "Index"}</div>
                <h2
                  className="font-display m-0 mt-2"
                  style={{
                    fontSize: "clamp(36px, 4.5vw, 56px)",
                    lineHeight: 1.05,
                    letterSpacing: "-0.025em",
                  }}
                >
                  {locale === "tr" ? (
                    <>
                      Tüm araçlar, <span className="font-display-italic">eksiksiz.</span>
                    </>
                  ) : (
                    <>
                      Every tool, <span className="font-display-italic">accounted for.</span>
                    </>
                  )}
                </h2>
              </div>

              <div className="relative w-full md:w-[380px]">
                <SearchIcon
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-4"
                  style={{ color: "var(--ink-4)" }}
                />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder={
                    locale === "tr"
                      ? "Araç ara — örn. JSON, QR, regex"
                      : "Search tools — e.g. JSON, QR, regex"
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-14 py-2.5 text-sm rounded-[4px] outline-none transition-colors"
                  style={{
                    background: "var(--paper-2)",
                    border: "1px solid var(--rule)",
                    color: "var(--ink)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--ink)"
                    e.currentTarget.style.background = "var(--paper)"
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--rule)"
                    e.currentTarget.style.background = "var(--paper-2)"
                  }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span className="kbd">/</span>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                className="kutu-chip"
                data-active={activeCategory === "all"}
                onClick={() => setActiveCategory("all")}
              >
                {locale === "tr" ? "Tümü" : "All"}
                <span style={{ color: "inherit", opacity: 0.6 }}>· {TOOLS.length}</span>
              </button>
              {favoriteIds.length > 0 && (
                <button
                  className="kutu-chip"
                  data-active={activeCategory === "favorites"}
                  onClick={() => setActiveCategory("favorites")}
                >
                  <StarIcon className="size-3 fill-current" />
                  {locale === "tr" ? "Favoriler" : "Favorites"}
                  <span style={{ opacity: 0.6 }}>· {favoriteIds.length}</span>
                </button>
              )}
              {CATEGORIES.map((cat) => {
                const count = getToolsByCategory(cat.id as CategoryId).length
                return (
                  <button
                    key={cat.id}
                    className="kutu-chip"
                    data-active={activeCategory === cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    {cat.label}
                    <span style={{ opacity: 0.6 }}>· {count}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* ─── Categorized sections OR filtered grid ─── */}
        {isFiltering ? (
          <FilteredGrid
            tools={filteredTools}
            locale={locale}
            isFavorite={isFavorite}
            toggleFavorite={toggleFavorite}
          />
        ) : (
          <div>
            {CATEGORIES.map((cat, i) => {
              const tools = getToolsByCategory(cat.id as CategoryId)
              if (tools.length === 0) return null
              return (
                <CategorySection
                  key={cat.id}
                  roman={ROMAN[i]}
                  title={cat.label}
                  blurb={CATEGORY_BLURBS[cat.id as CategoryId]?.[locale] ?? ""}
                  tools={tools}
                  count={tools.length}
                  locale={locale}
                  isFavorite={isFavorite}
                  toggleFavorite={toggleFavorite}
                />
              )
            })}
          </div>
        )}

        {/* ─── Philosophy ─── */}
        <section
          id="philosophy"
          style={{
            padding: "120px 0 88px",
            background: "var(--paper-2)",
            borderTop: "1px solid var(--rule)",
            borderBottom: "1px solid var(--rule)",
          }}
        >
          <div className="mx-auto max-w-[1360px] px-6 md:px-10">
            <div
              className="grid gap-12"
              style={{ gridTemplateColumns: "minmax(220px, 320px) 1fr" }}
            >
              <div>
                <div className="eyebrow">{phil.eyebrow}</div>
                <h2
                  className="font-display mt-3"
                  style={{
                    fontSize: "clamp(44px, 6vw, 84px)",
                    margin: 0,
                    lineHeight: 1,
                    letterSpacing: "-0.03em",
                  }}
                >
                  {phil.title}
                </h2>
              </div>
              <div>
                {phil.principles.map((p, i) => (
                  <div
                    key={i}
                    className="grid gap-4 py-6"
                    style={{
                      gridTemplateColumns: "80px 1fr",
                      borderBottom:
                        i < phil.principles.length - 1 ? "1px solid var(--rule)" : "none",
                    }}
                  >
                    <div
                      className="font-display-italic"
                      style={{ fontSize: 44, color: "var(--ion)", lineHeight: 0.9 }}
                    >
                      {p.n}.
                    </div>
                    <div>
                      <h4
                        className="font-display"
                        style={{
                          fontSize: 26,
                          margin: 0,
                          letterSpacing: "-0.01em",
                          lineHeight: 1.15,
                        }}
                      >
                        {p.head}
                      </h4>
                      <p
                        style={{
                          color: "var(--ink-2)",
                          margin: "8px 0 0",
                          fontSize: 16,
                          lineHeight: 1.55,
                          maxWidth: 560,
                        }}
                      >
                        {p.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Changelog ─── */}
        <section id="changelog" className="py-[88px]">
          <div className="mx-auto max-w-[1360px] px-6 md:px-10">
            <div className="eyebrow">{locale === "tr" ? "Değişiklik günlüğü" : "Changelog"}</div>
            <h2
              className="font-display m-0 mt-3 mb-10"
              style={{
                fontSize: "clamp(40px, 5vw, 64px)",
                lineHeight: 1.05,
                letterSpacing: "-0.025em",
              }}
            >
              {locale === "tr"
                ? "Kutu büyüyor, zarif bir ritimle."
                : "The toolbox grows, at an elegant pace."}
            </h2>
            <div>
              {changelog.map((e, i) => (
                <div
                  key={i}
                  className="toc-line py-[18px]"
                  style={{
                    borderBottom: "1px solid var(--rule)",
                    fontSize: 18,
                  }}
                >
                  <span
                    className="font-mono-kutu"
                    style={{ fontSize: 11, color: "var(--ink-4)", minWidth: 100 }}
                  >
                    {e.date}
                  </span>
                  <span
                    className="font-display"
                    style={{ fontSize: 20, letterSpacing: "-0.01em" }}
                  >
                    {e.title}
                  </span>
                  <span className="dots" />
                  <span className="kutu-chip" style={{ cursor: "default" }}>
                    {e.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Footer ─── */}
        <footer
          className="pt-[72px] pb-9"
          style={{
            borderTop: "2px solid var(--ink)",
            background: "var(--paper-2)",
          }}
        >
          <div className="mx-auto max-w-[1360px] px-6 md:px-10">
            <div className="grid md:grid-cols-2 gap-10 items-end mb-10">
              <div>
                <div className="flex items-center gap-3">
                  <KutuMark size={40} />
                  <div
                    className="font-display"
                    style={{ fontSize: 52, letterSpacing: "-0.03em", lineHeight: 1 }}
                  >
                    Kutu
                  </div>
                </div>
                <p
                  className="font-display-italic mt-3.5 max-w-[420px]"
                  style={{ fontSize: 20, color: "var(--ink-2)", lineHeight: 1.3, margin: "14px 0 0" }}
                >
                  {locale === "tr"
                    ? "Küçük, itinalı aletlerden oluşan sessiz bir atölye."
                    : "A quiet workshop of small, crafted instruments."}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-7 md:justify-self-end w-full md:max-w-[420px]">
                <div>
                  <div className="eyebrow mb-2.5">{locale === "tr" ? "Keşfet" : "Explore"}</div>
                  <ul className="list-none p-0 m-0 grid gap-1.5 text-sm">
                    <li>
                      <a href="#index" className="kutu-link">
                        {locale === "tr" ? "Dizin" : "Index"}
                      </a>
                    </li>
                    <li>
                      <a href="#philosophy" className="kutu-link">
                        {locale === "tr" ? "Felsefe" : "Philosophy"}
                      </a>
                    </li>
                    <li>
                      <a href="#changelog" className="kutu-link">
                        {locale === "tr" ? "Değişiklikler" : "Changelog"}
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <div className="eyebrow mb-2.5">{locale === "tr" ? "İletişim" : "Contact"}</div>
                  <ul className="list-none p-0 m-0 grid gap-1.5 text-sm">
                    <li>
                      <a
                        href="https://kutuyazilim.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="kutu-link"
                      >
                        kutuyazilim.org
                      </a>
                    </li>
                    <li>
                      <a href="mailto:info@kutuyazilim.org" className="kutu-link">
                        info@kutuyazilim.org
                      </a>
                    </li>
                    <li>
                      <span style={{ color: "var(--ink-2)" }}>İstanbul, TR</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <hr className="kutu-rule" />
            <div className="flex flex-wrap justify-between items-center gap-3 mt-5">
              <span className="font-mono-kutu text-[11px]" style={{ color: "var(--ink-4)" }}>
                © {new Date().getFullYear()} Kutu Yazılım ·{" "}
                {locale === "tr" ? "Tüm hakları saklıdır." : "All rights reserved."}
              </span>
              <span className="font-mono-kutu text-[11px]" style={{ color: "var(--ink-4)" }}>
                {TOOLS.length} {locale === "tr" ? "araç" : "tools"} · {CATEGORIES.length}{" "}
                {locale === "tr" ? "kategori" : "categories"} · Vol. I №04
              </span>
            </div>
          </div>
        </footer>
      </main>

      <style jsx>{`
        .kutu-link {
          color: var(--ink);
          text-decoration: none;
          border-bottom: 1px solid var(--rule);
          padding-bottom: 1px;
          transition: border-color 0.15s ease;
        }
        .kutu-link:hover {
          border-color: var(--ion);
        }
      `}</style>
    </div>
  )
}

type ToolRowProps = {
  tools: typeof TOOLS
  locale: "en" | "tr"
  isFavorite: (id: string) => boolean
  toggleFavorite: (id: string) => void
}

function CategorySection({
  roman,
  title,
  blurb,
  tools,
  count,
  locale,
  isFavorite,
  toggleFavorite,
}: ToolRowProps & {
  roman: string
  title: string
  blurb: string
  count: number
}) {
  return (
    <section
      className="py-16"
      style={{ borderBottom: "1px solid var(--rule)" }}
    >
      <div className="mx-auto max-w-[1360px] px-6 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
          <div className="flex items-start gap-5">
            <div
              className="num-roman"
              style={{
                fontSize: 64,
                lineHeight: 0.8,
                color: "var(--ion)",
              }}
            >
              {roman}.
            </div>
            <div>
              <div className="eyebrow mb-2">
                {locale === "tr" ? "Bölüm" : "Section"} · {count}{" "}
                {locale === "tr" ? "araç" : "tools"}
              </div>
              <h3
                className="font-display m-0"
                style={{
                  fontSize: "clamp(32px, 3.5vw, 48px)",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.05,
                }}
              >
                {title}
              </h3>
              <p
                className="font-display-italic mt-2 max-w-[560px]"
                style={{ fontSize: 18, color: "var(--ink-2)", lineHeight: 1.4 }}
              >
                {blurb}
              </p>
            </div>
          </div>
        </div>

        <ToolGrid
          tools={tools}
          locale={locale}
          isFavorite={isFavorite}
          toggleFavorite={toggleFavorite}
        />
      </div>
    </section>
  )
}

function FilteredGrid({
  tools,
  locale,
  isFavorite,
  toggleFavorite,
}: ToolRowProps) {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-[1360px] px-6 md:px-10">
        <div className="eyebrow mb-3">
          {locale === "tr" ? "Sonuçlar" : "Results"} · {tools.length}
        </div>
        {tools.length === 0 ? (
          <div className="py-20 text-center">
            <p
              className="font-display-italic"
              style={{ fontSize: 28, color: "var(--ink-3)" }}
            >
              {locale === "tr"
                ? "Hiç araç bulunamadı."
                : "No tools found."}
            </p>
          </div>
        ) : (
          <ToolGrid
            tools={tools}
            locale={locale}
            isFavorite={isFavorite}
            toggleFavorite={toggleFavorite}
          />
        )}
      </div>
    </section>
  )
}

function ToolGrid({ tools, locale, isFavorite, toggleFavorite }: ToolRowProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {tools.map((tool, i) => (
        <div key={tool.id} className="relative group/card">
          <Link href={tool.path} className="kutu-tile">
            <div
              className="font-mono-kutu"
              style={{
                fontSize: 10.5,
                color: "var(--ink-4)",
                letterSpacing: "0.08em",
              }}
            >
              № {String(i + 1).padStart(2, "0")}
            </div>
            <div
              className="font-display mt-1"
              style={{
                fontSize: 19,
                letterSpacing: "-0.01em",
                lineHeight: 1.15,
              }}
            >
              {getToolLabel(tool, locale)}
            </div>
            <p
              className="mt-auto pt-2.5"
              style={{ fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.45 }}
            >
              {getToolDescription(tool, locale)}
            </p>

            <ArrowUpRightIcon
              className="absolute top-4 right-4 size-4 transition-all"
              style={{ color: "var(--ink-4)" }}
            />
          </Link>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggleFavorite(tool.id)
            }}
            className={cn(
              "absolute bottom-3 right-3 p-1 rounded transition-opacity z-10",
              isFavorite(tool.id)
                ? "opacity-100"
                : "opacity-0 group-hover/card:opacity-100"
            )}
          >
            <StarIcon
              className={cn(
                "size-4",
                isFavorite(tool.id)
                  ? "fill-[var(--ion)] text-[var(--ion)]"
                  : "text-[var(--ink-4)] hover:text-[var(--ion)]"
              )}
            />
          </button>
        </div>
      ))}
      <style jsx>{`
        .group\\/card:hover .absolute.top-4.right-4 {
          color: var(--ion);
          transform: translate(3px, -3px);
        }
      `}</style>
    </div>
  )
}
