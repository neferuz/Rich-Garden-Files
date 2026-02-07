"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Check, Percent, MessageSquare } from "lucide-react"
import { api, Client, OrderCreate } from "@/services/api"
import { NotificationToast } from "@/components/shared/NotificationToast"
import { motion, AnimatePresence } from "framer-motion"

export default function CheckoutPage() {
    const router = useRouter()
    const [cart, setCart] = useState<{ product: any; quantity: number }[]>([])
    const [client, setClient] = useState<Client | null>(null)
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)

    // Form State
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'payme' | 'click'>('cash')
    const [discountPercent, setDiscountPercent] = useState<string>("") // Now stores percentage (0-100)
    const [comment, setComment] = useState("")

    // Notification State
    const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

    useEffect(() => {
        // Load data from localStorage
        const storedCart = localStorage.getItem('pos_cart')
        const storedClient = localStorage.getItem('pos_selected_client')

        if (storedCart) setCart(JSON.parse(storedCart))
        if (storedClient) setClient(JSON.parse(storedClient))

        setLoading(false)
    }, [])

    const totalAmount = cart.reduce((sum, item) => sum + (item.product.price_raw * item.quantity), 0)

    // Calculate Discount
    const percentValue = Math.min(100, Math.max(0, Number(discountPercent.replace(/\D/g, '')) || 0))
    const discountAmount = Math.round((totalAmount * percentValue) / 100)

    const finalTotal = Math.max(0, totalAmount - discountAmount)

    const handleProcessOrder = async () => {
        if (!client) return

        setProcessing(true)
        try {
            const orderData: OrderCreate = {
                user_id: client.id,
                items: JSON.stringify(cart.map(item => ({
                    id: item.product.id,
                    name: item.product.name,
                    image: item.product.image,
                    quantity: item.quantity,
                    price: item.product.price_raw
                }))),
                total_price: finalTotal,
                status: 'done',
                customer_name: client.first_name,
                customer_phone: client.phone_number || "",
                payment_method: paymentMethod,
                comment: comment,
                extras: JSON.stringify({
                    discount_percent: percentValue,
                    discount_amount: discountAmount
                })
            }

            await api.createOrder(orderData)

            // Success feedback
            setNotification({ msg: "Заказ успешно создан!", type: "success" })

            // Clear cart
            localStorage.removeItem('pos_cart')
            localStorage.removeItem('pos_selected_client')

            // Redirect to client profile after short delay
            setTimeout(() => {
                router.push(`/clients/${client.id}`)
            }, 1000)

        } catch (e: any) {
            console.error(e)
            setNotification({ msg: e.message || "Ошибка при оформлении", type: "error" })
            setTimeout(() => setNotification(null), 3000)
        } finally {
            setProcessing(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F2F1F6]">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
        </div>
    )

    if (!client || cart.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#F2F1F6] p-6 text-center text-gray-500">
                <p className="mb-4 text-lg font-medium">Корзина пуста или клиент не выбран</p>
                <button
                    onClick={() => router.push('/pos')}
                    className="px-8 py-3 bg-black text-white rounded-[20px] font-bold text-[15px] active:scale-95 transition-transform"
                >
                    Вернуться к терминалу
                </button>
            </div>
        )
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08
            }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 20
            }
        }
    }

    const paymentMethods = [
        { id: 'cash', label: 'Наличные' },
        { id: 'card', label: 'Карта' },
        { id: 'click', label: 'Click' },
        { id: 'payme', label: 'Payme' },
    ]

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            className="min-h-screen bg-[#F2F1F6] pb-32"
        >
            <AnimatePresence>
                {notification && <NotificationToast msg={notification.msg} type={notification.type} />}
            </AnimatePresence>

            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-20 px-4 h-14 flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 hover:bg-gray-50 active:scale-95 transition-all text-gray-900"
                >
                    <ChevronLeft size={24} className="relative right-[1px]" />
                </button>
                <div className="absolute left-1/2 -translate-x-1/2 font-bold text-[17px] text-gray-900">
                    Оформление
                </div>
                <div className="w-10" />
            </header>

            <motion.div
                variants={containerVariants}
                className="p-4 space-y-4 max-w-lg mx-auto"
            >
                {/* Client Card */}
                <motion.div variants={itemVariants} className="bg-white rounded-[24px] p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-500 overflow-hidden shrink-0">
                            {client.photo_url ? (
                                <img src={client.photo_url} alt={client.first_name} className="w-full h-full object-cover" />
                            ) : (
                                client.first_name?.[0] || 'U'
                            )}
                        </div>
                        <div>
                            <div className="text-[12px] text-gray-400 font-medium mb-0.5">Клиент</div>
                            <div className="font-bold text-gray-900 text-[17px] leading-tight">{client.first_name}</div>
                        </div>
                    </div>
                </motion.div>

                {/* Payment Method */}
                <motion.div variants={itemVariants}>
                    <h3 className="text-[13px] uppercase tracking-wider font-semibold text-gray-400 ml-4 mb-2">Оплата</h3>
                    <div className="bg-white rounded-[24px] p-1.5 shadow-sm grid grid-cols-2 gap-1.5">
                        {paymentMethods.map((method) => (
                            <button
                                key={method.id}
                                onClick={() => setPaymentMethod(method.id as any)}
                                className={`
                                    h-12 rounded-[18px] text-[15px] font-bold transition-all duration-300 relative overflow-hidden
                                    ${paymentMethod === method.id
                                        ? 'bg-black text-white shadow-md shadow-black/10 scale-[1.02]'
                                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                    }
                                `}
                            >
                                {method.label}
                                {paymentMethod === method.id && (
                                    <motion.div
                                        layoutId="activePaymentIndicator"
                                        className="absolute inset-0 bg-white/10"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Discount & Comment */}
                <motion.div variants={itemVariants} className="space-y-3">
                    {/* Discount Input (Percentage) */}
                    <div className="bg-white rounded-[24px] px-4 h-14 flex items-center shadow-sm transition-all focus-within:ring-2 focus-within:ring-black/5 relative justify-between">
                        <div className="flex items-center gap-3 w-full">
                            <span className="text-gray-400 font-medium">Скидка</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="0"
                                value={discountPercent}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 3)
                                    if (Number(val) <= 100) setDiscountPercent(val)
                                }}
                                className="w-16 h-full font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none bg-transparent text-[18px] text-center"
                            />
                            <Percent size={20} className="text-gray-400" />
                        </div>
                        {discountAmount > 0 && (
                            <div className="text-red-500 font-bold text-sm whitespace-nowrap">
                                -{discountAmount.toLocaleString()} сум
                            </div>
                        )}
                    </div>

                    {/* Comment Input */}
                    <div className="bg-white rounded-[24px] px-4 py-3 shadow-sm transition-all focus-within:ring-2 focus-within:ring-black/5">
                        <div className="flex gap-3">
                            <MessageSquare size={20} className="text-gray-400 mt-1" />
                            <textarea
                                placeholder="Комментарий к заказу..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="flex-1 min-h-[80px] font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none bg-transparent text-[16px] resize-none"
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Summary */}
                <motion.div variants={itemVariants} className="bg-white rounded-[24px] p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between text-[15px]">
                        <span className="text-gray-500">Товары ({cart.reduce((a, b) => a + b.quantity, 0)} шт)</span>
                        <span className="font-semibold text-gray-900">{totalAmount.toLocaleString()} сум</span>
                    </div>
                    {discountAmount > 0 && (
                        <div className="flex items-center justify-between text-[15px] text-red-500">
                            <span>Скидка ({percentValue}%)</span>
                            <span className="font-bold">-{discountAmount.toLocaleString()} сум</span>
                        </div>
                    )}
                    <div className="h-px bg-gray-100 my-1" />
                    <div className="flex items-center justify-between text-lg">
                        <span className="font-bold text-gray-900">Итого</span>
                        <span className="font-bold text-gray-900">{finalTotal.toLocaleString()} сум</span>
                    </div>
                </motion.div>

            </motion.div>

            {/* Floating Action Button area */}
            <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 25, delay: 0.3 }}
                className="fixed bottom-6 left-4 right-4 max-w-lg mx-auto z-30"
            >
                <button
                    onClick={handleProcessOrder}
                    disabled={processing}
                    className="w-full h-14 bg-black text-white rounded-[22px] font-bold text-[17px] shadow-xl shadow-black/20 hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden"
                >
                    {processing ? (
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Создание...</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span>Подтвердить {finalTotal.toLocaleString()}</span>
                            <Check size={20} strokeWidth={2.5} />
                        </div>
                    )}
                </button>
            </motion.div>
        </motion.div>
    )
}
