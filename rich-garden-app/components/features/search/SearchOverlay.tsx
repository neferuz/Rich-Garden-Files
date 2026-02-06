import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Clock, LayoutGrid, ChevronRight } from 'lucide-react';
import Link from "next/link";
import { api } from '@/lib/api';
import { useFavorites } from '@/context/FavoritesContext';
import { toast } from 'sonner';
import { useProducts } from '@/hooks/useProducts';
import { ProductCard, type ProductCardProduct } from '@/components/features/catalog/ProductCard';

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
                        image: p.image.startsWith('http') ? p.image : `${p.image}`,
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
                                className="w-full bg-transparent outline-none text-[20px] font-bold text-black placeholder:text-gray-300 pl-12"
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
                                        {filteredProducts.map((product) => {
                                            const p: ProductCardProduct = {
                                                id: product.id,
                                                name: product.name,
                                                price: product.price,
                                                image: product.image?.startsWith('http') ? product.image : `${product.image}`,
                                                isHit: product.isHit,
                                                isNew: product.isNew,
                                            };
                                            return (
                                                <motion.div key={product.id} whileHover={{ y: -4 }} className="rounded-[20px]">
                                                    <ProductCard
                                                        product={p}
                                                        variant="grid"
                                                        isFavorite={isFavorite(product.id)}
                                                        showFavorite
                                                        showCart={false}
                                                        onCardClick={() => handleProductClick(product.id as number)}
                                                        onFavoriteClick={() => {
                                                            toggleFavorite({ id: product.id, name: product.name, price: product.price, image: product.image });
                                                            toast.dismiss();
                                                            toast.success(isFavorite(product.id) ? "Удалено из избранного" : "Добавлено в избранное", {
                                                                description: product.name,
                                                                duration: 2000,
                                                            });
                                                        }}
                                                    />
                                                </motion.div>
                                            );
                                        })}
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
                                            {recentProducts.slice(0, 4).map((product: any) => {
                                                const p: ProductCardProduct = {
                                                    id: product.id,
                                                    name: product.name,
                                                    price: product.price,
                                                    image: product.image,
                                                    isHit: product.isHit,
                                                    isNew: product.isNew,
                                                };
                                                return (
                                                    <motion.div key={product.id} whileHover={{ y: -4 }} className="rounded-[20px]">
                                                        <ProductCard
                                                            product={p}
                                                            variant="grid"
                                                            isFavorite={isFavorite(product.id)}
                                                            showFavorite
                                                            showCart={false}
                                                            onCardClick={() => handleProductClick(product.id)}
                                                            onFavoriteClick={() => {
                                                                toggleFavorite({ id: product.id, name: product.name, price: product.price, image: product.image });
                                                                toast.dismiss();
                                                                toast.success(isFavorite(product.id) ? "Удалено из избранного" : "Добавлено в избранное", {
                                                                    description: product.name,
                                                                    duration: 2000,
                                                                });
                                                            }}
                                                        />
                                                    </motion.div>
                                                );
                                            })}
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
