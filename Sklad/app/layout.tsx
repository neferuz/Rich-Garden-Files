import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import BottomNav from '@/components/BottomNav'
import { AuthProvider } from '@/context/AuthContext'
import { TelegramProvider } from '@/components/providers/TelegramProvider'

import { Toaster } from 'sonner'

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-manrope',
})

export const metadata: Metadata = {
  title: 'Sklad App',
  description: 'Next.js приложение для управления складом',
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, interactive-widget=resizes-content",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" className={manrope.variable} suppressHydrationWarning>
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" async></script>
      </head>
      <body className="min-h-screen bg-white font-sans">
        <AuthProvider>
          <TelegramProvider>
            <Toaster position="top-center" richColors />
            <Navbar />
            {children}
            <BottomNav />
          </TelegramProvider>
        </AuthProvider>
      </body>

    </html>
  )
}

