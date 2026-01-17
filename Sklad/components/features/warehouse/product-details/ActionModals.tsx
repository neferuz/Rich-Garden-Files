import { AlertTriangle, X } from "lucide-react";

interface ActionModalsProps {
    activeAction: 'income' | 'writeoff' | null;
    setActiveAction: (val: 'income' | 'writeoff' | null) => void;
    actionValue: string;
    setActionValue: (val: string) => void;
    confirmAction: () => void;

    isDeleteConfirmOpen: boolean;
    setIsDeleteConfirmOpen: (val: boolean) => void;
    handleDelete: () => void;

    isUnpublishConfirmOpen: boolean;
    setIsUnpublishConfirmOpen: (val: boolean) => void;
    handleUnpublish: () => void;

    itemUnit: string;
}

export function ActionModals({
    activeAction, setActiveAction, actionValue, setActionValue, confirmAction,
    isDeleteConfirmOpen, setIsDeleteConfirmOpen, handleDelete,
    isUnpublishConfirmOpen, setIsUnpublishConfirmOpen, handleUnpublish,
    itemUnit
}: ActionModalsProps) {
    const formatNumber = (num: number) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

    return (
        <>
            {/* Amount Modal */}
            {activeAction && (
                <div className="absolute inset-0 z-[60] bg-black/20 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200 mb-20 sm:mb-0">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                            {activeAction === 'income' ? 'Приход товара' : 'Списание товара'}
                        </h3>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-500 mb-2 text-center">
                                Количество ({itemUnit})
                            </label>
                            <div className="relative flex items-center justify-center">
                                <input
                                    type="text"
                                    value={actionValue}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/\D/g, '')
                                        setActionValue(raw ? formatNumber(Number(raw)) : "")
                                    }}
                                    className="text-4xl font-bold text-center w-full bg-transparent focus:outline-none placeholder-gray-200"
                                    placeholder="0"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setActiveAction(null)}
                                className="flex-1 h-12 rounded-2xl bg-gray-100 font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={confirmAction}
                                className={`flex-1 h-12 rounded-2xl font-bold text-white shadow-lg active:scale-95 transition-all ${activeAction === 'writeoff' ? 'bg-red-500 shadow-red-500/20' : 'bg-blue-600 shadow-blue-500/20'
                                    }`}
                            >
                                Подтвердить
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Delete Modal */}
            {isDeleteConfirmOpen && (
                <div className="absolute inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-xs rounded-[32px] p-6 shadow-2xl text-center animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Удалить букет?</h3>
                        <p className="text-sm text-gray-500 font-medium mb-6">
                            Это действие нельзя отменить. Товар будет удален из склада навсегда.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsDeleteConfirmOpen(false)}
                                className="flex-1 h-12 rounded-2xl bg-gray-100 font-bold text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 h-12 rounded-2xl bg-red-500 font-bold text-white shadow-lg shadow-red-500/20 hover:bg-red-600 active:scale-95 transition-all"
                            >
                                Удалить
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Unpublish Modal */}
            {isUnpublishConfirmOpen && (
                <div className="absolute inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-xs rounded-[32px] p-6 shadow-2xl text-center animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center mx-auto mb-4">
                            <X size={32} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Снять с витрины?</h3>
                        <p className="text-sm text-gray-500 font-medium mb-6">
                            Букет станет недоступен для покупки в каталоге, но останется на складе.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsUnpublishConfirmOpen(false)}
                                className="flex-1 h-12 rounded-2xl bg-gray-100 font-bold text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleUnpublish}
                                className="flex-1 h-12 rounded-2xl bg-red-500 font-bold text-white shadow-lg shadow-red-500/20 hover:bg-red-600 active:scale-95 transition-all"
                            >
                                Снять
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
