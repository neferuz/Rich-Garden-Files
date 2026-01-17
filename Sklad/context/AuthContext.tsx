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
            // 1. Get Telegram User
            let telegramUser: TelegramUser | null = null

            if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                const webApp = window.Telegram.WebApp
                webApp.ready()
                webApp.expand() // Expand to full height

                // Try to get user from Telegram
                if (webApp.initDataUnsafe?.user) {
                    telegramUser = webApp.initDataUnsafe.user
                }
            }

            // MOCK FOR LOCALHOST DEVELOPMENT
            if (!telegramUser && process.env.NODE_ENV === 'development') {
                telegramUser = {
                    id: 670031187,
                    first_name: "Feruz",
                    last_name: "Owner",
                    username: "feruuuz1",
                    photo_url: "https://xsgames.co/randomusers/assets/avatars/male/46.jpg"
                }
            }

            if (!telegramUser) {
                setError("Не удалось получить данные Telegram")
                setIsLoading(false)
                return
            }

            setUser(telegramUser)

            if (process.env.NODE_ENV === 'development') {
                setEmployee({
                    id: 999,
                    telegram_id: telegramUser.id,
                    full_name: `${telegramUser.first_name} ${telegramUser.last_name || ''}`,
                    role: 'owner', // FORCE OWNER
                    is_active: true,
                    created_at: new Date().toISOString()
                })
                setIsLoading(false)
                return
            }

            // 2. Verified Employee against Backend
            try {
                // We use a specific endpoint that returns employee data if found, or 404
                // We also assume the backend might implicitly register or update the user info (name/photo) 
                // but for now let's just 'check'

                // Note: In a real app, you should send 'initData' string to verify signature on backend.
                // For this demo, we trust the telegram_id passed in param (insecure but functional for MVP).

                // First, let's try to 'upsert' or 'sync' the user info if possible, 
                // or just fetch. Since we only have 'getEmployees' or check, let's implement a 'login' or use check.
                // Using a direct fetch to our check endpoint implemented earlier.

                const response = await fetch(`http://localhost:8000/api/employees/check/${telegramUser.id}`)

                if (response.ok) {
                    const empData = await response.json()
                    setEmployee(empData)

                    // Optional: Update local name/photo if changed in Telegram? 
                    // This creates a side effect, maybe skip for now to keep it simple.
                } else {
                    // Employee not found in DB
                    setError("Доступ запрещен. Вы не являетесь сотрудником.")
                }
            } catch (err) {
                console.error("Auth Error:", err)
                setError("Ошибка соединения с сервером")
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
