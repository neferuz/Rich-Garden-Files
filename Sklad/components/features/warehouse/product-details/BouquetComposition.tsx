import { useState, useEffect } from "react";
import Image from "next/image";
import { Sprout, Plus, Minus, Trash2, Search, X, Check } from "lucide-react";
import { api } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

interface BouquetCompositionProps {
    item: any;
    formatNumber: (num: number) => string;
    // New props for editing
    isEditing?: boolean;
    composition?: any[];
    availableProducts?: any[];
    addToComposition?: (product: any) => void;
    removeFromComposition?: (id: number) => void;
    updateCompositionQuantity?: (id: number, delta: number) => void;
}

export function BouquetComposition({
    item,
    formatNumber,
    isEditing,
    composition = [],
    availableProducts = [],
    addToComposition,
    removeFromComposition,
    updateCompositionQuantity
}: BouquetCompositionProps) {
    const [ingredientsImages, setIngredientsImages] = useState<Record<string, string>>({});
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isAddMode, setIsAddMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Fallback to item.composition if composition prop is empty/undefined
    const displayComposition = composition.length > 0 || isEditing ? composition : (() => {
        try {
            return typeof item.composition === 'string' ? JSON.parse(item.composition) : (item.composition || []);
        } catch { return []; }
    })();

    useEffect(() => {
        if (availableProducts.length > 0) {
            const map: Record<string, string> = {};
            availableProducts.forEach((p: any) => { map[p.id] = p.image });
            setIngredientsImages(map);
        } else {
            const loadImages = async () => {
                try {
                    const allProducts = await api.getProducts();
                    const map: Record<string, string> = {};
                    allProducts.forEach((p: any) => { map[p.id] = p.image });
                    setIngredientsImages(map);
                } catch (e) {
                    console.error("Failed to load ingredient images", e);
                }
            };
            loadImages();
        }
    }, [availableProducts]);

    const filteredProducts = availableProducts.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-white rounded-[24px] shadow-sm overflow-hidden p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-50">
                <div className="flex items-center gap-2">
                    <Sprout size={20} className="text-[#2e6fef]" />
                    <h3 className="font-bold text-gray-900 text-lg">Состав букета</h3>
                </div>
                {isEditing && (
                    <button
                        onClick={() => setIsAddMode(true)}
                        className="w-8 h-8 rounded-full bg-[#2e6fef]/10 text-[#2e6fef] flex items-center justify-center hover:bg-[#2e6fef]/20 transition-colors"
                    >
                        <Plus size={18} />
                    </button>
                )}
            </div>

            <div className="space-y-3">
                {displayComposition.length === 0 && !isAddMode && (
                    <div className="text-gray-400 text-sm">Нет данных о составе</div>
                )}

                {displayComposition.map((c: any, idx: number) => {
                    const imgUrl = ingredientsImages[c.id] || c.image;
                    const finalImg = imgUrl ? (imgUrl.startsWith("http") ? imgUrl : `http://localhost:8000${imgUrl.startsWith("/") ? "" : "/"}${imgUrl}`) : null;

                    return (
                        <div key={c.id || idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100 group">
                            <div className="flex items-center gap-3">
                                <div
                                    onClick={() => finalImg && setPreviewImage(finalImg)}
                                    className={`w-12 h-12 rounded-xl bg-[#2e6fef]/10 flex items-center justify-center text-[#2e6fef] shrink-0 overflow-hidden relative border border-gray-100 ${finalImg ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
                                >
                                    {finalImg ? (
                                        <Image src={finalImg} alt={c.name} fill className="object-cover" />
                                    ) : (
                                        <div className="text-xs font-bold">{idx + 1}</div>
                                    )}
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900 text-sm leading-tight max-w-[120px] truncate">{c.name}</div>
                                    {c.price && <div className="text-[11px] font-medium text-gray-400 mt-0.5">{formatNumber(c.price)} сум/шт</div>}
                                </div>
                            </div>

                            {isEditing ? (
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-100">
                                        <button
                                            onClick={() => updateCompositionQuantity && updateCompositionQuantity(c.id, -1)}
                                            className="w-6 h-6 rounded-md bg-gray-50 text-gray-500 flex items-center justify-center hover:bg-gray-100"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="text-sm font-bold w-4 text-center">{c.qty}</span>
                                        <button
                                            onClick={() => updateCompositionQuantity && updateCompositionQuantity(c.id, 1)}
                                            className="w-6 h-6 rounded-md bg-gray-50 text-gray-500 flex items-center justify-center hover:bg-gray-100"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => removeFromComposition && removeFromComposition(c.id)}
                                        className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div className="px-3 py-1 bg-white rounded-xl shadow-sm border border-gray-100 font-bold text-gray-900 text-sm">
                                    {c.qty} шт
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Add Item Bottom Sheet */}
            {mounted && createPortal(
                <AnimatePresence>
                    {isAddMode && (
                        <div className="fixed inset-0 z-[250] flex flex-col justify-end">
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                onClick={() => setIsAddMode(false)}
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
                                        setIsAddMode(false);
                                    }
                                }}
                                className="bg-gray-50 rounded-t-[32px] w-full max-h-[85vh] flex flex-col relative z-10 shadow-2xl overflow-hidden"
                                onClick={e => e.stopPropagation()}
                            >
                                {/* Drag Handle */}
                                <div className="w-full flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
                                    <div className="w-12 h-1.5 rounded-full bg-gray-300/50" />
                                </div>

                                {/* Header */}
                                <div className="px-6 pb-4 bg-gray-50 rounded-t-[32px]">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-xl text-gray-900">Выбрать цветок</h3>
                                        <button onClick={() => setIsAddMode(false)} className="w-10 h-10 flex items-center justify-center bg-white rounded-full text-gray-500 hover:bg-gray-100 transition-colors shadow-sm">
                                            <X size={22} />
                                        </button>
                                    </div>

                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="text"
                                            placeholder="Поиск цветов и упаковки..."
                                            className="w-full h-14 bg-white rounded-[20px] pl-12 pr-4 font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2e6fef]/20 border-transparent transition-all shadow-sm"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                {/* List */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-white rounded-t-[32px] border-t border-gray-100 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)] relative z-20 pb-32">
                                    {filteredProducts.map(p => {
                                        const isSelected = displayComposition.some((c: any) => c.id === p.id);
                                        return (
                                            <button
                                                key={p.id}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        removeFromComposition && removeFromComposition(p.id);
                                                    } else {
                                                        addToComposition && addToComposition(p);
                                                    }
                                                }}
                                                className={`w-full flex items-center gap-4 p-3 rounded-[24px] border shadow-sm active:scale-[0.98] transition-all group text-left ${isSelected
                                                    ? "bg-[#2e6fef]/5 border-[#2e6fef]/30"
                                                    : "bg-white border-gray-100 hover:border-[#2e6fef]/30"
                                                    }`}
                                            >
                                                <div className="w-14 h-14 rounded-[18px] bg-gray-100 relative overflow-hidden shrink-0 border border-gray-50">
                                                    {p.image ? (
                                                        <Image
                                                            src={p.image.startsWith("/static") ? `http://localhost:8000${p.image}` : p.image}
                                                            alt={p.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-400 uppercase">Фото</div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-gray-900 text-[15px] truncate mb-0.5">{p.name}</div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium text-gray-400 px-2 py-0.5 rounded-lg bg-gray-50 border border-gray-100">
                                                            {(p.category === 'flowers' || p.category === 'Цветы') ? 'Цветы' :
                                                                (p.category === 'packaging' || p.category === 'Упаковка') ? 'Упаковка' : 'Товар'}
                                                        </span>
                                                        <span className="text-sm font-bold text-[#2e6fef]">{formatNumber(p.price_raw || 0)} сум</span>
                                                    </div>
                                                </div>
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isSelected
                                                    ? "bg-[#2e6fef] text-white shadow-md shadow-[#2e6fef]/20"
                                                    : "bg-[#2e6fef]/10 text-[#2e6fef] group-hover:bg-[#2e6fef] group-hover:text-white"
                                                    }`}>
                                                    {isSelected ? <Check size={20} /> : <Plus size={20} />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                    {filteredProducts.length === 0 && (
                                        <div className="text-center py-10 text-gray-400">
                                            Ничего не найдено
                                        </div>
                                    )}
                                    <div className="h-10" />
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Image Preview Portal */}
            {mounted && createPortal(
                <AnimatePresence>
                    {previewImage && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
                            onClick={() => setPreviewImage(null)}
                        >
                            <button
                                onClick={() => setPreviewImage(null)}
                                className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-50"
                            >
                                <X size={24} />
                            </button>
                            <div className="relative w-full max-w-4xl h-full max-h-[80vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="relative w-full h-full"
                                >
                                    <Image
                                        src={previewImage}
                                        alt="Preview"
                                        fill
                                        className="object-contain rounded-2xl drop-shadow-2xl"
                                    />
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
