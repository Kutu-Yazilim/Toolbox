import { useState } from "react"
import { cn } from "@/lib/utils"
import { DnsLookup } from "@/components/dnsip/DnsLookup"
import { WhatsMyIp } from "@/components/dnsip/WhatsMyIp"

type Tab = "dns" | "ip"

export function DnsIpTool() {
  const [tab, setTab] = useState<Tab>("dns")

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-3 h-9 border-b border-border flex-shrink-0 bg-muted/10">
        <button
          onClick={() => setTab("dns")}
          className={cn(
            "px-3 py-1 rounded text-xs font-medium transition-colors",
            tab === "dns"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          DNS Lookup
        </button>
        <button
          onClick={() => setTab("ip")}
          className={cn(
            "px-3 py-1 rounded text-xs font-medium transition-colors",
            tab === "ip"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          What's My IP
        </button>
      </div>

      {tab === "dns" ? <DnsLookup /> : <WhatsMyIp />}
    </div>
  )
}
