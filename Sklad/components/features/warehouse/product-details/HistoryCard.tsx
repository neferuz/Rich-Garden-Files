import { useState } from "react";
import { Clock, ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface HistoryCardProps {
    history: any[];
}

export function HistoryCard({ history }: HistoryCardProps) {
    const [showAllHistory, setShowAllHistory] = useState(false);
    const formatNumber = (num: number) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

    return (
        <div className="bg-white rounded-[24px] shadow-sm overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Clock size={18} className="text-blue-600" />
                <span className="font-bold text-gray-900">История операций</span>
            </div>
            {history && history.length > 0 ? (
                <>
                    <div className="divide-y divide-gray-50">
                        {(showAllHistory ? history.slice().reverse() : history.slice().reverse().slice(0, 3)).map((h: any) => (
                            <div key={h.id} className="flex items-center justify-between px-5 py-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${h.action === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                        {h.action === 'income' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-900 block">
                                            {h.action === 'income' ? 'Приход' : 'Списание'}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(h.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                                <div className={`text-sm font-bold ${h.action === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                    {h.action === 'income' ? '+' : '-'}{formatNumber(h.quantity)} шт
                                </div>
                            </div>
                        ))}
                    </div>
                    {history.length > 3 && (
                        <div className="p-2 border-t border-gray-50 flex justify-center">
                            <button
                                onClick={() => setShowAllHistory(!showAllHistory)}
                                className="text-center w-full py-2 text-sm font-bold text-gray-400 active:text-gray-600 transition-colors"
                            >
                                {showAllHistory ? "Скрыть" : "Все"}
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="p-6 text-center text-gray-400 text-sm">
                    История операций пуста
                </div>
            )}
        </div>
    );
}
