import { Outlet, useLocation } from "react-router"
import { RelatedTools } from "@/components/common/RelatedTools"
import { BlogGuideLink } from "@/components/common/BlogGuideLink"
import { ToolFaq } from "@/components/common/ToolFaq"
import { TOOLS } from "@/config/toolRegistry"

export function CategoryLayout() {
  const { pathname } = useLocation()
  const tool = TOOLS.find((t) => t.path === pathname)

  return (
    <>
      <Outlet />
      {tool && (
        <>
          <BlogGuideLink toolId={tool.id} />
          <ToolFaq toolId={tool.id} />
          <RelatedTools />
        </>
      )}
    </>
  )
}
