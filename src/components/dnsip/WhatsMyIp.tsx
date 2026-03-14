import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  RefreshCwIcon,
  CopyIcon,
  CheckIcon,
  LoaderIcon,
  AlertCircleIcon,
  GlobeIcon,
  NetworkIcon,
  MapPinIcon,
  ClockIcon,
  BuildingIcon,
  MapIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { fetchIpInfo, type IpInfo } from "@/utils/dnsUtils"

type InfoCardProps = {
  icon: React.ReactNode
  label: string
  value: string
  onCopy: (text: string, key: string) => void
  copyKey: string
  copied: string | null
}

function InfoCard({ icon, label, value, onCopy, copyKey, copied }: InfoCardProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span className="text-[10px] font-medium uppercase tracking-wider">
            {label}
          </span>
        </div>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => onCopy(value, copyKey)}
        >
          {copied === copyKey ? (
            <CheckIcon className="h-3 w-3" />
          ) : (
            <CopyIcon className="h-3 w-3" />
          )}
        </Button>
      </div>
      <p className="text-sm font-mono text-foreground break-all">{value}</p>
    </div>
  )
}

export function WhatsMyIp() {
  const [info, setInfo] = useState<IpInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [hasFetched, setHasFetched] = useState(false)

  const handleFetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchIpInfo()
      setInfo(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch IP info")
    } finally {
      setLoading(false)
      setHasFetched(true)
    }
  }, [])

  useEffect(() => {
    if (!hasFetched) handleFetch()
  }, [hasFetched, handleFetch])

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-8 border-b border-border bg-muted/20 flex-shrink-0">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Your Public IP
        </span>
        <Button
          variant="ghost"
          size="xs"
          onClick={handleFetch}
          disabled={loading}
          className="gap-1"
        >
          <RefreshCwIcon
            className={cn("h-3 w-3", loading && "animate-spin")}
          />
          <span className="text-[10px]">Refresh</span>
        </Button>
      </div>

      <div className="flex-1 p-4">
        {/* Loading state */}
        {loading && !info && (
          <div className="flex items-center justify-center py-12">
            <LoaderIcon className="h-6 w-6 text-muted-foreground animate-spin" />
          </div>
        )}

        {/* Error state */}
        {error && !info && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <AlertCircleIcon className="h-8 w-8 text-destructive opacity-50" />
            <p className="text-xs text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={handleFetch}>
              Try Again
            </Button>
          </div>
        )}

        {/* IP display */}
        {info && (
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Big IP display */}
            <div className="rounded-xl border border-border bg-muted/10 p-6 text-center">
              <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
                IP Address
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl md:text-3xl font-mono font-bold text-foreground tracking-tight">
                  {info.ip}
                </span>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => handleCopy(info.ip, "ip")}
                >
                  {copied === "ip" ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : (
                    <CopyIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <InfoCard
                icon={<NetworkIcon className="h-3.5 w-3.5" />}
                label="ISP"
                value={info.isp}
                onCopy={handleCopy}
                copyKey="isp"
                copied={copied}
              />
              <InfoCard
                icon={<BuildingIcon className="h-3.5 w-3.5" />}
                label="City"
                value={info.city}
                onCopy={handleCopy}
                copyKey="city"
                copied={copied}
              />
              <InfoCard
                icon={<MapIcon className="h-3.5 w-3.5" />}
                label="Region"
                value={info.region}
                onCopy={handleCopy}
                copyKey="region"
                copied={copied}
              />
              <InfoCard
                icon={<GlobeIcon className="h-3.5 w-3.5" />}
                label="Country"
                value={`${info.country} (${info.countryCode})`}
                onCopy={handleCopy}
                copyKey="country"
                copied={copied}
              />
              <InfoCard
                icon={<ClockIcon className="h-3.5 w-3.5" />}
                label="Timezone"
                value={info.timezone}
                onCopy={handleCopy}
                copyKey="tz"
                copied={copied}
              />
              <InfoCard
                icon={<MapPinIcon className="h-3.5 w-3.5" />}
                label="Coordinates"
                value={`${info.lat}, ${info.lon}`}
                onCopy={handleCopy}
                copyKey="coords"
                copied={copied}
              />
            </div>

            {/* AS Number */}
            <InfoCard
              icon={<NetworkIcon className="h-3.5 w-3.5" />}
              label="AS Number"
              value={info.as}
              onCopy={handleCopy}
              copyKey="as"
              copied={copied}
            />
          </div>
        )}
      </div>
    </div>
  )
}
