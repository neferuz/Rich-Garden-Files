import Image from "next/image"
import { Package } from "lucide-react"
import { Order } from "@/services/api"

interface OrderItemsListProps {
    order: Order
}

export function OrderItemsList({ order }: OrderItemsListProps) {
    return (
        <div className="bg-white p-5 rounded-[24px] shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
                <h3 className="font-bold text-gray-900">Состав заказа</h3>
                <span className="text-sm font-bold text-gray-500">{order.items.length} поз.</span>
            </div>
            <div className="space-y-4">
                {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0 relative">
                            {item.image ? (
                                <Image src={item.image} alt={item.name} fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <Package size={20} />
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900 leading-tight">{item.name}</p>
                            <p className="text-xs text-gray-500 font-medium">{item.price.toLocaleString('ru-RU')} сум/шт</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">{(item.price * item.quantity).toLocaleString('ru-RU')} сум</p>
                            <p className="text-xs text-gray-500 font-medium">x{item.quantity}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="font-bold text-gray-500">Итого</span>
                <span className="font-extrabold text-xl text-gray-900">{order.total.toLocaleString('ru-RU')} сум</span>
            </div>
        </div>
    )
}
