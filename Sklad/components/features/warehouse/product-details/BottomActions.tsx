import { Minus, Plus, Check, Store } from "lucide-react";

interface BottomActionsProps {
    isBouquet: boolean;
    stock: number;
    setActiveAction: (val: 'income' | 'writeoff' | null) => void;
    setActionValue: (val: string) => void;
    setIsUnpublishConfirmOpen: (val: boolean) => void;
    handlePublish: () => void;
}

export function BottomActions({
    isBouquet, stock, setActiveAction, setActionValue, setIsUnpublishConfirmOpen, handlePublish
}: BottomActionsProps) {
    return (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 flex gap-3 pb-8 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            {!isBouquet ? (
                <>
                    <button onClick={() => { setActiveAction('writeoff'); setActionValue("") }} className="flex-1 h-14 bg-white border-2 border-gray-100 text-gray-900 rounded-[24px] font-bold text-base flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-[0.98] transition-all shadow-sm">
                        <Minus size={20} strokeWidth={2.5} />
                        Списание
                    </button>
                    <button onClick={() => { setActiveAction('income'); setActionValue("") }} className="flex-1 h-14 bg-[#2663eb] text-white rounded-[24px] font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:bg-blue-600 active:scale-[0.98] transition-all">
                        <Plus size={20} strokeWidth={2.5} />
                        Приход
                    </button>
                </>
            ) : (
                stock > 0 ? (
                    <button
                        onClick={() => setIsUnpublishConfirmOpen(true)}
                        className="w-full h-14 bg-green-50 text-green-600 rounded-[24px] font-bold text-base flex items-center justify-center gap-2 border border-green-100 active:bg-red-50 active:text-red-600 active:border-red-100 transition-colors"
                    >
                        <Check size={20} strokeWidth={2.5} />
                        Активен (Нажмите чтобы снять)
                    </button>
                ) : (
                    <button onClick={handlePublish} className="w-full h-14 bg-[#2663eb] text-white rounded-[24px] font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:bg-blue-600 active:scale-[0.98] transition-all">
                        <Store size={20} strokeWidth={2.5} />
                        Выставить на витрину
                    </button>
                )
            )}
        </div>
    );
}
