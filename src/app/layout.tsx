import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import NextTopLoader from 'nextjs-toploader'
import { Analytics } from '@vercel/analytics/react'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './globals.css'
import ReactQueryProvider from '@/providers/ReactQueryProvider'
import { UserProvider } from '@/contexts/user-context'
import { Header } from '@/components/header'
import { getCurrentUser } from '@/lib/auth'

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'СЛОВАРЬиКо - Учи словарные слова играючи',
  description:
    'Интерактивное приложение для изучения словарных слов с заполнением пропущенных букв',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'СЛОВАРЬиКо',
  },
  icons: {
    icon: '/icon-192x192.png',
    apple: '/icon-192x192.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5af3d' }, // Оранжевый Scratch
    { media: '(prefers-color-scheme: dark)', color: '#2e1a47' }, // Тёмно-фиолетовый
  ],
}

const geistSans = Geist({
  variable: '--font-geist-sans',
  display: 'swap',
  subsets: ['latin'],
})

type RootLayoutProps = {
  children: React.ReactNode
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const user = await getCurrentUser()

  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <NextTopLoader showSpinner={false} height={2} color="#2acf80" />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <UserProvider user={user || { role: null }}>
            <ReactQueryProvider>
              <Header />
              {children}
              <Analytics />
              <ReactQueryDevtools initialIsOpen={false} />
            </ReactQueryProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
