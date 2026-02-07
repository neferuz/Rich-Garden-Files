"use client"

import Link from "next/link"
import { ShoppingBag, ArrowUpRight, Truck, Activity, Coins, ListTodo, Package, Hammer, AlertCircle, Clock } from "lucide-react"
import { useState, useEffect } from "react"
import { api, Order, Product } from "@/services/api"

export default function StatsCards() {
  const [activeTab, setActiveTab] = useState("Новые")
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState({
    totalOrders: 0,
    newOrders: 0,
    totalRevenue: 0,
    totalExpense: 0,
    shipping: 0,
    active: 0,
    processing: 0,
    done: 0,
    stockCount: 0,
    criticalOrder: null as string | null
  })

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null)
        console.log("Fetching dashboard stats...")

        // Fetch individually to allow partial success and easier debugging
        let ordersData: Order[] = []
        try {
          ordersData = await api.getOrders()
        } catch (e) {
          console.error("Failed to fetch orders:", e)
          // setError("Failed to fetch orders") // Optional: show error
        }

        let productsData: Product[] = []
        try {
          productsData = await api.getProducts()
        } catch (e) {
          console.error("Failed to fetch products:", e)
        }

        let expensesData: any[] = []
        try {
          expensesData = await api.getExpenses()
        } catch (e) {
          console.error("Failed to fetch expenses:", e)
        }

        setOrders(ordersData)

        // Calculate Order Stats
        const totalOrders = ordersData.length
        const newOrders = ordersData.filter(o => o.status === "new").length
        const processing = ordersData.filter(o => o.status === "processing").length
        const shipping = ordersData.filter(o => o.status === "shipping").length
        const done = ordersData.filter(o => o.status === "done").length
        const active = newOrders + processing + shipping
        const totalRevenue = ordersData.reduce((sum, o) => sum + (o.total || 0), 0)

        // Calculate Expenses
        const totalExpense = expensesData.reduce((sum, e) => sum + (e.amount || 0), 0)

        // Find Critical Order (Oldest active)
        const activeOrders = ordersData.filter(o => ["new", "processing"].includes(o.status))
        const criticalOrder = activeOrders.length > 0 ? activeOrders[0].id : null

        // Calculate Stock Stats (Ingredients/Flowers)
        const flowers = productsData.filter(p => p.category === "Цветы" || p.category === "flowers")
        const stockCount = flowers.reduce((sum, p) => sum + (p.stock_quantity || 0), 0)

        setStats({
          totalOrders,
          newOrders,
          totalRevenue,
          totalExpense,
          shipping,
          active,
          processing,
          done,
          stockCount,
          criticalOrder
        })

      } catch (error: any) {
        console.error("Failed to fetch dashboard stats", error)
        setError(error.message || "Unknown error")
      }
    }
    fetchData()
  }, [])


  const originalStats = [
    {
      title: "Заказы",
      value: stats.totalOrders.toLocaleString(),
      subtext: `+${stats.newOrders} новых`,
      type: "blue",
      icon: ShoppingBag,
    },
    {
      title: "Финансы",
      value: `${(stats.totalRevenue / 1000000).toFixed(1)} млн`,
      subtext: `Расход: ${(stats.totalExpense / 1000000).toFixed(1)} млн`,
      type: "white",
      icon: Coins,
    },
    {
      title: "В доставке",
      value: stats.shipping.toString(),
      subtext: "Сейчас в пути",
      type: "white",
      icon: Truck,
    },
    {
      title: "Активные",
      value: stats.active.toString(),
      subtext: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      type: "white",
      icon: Activity,
    },
  ]

  const listStats = [
    {
      title: "Задачи",
      href: "/tasks",
      subtitle: "Live",
      value: stats.active > 0 ? `${stats.active}` : "Нет",
      subtext: stats.active > 0 ? "Активные" : "",
      icon: ListTodo,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
    },
    {
      title: "Остаток",
      href: "/warehouse",
      subtitle: "Цветы",
      value: `${stats.stockCount} шт`,
      subtext: "На складе",
      icon: Package,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
    },
    {
      title: "Сборка",
      href: "/orders?status=processing",
      subtitle: `${stats.processing} заказа`,
      value: stats.processing > 0 ? "Ждут" : "Пусто",
      subtext: "",
      icon: Hammer,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50",
    },
    {
      title: "Задержка",
      href: "/orders?status=new",
      subtitle: stats.criticalOrder ? `Заказ #${stats.criticalOrder}` : "Нет задержек",
      value: stats.criticalOrder ? "Критично" : "Ок",
      subtext: stats.criticalOrder ? "Требует внимания" : "Все в срок",
      icon: AlertCircle,
      iconColor: stats.criticalOrder ? "text-red-600" : "text-green-600",
      iconBg: stats.criticalOrder ? "bg-red-50" : "bg-green-50",
    },
  ]

  const tabs = [
    { id: "Новые", label: "Новые", count: stats.newOrders },
    { id: "В сборке", label: "В сборке", count: stats.processing },
    { id: "В доставке", label: "В доставке", count: stats.shipping },
    { id: "Завершено", label: "Завершено", count: stats.done },
  ]

  // Filter recent orders based on active tab
  const getFilteredOrders = () => {
    let filtered = orders;
    if (activeTab === "Новые") filtered = orders.filter(o => o.status === "new")
    else if (activeTab === "В сборке") filtered = orders.filter(o => o.status === "processing")
    else if (activeTab === "В доставке") filtered = orders.filter(o => o.status === "shipping")
    else if (activeTab === "Завершено") filtered = orders.filter(o => o.status === "done")

    return filtered.slice(0, 5) // Limit to 5
  }

  const recentOrders = getFilteredOrders()

  // Helper for status styling
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "shipping": return "bg-blue-50 text-blue-600"
      case "processing": return "bg-amber-50 text-amber-600"
      case "done": return "bg-green-50 text-green-600"
      case "new": return "bg-purple-50 text-purple-600"
      case "cancelled": return "bg-red-50 text-red-600"
      default: return "bg-gray-50 text-gray-600"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "shipping": return "В доставке"
      case "processing": return "В сборке"
      case "done": return "Выполнен"
      case "new": return "Новый"
      case "cancelled": return "Отменен"
      default: return status
    }
  }


  return (
    <div className="flex flex-col gap-6">
      {/* Original 4 Blocks Grid */}
      <div className="grid grid-cols-2 gap-3">
        {originalStats.map((stat, index) => {
          const isBlue = stat.type === "blue"

          // Determine link based on title
          let link = "/orders"
          if (stat.title === "Финансы") link = "/finance"
          if (stat.title === "В доставке") link = "/orders?status=shipping"
          if (stat.title === "Активные") link = "/orders?status=processing"

          return (
            <Link
              href={link}
              key={index}
              className={`
                relative p-5 rounded-[30px] flex flex-col justify-between h-44 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
                ${isBlue
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                  : "bg-gray-50 text-gray-900 border border-gray-100 shadow-sm hover:shadow-md"
                }
              `}
            >
              {/* Top Row: Icon and Button */}
              <div className="flex justify-between items-start">
                {/* Icon */}
                <div className={`p-2.5 rounded-2xl ${isBlue ? "bg-white/20" : "bg-white shadow-sm"}`}>
                  <stat.icon
                    size={24}
                    className={isBlue ? "text-white" : "text-gray-900"}
                    strokeWidth={1.5}
                  />
                </div>
                {/* Arrow Button */}
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center transition-colors
                    ${isBlue
                      ? "bg-white text-black hover:bg-white/90"
                      : "bg-white text-black hover:bg-gray-50 shadow-sm"
                    }
                  `}
                >
                  <ArrowUpRight size={20} strokeWidth={2} />
                </div>
              </div>
              {/* Bottom Row: Content */}
              <div className="mt-auto">
                <p className={`text-sm font-medium mb-1 ${isBlue ? "text-blue-100" : "text-gray-500"}`}>
                  {stat.title}
                </p>
                <h3 className="text-3xl font-bold tracking-tight leading-none mb-1">
                  {stat.value}
                </h3>
                {/* Optional Subtext */}
                {stat.subtext && (
                  <p className={`text-xs font-medium opacity-80 ${isBlue ? "text-blue-200" : "text-gray-400"}`}>
                    {stat.subtext}
                  </p>
                )}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Overview Block - Visual Update */}
      <div className="flex flex-col gap-4 pt-2">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Обзор</h2>
          <Link href="/tasks" className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors">
            Показать все
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          {listStats.map((stat, index) => (
            <Link
              href={stat.href}
              key={index}
              className="group flex items-center justify-between p-4 bg-white rounded-[24px] shadow-sm border border-gray-100 transition-all duration-300 active:scale-[0.99]"
            >
              <div className="flex items-center gap-4">
                {/* Icon with gradient background */}
                <div className={`w-12 h-12 flex items-center justify-center rounded-2xl ${stat.iconBg} ${stat.iconColor}`}>
                  <stat.icon size={22} strokeWidth={2} />
                </div>

                <div className="flex flex-col">
                  <span className="text-[15px] font-bold text-gray-900 leading-tight">
                    {stat.title}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-medium text-gray-500">
                      {stat.subtitle}
                    </span>
                    {/* Live Badge */}
                    {stat.subtitle === "Live" && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right flex flex-col items-end">
                {stat.value && (
                  <span className={`
                    inline-flex items-center px-2.5 py-1 rounded-[10px] text-xs font-bold leading-none
                    ${stat.value === "Критично"
                      ? "bg-red-50 text-red-600"
                      : stat.value === "Ждут"
                        ? "bg-amber-50 text-amber-600"
                        : "text-gray-900 text-base"
                    }
                  `}>
                    {stat.value === "Критично" && <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 animate-pulse"></span>}
                    {stat.value === "Ждут" && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>}
                    {stat.value}
                  </span>
                )}
                {stat.subtext && (
                  <span className="text-xs font-medium text-gray-400 mt-1">
                    {stat.subtext}
                  </span>
                )}
                {!stat.value && !stat.subtext && (
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                    <ArrowUpRight size={16} />
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Orders Block - Visual Update */}
      <div className="flex flex-col gap-4 pt-4 pb-20">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Последние заказы</h2>
          <Link href="/orders" className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors">
            Показать все
          </Link>
        </div>

        {/* Tabs - Cleaner Style */}
        <div className="bg-gray-50 p-1.5 rounded-[24px] grid grid-cols-4 gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex flex-col items-center justify-center py-3 px-1 rounded-[20px] transition-all duration-300 relative overflow-hidden
                  ${isActive
                    ? "bg-white text-gray-900 shadow-sm shadow-black/5"
                    : "text-gray-400 hover:text-gray-600 hover:bg-white/40"
                  }
                `}
              >
                <span className={`text-[10px] uppercase tracking-wider font-bold mb-0.5 ${isActive ? "opacity-100" : "opacity-60"}`}>
                  {tab.label}
                </span>
                <span className={`text-lg font-bold leading-none ${isActive ? "scale-105" : "scale-100"}`}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Orders List */}
        <div className="flex flex-col gap-3">
          {recentOrders.map((order, index) => (
            <Link
              href={`?order=${order.id}`}
              key={index}
              className="group flex items-center justify-between p-4 bg-white rounded-[24px] shadow-sm border border-gray-100 transition-all duration-300 active:scale-[0.99]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
                  <ShoppingBag size={22} strokeWidth={2.5} />
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-[17px] font-bold text-gray-900">#{order.id}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-500 mt-0.5">
                    {order.total.toLocaleString()} сум
                  </span>
                </div>
              </div>

              <div className="text-right flex flex-col items-end gap-1.5">
                <div className={`px-2.5 py-1 rounded-[10px] text-xs font-medium ${getStatusStyle(order.status)}`}>
                  {getStatusLabel(order.status)}
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <Clock size={12} strokeWidth={2.5} />
                  <span className="text-xs font-medium">{order.time}</span>
                </div>
              </div>
            </Link>
          ))}
          {recentOrders.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm font-medium">
              Список заказов пуст
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
