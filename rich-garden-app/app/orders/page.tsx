"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ShoppingBag, Clock, Truck, CheckCircle, XCircle, Package, ArrowRight, MapPin, CreditCard, MessageSquare, Calendar, ChevronDown, ShoppingBasket, Info, Sparkles, Gift, ChevronRight } from "lucide-react"
import Link from "next/link"
import { api, Order } from "@/lib/api"
import { useRouter } from "next/navigation"
import { BottomNav } from "@/components/BottomNav"
import { cn } from "@/lib/utils"
import Image from "next/image"

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active')
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const router = useRouter()

    useEffect(() => {
        let telegramId = 12345; // Default for dev
        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
            const tg = (window as any).Telegram.WebApp;
            if (tg.initDataUnsafe?.user?.id) {
                telegramId = tg.initDataUnsafe.user.id;
            }
        }

        api.getUserOrders(telegramId).then(data => {
            setOrders(data)
            setLoading(false)
        }).catch(err => {
            console.error(err)
            setLoading(false)
        })
    }, [])

    const activeOrders = orders.filter(o => ['new', 'processing', 'shipping'].includes(o.status))
    const historyOrders = orders.filter(o => ['done', 'cancelled'].includes(o.status))

    const currentOrders = activeTab === 'active' ? activeOrders : historyOrders

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'new': return { label: 'новый', color: 'text-blue-500', bg: 'bg-blue-50', icon: Clock }
            case 'processing': return { label: 'собираем', color: 'text-amber-500', bg: 'bg-amber-50', icon: Package }
            case 'shipping': return { label: 'в пути', color: 'text-purple-500', bg: 'bg-purple-50', icon: Truck }
            case 'done': return { label: 'получен', color: 'text-green-500', bg: 'bg-green-50', icon: CheckCircle }
            case 'cancelled': return { label: 'отменен', color: 'text-red-500', bg: 'bg-red-50', icon: XCircle }
            default: return { label: status, color: 'text-gray-500', bg: 'bg-gray-50', icon: Clock }
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f9fafb] p-6 space-y-6">
                <div className="h-8 w-40 bg-gray-200 rounded-lg animate-pulse mb-8" />
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-40 w-full bg-white rounded-[32px] border border-gray-100 animate-pulse" />
                ))}
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-[#f9fafb] pb-32">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
                <div className="px-4 h-16 flex items-center justify-between">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full border border-black/10 bg-transparent active:scale-95 transition-transform">
                        <ChevronLeft size={24} strokeWidth={1.5} className="text-black" />
                    </button>

                    <h1 className="text-[22px] font-bold text-black lowercase tracking-tight">мои заказы</h1>

                    <Link href="/cart" className="w-10 h-10 flex items-center justify-center relative active:scale-95 transition-transform">
                        <ShoppingBag size={22} strokeWidth={1.5} className="text-black" />
                        {activeOrders.length > 0 && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        )}
                    </Link>
                </div>

                {/* Tabs */}
                <div className="px-4 pb-4">
                    <div className="flex p-1 bg-gray-100/50 rounded-[20px] backdrop-blur-sm border border-gray-100">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={cn(
                                "flex-1 py-2.5 rounded-[16px] text-[14px] font-bold transition-all duration-300 lowercase",
                                activeTab === 'active' ? "bg-white text-black shadow-sm" : "text-gray-400"
                            )}
                        >
                            активные ({activeOrders.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={cn(
                                "flex-1 py-2.5 rounded-[16px] text-[14px] font-bold transition-all duration-300 lowercase",
                                activeTab === 'history' ? "bg-white text-black shadow-sm" : "text-gray-400"
                            )}
                        >
                            история
                        </button>
                    </div>
                </div>
            </header>

            {/* List */}
            <div className="px-4 pt-6">
                <AnimatePresence mode="popLayout">
                    {currentOrders.length > 0 ? (
                        <div className="space-y-4">
                            {currentOrders.map((order, i) => {
                                const status = getStatusInfo(order.status)
                                const date = new Date(order.created_at).toLocaleDateString('ru-RU', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })
                                const items = JSON.parse(order.items)

                                return (
                                    <motion.div
                                        key={order.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.4, delay: i * 0.05, ease: [0.23, 1, 0.32, 1] }}
                                        className="bg-white rounded-[32px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100/50 relative overflow-hidden group"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-active:scale-95", status.bg, status.color)}>
                                                    <status.icon size={24} strokeWidth={1.5} />
                                                </div>
                                                <div>
                                                    <h3 className="text-[17px] font-black text-black leading-none mb-1.5">#{order.id}</h3>
                                                    <p className="text-[13px] font-medium text-gray-400 lowercase">{date}</p>
                                                </div>
                                            </div>
                                            <div className={cn("px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border",
                                                status.bg, status.color, status.color.replace('text-', 'border-').replace('500', '100'))}>
                                                {status.label}
                                            </div>
                                        </div>

                                        {/* Preview Items */}
                                        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 mb-4">
                                            {items.map((item: any, idx: number) => (
                                                <div key={idx} className="relative w-14 h-14 min-w-[56px] rounded-[18px] bg-gray-50 border border-gray-100 overflow-hidden">
                                                    <Image
                                                        src={item.image && item.image.startsWith('http') ? item.image : `http://localhost:8000${item.image || ''}`}
                                                        alt={item.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                    <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm py-0.5 text-center">
                                                        <span className="text-[10px] font-bold text-white leading-none">x{item.quantity}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">итого</span>
                                                <span className="text-[18px] font-black text-black leading-none">
                                                    {order.total_price.toLocaleString()} сум
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setSelectedOrder(order)
                                                    setIsDetailsOpen(true)
                                                }}
                                                className="flex items-center gap-2 px-4 h-10 bg-black text-white rounded-full text-[13px] font-bold active:scale-95 transition-transform"
                                            >
                                                детали
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-8">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-20 h-20 bg-gray-50 rounded-[24px] flex items-center justify-center mb-6"
                            >
                                <ShoppingBag size={32} className="text-gray-200" strokeWidth={1} />
                            </motion.div>
                            <h2 className="text-[24px] font-black text-black leading-tight tracking-tight mb-2">
                                {activeTab === 'active' ? 'активных нет' : 'история пуста'}
                            </h2>
                            <p className="text-gray-500 text-[15px] font-medium leading-snug mb-8 max-w-[200px]">
                                {activeTab === 'active'
                                    ? 'самое время заказать что-нибудь красивое'
                                    : 'здесь будут ваши завершенные заказы'}
                            </p>
                            <Link
                                href="/"
                                className="inline-flex items-center justify-center h-14 px-8 bg-black text-white font-bold rounded-none active:scale-95 transition-transform w-fit"
                            >
                                в каталог
                            </Link>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            <BottomNav />

            {/* Order Details Bottom Sheet */}
            <AnimatePresence>
                {isDetailsOpen && selectedOrder && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDetailsOpen(false)}
                            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                        />
                        {/* Sheet */}
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-[40px] max-h-[92vh] overflow-y-auto no-scrollbar shadow-[0_-20px_50px_rgba(0,0,0,0.1)]"
                        >
                            {/* Drag Handle */}
                            <div className="sticky top-0 z-10 bg-white pt-4 pb-2">
                                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto" />
                            </div>

                            <div className="px-6 pb-20">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-[32px] font-black text-black leading-none mb-2 tracking-tighter">заказ #{selectedOrder.id}</h2>
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <Calendar size={14} />
                                            <span className="text-[13px] font-bold lowercase">
                                                {new Date(selectedOrder.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "px-4 py-2 rounded-2xl text-[12px] font-black uppercase tracking-wider border",
                                        getStatusInfo(selectedOrder.status).bg,
                                        getStatusInfo(selectedOrder.status).color,
                                        getStatusInfo(selectedOrder.status).color.replace('text-', 'border-').replace('500', '100')
                                    )}>
                                        {getStatusInfo(selectedOrder.status).label}
                                    </div>
                                </div>

                                {/* Items Section */}
                                <div className="mb-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-[18px] font-black text-black lowercase tracking-tight">ваш выбор</h3>
                                        <span className="text-[13px] font-bold text-gray-400 lowercase">
                                            {JSON.parse(selectedOrder.items).length} товара
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        {JSON.parse(selectedOrder.items).map((item: any, idx: number) => (
                                            <div key={idx} className="flex items-center gap-4 p-3 rounded-3xl bg-gray-50/50 border border-gray-100">
                                                <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0">
                                                    <Image
                                                        src={item.image && item.image.startsWith('http') ? item.image : `http://localhost:8000${item.image || ''}`}
                                                        alt={item.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-[15px] font-bold text-black leading-tight truncate lowercase">{item.name}</h4>
                                                    <p className="text-[13px] font-medium text-gray-400 mt-1 lowercase">{item.quantity} шт • {(item.price * item.quantity).toLocaleString()} сум</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-1 gap-4 mb-8">
                                    {/* Address */}
                                    {selectedOrder.address && selectedOrder.address.trim() !== '' && (
                                        <div className="p-5 rounded-[32px] bg-gray-50/50 border border-gray-100">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-[18px] bg-black flex items-center justify-center">
                                                    <MapPin size={20} className="text-white" />
                                                </div>
                                                <span className="text-[14px] font-black text-black lowercase">адрес доставки</span>
                                            </div>
                                            <p className="text-[15px] font-bold text-gray-500 lowercase leading-relaxed">
                                                {selectedOrder.address}
                                            </p>
                                        </div>
                                    )}

                                    {/* Wishes/Comment */}
                                    {selectedOrder.comment && selectedOrder.comment.trim() !== '' && (
                                        <div className="p-5 rounded-[32px] bg-[#FFF8F2] border border-[#FF8A00]/10">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-[18px] bg-[#FF8A00] flex items-center justify-center">
                                                    <MessageSquare size={20} className="text-white" />
                                                </div>
                                                <span className="text-[14px] font-black text-black lowercase">пожелания</span>
                                            </div>
                                            <p className="text-[15px] font-bold text-[#FF8A00] lowercase leading-relaxed">
                                                «{selectedOrder.comment}»
                                            </p>
                                        </div>
                                    )}

                                    {/* Wow Effect */}
                                    {selectedOrder.extras && (() => {
                                        try {
                                            const extras = JSON.parse(selectedOrder.extras);
                                            if (!extras.wow_effect) return null;
                                            return (
                                                <div className="p-5 rounded-[32px] bg-[#F2F8FF] border border-blue-500/10">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-10 h-10 rounded-[18px] bg-blue-500 flex items-center justify-center">
                                                            <Sparkles size={20} className="text-white" />
                                                        </div>
                                                        <span className="text-[14px] font-black text-black lowercase">вау эффект</span>
                                                    </div>
                                                    <p className="text-[15px] font-bold text-blue-600 lowercase leading-relaxed">
                                                        {extras.wow_effect === 'violin' ? 'скрипач' :
                                                            extras.wow_effect === 'brutal' ? 'брутальный мужчина' :
                                                                extras.wow_effect}
                                                    </p>
                                                </div>
                                            );
                                        } catch (e) { return null; }
                                    })()}

                                    {/* Addons (Balloons, Toys) */}
                                    {selectedOrder.extras && (() => {
                                        try {
                                            const extras = JSON.parse(selectedOrder.extras);
                                            if (!extras.addons || extras.addons.length === 0) return null;
                                            return (
                                                <div className="p-5 rounded-[32px] bg-pink-50/50 border border-pink-500/10">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-10 h-10 rounded-[18px] bg-pink-500 flex items-center justify-center">
                                                            <Gift size={20} className="text-white" />
                                                        </div>
                                                        <span className="text-[14px] font-black text-black lowercase">дополнительно</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {extras.addons.map((addon: string, idx: number) => (
                                                            <span key={idx} className="px-3 py-1 bg-white border border-pink-100 rounded-full text-[13px] font-bold text-pink-500 lowercase">
                                                                {addon === 'balloons' ? 'шары' :
                                                                    addon === 'bear' ? 'мишка тедди' :
                                                                        addon === 'bunny' ? 'зайка' : addon}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        } catch (e) { return null; }
                                    })()}

                                    {/* Payment Method */}
                                    {selectedOrder.payment_method && selectedOrder.payment_method.trim() !== '' && (
                                        <div className="p-5 rounded-[32px] bg-gray-50/50 border border-gray-100">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-[18px] bg-gray-200 flex items-center justify-center">
                                                    <CreditCard size={20} className="text-black" />
                                                </div>
                                                <span className="text-[14px] font-black text-black lowercase">оплата</span>
                                            </div>
                                            <p className="text-[15px] font-bold text-gray-500 lowercase">
                                                {selectedOrder.payment_method === 'cash' ? 'наличными курьеру' :
                                                    selectedOrder.payment_method === 'click' ? 'click' :
                                                        selectedOrder.payment_method === 'payme' ? 'payme' :
                                                            selectedOrder.payment_method === 'uzum' ? 'uzum' :
                                                                selectedOrder.payment_method}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Summary */}
                                <div className="p-6 rounded-[36px] bg-black text-white">
                                    <div className="flex items-center justify-between mb-2 opacity-50">
                                        <span className="text-[13px] font-bold lowercase">товары</span>
                                        <span className="text-[13px] font-bold">{selectedOrder.total_price.toLocaleString()} сум</span>
                                    </div>
                                    <div className="flex items-center justify-between mb-4 opacity-50">
                                        <span className="text-[13px] font-bold lowercase">доставка</span>
                                        <span className="text-[13px] font-bold">бесплатно</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                        <h5 className="text-[20px] font-black lowercase tracking-tighter">итого</h5>
                                        <p className="text-[24px] font-black tracking-tight">{selectedOrder.total_price.toLocaleString()} сум</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setIsDetailsOpen(false)}
                                    className="w-full h-[72px] mt-6 bg-gray-100 rounded-[28px] text-black font-black text-[17px] active:scale-[0.98] transition-all lowercase"
                                >
                                    закрыть
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </main>
    )
}

