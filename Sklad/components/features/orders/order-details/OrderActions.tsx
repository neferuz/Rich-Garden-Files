import { Order } from "@/services/api"

interface OrderActionsProps {
    order: Order
    updateStatus: (status: string) => Promise<void>
    handleClose: () => void
    isLoading: boolean
}

export function OrderActions({ order, updateStatus, handleClose, isLoading }: OrderActionsProps) {
    if (order.status === 'done' || order.status === 'cancelled') {
        return (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 pb-8 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <button
                    onClick={handleClose}
                    className="w-full h-12 rounded-[20px] bg-gray-100 text-gray-900 font-bold text-sm hover:bg-gray-200 transition-colors"
                >
                    Закрыть
                </button>
            </div>
        )
    }

    return (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 pb-8 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => {
                        if (confirm('Отменить заказ?')) {
                            updateStatus('cancelled')
                        }
                    }}
                    disabled={isLoading}
                    className="h-12 rounded-[20px] bg-gray-100 text-gray-900 font-bold text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    Отменить
                </button>

                {order.status === 'new' && (
                    <button
                        onClick={() => updateStatus('processing')}
                        disabled={isLoading}
                        className="h-12 rounded-[20px] bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        Принять (В сборку)
                    </button>
                )}

                {order.status === 'processing' && (
                    <button
                        onClick={() => updateStatus('shipping')}
                        disabled={isLoading}
                        className="h-12 rounded-[20px] bg-[#2663eb] text-white font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        Отправить (В путь)
                    </button>
                )}

                {order.status === 'shipping' && (
                    <button
                        onClick={() => updateStatus('done')}
                        disabled={isLoading}
                        className="h-12 rounded-[20px] bg-green-600 text-white font-bold text-sm shadow-lg shadow-green-500/20 hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                        Завершить
                    </button>
                )}
            </div>
        </div>
    )
}
