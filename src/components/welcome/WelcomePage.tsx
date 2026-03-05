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
  KeyRoundIcon,
  QrCodeIcon,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

const TOOLS: {
  value: string
  label: string
  description: string
  icon: LucideIcon
}[] = [
  {
    value: "tree",
    label: "Tree",
    description: "Generate ASCII tree structures from indented text input",
    icon: TreesIcon,
  },
  {
    value: "db",
    label: "DB Model",
    description: "Design database schemas with visual ER diagrams using DBML",
    icon: DatabaseIcon,
  },
  {
    value: "color",
    label: "Colors",
    description: "Generate and explore color palettes with harmony analysis",
    icon: PaletteIcon,
  },
  {
    value: "board",
    label: "Board",
    description: "Draw and design on a freeform canvas board",
    icon: LayoutDashboardIcon,
  },
  {
    value: "json",
    label: "JSON",
    description: "Format, validate, and edit JSON with syntax highlighting",
    icon: BracesIcon,
  },
  {
    value: "regex",
    label: "Regex",
    description: "Test and debug regular expressions with live matching",
    icon: RegexIcon,
  },
  {
    value: "encoder",
    label: "Encoder",
    description: "Encode and decode text in Base64, URL, HTML, and more",
    icon: ShuffleIcon,
  },
  {
    value: "timestamp",
    label: "Timestamp",
    description: "Convert between Unix timestamps and human-readable dates",
    icon: ClockIcon,
  },
  {
    value: "api",
    label: "API",
    description: "Build and test REST API requests with response preview",
    icon: GlobeIcon,
  },
  {
    value: "markdown",
    label: "Markdown",
    description: "Write markdown and preview the rendered output live",
    icon: FileTextIcon,
  },
  {
    value: "wheel",
    label: "Wheel of Fate",
    description: "Spin a wheel to randomly pick from a list of options",
    icon: CircleDotIcon,
  },
  {
    value: "jwt",
    label: "JWT",
    description: "Decode existing JWTs or forge new tokens with custom headers and payloads",
    icon: KeyRoundIcon,
  },
  {
    value: "qr",
    label: "QR Code",
    description: "Generate styled QR codes with custom colors, dot types, and download as PNG",
    icon: QrCodeIcon,
  },
]

type WelcomePageProps = {
  onNavigate: (tabValue: string) => void
}

export function WelcomePage({ onNavigate }: WelcomePageProps) {
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
          {TOOLS.map(({ value, label, description, icon: Icon }) => (
            <button
              key={value}
              onClick={() => onNavigate(value)}
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
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
