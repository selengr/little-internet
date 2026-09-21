import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono, IBM_Plex_Sans, Vazirmatn } from 'next/font/google'
import { Courier_Prime } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { FaviconSwitcher } from '@/components/favicon-switcher'
import { HomeIntroSkipListener } from '@/components/intro-animation'
import { SiteAssistant } from '@/components/site-assistant'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const _courierPrime = Courier_Prime({ weight: ["400", "700"], subsets: ["latin"] });
const _ibmPlexSans = IBM_Plex_Sans({ weight: ["300", "400", "500", "600"], subsets: ["latin"] });
const vazirmatn = Vazirmatn({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-vazirmatn',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Little Internet',
    template: '%s · Little Internet',
  },
  description:
    'A small corner of the web — books, languages, maps, markets, photos, poems, and other live tools by Reza.',
  keywords: [
    'Little Internet',
    'Reza Karbakhsh',
    'books',
    'dictionary',
    'countries',
    'poetry',
    'photos',
    'tools',
  ],
  authors: [{ name: 'Reza Karbakhsh' }],
  openGraph: {
    title: 'Little Internet',
    description:
      'A small corner of the web — books, languages, maps, and other live tools.',
    type: 'website',
    siteName: 'Little Internet',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Little Internet',
    description:
      'A small corner of the web — books, languages, maps, and other live tools.',
  },

  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon-dark-32x32.png',
      },
    ],
    apple: '/apple-icon.png',
    shortcut: '/icon-dark-32x32.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${vazirmatn.variable} font-sans antialiased bg-[#f8f8f8] text-[#37352f] dark:bg-[#2f3437] dark:text-[hsla(0,0%,100%,0.9)]`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          storageKey="light-theme"
        >
          <FaviconSwitcher />
          <HomeIntroSkipListener />
          {children}
          <SiteAssistant />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
