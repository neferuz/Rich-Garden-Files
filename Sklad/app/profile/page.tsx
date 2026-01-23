"use client"

import {
    Settings, ChevronRight, Store, Users, Coins, Calendar,
    Link as LinkIcon, AlertCircle, Loader2, Plus, Sparkles,
    TrendingUp, Award, Zap, Share2, Layout
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/services/api"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const ROLE_LABELS: Record<string, string> = {
    owner: 'Владелец',
    admin: 'Администратор',
    manager: 'Менеджер',
    worker: 'Сотрудник',
    finance: 'Финансист',
    courier: 'Курьер'
}

export default function ProfilePage() {
    const { user, employee, isLoading, isAuthenticated, error } = useAuth()
    const [newClientsCount, setNewClientsCount] = useState<number>(0)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const clients = await api.getClients()
                const today = new Date().toDateString()
                const count = clients.filter(c => new Date(c.created_at).toDateString() === today).length
                setNewClientsCount(count)
            } catch (e) {
                console.error("Failed to fetch client stats", e)
            }
        }
        if (isAuthenticated) fetchStats()
    }, [isAuthenticated])

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin text-gray-400" size={32} />
                    <span className="text-gray-400 text-sm font-medium">Загрузка профиля...</span>
                </div>
            </div>
        )
    }

    if (!isAuthenticated || !employee) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
                <div className="bg-white p-8 rounded-[32px] shadow-xl text-center max-w-sm w-full">
                    <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <h2 className="text-xl font-medium text-gray-900 mb-2">Доступ запрещен</h2>
                    <p className="text-gray-500 mb-6 text-sm font-medium">
                        Ваш Telegram аккаунт не найден в списке сотрудников. Пожалуйста, обратитесь к администратору.
                    </p>
                    {user && (
                        <div className="bg-gray-50 p-3 rounded-xl text-xs text-gray-400 mb-4 break-all font-medium">
                            ID: {user.id} <br />
                            @{user.username}
                        </div>
                    )}
                    <Link href="/" className="w-full h-12 rounded-xl bg-gray-900 text-white font-medium flex items-center justify-center text-sm">
                        На главную
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F8F9FB] pb-40">
            {/* Header */}
            <div className="pt-6 px-6 mb-4 flex items-center justify-between">
                <div className="w-10" />
                <h1 className="text-xl font-medium text-gray-900">Профиль</h1>
                <Link href="/settings" className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-100 text-gray-400 hover:text-black hover:bg-gray-50 transition-all active:scale-95 shadow-sm">
                    <Settings size={20} />
                </Link>
            </div>

            <div className="px-5 space-y-6">

                {/* Stories Section */}

                {/* Profile Card */}
                <div className="bg-white rounded-[32px] p-6 flex flex-col items-center shadow-sm border border-gray-100 text-center relative overflow-hidden group">
                    <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />
                    <div className="absolute top-4 right-4">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600"
                        >
                            <Share2 size={18} />
                        </motion.button>
                    </div>

                    <div className="relative mb-3">
                        <div className="w-24 h-24 rounded-full p-1.5 bg-white ring-1 ring-gray-100 shadow-xl shadow-black/5 mb-2 mx-auto relative z-10 overflow-hidden">
                            {employee.photo_url || user?.photo_url ? (
                                <Image
                                    src={employee.photo_url || user?.photo_url || ''}
                                    alt="Profile"
                                    width={96}
                                    height={96}
                                    className="w-full h-full rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-3xl font-medium text-gray-300">
                                    {(employee.full_name?.[0] || user?.first_name?.[0] || 'U')}
                                </div>
                            )}
                        </div>
                        {employee.is_active && (
                            <div className="absolute bottom-2 right-1 w-5 h-5 bg-green-500 border-[3px] border-white rounded-full z-20" />
                        )}
                    </div>

                    <h2 className="text-xl font-medium text-gray-900 mb-1">{employee.full_name}</h2>
                    <div className="flex items-center gap-2 justify-center">
                        <span className="text-[13px] font-medium text-gray-400">
                            {ROLE_LABELS[employee.role] || employee.role}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span className="text-[13px] font-medium text-blue-600">Rich Garden</span>
                    </div>

                </div>


                {/* Grid Menu */}
                <div className="grid grid-cols-2 gap-3">
                    <MenuCard
                        icon={Users}
                        label="Сотрудники"
                        href="/employees"
                        iconColor="text-blue-600"
                        iconBg="bg-blue-50"
                    />
                    <MenuCard
                        icon={Calendar}
                        label="Календарь"
                        href="/calendar"
                        iconColor="text-purple-600"
                        iconBg="bg-purple-50"
                    />
                    <MenuCard
                        icon={Coins}
                        label="Финансы"
                        href="/finance"
                        iconColor="text-amber-600"
                        iconBg="bg-amber-50"
                    />
                    <MenuCard
                        icon={Users}
                        label="Клиенты"
                        href="/clients"
                        iconColor="text-teal-600"
                        iconBg="bg-teal-50"
                        badge={newClientsCount > 0 ? newClientsCount.toString() : undefined}
                    />
                    <MenuCard
                        icon={Sparkles}
                        label="Управление Stories"
                        href="/stories"
                        iconColor="text-indigo-600"
                        iconBg="bg-indigo-50"
                    />
                    <MenuCard
                        icon={Layout}
                        label="Баннеры"
                        href="/banners"
                        iconColor="text-pink-600"
                        iconBg="bg-pink-50"
                    />
                    <MenuCard
                        icon={Zap}
                        label="Вау эффекты"
                        href="/wow-effects"
                        iconColor="text-orange-600"
                        iconBg="bg-orange-50"
                    />
                    <MenuCard
                        icon={Settings}
                        label="Настройки"
                        href="/settings"
                        iconColor="text-gray-500"
                        iconBg="bg-gray-50"
                    />
                </div>
            </div>
        </div>
    )
}

function StoryItem({ label, icon, isMe, isUnread }: { label: string, icon?: any, isMe?: boolean, isUnread?: boolean }) {
    return (
        <div className="flex flex-col items-center gap-2 flex-shrink-0 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className={cn(
                "w-[72px] h-[72px] rounded-full p-[3px] transition-transform active:scale-95 cursor-pointer",
                isUnread ? "bg-gradient-to-tr from-blue-600 via-purple-500 to-rose-400" : "bg-gray-200"
            )}>
                <div className="w-full h-full rounded-full bg-white p-[2px]">
                    <div className={cn(
                        "w-full h-full rounded-full flex items-center justify-center overflow-hidden",
                        isMe ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-400"
                    )}>
                        {icon || <div className="text-xl font-medium">{label[0]}</div>}
                    </div>
                </div>
            </div>
            <span className={cn(
                "text-[11px] font-medium truncate w-[72px] text-center",
                isUnread ? "text-gray-900" : "text-gray-400"
            )}>{isMe ? "Ваше" : label}</span>
        </div>
    )
}


interface MenuCardProps {
    icon: any
    label: string
    href: string
    badge?: string
    iconColor?: string
    iconBg?: string
}

function MenuCard({ icon: Icon, label, href, badge, iconColor = "text-gray-600", iconBg = "bg-gray-100" }: MenuCardProps) {
    return (
        <Link href={href} className="bg-white p-4 rounded-[28px] shadow-sm border border-gray-100 flex flex-col justify-between h-28 active:scale-[0.98] transition-all hover:shadow-md relative overflow-hidden group">
            <div className="flex justify-between items-start">
                <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", iconBg, iconColor)}>
                    <Icon size={20} strokeWidth={2.5} />
                </div>
                {badge && (
                    <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-medium">
                        {badge}
                    </span>
                )}
            </div>

            <div className="flex items-center justify-between mt-auto">
                <span className="font-medium text-gray-900 text-[14px] leading-tight">{label}</span>
                {!badge && <ArrowBtn />}
            </div>
        </Link>
    )
}

function ArrowBtn() {
    return (
        <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
            <ChevronRight size={14} strokeWidth={2.5} />
        </div>
    )
}
