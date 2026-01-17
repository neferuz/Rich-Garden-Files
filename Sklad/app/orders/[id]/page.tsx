"use client"

import { useEffect, useState } from "react"
import { api, Order } from "@/services/api"
import Link from "next/link"
import { AlertCircle } from "lucide-react"
import OrderDetails from "@/components/OrderDetails"

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
    const [order, setOrder] = useState<Order | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const data = await api.getOrderById(params.id)
                setOrder(data)
            } catch (err) {
                console.error(err)
                setError("Не удалось загрузить заказ")
            } finally {
                setIsLoading(false)
            }
        }
        fetchOrder()
    }, [params.id])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-black/10 border-t-black rounded-full animate-spin"></div>
                    <p className="text-gray-400 font-medium text-sm">Загрузка заказа...</p>
                </div>
            </div>
        )
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 text-center">
                <div>
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Ошибка</h1>
                    <p className="text-gray-500 mb-6">{error || "Заказ не найден"}</p>
                    <Link href="/tasks" className="px-6 py-3 bg-black text-white rounded-xl font-bold text-sm">
                        Вернуться к задачам
                    </Link>
                </div>
            </div>
        )
    }

    return <OrderDetails order={order} />
}
