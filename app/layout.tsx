import React from "react"
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Vazirmatn, Courier_Prime } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { FaviconSwitcher } from '@/components/favicon-switcher'
import { HomeIntroSkipListener } from '@/components/intro-animation'
import { SiteAssistant } from '@/components/site-assistant'
import { PwaRegister } from '@/components/pwa-register'
import { SeoJsonLd } from '@/components/seo-json-ld'
import { VisitorLogger } from '@/components/visitor-logger'
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
} from '@/lib/site'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })
const courierPrime = Courier_Prime({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-courier-prime',
})
const vazirmatn = Vazirmatn({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-vazirmatn',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: `${SITE_NAME} — books, crypto, poetry & live tools by Reza Karbakhsh`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'Little Internet',
    'Reza Karbakhsh',
    'rezakarbakhsh',
    'books',
    'crypto',
    'bitcoin',
    'Desk Pilot',
    'charts',
    'crypto charts',
    'forex',
    'dictionary',
    'wiktionary',
    'poetry',
    'photos',
    'currency converter',
    'free tools',
    'AI explorer',
  ],
  authors: [{ name: 'Reza Karbakhsh', url: SITE_URL }],
  creator: 'Reza Karbakhsh',
  publisher: 'Reza Karbakhsh',
  category: 'technology',
  alternates: {
    canonical: '/',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: SITE_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: '/opengraph-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Little Internet by Reza Karbakhsh',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — books, crypto & live tools`,
    description: SITE_DESCRIPTION,
    images: ['/twitter-image.jpg'],
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
      {
        url: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/icon-dark-32x32.png',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f8f8' },
    { media: '(prefers-color-scheme: dark)', color: '#2f3437' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geist.variable} ${geistMono.variable} ${courierPrime.variable} ${vazirmatn.variable} font-sans antialiased bg-[#f8f8f8] text-[#37352f] dark:bg-[#2f3437] dark:text-[hsla(0,0%,100%,0.9)]`}
      >
        <SeoJsonLd />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          storageKey="light-theme"
        >
          <FaviconSwitcher />
          <HomeIntroSkipListener />
          <PwaRegister />
          <VisitorLogger />
          {children}
          <SiteAssistant />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
