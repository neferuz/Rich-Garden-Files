"use client"

import { useState, useEffect, useMemo, Suspense, useRef } from "react"
import { ChevronLeft, Upload, Check, ChevronDown, Package, Plus, Trash2, Search, ChevronsRight, PackageCheck, Camera, X, Sprout, Tag } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { api, Product } from "@/services/api"
import { motion, AnimatePresence } from "framer-motion"

// Default categories for bouquets (mapping to slugs used in the shop app)
const DEFAULT_BOUQUET_CATEGORIES = [
    { id: 'available', label: 'В наличии' },
    { id: 'mix', label: 'Авторский' },
    { id: 'roses', label: 'Розы' },
    { id: 'peonies', label: 'Пионы' },
    { id: 'tulips', label: 'Тюльпаны' },
    { id: 'boxes', label: 'В коробке' },
    { id: 'baskets', label: 'В корзине' },
    { id: 'wedding', label: 'Свадебный' }
]

function CreateBouquetContent() {
    const router = useRouter()

    // Data State
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)

    // Form State
    const [name, setName] = useState("")
    const [category, setCategory] = useState("mix")
    const [customCategory, setCustomCategory] = useState("")
    const [isAddingCategory, setIsAddingCategory] = useState(false)

    const [images, setImages] = useState<string[]>([])
    const [sellPrice, setSellPrice] = useState("")
    const [description, setDescription] = useState("Авторский букет")

    // Slider State
    const [sliderX, setSliderX] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const sliderRef = useRef<HTMLDivElement>(null)
    const startXRef = useRef(0)

    const isDisabled = loading || !name || images.length < 2 || !sellPrice


    // Composition State
    const [composition, setComposition] = useState<{ product: Product, qty: number }[]>([])

    // UI State
    const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await api.getProducts()
                setProducts(data)
            } catch (err) {
                console.error("Failed to fetch products", err)
            } finally {
                setLoading(false)
            }
        }
        fetchProducts()
    }, [])

    const dynamicCategories = useMemo(() => {
        const uniqueFromProducts = new Set<string>()
        products.forEach(p => {
            const isBouquet = !!(p.composition && p.composition !== "[]")
            if (isBouquet && p.category) {
                uniqueFromProducts.add(p.category)
            }
        })

        const result = [...DEFAULT_BOUQUET_CATEGORIES]
        uniqueFromProducts.forEach(cat => {
            if (!result.find(r => r.id === cat || r.label === cat)) {
                result.push({ id: cat, label: cat })
            }
        })
        return result
    }, [products])

    const costPrice = useMemo(() => {
        return composition.reduce((acc, item) => acc + (item.product.cost_price || item.product.price_raw || 0) * item.qty, 0)
    }, [composition])

    useEffect(() => {
        if (!loading && !isDragging) setSliderX(0)
    }, [loading, isDragging])

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
        if (isDisabled || loading || isUploading) return
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10)
        setIsDragging(true)
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
        startXRef.current = clientX - sliderX
    }

    const [isUploading, setIsUploading] = useState(false)

    const handleImageUpload = async (e: any) => {
        const files = Array.from(e.target.files) as File[]
        if (files.length === 0) return

        if (images.length + files.length > 4) {
            alert("Максимум 4 фото")
            return
        }

        setIsUploading(true)
        try {
            const uploadPromises = files.map(file => api.uploadImage(file))
            const results = await Promise.all(uploadPromises)
            // API returns {"url": "/static/uploads/..."}, use it directly
            const newUrls = results.map(res => res.url || '')
            setImages(prev => [...prev, ...newUrls])
        } catch (err) {
            console.error("Failed to upload image", err)
            alert("Ошибка загрузки изображения")
        } finally {
            setIsUploading(false)
        }
    }

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index))
    }

    const handleAddIngredient = (product: Product) => {
        setComposition(prev => {
            const existing = prev.find(p => p.product.id === product.id)
            if (existing) {
                return prev.filter(p => p.product.id !== product.id)
            }
            return [...prev, { product, qty: 1 }]
        })
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10)
    }

    const handleUpdateQty = (idx: number, delta: number) => {
        setComposition(prev => {
            const newComp = [...prev]
            newComp[idx].qty = Math.max(0, newComp[idx].qty + delta)
            if (newComp[idx].qty === 0) {
                return prev.filter((_, i) => i !== idx)
            }
            return newComp
        })
    }

    const handleSubmit = async () => {
        try {
            if (images.length < 2) {
                alert("Пожалуйста, загрузите минимум 2 фото")
                return
            }

            const finalCategory = isAddingCategory ? customCategory : category
            const finalPrice = parseInt(sellPrice.replace(/\s/g, "") || "0")

            await api.createProduct({
                name,
                category: finalCategory,
                price_display: `${finalPrice.toLocaleString()} сум`,
                price_raw: finalPrice,
                image: images[0],
                images: JSON.stringify(images),
                rating: 5.0,
                is_hit: false,
                is_new: true,
                description: description,
                cost_price: costPrice,
                stock_quantity: 0,
                composition: JSON.stringify(composition.map(c => ({
                    id: c.product.id,
                    name: c.product.name,
                    qty: c.qty,
                    price: c.product.price_raw
                })))
            })

            setIsSuccess(true)
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([50, 100, 50])

            await new Promise(resolve => setTimeout(resolve, 1000))

            router.push("/warehouse")
        } catch (err) {
            alert("Ошибка при создании продукта")
            console.error(err)
            setSliderX(0)
        }
    }

    const filteredProducts = products.filter(p => {
        const isBouquet = !!(p.composition && p.composition !== "[]")
        return !isBouquet && p.name.toLowerCase().includes(searchQuery.toLowerCase())
    })

    return (
        <div className="min-h-screen bg-gray-50/50 pb-32">
            <div className="pt-6 px-6 mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/warehouse" className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm text-gray-700 hover:text-gray-900 active:scale-95 transition-all">
                        <ChevronLeft size={22} className="mr-[1px]" />
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        Новый букет
                    </h1>
                </div>
            </div>

            <div className="px-6 space-y-6 max-w-xl mx-auto">

                {/* Image Upload Block */}
                {/* Image Upload Block */}


                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 pl-1">Название</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Например: Букет 'Нежность'"
                            className="w-full h-14 px-5 rounded-[20px] bg-white border border-gray-100 focus:outline-none focus:border-blue-500 font-medium text-gray-900 text-lg placeholder:text-gray-300 transition-colors shadow-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 pl-1">Описание</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Опишите этот прекрасный букет..."
                            className="w-full min-h-[100px] p-5 rounded-[20px] bg-white border border-gray-100 focus:outline-none focus:border-blue-500 font-medium text-gray-900 text-base placeholder:text-gray-300 transition-colors shadow-sm resize-none"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide pl-1">Категория витрины</label>
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

                        <AnimatePresence mode="wait">
                            {isAddingCategory ? (
                                <motion.div
                                    key="custom-input"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="relative"
                                >
                                    <input
                                        type="text"
                                        value={customCategory}
                                        onChange={e => setCustomCategory(e.target.value)}
                                        placeholder="Название категории..."
                                        className="w-full h-14 px-5 rounded-[22px] bg-white border border-gray-200 focus:outline-none focus:border-blue-500 font-medium text-gray-900 text-lg placeholder:text-gray-300 transition-colors"
                                        autoFocus
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                                        <Tag size={16} />
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="pills"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex gap-2 overflow-x-auto hide-scrollbar pt-2 pb-4 px-1 -mx-1"
                                >
                                    {dynamicCategories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setCategory(cat.id)}
                                            className={`
                                                px-6 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 border
                                                ${category === cat.id
                                                    ? 'border-blue-600 text-blue-600 bg-blue-50/30 shadow-sm'
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



                <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">Состав букета</h3>
                            <p className="text-xs text-gray-400 font-medium">Добавьте цветы из склада</p>
                        </div>
                        <button
                            onClick={() => setIsProductSelectorOpen(true)}
                            className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all hover:scale-105 active:scale-95"
                        >
                            <Plus size={20} strokeWidth={2.5} />
                        </button>
                    </div>

                    <div className="space-y-3 mb-2">
                        {composition.length === 0 && (
                            <div className="text-center py-6 text-gray-400 text-sm bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                Состав пуст. Нажмите +, чтобы добавить.
                            </div>
                        )}
                        {composition.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                <div>
                                    <div className="font-bold text-gray-900 text-sm leading-tight">{item.product.name}</div>
                                    <div className="text-[11px] font-bold text-blue-600 mt-0.5">{item.product.price_raw?.toLocaleString()} сум</div>
                                </div>
                                <div className="flex items-center gap-3 bg-white px-2 py-1.5 rounded-xl shadow-sm border border-gray-100">
                                    <button className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors" onClick={() => handleUpdateQty(idx, -1)}>
                                        {item.qty === 1 ? <Trash2 size={14} /> : "-"}
                                    </button>
                                    <span className="font-bold text-gray-900 w-5 text-center text-sm">{item.qty}</span>
                                    <button className="w-7 h-7 flex items-center justify-center text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => handleUpdateQty(idx, 1)}>+</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-5 rounded-[24px] border border-gray-100 transition-all hover:bg-white hover:shadow-md">
                        <div className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">Себестоимость</div>
                        <div className="text-2xl font-bold text-gray-900 tracking-tight">
                            {costPrice.toLocaleString()}
                            <span className="text-sm font-medium text-gray-400 ml-1">сум</span>
                        </div>
                    </div>
                    <div className="relative group">
                        <div className="absolute top-4 left-4 text-xs text-gray-400 font-bold uppercase tracking-wide z-10 pointer-events-none group-focus-within:text-green-600 transition-colors">Цена продажи</div>
                        <input
                            type="text"
                            value={sellPrice}
                            onChange={e => {
                                const raw = e.target.value.replace(/\D/g, "")
                                const formatted = raw.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
                                setSellPrice(formatted)
                            }}
                            placeholder="0"
                            className="w-full h-full min-h-[80px] pt-6 px-4 rounded-[24px] bg-white border border-gray-200 focus:outline-none focus:border-green-500/50 focus:ring-4 focus:ring-green-500/10 font-bold text-green-600 text-2xl placeholder:text-gray-200 transition-all shadow-sm"
                        />
                        <span className="absolute bottom-5 right-5 text-sm font-bold text-gray-300">сум</span>
                    </div>
                </div>

                {/* Image Upload Block (Moved to bottom) */}
                <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-2 mb-4">
                        <Camera size={18} className="text-blue-600" />
                        <span className="font-bold text-gray-900 text-sm">Фотографии</span>
                        <span className="text-xs text-gray-400 font-medium ml-auto">
                            {images.length}/4
                        </span>
                    </div>

                    {images.length === 0 ? (
                        <div className="relative w-full h-[120px] bg-gray-50 rounded-[20px] border border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50/50 hover:border-blue-200 transition-all group overflow-hidden">
                            <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleImageUpload} />
                            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <Plus size={20} className="text-blue-500" />
                            </div>
                            <span className="text-xs font-bold text-gray-500 group-hover:text-blue-600 transition-colors">Загрузить фото</span>
                        </div>
                    ) : (
                        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                            {images.map((img, idx) => (
                                <div key={idx} className="relative flex-none w-[160px] aspect-[4/3] bg-gray-100 rounded-[20px] overflow-hidden group shadow-sm border border-gray-100 snap-start cursor-zoom-in" onClick={() => setSelectedImageIndex(idx)}>
                                    <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            removeImage(idx)
                                        }}
                                        className="absolute top-2 right-2 w-7 h-7 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-white active:scale-95"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            {images.length < 4 && (
                                <div className="relative flex-none w-[100px] aspect-[4/3] bg-gray-50 rounded-[20px] border border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50/50 hover:border-blue-200 transition-all group snap-start">
                                    <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleImageUpload} />
                                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                        <Plus size={16} className="text-blue-500" />
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-500 group-hover:text-blue-600 text-center px-1">Добавить</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className={`fixed bottom-0 inset-x-0 p-6 z-50 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent ${isProductSelectorOpen ? 'hidden' : ''}`}>
                <div
                    ref={sliderRef}
                    className={`
                        relative w-full h-[72px] rounded-[28px] overflow-hidden transition-all duration-300 pointer-events-auto select-none max-w-xl mx-auto
                        ${isDisabled ? 'bg-gray-100 border border-gray-200 cursor-not-allowed opacity-80' : 'bg-white border border-blue-100 shadow-2xl shadow-blue-900/10 cursor-col-resize'}
                    `}
                >
                    {/* Background Text */}
                    <div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200"
                        style={{ opacity: isDisabled ? 0.5 : Math.max(0, 1 - (sliderX / 150)) }}
                    >
                        <span className={`text-[17px] font-medium tracking-wide ${isDisabled ? 'text-gray-400' : 'text-[#2663eb]'}`}>
                            {isSuccess ? "Успешно!" : (loading || isUploading ? "Загрузка..." : "Создать букет")}
                        </span>
                        {!loading && !isUploading && !isDisabled && (
                            <div className="absolute right-8 opacity-40 animate-pulse text-[#2663eb]">
                                <ChevronsRight size={24} />
                            </div>
                        )}
                    </div>

                    {/* Draggable Thumb */}
                    <div
                        onMouseDown={startDrag}
                        onTouchStart={startDrag}
                        className={`absolute top-1 bottom-1 w-[64px] rounded-[24px] flex items-center justify-center cursor-grab active:cursor-grabbing z-10 ${loading || isSuccess ? 'shadow-[0_0_20px_rgba(34,197,94,0.6)] ring-2 ring-green-400' : 'shadow-sm'}`}
                        style={{
                            transform: `translateX(${sliderX}px)`,
                            left: '4px',
                            backgroundColor: isSuccess || loading || isUploading ? '#22c55e' : (isDisabled ? '#9ca3af' : '#2663eb'),
                            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), background-color 0.3s'
                        }}
                    >
                        {isSuccess ? (
                            <Check size={28} className="text-white animate-in zoom-in duration-300" strokeWidth={3} />
                        ) : loading || isUploading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <PackageCheck size={28} className="text-white" strokeWidth={2} />
                        )}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isProductSelectorOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
                            onClick={() => setIsProductSelectorOpen(false)}
                        />

                        {/* Sheet */}
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            drag="y"
                            dragConstraints={{ top: 0, bottom: 0 }}
                            dragElastic={{ top: 0, bottom: 0.2 }}
                            onDragEnd={(_, info) => {
                                if (info.offset.y > 100) {
                                    setIsProductSelectorOpen(false)
                                }
                            }}
                            className="bg-gray-100 w-full md:max-w-2xl rounded-t-[32px] overflow-hidden max-h-[85vh] h-auto flex flex-col shadow-2xl pointer-events-auto relative z-10"
                        >
                            {/* Drag Handle */}
                            <div className="w-full flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing bg-white/80 backdrop-blur-md z-30 absolute top-0 left-0 right-0 rounded-t-[32px]">
                                <div className="w-12 h-1.5 rounded-full bg-gray-300/50" />
                            </div>

                            {/* Header */}
                            <div className="bg-white/80 backdrop-blur-md px-6 pb-5 pt-8 border-b border-gray-200/50 flex flex-col gap-4 sticky top-0 z-20">
                                <div className="flex items-center justify-between">
                                    <span className="text-xl font-bold text-gray-900 tracking-tight">Добавить цветок</span>
                                    <button
                                        onClick={() => setIsProductSelectorOpen(false)}
                                        className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors"
                                    >
                                        <X size={22} />
                                    </button>
                                </div>

                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} strokeWidth={2} />
                                    <input
                                        autoFocus
                                        placeholder="Поиск по названию..."
                                        className="w-full h-14 pl-12 pr-5 rounded-2xl bg-gray-50 border border-gray-100 text-[16px] font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* List */}
                            <div className="overflow-y-auto p-4 space-y-3 bg-gray-100 min-h-[30vh]">
                                {filteredProducts.map(p => {
                                    const stock = p.stock_quantity ?? 0
                                    const status = stock === 0 ? 'No' : stock < 5 ? 'Low' : 'OK'
                                    const isFlower = p.category?.toLowerCase() === "flowers" || p.category === "Цветы"
                                    const sellPrice = p.price_raw ?? 0
                                    const buyPrice = p.cost_price ?? 0

                                    const inComp = composition.find(c => c.product.id === p.id)
                                    const addedQty = inComp?.qty || 0

                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => handleAddIngredient(p)}
                                            className={`w-full p-3 rounded-[24px] shadow-sm border transition-all hover:scale-[0.99] active:scale-[0.97] flex items-center gap-4 text-left group relative overflow-hidden ${addedQty > 0 ? 'bg-blue-50/30 border-blue-100' : 'bg-white border-gray-100'
                                                }`}
                                        >
                                            {/* Image */}
                                            <div className="relative w-20 h-20 rounded-2xl bg-gray-50 flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-100">
                                                {p.image ? (
                                                    <img
                                                        src={p.image.startsWith("http") ? p.image : (p.image.startsWith("/") ? p.image : `/${p.image}`)}
                                                        alt={p.name}
                                                        className="w-full h-full object-cover p-1 rounded-2xl"
                                                        onError={(e) => {
                                                            // Silently handle missing images - hide broken image
                                                            const target = e.target as HTMLImageElement;
                                                            target.style.display = 'none';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300"><Package size={24} strokeWidth={1.5} /></div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">

                                                {/* Top: Name & Badges */}
                                                <div className="flex items-start justify-between">
                                                    <div className="pr-2">
                                                        <h3 className="text-[15px] font-bold text-gray-900 leading-tight mb-1 line-clamp-2">{p.name}</h3>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wide ${isFlower ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-blue-50 border-blue-100 text-blue-600'
                                                                }`}>
                                                                {isFlower ? <Sprout size={10} /> : <Tag size={10} />}
                                                                {p.category}
                                                            </span>
                                                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${status === 'OK' ? 'bg-green-50 border-green-100 text-green-700' :
                                                                status === 'Low' ? 'bg-amber-100 border-amber-200 text-amber-700' : 'bg-red-50 border-red-100 text-red-600'
                                                                }`}>
                                                                {status === 'OK' ? 'В наличии' : status === 'Low' ? 'Мало' : 'Нет'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Bottom: Prices */}
                                                <div className="flex items-center gap-4 mt-1">
                                                    {/* Sell Price */}
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Продажа</span>
                                                        <span className="text-sm font-bold text-[#2663eb]">
                                                            {sellPrice.toLocaleString('ru-RU')} <span className="text-[10px] text-gray-400 font-normal">сум</span>
                                                        </span>
                                                    </div>

                                                    {/* Divider */}
                                                    <div className="w-px h-6 bg-gray-100"></div>

                                                    {/* Buy Price */}
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Закупка</span>
                                                        <span className="text-sm font-bold text-gray-600">
                                                            {buyPrice.toLocaleString('ru-RU')} <span className="text-[10px] text-gray-400 font-normal">сум</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Add Button (Visual) */}
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm flex-shrink-0 ${addedQty > 0 ? 'bg-[#2663eb] text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-[#2663eb] group-hover:text-white'
                                                }`}>
                                                {addedQty > 0 ? (
                                                    <Check size={22} strokeWidth={3} className="animate-in zoom-in duration-300" />
                                                ) : (
                                                    <Plus size={22} strokeWidth={2.5} />
                                                )}
                                            </div>
                                        </button>
                                    )
                                })}

                                {filteredProducts.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                                            <Search size={32} className="text-gray-400" />
                                        </div>
                                        <span className="text-gray-500 font-medium">Ничего не найдено</span>
                                    </div>
                                )}

                                {/* Bottom spacer for safe area */}
                                <div className="h-12" />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Full Screen Image Viewer */}
            {selectedImageIndex !== null && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
                    <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
                        <button
                            onClick={() => setSelectedImageIndex(null)}
                            className="w-10 h-10 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-black/40 backdrop-blur-md transition-all"
                        >
                            <X size={20} />
                        </button>
                        <span className="text-white font-medium text-sm">
                            {selectedImageIndex + 1} / {images.length}
                        </span>
                        <button
                            onClick={() => {
                                const idx = selectedImageIndex
                                setSelectedImageIndex(null)
                                setTimeout(() => removeImage(idx), 300)
                            }}
                            className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/40 backdrop-blur-md transition-all"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>

                    <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                        <div className="relative w-full h-full max-h-[80vh] aspect-[3/4] sm:aspect-auto">
                            <img
                                src={images[selectedImageIndex] || ''}
                                alt="Full screen preview"
                                className="w-full h-full object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                        </div>

                        {selectedImageIndex > 0 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedImageIndex(prev => (prev !== null ? prev - 1 : 0))
                                }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 backdrop-blur-md transition-all"
                            >
                                <ChevronLeft size={24} />
                            </button>
                        )}
                        {selectedImageIndex < images.length - 1 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedImageIndex(prev => (prev !== null ? prev + 1 : 0))
                                }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 backdrop-blur-md transition-all"
                            >
                                <ChevronLeft size={24} className="rotate-180" />
                            </button>
                        )}
                    </div>

                    <div className="h-24 flex items-center justify-center gap-2 pb-8">
                        {images.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 rounded-full transition-all duration-300 ${selectedImageIndex === idx ? "w-6 bg-white" : "w-1.5 bg-white/30"}`}
                            />
                        ))}
                    </div>
                </div>
            )
            }
        </div >
    )
}

import ProtectedRoute from "@/components/ProtectedRoute"

export default function CreateBouquetPage() {
    return (
        <ProtectedRoute allowedRoles={['owner', 'admin', 'manager', 'worker']}>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Загрузка...</div>}>
                <CreateBouquetContent />
            </Suspense>
        </ProtectedRoute>
    )
}
