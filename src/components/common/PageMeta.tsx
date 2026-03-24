import { useLocation } from "react-router"
import { TOOLS, CATEGORIES } from "@/config/toolRegistry"
import { usePageMeta } from "@/hooks/usePageMeta"

export function PageMeta() {
  const { pathname } = useLocation()
  const tool = TOOLS.find((t) => t.path === pathname)
  const category = CATEGORIES.find((c) => c.path === pathname)

  usePageMeta(
    tool?.label ?? category?.label,
    tool?.description ?? (category ? `${category.label} tools` : undefined),
  )

  return null
}
