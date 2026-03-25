import { useState, useEffect } from "react"
import { ChevronDownIcon } from "lucide-react"
import { getFaqsByToolId, type FaqItem } from "@/data/toolFaqs"
import { cn } from "@/lib/utils"

function FaqAccordionItem({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-border rounded-lg">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-muted/50 transition-colors rounded-lg"
      >
        <span>{item.question}</span>
        <ChevronDownIcon
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="px-4 pb-3 text-sm text-muted-foreground leading-relaxed">
          {item.answer}
        </div>
      )}
    </div>
  )
}

export function ToolFaq({ toolId }: { toolId: string }) {
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
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    })
    document.head.appendChild(script)

    return () => {
      script.remove()
    }
  }, [faqs])

  if (faqs.length === 0) return null

  return (
    <section className="border-t border-border/60 bg-card/50 px-4 py-6">
      <div className="mx-auto max-w-4xl space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Frequently Asked Questions
        </h2>
        <div className="flex flex-col gap-2">
          {faqs.map((faq, i) => (
            <FaqAccordionItem key={i} item={faq} />
          ))}
        </div>
      </div>
    </section>
  )
}
