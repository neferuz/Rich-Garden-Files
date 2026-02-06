"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

// Telegram is already declared by telegram-web-app types

export function TelegramProvider({ children }: { children: React.ReactNode }) {
    const [isReady, setIsReady] = useState(false)
    const pathname = usePathname()
    const router = useRouter()

    useEffect(() => {
        // Check if running in Telegram WebApp
        if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp
            const tgAny = tg as any

            // Expand to full height
            tg.expand()

            // Set ready state
            tg.ready()
            
            // Запретить сворачивание свайпом вниз
            tg.disableVerticalSwipes()
            
            // Включить confirm при закрытии через крестик
            tg.enableClosingConfirmation()
            
            setIsReady(true)

            // Function to update CSS variables based on Telegram env
            const updateStyles = () => {
                const root = document.documentElement

                // 1. Viewport Height
                // tg.viewportStableHeight is preferred for layout
                if (tgAny.viewportStableHeight) {
                    root.style.setProperty('--tg-viewport-height', `${tgAny.viewportStableHeight}px`)
                } else {
                    root.style.setProperty('--tg-viewport-height', `${window.innerHeight}px`)
                }

                // 2. Safe Areas (Device physical constraints like notch)
                if (tgAny.safeAreaInset) {
                    root.style.setProperty('--tg-safe-area-top', `${tgAny.safeAreaInset.top || 0}px`)
                    root.style.setProperty('--tg-safe-area-bottom', `${tgAny.safeAreaInset.bottom || 0}px`)
                    root.style.setProperty('--tg-safe-area-left', `${tgAny.safeAreaInset.left || 0}px`)
                    root.style.setProperty('--tg-safe-area-right', `${tgAny.safeAreaInset.right || 0}px`)
                }

                // 3. Content Safe Areas (UI constraints like Telegram header)
                if (tgAny.contentSafeAreaInset) {
                    root.style.setProperty('--tg-content-safe-area-top', `${tgAny.contentSafeAreaInset.top || 0}px`)
                    root.style.setProperty('--tg-content-safe-area-bottom', `${tgAny.contentSafeAreaInset.bottom || 0}px`)
                    root.style.setProperty('--tg-content-safe-area-left', `${tgAny.contentSafeAreaInset.left || 0}px`)
                    root.style.setProperty('--tg-content-safe-area-right', `${tgAny.contentSafeAreaInset.right || 0}px`)
                } else if (tgAny.safeAreaInset) {
                    // Fallbacks if not supported version
                    root.style.setProperty('--tg-content-safe-area-top', `${tgAny.safeAreaInset.top || 0}px`)
                    root.style.setProperty('--tg-content-safe-area-bottom', `${tgAny.safeAreaInset.bottom || 0}px`)
                }

                // 4. Header Color & BG
                // Админка: синий навбар (#2663eb) с белым текстом
                if (tgAny.setHeaderColor) {
                    // Telegram автоматически выберет белый текст для темного фона
                    tgAny.setHeaderColor('#2663eb')
                }
                if (tgAny.setBackgroundColor) tgAny.setBackgroundColor('#F8F9FB')
            }

            // Initial update
            updateStyles()

            // Periodic check for reliable values (Telegram animation lag)
            const intervalId = setInterval(updateStyles, 100)
            setTimeout(() => clearInterval(intervalId), 2500)

            // Listen for viewport changes
            if (tgAny.onEvent) {
                tgAny.onEvent('viewportChanged', updateStyles)
                tgAny.onEvent('themeChanged', updateStyles)
                tgAny.onEvent('fullscreenChanged', updateStyles) // For new API
            }

            // Cleanup
            return () => {
                clearInterval(intervalId)
                if (tgAny.offEvent) {
                    tgAny.offEvent('viewportChanged', updateStyles)
                    tgAny.offEvent('themeChanged', updateStyles)
                    tgAny.offEvent('fullscreenChanged', updateStyles)
                }
            }
        }
    }, [])

    // Управление кнопкой "Назад" в Telegram навбаре
    useEffect(() => {
        if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp
            const backButton = tg.BackButton

            if (backButton) {
                // Показываем кнопку "Назад" если не на главной странице
                if (pathname && pathname !== '/' && pathname !== '/tasks') {
                    backButton.show()
                    
                    // Обработчик нажатия - возврат назад
                    const handleBack = () => {
                        router.back()
                    }
                    
                    backButton.onClick(handleBack)
                    
                    return () => {
                        backButton.offClick(handleBack)
                        backButton.hide()
                    }
                } else {
                    // Скрываем кнопку на главной странице
                    backButton.hide()
                }
            }
        }
    }, [pathname, router])

    return (
        <>
            {children}
        </>
    )
}
