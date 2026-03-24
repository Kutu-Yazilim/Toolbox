import { useEffect } from "react"

const SUFFIX = "ToolBox by Kutu Yazilim"
const DEFAULT_TITLE = `${SUFFIX} — 83+ Free Online Tools`
const BASE_URL = "https://toolbox.kutuyazilim.org"

export function usePageMeta(title?: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} - ${SUFFIX}` : DEFAULT_TITLE

    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc && description) metaDesc.setAttribute("content", description)

    const ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) ogTitle.setAttribute("content", document.title)

    const ogDesc = document.querySelector('meta[property="og:description"]')
    if (ogDesc && description) ogDesc.setAttribute("content", description)

    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [title, description])
}

export function useCanonicalUrl(path: string) {
  useEffect(() => {
    const existing = document.querySelector('link[rel="canonical"]')
    if (existing) {
      existing.setAttribute("href", `${BASE_URL}${path}`)
    } else {
      const link = document.createElement("link")
      link.rel = "canonical"
      link.href = `${BASE_URL}${path}`
      document.head.appendChild(link)
    }

    return () => {
      const link = document.querySelector('link[rel="canonical"]')
      if (link) link.remove()
    }
  }, [path])
}

export function useJsonLd(data: Record<string, unknown> | Record<string, unknown>[] | null) {
  useEffect(() => {
    if (!data) return

    const scripts: HTMLScriptElement[] = []
    const items = Array.isArray(data) ? data : [data]

    for (const item of items) {
      const script = document.createElement("script")
      script.type = "application/ld+json"
      script.setAttribute("data-dynamic-jsonld", "true")
      script.textContent = JSON.stringify(item)
      document.head.appendChild(script)
      scripts.push(script)
    }

    return () => {
      for (const script of scripts) {
        script.remove()
      }
    }
  }, [JSON.stringify(data)])
}
