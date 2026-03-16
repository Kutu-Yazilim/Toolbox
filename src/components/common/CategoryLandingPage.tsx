import { Link, useLocation } from "react-router"
import { getCategoryByPath, getToolsByCategory } from "@/config/toolRegistry"

export function CategoryLandingPage() {
  const location = useLocation()
  const category = getCategoryByPath(location.pathname)

  if (!category) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Category not found.</p>
      </div>
    )
  }

  const tools = getToolsByCategory(category.id)
  const CategoryIcon = category.icon

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <CategoryIcon className="size-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold">{category.label}</h1>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              to={tool.path}
              className="group flex flex-col items-start gap-2 rounded-xl border border-border/60 bg-card p-4 text-left shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <tool.icon className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
                <span className="text-sm font-semibold">{tool.label}</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {tool.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
