"use client"

import { use } from "react"
import { notFound } from "next/navigation"
import dynamic from "next/dynamic"
import { TOOLS } from "@/config/toolRegistry"
import { RelatedTools } from "@/components/common/RelatedTools"
import { BlogGuideLink } from "@/components/common/BlogGuideLink"
import { ToolFaq } from "@/components/common/ToolFaq"
import { TabLayout } from "@/components/layout/TabLayout"

// ---------------------------------------------------------------------------
// Sub-route component mapping: toolId -> subRouteId -> Component
// ---------------------------------------------------------------------------

const SUB_ROUTE_COMPONENTS: Record<string, Record<string, React.ComponentType>> = {
  json: {
    editor: dynamic(() => import("@/components/json/JsonEditor").then((m) => ({ default: m.JsonEditor })), { ssr: false }),
    diff: dynamic(() => import("@/components/json/JsonDiff").then((m) => ({ default: m.JsonDiff })), { ssr: false }),
  },
  jwt: {
    decode: dynamic(() => import("@/components/jwt/JwtDecode").then((m) => ({ default: m.JwtDecode })), { ssr: false }),
    forge: dynamic(() => import("@/components/jwt/JwtForge").then((m) => ({ default: m.JwtForge })), { ssr: false }),
  },
  encoder: {
    base64: dynamic(() => import("@/components/encoder/Base64Encoder").then((m) => ({ default: m.Base64Encoder })), { ssr: false }),
    url: dynamic(() => import("@/components/encoder/UrlEncoder").then((m) => ({ default: m.UrlEncoder })), { ssr: false }),
  },
  timeline: {
    priority: dynamic(() => import("@/components/timeline/PriorityTimeline").then((m) => ({ default: m.PriorityTimeline })), { ssr: false }),
    date: dynamic(() => import("@/components/timeline/DateTimeline").then((m) => ({ default: m.DateTimeline })), { ssr: false }),
  },
}

export function SubRouteClient({
  params,
}: {
  params: Promise<{ category: string; tool: string; sub: string }>
}) {
  const { category, tool: toolSlug, sub } = use(params)
  const toolPath = `/${category}/${toolSlug}`

  // Find the tool in registry
  const toolEntry = TOOLS.find((t) => t.path === toolPath)
  if (!toolEntry || !toolEntry.subRoutes) notFound()

  // Verify the sub-route is valid
  const validSub = toolEntry.subRoutes.find((s) => s.id === sub)
  if (!validSub) notFound()

  // Get the component
  const subComponents = SUB_ROUTE_COMPONENTS[toolEntry.id]
  const Component = subComponents?.[sub]
  if (!Component) notFound()

  return (
    <>
      <TabLayout
        tabs={toolEntry.subRoutes.map((s) => ({
          id: s.id,
          label: s.label,
          href: `${toolPath}/${s.id}`,
        }))}
        activeTab={sub}
      >
        <Component />
      </TabLayout>
      <BlogGuideLink toolId={toolEntry.id} />
      <ToolFaq toolId={toolEntry.id} />
      <RelatedTools />
    </>
  )
}
