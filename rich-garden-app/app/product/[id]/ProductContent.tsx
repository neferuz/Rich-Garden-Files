"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, Heart, Share2, Minus, Plus, ShoppingBag, Truck } from 'lucide-react'
import { motion } from 'framer-motion'
import { api, Product } from '@/lib/api'
import { useCart } from '@/context/CartContext'
import { useFavorites } from '@/context/FavoritesContext'
import { toast } from 'sonner'
import { BottomNav } from '@/components/BottomNav'

export default function ProductContent({ productId }: { productId: string }) {
    const router = useRouter()
    const [product, setProduct] = useState<Product | null>(null)
    const [recommended, setRecommended] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [qty, setQty] = useState(1)
    const [scrolled, setScrolled] = useState(false)

    const { addToCart } = useCart()
    const { isFavorite, toggleFavorite } = useFavorites()

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        setLoading(true)
        Promise.all([
            api.getProduct(productId),
            api.getProducts()
        ]).then(([productData, allProducts]) => {
            setProduct({
                ...productData,
                image: productData.image.startsWith('http') ? productData.image : `http://localhost:8000${productData.image}`
            })

            // Filter recommended: exclude current, strictly bouquets
            const others = allProducts
                .filter(p => String(p.id) !== productId && !p.is_ingredient && p.composition && p.composition !== "[]")
                .map(p => ({
                    ...p,
                    image: p.image.startsWith('http') ? p.image : `http://localhost:8000${p.image}`
                }))
                .slice(0, 4) // Show 4 items

            setRecommended(others)
        }).catch(err => {
            console.error(err)
            toast.error("Не удалось загрузить товар")
        }).finally(() => setLoading(false))
    }, [productId])

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-8 h-8 border-[3px] border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
    )

    if (!product) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
            <p className="text-gray-500">Товар не найден</p>
            <button onClick={() => router.back()} className="text-black font-bold">Назад</button>
        </div>
    )

    const composition = product.composition && product.composition !== "[]"
        ? JSON.parse(product.composition)
        : []

    const handleAddToCart = () => {
        // Add multiple times according to qty? Or just once with qty?
        // Context usually handles single items. We'll loop for now or just add once.
        // Assuming simple add for now.
        for (let i = 0; i < qty; i++) {
            addToCart({
                ...product,
                price: product.price_display || `${product.price_raw.toLocaleString()} сум`
            })
        }
        toast.success("Добавлено в корзину", {
            description: `${product.name} (${qty} шт.)`
        })
    }

    return (
        <div className="min-h-screen bg-white pb-32">

            {/* Header Image Area */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative w-full aspect-[3/4] bg-gray-100"
            >
                <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority
                />

                {/* Navbar Overlay */}
                <div className={`fixed top-0 left-0 right-0 p-6 flex justify-between items-start z-30 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent'}`}>
                    <button
                        onClick={() => router.back()}
                        className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-all ${scrolled ? 'bg-transparent text-black' : 'bg-white/80 backdrop-blur-md shadow-sm text-black'}`}
                    >
                        <ChevronLeft size={24} className="mr-0.5" />
                    </button>

                    <div className="flex gap-3">
                        <button className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-all ${scrolled ? 'bg-transparent text-black' : 'bg-white/80 backdrop-blur-md shadow-sm text-black'}`}>
                            <Share2 size={20} />
                        </button>
                        <button
                            onClick={() => {
                                const isFav = isFavorite(product.id)
                                toggleFavorite({
                                    ...product,
                                    price: product.price_display || `${product.price_raw.toLocaleString()} сум`
                                })
                                toast.dismiss()
                                toast.success(isFav ? "Удалено из избранного" : "Добавлено в избранное", {
                                    description: product.name,
                                    duration: 2000
                                })
                            }}
                            className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-all ${scrolled ? 'bg-transparent text-black' : 'bg-white/80 backdrop-blur-md shadow-sm text-black'}`}
                        >
                            <Heart size={20} className={isFavorite(product.id) ? "fill-red-500 text-red-500" : "text-black"} />
                        </button>
                    </div>
                </div>

                {/* Gradient Overlay for Text Visibility */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
            </motion.div>

            {/* Content Container - Overlapping */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative -mt-10 bg-white rounded-t-[32px] px-6 pt-8 pb-8 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
            >
                <div className="flex justify-between items-start gap-4 mb-2">
                    <h1 className="text-[28px] font-bold leading-tight text-gray-900">{product.name}</h1>
                </div>

                <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-[24px] font-bold text-black">{product.price_display || `${product.price_raw.toLocaleString()} сум`}</span>
                    {product.is_hit && <span className="px-2 py-0.5 rounded-md bg-yellow-100 text-yellow-700 text-[11px] font-bold uppercase tracking-wide">Хит</span>}
                    {product.is_new && <span className="px-2 py-0.5 rounded-md bg-green-100 text-green-700 text-[11px] font-bold uppercase tracking-wide">New</span>}
                </div>

                {/* Description */}
                {product.description && (
                    <div className="mb-8">
                        <h3 className="text-[14px] font-bold uppercase tracking-wider text-gray-400 mb-3">Описание</h3>
                        <p className="text-[16px] leading-relaxed text-gray-600 font-medium">
                            {product.description}
                        </p>
                    </div>
                )}

                {/* Composition */}
                {composition.length > 0 && (
                    <div className="mb-8 p-5 bg-gray-50 rounded-[24px]">
                        <h3 className="text-[14px] font-bold uppercase tracking-wider text-gray-400 mb-4">Состав букета</h3>
                        <ul className="space-y-3">
                            {composition.map((item: any, idx: number) => (
                                <li key={idx} className="flex justify-between items-center text-[15px] font-medium text-gray-800">
                                    <span className="capitalize">{item.name}</span>
                                    <span className="text-gray-400 bg-white px-2 py-1 rounded-lg text-xs font-bold shadow-sm">{item.qty} шт</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}



            </motion.div>

            {/* Recommended Section */}
            {recommended.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-8"
                >
                    <h3 className="px-6 text-[20px] font-bold text-gray-900 mb-5">Вам может понравиться</h3>

                    <div className="flex gap-4 overflow-x-auto no-scrollbar px-6 snap-x snap-mandatory pb-4">
                        {recommended.map((rec, idx) => (
                            <Link href={`/product/${rec.id}`} key={rec.id} className="min-w-[160px] w-[45%] snap-center group block">
                                <div className="relative aspect-[3/4] rounded-[24px] overflow-hidden mb-3 bg-gray-50 shadow-sm">
                                    <Image
                                        src={rec.image}
                                        alt={rec.name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                </div>
                                <h4 className="font-bold text-gray-900 leading-tight mb-1 truncate pr-2">{rec.name}</h4>
                                <p className="text-sm font-medium text-gray-500">{rec.price_display || `${rec.price_raw.toLocaleString()} сум`}</p>
                            </Link>
                        ))}
                    </div>
                </motion.div>
            )}

            <div className="h-4"></div>

            {/* Sticky Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 pb-8 z-40 backdrop-blur-xl bg-white/90">
                <div className="flex gap-4 items-center max-w-lg mx-auto">
                    {/* Qty Stepper */}
                    <div className="flex items-center bg-gray-100 rounded-full h-14 px-2 shrink-0">
                        <button
                            onClick={() => setQty(Math.max(1, qty - 1))}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm active:scale-95 transition-transform"
                        >
                            <Minus size={18} />
                        </button>
                        <span className="w-12 text-center font-bold text-lg">{qty}</span>
                        <button
                            onClick={() => setQty(qty + 1)}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-black text-white shadow-lg active:scale-95 transition-transform"
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    {/* Add Button */}
                    <button
                        onClick={handleAddToCart}
                        className="flex-1 h-14 bg-black text-white rounded-full font-bold text-[16px] flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-transform"
                    >
                        <span>В корзину</span>
                        <span className="bg-white/20 px-2 py-0.5 rounded text-[13px] font-medium">
                            {((product.price_raw || 0) * qty).toLocaleString()}
                        </span>
                    </button>
                </div>
            </div>

        </div>
    )
}
