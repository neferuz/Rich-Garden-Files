"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, Trash2, Minus, Plus, ShoppingBag, ChevronRight, Heart, Star, Check } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { BottomNav } from '@/components/BottomNav'
import { motion, useMotionValue, useTransform, animate, AnimatePresence, PanInfo } from 'framer-motion'
import { AnimatedBackground } from "@/components/features/home/AnimatedBackground"
import { cn } from "@/lib/utils"
import { ProductCard, type ProductCardProduct } from "@/components/features/catalog/ProductCard"
import { useFavorites } from "@/context/FavoritesContext"

export default function CartPage() {
    const router = useRouter()
    const { cartItems, updateQuantity, removeFromCart, totalPrice, clearCart, addToCart } = useCart()
    const { toggleFavorite, isFavorite } = useFavorites()
    const [recommendations, setRecommendations] = useState<any[]>([])
    const [isLoadingRecs, setIsLoadingRecs] = useState(true)
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        api.getProducts('Подборка для гостей')
            .then(data => {
                setRecommendations(data.filter(p => p.stock_quantity > 0))
            })
            .catch(console.error)
            .finally(() => setIsLoadingRecs(false))

        const handleScroll = () => {
            setScrolled(window.scrollY > 10)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showClearDialog, setShowClearDialog] = useState(false)
    const [showPromo, setShowPromo] = useState(false)

    const handleCheckout = () => {
        if (cartItems.length === 0) return
        router.push('/checkout')
    }

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen relative flex flex-col justify-center px-8 pb-24 overflow-hidden selection:bg-black selection:text-white">
                <AnimatedBackground />

                <div className="flex flex-col gap-6 max-w-xs relative z-10">
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="text-[42px] leading-[0.95] font-black text-black tracking-tight"
                    >
                        в корзине<br />
                        ничего нет...
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                        className="text-[17px] leading-snug text-gray-500 font-medium"
                    >
                        посмотрите наши <span className="text-black font-semibold">новинки</span> или
                        воспользуйтесь <span className="text-black font-semibold">поиском</span>, если ищете что-то
                        конкретное
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center h-14 px-8 bg-black text-white font-bold rounded-full active:scale-95 transition-transform w-fit mt-4"
                        >
                            На главную
                        </Link>
                    </motion.div>
                </div>
                <BottomNav />
            </div>
        )
    }

    return (
        <main className="min-h-screen relative pb-48 selection:bg-black selection:text-white">
            <AnimatedBackground />

            {/* Header */}
            <header className={cn(
                "fixed top-0 inset-x-0 z-50 transition-all duration-300",
                scrolled ? "bg-white/70 backdrop-blur-md border-b border-gray-100/50" : "bg-transparent"
            )}>
                <div className="px-4 h-16 flex items-center justify-between">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full border border-black/10 bg-transparent active:scale-95 transition-transform">
                        <ChevronLeft size={24} strokeWidth={1.5} className="text-black" />
                    </button>
                    <h1 className="text-[18px] font-bold text-black uppercase tracking-tight">Корзина</h1>
                    {cartItems.length > 0 && (
                        <button
                            onClick={() => setShowClearDialog(true)}
                            className="w-10 h-10 flex items-center justify-center -mr-2 rounded-full bg-transparent active:bg-gray-100/40 transition-colors"
                        >
                            <Trash2 size={24} strokeWidth={1.5} className="text-red-500" />
                        </button>
                    )}
                    {cartItems.length === 0 && <div className="w-10 h-10" />}
                </div>
            </header>

            <div className="px-4 flex flex-col gap-4 pt-20">
                {/* Items List */}
                <div className="flex flex-col gap-3 max-h-[240px] overflow-y-auto no-scrollbar py-1">
                    <AnimatePresence mode="popLayout">
                        {cartItems.map((item) => (
                            <SwipeableCartItem
                                key={item.product.id}
                                item={item}
                                updateQuantity={updateQuantity}
                                removeFromCart={removeFromCart}
                            />
                        ))}
                    </AnimatePresence>
                </div>

                {/* Order Options (Variants) */}
                <div className="mt-2 mb-8 flex flex-col gap-3">
                    {/* Delivery Info */}
                    <div className="bg-white rounded-[28px] p-5 flex items-center justify-between border border-black/5 transition-all active:scale-[0.98]">
                        <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="font-bold text-black text-[15px]">Доставка</span>
                            <p className="text-black text-[12px] font-medium leading-tight line-clamp-1">
                                Бесплатно для всех заказов
                            </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-4">
                            <span className="font-black text-green-600 text-[14px]">0 сум</span>
                            <Check size={18} className="text-green-500" />
                        </div>
                    </div>

                    {/* Promo Code Section */}
                    <div className="flex flex-col gap-2">
                        {!showPromo ? (
                            <button
                                onClick={() => setShowPromo(true)}
                                className="bg-white border border-black/5 rounded-[28px] p-5 flex items-center justify-between active:scale-[0.98] transition-all text-left"
                            >
                                <span className="font-bold text-black text-[15px]">У меня есть промокод</span>
                                <ChevronRight size={18} className="text-gray-300" />
                            </button>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white border border-black/5 rounded-[28px] p-2 flex items-center gap-2 pr-4 transition-all"
                            >
                                <div className="flex-1 h-12 relative flex items-center px-4 bg-white/50 rounded-[22px] border border-black/5">
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Промокод"
                                        className="w-full bg-transparent border-none outline-none text-[14px] font-bold text-black placeholder:text-gray-400"
                                    />
                                </div>
                                <button className="h-10 px-6 bg-black text-white text-[13px] font-black uppercase tracking-tighter rounded-[18px] active:scale-95 transition-all">
                                    Применить
                                </button>
                            </motion.div>
                        )}
                    </div>

                    {/* Active Promotions Flare */}
                    <div className="bg-black/[0.03] border border-black/[0.05] rounded-[28px] p-5 flex flex-col gap-2 relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-red-400/10 blur-3xl rounded-full" />
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center text-white shrink-0">
                                <Star size={16} fill="currentColor" />
                            </div>
                            <span className="font-bold text-black text-[14px]">Для вас доступна акция!</span>
                        </div>
                        <p className="text-gray-500 text-[13px] font-medium leading-relaxed pl-10">
                            Введите код <span className="text-black font-black">SPRING24</span> и получите <span className="text-red-500 font-black">-15%</span> на все весенние букеты.
                        </p>
                    </div>
                </div>

                {/* Recommended Section - "Add to order" */}
                {recommendations.length > 0 && (
                    <div className="mt-2 text-left">
                        <h3 className="text-[19px] font-black text-black mb-4 px-3 tracking-tight">Дополните заказ</h3>
                        <div className="flex gap-4 overflow-x-auto no-scrollbar px-3 py-2 snap-x snap-mandatory">
                            {recommendations.map((rec) => {
                                // Parse additional images from JSON string if they exist
                                let additionalImages: string[] = [];
                                if (rec.images) {
                                    try {
                                        const parsed = JSON.parse(rec.images);
                                        if (Array.isArray(parsed)) {
                                            additionalImages = parsed;
                                        }
                                    } catch (e) {
                                        console.error("Failed to parse product images", e);
                                    }
                                }

                                const p: ProductCardProduct = {
                                    id: rec.id,
                                    name: rec.name,
                                    price: rec.price
                                        ? (rec.price.toString().includes('сум')
                                            ? rec.price
                                            : `${(rec.price_raw || parseInt(rec.price.toString().replace(/\D/g, '')) || 0).toLocaleString()} сум`)
                                        : `${(rec.price_raw || 0).toLocaleString()} сум`,
                                    image: rec.image || "/placeholder.png",
                                    images: Array.from(new Set([rec.image, ...additionalImages])).filter(Boolean) as string[],
                                    isHit: rec.isHit,
                                    isNew: rec.isNew,
                                };

                                return (
                                    <ProductCard
                                        key={rec.id}
                                        product={p}
                                        variant="row"
                                        isFavorite={isFavorite(rec.id)}
                                        isInCart={cartItems.some(item => String(item.product.id) === String(rec.id))}
                                        showFavorite={false}
                                        showCart
                                        className="shadow-none hover:shadow-none"
                                        onFavoriteClick={() => {
                                            toggleFavorite({
                                                id: rec.id,
                                                name: rec.name,
                                                price: rec.price,
                                                image: rec.image,
                                            });
                                            toast.dismiss();
                                            toast.success(
                                                isFavorite(rec.id) ? "Удалено из избранного" : "Добавлено в избранное",
                                                { description: rec.name, duration: 2000 }
                                            );
                                        }}
                                        onCartClick={() => {
                                            if (cartItems.some(item => String(item.product.id) === String(rec.id))) {
                                                removeFromCart(rec.id);
                                                toast.error("Удалено из корзины", { description: rec.name });
                                            } else {
                                                addToCart(rec);
                                                toast.success("Добавлено", { description: rec.name, duration: 1500 });
                                            }
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Footer Actions Spacer */}
                <div className="h-4" />
            </div>

            {/* Sticky Bottom Action Bar */}
            <div className="fixed bottom-28 left-0 right-0 px-4 z-40 pointer-events-none flex justify-center">
                <button
                    onClick={handleCheckout}
                    disabled={isSubmitting}
                    className={cn(
                        "w-full max-w-[340px] h-16 bg-black text-white rounded-full flex items-center justify-between px-8 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.3)] active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 pointer-events-auto",
                        isSubmitting && "opacity-70 cursor-not-allowed"
                    )}
                >
                    <div className="flex flex-col items-start leading-tight">
                        <span className="text-[12px] text-white/50 font-bold uppercase tracking-widest">К оплате</span>
                        <span className="text-[18px] font-black uppercase tracking-tight">{totalPrice.toLocaleString()} сум</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[16px] font-black uppercase tracking-tight">Оформить</span>
                        <ChevronRight size={20} strokeWidth={3} />
                    </div>
                </button>
            </div>

            {/* Clear Cart Dialog */}
            <AnimatePresence>
                {showClearDialog && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowClearDialog(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        {/* Dialog */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-white/95 backdrop-blur-xl rounded-[32px] p-8 w-full max-w-sm shadow-2xl overflow-hidden border border-white/20"
                        >
                            <div className="flex justify-center mb-6">
                                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
                                    <Trash2 size={28} className="text-red-500" strokeWidth={1.5} />
                                </div>
                            </div>
                            <h3 className="text-[22px] font-bold text-center text-black mb-2 tracking-tight">Очистить корзину?</h3>
                            <p className="text-gray-500 text-center mb-8 text-[15px] leading-relaxed">
                                Все товары будут удалены. Это действие нельзя отменить.
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => {
                                        clearCart()
                                        setShowClearDialog(false)
                                        toast.success("Корзина очищена")
                                    }}
                                    className="h-14 rounded-2xl bg-red-500 text-white font-bold text-[16px] active:scale-[0.98] transition-all shadow-lg shadow-red-500/25"
                                >
                                    Да, очистить
                                </button>
                                <button
                                    onClick={() => setShowClearDialog(false)}
                                    className="h-14 rounded-2xl bg-gray-100 text-black font-bold text-[16px] active:scale-[0.98] transition-all"
                                >
                                    Отмена
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <BottomNav />
        </main>
    )
}


function SwipeableCartItem({ item, updateQuantity, removeFromCart }: { item: any, updateQuantity: any, removeFromCart: any }) {
    const x = useMotionValue(0)
    const iconScale = useTransform(x, [-150, -50], [1.2, 0.8])
    const bgOpacity = useTransform(x, [-60, 0], [1, 0])

    const handleDragEnd = (event: any, info: PanInfo) => {
        if (info.offset.x < -150) {
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                try { navigator.vibrate(50) } catch (e) { }
            }
            removeFromCart(item.product.id)
        } else {
            animate(x, 0, { type: "spring", stiffness: 280, damping: 35 })
        }
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -300, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.4 }}
            className="relative"
        >
            {/* Background (Delete Action) */}
            <motion.div
                style={{ opacity: bgOpacity }}
                className="absolute inset-0 bg-red-500 rounded-[32px] flex justify-end items-center pr-8 mb-0 z-0"
            >
                <motion.div style={{ scale: iconScale }} className="flex items-center gap-2">
                    <Trash2 color="white" size={24} strokeWidth={2.5} />
                </motion.div>
            </motion.div>

            {/* Foreground (Card) */}
            <motion.div
                style={{ x: x as any }}
                drag="x"
                dragConstraints={{ right: 0 }}
                dragElastic={{ left: 0.6 }}
                onDragEnd={handleDragEnd}
                className="bg-white p-2.5 rounded-[28px] border border-black/5 flex gap-3 relative z-10 touch-pan-y active:scale-[0.99] transition-transform"
                whileTap={{ cursor: "grabbing" }}
            >
                {/* Image */}
                <div className="relative w-[76px] h-[76px] bg-white rounded-[20px] p-1 shrink-0">
                    <div className="relative w-full h-full rounded-[16px] overflow-hidden">
                        <Image
                            src={item.product.image.startsWith('http') ? item.product.image : `${item.product.image}`}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                        />
                    </div>
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                    <div className="flex flex-col gap-0.5">
                        <h3 className="text-[14px] font-black text-black leading-tight truncate">
                            {item.product.name}
                        </h3>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                        <span className="text-[15px] font-black text-black tracking-tight">
                            {(item.product.price_raw || parseInt(item.product.price.toString().replace(/\D/g, ''))).toLocaleString()} <span className="text-[11px] font-bold text-black/40">сум</span>
                        </span>

                        {/* Minimal Quantity Control */}
                        <div className="flex items-center bg-black/5 rounded-lg h-8 px-1">
                            <button
                                onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                                className="w-7 h-full flex items-center justify-center text-black/40 hover:text-black transition-colors"
                            >
                                <Minus size={14} strokeWidth={3} />
                            </button>
                            <span className="text-[13px] font-black w-5 text-center text-black">{item.quantity}</span>
                            <button
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                className="w-7 h-full flex items-center justify-center text-black/40 hover:text-black transition-colors"
                            >
                                <Plus size={14} strokeWidth={3} />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}
