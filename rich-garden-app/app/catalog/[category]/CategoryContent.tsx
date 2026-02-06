"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ShoppingBag, Filter, X, ArrowUpDown, ChevronDown, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { BottomNav } from '@/components/BottomNav'
import { cn } from '@/lib/utils'
import { useFavorites, Product } from '@/context/FavoritesContext'
import { useCart } from '@/context/CartContext'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { ProductCard, type ProductCardProduct } from '@/components/features/catalog/ProductCard'

const categoryNames: Record<string, string> = {
    all: "Все",
    roses: "Розы",
    peonies: "Пионы",
    tulips: "Тюльпаны",
    mix: "Миксы",
    gypso: "Гипсофила",
    boxes: "Коробки",
    baskets: "Корзины",
    wedding: "Свадебные",
    dried: "Сухоцветы"
}

const CATEGORIES = [
    { id: 'all', name: 'Все' },
    { id: 'mix', name: 'Миксы' },
    { id: 'roses', name: 'Розы' },
    { id: 'peonies', name: 'Пионы' },
    { id: 'tulips', name: 'Тюльпаны' },
    { id: 'boxes', name: 'Коробки' },
    { id: 'baskets', name: 'Корзины' },
    { id: 'wedding', name: 'Свадебные' },
    { id: 'dried', name: 'Сухоцветы' },
]


export default function CategoryContent({ categorySlug }: { categorySlug: string }) {
    const router = useRouter()

    // Decode URL component to handle Russian characters correctly (e.g. %D0%BF -> п)
    const decodedSlug = decodeURIComponent(categorySlug)

    const categoryTitle = decodedSlug === 'all'
        ? "Все букеты"
        : (categoryNames[decodedSlug] || (decodedSlug.charAt(0).toUpperCase() + decodedSlug.slice(1)))
    const [products, setProducts] = useState<any[]>([])
    const [dynamicCategories, setDynamicCategories] = useState<{ id: string, name: string }[]>([])
    const [sortBy, setSortBy] = useState<'new' | 'price-asc' | 'price-desc'>('new')
    const [isSortOpen, setIsSortOpen] = useState(false)
    const { isFavorite, toggleFavorite } = useFavorites()
    const { addToCart, cartItems, removeFromCart } = useCart()

    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)
    const isInCart = (productId: number | string) => cartItems.some(item => String(item.product.id) === String(productId));

    useEffect(() => {
        // Fetch all products to determine active categories
        api.getProducts().then(data => {
            const bouquets = data.filter(p => !p.is_ingredient && p.composition && p.composition !== "[]" && p.stock_quantity > 0)

            // Extract unique categories
            const cats = new Set<string>()
            const mapping: Record<string, string> = {
                'mix': 'Миксы',
                'roses': 'Розы',
                'peonies': 'Пионы',
                'tulips': 'Тюльпаны',
                'boxes': 'Коробки',
                'baskets': 'Корзины',
                'wedding': 'Свадебные',
                'dried': 'Сухоцветы'
            }

            const activeCats = [{ id: 'all', name: 'Все' }]
            const seen = new Set(['all'])

            bouquets.forEach(p => {
                const catId = p.category?.toLowerCase() || 'mix'
                if (!seen.has(catId)) {
                    activeCats.push({
                        id: catId,
                        name: mapping[catId] || p.category
                    })
                    seen.add(catId)
                }
            })
            setDynamicCategories(activeCats)

            // Filter products for the current view
            const filtered = decodedSlug === 'all'
                ? bouquets
                : bouquets.filter(p => p.category?.toLowerCase() === decodedSlug)

            // Sort products
            let sorted = filtered.sort((a, b) => {
                if (sortBy === 'price-asc') return a.price_raw - b.price_raw
                if (sortBy === 'price-desc') return b.price_raw - a.price_raw
                return (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0) // Default: New first
            })

            const mapped = sorted.map(p => ({
                id: p.id,
                name: p.name,
                price: p.price_display || `${p.price_raw.toLocaleString()} сум`,
                image: p.image.startsWith('http') ? p.image : `${p.image}`,
                price_raw: p.price_raw,
                isHit: p.is_hit,
                isNew: p.is_new
            }))
            setProducts(mapped)
        }).catch(err => console.error(err))
    }, [decodedSlug, sortBy])



    return (
        <main className="min-h-screen bg-[#f9fafb] pb-32">

            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
                <div className="px-4 h-16 flex items-center justify-between">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full border border-black/10 bg-transparent active:scale-95 transition-transform">
                        <ChevronLeft size={24} strokeWidth={1.5} className="text-black" />
                    </button>

                    <h1 className="text-[22px] font-bold text-black lowercase tracking-tight">{categoryTitle}</h1>

                    <Link href="/cart" className="w-10 h-10 flex items-center justify-center relative active:scale-95 transition-transform">
                        <ShoppingBag size={22} strokeWidth={1.5} className="text-black" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white shadow-sm font-sans tracking-tight">
                                {cartCount}
                            </span>
                        )}
                    </Link>
                </div>

                {/* Categories Scroll */}
                <div className="px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
                    <button
                        onClick={() => setIsSortOpen(true)}
                        className={cn(
                            "flex items-center justify-center w-10 h-10 min-w-[40px] rounded-[20px] active:scale-95 transition-all shadow-sm",
                            sortBy !== 'new' ? "bg-black text-white" : "bg-[#F2F2F7] text-gray-900"
                        )}
                    >
                        <Filter size={18} strokeWidth={2} />
                    </button>

                    {dynamicCategories.map((cat) => {
                        const isActive = decodedSlug === cat.id
                        return (
                            <Link
                                key={cat.id}
                                href={`/catalog/${cat.id}`}
                                className={cn(
                                    "px-5 h-10 flex items-center justify-center rounded-[20px] text-[15px] font-medium whitespace-nowrap transition-all duration-200 border",
                                    isActive
                                        ? "bg-transparent border-black text-black shadow-sm"
                                        : "bg-[#F2F2F7] border-transparent text-gray-900 hover:bg-[#E5E5EA]"
                                )}
                            >
                                {cat.name}
                            </Link>
                        )
                    })}
                </div>
            </header>

            {/* Product Grid — единые карточки, адаптивная сетка */}
            <div className="px-4 md:px-6 pt-4 mb-20">
                <motion.div
                    layout
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5"
                >
                    <AnimatePresence mode="popLayout">
                        {products.map((product) => {
                            const isFav = isFavorite(product.id)
                            const productData: ProductCardProduct = {
                                id: product.id,
                                name: product.name,
                                price: product.price,
                                image: product.image,
                                isHit: product.isHit,
                                isNew: product.isNew,
                            }
                            const forCart: Product = productData

                            return (
                                <motion.div
                                    key={product.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.96 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ProductCard
                                        product={productData}
                                        variant="grid"
                                        isFavorite={isFav}
                                        isInCart={isInCart(product.id)}
                                        showFavorite
                                        showCart
                                        onFavoriteClick={() => {
                                            toggleFavorite(forCart)
                                            toast.dismiss()
                                            toast.success(isFav ? "Удалено из избранного" : "Добавлено в избранное", {
                                                description: product.name,
                                                duration: 2000,
                                            })
                                        }}
                                        onCartClick={() => {
                                            if (isInCart(product.id)) {
                                                removeFromCart(product.id)
                                                toast.error("Удалено из корзины", { description: product.name })
                                            } else {
                                                addToCart(forCart)
                                                toast.dismiss()
                                                toast.success("Добавлено в корзину", {
                                                    description: product.name,
                                                    duration: 2000,
                                                })
                                            }
                                        }}
                                    />
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Sorting Bottom Sheet */}
            <AnimatePresence>
                {isSortOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSortOpen(false)}
                            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                        />
                        {/* Sheet */}
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-[32px] p-6 pb-12 shadow-2xl origin-bottom"
                        >
                            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-bold text-black lowercase tracking-tight">сортировка</h2>
                                <button onClick={() => setIsSortOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 active:scale-90 transition-transform">
                                    <X size={18} className="text-gray-400" />
                                </button>
                            </div>

                            <div className="space-y-2">
                                {[
                                    { id: 'new', label: 'сначала новые', icon: <Clock size={20} /> },
                                    { id: 'price-asc', label: 'дешевле', icon: <ArrowUpDown size={20} className="scale-y-[-1]" /> },
                                    { id: 'price-desc', label: 'дороже', icon: <ArrowUpDown size={20} /> },
                                ].map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => {
                                            setSortBy(option.id as any)
                                            setIsSortOpen(false)
                                        }}
                                        className={cn(
                                            "w-full flex items-center justify-between p-4 rounded-2xl transition-all active:scale-[0.98]",
                                            sortBy === option.id ? "bg-black text-white shadow-lg" : "bg-gray-50 text-black hover:bg-gray-100"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            {option.icon}
                                            <span className="font-medium text-[16px] lowercase tracking-tight">{option.label}</span>
                                        </div>
                                        {sortBy === option.id && <ChevronDown size={20} className="-rotate-90" />}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>


            <BottomNav />
        </main>
    )
}

