import { useState, useEffect } from "react"
import {
  TreesIcon,
  DatabaseIcon,
  PaletteIcon,
  LayoutDashboardIcon,
  BracesIcon,
  RegexIcon,
  ShuffleIcon,
  ClockIcon,
  GlobeIcon,
  FileTextIcon,
  CircleDotIcon,
  MoonIcon,
  SunIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  HomeIcon,
  KeyRoundIcon,
  QrCodeIcon,
  CoinsIcon,
  PenToolIcon,
  MonitorSmartphoneIcon,
  FileOutputIcon,
} from "lucide-react"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/useTheme"
import { cn } from "@/lib/utils"

export const NAV_ITEMS = [
  { value: "tree", label: "Tree", icon: TreesIcon },
  { value: "db", label: "DB Model", icon: DatabaseIcon },
  { value: "color", label: "Colors", icon: PaletteIcon },
  { value: "board", label: "Board", icon: LayoutDashboardIcon },
  { value: "json", label: "JSON", icon: BracesIcon },
  { value: "regex", label: "Regex", icon: RegexIcon },
  { value: "encoder", label: "Encoder", icon: ShuffleIcon },
  { value: "timestamp", label: "Timestamp", icon: ClockIcon },
  { value: "api", label: "API", icon: GlobeIcon },
  { value: "markdown", label: "Markdown", icon: FileTextIcon },
  { value: "wheel", label: "Wheel", icon: CircleDotIcon },
  { value: "jwt", label: "JWT", icon: KeyRoundIcon },
  { value: "qr", label: "QR Code", icon: QrCodeIcon },
  { value: "coinflip", label: "Coin Flip", icon: CoinsIcon },
  { value: "shapemaker", label: "Shape Maker", icon: PenToolIcon },
  { value: "mockup", label: "Mockup", icon: MonitorSmartphoneIcon },
  { value: "base64file", label: "Base64 to File", icon: FileOutputIcon },
] as const

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

export function AppSidebar() {
  const { isDark, toggleTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem("sidebar-collapsed")
    return stored !== null ? stored === "true" : true
  })

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed))
  }, [collapsed])

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
        <TabsList
          className="flex flex-col gap-0.5 w-full bg-transparent h-auto p-0 rounded-none"
        >
          {/* Home */}
          <SidebarTooltip label="Home" show={collapsed}>
            <TabsTrigger
              value="home"
              className={cn(
                "w-full gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                "border-none shadow-none after:hidden",
                "text-sidebar-foreground/60 hover:text-sidebar-foreground",
                "hover:bg-sidebar-accent/50",
                "data-[state=active]:bg-sidebar-accent dark:data-[state=active]:bg-sidebar-accent data-[state=active]:text-sidebar-accent-foreground",
                "data-[state=active]:font-semibold",
                "before:absolute before:inset-y-1 before:left-0 before:w-[3px] before:rounded-full before:bg-sidebar-primary",
                "before:opacity-0 before:transition-opacity data-[state=active]:before:opacity-100",
                "transition-colors duration-150",
                collapsed ? "justify-center px-0" : "justify-start"
              )}
            >
              <HomeIcon className="size-[18px] flex-shrink-0" />
              {!collapsed && <span className="truncate">Home</span>}
            </TabsTrigger>
          </SidebarTooltip>

          {/* Divider */}
          <div className="h-px bg-sidebar-border my-1.5 mx-1" />

          {/* Tools */}
          {NAV_ITEMS.map(({ value, label, icon: Icon }) => (
            <SidebarTooltip key={value} label={label} show={collapsed}>
              <TabsTrigger
                value={value}
                className={cn(
                  "w-full gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                  "border-none shadow-none after:hidden",
                  "text-sidebar-foreground/60 hover:text-sidebar-foreground",
                  "hover:bg-sidebar-accent/50",
                  "data-[state=active]:bg-sidebar-accent dark:data-[state=active]:bg-sidebar-accent data-[state=active]:text-sidebar-accent-foreground",
                  "data-[state=active]:font-semibold",
                  "before:absolute before:inset-y-1 before:left-0 before:w-[3px] before:rounded-full before:bg-sidebar-primary",
                  "before:opacity-0 before:transition-opacity data-[state=active]:before:opacity-100",
                  "transition-colors duration-150",
                  collapsed ? "justify-center px-0" : "justify-start"
                )}
              >
                <Icon className="size-[18px] flex-shrink-0" />
                {!collapsed && (
                  <span className="truncate">{label}</span>
                )}
              </TabsTrigger>
            </SidebarTooltip>
          ))}
        </TabsList>
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
