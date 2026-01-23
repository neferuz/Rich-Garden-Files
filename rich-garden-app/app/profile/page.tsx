"use client"

import { BottomNav } from '@/components/BottomNav'
import { User, Settings, Package, CreditCard, Heart, ChevronRight, LogOut, Phone, ShieldCheck, Camera, Star, Calendar } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useFavorites } from '@/context/FavoritesContext'

export default function ProfilePage() {
    const [telegramUser, setTelegramUser] = useState<any>(null)
    const [activeOrders, setActiveOrders] = useState(0)
    const [totalOrders, setTotalOrders] = useState(0)
    const { favorites } = useFavorites()

    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initDataUnsafe?.user) {
            const tg = (window as any).Telegram.WebApp;
            const user = tg.initDataUnsafe?.user;

            if (user) {
                setTelegramUser({
                    first_name: user.first_name,
                    username: user.username,
                    photo_url: user.photo_url,
                    phone_number: (user as any).phone_number
                });
                fetchOrders(user.id)
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
    }, [])

    const fetchOrders = (userId: number) => {
        api.getUserOrders(userId).then(orders => {
            setTotalOrders(orders.length)
            const activeCount = orders.filter(o => ['new', 'processing', 'shipping'].includes(o.status)).length
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
        <main className="min-h-screen bg-[#f9fafb] pb-32">

            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100/50">
                <div className="px-6 h-16 flex items-center justify-between">
                    <h1 className="text-[26px] font-bold text-black lowercase tracking-tight leading-none">профиль</h1>
                    <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-100 text-gray-400 active:scale-95 transition-all hover:text-black hover:border-black/10">
                        <LogOut size={18} strokeWidth={1.5} />
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="px-4 py-6 space-y-6 relative">
                {/* Subtle Background Decorations */}
                <div className="absolute top-20 right-0 w-64 h-64 bg-red-50/50 rounded-full blur-3xl -z-10" />
                <div className="absolute bottom-40 left-0 w-48 h-48 bg-blue-50/50 rounded-full blur-3xl -z-10" />

                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50"
                >
                    <div className="flex flex-col items-center text-center">
                        <div className="relative mb-4">
                            <div className="w-24 h-24 rounded-full bg-gray-50 border-[3px] border-white shadow-xl overflow-hidden ring-1 ring-gray-100">
                                {telegramUser?.photo_url ? (
                                    <img src={telegramUser.photo_url} alt="Ava" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-3xl font-bold text-gray-200 uppercase">
                                        {telegramUser?.first_name?.[0] || 'U'}
                                    </div>
                                )}
                            </div>
                        </div>

                        <h2 className="text-[24px] font-black text-black leading-tight tracking-tight mb-1">
                            {telegramUser?.first_name || 'Гость'}
                        </h2>
                        <p className="text-gray-400 text-[15px] font-medium mb-6">
                            {telegramUser?.phone_number || 'Нет номера'}
                        </p>

                        <div className="grid grid-cols-2 gap-4 w-full py-4 border-t border-gray-50 mt-2">
                            <div className="flex flex-col items-center">
                                <span className="text-[18px] font-black text-black">{totalOrders}</span>
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">заказов</span>
                            </div>
                            <div className="flex flex-col items-center border-l border-gray-50">
                                <span className="text-[18px] font-black text-black">{favorites.length}</span>
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">избранное</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Menu */}
                <div className="space-y-2">
                    {menuItems.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 + i * 0.05 }}
                        >
                            <Link href={item.href} className="flex items-center justify-between p-4 bg-white rounded-[24px] border border-gray-100 shadow-sm active:scale-[0.98] transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-black group-hover:bg-black group-hover:text-white transition-colors duration-300">
                                        <item.icon size={18} strokeWidth={2} />
                                    </div>
                                    <span className="text-[16px] font-bold text-gray-900 lowercase tracking-tight">{item.label}</span>
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
