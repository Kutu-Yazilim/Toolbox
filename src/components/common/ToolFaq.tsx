"use client"

import { useState, useEffect } from "react"
import { ChevronDownIcon } from "lucide-react"
import { getFaqsByToolId, getFaqQuestion, getFaqAnswer, type FaqItem } from "@/data/toolFaqs"
import { useLocale } from "@/i18n/LocaleContext"
import { cn } from "@/lib/utils"

function FaqAccordionItem({ item, locale }: { item: FaqItem; locale: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-border rounded-lg">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-muted/50 transition-colors rounded-lg"
      >
        <span>{getFaqQuestion(item, locale)}</span>
        <ChevronDownIcon
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="px-4 pb-3 text-sm text-muted-foreground leading-relaxed">
          {getFaqAnswer(item, locale)}
        </div>
      )}
    </div>
  )
}

export function ToolFaq({ toolId }: { toolId: string }) {
  const { locale } = useLocale()
  const faqs = getFaqsByToolId(toolId)

  useEffect(() => {
    if (faqs.length === 0) return

    const script = document.createElement("script")
    script.type = "application/ld+json"
    script.setAttribute("data-faq-jsonld", "true")
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: getFaqQuestion(faq, locale),
        acceptedAnswer: {
          "@type": "Answer",
          text: getFaqAnswer(faq, locale),
        },
      })),
    })
    document.head.appendChild(script)

    return () => {
      script.remove()
    }
  }, [faqs, locale])

  if (faqs.length === 0) return null

  return (
    <section className="border-t border-border/60 bg-card/50 px-4 py-6">
      <div className="mx-auto max-w-4xl space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          {locale === "tr" ? "Sikca Sorulan Sorular" : "Frequently Asked Questions"}
        </h2>
        <div className="flex flex-col gap-2">
          {faqs.map((faq, i) => (
            <FaqAccordionItem key={i} item={faq} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  )
}
