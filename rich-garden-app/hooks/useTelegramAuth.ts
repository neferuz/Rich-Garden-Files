import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface TelegramUser {
    telegram_id: number;
    first_name: string;
    username?: string;
    photo_url?: string;
    phone_number?: string;
}

export function useTelegramAuth() {
    const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
            const tg = (window as any).Telegram.WebApp;
            tg.expand();

            const realUser = tg.initDataUnsafe?.user;
            // Mock user for dev if realUser is missing (e.g. browser)
            // But usually we want real logic. Keeping the mock as in original code for dev convenience.
            const mockUser = {
                id: 12345,
                first_name: "TestUser",
                username: "test",
                photo_url: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=150&auto=format&fit=crop",
                phone_number: "+998901234567"
            };

            const user = realUser || mockUser;

            if (user) {
                const userData: TelegramUser = {
                    telegram_id: user.id,
                    first_name: user.first_name,
                    username: (user as any).username,
                    photo_url: (user as any).photo_url,
                    phone_number: (user as any).phone_number
                };
                setTelegramUser(userData);
                api.authTelegram(userData as any).catch(console.error);
            }
        }
    }, []);

    return telegramUser;
}
