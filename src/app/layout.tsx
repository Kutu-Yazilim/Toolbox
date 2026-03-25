import type { Metadata } from "next"
import { AppShell } from "@/components/layout/AppShell"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL("https://toolbox.kutuyazilim.org"),
  title: {
    default: "ToolBox by Kutu Yazilim — 83+ Free Online Tools",
    template: "%s - ToolBox by Kutu Yazilim",
  },
  description:
    "Free online developer and creative tools. JSON formatter, UUID generator, image converter, and more. No sign-ups, runs in your browser.",
  openGraph: {
    type: "website",
    url: "https://toolbox.kutuyazilim.org",
    images: ["/og-image.svg"],
  },
  twitter: { card: "summary_large_image" },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-N19BRM30S9" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-N19BRM30S9');`,
          }}
        />
        <link rel="icon" type="image/svg+xml" href="/LogoOnlyCircularSVG.svg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#A88A6F" />
        <link rel="apple-touch-icon" href="/LogoOnlyCircularSVG.svg" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "ToolBox by Kutu Yazilim",
              url: "https://toolbox.kutuyazilim.org",
              description:
                "83+ free online tools for developers and creatives",
              applicationCategory: "DeveloperApplication",
              operatingSystem: "Any",
              offers: { "@type": "Offer", price: "0" },
            }),
          }}
        />
      </head>
      <body>
        <AppShell>{children}</AppShell>
        <script
          dangerouslySetInnerHTML={{
            __html: `if("serviceWorker" in navigator)navigator.serviceWorker.register("/sw.js")`,
          }}
        />
      </body>
    </html>
  )
}
