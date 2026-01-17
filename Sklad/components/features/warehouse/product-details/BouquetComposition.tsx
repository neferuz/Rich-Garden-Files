import { useState, useEffect } from "react";
import Image from "next/image";
import { Sprout } from "lucide-react";
import { api } from "@/services/api";

interface BouquetCompositionProps {
    item: any;
    formatNumber: (num: number) => string;
}

export function BouquetComposition({ item, formatNumber }: BouquetCompositionProps) {
    const [ingredientsImages, setIngredientsImages] = useState<Record<string, string>>({});

    useEffect(() => {
        const loadImages = async () => {
            // In a real app, maybe pass all products or fetch specifically. 
            // Keeping original logic: fetch all products to get images.
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
    }, []);

    return (
        <div className="bg-white rounded-[24px] shadow-sm overflow-hidden p-5 border border-gray-100">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-50">
                <Sprout size={20} className="text-purple-600" />
                <h3 className="font-bold text-gray-900 text-lg">Состав букета</h3>
            </div>
            <div className="space-y-3">
                {(() => {
                    try {
                        const comp = typeof item.composition === 'string' ? JSON.parse(item.composition) : (item.composition || [])
                        if (!Array.isArray(comp) || comp.length === 0) return <div className="text-gray-400 text-sm">Нет данных о составе</div>
                        return comp.map((c: any, idx: number) => {
                            const imgUrl = ingredientsImages[c.id] || c.image
                            const finalImg = imgUrl ? (imgUrl.startsWith("http") ? imgUrl : `http://localhost:8000${imgUrl.startsWith("/") ? "" : "/"}${imgUrl}`) : null

                            return (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0 overflow-hidden relative border border-gray-100">
                                            {finalImg ? (
                                                <Image src={finalImg} alt={c.name} fill className="object-cover" />
                                            ) : (
                                                <div className="text-xs font-bold">{idx + 1}</div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 text-sm leading-tight">{c.name}</div>
                                            {c.price && <div className="text-[11px] font-medium text-gray-400 mt-0.5">{formatNumber(c.price)} сум/шт</div>}
                                        </div>
                                    </div>
                                    <div className="px-3 py-1 bg-white rounded-xl shadow-sm border border-gray-100 font-bold text-gray-900 text-sm">
                                        {c.qty} шт
                                    </div>
                                </div>
                            )
                        })
                    } catch (e) {
                        return <div className="text-red-400 text-sm">Ошибка отображения состава</div>
                    }
                })()}
            </div>
        </div>
    );
}
