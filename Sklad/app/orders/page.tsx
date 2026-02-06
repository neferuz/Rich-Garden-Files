"use client"

import { useState, Suspense, useEffect } from "react"
import { Search, SlidersHorizontal, ChevronRight, Truck, Package, Clock, CheckCircle2, Circle, X } from "lucide-react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import OrderDetails from "@/components/OrderDetails"

// Mock Data
import { api } from '@/services/api'
import { Order } from '@/services/api' // Use type from API

// Removed static mock data


function OrdersContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const orderId = searchParams.get('order')
    const [orders, setOrders] = useState<Order[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        api.getOrders()
            .then(data => setOrders(data))
            .catch(err => console.error("Failed to load orders", err))
            .finally(() => setIsLoading(false))
    }, [])

    const selectedOrder = orderId ? orders.find(o => o.id === orderId) : null

    const handleCloseModal = () => {
        router.replace('/orders', { scroll: false })
    }

    // URL-based Filter Logic
    const statusFilter = searchParams.get('status') || "all"
    const timeFilter = searchParams.get('time') || "all"
    const typeFilter = searchParams.get('type') || "all"

    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value === 'all') {
            params.delete(key)
        } else {
            params.set(key, value)
        }
        router.push(`/orders?${params.toString()}`, { scroll: false })
    }

    const filteredOrders = orders.filter(order => {
        // Search Filter
        if (searchQuery && !order.client.toLowerCase().includes(searchQuery.toLowerCase()) && !order.id.includes(searchQuery)) return false

        // Time Filter
        const todayStr = new Date().toLocaleDateString('ru-RU');
        const probTomorrow = new Date();
        probTomorrow.setDate(probTomorrow.getDate() + 1);
        const tomorrowStr = probTomorrow.toLocaleDateString('ru-RU');

        if (timeFilter !== "all") {
            if (timeFilter === "today" && order.date !== todayStr) return false
            if (timeFilter === "tomorrow" && order.date !== tomorrowStr) return false
        }

        // Status Filter
        if (statusFilter !== "all" && order.status !== statusFilter) return false

        // Type Filter
        if (typeFilter !== "all" && order.type !== typeFilter) return false

        return true
    })

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "new": return <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wide">Новый</span>
            case "pending_payment": return <span className="px-2.5 py-1 rounded-lg bg-orange-100 text-orange-700 text-[10px] font-bold uppercase tracking-wide">Ожидает оплаты</span>
            case "processing": return <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wide">В сборке</span>
            case "shipping": return <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-700 text-[10px] font-bold uppercase tracking-wide">В пути</span>
            case "done": return <span className="px-2.5 py-1 rounded-lg bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wide">Завершен</span>
            case "paid": return <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wide">Оплачен</span>
            case "cancelled": return <span className="px-2.5 py-1 rounded-lg bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wide">Отменен</span>
            default: return null
        }
    }

    const getTypeIcon = (type: string) => {
        return type === 'delivery'
            ? <Truck size={14} className="text-gray-400" />
            : <Package size={14} className="text-gray-400" />
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-32 overflow-y-auto">

            {/* Header with Animated Search */}
            <div className="pt-6 px-6 mb-6">
                <div className="flex items-center justify-between h-14 mb-2 relative">
                    {/* Title & Search Icon (Visible when search is closed) */}
                    <div className={`absolute inset-0 flex items-center justify-between transition-all duration-300 ${isSearchOpen ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Заказы</h1>
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-900 shadow-sm active:scale-95 transition-all hover:bg-gray-50"
                        >
                            <Search size={20} />
                        </button>
                    </div>

                    {/* Search Input (Visible when search is open) */}
                    <div className={`absolute inset-0 flex items-center gap-2 transition-all duration-300 ${isSearchOpen ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 pointer-events-none'}`}>
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Поиск по номеру или клиенту..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-12 pl-12 pr-4 bg-white text-gray-900 placeholder:text-gray-400/80 rounded-[20px] border border-gray-200 shadow-none focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-gray-300 transition-all text-sm font-medium"
                                autoFocus={isSearchOpen}
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                <Search size={20} />
                            </div>
                        </div>

                        <button
                            onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }}
                            className="w-12 h-12 bg-white rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-red-500 shadow-md active:scale-95 transition-all shrink-0"
                        >
                            <X size={22} />
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-4">
                    {/* Row 1: Time */}
                    <div className="flex p-1 bg-gray-100 rounded-[20px] w-fit">
                        {["today", "tomorrow", "all"].map((t) => (
                            <button
                                key={t}
                                onClick={() => updateFilter('time', t)}
                                className={`px-5 py-2 rounded-2xl text-sm font-medium transition-all ${timeFilter === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                                    }`}
                            >
                                {t === 'today' ? 'Сегодня' : t === 'tomorrow' ? 'Завтра' : 'Все'}
                            </button>
                        ))}
                    </div>

                    {/* Row 2: Type & Status (Scrollable) */}
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                        {/* Type Toggle */}
                        <div className="flex shrink-0 gap-2 border-r border-gray-200 pr-2 mr-1">
                            <button onClick={() => updateFilter('type', typeFilter === 'all' ? 'delivery' : typeFilter === 'delivery' ? 'pickup' : 'all')}
                                className={`px-4 py-2.5 rounded-2xl border flex items-center gap-2 text-sm font-medium transition-colors ${typeFilter !== 'all' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600'
                                    }`}
                            >
                                <Truck size={18} />
                                {typeFilter === 'all' ? 'Тип' : typeFilter === 'delivery' ? 'Доставка' : 'Самовывоз'}
                            </button>
                        </div>

                        {/* Status Chips */}
                        {[
                            { id: 'all', label: 'Все' },
                            { id: 'new', label: 'Новые' },
                            { id: 'pending_payment', label: 'Ожидают оплаты' },
                            { id: 'processing', label: 'В сборке' },
                            { id: 'shipping', label: 'В пути' },
                            { id: 'done', label: 'Завершены' }
                        ].map(s => (
                            <button
                                key={s.id}
                                onClick={() => updateFilter('status', s.id)}
                                className={`shrink-0 px-4 py-2.5 rounded-2xl border text-sm font-medium transition-colors ${statusFilter === s.id
                                    ? "bg-[#2663eb] text-white border-[#2663eb]"
                                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Orders List */}
            <div className="px-4 space-y-3">
                {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                        <Link
                            key={order.id}
                            href={`/orders?order=${order.id}`}
                            scroll={false}
                            className="block bg-white p-5 rounded-[24px] shadow-[0_6px_24px_rgba(0,0,0,0.06)] active:scale-[0.98] transition-transform"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-lg text-gray-900">№{order.id}</span>
                                    {getTypeIcon(order.type)}
                                </div>
                                {getStatusBadge(order.status)}
                            </div>

                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="font-semibold text-gray-900">{order.client}</p>
                                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 font-medium">
                                        <Clock size={14} className="text-gray-400" />
                                        <span>{order.time}</span>
                                        <span className="text-gray-300">•</span>
                                        <span>{order.items.length} поз.</span>
                                    </div>
                                </div>
                                <span className="font-bold text-gray-900 text-lg">{order.total.toLocaleString('ru-RU')}</span>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                        <Package size={48} className="text-gray-300 mb-4" />
                        <p className="text-lg font-bold text-gray-900">Заказов нет</p>
                        <p className="text-sm text-gray-500">По выбранным фильтрам ничего не найдено</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {selectedOrder && (
                <OrderDetails order={selectedOrder} isModal={true} onClose={handleCloseModal} />
            )}

        </div>
    )
}

import ProtectedRoute from "@/components/ProtectedRoute"

export default function OrdersPage() {
    return (
        <ProtectedRoute allowedRoles={['owner', 'admin', 'manager', 'worker', 'courier', 'finance']}>
            <Suspense fallback={<div className="min-h-screen bg-gray-50/50" />}>
                <OrdersContent />
            </Suspense>
        </ProtectedRoute>
    )
}
