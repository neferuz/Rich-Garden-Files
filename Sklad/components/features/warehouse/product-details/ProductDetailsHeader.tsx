import { X, MoreVertical, Edit, Check, Trash2 } from "lucide-react";

interface ProductDetailsHeaderProps {
    handleClose: () => void;
    isMenuOpen: boolean;
    setIsMenuOpen: (val: boolean) => void;
    isEditing: boolean;
    setIsEditing: (val: boolean) => void;
    handleSave: () => void;
    setIsDeleteConfirmOpen: (val: boolean) => void;
    isBouquet: boolean;
}

export function ProductDetailsHeader({
    handleClose, isMenuOpen, setIsMenuOpen, isEditing, setIsEditing, handleSave, setIsDeleteConfirmOpen, isBouquet
}: ProductDetailsHeaderProps) {
    return (
        <div className="bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-gray-200/50 sticky top-0 z-30">
            <button onClick={handleClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all">
                <X size={20} />
            </button>
            <span className="text-base font-semibold text-gray-900">Карточка товара</span>
            <div className="relative">
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all"
                >
                    <MoreVertical size={20} />
                </button>

                {isMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-[50]" onClick={(e) => {
                            e.stopPropagation();
                            setIsMenuOpen(false);
                        }} />
                        <div className="absolute top-10 right-0 z-[60] w-52 bg-white rounded-[24px] shadow-xl border border-gray-100 p-2 animate-in fade-in slide-in-from-top-4 zoom-in-95 duration-200 origin-top-right">
                            <div className="flex flex-col gap-1">
                                {/* Edit Button - Only for Non-Bouquets */}
                                {!isBouquet && !isEditing && (
                                    <button
                                        onClick={() => {
                                            setIsEditing(true);
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 transition-all active:scale-[0.98] group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                                            <Edit size={16} className="text-gray-500" />
                                        </div>
                                        <span className="font-bold text-sm">Редактировать</span>
                                    </button>
                                )}

                                {/* Save/Cancel Buttons */}
                                {isEditing && (
                                    <>
                                        <button
                                            onClick={() => {
                                                handleSave();
                                                setIsMenuOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-blue-600 hover:bg-blue-50 transition-all active:scale-[0.98] group"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                                <Check size={16} />
                                            </div>
                                            <span className="font-bold text-sm">Сохранить</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsEditing(false);
                                                setIsMenuOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-gray-50 transition-all active:scale-[0.98] group"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                                                <X size={16} />
                                            </div>
                                            <span className="font-bold text-sm">Отмена</span>
                                        </button>
                                    </>
                                )}

                                {/* Delete Button - All */}
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        setIsDeleteConfirmOpen(true);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-all active:scale-[0.98] group border-t border-gray-50 mt-1 pt-2"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                                        <Trash2 size={16} />
                                    </div>
                                    <span className="font-bold text-sm">Удалить товар</span>
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
