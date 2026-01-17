import { Circle, Package, Truck, CheckCircle2, X } from "lucide-react"

interface OrderHistoryProps {
    history?: { status: string; time: string; active: boolean }[]
}

export function OrderHistory({ history }: OrderHistoryProps) {
    if (!history) return null

    return (
        <div className="bg-white p-5 rounded-[24px] shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">История</h3>
            <div className="space-y-4 pl-2">
                {history.map((h, i) => (
                    <div key={i} className="flex gap-4 relative">
                        {/* Line */}
                        {i !== (history.length || 0) - 1 && (
                            <div className="absolute left-[5px] top-4 w-[2px] h-full bg-gray-100"></div>
                        )}
                        <div className={`mt-1.5 w-2.5 h-2.5 rounded-full z-10 ${h.active ? 'bg-blue-600 ring-2 ring-blue-100' : 'bg-gray-300'}`}></div>
                        <div>
                            <p className={`text-sm font-bold ${h.active ? 'text-gray-900' : 'text-gray-500'}`}>
                                {h.status === 'new' ? 'Ожидает подтверждения' :
                                    h.status === 'processing' ? 'В сборке' :
                                        h.status === 'shipping' ? 'Передан курьеру' :
                                            h.status === 'done' ? 'Завершен' :
                                                h.status === 'cancelled' ? 'Отменен' : h.status}
                            </p>
                            <p className="text-xs text-gray-400 font-medium">{h.time}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
