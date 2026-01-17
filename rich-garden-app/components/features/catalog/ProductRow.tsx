import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, Plus, Star, ArrowUpRight } from 'lucide-react';
import { useFavorites } from '@/context/FavoritesContext';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import { useState } from "react";
import { api } from '@/lib/api';

export function ProductRow({ title, products, categorySlug, telegramUserId }: { title: string, products: any[], categorySlug: string, telegramUserId?: number }) {
    const { toggleFavorite, isFavorite } = useFavorites();
    const { addToCart } = useCart();
    const [scrollProgress, setScrollProgress] = useState(0);

    const handleProductClick = (productId: number) => {
        if (telegramUserId) {
            api.addRecentlyViewed(telegramUserId, productId).catch(console.error);
        }
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollLeft, scrollWidth, clientWidth } = e.currentTarget;
        const maxScroll = scrollWidth - clientWidth;
        const progress = maxScroll > 0 ? scrollLeft / maxScroll : 0;
        setScrollProgress(progress);
    };

    if (products.length === 0) return null;

    return (
        <div id={`section-${title}`}>
            <div className="px-6 mt-8 mb-4 flex items-center justify-between">
                <h3 className="text-[20px] font-bold text-gray-900 tracking-tight">{title}</h3>
                <Link href={`/catalog/${categorySlug}`} className="bg-[#DBE6FF] px-4 py-1.5 rounded-full flex items-center gap-1.5 active:scale-95 transition-transform">
                    <span className="text-[13px] font-bold text-blue-900 mb-[1px]">все</span>
                    <ArrowUpRight size={16} className="text-blue-900" />
                </Link>
            </div>

            <div className="relative">
                <div
                    className="flex gap-4 overflow-x-auto no-scrollbar px-6 py-2 snap-x snap-mandatory"
                    onScroll={handleScroll}
                >
                    {products.map(product => (
                        <Link
                            href={`/product/${product.id}`}
                            key={product.id}
                            className="min-w-[170px] sm:min-w-[190px] snap-center group relative cursor-pointer block"
                            onClick={() => handleProductClick(product.id)}
                        >
                            <div className="relative aspect-[3/4] rounded-[20px] overflow-hidden mb-3 bg-gray-50">
                                <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />

                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleFavorite({ id: product.id, name: product.name, price: product.price, image: product.image });
                                        toast.dismiss();
                                        toast.success(isFavorite(product.id) ? "Удалено из избранного" : "Добавлено в избранное", {
                                            description: product.name,
                                            duration: 2000,
                                        });
                                    }}
                                    className="absolute top-2.5 right-2.5 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-black active:scale-95 transition-transform hover:bg-white"
                                >
                                    <Heart size={16} className={isFavorite(product.id) ? "fill-red-500 text-red-500" : "hover:text-red-500 transition-colors"} />
                                </button>

                                <div className="absolute bottom-2.5 left-2.5 px-2 py-1 bg-white/80 backdrop-blur-md rounded-lg flex items-center gap-1 shadow-sm">
                                    <Star size={10} className="fill-yellow-400 text-yellow-400" />
                                    <span className="text-[10px] font-bold text-gray-800">{product.rating || 5.0}</span>
                                </div>
                            </div>

                            <div className="space-y-1 px-1">
                                <h4 className="text-[14px] font-medium leading-tight text-gray-900 line-clamp-2">{product.name}</h4>
                                <div className="flex items-center justify-between">
                                    <p className="text-[16px] font-bold text-black">{product.price}</p>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            addToCart(product);
                                        }}
                                        className="w-7 h-7 bg-black text-white rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-md hover:bg-gray-800"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {products.length > 2 && (
                    <div className="px-6 mt-6 flex justify-center">
                        <div className="bg-gray-200 rounded-full h-1 w-24 overflow-hidden relative">
                            <motion.div
                                className="absolute top-0 bottom-0 bg-black rounded-full w-8"
                                animate={{ left: `${scrollProgress * (96 - 32)}px` }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
