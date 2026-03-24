import { useState, useMemo, useEffect, useRef } from "react"
import { Link } from "react-router"
import { SearchIcon } from "lucide-react"
import { TOOLS, CATEGORIES, type CategoryId } from "@/config/toolRegistry"
import { cn } from "@/lib/utils"

export function WelcomePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<CategoryId | "all">(
    "all"
  )
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  const toolCountByCategory = useMemo(() => {
    const counts: Record<string, number> = { all: TOOLS.length }
    for (const cat of CATEGORIES) {
      counts[cat.id] = TOOLS.filter((t) => t.categoryId === cat.id).length
    }
    return counts
  }, [])

  const filteredTools = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return TOOLS.filter((tool) => {
      const matchesCategory =
        activeCategory === "all" || tool.categoryId === activeCategory
      const matchesSearch =
        !query ||
        tool.label.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [searchQuery, activeCategory])

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 py-6 md:px-8">
        {/* Hero */}
        <div className="flex flex-col items-center text-center gap-3 mb-6">
          <div className="flex items-center gap-3">
            <img
              src="/LogoOnlyCircularSVG.svg"
              alt="ToolBox logo"
              className="size-16 rounded-full"
            />
            <div className="text-left">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                ToolBox
              </h1>
              <p className="text-sm text-muted-foreground">by Kutu Yazılım</p>
            </div>
          </div>
          <p className="text-lg text-muted-foreground">
            {TOOLS.length}+ free tools. Zero sign-ups. Runs in your browser.
          </p>
          <div className="relative w-full max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2.5",
                "text-sm text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring"
              )}
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              activeCategory === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            All ({toolCountByCategory.all})
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {cat.label} ({toolCountByCategory[cat.id]})
            </button>
          ))}
        </div>

        {/* Tool grid */}
        {filteredTools.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No tools found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredTools.map((tool) => (
              <Link
                key={tool.id}
                to={tool.path}
                className={cn(
                  "rounded-lg border border-border p-3",
                  "flex items-start gap-3",
                  "hover:border-primary/50 transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                <tool.icon className="size-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground">
                    {tool.label}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {tool.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-xs text-muted-foreground">
            ToolBox by Kutu Yazılım
          </p>
        </div>
      </div>
    </div>
  )
}
