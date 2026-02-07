"use client"

import { useState, useEffect, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ShoppingBag, Clock, Truck, CheckCircle, XCircle, Package, ArrowRight, MapPin, CreditCard, MessageSquare, Calendar, ChevronDown, ShoppingBasket, Info, Sparkles, Gift, ChevronRight, X } from "lucide-react"
import Link from "next/link"
import { api, Order } from "@/lib/api"
import { useRouter, useSearchParams } from "next/navigation"
import { BottomNav } from "@/components/BottomNav"
import { cn } from "@/lib/utils"
import { AnimatedBackground } from "@/components/features/home/AnimatedBackground"

function OrdersPageContent() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState<number | null>(null)
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active')
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [clickPaymentBanner, setClickPaymentBanner] = useState<'success' | 'fail' | null>(null)
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initDataUnsafe?.user) {
            const tg = (window as any).Telegram.WebApp;
            const uid = tg.initDataUnsafe?.user?.id;
            if (uid) {
                setUserId(uid)
                fetchOrders(uid)
            } else {
                setLoading(false)
            }
        } else if (process.env.NODE_ENV === 'development') {
            const mockUserId = 12345678
            setUserId(mockUserId)
            fetchOrders(mockUserId)
        } else {
            setLoading(false)
        }
    }, [])

    // Периодическое обновление заказов — при смене статуса в админке клиент видит изменения (оплачен → в сборке → в пути → выполнен)
    useEffect(() => {
        if (!userId) return
        const interval = setInterval(() => {
            api.getUserOrders(userId).then(data => {
                setOrders(data)
                if (selectedOrder) {
                    const updated = data.find((o: Order) => o.id === selectedOrder.id)
                    if (updated) setSelectedOrder(updated)
                }
            }).catch(() => { })
        }, 25_000)
        return () => clearInterval(interval)
    }, [userId, selectedOrder])

    // Click return: /orders?paymentStatus=...&paymentId=...
    useEffect(() => {
        const status = searchParams.get('paymentStatus')
        const hasPaymentParams = status != null || searchParams.get('paymentId') != null
        if (!hasPaymentParams) return
        const n = parseInt(status || '', 10)
        if (!Number.isNaN(n)) {
            setClickPaymentBanner(n >= 2 ? 'success' : 'fail')
        }
        const uid = (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id) ?? (process.env.NODE_ENV === 'development' ? 12345678 : null)
        if (uid) {
            setUserId(uid)
            fetchOrders(uid)
        }
        router.replace('/orders', { scroll: false })
    }, [searchParams])

    // Fix background when modal is open
    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (isDetailsOpen) {
                document.body.style.overflow = 'hidden'
            } else {
                document.body.style.overflow = 'unset'
            }
            return () => {
                document.body.style.overflow = 'unset'
            }
        }
    }, [isDetailsOpen])

    const fetchOrders = (userId: number) => {
        api.getUserOrders(userId).then(data => {
            setOrders(data)
            setLoading(false)
        }).catch(err => {
            console.error(err)
            setLoading(false)
        })
    }

    const activeOrders = orders.filter(o => ['new', 'processing', 'shipping', 'pending_payment', 'paid'].includes(o.status))

    const historyOrders = orders.filter(o => ['done', 'cancelled'].includes(o.status))

    const currentOrders = activeTab === 'active' ? activeOrders : historyOrders

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'new': return { label: 'новый', color: 'text-blue-500', bg: 'bg-blue-50', icon: Clock }
            case 'pending_payment': return { label: 'ожидает оплаты', color: 'text-orange-500', bg: 'bg-orange-50', icon: CreditCard }
            case 'processing': return { label: 'собираем', color: 'text-amber-500', bg: 'bg-amber-50', icon: Package }
            case 'shipping': return { label: 'в пути', color: 'text-purple-500', bg: 'bg-purple-50', icon: Truck }
            case 'done': return { label: 'получен', color: 'text-green-500', bg: 'bg-green-50', icon: CheckCircle }
            case 'cancelled': return { label: 'отменен', color: 'text-red-500', bg: 'bg-red-50', icon: XCircle }
            case 'paid': return { label: 'оплачен', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle }
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
        <main className="min-h-screen bg-[#f9fafb] overflow-hidden">
            <motion.div
                animate={{
                    scale: isDetailsOpen ? 0.96 : 1,
                    opacity: isDetailsOpen ? 0.5 : 1,
                    filter: isDetailsOpen ? 'blur(8px)' : 'blur(0px)'
                }}
                transition={{ type: "spring", damping: 30, stiffness: 200 }}
                className="min-h-screen pb-32 relative pt-36"
            >
                <AnimatedBackground />

                {/* Header */}
                <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.03]">
                    <div className="px-4 h-16 flex items-center justify-between">
                        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full border border-black/5 bg-white/40 backdrop-blur-md active:scale-95 transition-all">
                            <ChevronLeft size={24} strokeWidth={2.5} className="text-black" />
                        </button>

                        <h1 className="text-[20px] font-medium text-black lowercase tracking-tighter">мои заказы</h1>

                        <Link href="/cart" className="w-10 h-10 flex items-center justify-center relative active:scale-95 transition-all opacity-40">
                            <ShoppingBag size={22} strokeWidth={2} className="text-black" />
                            {activeOrders.length > 0 && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                            )}
                        </Link>
                    </div>

                    {/* Tabs */}
                    <div className="px-4 pb-4">
                        <div className="flex p-1 bg-black/5 backdrop-blur-md rounded-[22px] border border-black/5">
                            <button
                                onClick={() => setActiveTab('active')}
                                className={cn(
                                    "flex-1 py-2.5 rounded-[18px] text-[14px] font-medium transition-all duration-300 lowercase",
                                    activeTab === 'active' ? "bg-white text-black shadow-sm" : "text-black/30"
                                )}
                            >
                                активные ({activeOrders.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={cn(
                                    "flex-1 py-2.5 rounded-[18px] text-[14px] font-medium transition-all duration-300 lowercase",
                                    activeTab === 'history' ? "bg-white text-black shadow-sm" : "text-black/30"
                                )}
                            >
                                история
                            </button>
                        </div>
                    </div>
                </header>

                {/* Click return banner */}
                <AnimatePresence>
                    {clickPaymentBanner && (
                        <motion.div
                            initial={{ opacity: 0, y: -12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            className="px-4 pt-4"
                        >
                            <div className={cn(
                                "rounded-[28px] p-5 flex items-center justify-between gap-3 border backdrop-blur-md",
                                clickPaymentBanner === 'success' ? "bg-green-50/80 border-green-200" : "bg-amber-50/80 border-amber-200"
                            )}>
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                                        clickPaymentBanner === 'success' ? "bg-green-100" : "bg-amber-100"
                                    )}>
                                        {clickPaymentBanner === 'success' ? (
                                            <CheckCircle size={24} className="text-green-600" />
                                        ) : (
                                            <XCircle size={24} className="text-amber-600" />
                                        )}
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className={cn(
                                            "font-black text-[16px] lowercase tracking-tight",
                                            clickPaymentBanner === 'success' ? "text-green-900" : "text-amber-900"
                                        )}>
                                            {clickPaymentBanner === 'success' ? 'оплата прошла' : 'оплата не прошла'}
                                        </p>
                                        <p className={cn(
                                            "text-[13px] font-medium lowercase opacity-70",
                                            clickPaymentBanner === 'success' ? "text-green-800" : "text-amber-800"
                                        )}>
                                            {clickPaymentBanner === 'success'
                                                ? 'спасибо! заказ в обработке.'
                                                : 'заказ ожидает оплаты. проверьте статус.'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setClickPaymentBanner(null)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors"
                                >
                                    <X size={16} className="text-black/40" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* List */}
                <div className="px-4 pt-4">
                    <AnimatePresence mode="popLayout">
                        {currentOrders.length > 0 ? (
                            <div className="space-y-5">
                                {currentOrders.map((order, i) => {
                                    const status = getStatusInfo(order.status)
                                    const date = new Date(order.created_at).toLocaleDateString('ru-RU', {
                                        day: 'numeric',
                                        month: 'long',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })
                                    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items

                                    return (
                                        <motion.div
                                            key={order.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.4, delay: i * 0.05 }}
                                            className="bg-white rounded-[28px] p-5 border border-black/5 relative overflow-hidden group active:scale-[0.99] transition-all"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("w-12 h-12 rounded-[18px] flex items-center justify-center shadow-sm", status.bg, status.color)}>
                                                        <status.icon size={24} strokeWidth={2.5} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-[17px] font-medium text-black leading-none mb-1.5 tracking-tight">заказ #{order.id}</h3>
                                                        <p className="text-[12px] font-medium text-black/20 lowercase">{date}</p>
                                                    </div>
                                                </div>
                                                <div className={cn("px-3 py-1.5 rounded-xl text-[10px] font-medium uppercase tracking-widest border",
                                                    status.bg.replace('/20', ''), status.color, status.color.replace('text-', 'border-').replace('500', '100'))}>
                                                    {status.label}
                                                </div>
                                            </div>

                                            {/* Preview Items */}
                                            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 mb-4">
                                                {items.map((item: any, idx: number) => (
                                                    <div key={idx} className="relative w-12 h-12 min-w-[48px] rounded-[14px] bg-white border border-black/5 overflow-hidden">
                                                        {item.image ? (
                                                            <img
                                                                src={item.image}
                                                                alt={item.name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    target.src = '/placeholder.png';
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-black/10 text-[10px]">?</div>
                                                        )}
                                                        <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm py-0.5 text-center">
                                                            <span className="text-[9px] font-medium text-white leading-none">x{item.quantity}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-black/5">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-medium text-black/20 uppercase tracking-widest leading-none mb-1">итого</span>
                                                    <span className="text-[16px] font-medium text-black leading-none">
                                                        {order.total_price.toLocaleString()} сум
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setSelectedOrder(order)
                                                        setIsDetailsOpen(true)
                                                    }}
                                                    className="flex items-center gap-1.5 px-4 h-9 bg-black text-white rounded-full text-[12px] font-medium active:scale-95 transition-all"
                                                >
                                                    детали
                                                    <ChevronRight size={12} strokeWidth={3} />
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
            </motion.div>

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
                            className="fixed bottom-0 left-0 right-0 z-[70] bg-white/80 backdrop-blur-2xl rounded-t-[44px] max-h-[94vh] overflow-y-auto no-scrollbar border-t border-white/40 shadow-[-20px_0_60px_rgba(0,0,0,0.1)]"
                        >
                            {/* Sticky Header with Close Button */}
                            <div className="sticky top-0 z-20 px-6 py-4 flex items-center justify-between bg-white/10 backdrop-blur-md">
                                <div className="w-12 h-1.5 bg-black/10 rounded-full absolute left-1/2 -translate-x-1/2 top-3" />

                                <div className="pt-2">
                                    <h2 className="text-[20px] font-medium text-black leading-none tracking-tight">детали заказа</h2>
                                    <p className="text-[13px] font-medium text-black/30 lowercase mt-1.5">#{selectedOrder.id} • {new Date(selectedOrder.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</p>
                                </div>

                                <button
                                    onClick={() => setIsDetailsOpen(false)}
                                    className="w-11 h-11 flex items-center justify-center rounded-full bg-black text-white hover:scale-95 active:scale-90 transition-all shadow-lg shadow-black/10"
                                >
                                    <X size={20} strokeWidth={3} />
                                </button>
                            </div>

                            <div className="px-5 pb-20 pt-2 space-y-6">
                                {/* Items Section */}
                                <div className="bg-gray-50/50 rounded-[32px] p-6 border border-black/[0.02]">
                                    <div className="flex items-center justify-between mb-5 px-1">
                                        <h3 className="text-[14px] font-medium text-black/40 uppercase tracking-[0.15em] flex items-center gap-2">
                                            состав заказа
                                        </h3>
                                        <div className={cn(
                                            "px-3 py-1 rounded-xl text-[10px] font-medium uppercase tracking-widest border",
                                            getStatusInfo(selectedOrder.status).bg,
                                            getStatusInfo(selectedOrder.status).color,
                                            getStatusInfo(selectedOrder.status).color.replace('text-', 'border-').replace('500', '100')
                                        )}>
                                            {getStatusInfo(selectedOrder.status).label}
                                        </div>
                                    </div>

                                    <div className="divide-y divide-black/[0.04]">
                                        {JSON.parse(selectedOrder.items).map((item: any, idx: number) => (
                                            <div key={idx} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                                                <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-black/5 bg-white">
                                                    {item.image ? (
                                                        <img
                                                            src={item.image}
                                                            alt={item.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-black/10 text-xs">?</div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-[15px] font-medium text-black leading-tight mb-1 lowercase">{item.name}</h4>
                                                    <p className="text-[12px] font-medium text-black/30 lowercase">
                                                        {item.quantity} шт × {item.price.toLocaleString()} сум
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[15px] font-medium text-black">{(item.price * item.quantity).toLocaleString()}</p>
                                                    <p className="text-[9px] font-medium text-black/20 uppercase tracking-tighter">сум</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Information Section */}
                                <div className="bg-gray-50/50 rounded-[32px] p-6 border border-black/[0.02] space-y-6">
                                    <h3 className="text-[14px] font-medium text-black/40 uppercase tracking-[0.15em] px-1">информация</h3>

                                    <div className="space-y-5">
                                        {/* Address Row */}
                                        {selectedOrder.address && (
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-black/[0.03]">
                                                    <MapPin size={18} className="text-black/60" />
                                                </div>
                                                <div className="pt-0.5">
                                                    <p className="text-[10px] font-medium text-black/30 uppercase tracking-widest mb-1">адрес доставки</p>
                                                    <p className="text-[14px] font-medium text-black/80 leading-relaxed lowercase">{selectedOrder.address}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Time & Payment Row */}
                                        <div className="grid grid-cols-2 gap-4">
                                            {selectedOrder.delivery_time && (
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-black/[0.03]">
                                                        <Clock size={18} className="text-black/60" />
                                                    </div>
                                                    <div className="pt-0.5">
                                                        <p className="text-[10px] font-medium text-black/30 uppercase tracking-widest mb-1">время</p>
                                                        <p className="text-[14px] font-medium text-black/80 lowercase">{selectedOrder.delivery_time}</p>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-black/[0.03]">
                                                    <CreditCard size={18} className="text-black/60" />
                                                </div>
                                                <div className="pt-0.5">
                                                    <p className="text-[10px] font-medium text-black/30 uppercase tracking-widest mb-1">оплата</p>
                                                    <p className="text-[14px] font-medium text-black/80 lowercase">
                                                        {selectedOrder.payment_method === 'cash' ? 'наличными' :
                                                            selectedOrder.payment_method === 'click' ? 'click' :
                                                                selectedOrder.payment_method === 'payme' ? 'payme' : selectedOrder.payment_method}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Comment Row */}
                                        {selectedOrder.comment && (
                                            <div className="flex items-start gap-4 p-5 rounded-2xl bg-amber-500/[0.04] border border-amber-500/10">
                                                <MessageSquare size={18} className="text-amber-500/60 shrink-0 mt-1" />
                                                <div>
                                                    <p className="text-[10px] font-medium text-amber-500/40 uppercase tracking-widest mb-1">пожелания</p>
                                                    <p className="text-[14px] font-medium text-amber-900 leading-relaxed italic lowercase">«{selectedOrder.comment}»</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Summary Card */}
                                <div className="p-8 pb-10 rounded-[44px] bg-black text-white shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />

                                    <div className="flex items-center justify-between mb-10 relative z-10 px-2">
                                        <div className="space-y-2">
                                            <p className="text-[11px] font-medium text-white/30 uppercase tracking-[0.2em]">итого к оплате</p>
                                            <h4 className="text-[34px] font-medium leading-none tracking-tight">
                                                {selectedOrder.total_price.toLocaleString()}
                                                <span className="text-[14px] text-white/30 uppercase ml-2">сум</span>
                                            </h4>
                                        </div>
                                        <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/5">
                                            <CheckCircle size={28} className="text-white/80" />
                                        </div>
                                    </div>

                                    <div className="space-y-4 relative z-10 px-2 opacity-30 border-t border-white/10 pt-6">
                                        <div className="flex items-center justify-between text-[13px] font-medium lowercase">
                                            <span>товары ({JSON.parse(selectedOrder.items).length})</span>
                                            <span>{selectedOrder.total_price.toLocaleString()} сум</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[13px] font-medium lowercase">
                                            <span>доставка</span>
                                            <span>бесплатно</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </main >
    )
}

export default function OrdersPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#f9fafb] p-6 space-y-6">
                <div className="h-8 w-40 bg-gray-200 rounded-lg animate-pulse mb-8" />
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-40 w-full bg-white rounded-[32px] border border-gray-100 animate-pulse" />
                ))}
            </div>
        }>
            <OrdersPageContent />
        </Suspense>
    )
}

