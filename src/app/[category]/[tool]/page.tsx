import { TOOLS } from "@/config/toolRegistry"
import { ToolPageClient } from "./client"

export function generateStaticParams() {
  const params: { category: string; tool: string }[] = []

  for (const tool of TOOLS) {
    const parts = tool.path.split("/").filter(Boolean)
    if (parts.length >= 2) {
      params.push({ category: parts[0], tool: parts[1] })

      // For tools with sub-routes, the base path should also be generated
      // Sub-routes are handled in [category]/[tool]/[sub]/page.tsx
    }
  }

  return params
}

export default function ToolPage({
  params,
}: {
  params: Promise<{ category: string; tool: string }>
}) {
  return <ToolPageClient params={params} />
}
