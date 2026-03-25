"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  ChevronRightIcon,
  MoonIcon,
  SunIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  HomeIcon,
  BookOpenIcon,
  StarIcon,
  SearchIcon,
  XIcon,
  LanguagesIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/useTheme"
import { useFavorites } from "@/hooks/useFavorites"
import { cn } from "@/lib/utils"
import {
  CATEGORIES,
  TOOLS,
  getToolsByCategory,
  type CategoryId,
} from "@/config/toolRegistry"
import { useLocale } from "@/i18n/LocaleContext"
import { getToolLabel } from "@/i18n/toolTranslations"

const SIDEBAR_CATEGORIES_KEY = "sidebar-categories"

function loadCategoryState(): Record<string, boolean> {
  if (typeof window === "undefined") return {}
  try {
    const stored = localStorage.getItem(SIDEBAR_CATEGORIES_KEY)
    return stored ? (JSON.parse(stored) as Record<string, boolean>) : {}
  } catch {
    return {}
  }
}

function SidebarTooltip({
  label,
  show,
  children,
}: {
  label: string
  show: boolean
  children: React.ReactNode
}) {
  if (!show) return children
  return (
    <div className="relative group/tip w-full">
      {children}
      <div
        className={cn(
          "absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50",
          "px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap",
          "bg-primary text-primary-foreground shadow-md",
          "opacity-0 group-hover/tip:opacity-100 pointer-events-none",
          "transition-opacity duration-150"
        )}
      >
        {label}
      </div>
    </div>
  )
}

const navLinkClasses = (isActive: boolean, collapsed: boolean) =>
  cn(
    "relative w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
    "text-sidebar-foreground/60 hover:text-sidebar-foreground",
    "hover:bg-sidebar-accent/50",
    "transition-colors duration-150",
    isActive &&
      "bg-sidebar-accent dark:bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
    "before:absolute before:inset-y-1 before:left-0 before:w-[3px] before:rounded-full before:bg-sidebar-primary",
    "before:opacity-0 before:transition-opacity",
    isActive && "before:opacity-100",
    collapsed ? "justify-center px-0" : "justify-start"
  )

export function AppSidebar() {
  const { isDark, toggleTheme } = useTheme()
  const [favoriteIds, toggleFavorite, isFavorite] = useFavorites()
  const { locale, setLocale, t } = useLocale()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return true
    const stored = localStorage.getItem("sidebar-collapsed")
    return stored !== null ? stored === "true" : true
  })
  const [categoryOpen, setCategoryOpen] = useState<Record<string, boolean>>(
    () => loadCategoryState()
  )

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed))
  }, [collapsed])

  useEffect(() => {
    localStorage.setItem(SIDEBAR_CATEGORIES_KEY, JSON.stringify(categoryOpen))
  }, [categoryOpen])

  // Auto-expand category that contains the active route
  useEffect(() => {
    for (const cat of CATEGORIES) {
      if (pathname.startsWith(cat.path)) {
        setCategoryOpen((prev) => {
          if (prev[cat.id]) return prev
          return { ...prev, [cat.id]: true }
        })
        break
      }
    }
  }, [pathname])

  const toggleCategory = useCallback((id: string) => {
    setCategoryOpen((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const [searchQuery, setSearchQuery] = useState("")

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return null
    const q = searchQuery.toLowerCase()
    return TOOLS.filter(
      (tool) =>
        tool.label.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        getToolLabel(tool, locale).toLowerCase().includes(q)
    )
  }, [searchQuery, locale])

  const favoriteTools = favoriteIds
    .map((id) => TOOLS.find((t) => t.id === id))
    .filter(Boolean)

  return (
    <aside
      className={cn(
        "h-full hidden md:flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        "transition-[width] duration-200 ease-in-out flex-shrink-0 overflow-hidden",
        collapsed ? "w-[60px]" : "w-[200px]"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-2.5 h-14 border-b border-sidebar-border flex-shrink-0 px-3",
          collapsed ? "justify-center" : "justify-start"
        )}
      >
        <img
          src="/LogoOnlyCircularSVG.svg"
          alt="Tool BOX logo"
          className="h-8 w-8 flex-shrink-0"
        />
        <span
          className={cn(
            "text-sm font-semibold text-sidebar-foreground whitespace-nowrap transition-opacity duration-150",
            collapsed ? "opacity-0 w-0" : "opacity-100"
          )}
        >
          Tool BOX
        </span>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-2 pt-2 flex-shrink-0">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-sidebar-foreground/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.common.search}
              className="w-full h-8 pl-8 pr-7 rounded-md border border-sidebar-border bg-sidebar text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:outline-none focus:border-sidebar-ring"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sidebar-foreground/40 hover:text-sidebar-foreground"
              >
                <XIcon className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-1.5">
        <div className="flex flex-col gap-0.5 w-full">
          {/* Search results */}
          {filteredTools !== null ? (
            <>
              <div className="px-3 py-1.5 text-xs font-medium text-sidebar-foreground/40 uppercase tracking-wider">
                {t.common.results} ({filteredTools.length})
              </div>
              {filteredTools.length === 0 ? (
                <div className="px-3 py-4 text-xs text-sidebar-foreground/40 text-center">
                  {t.common.noResults}
                </div>
              ) : (
                filteredTools.map((tool) => {
                  const ToolIcon = tool.icon
                  const isActive = pathname.startsWith(tool.path)
                  return (
                    <Link
                      key={tool.id}
                      href={tool.path}
                      onClick={() => setSearchQuery("")}
                      className={cn(
                        "relative w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                        "text-sidebar-foreground/60 hover:text-sidebar-foreground",
                        "hover:bg-sidebar-accent/50 transition-colors duration-150",
                        isActive &&
                          "bg-sidebar-accent dark:bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                      )}
                    >
                      <ToolIcon className="size-[16px] flex-shrink-0" />
                      <span className="truncate">{getToolLabel(tool, locale)}</span>
                    </Link>
                  )
                })
              )}
            </>
          ) : (
          <>
          {/* Home */}
          <SidebarTooltip label={t.common.home} show={collapsed}>
            <Link
              href="/"
              className={navLinkClasses(pathname === "/", collapsed)}
            >
              <HomeIcon className="size-[18px] flex-shrink-0" />
              {!collapsed && <span className="truncate">{t.common.home}</span>}
            </Link>
          </SidebarTooltip>

          {/* Blog */}
          <SidebarTooltip label={t.common.blog} show={collapsed}>
            <Link
              href="/blog"
              className={navLinkClasses(pathname === "/blog", collapsed)}
            >
              <BookOpenIcon className="size-[18px] flex-shrink-0" />
              {!collapsed && <span className="truncate">{t.common.blog}</span>}
            </Link>
          </SidebarTooltip>

          {/* Divider */}
          <div className="h-px bg-sidebar-border my-1.5 mx-1" />

          {/* Favorites section */}
          {favoriteTools.length > 0 && !collapsed && (
            <>
              <div className="px-3 py-1.5 text-xs font-medium text-sidebar-foreground/40 uppercase tracking-wider">
                {t.common.favorites}
              </div>
              {favoriteTools.map((tool) => {
                if (!tool) return null
                const ToolIcon = tool.icon
                const isActive = pathname.startsWith(tool.path)
                return (
                  <SidebarTooltip key={tool.id} label={getToolLabel(tool, locale)} show={collapsed}>
                    <div className="group/fav relative">
                      <Link
                        href={tool.path}
                        className={cn(
                          "relative w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                          "text-sidebar-foreground/60 hover:text-sidebar-foreground",
                          "hover:bg-sidebar-accent/50 transition-colors duration-150",
                          isActive &&
                            "bg-sidebar-accent dark:bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                        )}
                      >
                        <ToolIcon className="size-[16px] flex-shrink-0" />
                        <span className="truncate flex-1">{getToolLabel(tool, locale)}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleFavorite(tool.id)
                          }}
                          className="shrink-0"
                        >
                          <StarIcon className="size-3.5 fill-yellow-500 text-yellow-500" />
                        </button>
                      </Link>
                    </div>
                  </SidebarTooltip>
                )
              })}
              <div className="h-px bg-sidebar-border my-1.5 mx-1" />
            </>
          )}

          {/* Favorites collapsed - show star icon */}
          {favoriteTools.length > 0 && collapsed && (
            <>
              <SidebarTooltip label={t.common.favorites} show={collapsed}>
                <div className="flex items-center justify-center py-2.5">
                  <StarIcon className="size-[18px] fill-yellow-500 text-yellow-500" />
                </div>
              </SidebarTooltip>
              <div className="h-px bg-sidebar-border my-1.5 mx-1" />
            </>
          )}

          {/* Categories */}
          {CATEGORIES.map((category) => {
            const tools = getToolsByCategory(category.id as CategoryId)
            const isOpen = categoryOpen[category.id] ?? false
            const CategoryIcon = category.icon
            const isCategoryActive = pathname === category.path

            return (
              <div key={category.id}>
                {/* Category header */}
                <SidebarTooltip label={t.categories[category.id as keyof typeof t.categories] ?? category.label} show={collapsed}>
                  <div
                    className={cn(
                      "w-full flex items-center rounded-lg text-sm font-medium",
                      "text-sidebar-foreground/60 hover:text-sidebar-foreground",
                      "hover:bg-sidebar-accent/50 transition-colors duration-150",
                      collapsed ? "justify-center px-0" : "justify-start"
                    )}
                  >
                    {collapsed ? (
                      <Link
                        href={category.path}
                        className={cn(
                          "flex items-center justify-center w-full py-2.5",
                          isCategoryActive && "text-sidebar-accent-foreground"
                        )}
                      >
                        <CategoryIcon className="size-[18px] flex-shrink-0" />
                      </Link>
                    ) : (
                      <>
                        <Link
                          href={category.path}
                          className="flex-1 flex items-center gap-3 px-3 py-2.5 min-w-0"
                        >
                          <CategoryIcon className="size-[18px] flex-shrink-0" />
                          <span className="truncate">{t.categories[category.id as keyof typeof t.categories] ?? category.label}</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggleCategory(category.id)}
                          className="flex items-center justify-center px-2 py-2.5 flex-shrink-0"
                        >
                          <ChevronRightIcon
                            className={cn(
                              "size-3.5 transition-transform duration-150",
                              isOpen && "rotate-90"
                            )}
                          />
                        </button>
                      </>
                    )}
                  </div>
                </SidebarTooltip>

                {/* Tool links */}
                {!collapsed && isOpen && (
                  <div className="ml-4 flex flex-col gap-0.5 mt-0.5">
                    {tools.map((tool) => {
                      const { id, icon: ToolIcon, path } = tool
                      const translatedLabel = getToolLabel(tool, locale)
                      const isToolActive = pathname.startsWith(path)
                      return (
                        <SidebarTooltip key={id} label={translatedLabel} show={collapsed}>
                          <div className="group/fav relative">
                            <Link
                              href={path}
                              className={cn(
                                "relative w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                                "text-sidebar-foreground/60 hover:text-sidebar-foreground",
                                "hover:bg-sidebar-accent/50 transition-colors duration-150",
                                isToolActive &&
                                  "bg-sidebar-accent dark:bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                              )}
                            >
                              <ToolIcon className="size-[16px] flex-shrink-0" />
                              <span className="truncate flex-1">{translatedLabel}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  toggleFavorite(id)
                                }}
                                className={cn(
                                  "shrink-0 transition-opacity",
                                  isFavorite(id)
                                    ? "opacity-100"
                                    : "opacity-0 group-hover/fav:opacity-100"
                                )}
                              >
                                <StarIcon
                                  className={cn(
                                    "size-3.5",
                                    isFavorite(id)
                                      ? "fill-yellow-500 text-yellow-500"
                                      : "text-sidebar-foreground/40 hover:text-yellow-500"
                                  )}
                                />
                              </button>
                            </Link>
                          </div>
                        </SidebarTooltip>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
          </>
          )}
        </div>
      </nav>

      {/* Bottom controls */}
      <div className="border-t border-sidebar-border p-1.5 flex flex-col gap-0.5 flex-shrink-0">
        <SidebarTooltip label={locale === "tr" ? "EN" : "TR"} show={collapsed}>
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "default"}
            onClick={() => setLocale(locale === "en" ? "tr" : "en")}
            className={cn(
              "w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-lg",
              collapsed
                ? "justify-center"
                : "justify-start gap-3 px-3"
            )}
          >
            <LanguagesIcon className="size-[18px] flex-shrink-0" />
            {!collapsed && (
              <span className="text-sm">
                {locale === "en" ? "TR" : "EN"}
              </span>
            )}
          </Button>
        </SidebarTooltip>

        <SidebarTooltip label={isDark ? t.common.lightMode : t.common.darkMode} show={collapsed}>
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "default"}
            onClick={toggleTheme}
            className={cn(
              "w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-lg",
              collapsed
                ? "justify-center"
                : "justify-start gap-3 px-3"
            )}
          >
            {isDark ? (
              <SunIcon className="size-[18px] flex-shrink-0" />
            ) : (
              <MoonIcon className="size-[18px] flex-shrink-0" />
            )}
            {!collapsed && (
              <span className="text-sm">
                {isDark ? t.common.lightMode : t.common.darkMode}
              </span>
            )}
          </Button>
        </SidebarTooltip>

        <SidebarTooltip label={collapsed ? t.common.expand : t.common.collapse} show={collapsed}>
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "default"}
            onClick={() => setCollapsed((prev) => !prev)}
            className={cn(
              "w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-lg",
              collapsed
                ? "justify-center"
                : "justify-start gap-3 px-3"
            )}
          >
            {collapsed ? (
              <PanelLeftOpenIcon className="size-[18px] flex-shrink-0" />
            ) : (
              <PanelLeftCloseIcon className="size-[18px] flex-shrink-0" />
            )}
            {!collapsed && <span className="text-sm">{t.common.collapse}</span>}
          </Button>
        </SidebarTooltip>
      </div>
    </aside>
  )
}
