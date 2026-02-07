"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { ChevronLeft, Camera, PackageCheck, Check, ChevronsRight, Plus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { api } from "@/services/api"
import { useRouter } from "next/navigation"
import ProtectedRoute from "@/components/ProtectedRoute"

export default function SupplyPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    // New states for product creation
    const [name, setName] = useState("")
    const [category, setCategory] = useState("Цветы")
    const [isAddingCategory, setIsAddingCategory] = useState(false)
    const [customCategory, setCustomCategory] = useState("")
    const [sellPrice, setSellPrice] = useState("")
    const [price, setPrice] = useState("") // Cost Price
    const [quantity, setQuantity] = useState("")
    const [unit, setUnit] = useState("шт")
    const [supplier, setSupplier] = useState("")
    const [image, setImage] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [description, setDescription] = useState("")
    const [products, setProducts] = useState<any[]>([])

    const SUPPLY_CATEGORIES = [
        { id: 'guests', label: 'Подборка для гостей' },
        { id: 'flowers', label: 'Цветы' },
        { id: 'packaging', label: 'Упаковка' },
        { id: 'accessories', label: 'Аксессуары' },
        { id: 'extra', label: 'Прочее' }
    ]

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await api.getProducts()
                setProducts(data)
            } catch (err) {
                console.error(err)
            }
        }
        fetchProducts()
    }, [])

    const dynamicCategories = useMemo(() => {
        const uniqueFromProducts = new Set<string>()
        products.forEach(p => {
            const isBouquet = !!(p.composition && p.composition !== "[]")
            if (!isBouquet && p.category) {
                const label = p.category
                if (!SUPPLY_CATEGORIES.find(s => s.label === label || s.id === label.toLowerCase())) {
                    uniqueFromProducts.add(label)
                }
            }
        })
        const result = [...SUPPLY_CATEGORIES]
        uniqueFromProducts.forEach(cat => {
            result.push({ id: cat.toLowerCase(), label: cat })
        })
        return result
    }, [products])

    // Slider Logic
    const [sliderX, setSliderX] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const sliderRef = useRef<HTMLDivElement>(null)
    const startXRef = useRef(0)

    const isDisabled = isLoading || !name || !quantity || !price || !sellPrice || !image

    useEffect(() => {
        if (!isLoading && !isDragging) setSliderX(0)
    }, [isLoading, isDragging])

    // Global events for dragging
    useEffect(() => {
        if (isDragging) {
            const onMove = (e: MouseEvent | TouchEvent) => {
                if (!sliderRef.current) return
                const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
                const containerWidth = sliderRef.current.clientWidth
                const thumbWidth = 64
                const padding = 8
                const max = containerWidth - thumbWidth - padding
                let x = clientX - startXRef.current
                if (x < 0) x = 0
                if (x > max) x = max
                setSliderX(x)
            }
            const onUp = () => {
                if (!sliderRef.current) return
                setIsDragging(false)
                const containerWidth = sliderRef.current.clientWidth
                const thumbWidth = 64
                const padding = 8
                const max = containerWidth - thumbWidth - padding

                if (sliderX > max * 0.85) { // 85% threshold
                    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(200)
                    handleSubmit()
                } else {
                    setSliderX(0)
                }
            }
            window.addEventListener('mousemove', onMove)
            window.addEventListener('mouseup', onUp)
            window.addEventListener('touchmove', onMove)
            window.addEventListener('touchend', onUp)
            return () => {
                window.removeEventListener('mousemove', onMove)
                window.removeEventListener('mouseup', onUp)
                window.removeEventListener('touchmove', onMove)
                window.removeEventListener('touchend', onUp)
            }
        }
    }, [isDragging, sliderX])

    const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
        if (isDisabled || isLoading) return
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10)
        setIsDragging(true)
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
        startXRef.current = clientX - sliderX
    }

    // Format number with spaces
    const formatNumber = (value: string) => {
        const digits = value.replace(/\D/g, "")
        return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
    }

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPrice(formatNumber(e.target.value))
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return
        setIsUploading(true)
        try {
            const res = await api.uploadImage(e.target.files[0])
            setImage(res.url)
        } catch (err) {
            console.error("Upload failed", err)
        } finally {
            setIsUploading(false)
        }
    }

    const handleSubmit = async () => {
        setIsLoading(true)
        try {
            const finalCategory = isAddingCategory ? customCategory : (dynamicCategories.find(c => c.id === category)?.label || category)
            await api.createProduct({
                name,
                category: finalCategory,
                price_raw: parseInt(sellPrice.replace(/\s/g, "") || "0"),
                price_display: `${sellPrice} сум`,
                cost_price: parseInt(price.replace(/\s/g, "") || "0"),
                stock_quantity: parseInt(quantity || "0"),
                image: image || "",
                rating: 5,
                is_hit: false,
                is_new: true,
                description: description,
                // @ts-ignore
                unit,
                // @ts-ignore
                is_ingredient: true,
                // @ts-ignore
                supplier
            } as any)

            // Success State
            setIsSuccess(true)
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([50, 100, 50])

            // Wait for animation
            await new Promise(resolve => setTimeout(resolve, 1000))
            router.push("/warehouse")
        } catch (error) {
            console.error(error)
            setIsLoading(false)
            setIsSuccess(false)
        }
    }

    return (
        <ProtectedRoute allowedRoles={['owner', 'admin', 'manager', 'worker']}>
            <div className="min-h-screen bg-gray-50/50 pb-32">
                {/* ... existing JSX ... */}
                {/* Header */}
                <div className="pt-6 px-6 mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/warehouse" className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm text-gray-700 hover:text-gray-900 active:scale-95 transition-all">
                            <ChevronLeft size={22} className="mr-[1px]" />
                        </Link>
                        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                            Новый товар
                        </h1>
                    </div>
                </div>

                <div className="px-6 space-y-6 max-w-lg mx-auto animate-in fade-in slide-in-from-right-4 duration-300">

                    {/* Image Upload */}
                    <div className="flex justify-center">
                        <label className="relative w-32 h-32 rounded-[32px] bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors overflow-hidden">
                            {image ? (
                                <img src={`${image}`} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 text-gray-400">
                                        <Camera size={20} />
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Фото</span>
                                </>
                            )}
                            <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                            {isUploading && <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>}
                        </label>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 pl-1">Название</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Например: Роза Эквадор"
                            className="w-full h-[60px] px-6 rounded-[24px] bg-white border border-gray-100 focus:outline-none focus:border-blue-400/50 focus:ring-4 focus:ring-blue-50/50 font-medium text-gray-900 text-lg placeholder:text-gray-300 transition-all shadow-sm"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 pl-1">Описание</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Опишите товар..."
                            className="w-full min-h-[100px] p-5 rounded-[24px] bg-white border border-gray-100 focus:outline-none focus:border-blue-400/50 focus:ring-4 focus:ring-blue-50/50 font-medium text-gray-900 text-base placeholder:text-gray-300 transition-all shadow-sm resize-none"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider pl-1">Категория</label>
                            {isAddingCategory ? (
                                <button
                                    onClick={() => {
                                        setIsAddingCategory(false)
                                        setCustomCategory("")
                                    }}
                                    className="text-xs font-bold text-red-500 uppercase tracking-wide pr-1"
                                >
                                    Отмена
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        setIsAddingCategory(true)
                                        setCustomCategory("")
                                    }}
                                    className="flex items-center gap-1 text-xs font-bold text-blue-600 uppercase tracking-wide pr-1"
                                >
                                    <Plus size={12} strokeWidth={3} /> Новая
                                </button>
                            )}
                        </div>

                        <div className="relative">
                            <AnimatePresence mode="wait">
                                {isAddingCategory ? (
                                    <motion.div
                                        key="input"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                    >
                                        <input
                                            type="text"
                                            value={customCategory}
                                            onChange={e => setCustomCategory(e.target.value)}
                                            placeholder="Название категории..."
                                            className="w-full h-[60px] px-6 rounded-[24px] bg-white border border-gray-100 focus:outline-none focus:border-blue-400/50 focus:ring-4 focus:ring-blue-50/50 font-medium text-gray-900 text-lg placeholder:text-gray-300 transition-all shadow-sm"
                                            autoFocus
                                        />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="pills"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 px-0.5"
                                    >
                                        {dynamicCategories.map((cat) => (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setCategory(cat.id)}
                                                className={`
                                                px-5 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 border
                                                ${category === cat.id
                                                        ? cat.id === 'guests' || cat.label === 'Подборка для гостей'
                                                            ? 'border-black text-black bg-white shadow-sm'
                                                            : 'border-blue-600 text-blue-600 bg-blue-50/30 shadow-sm'
                                                        : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                                                    }
                                            `}
                                            >
                                                {cat.label}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Quantity & Unit */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 pl-1">Количество</label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                                placeholder="0"
                                className="w-full h-[60px] px-6 rounded-[24px] bg-white border border-gray-100 focus:outline-none focus:border-blue-400/50 focus:ring-4 focus:ring-blue-50/50 font-medium text-gray-900 text-lg placeholder:text-gray-300 transition-all shadow-sm"
                            />
                        </div>
                        <div className="w-[100px]">
                            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 pl-1">Ед. изм.</label>
                            <select
                                value={unit}
                                onChange={e => setUnit(e.target.value)}
                                className="w-full h-[60px] px-4 rounded-[24px] bg-white border border-gray-100 font-medium text-gray-900 text-base focus:outline-none shadow-sm appearance-none text-center"
                            >
                                <option value="шт">шт</option>
                                <option value="уп">уп</option>
                                <option value="кг">кг</option>
                            </select>
                        </div>
                    </div>

                    {/* Prices */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 pl-1">Цена закупки</label>
                            <input
                                type="text"
                                value={price}
                                onChange={handlePriceChange}
                                placeholder="0"
                                className="w-full h-[60px] px-5 rounded-[24px] bg-white border border-gray-100 focus:outline-none focus:border-blue-400/50 focus:ring-4 focus:ring-blue-50/50 font-medium text-gray-900 text-lg placeholder:text-gray-300 transition-all shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 pl-1">Цена продажи</label>
                            <input
                                type="text"
                                value={sellPrice}
                                onChange={e => setSellPrice(formatNumber(e.target.value))}
                                placeholder="0"
                                className="w-full h-[60px] px-5 rounded-[24px] bg-white border border-gray-100 focus:outline-none focus:border-blue-400/50 focus:ring-4 focus:ring-blue-50/50 font-medium text-gray-900 text-lg placeholder:text-gray-300 transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Supplier */}
                    <div>
                        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 pl-1">Поставщик (опционально)</label>
                        <input
                            type="text"
                            value={supplier}
                            onChange={e => setSupplier(e.target.value)}
                            placeholder="Оптовик..."
                            className="w-full h-[60px] px-6 rounded-[24px] bg-white border border-gray-100 focus:outline-none focus:border-blue-400/50 focus:ring-4 focus:ring-blue-50/50 font-medium text-gray-900 text-base placeholder:text-gray-300 transition-all shadow-sm"
                        />
                    </div>

                </div>

                {/* Slider */}
                <div className="fixed bottom-6 inset-x-0 px-6 z-50 max-w-lg mx-auto pointer-events-none animate-in slide-in-from-bottom-6 fade-in duration-300">
                    <div
                        ref={sliderRef}
                        className={`
                        relative w-full h-[72px] rounded-[28px] overflow-hidden transition-all duration-300 pointer-events-auto select-none
                        ${isDisabled ? 'bg-gray-100 border border-gray-200 cursor-not-allowed opacity-80' : 'bg-white border border-blue-100 shadow-2xl shadow-blue-500/10 cursor-col-resize'}
                    `}
                    >
                        {/* Background Text */}
                        <div
                            className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200"
                            style={{ opacity: isDisabled ? 0.5 : Math.max(0, 1 - (sliderX / 150)) }}
                        >
                            <span className={`text-[17px] font-semibold tracking-wide ${isDisabled ? 'text-gray-400' : 'text-[#2663eb]/80'}`}>
                                {isSuccess ? "Успешно!" : (isLoading ? "Обработка..." : "Сохранить товар")}
                            </span>
                            {!isLoading && !isDisabled && (
                                <div className="absolute right-8 opacity-40 animate-pulse text-[#2663eb]">
                                    <ChevronsRight size={20} />
                                </div>
                            )}
                        </div>

                        {/* Draggable Thumb */}
                        <div
                            onMouseDown={startDrag}
                            onTouchStart={startDrag}
                            className={`absolute top-1 bottom-1 w-[64px] rounded-[24px] flex items-center justify-center cursor-grab active:cursor-grabbing z-10 ${isLoading || isSuccess ? 'shadow-[0_0_20px_rgba(34,197,94,0.6)] ring-2 ring-green-400' : 'shadow-sm'}`}
                            style={{
                                transform: `translateX(${sliderX}px)`,
                                left: '4px',
                                backgroundColor: isSuccess || isLoading ? '#22c55e' : (isDisabled ? '#9ca3af' : '#2663eb'),
                                transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), background-color 0.3s'
                            }}
                        >
                            {isSuccess ? (
                                <Check size={28} className="text-white animate-in zoom-in duration-300" strokeWidth={3} />
                            ) : isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <PackageCheck size={24} className="text-white" />
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </ProtectedRoute>
    )
}
