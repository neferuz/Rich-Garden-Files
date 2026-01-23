"use client"

import { useState } from "react"
import { Send, Users, ShoppingBag, UserPlus, AlertCircle, CheckCircle2, ChevronLeft, MoreHorizontal, Pen, MessageCircle } from "lucide-react"
import { api } from "@/services/api"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export default function BroadcastPage() {
    const [message, setMessage] = useState("")
    const [filter, setFilter] = useState<'all' | 'purchased' | 'leads'>("all")
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<{ total: number; success: number; failed: number } | null>(null)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [step, setStep] = useState<'compose' | 'preview'>('compose')

    const filters = [
        { id: 'all', label: 'Все клиенты', count: null, icon: Users, desc: 'Рассылка по всей базе' },
        { id: 'purchased', label: 'Покупатели', count: null, icon: ShoppingBag, desc: 'Уже совершали покупки' },
        { id: 'leads', label: 'Потенциальные', count: null, icon: UserPlus, desc: 'Без завершенных заказов' },
    ]

    const handleSendClick = () => {
        if (!message.trim()) return
        setConfirmOpen(true)
    }

    const confirmSend = async () => {
        setConfirmOpen(false)
        setLoading(true)
        setResult(null)

        try {
            const res = await api.broadcastMessage(message, filter)
            setResult(res)
            setMessage("")
            // Show result for 10s
            // setTimeout(() => setResult(null), 10000)
        } catch (e) {
            console.error(e)
            alert("Ошибка при отправке рассылки")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#F8F9FB] pb-32 font-medium">
            {/* Header */}
            <div className="pt-6 px-6 mb-4 flex items-center justify-between">
                <Link href="/clients" className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-100 text-gray-500 hover:text-black hover:bg-gray-50 transition-colors shadow-sm">
                    <ChevronLeft size={22} />
                </Link>
                <h1 className="text-xl font-medium text-gray-900">Новая рассылка</h1>
                <div className="w-10" />
            </div>

            <div className="px-6 max-w-2xl mx-auto space-y-4">

                {/* Status/Result Banner */}
                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-[24px] p-5 shadow-xl shadow-black/5 border border-green-100 flex flex-col gap-4 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <CheckCircle2 size={100} className="text-green-500" />
                            </div>
                            <div className="flex items-center gap-4 z-10">
                                <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-500 flex items-center justify-center shrink-0">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 leading-tight">Рассылка завершена</h3>
                                    <p className="text-xs text-gray-500 mt-1">Отчет отправлен в Telegram</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 z-10">
                                <div className="bg-green-50/50 rounded-xl p-3 border border-green-50">
                                    <div className="text-[10px] text-green-600 font-bold uppercase tracking-wider mb-0.5">Доставлено</div>
                                    <div className="text-lg font-bold text-green-700">{result.success}</div>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Ошибки</div>
                                    <div className="text-lg font-bold text-gray-600">{result.failed}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => setResult(null)}
                                className="w-full h-11 bg-gray-900 text-white rounded-xl font-medium text-sm mt-1 active:scale-95 transition-all"
                            >
                                Понятно
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Composer */}
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-black/5 overflow-hidden">
                    {/* Filter Section */}
                    <div className="p-6 border-b border-gray-50">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-3 block">Получатели</label>
                        <div className="flex flex-col gap-2">
                            {filters.map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => setFilter(f.id as any)}
                                    className={cn(
                                        "w-full p-3.5 rounded-[20px] flex items-center gap-3.5 transition-all text-left group border-2",
                                        filter === f.id
                                            ? "bg-black border-black text-white shadow-lg shadow-black/10"
                                            : "bg-gray-50/50 border-transparent text-gray-500 hover:bg-gray-100"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 transition-colors",
                                        filter === f.id ? "bg-white/20 text-white" : "bg-white text-gray-400 border border-gray-100"
                                    )}>
                                        <f.icon size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={cn("font-bold text-[14px] leading-tight", filter === f.id ? "text-white" : "text-gray-900")}>{f.label}</div>
                                        <div className={cn("text-[11px] font-medium leading-tight mt-0.5", filter === f.id ? "text-white/60" : "text-gray-400")}>{f.desc}</div>
                                    </div>
                                    <div className={cn(
                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center mr-1",
                                        filter === f.id ? "border-white bg-white" : "border-gray-300"
                                    )}>
                                        {filter === f.id && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Message Section */}
                    <div className="p-6 pt-5">
                        <div className="flex items-center justify-between mb-3 px-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Сообщение</label>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md">
                                <span className="uppercase">HTML</span>
                            </div>
                        </div>

                        <div className="relative group">
                            <textarea
                                rows={6}
                                placeholder="Введите текст сообщения..."
                                className="w-full bg-gray-50 rounded-[20px] p-5 text-gray-900 placeholder:text-gray-400 text-[15px] font-medium resize-none border-2 border-transparent focus:border-black/5 focus:bg-white focus:outline-none transition-all leading-relaxed"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                            <div className="absolute bottom-4 right-4 text-[10px] font-bold text-gray-300 pointer-events-none">
                                {message.length} зн.
                            </div>
                        </div>

                        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none opacity-60 hover:opacity-100 transition-opacity">
                            <span className="text-[10px] font-medium text-gray-400 px-2 py-1 bg-gray-50 rounded-lg whitespace-nowrap border border-gray-100">&lt;b&gt;жирный&lt;/b&gt;</span>
                            <span className="text-[10px] font-medium text-gray-400 px-2 py-1 bg-gray-50 rounded-lg whitespace-nowrap border border-gray-100">&lt;i&gt;курсив&lt;/i&gt;</span>
                            <span className="text-[10px] font-medium text-gray-400 px-2 py-1 bg-gray-50 rounded-lg whitespace-nowrap border border-gray-100">&lt;a href=&quot;...&quot;&gt;ссылка&lt;/a&gt;</span>
                        </div>
                    </div>
                </div>

                <div className="pb-28"></div>

                {/* Fixed Bottom Action Bar */}
                <div className="fixed inset-x-0 z-50 transition-all duration-300 pointer-events-none" style={{ bottom: 'calc(1.5rem + var(--tg-content-safe-area-bottom) + var(--tg-safe-area-bottom))' }}>
                    <div className="mx-auto w-full max-w-[350px] pointer-events-auto px-4">
                        <button
                            onClick={handleSendClick}
                            disabled={!message.trim() || loading}
                            className="w-full h-[64px] rounded-[24px] bg-black text-white font-medium text-lg flex items-center justify-center gap-3 hover:bg-gray-900 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-xl shadow-black/20 ring-1 ring-white/20 backdrop-blur-xl"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Send size={22} className="ml-1" />
                            )}
                            <span className="font-bold tracking-tight">{loading ? "Отправка..." : "Отправить рассылку"}</span>
                        </button>
                    </div>
                </div>

                {/* Confirmation Dialog */}
                <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                    <DialogContent className="sm:max-w-md w-[90vw] rounded-[32px] border-none shadow-2xl bg-white/95 backdrop-blur-xl p-0 overflow-hidden gap-0 ring-1 ring-black/5">
                        <div className="p-8 pb-6 flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-gray-50 text-black flex items-center justify-center mb-5 shadow-sm">
                                <Send size={28} className="ml-1" />
                            </div>
                            <DialogTitle className="text-xl font-bold text-gray-900 mb-2">Подтверждение</DialogTitle>
                            <DialogDescription className="text-gray-500 font-medium leading-relaxed">
                                Вы действительно хотите отправить это сообщение <br />
                                <span className="text-black font-bold">
                                    {filters.find(f => f.id === filter)?.label.toLowerCase()}?
                                </span>
                            </DialogDescription>
                        </div>
                        <div className="p-6 pt-2 flex flex-col gap-3 w-full bg-gray-50/50">
                            <button
                                onClick={confirmSend}
                                className="w-full h-14 rounded-2xl bg-black text-white font-bold text-[16px] hover:bg-gray-900 active:scale-[0.98] transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-2"
                            >
                                <span className="mr-1">🚀</span> Да, отправить
                            </button>
                            <button
                                onClick={() => setConfirmOpen(false)}
                                className="w-full h-14 rounded-2xl bg-white text-gray-700 border border-gray-200 font-bold text-[16px] hover:bg-gray-50 active:scale-[0.98] transition-all"
                            >
                                Отмена
                            </button>
                        </div>
                    </DialogContent>
                </Dialog>

            </div>
        </div>
    )
}
