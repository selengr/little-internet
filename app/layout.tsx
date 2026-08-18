import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono, IBM_Plex_Sans } from 'next/font/google'
import { Courier_Prime } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { FaviconSwitcher } from '@/components/favicon-switcher'
import { HomeIntroSkipListener } from '@/components/intro-animation'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const _courierPrime = Courier_Prime({ weight: ["400", "700"], subsets: ["latin"] });
const _ibmPlexSans = IBM_Plex_Sans({ weight: ["300", "400", "500", "600"], subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: 'Reza Karbakhsh — Live playground of useful tools',
    template: '%s · Reza',
  },
  description:
    'Reza Karbakhsh’s personal playground of live APIs and explorers — books, dictionary, Wiktionary, world atlas, markets, forex, photos, poetry, IP location, QR codes, and more.',
  keywords: [
    'Reza Karbakhsh',
    'Reza',
    'dictionary',
    'Wiktionary',
    'Open Library',
    'crypto markets',
    'forex',
    'world atlas',
    'countries',
    'IP location',
    'poetry',
    'QR code',
    'photo gallery',
  ],
  authors: [{ name: 'Reza Karbakhsh' }],
  openGraph: {
    title: 'Reza Karbakhsh — Live playground of useful tools',
    description:
      'Explore books, language tools, world countries, markets, photos, poetry, and more — built by Reza.',
    type: 'website',
    siteName: 'Reza Karbakhsh',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reza Karbakhsh — Live playground of useful tools',
    description:
      'Explore books, language tools, world countries, markets, photos, poetry, and more — built by Reza.',
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
      <body className={`font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          storageKey="light-theme"
        >
          <FaviconSwitcher />
          <HomeIntroSkipListener />
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
