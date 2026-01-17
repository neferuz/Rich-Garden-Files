import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import BottomNav from '@/components/BottomNav'
import { AuthProvider } from '@/context/AuthContext'

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-manrope',
})

export const metadata: Metadata = {
  title: 'Sklad App',
  description: 'Next.js приложение для управления складом',
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
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
          <Navbar />
          {children}
          <BottomNav />
        </AuthProvider>
      </body>

    </html>
  )
}

