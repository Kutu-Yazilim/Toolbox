import { Link } from "react-router"
import { TOOLS } from "@/config/toolRegistry"
import { cn } from "@/lib/utils"

export function WelcomePage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 py-8 md:px-8 md:py-12">
        {/* Hero */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <img
              src="/LogoOnlyCircularSVG.svg"
              alt="Tool BOX logo"
              className="h-14 w-14"
            />
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Tool BOX
              </h1>
              <p className="text-muted-foreground text-base mt-0.5">
                A collection of developer utilities, all in one place.
              </p>
            </div>
          </div>
        </div>

        {/* Tool grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TOOLS.map(({ id, label, description, icon: Icon, path }) => (
            <Link
              key={id}
              to={path}
              className={cn(
                "group text-left rounded-xl border border-border p-5",
                "bg-card hover:bg-accent/50 dark:hover:bg-accent/30",
                "transition-all duration-150",
                "hover:border-foreground/20 hover:-translate-y-0.5 hover:shadow-md",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "flex items-center justify-center rounded-lg size-10 flex-shrink-0",
                    "bg-muted text-foreground/70 group-hover:text-foreground",
                    "transition-colors duration-150"
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    {label}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
