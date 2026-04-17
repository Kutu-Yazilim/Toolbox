import type { Metadata } from "next"
import { Newsreader, Geist, Geist_Mono } from "next/font/google"
import { AppShell } from "@/components/layout/AppShell"
import "./globals.css"

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500"],
  variable: "--font-display",
  display: "swap",
})

const geist = Geist({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://toolbox.kutuyazilim.org"),
  title: {
    default: "ToolBox by Kutu Yazilim — 83+ Free Online Tools",
    template: "%s - ToolBox by Kutu Yazilim",
  },
  description:
    "Free online developer and creative tools. JSON formatter, UUID generator, image converter, and more. No sign-ups, runs in your browser.",
  keywords: [
    "free online tools", "developer tools", "json formatter", "uuid generator",
    "image converter", "base64 encoder", "regex tester", "pdf tools",
    "online toolbox", "web developer utilities", "kutu yazilim",
  ],
  authors: [{ name: "Kutu Yazilim", url: "https://kutuyazilim.org" }],
  creator: "Kutu Yazilim",
  publisher: "Kutu Yazilim",
  alternates: {
    canonical: "https://toolbox.kutuyazilim.org",
  },
  openGraph: {
    type: "website",
    siteName: "ToolBox by Kutu Yazilim",
    url: "https://toolbox.kutuyazilim.org",
    title: "ToolBox by Kutu Yazilim — 83+ Free Online Tools",
    description:
      "Free online developer and creative tools. JSON formatter, UUID generator, image converter, and more. No sign-ups, runs in your browser.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "ToolBox by Kutu Yazilim — 83+ Free Online Developer Tools",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ToolBox by Kutu Yazilim — 83+ Free Online Tools",
    description:
      "Free online developer and creative tools. No sign-ups, runs in your browser.",
    creator: "@kutuyazilim",
    site: "@kutuyazilim",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "technology",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${newsreader.variable} ${geist.variable} ${geistMono.variable}`}
    >
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-N19BRM30S9" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-N19BRM30S9');`,
          }}
        />
        <link rel="icon" type="image/svg+xml" href="/LogoOnlyCircularSVG.svg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#EEF1EC" />
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
