import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, TrendingUp, Clock, Heart, LayoutGrid, ChevronRight } from 'lucide-react';
import Image from "next/image";
import Link from "next/link";
import { api } from '@/lib/api';
import { useFavorites } from '@/context/FavoritesContext';
import { toast } from 'sonner';

import { useProducts } from '@/hooks/useProducts';

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    telegramUserId?: number;
}

export function SearchOverlay({ isOpen, onClose, telegramUserId }: SearchOverlayProps) {
    const [popularTags, setPopularTags] = useState<string[]>([]);
    const [recentProducts, setRecentProducts] = useState<any[]>([]);
    const { toggleFavorite, isFavorite } = useFavorites();
    const { categories, products } = useProducts();
    const [query, setQuery] = useState("");

    useEffect(() => {
        if (!isOpen) {
            setQuery(""); // Reset query when closed
        }
        if (isOpen) {
            api.getPopularSearches().then(data => {
                setPopularTags(data.tags);
            }).catch(console.error);

            if (telegramUserId) {
                api.getRecentlyViewed(telegramUserId).then(products => {
                    const mapped = products.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        category: p.category,
                        price: p.price_display || `${p.price_raw.toLocaleString()} сум`,
                        image: p.image.startsWith('http') ? p.image : `http://localhost:8000${p.image}`,
                        rating: p.rating,
                        isHit: p.is_hit,
                        isNew: p.is_new,
                        price_raw: p.price_raw
                    }));
                    setRecentProducts(mapped);
                }).catch(console.error);
            }
        }
    }, [isOpen, telegramUserId]);

    const handleProductClick = (productId: number) => {
        if (telegramUserId) {
            api.addRecentlyViewed(telegramUserId, productId).catch(console.error);
        }
        onClose();
    };

    const filteredProducts = query
        ? products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
        : [];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[60] bg-white/95 backdrop-blur-3xl flex flex-col items-center"
                >
                    {/* Close Button (Floating) */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center active:scale-90 transition-transform hover:bg-gray-200"
                    >
                        <X size={20} className="text-black" />
                    </button>

                    {/* Main Content Container */}
                    <div className="w-full max-w-lg flex flex-col h-full pt-20 px-6 pb-32 overflow-y-auto no-scrollbar">

                        {/* Search Input Area */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="relative mb-8"
                        >
                            <Search size={28} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                autoFocus
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Что ищем?"
                                className="w-full bg-transparent outline-none text-[32px] font-bold text-black placeholder:text-gray-300 pl-12"
                            />
                        </motion.div>

                        {query ? (
                            // Search Results
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col gap-4"
                            >
                                <div className="flex items-center gap-2 mb-2 text-gray-400 text-[12px] font-bold uppercase tracking-widest">
                                    <Search size={14} />
                                    <span>Результаты поиска</span>
                                </div>

                                {filteredProducts.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        {filteredProducts.map((product) => (
                                            <motion.div
                                                key={product.id}
                                                whileHover={{ y: -5 }}
                                                className="group cursor-pointer"
                                            >
                                                <Link href={`/product/${product.id}`} onClick={() => handleProductClick(product.id as number)}>
                                                    <div className="relative aspect-[3/4] rounded-[20px] overflow-hidden mb-3 bg-gray-50">
                                                        <Image
                                                            src={product.image.startsWith('http') ? product.image : `http://localhost:8000${product.image}`}
                                                            alt={product.name}
                                                            fill
                                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                // Use toggleFavorite from context, pass full product object
                                                                toggleFavorite({
                                                                    id: product.id,
                                                                    name: product.name,
                                                                    price: product.price,
                                                                    image: product.image
                                                                });
                                                                toast.dismiss();
                                                                toast.success(isFavorite(product.id) ? "Удалено из избранного" : "Добавлено в избранное", {
                                                                    description: product.name,
                                                                    duration: 2000,
                                                                });
                                                            }}
                                                            className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-90 transition-transform"
                                                        >
                                                            <Heart size={16} className={isFavorite(product.id) ? "fill-red-500 text-red-500" : "text-black hover:text-red-500 hover:fill-red-500 transition-colors"} />
                                                        </button>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h3 className="text-[15px] font-medium leading-tight text-gray-900 line-clamp-2">{product.name}</h3>
                                                        <p className="text-[17px] font-bold text-black">{product.price}</p>
                                                    </div>
                                                </Link>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 opacity-50">
                                        <p>Ничего не найдено</p>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            // Default View: Catalog + Recent
                            <>
                                {/* Catalog Categories */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.15 }}
                                    className="mb-10"
                                >
                                    <div className="flex items-center gap-2 mb-4 text-gray-400 text-[12px] font-bold uppercase tracking-widest">
                                        <LayoutGrid size={14} />
                                        <span>Каталог</span>
                                    </div>
                                    <div className="flex flex-col">
                                        {categories.filter(c => c !== 'Все').map((cat, i) => (
                                            <Link
                                                href={`/catalog/${cat.toLowerCase()}`}
                                                key={cat}
                                                onClick={onClose}
                                                className="group w-full py-4 flex items-center justify-between active:scale-95 transition-all duration-300 border-b border-gray-100/50 hover:border-gray-200 hover:pl-2"
                                            >
                                                <span className="text-[24px] font-bold text-black tracking-tight lowercase leading-none">{cat}</span>
                                                <ChevronRight size={20} className="text-gray-300 group-hover:text-black transition-colors" />
                                            </Link>
                                        ))}
                                    </div>
                                </motion.div>

                                {/* Recent Items */}
                                {telegramUserId && recentProducts.length > 0 && (
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        <div className="flex items-center gap-2 mb-5 text-gray-400 text-[12px] font-bold uppercase tracking-widest">
                                            <Clock size={14} />
                                            <span>Вы смотрели</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            {recentProducts.slice(0, 4).map((product: any, idx: number) => (
                                                <motion.div
                                                    key={product.id}
                                                    whileHover={{ y: -5 }}
                                                    className="group cursor-pointer"
                                                >
                                                    <Link href={`/product/${product.id}`} onClick={() => handleProductClick(product.id)}>
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
                                                                className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-90 transition-transform"
                                                            >
                                                                <Heart size={16} className={isFavorite(product.id) ? "fill-red-500 text-red-500" : "text-black hover:text-red-500 hover:fill-red-500 transition-colors"} />
                                                            </button>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <h3 className="text-[15px] font-medium leading-tight text-gray-900 line-clamp-2">{product.name}</h3>
                                                            <p className="text-[17px] font-bold text-black">{product.price}</p>
                                                        </div>
                                                    </Link>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Fallback if no recent items yet for new user */}
                                {telegramUserId && recentProducts.length === 0 && (
                                    <div className="text-center py-10 opacity-50">
                                        <p>История просмотров пока пуста</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
