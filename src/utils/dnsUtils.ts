// ─── DNS Record Types ────────────────────────────────────────────────────────

export const DNS_RECORD_TYPES = [
  "A",
  "AAAA",
  "CNAME",
  "MX",
  "NS",
  "TXT",
  "SOA",
  "SRV",
  "CAA",
  "PTR",
] as const

export type DnsRecordType = (typeof DNS_RECORD_TYPES)[number]

// ─── DoH Providers ───────────────────────────────────────────────────────────

export type DnsProvider = {
  name: string
  resolve: (domain: string, type: DnsRecordType) => Promise<DnsResult>
}

export type DnsAnswer = {
  name: string
  type: number
  TTL: number
  data: string
}

export type DnsResult = {
  status: "resolved" | "error" | "nxdomain"
  answers: DnsAnswer[]
  responseTimeMs: number
  errorMessage?: string
}

type GoogleDnsResponse = {
  Status: number
  Answer?: { name: string; type: number; TTL: number; data: string }[]
}

async function queryGoogleFormat(
  url: string,
  headers?: Record<string, string>
): Promise<{ status: number; answers: DnsAnswer[] }> {
  const resp = await fetch(url, { headers })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const data: GoogleDnsResponse = await resp.json()

  return {
    status: data.Status,
    answers: (data.Answer ?? []).map((a) => ({
      name: a.name,
      type: a.type,
      TTL: a.TTL,
      data: a.data,
    })),
  }
}

function createTimedResolver(
  name: string,
  queryFn: (domain: string, type: DnsRecordType) => Promise<{ status: number; answers: DnsAnswer[] }>
): DnsProvider {
  return {
    name,
    resolve: async (domain, type) => {
      const start = performance.now()
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)
        const result = await queryFn(domain, type)
        clearTimeout(timeout)
        const responseTimeMs = Math.round(performance.now() - start)

        if (result.status === 3) {
          return { status: "nxdomain", answers: [], responseTimeMs }
        }
        if (result.status !== 0) {
          return {
            status: "error",
            answers: [],
            responseTimeMs,
            errorMessage: `DNS status ${result.status}`,
          }
        }
        return { status: "resolved", answers: result.answers, responseTimeMs }
      } catch (e) {
        return {
          status: "error",
          answers: [],
          responseTimeMs: Math.round(performance.now() - start),
          errorMessage: e instanceof Error ? e.message : "Unknown error",
        }
      }
    },
  }
}

export const DNS_PROVIDERS: DnsProvider[] = [
  createTimedResolver("Google DNS", (domain, type) =>
    queryGoogleFormat(
      `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`
    )
  ),
  createTimedResolver("Cloudflare", (domain, type) =>
    queryGoogleFormat(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`,
      { Accept: "application/dns-json" }
    )
  ),
  createTimedResolver("Quad9", (domain, type) =>
    queryGoogleFormat(
      `https://dns.quad9.net:5053/dns-query?name=${encodeURIComponent(domain)}&type=${type}`,
      { Accept: "application/dns-json" }
    )
  ),
  createTimedResolver("Mozilla DoH", (domain, type) =>
    queryGoogleFormat(
      `https://mozilla.cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`,
      { Accept: "application/dns-json" }
    )
  ),
  createTimedResolver("Wikimedia DNS", (domain, type) =>
    queryGoogleFormat(
      `https://wikimedia-dns.org/dns-query?name=${encodeURIComponent(domain)}&type=${type}`,
      { Accept: "application/dns-json" }
    )
  ),
]

// ─── IP Info ─────────────────────────────────────────────────────────────────

export type IpInfo = {
  ip: string
  isp: string
  city: string
  region: string
  country: string
  countryCode: string
  timezone: string
  lat: number
  lon: number
  as: string
}

export async function fetchIpInfo(): Promise<IpInfo> {
  const resp = await fetch("https://ipapi.co/json/")
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const data = await resp.json()
  if (data.error) throw new Error(data.reason ?? "IP lookup failed")
  return {
    ip: data.ip,
    isp: data.org ?? "Unknown",
    city: data.city ?? "Unknown",
    region: data.region ?? "Unknown",
    country: data.country_name ?? "Unknown",
    countryCode: data.country_code ?? "",
    timezone: data.timezone ?? "Unknown",
    lat: data.latitude ?? 0,
    lon: data.longitude ?? 0,
    as: data.asn ? `${data.asn} ${data.org ?? ""}`.trim() : "Unknown",
  }
}
