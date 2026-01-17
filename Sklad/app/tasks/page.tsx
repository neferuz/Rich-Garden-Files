"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, AlertTriangle, Clock, AlertCircle, ChevronRight, Filter, Search, X } from "lucide-react"
import { api, Product, Order } from "@/services/api"
import { useRouter } from "next/navigation"
import ProductDetails from "@/components/ProductDetails"
import OrderDetails from "@/components/OrderDetails"

type Task = {
    id: string
    title: string
    subtitle: string
    value: string
    type: 'critical' | 'warning' | 'info' | 'success'
    icon: any
    link?: string
    timestamp: string
}

export default function TasksPage() {
    const router = useRouter()
    const [tasks, setTasks] = useState<Task[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'processing'>('all')
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ordersData, productsData] = await Promise.all([
                    api.getOrders(),
                    api.getProducts()
                ])

                const newTasks: Task[] = []

                // 1. Critical Stock (Low Quantity)
                const lowStockProducts = productsData.filter(p => (p.stock_quantity || 0) < 10)
                lowStockProducts.forEach(p => {
                    newTasks.push({
                        id: `stock-${p.id}`,
                        title: "Низкий остаток",
                        subtitle: p.name,
                        value: `${p.stock_quantity} шт`,
                        type: 'critical',
                        icon: AlertTriangle,
                        link: `/warehouse/${p.id}`,
                        timestamp: 'Сейчас'
                    })
                })

                // 2. Delayed Orders (Mock: orders created > 2 hours ago and still new/processing)
                // Real logic would compare dates. For now, filter "processing" as priority.
                const processingOrders = ordersData.filter(o => o.status === 'processing')
                processingOrders.forEach(o => {
                    newTasks.push({
                        id: `order-proc-${o.id}`,
                        title: "Сборка заказа",
                        subtitle: `Заказ #${o.id}`,
                        value: "В работе",
                        type: 'info',
                        icon: Clock,
                        link: `/orders/${o.id}`,
                        timestamp: o.time
                    })
                })

                // 3. New Orders
                const newOrders = ordersData.filter(o => o.status === 'new')
                newOrders.forEach(o => {
                    newTasks.push({
                        id: `order-new-${o.id}`,
                        title: "Новый заказ",
                        subtitle: `Заказ #${o.id}`,
                        value: "Ожидает",
                        type: 'warning',
                        icon: AlertCircle,
                        link: `/orders/${o.id}`,
                        timestamp: o.time
                    })
                })

                setTasks(newTasks)
                setIsLoading(false)
            } catch (error) {
                console.error("Failed to fetch tasks", error)
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    const handleTaskClick = async (task: Task) => {
        if (task.id.startsWith('stock-')) {
            const productId = task.id.replace('stock-', '')
            try {
                const product = await api.getProductById(Number(productId))
                setSelectedProduct(product)
            } catch (e) {
                console.error("Failed to load product", e)
            }
        } else if (task.id.startsWith('order-')) {
            const orderId = task.id.replace('order-new-', '').replace('order-proc-', '')
            try {
                // Determine ID properly based on prefix to be safe, though simple replace works if standard
                const realId = task.id.split('-').pop()
                if (realId) {
                    const order = await api.getOrderById(realId)
                    setSelectedOrder(order)
                }
            } catch (e) {
                console.error("Failed to load order", e)
            }
        } else if (task.link) {
            router.push(task.link)
        }
    }

    const getIconStyle = (type: string) => {
        switch (type) {
            case 'critical': return "bg-red-50 text-red-600"
            case 'warning': return "bg-amber-50 text-amber-600"
            case 'info': return "bg-blue-50 text-blue-600"
            case 'success': return "bg-green-50 text-green-600"
            default: return "bg-gray-50 text-gray-500"
        }
    }

    const filteredTasks = tasks.filter(task => {
        if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) && !task.subtitle.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false
        }
        if (activeTab === 'all') return true
        if (activeTab === 'critical') return task.type === 'critical' || task.type === 'warning'
        if (activeTab === 'processing') return task.type === 'info'
        return true
    })

    return (
        <div className="min-h-screen bg-gray-50/50 pb-32">
            {/* Header */}
            <div className="pt-6 px-6 mb-6">
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/" className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-100 text-gray-500 hover:text-black transition-colors shadow-sm">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Задачи</h1>
                    <div className="bg-gray-100 rounded-full px-2.5 py-0.5 text-xs font-bold text-gray-600">
                        {tasks.length}
                    </div>
                    <button
                        onClick={() => {
                            setIsSearchOpen(!isSearchOpen)
                            if (isSearchOpen) setSearchQuery("")
                        }}
                        className="ml-auto w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-100 text-gray-500 hover:text-black transition-colors shadow-sm"
                    >
                        {isSearchOpen ? <X size={20} /> : <Search size={20} />}
                    </button>
                </div>

                {/* Animated Search Input */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isSearchOpen ? 'max-h-16 mb-4 opacity-100' : 'max-h-0 mb-0 opacity-0'}`}>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Поиск задачи..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-12 bg-white rounded-[18px] pl-11 pr-4 text-sm font-medium border border-gray-100 focus:outline-none focus:ring-2 focus:ring-black/5"
                        />
                    </div>
                </div>

                {/* Filter Tabs (Mock) */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    <button onClick={() => setActiveTab('all')} className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === 'all' ? 'bg-black text-white shadow-md shadow-black/10' : 'bg-white text-gray-600 border border-gray-100'}`}>
                        Все
                    </button>
                    <button onClick={() => setActiveTab('critical')} className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === 'critical' ? 'bg-black text-white shadow-md shadow-black/10' : 'bg-white text-gray-600 border border-gray-100'}`}>
                        Критические
                    </button>
                    <button onClick={() => setActiveTab('processing')} className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === 'processing' ? 'bg-black text-white shadow-md shadow-black/10' : 'bg-white text-gray-600 border border-gray-100'}`}>
                        Сборка
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="px-5 flex flex-col gap-3">
                {isLoading ? (
                    <div className="text-center py-10 text-gray-400">Загрузка задач...</div>
                ) : filteredTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-green-50 text-green-500 flex items-center justify-center mb-4">
                            <CheckCircle2 size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Все чисто!</h3>
                        <p className="text-gray-500 text-sm">Нет задач в этой категории.</p>
                    </div>
                ) : (
                    filteredTasks.map((task) => (
                        <div key={task.id} onClick={() => handleTaskClick(task)} className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-100 active:scale-[0.99] transition-transform cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${getIconStyle(task.type)}`}>
                                    <task.icon size={22} strokeWidth={2} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <h3 className="font-bold text-gray-900 text-[15px]">{task.title}</h3>
                                        <span className="text-xs font-medium text-gray-400">{task.timestamp}</span>
                                    </div>
                                    <p className="text-sm text-gray-500 truncate">{task.subtitle}</p>
                                </div>
                                <div className={`px-2.5 py-1 rounded-[10px] text-xs font-bold whitespace-nowrap ${getIconStyle(task.type)}`}>
                                    {task.value}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            {selectedProduct && (
                <ProductDetails
                    item={selectedProduct}
                    isModal={true}
                    onClose={() => setSelectedProduct(null)}
                />
            )}
            {selectedOrder && (
                <OrderDetails
                    order={selectedOrder}
                    isModal={true}
                    onClose={() => setSelectedOrder(null)}
                />
            )}
        </div>
    )
}
