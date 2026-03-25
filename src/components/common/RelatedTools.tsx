"use client"

import { useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { TOOLS, CATEGORIES, getToolsByCategory } from "@/config/toolRegistry"

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr]
  let s = seed
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647
    const j = s % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

const MAX_RELATED = 6

export function RelatedTools() {
  const pathname = usePathname()

  const { tool, category, related } = useMemo(() => {
    const currentTool = TOOLS.find((t) => pathname.startsWith(t.path))
    if (!currentTool) return { tool: null, category: null, related: [] }

    const cat = CATEGORIES.find((c) => c.id === currentTool.categoryId)
    const siblings = getToolsByCategory(currentTool.categoryId).filter(
      (t) => t.id !== currentTool.id,
    )

    const seed = currentTool.id.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    const shuffled = seededShuffle(siblings, seed)

    return {
      tool: currentTool,
      category: cat,
      related: shuffled.slice(0, MAX_RELATED),
    }
  }, [pathname])

  if (!tool || !category || related.length === 0) return null

  return (
    <section className="border-t border-border/60 bg-card/50 px-4 py-6">
      <div className="mx-auto max-w-4xl space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          More {category.label} Tools
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((t) => (
            <Link
              key={t.id}
              href={t.path}
              className="group flex items-start gap-2 rounded-lg border border-border/40 bg-background p-3 transition-all hover:border-primary/30 hover:shadow-sm"
            >
              <t.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
              <div className="min-w-0">
                <span className="text-sm font-medium">{t.label}</span>
                <p className="truncate text-xs text-muted-foreground">
                  {t.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
