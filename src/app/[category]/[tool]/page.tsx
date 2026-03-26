import type { Metadata } from "next"
import { TOOLS, CATEGORIES } from "@/config/toolRegistry"
import { ToolPageClient } from "./client"

export function generateStaticParams() {
  const params: { category: string; tool: string }[] = []

  for (const tool of TOOLS) {
    const parts = tool.path.split("/").filter(Boolean)
    if (parts.length >= 2) {
      params.push({ category: parts[0], tool: parts[1] })
    }
  }

  return params
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; tool: string }>
}): Promise<Metadata> {
  const { category, tool: toolSlug } = await params
  const toolEntry = TOOLS.find((t) => t.path === `/${category}/${toolSlug}`)
  if (!toolEntry) return {}

  const cat = CATEGORIES.find((c) => c.id === toolEntry.categoryId)
  const title = `${toolEntry.label} — Free Online ${cat?.label ?? "Tool"}`
  const description = toolEntry.description

  return {
    title,
    description,
    keywords: toolEntry.keywords,
    alternates: { canonical: `https://toolbox.kutuyazilim.org${toolEntry.path}` },
    openGraph: {
      title: `${title} - ToolBox by Kutu Yazilim`,
      description,
      url: `https://toolbox.kutuyazilim.org${toolEntry.path}`,
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
    other: {
      "application-name": "ToolBox by Kutu Yazilim",
    },
  }
}

function ToolJsonLd({ category, toolSlug }: { category: string; toolSlug: string }) {
  const toolEntry = TOOLS.find((t) => t.path === `/${category}/${toolSlug}`)
  if (!toolEntry) return null

  const cat = CATEGORIES.find((c) => c.id === toolEntry.categoryId)
  const baseUrl = "https://toolbox.kutuyazilim.org"

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "ToolBox",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: cat?.label ?? category,
        item: `${baseUrl}/${category}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: toolEntry.label,
        item: `${baseUrl}${toolEntry.path}`,
      },
    ],
  }

  const softwareLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${toolEntry.label} — ToolBox by Kutu Yazilim`,
    description: toolEntry.description,
    url: `${baseUrl}${toolEntry.path}`,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    creator: {
      "@type": "Organization",
      name: "Kutu Yazilim",
      url: "https://kutuyazilim.org",
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareLd) }}
      />
    </>
  )
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ category: string; tool: string }>
}) {
  const { category, tool: toolSlug } = await params
  return (
    <>
      <ToolJsonLd category={category} toolSlug={toolSlug} />
      <ToolPageClient params={params} />
    </>
  )
}
