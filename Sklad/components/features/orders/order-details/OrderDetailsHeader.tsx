import { X } from "lucide-react"
import { Order } from "@/services/api"

interface OrderDetailsHeaderProps {
    order: Order
    handleClose: () => void
}

export function OrderDetailsHeader({ order, handleClose }: OrderDetailsHeaderProps) {
    return (
        <div className="bg-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
            <button
                onClick={handleClose}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white text-gray-500 shadow-sm hover:bg-gray-200 transition-all"
            >
                <X size={20} />
            </button>
            <div className="flex flex-col items-center">
                <span className="text-base font-bold text-gray-900">Заказ #{order.id}</span>
                <span className="text-xs text-gray-400 font-medium">{order.date} • {order.time}</span>
            </div>
            <div className="w-9" />
        </div>
    )
}
