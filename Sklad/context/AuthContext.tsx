"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { api, Employee } from "@/services/api"

// Telegram WebApp Types
interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    language_code?: string;
}

interface TelegramWebApp {
    initData: string;
    initDataUnsafe: {
        user?: TelegramUser;
        alert: (message: string) => void;
    };
    ready: () => void;
    expand: () => void;
    close: () => void;
    MainButton: any;
    BackButton: any;
}

declare global {
    interface Window {
        Telegram?: {
            WebApp: TelegramWebApp;
        };
    }
}

type AuthContextType = {
    user: TelegramUser | null;
    employee: Employee | null;
    isLoading: boolean;
    error: string | null;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    employee: null,
    isLoading: true,
    error: null,
    isAuthenticated: false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<TelegramUser | null>(null)
    const [employee, setEmployee] = useState<Employee | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const initAuth = async () => {
            console.log("Auth: Starting initialization...")
            try {
                // 1. Get Telegram User
                let telegramUser: TelegramUser | null = null

                if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                    const webApp = window.Telegram.WebApp
                    console.log("Auth: Telegram WebApp detected")
                    webApp.ready()
                    webApp.expand()

                    if (webApp.initDataUnsafe?.user) {
                        telegramUser = webApp.initDataUnsafe.user
                        console.log("Auth: Received user from Telegram:", telegramUser.first_name)
                    }
                }

                // FALLBACK MOCK USER
                if (!telegramUser) {
                    console.log("Auth: No Telegram user found, using fallback...")
                    telegramUser = {
                        id: 670031187,
                        first_name: "Feruz",
                        last_name: "Owner",
                        username: "feruuuz1",
                        photo_url: "https://xsgames.co/randomusers/assets/avatars/male/46.jpg"
                    }
                }

                setUser(telegramUser)

                // 2. FORCE OWNER (Temporary Bypass)
                setEmployee({
                    id: 999,
                    telegram_id: telegramUser.id,
                    full_name: `${telegramUser.first_name} ${telegramUser.last_name || ''}`,
                    role: 'owner',
                    is_active: true,
                    created_at: new Date().toISOString()
                })
                console.log("Auth: Initialization complete")
            } catch (err) {
                console.error("Auth: Error during initialization:", err)
                setError("Ошибка при запуске приложения")
            } finally {
                setIsLoading(false)
            }
        }

        initAuth()
    }, [])

    return (
        <AuthContext.Provider value={{ user, employee, isLoading, error, isAuthenticated: !!employee }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
