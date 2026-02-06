"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Heart, Share2, Minus, Plus, ShoppingBag, Truck, Trash2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [scrolled, setScrolled] = useState(false)
    const [galleryImages, setGalleryImages] = useState<string[]>([])
    const [isFullScreenOpen, setIsFullScreenOpen] = useState(false)

    const { addToCart, cartItems, removeFromCart, updateQuantity } = useCart()
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
            // Parse additional images
            let gallery = []
            try {
                gallery = productData.images ? JSON.parse(productData.images) : []
            } catch (e) { gallery = [] }

            // Ensure main image is first
            const mainImg = productData.image.startsWith('http') ? productData.image : `${productData.image}`

            // Normalize gallery images
            const galleryImagesParsed = gallery.map((img: string) =>
                img.startsWith('http') ? img : `${img}`
            )

            // Combine unique images
            const allImages = Array.from(new Set([mainImg, ...galleryImagesParsed]))

            setProduct({
                ...productData,
                image: mainImg
            })
            setGalleryImages(allImages as string[])

            // Filter recommended: exclude current, strictly bouquets
            const others = allProducts
                .filter(p => String(p.id) !== productId && !p.is_ingredient && p.composition && p.composition !== "[]")
                .map(p => ({
                    ...p,
                    image: p.image.startsWith('http') ? p.image : `${p.image}`
                }))
                .slice(0, 4)

            setRecommended(others)
        }).catch(err => {
            console.error(err)
            toast.error("Не удалось загрузить товар")
        }).finally(() => setLoading(false))
    }, [productId])

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-gray-100 border-t-black rounded-full animate-spin"></div>
            </div>
        </div>
    )

    if (!product) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
            <p className="text-gray-500 font-medium">Товар не найден</p>
            <button onClick={() => router.back()} className="text-black font-bold bg-white px-6 py-3 rounded-full shadow-sm">Назад в каталог</button>
        </div>
    )

    const images = galleryImages.length > 0 ? galleryImages : [product.image]

    const composition = product.composition && product.composition !== "[]"
        ? JSON.parse(product.composition)
        : []

    const handleAddToCart = () => {
        addToCart({
            ...product,
            price: product.price_display || `${product.price_raw.toLocaleString()} сум`
        }, qty)
    }

    return (
        <div className="min-h-screen bg-white pb-32">

            {/* Custom Navigation */}
            <div className={`fixed top-0 left-0 right-0 p-4 z-60 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-xl shadow-sm pt-4' : 'bg-transparent pt-6'}`}>
                <div className="flex justify-between items-center max-w-lg mx-auto w-full">
                    <button
                        onClick={() => router.back()}
                        className={`w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-all duration-200 ${scrolled ? 'bg-gray-100' : 'bg-white/70 backdrop-blur-md shadow-sm'} text-black`}
                    >
                        <ChevronLeft size={24} className="-ml-0.5" />
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                if (!product) return
                                const isFav = isFavorite(product.id)
                                toggleFavorite({ ...product, price: product.price_display || `${product.price_raw?.toLocaleString()} сум` })
                                toast.dismiss()
                                toast.success(isFav ? "Удалено из избранного" : "Добавлено в избранное")
                            }}
                            className={`w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-all duration-200 ${scrolled ? 'bg-gray-100' : 'bg-white/70 backdrop-blur-md shadow-sm'} text-black`}
                        >
                            <Heart size={20} className={product && isFavorite(product.id) ? "fill-red-500 text-red-500 scale-110" : "scale-100"} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Image Gallery */}
            <div className="relative w-full aspect-[4/5] bg-gray-100 overflow-hidden">
                <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(e, info) => {
                        const threshold = 50;
                        if (info.offset.x > threshold && currentImageIndex > 0) {
                            setCurrentImageIndex(currentImageIndex - 1);
                        } else if (info.offset.x < -threshold && currentImageIndex < images.length - 1) {
                            setCurrentImageIndex(currentImageIndex + 1);
                        }
                    }}
                    animate={{ x: `-${currentImageIndex * 100}%` }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="flex h-full cursor-grab active:cursor-grabbing"
                >
                    {images.map((img: string, idx: number) => (
                        <div
                            key={idx}
                            className="min-w-full h-full relative cursor-zoom-in"
                            onClick={() => setIsFullScreenOpen(true)}
                        >
                            <Image
                                src={img}
                                alt={`${product.name} - ${idx + 1}`}
                                fill
                                className="object-cover"
                                priority={idx === 0}
                            />
                            {/* Dark Gradient Overlay for Text Visibility */}
                            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
                        </div>
                    ))}
                </motion.div>

                {/* Slider Controls */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-black/40 hover:text-black transition-all z-50 active:scale-90"
                        >
                            <ChevronLeft size={24} strokeWidth={2.5} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-black/40 hover:text-black transition-all z-50 active:scale-90"
                        >
                            <ChevronRight size={24} strokeWidth={2.5} />
                        </button>
                    </>
                )}

                {/* Pagination Dots */}
                {images.length > 1 && (
                    <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-3 z-20">
                        <div className="px-3 py-1 rounded-full bg-black/20 backdrop-blur-md text-[10px] font-black text-white/90 uppercase tracking-widest border border-white/10">
                            {currentImageIndex + 1} / {images.length}
                        </div>
                        <div className="flex justify-center gap-1.5">
                            {images.map((_: any, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentImageIndex(idx)}
                                    className={`h-1 rounded-full transition-all duration-300 backdrop-blur-sm ${currentImageIndex === idx ? 'w-5 bg-white' : 'w-1 bg-white/30'}`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Content Container */}
            <div className="relative -mt-6 bg-white rounded-t-[32px] px-6 pt-8 z-20">
                <div className="flex flex-col gap-1 mb-6">
                    <div className="flex justify-between items-start gap-4">
                        <h1 className="text-3xl font-black text-gray-900 leading-tight tracking-tight">{product.name}</h1>
                        {product.is_hit && (
                            <div className="shrink-0 px-3 py-1 rounded-full bg-black text-white text-[10px] font-bold uppercase tracking-wider">
                                Хит
                            </div>
                        )}
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-bold text-gray-900">{product.price_display || `${product.price_raw.toLocaleString()} сум`}</span>
                        {product.is_new && <span className="text-sm font-bold text-green-600 bg-green-50 px-2.5 py-0.5 rounded-lg">Новинка</span>}
                    </div>
                </div>

                {/* Description */}
                {product.description && (
                    <div className="mb-8">
                        <p className="text-[15px] leading-relaxed text-gray-500 font-medium">
                            {product.description}
                        </p>
                    </div>
                )}

                {/* Composition Card */}
                {composition.length > 0 && (
                    <div className="mb-10">
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-4 px-2">Состав композиции</h3>
                        <div className="bg-gray-50/50 rounded-[24px] p-2 border border-gray-100">
                            {composition.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center p-3 last:border-0 border-b border-gray-100/80">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-bold text-gray-300 w-4">{String(idx + 1).padStart(2, '0')}</span>
                                        <span className="text-[14px] font-bold text-gray-900 capitalize">{item.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-[10px]">
                                        <span className="text-[10px] font-bold text-gray-400">x</span>
                                        <span className="text-[13px] font-bold text-gray-900">{item.qty}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}


                {/* Recommended Section */}
                {recommended.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-5 px-1">
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Похожие</h3>
                            <Link href="/" className="text-xs font-bold text-gray-400 uppercase tracking-wide">Все</Link>
                        </div>

                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x snap-mandatory -mx-6 px-6">
                            {recommended.map((rec) => (
                                <Link
                                    href={`/product/${rec.id}`}
                                    key={rec.id}
                                    className="min-w-[155px] snap-center flex flex-col gap-3 group"
                                >
                                    <div className="relative aspect-[3/4] rounded-[22px] overflow-hidden bg-gray-50 border border-gray-100/50">
                                        <Image
                                            src={rec.image}
                                            alt={rec.name}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>
                                    <div className="px-0.5">
                                        <h4 className="font-bold text-[14px] text-gray-900 leading-tight mb-1 truncate">{rec.name}</h4>
                                        <p className="text-[14px] font-extrabold text-black">
                                            {rec.price_raw?.toLocaleString() || rec.price_display} сум
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 z-40">
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-transparent backdrop-blur-md -z-10 h-36 bottom-0 pointer-events-none" />

                <div className="max-w-lg mx-auto flex gap-3 items-center">
                    {(() => {
                        const cartItem = cartItems.find(item => String(item.product.id) === productId);
                        const isInCart = !!cartItem;
                        const displayQty = isInCart ? cartItem.quantity : qty;

                        return (
                            <>
                                {/* Stepper */}
                                <div className="h-[60px] bg-white border border-gray-100 rounded-[24px] px-2 flex items-center shadow-lg shadow-gray-200/50">
                                    <button
                                        onClick={() => {
                                            if (isInCart) {
                                                updateQuantity(productId, displayQty - 1);
                                                if (displayQty === 1) toast.error("Удалено из корзины");
                                            } else {
                                                setQty(Math.max(1, qty - 1));
                                            }
                                        }}
                                        className="w-11 h-11 flex items-center justify-center rounded-[18px] hover:bg-gray-100 active:scale-95 transition-all text-gray-900"
                                    >
                                        {(isInCart && displayQty === 1) ? (
                                            <Trash2 size={18} className="text-red-500" />
                                        ) : (
                                            <Minus size={20} strokeWidth={2.5} />
                                        )}
                                    </button>
                                    <span className="w-8 text-center font-bold text-lg text-gray-900">{displayQty}</span>
                                    <button
                                        onClick={() => {
                                            if (isInCart) {
                                                updateQuantity(productId, displayQty + 1);
                                            } else {
                                                setQty(qty + 1);
                                            }
                                        }}
                                        className="w-11 h-11 flex items-center justify-center rounded-[18px] hover:bg-black hover:text-white active:scale-95 transition-all text-gray-900"
                                    >
                                        <Plus size={20} strokeWidth={2.5} />
                                    </button>
                                </div>

                                {/* Add / Go to Cart Button */}
                                <button
                                    onClick={isInCart ? () => router.push('/cart') : handleAddToCart}
                                    className="flex-1 h-[60px] bg-[#0a0a0a] text-white rounded-[24px] font-bold text-[17px] flex items-center justify-center gap-3 shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden relative group"
                                >
                                    <span className="relative z-10">
                                        {isInCart ? "Перейти в корзину" : "В корзину"}
                                    </span>
                                    {!isInCart && (
                                        <>
                                            <div className="w-px h-4 bg-white/20 relative z-10" />
                                            <span className="relative z-10 text-white/90 font-medium">
                                                {((product.price_raw || 0) * displayQty).toLocaleString()}
                                            </span>
                                        </>
                                    )}

                                    {/* Shine Effect */}
                                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0" />
                                </button>
                            </>
                        );
                    })()}
                </div>
            </div>

            {/* Full Screen Gallery Modal */}
            <AnimatePresence>
                {isFullScreenOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black backdrop-blur-2xl flex flex-col items-center justify-center pt-20 pb-32"
                        onClick={() => setIsFullScreenOpen(false)}
                    >
                        {/* Header: Close Button and Counter */}
                        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-[110]">
                            <div className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full text-white/90 text-[10px] font-black tracking-[0.2em] uppercase">
                                {currentImageIndex + 1} / {images.length}
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsFullScreenOpen(false);
                                }}
                                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Main Image Container */}
                        <div className="relative w-full h-full max-w-lg overflow-hidden flex items-center justify-center px-4" onClick={e => e.stopPropagation()}>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentImageIndex}
                                    initial={{ opacity: 0, scale: 0.9, x: 20 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, x: -20 }}
                                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                    className="relative w-full aspect-square md:aspect-auto md:h-[60vh]"
                                >
                                    <img
                                        src={images[currentImageIndex]}
                                        alt={`${product?.name} - Full`}
                                        className="w-full h-full object-contain"
                                    />
                                </motion.div>
                            </AnimatePresence>

                            {/* Slider Controls Inside Modal */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                                        }}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center text-white border border-white/5 active:scale-90 transition-all z-[120]"
                                    >
                                        <ChevronLeft size={32} strokeWidth={2.5} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                                        }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center text-white border border-white/5 active:scale-90 transition-all z-[120]"
                                    >
                                        <ChevronRight size={32} strokeWidth={2.5} />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Footer Nav for context */}
                        <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-2 z-[110]">
                            {images.map((_: any, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentImageIndex(idx);
                                    }}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${currentImageIndex === idx ? 'w-8 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'w-1.5 bg-white/20'}`}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
