"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRightIcon } from "lucide-react"
import { TOOLS, CATEGORIES } from "@/config/toolRegistry"

export function Breadcrumbs() {
  const pathname = usePathname()
  const tool = TOOLS.find((t) => pathname.startsWith(t.path))

  if (!tool) return null

  const category = CATEGORIES.find((c) => c.id === tool.categoryId)
  if (!category) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1 px-4 pt-2 text-xs text-muted-foreground"
    >
      <Link href="/" className="hover:text-foreground transition-colors">
        ToolBox
      </Link>
      <ChevronRightIcon className="size-3" />
      <Link href={category.path} className="hover:text-foreground transition-colors">
        {category.label}
      </Link>
      <ChevronRightIcon className="size-3" />
      <span className="text-foreground font-medium">{tool.label}</span>
    </nav>
  )
}
