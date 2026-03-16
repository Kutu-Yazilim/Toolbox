import { useState, useEffect, useCallback } from "react"
import {
  ChevronRightIcon,
  MoonIcon,
  SunIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  HomeIcon,
} from "lucide-react"
import { NavLink, useLocation } from "react-router"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/useTheme"
import { cn } from "@/lib/utils"
import {
  CATEGORIES,
  getToolsByCategory,
  type CategoryId,
} from "@/config/toolRegistry"

const SIDEBAR_CATEGORIES_KEY = "sidebar-categories"

function loadCategoryState(): Record<string, boolean> {
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
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(() => {
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
      if (location.pathname.startsWith(cat.path)) {
        setCategoryOpen((prev) => {
          if (prev[cat.id]) return prev
          return { ...prev, [cat.id]: true }
        })
        break
      }
    }
  }, [location.pathname])

  const toggleCategory = useCallback((id: string) => {
    setCategoryOpen((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

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

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-1.5">
        <div className="flex flex-col gap-0.5 w-full">
          {/* Home */}
          <SidebarTooltip label="Home" show={collapsed}>
            <NavLink
              to="/"
              end
              className={({ isActive }) => navLinkClasses(isActive, collapsed)}
            >
              <HomeIcon className="size-[18px] flex-shrink-0" />
              {!collapsed && <span className="truncate">Home</span>}
            </NavLink>
          </SidebarTooltip>

          {/* Divider */}
          <div className="h-px bg-sidebar-border my-1.5 mx-1" />

          {/* Categories */}
          {CATEGORIES.map((category) => {
            const tools = getToolsByCategory(category.id as CategoryId)
            const isOpen = categoryOpen[category.id] ?? false
            const CategoryIcon = category.icon

            return (
              <div key={category.id}>
                {/* Category header */}
                <SidebarTooltip label={category.label} show={collapsed}>
                  <div
                    className={cn(
                      "w-full flex items-center rounded-lg text-sm font-medium",
                      "text-sidebar-foreground/60 hover:text-sidebar-foreground",
                      "hover:bg-sidebar-accent/50 transition-colors duration-150",
                      collapsed ? "justify-center px-0" : "justify-start"
                    )}
                  >
                    {collapsed ? (
                      <NavLink
                        to={category.path}
                        end
                        className={({ isActive }) =>
                          cn(
                            "flex items-center justify-center w-full py-2.5",
                            isActive && "text-sidebar-accent-foreground"
                          )
                        }
                      >
                        <CategoryIcon className="size-[18px] flex-shrink-0" />
                      </NavLink>
                    ) : (
                      <>
                        <NavLink
                          to={category.path}
                          end
                          className="flex-1 flex items-center gap-3 px-3 py-2.5 min-w-0"
                        >
                          <CategoryIcon className="size-[18px] flex-shrink-0" />
                          <span className="truncate">{category.label}</span>
                        </NavLink>
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
                    {tools.map(({ id, label, icon: ToolIcon, path }) => (
                      <SidebarTooltip key={id} label={label} show={collapsed}>
                        <NavLink
                          to={path}
                          className={({ isActive }) =>
                            cn(
                              "relative w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                              "text-sidebar-foreground/60 hover:text-sidebar-foreground",
                              "hover:bg-sidebar-accent/50 transition-colors duration-150",
                              isActive &&
                                "bg-sidebar-accent dark:bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                            )
                          }
                        >
                          <ToolIcon className="size-[16px] flex-shrink-0" />
                          <span className="truncate">{label}</span>
                        </NavLink>
                      </SidebarTooltip>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </nav>

      {/* Bottom controls */}
      <div className="border-t border-sidebar-border p-1.5 flex flex-col gap-0.5 flex-shrink-0">
        <SidebarTooltip label={isDark ? "Light mode" : "Dark mode"} show={collapsed}>
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
                {isDark ? "Light mode" : "Dark mode"}
              </span>
            )}
          </Button>
        </SidebarTooltip>

        <SidebarTooltip label={collapsed ? "Expand sidebar" : "Collapse"} show={collapsed}>
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
            {!collapsed && <span className="text-sm">Collapse</span>}
          </Button>
        </SidebarTooltip>
      </div>
    </aside>
  )
}
