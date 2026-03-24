import { useEffect } from "react"

const SUFFIX = "ToolBox by Kutu Yazilim"
const DEFAULT_TITLE = `${SUFFIX} — 83+ Free Online Tools`

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
