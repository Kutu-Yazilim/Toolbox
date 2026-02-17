import { TreesIcon, MoonIcon, SunIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/useTheme"

export function Header() {
    const { isDark, toggleTheme } = useTheme()

    return (
        <header className="border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0">
            <div className="px-4 h-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <TreesIcon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">
                        Kutu Planner
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                    >
                        {isDark ? (
                            <SunIcon className="h-3.5 w-3.5" />
                        ) : (
                            <MoonIcon className="h-3.5 w-3.5" />
                        )}
                    </Button>
                </div>
            </div>
        </header>
    )
}
