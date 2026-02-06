"use client"

import { useFavorites } from '@/context/FavoritesContext'
import { BottomNav } from '@/components/BottomNav'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, ShoppingBag, ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ProductCard, type ProductCardProduct } from '@/components/features/catalog/ProductCard'

export default function FavoritesPage() {
    const { favorites, toggleFavorite } = useFavorites()
    const router = useRouter()

    if (favorites.length === 0) {
        return (
            <div className="min-h-screen bg-white flex flex-col justify-center px-8 pb-24 relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-red-50 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-[20%] left-[-10%] w-48 h-48 bg-pink-50 rounded-full blur-3xl opacity-50" />

                <div className="flex flex-col gap-6 max-w-xs relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-2"
                    >
                        <Heart size={32} className="text-red-500 fill-red-500/10" strokeWidth={1.5} />
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="text-[42px] leading-[0.95] font-black text-black tracking-tight"
                    >
                        в избранном<br />
                        пусто...
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                        className="text-[17px] leading-snug text-gray-500 font-medium"
                    >
                        добавляйте товары в <span className="text-black font-semibold">избранное</span>, чтобы
                        они всегда были под <span className="text-black font-semibold">рукой</span>
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
        <main className="min-h-screen bg-[#f9fafb] pb-32">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
                <div className="px-4 h-16 flex items-center justify-between">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full border border-black/10 bg-transparent active:scale-95 transition-transform">
                        <ChevronLeft size={24} strokeWidth={1.5} className="text-black" />
                    </button>

                    <h1 className="text-[22px] font-bold text-black lowercase tracking-tight">избранное</h1>

                    <Link href="/cart" className="w-10 h-10 flex items-center justify-center relative active:scale-95 transition-transform">
                        <ShoppingBag size={22} strokeWidth={1.5} className="text-black" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    </Link>
                </div>
            </header>

            {/* Content — единые карточки */}
            <div className="px-4 md:px-6 pt-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                    {favorites.map((product) => {
                        const p: ProductCardProduct = {
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            image: product.image,
                            isHit: product.isHit,
                            isNew: product.isNew,
                        };
                        return (
                            <div key={product.id}>
                                <ProductCard
                                    product={p}
                                    variant="grid"
                                    isFavorite
                                    showFavorite
                                    showCart={false}
                                    onFavoriteClick={() => {
                                        toggleFavorite(product);
                                        toast.dismiss();
                                        toast.success("Удалено из избранного", {
                                            description: product.name,
                                            duration: 2000,
                                        });
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            <BottomNav />
        </main>
    )
}
