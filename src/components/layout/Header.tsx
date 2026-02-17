import type { ReactNode } from "react"
import { MoonIcon, SunIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/useTheme"

type HeaderProps = {
    centerContent?: ReactNode
}

export function Header({ centerContent }: HeaderProps) {
    const { isDark, toggleTheme } = useTheme()

    return (
        <header className="border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0">
            <div className="px-4 h-10 flex items-center gap-3">
                <div className="flex items-center gap-2 flex-shrink-0">
                    <img
                        src="/LogoOnlyCircularSVG.svg"
                        alt="Kutu Planner logo"
                        className="h-4 w-4"
                    />
                    <span className="text-sm font-semibold text-foreground">
                        Kutu Planner
                    </span>
                </div>
                <div className="flex-1 min-w-0 flex items-center justify-center">
                    {centerContent}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
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
