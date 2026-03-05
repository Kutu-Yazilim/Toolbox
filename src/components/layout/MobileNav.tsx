import { useEffect, useMemo, useState } from "react"
import {
  HomeIcon,
  MenuIcon,
  MoonIcon,
  SunIcon,
  XIcon,
} from "lucide-react"
import { TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { NAV_ITEMS } from "@/components/layout/AppSidebar"
import { cn } from "@/lib/utils"
import { useTheme } from "@/hooks/useTheme"

type MobileNavProps = {
  activeTab: string
}

const MOBILE_NAV_ITEMS = [
  { value: "home", label: "Home", icon: HomeIcon },
  ...NAV_ITEMS,
]

export function MobileNav({ activeTab }: MobileNavProps) {
  const { isDark, toggleTheme } = useTheme()
  const [open, setOpen] = useState(false)

  const activeItem = useMemo(() => {
    return MOBILE_NAV_ITEMS.find((item) => item.value === activeTab) ?? MOBILE_NAV_ITEMS[0]
  }, [activeTab])

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
            <div className="px-4 pt-4 pb-3 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Tools
              </p>
            </div>

            <div className="overflow-y-auto p-3 pb-4">
              <div className="grid grid-cols-2 gap-2">
                {MOBILE_NAV_ITEMS.map(({ value, label, icon: Icon }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "h-auto px-3 py-2.5 justify-start rounded-lg border border-border bg-card/40",
                      "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary"
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="text-xs font-medium truncate">{label}</span>
                  </TabsTrigger>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
