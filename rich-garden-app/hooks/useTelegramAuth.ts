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
        let attempts = 0;
        const maxAttempts = 20; // Try for 2 seconds (20 * 100ms)

        const initAuth = () => {
            if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
                const tg = (window as any).Telegram.WebApp;
                tg.expand();

                const realUser = tg.initDataUnsafe?.user;

                // В продакшене (в Telegram) realUser должен быть
                // Если его нет - значит мы в обычном браузере или что-то пошло не так
                // Используем мок только если явно не в Телеграме (для разработки)
                // Но лучше показывать "Гость", если данных нет, чем фейкового TestUser в проде

                // Чтобы различать прод и дев:
                // Если initData пустая - скорее всего мы не в Телеграме.
                const isInTelegram = !!tg.initData;

                const mockUser = {
                    id: 12345,
                    first_name: "TestUser",
                    username: "test",
                    photo_url: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=150&auto=format&fit=crop",
                    phone_number: "+998901234567"
                };

                // Логика: если есть реальный юзер - берем его.
                // Если нет реального юзера, но мы НЕ в телеграме (дев) - берем мок.
                // Если мы в телеграме, но юзера нет (странно) - оставляем null (Гость).

                // ВАЖНО: Текущий код всегда брал мок, если не было реального. 
                // Если пользователь открывает сайт в обычном браузере - он TestUser.

                const user = realUser || (isInTelegram ? null : mockUser);

                if (user) {
                    const userData: TelegramUser = {
                        telegram_id: user.id,
                        first_name: user.first_name,
                        username: (user as any).username,
                        photo_url: (user as any).photo_url,
                        phone_number: (user as any).phone_number
                    };
                    setTelegramUser(userData);

                    // Отправляем данные на бэкенд, только если это реальный юзер или мы хотим авторизовать мока (в деве)
                    api.authTelegram(userData as any).catch(console.error);
                }
                return true; // Initialized
            }
            return false; // Not yet
        };

        // Try immediately
        if (!initAuth()) {
            const interval = setInterval(() => {
                attempts++;
                if (initAuth() || attempts >= maxAttempts) {
                    clearInterval(interval);
                }
            }, 100);
            return () => clearInterval(interval);
        }
    }, []);

    return telegramUser;
}
