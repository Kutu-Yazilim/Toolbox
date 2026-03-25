"use client"

import { useEffect, useMemo, useState } from "react"
import {
  HomeIcon,
  MenuIcon,
  MoonIcon,
  SunIcon,
  XIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTheme } from "@/hooks/useTheme"
import {
  CATEGORIES,
  TOOLS,
  getToolsByCategory,
  type CategoryId,
} from "@/config/toolRegistry"
import { useLocale } from "@/i18n/LocaleContext"
import { getToolLabel } from "@/i18n/toolTranslations"

export function MobileNav() {
  const { isDark, toggleTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { locale, t } = useLocale()

  const activeItem = useMemo(() => {
    const tool = TOOLS.find((t) => pathname.startsWith(t.path))
    if (tool) return { label: getToolLabel(tool, locale), icon: tool.icon }
    const category = CATEGORIES.find((c) =>
      pathname.startsWith(c.path)
    )
    if (category) return { label: t.categories[category.id as keyof typeof t.categories] ?? category.label, icon: category.icon }
    return { label: t.common.home, icon: HomeIcon }
  }, [pathname, locale, t])

  useEffect(() => {
    if (!open) return

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleEsc)

    return () => {
      window.removeEventListener("keydown", handleEsc)
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  const ActiveIcon = activeItem.icon

  return (
    <>
      <div className="h-12 fixed top-0 inset-x-0 z-50 md:hidden border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="h-full grid grid-cols-[48px_1fr_48px] items-center">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setOpen((prev) => !prev)}
            aria-label={open ? "Close navigation" : "Open navigation"}
            className="justify-self-center"
          >
            {open ? <XIcon className="h-4 w-4" /> : <MenuIcon className="h-4 w-4" />}
          </Button>

          <div className="flex items-center justify-center gap-2 min-w-0">
            <ActiveIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <span className="text-xs font-medium truncate">{activeItem.label}</span>
          </div>

          <Button
            variant="ghost"
            size="icon-xs"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="justify-self-center"
          >
            {isDark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close navigation sheet"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50"
          />

          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl border border-border bg-background max-h-[80vh] overflow-hidden">
            <div className="overflow-y-auto p-3 pb-4">
              {/* Home */}
              <div className="px-1 pb-2">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 h-auto px-3 py-2.5 rounded-lg border border-border bg-card/40",
                    pathname === "/" &&
                      "bg-primary text-primary-foreground border-primary"
                  )}
                >
                  <HomeIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="text-xs font-medium truncate">{t.common.home}</span>
                </Link>
              </div>

              {/* Categories */}
              {CATEGORIES.map((category) => {
                const tools = getToolsByCategory(category.id as CategoryId)
                return (
                  <div key={category.id} className="mb-3">
                    <div className="px-4 pt-2 pb-1.5">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {t.categories[category.id as keyof typeof t.categories] ?? category.label}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {tools.map((tool) => (
                        <Link
                          key={tool.id}
                          href={tool.path}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center gap-2 h-auto px-3 py-2.5 justify-start rounded-lg border border-border bg-card/40",
                            pathname.startsWith(tool.path) &&
                              "bg-primary text-primary-foreground border-primary"
                          )}
                        >
                          <tool.icon className="h-4 w-4 flex-shrink-0" />
                          <span className="text-xs font-medium truncate">
                            {getToolLabel(tool, locale)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
