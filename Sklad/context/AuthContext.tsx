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
        let attempts = 0;
        const maxAttempts = 20;

        const initAuth = async () => {
            if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                const webApp = window.Telegram.WebApp
                webApp.ready()
                webApp.expand()

                // Check if running inside Telegram
                const isInTelegram = !!webApp.initData;
                let telegramUser: TelegramUser | null = null;

                if (webApp.initDataUnsafe?.user) {
                    telegramUser = webApp.initDataUnsafe.user
                    console.log("Auth: Received user from Telegram:", telegramUser.first_name)
                }

                // Fallback / Mock User logic
                if (!telegramUser) {
                    if (!isInTelegram) {
                        console.log("Auth: Not in Telegram, using mock user...")
                        telegramUser = {
                            id: 670031187,
                            first_name: "Feruz",
                            last_name: "Owner",
                            username: "feruuuz1",
                            photo_url: "https://xsgames.co/randomusers/assets/avatars/male/46.jpg"
                        }
                    } else {
                        // In Telegram but no user data? Unusual but possible.
                        console.log("Auth: In Telegram but no user data found.")
                    }
                }

                if (telegramUser) {
                    setUser(telegramUser)

                    // Check employee access
                    try {
                        const employeeData = await api.checkEmployeeAccess(telegramUser.id, telegramUser.username)
                        if (employeeData) {
                            setEmployee(employeeData)
                            console.log("Auth: Employee found:", employeeData.role)
                        } else {
                            console.log("Auth: User is not an employee")
                            setEmployee(null)
                        }
                    } catch (err: any) {
                        if (err.message?.includes('404') || err.message?.includes('Not an employee')) {
                            console.log("Auth: User is not an employee (404)")
                            setEmployee(null)
                        } else {
                            console.error("Auth: Error checking employee access:", err)
                            setEmployee(null)
                        }
                    }
                }

                setIsLoading(false)
                return true; // Initialized
            }
            return false; // Not yet
        };

        // Attempt initialization
        const runInit = async () => {
            if (await initAuth()) return;

            const interval = setInterval(async () => {
                attempts++;
                if (await initAuth() || attempts >= maxAttempts) {
                    clearInterval(interval);
                    if (attempts >= maxAttempts) setIsLoading(false); // Stop loading even if failed
                }
            }, 100);
        }

        runInit();
    }, [])

    return (
        <AuthContext.Provider value={{ user, employee, isLoading, error, isAuthenticated: !!employee }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
