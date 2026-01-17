import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { CartProvider } from "@/context/CartContext";
import { Toaster } from "sonner";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Rich Garden",
  description: "Premium Flower Shop",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" async></script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap" rel="stylesheet" />
      </head>
      <body
        className="font-sans antialiased text-gray-900 bg-white"
      >
        <FavoritesProvider>
          <CartProvider>
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                classNames: {
                  description: '!text-zinc-300',
                  title: '!text-white',
                },
                style: {
                  background: 'rgba(0, 0, 0, 0.8)',
                  backdropFilter: 'blur(12px)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '50px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)'
                },
              }}
            />
          </CartProvider>
        </FavoritesProvider>
      </body>
    </html>
  );
}
