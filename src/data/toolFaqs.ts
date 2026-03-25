export type FaqItem = {
  question: string
  answer: string
}

export type ToolFaq = {
  toolId: string
  faqs: FaqItem[]
}

export const TOOL_FAQS: ToolFaq[] = [
  // Will be populated with 83 entries
]

export function getFaqsByToolId(toolId: string): FaqItem[] {
  return TOOL_FAQS.find((f) => f.toolId === toolId)?.faqs ?? []
}
