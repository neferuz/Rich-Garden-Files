"use client"

import { BottomNav } from '@/components/BottomNav'
import { User, Settings, Package, CreditCard, Heart, ChevronRight, LogOut, Phone, ShieldCheck, Camera, Star, Calendar } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useFavorites } from '@/context/FavoritesContext'
import { AnimatedBackground } from "@/components/features/home/AnimatedBackground"
import { cn } from "@/lib/utils"

function formatPhoneNumber(phone: string | null | undefined): string | null {
    if (!phone) return null;

    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, '');

    // Format Uzbek phone numbers: +998901234567 -> +998 90 123 45 67
    if (cleaned.startsWith('+998')) {
        const match = cleaned.match(/^\+998(\d{2})(\d{3})(\d{2})(\d{2})$/);
        if (match) {
            return `+998 ${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
        }
        // Fallback for other formats
        if (cleaned.length >= 13) {
            return `+998 ${cleaned.slice(4, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9, 11)} ${cleaned.slice(11, 13)}`;
        }
    }

    // Return original if can't format
    return phone;
}

export default function ProfilePage() {
    const [telegramUser, setTelegramUser] = useState<any>(null)
    const [activeOrders, setActiveOrders] = useState(0)
    const [totalOrders, setTotalOrders] = useState(0)
    const { favorites } = useFavorites()

    useEffect(() => {
        const loadUser = async () => {
            if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initDataUnsafe?.user) {
                const tg = (window as any).Telegram.WebApp;
                const user = tg.initDataUnsafe?.user;

                if (user) {
                    // Get user data from API to get phone number
                    try {
                        const userData = await api.getUser(user.id);
                        setTelegramUser({
                            first_name: user.first_name,
                            username: user.username,
                            photo_url: user.photo_url,
                            phone_number: userData?.phone_number || null
                        });
                        fetchOrders(user.id)
                    } catch (error) {
                        // Fallback if API fails
                        setTelegramUser({
                            first_name: user.first_name,
                            username: user.username,
                            photo_url: user.photo_url,
                            phone_number: null
                        });
                        fetchOrders(user.id)
                    }
                }
            } else if (process.env.NODE_ENV === 'development') {
                // Mock user
                setTelegramUser({
                    first_name: "Local Test",
                    username: "dev_user",
                    phone_number: "+998 90 123 45 67"
                })
                fetchOrders(12345678)
            }
        }
        loadUser()
    }, [])

    const fetchOrders = (userId: number) => {
        api.getUserOrders(userId).then(orders => {
            setTotalOrders(orders.length)
            const activeCount = orders.filter(o => ['new', 'processing', 'shipping', 'pending_payment', 'paid'].includes(o.status)).length
            setActiveOrders(activeCount)
        }).catch(err => console.error("Failed to load orders", err))
    }

    const menuItems = [
        { icon: Package, label: 'Мои заказы', href: '/orders', badge: activeOrders > 0 ? `${activeOrders} активных` : undefined },
        { icon: Heart, label: 'Избранное', href: '/favorites', badge: favorites.length > 0 ? `${favorites.length}` : undefined },
        { icon: Calendar, label: 'Календарь событий', href: '/calendar' },
        { icon: CreditCard, label: 'Способы оплаты', href: '/payment' },
    ]

    return (
        <main className="min-h-screen pb-32 relative overflow-x-hidden pt-16">
            <AnimatedBackground />

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-black/5">
                <div className="px-6 h-16 flex items-center justify-between">
                    <h1 className="text-[26px] font-black text-black lowercase tracking-tighter leading-none">профиль</h1>
                    <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-black/5 text-black active:scale-95 transition-all">
                        <LogOut size={18} strokeWidth={2.5} />
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="px-4 py-6 space-y-6 relative z-10">

                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[36px] p-6 border border-black/5"
                >
                    <div className="flex flex-col items-center text-center">
                        <div className="relative mb-4">
                            <div className="w-24 h-24 rounded-full bg-white border-[3px] border-white overflow-hidden ring-1 ring-black/5">
                                {telegramUser?.photo_url ? (
                                    <img src={telegramUser.photo_url} alt="Ava" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-black/5 text-3xl font-black text-black/10 uppercase">
                                        {telegramUser?.first_name?.[0] || 'U'}
                                    </div>
                                )}
                            </div>
                        </div>

                        <h2 className="text-[24px] font-black text-black leading-tight tracking-tight mb-1">
                            {telegramUser?.first_name || 'Гость'}
                        </h2>
                        <p className="text-gray-400 text-[15px] font-medium mb-6">
                            {formatPhoneNumber(telegramUser?.phone_number) || 'Нет номера'}
                        </p>

                        <div className="grid grid-cols-2 gap-4 w-full py-4 border-t border-black/5 mt-2">
                            <div className="flex flex-col items-center">
                                <span className="text-[18px] font-black text-black">{totalOrders}</span>
                                <span className="text-[11px] font-black text-black/30 uppercase tracking-widest">заказов</span>
                            </div>
                            <div className="flex flex-col items-center border-l border-black/5">
                                <span className="text-[18px] font-black text-black">{favorites.length}</span>
                                <span className="text-[11px] font-black text-black/30 uppercase tracking-widest">избранное</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Menu */}
                <div className="space-y-2">
                    {menuItems.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.05 }}
                        >
                            <Link href={item.href} className="flex items-center justify-between p-4 bg-white rounded-[28px] border border-black/5 active:scale-[0.98] transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-black group-hover:bg-black group-hover:text-white transition-all duration-300">
                                        <item.icon size={18} strokeWidth={2.5} />
                                    </div>
                                    <span className="text-[16px] font-medium text-black lowercase tracking-tighter">{item.label}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {item.badge && (
                                        <span className="px-2 py-0.5 bg-red-50 text-red-500 rounded-full text-[10px] font-black uppercase tracking-wider border border-red-100">
                                            {item.badge}
                                        </span>
                                    )}
                                    <ChevronRight size={18} className="text-gray-300 group-hover:text-black transition-colors" />
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="w-full pt-4 pb-8 flex items-center justify-center gap-2 text-[15px] font-bold text-red-500/50 hover:text-red-500 transition-colors"
                >
                    <LogOut size={16} />
                    <span>Выйти из аккаунта</span>
                </motion.button>
            </div>

            <BottomNav />
        </main>
    )
}
