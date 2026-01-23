"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, Trash2, Minus, Plus, ShoppingBag, ChevronRight, Heart, Star } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { BottomNav } from '@/components/BottomNav'
import { motion, useMotionValue, useTransform, animate, AnimatePresence, PanInfo } from 'framer-motion'

export default function CartPage() {
    const router = useRouter()
    const { cartItems, updateQuantity, removeFromCart, totalPrice, clearCart, addToCart } = useCart()
    const [recommendations, setRecommendations] = useState<any[]>([])
    const [isLoadingRecs, setIsLoadingRecs] = useState(true)

    useEffect(() => {
        api.getProducts('Подборка для гостей')
            .then(data => {
                setRecommendations(data.filter(p => p.stock_quantity > 0))
            })
            .catch(console.error)
            .finally(() => setIsLoadingRecs(false))
    }, [])

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showClearDialog, setShowClearDialog] = useState(false)

    const handleCheckout = () => {
        if (cartItems.length === 0) return
        router.push('/checkout')
    }

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-white flex flex-col justify-center px-8 pb-24 top-0 z-50">
                <div className="flex flex-col gap-6 max-w-xs">
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
                            className="inline-flex items-center justify-center h-14 px-8 bg-black text-white font-bold rounded-none active:scale-95 transition-transform w-fit mt-4"
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
        <div className="min-h-screen bg-gray-50 pb-48">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 mb-6">
                <div className="px-4 h-16 flex items-center justify-between">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full border border-black/10 bg-transparent active:scale-95 transition-transform">
                        <ChevronLeft size={24} strokeWidth={1.5} className="text-black" />
                    </button>
                    <h1 className="text-[18px] font-bold text-black uppercase tracking-tight">Корзина</h1>
                    {cartItems.length > 0 && (
                        <button
                            onClick={() => setShowClearDialog(true)}
                            className="w-10 h-10 flex items-center justify-center -mr-2 rounded-full bg-transparent active:bg-gray-100 transition-colors"
                        >
                            <Trash2 size={24} strokeWidth={1.5} className="text-red-500" />
                        </button>
                    )}
                    {cartItems.length === 0 && <div className="w-10 h-10" />}
                </div>
            </header>

            <div className="px-4 flex flex-col gap-4">
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
                <div className="px-4 mt-2 mb-8 flex flex-col gap-3">
                    {/* Delivery Info */}
                    <div className="bg-gray-50 rounded-[24px] p-4 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="font-bold text-black text-[15px]">Доставка</span>
                            <span className="text-gray-500 text-[13px] font-medium">Ещё 31 010 сум, и будет 10 сум</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-black">10 000 сум</span>
                            <ChevronRight size={20} className="text-gray-300" />
                        </div>
                    </div>

                    {/* Packaging */}
                    <div className="bg-white border border-gray-100 rounded-[24px] p-4 flex items-center justify-between active:bg-gray-50 transition-colors">
                        <span className="font-bold text-black text-[15px]">Упаковка заказа</span>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-black">650 сум</span>
                            <ChevronRight size={20} className="text-gray-300" />
                        </div>
                    </div>
                </div>

                {/* Recommended Section */}
                {recommendations.length > 0 && (
                    <div className="mt-2 text-left">
                        <h3 className="text-[18px] font-bold text-black mb-4 px-1">Подобрали для вас</h3>
                        <div className="flex gap-4 overflow-x-auto no-scrollbar px-6 py-2 snap-x snap-mandatory -mx-4">
                            {recommendations.map((rec) => {
                                const imageUrl = rec.image.startsWith('http') ? rec.image : `http://localhost:8000${rec.image}`;

                                return (
                                    <Link
                                        href={`/product/${rec.id}`}
                                        key={rec.id}
                                        className="min-w-[150px] snap-center flex flex-col gap-2 group cursor-pointer"
                                    >
                                        {/* Image Container */}
                                        <div className="relative w-full h-[155px] bg-[#F7F7F7] rounded-[22px] overflow-hidden border border-gray-100/50">
                                            <Image
                                                src={imageUrl}
                                                alt={rec.name}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        </div>

                                        {/* Content */}
                                        <div className="text-left px-0.5">
                                            <h4 className="text-[14px] font-bold text-gray-900 leading-tight mb-1 truncate">{rec.name}</h4>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[15px] font-bold text-black">{rec.price_raw?.toLocaleString()} сум</span>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        addToCart(rec);
                                                        toast.success("Добавлено в корзину", {
                                                            description: rec.name,
                                                            duration: 2000,
                                                        });
                                                    }}
                                                    className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white active:scale-90 transition-transform z-10"
                                                >
                                                    <Plus size={18} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Footer Actions Spacer */}
                <div className="h-4" />
            </div>

            {/* Sticky Bottom Action Bar */}
            <div className="fixed bottom-8 left-0 right-0 px-4 z-40">
                <div className="w-full flex justify-center">
                    <button
                        onClick={handleCheckout}
                        disabled={isSubmitting}
                        className="w-full max-w-[340px] h-16 bg-black text-white rounded-full flex items-center justify-between px-8 shadow-2xl active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                    >
                        <div className="flex flex-col items-start leading-tight">
                            <span className="text-[14px] text-white/60 font-medium">К оплате</span>
                            <span className="text-[17px] font-bold">{(totalPrice + 10000 + 650).toLocaleString()} сум</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[17px] font-black uppercase tracking-tight">Оформить</span>
                            <ChevronRight size={20} strokeWidth={3} />
                        </div>
                    </button>
                </div>
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
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative bg-white rounded-[24px] p-6 w-full max-w-sm shadow-2xl overflow-hidden"
                        >
                            <div className="flex justify-center mb-4">
                                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                                    <Trash2 size={24} className="text-red-500" />
                                </div>
                            </div>
                            <h3 className="text-[20px] font-bold text-center text-black mb-2">Очистить корзину?</h3>
                            <p className="text-gray-500 text-center mb-6 text-[15px] leading-relaxed">
                                Все добавленные товары будут удалены. Это действие нельзя отменить.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowClearDialog(false)}
                                    className="flex-1 h-12 rounded-[16px] bg-gray-100 text-black font-bold text-[15px] active:scale-95 transition-transform"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={() => {
                                        clearCart()
                                        setShowClearDialog(false)
                                        toast.success("Корзина очищена")
                                    }}
                                    className="flex-1 h-12 rounded-[16px] bg-red-500 text-white font-bold text-[15px] active:scale-95 transition-transform shadow-lg shadow-red-500/30"
                                >
                                    Да, удалить
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}


function SwipeableCartItem({ item, updateQuantity, removeFromCart }: { item: any, updateQuantity: any, removeFromCart: any }) {
    const x = useMotionValue(0)
    const iconScale = useTransform(x, [-150, -50], [1.2, 0.8])
    const bgOpacity = useTransform(x, [-60, 0], [1, 0])

    const handleDragEnd = (event: any, info: PanInfo) => {
        // Trigger delete if swiped left more than 150px (increased threshold)
        if (info.offset.x < -150) {
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                try { navigator.vibrate(50) } catch (e) { }
            }
            removeFromCart(item.product.id)
        } else {
            // Snap back
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
                className="absolute inset-0 bg-red-500 rounded-[24px] flex justify-end items-center pr-6 mb-0 z-0"
            >
                <motion.div style={{ scale: iconScale }} className="flex items-center gap-2">
                    <span className="text-white font-bold text-[14px]">Удалить</span>
                    <Trash2 color="white" size={20} />
                </motion.div>
            </motion.div>

            {/* Foreground (Card) */}
            <motion.div
                style={{ x }}
                drag="x"
                dragConstraints={{ right: 0 }}
                dragElastic={{ left: 0.6 }}
                onDragEnd={handleDragEnd}
                className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex gap-4 relative z-10 touch-pan-y"
                whileTap={{ cursor: "grabbing" }}
            >
                {/* Image */}
                <div className="relative w-[88px] h-[88px] bg-[#F7F7F7] rounded-[18px] p-1.5 shrink-0">
                    <div className="relative w-full h-full rounded-[14px] overflow-hidden">
                        <Image
                            src={item.product.image.startsWith('http') ? item.product.image : `http://localhost:8000${item.product.image}`}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                        />
                    </div>
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-center min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider truncate pr-2">
                            {(item.product as any).category || 'Букет'}
                        </span>
                        <span className="text-[16px] font-bold text-gray-900 whitespace-nowrap">
                            {(item.product.price_raw || parseInt(item.product.price.toString().replace(/\D/g, ''))).toLocaleString()} сум
                        </span>
                    </div>

                    <h3 className="text-[15px] font-extrabold text-gray-900 leading-tight mb-3 truncate">
                        {item.product.name}
                    </h3>

                    <div className="flex items-center gap-3">
                        {/* Minimal Quantity Control */}
                        <div className="flex items-center bg-gray-50 rounded-lg h-7 px-1">
                            <button
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                className="w-7 h-full flex items-center justify-center text-gray-400 hover:text-black transition-colors"
                            >
                                <Minus size={14} />
                            </button>
                            <span className="text-[13px] font-bold w-5 text-center text-black">{item.quantity}</span>
                            <button
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                className="w-7 h-full flex items-center justify-center text-gray-400 hover:text-black transition-colors"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}
