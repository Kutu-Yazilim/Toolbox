import { TOOLS } from "@/config/toolRegistry"
import { SubRouteClient } from "./client"

export function generateStaticParams() {
  const params: { category: string; tool: string; sub: string }[] = []

  for (const tool of TOOLS) {
    if (!tool.subRoutes) continue
    const parts = tool.path.split("/").filter(Boolean)
    if (parts.length < 2) continue

    for (const sub of tool.subRoutes) {
      params.push({
        category: parts[0],
        tool: parts[1],
        sub: sub.id,
      })
    }
  }

  return params
}

export default function SubRoutePage({
  params,
}: {
  params: Promise<{ category: string; tool: string; sub: string }>
}) {
  return <SubRouteClient params={params} />
}
