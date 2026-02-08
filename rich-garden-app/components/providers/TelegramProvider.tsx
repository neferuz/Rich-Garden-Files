"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

declare global {
    interface Window {
        Telegram: any;
    }
}

export function TelegramProvider({ children }: { children: React.ReactNode }) {
    const [isReady, setIsReady] = useState(false)
    const pathname = usePathname()
    const router = useRouter()

    useEffect(() => {
        // Check if running in Telegram WebApp
        if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp

            // Expand to full height
            tg.expand()

            // Set ready state
            tg.ready()

            // Запретить сворачивание свайпом вниз (если поддерживается)
            try {
                if (tg.disableVerticalSwipes) {
                    tg.disableVerticalSwipes()
                } else if (tg.isVersionAtLeast && tg.isVersionAtLeast('7.7')) {
                    // В 7.7+ это свойство, но может быть и методом в зависимости от библиотеки
                    // Прямая работа с window.Telegram.WebApp обычно подразумевает методы
                    // Но в документации к Bot API 8.0: 
                    if (tg.isVerticalSwipesEnabled !== undefined) {
                        // tg.isVerticalSwipesEnabled = false // Read-only in some versions? No, it's not writable usually.
                        // Actually, disableVerticalSwipes() is the method usually provided by wrappers or newer API.
                        // We will leave the check.
                    }
                }

                // Also request fullscreen if available (API 8.0+)
                // User asked to remove FullScreen, just stick to Expand (Full Size)
                // if (tg.requestFullscreen) {
                //    tg.requestFullscreen()
                // }
            } catch (e) {
                console.warn("Telegram WebApp swiping methods not supported", e)
            }

            // Включить confirm при закрытии через крестик
            if (tg.enableClosingConfirmation) {
                tg.enableClosingConfirmation()
            }

            setIsReady(true)

            // Function to update CSS variables based on Telegram env
            const updateStyles = () => {
                const root = document.documentElement

                // 1. Viewport Height
                // tg.viewportStableHeight is preferred for layout
                if (tg.viewportStableHeight) {
                    root.style.setProperty('--tg-viewport-height', `${tg.viewportStableHeight}px`)
                } else {
                    root.style.setProperty('--tg-viewport-height', `${window.innerHeight}px`)
                }

                // 2. Safe Areas (Device physical constraints like notch)
                if (tg.safeAreaInset) {
                    root.style.setProperty('--tg-safe-area-top', `${tg.safeAreaInset.top || 0}px`)
                    root.style.setProperty('--tg-safe-area-bottom', `${tg.safeAreaInset.bottom || 0}px`)
                    root.style.setProperty('--tg-safe-area-left', `${tg.safeAreaInset.left || 0}px`)
                    root.style.setProperty('--tg-safe-area-right', `${tg.safeAreaInset.right || 0}px`)
                }

                // 3. Content Safe Areas (UI constraints like Telegram header)
                if (tg.contentSafeAreaInset) {
                    root.style.setProperty('--tg-content-safe-area-top', `${tg.contentSafeAreaInset.top || 0}px`)
                    root.style.setProperty('--tg-content-safe-area-bottom', `${tg.contentSafeAreaInset.bottom || 0}px`)
                    root.style.setProperty('--tg-content-safe-area-left', `${tg.contentSafeAreaInset.left || 0}px`)
                    root.style.setProperty('--tg-content-safe-area-right', `${tg.contentSafeAreaInset.right || 0}px`)
                } else if (tg.safeAreaInset) {
                    // Fallbacks if not supported version
                    root.style.setProperty('--tg-content-safe-area-top', `${tg.safeAreaInset.top || 0}px`)
                    root.style.setProperty('--tg-content-safe-area-bottom', `${tg.safeAreaInset.bottom || 0}px`)
                }

                // 4. Header Color & BG
                // Клиентское приложение: черный навбар с белым текстом
                if (tg.setHeaderColor) {
                    // Telegram автоматически выберет белый текст для черного фона
                    tg.setHeaderColor('#000000')
                }
                if (tg.setBackgroundColor) tg.setBackgroundColor('#ffffff')
            }

            // Initial update
            updateStyles()

            // Periodic check for reliable values (Telegram animation lag)
            const intervalId = setInterval(updateStyles, 100)
            setTimeout(() => clearInterval(intervalId), 2500)

            // Listen for viewport changes
            tg.onEvent('viewportChanged', updateStyles)
            tg.onEvent('themeChanged', updateStyles)
            tg.onEvent('fullscreenChanged', updateStyles) // For new API

            // Cleanup
            return () => {
                clearInterval(intervalId)
                tg.offEvent('viewportChanged', updateStyles)
                tg.offEvent('themeChanged', updateStyles)
                tg.offEvent('fullscreenChanged', updateStyles)
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
                if (pathname && pathname !== '/') {
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
