import { BarChart3 } from "lucide-react";

interface FinanceCardProps {
    buyPrice: number;
    sellPrice: number;
    setBuyPrice: (val: number) => void;
    setSellPrice: (val: number) => void;
    isEditing: boolean;
    isBouquet: boolean;
}

export function FinanceCard({
    buyPrice, sellPrice, setBuyPrice, setSellPrice, isEditing, isBouquet
}: FinanceCardProps) {
    const formatNumber = (num: number) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

    // Recalculate margin dynamically
    const margin = sellPrice - buyPrice;
    const marginPercent = buyPrice > 0 ? Math.round((margin / buyPrice) * 100) : 0;

    return (
        <div className="bg-white rounded-[24px] shadow-sm overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-600" />
                <span className="font-bold text-gray-900">Финансы</span>
            </div>

            <div className="divide-y divide-gray-50">
                {/* Row 1: Buy Price / Cost Price */}
                <div className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-gray-50">
                    <span className="text-sm text-gray-500">{isBouquet ? 'Себестоимость' : 'Закупка'}</span>
                    <div className="flex items-center gap-1">
                        {isEditing ? (
                            <>
                                <input
                                    type="number"
                                    value={buyPrice}
                                    onChange={(e) => setBuyPrice(Number(e.target.value))}
                                    className="text-base font-semibold text-gray-900 text-right w-24 bg-transparent border-b border-dashed border-gray-300 focus:border-blue-500 focus:outline-none p-0 m-0"
                                />
                                <span className="text-gray-400 text-sm">сум</span>
                            </>
                        ) : (
                            <span className="text-base font-semibold text-gray-900">{formatNumber(buyPrice)} сум</span>
                        )}
                    </div>
                </div>
                {/* Row 2: Sell Price */}
                <div className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-gray-50">
                    <span className="text-sm text-gray-500">Продажа</span>
                    <div className="flex items-center gap-1">
                        {isEditing ? (
                            <>
                                <input
                                    type="number"
                                    value={sellPrice}
                                    onChange={(e) => setSellPrice(Number(e.target.value))}
                                    className="text-base font-semibold text-gray-900 text-right w-24 bg-transparent border-b border-dashed border-gray-300 focus:border-blue-500 focus:outline-none p-0 m-0"
                                />
                                <span className="text-gray-400 text-sm">сум</span>
                            </>
                        ) : (
                            <span className="text-base font-semibold text-gray-900">{formatNumber(sellPrice)} сум</span>
                        )}
                    </div>
                </div>
                {/* Row 3 - Margin */}
                <div className="flex items-center justify-between px-5 py-4 bg-emerald-50/50">
                    <span className="text-sm font-medium text-emerald-700">Маржа</span>
                    <div className="flex items-center gap-2">
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded ml-2">
                            {margin > 0 ? '+' : ''}{marginPercent}%
                        </span>
                        <span className="text-base font-bold text-emerald-700">
                            {margin > 0 ? '+' : ''}{formatNumber(margin)} сум
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
