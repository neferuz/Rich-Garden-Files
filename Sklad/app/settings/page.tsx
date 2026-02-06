"use client"

import {
    ChevronLeft, Settings, Bell, Globe, Moon, Shield,
    Database, Info, LogOut, ChevronRight, Check, X,
    Palette, Clock, MessageCircle, HelpCircle, Terminal, Copy
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
    const router = useRouter()
    const { user, employee } = useAuth()

    // States for toggles
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
    const [isFAQOpen, setIsFAQOpen] = useState(false)
    const [buildCopied, setBuildCopied] = useState(false)

    const buildScript = "cd /var/www/rich-garden && bash scripts/build-and-reload-sklad.sh"

    const copyBuildScript = () => {
        navigator.clipboard.writeText(buildScript)
        setBuildCopied(true)
        setTimeout(() => setBuildCopied(false), 2000)
    }

    const faqs = [
        { q: "Как добавить товар?", a: "Перейдите в раздел 'Склад' и нажмите кнопку 'Приход' в нижнем меню." },
        { q: "Как создать букет?", a: "Нажмите на центральную кнопку '+' в нижнем меню и выберите 'Букет'." },
        { q: "Где посмотреть заказы?", a: "Все заказы находятся в разделе 'Заказы' на нижней панели навигации." },
        { q: "Как изменить цену?", a: "В разделе 'Склад' выберите нужный товар и нажмите 'Редактировать'." }
    ]

    const renderSettingItem = (
        icon: any,
        label: string,
        value?: string,
        onClick?: () => void,
        iconColor: string = "text-blue-600",
        iconBg: string = "bg-blue-50",
        disabled: boolean = false,
        statusText?: string
    ) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "w-full bg-white p-4 flex items-center justify-between transition-colors group first:rounded-t-[28px] last:rounded-b-[28px] border-b border-gray-50 last:border-none",
                disabled ? "opacity-60 cursor-default" : "active:bg-gray-50"
            )}
        >
            <div className="flex items-center gap-4 text-left">
                <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-transform", !disabled && "group-active:scale-90", iconBg, iconColor)}>
                    <icon.type {...icon.props} size={20} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                    <span className="text-[15px] font-medium text-gray-900">{label}</span>
                    {statusText && <span className="text-[11px] font-medium text-gray-400">{statusText}</span>}
                </div>
            </div>
            <div className="flex items-center gap-3">
                {value && <span className="text-[13px] font-medium text-gray-400 uppercase tracking-wider">{value}</span>}
                {!disabled && <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500 transition-colors" />}
            </div>
        </button>
    )

    const renderToggleItem = (
        icon: any,
        label: string,
        isOn: boolean,
        onToggle: () => void,
        iconColor: string = "text-blue-600",
        iconBg: string = "bg-blue-50",
        disabled: boolean = false,
        statusText?: string
    ) => (
        <div className={cn(
            "w-full bg-white p-4 flex items-center justify-between first:rounded-t-[28px] last:rounded-b-[28px] border-b border-gray-50 last:border-none",
            disabled && "opacity-60"
        )}>
            <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", iconBg, iconColor)}>
                    <icon.type {...icon.props} size={20} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                    <span className="text-[15px] font-medium text-gray-900">{label}</span>
                    {statusText && <span className="text-[11px] font-medium text-gray-400">{statusText}</span>}
                </div>
            </div>
            <button
                onClick={disabled ? undefined : onToggle}
                className={cn(
                    "w-12 h-7 rounded-full transition-all duration-300 relative p-1",
                    isOn ? "bg-blue-600 shadow-lg shadow-blue-200" : "bg-gray-200",
                    disabled && "cursor-default"
                )}
            >
                <motion.div
                    animate={{ x: isOn ? 20 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="w-5 h-5 bg-white rounded-full shadow-sm"
                />
            </button>
        </div>
    )

    return (
        <div className="min-h-screen bg-[#F8F9FB] pb-40">
            {/* Header */}
            <div className="pt-6 px-6 mb-8 flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:text-black hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
                >
                    <ChevronLeft size={20} />
                </button>
                <h1 className="text-xl font-medium text-gray-900">Настройки</h1>
                <div className="w-10" />
            </div>

            <div className="px-5 space-y-6">

                {/* Profile Summary */}
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex items-center gap-4 active:bg-gray-50 transition-colors cursor-pointer group">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-blue-400 p-0.5 shadow-lg shadow-blue-100 relative group-hover:scale-105 transition-transform duration-300">
                        {employee?.photo_url || user?.photo_url ? (
                            <img
                                src={employee?.photo_url || user?.photo_url || ""}
                                alt="Avatar"
                                className="w-full h-full rounded-full object-cover border-2 border-white"
                            />
                        ) : (
                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-xl font-medium text-blue-500">
                                {employee?.full_name?.[0] || user?.first_name?.[0] || "U"}
                            </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                            <Check size={12} className="text-white" strokeWidth={4} />
                        </div>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-lg font-medium text-gray-900 leading-tight">{employee?.full_name || "Пользователь"}</h2>
                        <p className="text-[13px] font-medium text-gray-400 mt-1">
                            {employee?.role || "Сотрудник"} • {user?.username ? `@${user.username}` : "ID: " + user?.id}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:text-blue-500 group-hover:bg-blue-50 transition-all">
                        <ChevronRight size={20} />
                    </div>
                </div>

                {/* System Settings */}
                <div className="space-y-3">
                    <h3 className="px-4 text-[12px] font-medium text-gray-400">Система</h3>
                    <div className="shadow-sm border border-gray-100 rounded-[28px] overflow-hidden">
                        {renderToggleItem(<Bell />, "Уведомления", true, () => { }, "text-rose-500", "bg-rose-50", true, "Всегда включены")}
                        {renderSettingItem(<Globe />, "Язык приложения", "RU", () => { }, "text-blue-600", "bg-blue-50")}
                        {renderToggleItem(<Moon />, "Темная тема", false, () => { }, "text-indigo-600", "bg-indigo-50", true, "Только светлая")}
                        {renderSettingItem(<Palette />, "Цветовая схема", "Стандарт", () => { }, "text-emerald-600", "bg-emerald-50", true, "В разработке")}
                    </div>
                </div>

                {/* Build script — сборка админки на сервере */}
                <div className="space-y-3">
                    <h3 className="px-4 text-[12px] font-medium text-gray-400">Сборка</h3>
                    <div className="bg-white rounded-[28px] shadow-sm border border-gray-100 overflow-hidden p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                                <Terminal size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className="text-[15px] font-medium text-gray-900">Сборка админки</p>
                                <p className="text-[11px] text-gray-400">Выполните на сервере по SSH</p>
                            </div>
                        </div>
                        <pre className="bg-gray-50 rounded-2xl p-4 text-[12px] font-mono text-gray-700 overflow-x-auto border border-gray-100">
                            {buildScript}
                        </pre>
                        <button
                            onClick={copyBuildScript}
                            className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-500 text-white font-medium text-sm active:scale-[0.98] transition-all"
                        >
                            {buildCopied ? <Check size={18} /> : <Copy size={18} />}
                            {buildCopied ? "Скопировано" : "Скопировать команду"}
                        </button>
                    </div>
                </div>

                {/* Support & Links */}
                <div className="space-y-3">
                    <h3 className="px-4 text-[12px] font-medium text-gray-400">Поддержка</h3>
                    <div className="shadow-sm border border-gray-100 rounded-[28px] overflow-hidden">
                        {renderSettingItem(<MessageCircle />, "Связаться с разработчиком", undefined, () => { }, "text-blue-500", "bg-blue-50", true, "В разработке")}
                        {renderSettingItem(<HelpCircle />, "Помощь и FAQ", undefined, () => setIsFAQOpen(true), "text-teal-600", "bg-teal-50")}
                        {renderSettingItem(<Info />, "О приложении", "v 1.0.0", () => { }, "text-gray-600", "bg-gray-100")}
                    </div>
                </div>

                <div className="text-center pt-8 border-t border-gray-100 mt-4 pb-12">
                    <p className="text-[12px] font-medium text-gray-400">Rich Garden Management System</p>
                    <Link
                        href="https://pro-ai.uz/"
                        target="_blank"
                        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-500 mt-2 hover:text-blue-600 transition-colors"
                    >
                        <span>Made by</span>
                        <span className="font-bold text-gray-900 underline decoration-blue-200 underline-offset-4">PRO-AI</span>
                    </Link>
                </div>
            </div>

            {/* FAQ Modal */}
            <AnimatePresence>
                {isFAQOpen && (
                    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                            onClick={() => setIsFAQOpen(false)}
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="relative w-full max-w-lg bg-white rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl z-10 max-h-[80vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-medium text-gray-900">Помощь и FAQ</h3>
                                <button onClick={() => setIsFAQOpen(false)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="space-y-6">
                                {faqs.map((faq, i) => (
                                    <div key={i} className="bg-gray-50 p-5 rounded-[24px] border border-gray-100">
                                        <p className="font-medium text-gray-900 mb-2">{faq.q}</p>
                                        <p className="text-sm text-gray-500 leading-relaxed font-medium">{faq.a}</p>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => setIsFAQOpen(false)}
                                className="w-full h-14 rounded-2xl bg-blue-600 text-white font-medium mt-8 shadow-xl shadow-blue-100 active:scale-[0.98] transition-all"
                            >
                                Понятно
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
