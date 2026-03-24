import { Outlet, useLocation } from "react-router"
import { RelatedTools } from "@/components/common/RelatedTools"
import { TOOLS } from "@/config/toolRegistry"

export function CategoryLayout() {
  const { pathname } = useLocation()
  const isToolPage = TOOLS.some((t) => t.path === pathname)

  return (
    <>
      <Outlet />
      {isToolPage && <RelatedTools />}
    </>
  )
}
