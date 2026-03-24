import { useMemo } from "react"
import { useLocation } from "react-router"
import { TOOLS, CATEGORIES, getToolsByCategory } from "@/config/toolRegistry"
import { usePageMeta, useCanonicalUrl, useJsonLd } from "@/hooks/usePageMeta"

const BASE_URL = "https://toolbox.kutuyazilim.org"

export function PageMeta() {
  const { pathname } = useLocation()
  const tool = TOOLS.find((t) => t.path === pathname)
  const category = CATEGORIES.find((c) => c.path === pathname)

  usePageMeta(
    tool?.label ?? category?.label,
    tool?.description ?? (category ? `${category.label} tools` : undefined),
  )

  useCanonicalUrl(pathname === "/" ? "" : pathname)

  const jsonLdData = useMemo(() => {
    if (tool) {
      const toolCategory = CATEGORIES.find((c) => c.id === tool.categoryId)
      const softwareApp = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: tool.label,
        description: tool.description,
        url: `${BASE_URL}${tool.path}`,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Any",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        author: {
          "@type": "Organization",
          name: "Kutu Yazilim",
        },
      }
      const breadcrumbList = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "ToolBox",
            item: BASE_URL,
          },
          ...(toolCategory
            ? [
                {
                  "@type": "ListItem",
                  position: 2,
                  name: toolCategory.label,
                  item: `${BASE_URL}${toolCategory.path}`,
                },
              ]
            : []),
          {
            "@type": "ListItem",
            position: toolCategory ? 3 : 2,
            name: tool.label,
            item: `${BASE_URL}${tool.path}`,
          },
        ],
      }
      return [softwareApp, breadcrumbList]
    }

    if (category) {
      const categoryTools = getToolsByCategory(category.id)
      return [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${category.label} Tools`,
          url: `${BASE_URL}${category.path}`,
          hasPart: categoryTools.map((t) => ({
            "@type": "SoftwareApplication",
            name: t.label,
            description: t.description,
            url: `${BASE_URL}${t.path}`,
          })),
        },
      ]
    }

    return null
  }, [tool, category, pathname])

  useJsonLd(jsonLdData)

  return null
}
