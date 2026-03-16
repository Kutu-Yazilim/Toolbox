import { NavLink, Outlet } from "react-router"

const tabs = [
    { to: "decode", label: "Decode" },
    { to: "forge", label: "Forge" },
] as const

export function JwtLayout() {
    return (
        <div className="h-full flex flex-col min-h-0">
            {/* Tab bar */}
            <div className="flex items-center gap-1 px-3 h-9 border-b border-border flex-shrink-0 bg-muted/10">
                {tabs.map(({ to, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `px-3 py-1 rounded text-xs font-medium transition-colors ${
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`
                        }
                    >
                        {label}
                    </NavLink>
                ))}
            </div>

            <div className="flex-1 min-h-0">
                <Outlet />
            </div>
        </div>
    )
}
