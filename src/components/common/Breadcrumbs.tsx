import { Link, useLocation } from "react-router"
import { ChevronRightIcon } from "lucide-react"
import { TOOLS, CATEGORIES } from "@/config/toolRegistry"

export function Breadcrumbs() {
  const { pathname } = useLocation()
  const tool = TOOLS.find((t) => t.path === pathname)

  if (!tool) return null

  const category = CATEGORIES.find((c) => c.id === tool.categoryId)
  if (!category) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1 px-4 pt-2 text-xs text-muted-foreground"
    >
      <Link to="/" className="hover:text-foreground transition-colors">
        ToolBox
      </Link>
      <ChevronRightIcon className="size-3" />
      <Link to={category.path} className="hover:text-foreground transition-colors">
        {category.label}
      </Link>
      <ChevronRightIcon className="size-3" />
      <span className="text-foreground font-medium">{tool.label}</span>
    </nav>
  )
}
