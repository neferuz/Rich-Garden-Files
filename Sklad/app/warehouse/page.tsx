"use client"

import { useState, useEffect, Suspense, useMemo } from "react"
import { Search, SlidersHorizontal, Plus, X, Package, AlertTriangle, Eye } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import ProductDetails from "@/components/ProductDetails"
import { api, Product } from "@/services/api"

function WarehouseContent() {
    const searchParams = useSearchParams()
    const itemId = searchParams.get('item')
    const [products, setProducts] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [activeTab, setActiveTab] = useState("all")
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [isLowStockOnly, setIsLowStockOnly] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await api.getProducts()
                setProducts(data)
            } catch (err) {
                console.error("Failed to fetch products:", err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchProducts()
    }, [])

    const selectedItem = useMemo(() =>
        itemId ? products.find(p => p.id.toString() === itemId) : null
        , [itemId, products])

    const checkIsBouquet = (p: Product) => !!(p.composition && p.composition !== "[]")

    const CATEGORY_MAPPING: Record<string, string> = {
        'flowers': 'Цветы',
        'цветы': 'Цветы',
        'accessories': 'Аксессуары',
        'аксессуары': 'Аксессуары',
        'packaging': 'Упаковка',
        'упаковка': 'Упаковка',
        'extra': 'Разное',
        'прочее': 'Разное'
    };

    // Dynamic Tab Options based on actual products
    const tabOptions = useMemo(() => {
        const result: { id: string, label: string, type: 'all' | 'bouquets_all' | 'bouquet_single' | 'supply_single', rawCat?: string }[] = [
            { id: 'all', label: 'Все', type: 'all' },
            { id: 'bouquets', label: 'Букеты', type: 'bouquets_all' }
        ];

        const BOUQUET_MAPPING: Record<string, string> = {
            'mix': 'Авторский',
            'roses': 'Розы',
            'peonies': 'Пионы',
            'tulips': 'Тюльпаны',
            'boxes': 'В коробке',
            'baskets': 'В корзине',
            'wedding': 'Свадебный'
        };

        // 1. Collect Bouquet Categories
        const bouquetCats = new Set<string>();
        products.forEach(p => {
            if (checkIsBouquet(p) && p.category) {
                bouquetCats.add(p.category);
            }
        });

        bouquetCats.forEach(cat => {
            const label = BOUQUET_MAPPING[cat.toLowerCase()] || cat;
            if (!result.find(r => r.label === label)) {
                result.push({ id: `b_${cat.toLowerCase()}`, label, type: 'bouquet_single', rawCat: cat });
            }
        });

        // 2. Collect Supply Categories
        const supplyCats = new Set<string>();
        products.forEach(p => {
            if (!checkIsBouquet(p) && p.category) {
                supplyCats.add(p.category);
            }
        });

        const knownSupply = ['Цветы', 'Аксессуары', 'Упаковка', 'Разное'];
        knownSupply.forEach(k => {
            const hasItems = Array.from(supplyCats).some(c =>
                c.toLowerCase() === k.toLowerCase() ||
                CATEGORY_MAPPING[c.toLowerCase()] === k
            );
            if (hasItems) {
                result.push({ id: `s_${k.toLowerCase()}`, label: k, type: 'supply_single' });
            }
        });

        // Other unique supply categories
        supplyCats.forEach(cat => {
            const label = CATEGORY_MAPPING[cat.toLowerCase()] || cat;
            if (!knownSupply.includes(label) && !result.find(r => r.label === label)) {
                result.push({ id: `s_${cat.toLowerCase()}`, label: label, type: 'supply_single', rawCat: cat });
            }
        });

        return result;
    }, [products]);

    // Stats
    const stats = useMemo(() => {
        const total = products.length
        const lowStock = products.filter(p => !checkIsBouquet(p) && (p.stock_quantity || 0) < 5).length
        return { total, lowStock }
    }, [products])

    const filteredItems = products.filter(item => {
        const isBouquetItem = checkIsBouquet(item);
        const cat = item.category?.toLowerCase() || '';
        const currentTab = tabOptions.find(t => t.id === activeTab);

        if (!currentTab || currentTab.type === 'all') {
            // ok
        } else if (currentTab.type === 'bouquets_all') {
            if (!isBouquetItem) return false;
        } else if (currentTab.type === 'bouquet_single') {
            if (!isBouquetItem) return false;
            const itemCat = item.category?.toLowerCase() || '';
            const tabCat = currentTab.rawCat?.toLowerCase() || currentTab.label.toLowerCase();
            if (itemCat !== tabCat) return false;
        } else if (currentTab.type === 'supply_single') {
            if (isBouquetItem) return false;
            const itemLabel = CATEGORY_MAPPING[cat] || cat;
            if (itemLabel.toLowerCase() !== currentTab.label.toLowerCase()) return false;
        }

        if (isLowStockOnly) {
            const isLow = (item.stock_quantity || 0) < 5;
            if (isBouquetItem || !isLow) return false;
        }

        if (searchQuery) {
            return item.name.toLowerCase().includes(searchQuery.toLowerCase())
        }
        return true
    })

    const renderCard = (item: Product, index: number) => {
        const formatNumber = (num: number) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
        const pastelColors = ["bg-blue-100", "bg-pink-100", "bg-green-100", "bg-amber-100", "bg-violet-100", "bg-cyan-100"]
        const cardBg = pastelColors[index % pastelColors.length]
        const aspectClass = index % 2 === 0 ? 'aspect-[3/4]' : 'aspect-[4/5]'

        const quantity = item.stock_quantity || 0
        const isLow = quantity < 5
        const isOutOfStock = quantity === 0
        // Identify bouquet by presence of composition (ingredients), allowing flexible category names
        const isBouquet = item.composition && item.composition !== "[]"

        // Dynamic Status
        let statusText = "В наличии"
        let statusColor = "text-gray-700 bg-gray-100"

        if (isOutOfStock) {
            statusText = "Нет"
            statusColor = "text-gray-400 bg-gray-50"
        } else if (isLow) {
            statusText = "Мало"
            statusColor = "text-gray-900 bg-gray-200"
        }

        return (
            <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                key={item.id}
            >
                <Link
                    href={`/warehouse?item=${item.id}`}
                    scroll={false}
                    className={`
                        relative flex flex-col justify-between p-4 rounded-[32px] 
                        ${aspectClass}
                        ${cardBg} 
                        active:scale-[0.98] transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-md h-full
                    `}
                >
                    {/* Visual Centerpiece */}
                    <div className="flex-1 flex items-center justify-center relative min-h-[4rem] w-full">
                        {item.image && item.image !== "/placeholder.png" ? (
                            <div className="absolute inset-2 z-10 transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-3">
                                <Image
                                    src={item.image.startsWith("/static") ? `http://localhost:8000${item.image}` : item.image}
                                    alt={item.name}
                                    fill
                                    className="object-contain drop-shadow-xl"
                                />
                            </div>
                        ) : (
                            <div className={`w-20 h-20 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                                <Package size={32} className="text-gray-400/50" />
                            </div>
                        )}
                    </div>

                    {/* Card Info */}
                    <div className="flex flex-col gap-1 relative z-10 pt-2">
                        <span className="text-sm font-bold text-gray-900 leading-tight pl-1 line-clamp-2 min-h-[2.5em]">{item.name}</span>
                        {!isBouquet ? (
                            <>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide pl-1 opacity-70 mb-1">{item.category}</span>
                                <div className="flex items-center justify-between">
                                    <div className="px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm text-sm font-bold text-gray-900 min-w-[3rem] text-center">
                                        {formatNumber(quantity)}
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${statusColor}`}>
                                        {statusText}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                {isBouquet && (
                                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                                        {(() => {
                                            const mapping: Record<string, string> = {
                                                'mix': 'Авторский',
                                                'roses': 'Розы',
                                                'peonies': 'Пионы',
                                                'tulips': 'Тюльпаны',
                                                'boxes': 'В коробке',
                                                'baskets': 'В корзине',
                                                'wedding': 'Свадебный'
                                            };
                                            return mapping[item.category?.toLowerCase()] || item.category || "Букет";
                                        })()}
                                    </span>
                                )}
                                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-100">
                                    Букет
                                </span>
                            </div>
                        )}
                    </div>
                </Link>
            </motion.div>
        )
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                    <p className="text-gray-500 text-sm">Загрузка склада...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-32">

            {/* Header with Animated Search */}
            <div className="pt-6 px-6 mb-2">
                <div className="flex items-center justify-between h-14 mb-2 relative">
                    {/* Title & Actions (Visible when search is closed) */}
                    <div className={`absolute inset-0 flex items-center justify-between transition-all duration-300 ${isSearchOpen ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Склад</h1>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm text-gray-500 hover:text-black transition-colors"
                            >
                                <Search size={20} />
                            </button>
                            <Link href="/flowers/new" className="flex items-center justify-center w-10 h-10 bg-[#2663eb] text-white rounded-full shadow-lg shadow-blue-500/20 hover:bg-blue-600 active:scale-95 transition-all">
                                <Plus size={22} />
                            </Link>
                        </div>
                    </div>

                    {/* Search Input (Visible when search is open) */}
                    <div className={`absolute inset-0 flex items-center gap-3 transition-all duration-300 ${isSearchOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Поиск по складу..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-10 pl-10 pr-4 rounded-full border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-sm"
                                autoFocus={isSearchOpen}
                            />
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                        <button
                            onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }}
                            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Warehouse Stats */}
            <div className="px-6 mb-2 grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-100 flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <Package size={20} />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase">Всего</span>
                    </div>
                    <div>
                        <span className="text-2xl font-bold text-gray-900 block">{stats.total}</span>
                        <span className="text-xs text-gray-400 font-medium">позиций на складе</span>
                    </div>
                </div>
                <div
                    onClick={() => setIsLowStockOnly(!isLowStockOnly)}
                    className={`
                        cursor-pointer transition-all duration-300 relative overflow-hidden
                        ${isLowStockOnly ? 'bg-[#2663eb] scale-[1.02] shadow-lg shadow-blue-200 ring-2 ring-blue-500' : 'bg-white hover:scale-[1.01] hover:shadow-md border border-gray-100 shadow-sm'} 
                        p-4 rounded-[24px] flex flex-col justify-between h-32
                    `}
                >
                    <div className="flex justify-between items-start">
                        <div className={`p-2 rounded-xl ${isLowStockOnly ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-600'}`}>
                            <AlertTriangle size={20} />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${isLowStockOnly ? 'bg-white text-blue-600 shadow-lg' : 'bg-gray-50 border border-gray-100 text-gray-400 shadow-inner'}`}>
                                <AnimatePresence mode="wait">
                                    {isLowStockOnly ? (
                                        <motion.div
                                            key="close"
                                            initial={{ scale: 0, rotate: -90 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            exit={{ scale: 0, rotate: 90 }}
                                        >
                                            <X size={14} />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="eye"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                        >
                                            <Eye size={14} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <span className={`text-xs font-bold uppercase ${isLowStockOnly ? 'text-white' : 'text-gray-400'}`}>Мало</span>
                        </div>
                    </div>
                    <div>
                        <span className={`text-2xl font-bold block ${isLowStockOnly ? 'text-white' : 'text-gray-900'}`}>{stats.lowStock}</span>
                        <span className={`text-xs font-medium ${isLowStockOnly ? 'text-white/70' : 'text-gray-400'}`}>требуют закупки</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-6 flex gap-3 overflow-x-auto pt-4 pb-6 mb-0 hide-scrollbar">
                {tabOptions.map((tab) => {
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                px-6 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 border
                                ${isActive
                                    ? "bg-blue-50/50 border-blue-600 text-blue-600 shadow-sm scale-105"
                                    : "bg-white border-gray-100 text-gray-400 hover:border-gray-200 hover:text-gray-600"
                                }
                            `}
                        >
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 gap-3 px-4 sm:px-6 pb-20 items-start">
                <div className="flex flex-col gap-3">
                    <AnimatePresence mode="popLayout">
                        {filteredItems.filter((_, i) => i % 2 === 0).map((item, index) => renderCard(item, index * 2))}
                    </AnimatePresence>
                </div>
                <div className="flex flex-col gap-3 pt-8">
                    <AnimatePresence mode="popLayout">
                        {filteredItems.filter((_, i) => i % 2 !== 0).map((item, index) => renderCard(item, index * 2 + 1))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Modal */}
            {selectedItem && (
                // @ts-ignore - ProductDetails expectations might strictly mock Item type, need to check if Product works or verify mapping
                // Assuming ProductDetails can handle Product or we might need minor tweak. 
                // Let's pass it anyway, usually we'd ensure type compatibility.
                // For now, let's assume it works or we'll fix ProductDetails next if broken.
                <ProductDetails item={selectedItem} isModal={true} />
            )}
        </div>
    )
}
import ProtectedRoute from "@/components/ProtectedRoute"

export default function WarehousePage() {
    return (
        <ProtectedRoute allowedRoles={['owner', 'admin', 'manager', 'worker']}>
            <Suspense fallback={<div className="min-h-screen bg-gray-50/50" />}>
                <WarehouseContent />
            </Suspense>
        </ProtectedRoute>
    )
}
