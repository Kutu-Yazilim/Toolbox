import type { Metadata } from "next"
import { CATEGORIES, getToolsByCategory, type CategoryId } from "@/config/toolRegistry"
import { CategoryPageClient } from "./client"

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "dev-tools": "Free online developer tools: JSON formatter, regex tester, SQL formatter, API client, cron builder, and more. No sign-ups required.",
  "converters": "Free online converters: Base64, timestamps, YAML/JSON, number bases, color formats, unit converter. Runs entirely in your browser.",
  "generators": "Free online generators: QR codes, UUIDs, lorem ipsum, JWT tokens, fake data, hashes, and URL slugs. No installation needed.",
  "design": "Free online design tools: color palettes, gradients, box shadows, icon editor, mockup generator, shape maker, and timeline creator.",
  "network": "Free online network tools: DNS lookup, IP checker, SSL certificate inspector, and HTTP headers analyzer. Fast and private.",
  "pdf": "Free online PDF tools: merge, split, compress, reorder, watermark PDFs. Convert JPG, PNG, DOCX, PPTX, XLSX, CSV, HTML, and Markdown to PDF.",
  "security": "Free online security tools: password generator, text encryption, certificate decoder, TOTP generator, and CSP builder.",
  "data-tools": "Free online data tools: CSV viewer, JSON path explorer, data transformer, SQL playground, and chart builder. Process data in your browser.",
  "image-tools": "Free online image tools: resize, crop, compress, convert formats, pick colors, generate placeholders, favicons, and encode to Base64.",
  "fun": "Free online fun tools: spin the wheel, coin flip, dice roller, random picker, tournament brackets, team shuffler, and more.",
}

export function generateStaticParams() {
  return CATEGORIES.map((cat) => ({
    category: cat.path.replace("/", ""),
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category } = await params
  const cat = CATEGORIES.find((c) => c.path === `/${category}`)
  if (!cat) return {}

  const tools = getToolsByCategory(cat.id as CategoryId)
  const title = `${cat.label} — ${tools.length} Free Online Tools`
  const description = CATEGORY_DESCRIPTIONS[cat.id] ?? `Free online ${cat.label.toLowerCase()} at ToolBox by Kutu Yazilim. ${tools.length} tools, no sign-ups.`

  return {
    title,
    description,
    keywords: tools.flatMap((t) => t.keywords ?? []).slice(0, 20),
    alternates: { canonical: `https://toolbox.kutuyazilim.org${cat.path}` },
    openGraph: {
      title,
      description,
      url: `https://toolbox.kutuyazilim.org${cat.path}`,
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  return <CategoryPageClient params={params} />
}
