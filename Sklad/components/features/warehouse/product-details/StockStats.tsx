import { Layers, Package, ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface StockStatsProps {
    stock: number;
    income: number;
    writeOff: number;
    formatNumber: (num: number) => string;
}

export function StockStats({ stock, income, writeOff, formatNumber }: StockStatsProps) {
    return (
        <div className="bg-white rounded-[24px] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Layers size={18} className="text-purple-600" />
                <span className="font-bold text-gray-900">Движение товара</span>
            </div>

            <div className="divide-y divide-gray-50">
                {/* Row 1: Stock Total */}
                <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                            <Package size={16} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Остаток</span>
                    </div>
                    <div className="text-base font-bold text-gray-900">
                        <span key={stock} className="animate-count">{formatNumber(stock)}</span> шт
                    </div>
                </div>

                {/* Row 2: Total Income */}
                <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <ArrowDownLeft size={16} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Приход</span>
                    </div>
                    <div className="text-base font-semibold text-green-600">
                        +<span key={income} className="animate-count">{formatNumber(income)}</span> шт
                    </div>
                </div>

                {/* Row 3: Total Write-off */}
                <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                            <ArrowUpRight size={16} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Списание</span>
                    </div>
                    <div className="text-base font-semibold text-red-600">
                        -<span key={writeOff} className="animate-count">{formatNumber(writeOff)}</span> шт
                    </div>
                </div>
            </div>
        </div>
    );
}
