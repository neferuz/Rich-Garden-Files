"use client"

import { Search, SlidersHorizontal, Package, Clock, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useRef } from "react"
import { api, Order } from "@/services/api"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

export default function SearchBar() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Order[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  useEffect(() => {
    if (query.length > 0) {
      setIsLoading(true)
      api.getOrders().then(orders => {
        const filtered = orders.filter(o =>
          o.id.toLowerCase().includes(query.toLowerCase()) ||
          o.client.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5)
        setResults(filtered)
        setIsOpen(true)
      }).finally(() => setIsLoading(false))
    } else {
      setResults([])
      setIsOpen(false)
    }
  }, [query])

  const handleSelect = (orderId: string) => {
    router.push(`/orders?order=${orderId}`)
    setIsOpen(false)
    setQuery("")
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <div className="w-2 h-2 rounded-full bg-blue-500" />
      case 'processing': return <div className="w-2 h-2 rounded-full bg-amber-500" />
      case 'shipping': return <div className="w-2 h-2 rounded-full bg-purple-500" />
      case 'done': return <div className="w-2 h-2 rounded-full bg-green-500" />
      default: return <div className="w-2 h-2 rounded-full bg-gray-300" />
    }
  }

  return (
    <div className="px-6 pt-24 pb-2 w-full relative z-30" ref={containerRef}>
      <div className="w-full max-w-2xl mx-auto relative">
        <div className="relative group">
          {/* Input Wrapper */}
          <div className="relative flex items-center w-full transition-all duration-300 transform">
            {/* Input Field */}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => query.length > 0 && setIsOpen(true)}
              placeholder="Поиск по ID или клиенту..."
              className="w-full h-14 pl-12 pr-28 bg-white/70 backdrop-blur-md text-gray-900 placeholder:text-gray-500 placeholder:font-medium rounded-[24px] border border-gray-200/50 shadow-sm focus:bg-white focus:ring-4 focus:ring-black/5 focus:shadow-xl focus:border-gray-300 transition-all duration-300 text-[15px] font-medium"
            />

            {/* Search Icon (Left) - Always visible on top */}
            <div className="absolute left-4 flex items-center pointer-events-none text-gray-500 z-20">
              <Search size={20} strokeWidth={2} />
            </div>

            {/* Icons Group on the right */}
            <div className="absolute right-3 flex items-center gap-1 z-20">
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Очистить"
                >
                  <X size={18} strokeWidth={2} />
                </button>
              )}

              <div className="w-[1px] h-6 bg-gray-200/80 mx-1" />

              {/* Filter Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-gray-50 text-gray-500 hover:bg-black hover:text-white hover:shadow-lg hover:shadow-black/20 transition-all duration-300 border border-gray-100"
              >
                <SlidersHorizontal size={18} strokeWidth={1.5} />
              </Button>
            </div>
          </div>

          {/* Results Dropdown */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 5, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-xl border border-gray-100 rounded-[28px] shadow-2xl overflow-hidden shadow-black/10 z-40"
              >
                {results.length > 0 ? (
                  <div className="p-2">
                    {results.map((order) => (
                      <button
                        key={order.id}
                        onClick={() => handleSelect(order.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50/80 rounded-[22px] transition-all duration-200 group active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-black group-hover:text-white transition-all duration-300">
                            <Package size={20} strokeWidth={1.5} />
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-bold text-gray-900 tracking-tight">#{order.id}</span>
                              {getStatusIcon(order.status)}
                            </div>
                            <p className="text-xs font-medium text-gray-500 truncate max-w-[180px]">
                              {order.client}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-[15px] font-bold text-gray-900 leading-none mb-1">
                              {order.total.toLocaleString()} сум
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1 justify-end uppercase tracking-wider">
                              <Clock size={10} strokeWidth={2.5} /> {order.time}
                            </p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-black group-hover:text-white transition-all duration-300">
                            <ChevronRight size={16} strokeWidth={2.5} />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-10 text-center">
                    <div className="w-14 h-14 bg-gray-50 rounded-[20px] flex items-center justify-center mx-auto mb-4 text-gray-300">
                      <Search size={24} strokeWidth={1.5} />
                    </div>
                    <p className="text-base font-bold text-gray-900">Ничего не найдено</p>
                    <p className="text-xs font-medium text-gray-400 mt-1">Попробуйте поискать по-другому</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

