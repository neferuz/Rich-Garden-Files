"use client"

import { Order, api } from "@/services/api"
import Link from "next/link"
import { ArrowLeft, Clock, MapPin, Phone, CheckCircle2, AlertCircle, Truck, XCircle, ShoppingBag, X, MessageSquare, User, ChevronRight, MoreVertical, Trash2, AlertTriangle, Globe, Store } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { formatPhoneNumber, formatAddress } from "@/lib/utils"

interface OrderDetailsProps {
    order: Order
    isModal?: boolean
    onClose?: () => void
}

export default function OrderDetails({ order, isModal = false, onClose }: OrderDetailsProps) {
    const router = useRouter()
    const [localOrder, setLocalOrder] = useState(order)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [isClosing, setIsClosing] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

    useEffect(() => {
        setLocalOrder(order)
    }, [order])

    const [products, setProducts] = useState<any[]>([])

    useEffect(() => {
        api.getProducts().then(setProducts).catch(console.error)
    }, [])

    // Derived items state (prevents unnecessary setLocalOrder calls)
    const itemsToDisplay = localOrder.items.map(item => {
        if (!item.name || item.name.startsWith('Товар #') || !item.image) {
            const product = products.find(p => p.id === Number(item.id))
            if (product) {
                return {
                    ...item,
                    name: item.name && !item.name.startsWith('Товар #') ? item.name : product.name,
                    image: item.image || product.image
                }
            }
        }
        return item
    })

    useEffect(() => {
        if (isModal) {
            // Не блокируем скролл body, так как модал имеет свой скролл
            // document.body.style.overflow = 'hidden'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isModal])

    const handleClose = () => {
        if (!isModal) return
        setIsClosing(true)
        setTimeout(() => {
            if (onClose) onClose()
        }, 300)
    }

    const handleStatusUpdate = async (newStatus: string) => {
        setIsLoading(true)
        try {
            await api.updateOrderStatus(localOrder.id, newStatus)
            setLocalOrder(prev => ({ ...prev, status: newStatus }))
            router.refresh()
        } catch (e) {
            console.error(e)
            alert("Ошибка при обновлении статуса")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            console.log('Deleting order:', localOrder.id)
            await api.deleteOrder(String(localOrder.id))
            console.log('Order deleted successfully')

            // Close modal first
            setIsDeleteConfirmOpen(false)
            setIsMenuOpen(false)

            // Then redirect and force reload
            if (isModal && onClose) {
                onClose()
            }

            // Force navigation and reload
            router.push('/orders')
            setTimeout(() => {
                window.location.href = '/orders'
            }, 100)
        } catch (e) {
            console.error('Delete error:', e)
            alert(`Ошибка при удалении заказа: ${e instanceof Error ? e.message : 'Неизвестная ошибка'}`)
            setIsDeleting(false)
        }
    }

    // Helpers
    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'new': return { label: 'Новый', color: 'text-blue-600', bg: 'bg-blue-100', icon: AlertCircle }
            case 'pending_payment': return { label: 'Ожидает оплаты', color: 'text-orange-600', bg: 'bg-orange-100', icon: Clock }
            case 'processing': return { label: 'В сборке', color: 'text-amber-600', bg: 'bg-amber-100', icon: Clock }
            case 'shipping': return { label: 'В пути', color: 'text-blue-600', bg: 'bg-blue-100', icon: Truck }
            case 'done': return { label: 'Выполнен', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle2 }
            case 'paid': return { label: 'Оплачен', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CheckCircle2 }
            case 'cancelled': return { label: 'Отменен', color: 'text-red-600', bg: 'bg-red-100', icon: XCircle }
            default: return { label: status, color: 'text-gray-600', bg: 'bg-gray-100', icon: AlertCircle }
        }
    }

    const statusInfo = getStatusInfo(localOrder.status)
    const StatusIcon = statusInfo.icon

    // Layout Classes
    const containerClasses = isModal
        ? `fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end justify-center sm:items-center p-0 sm:p-4 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`
        : "min-h-screen bg-gray-50/50 pb-32 font-sans"

    const contentClasses = isModal
        ? "w-full sm:max-w-md max-h-[90vh] bg-[#F2F3F5] overflow-y-auto overscroll-contain rounded-t-[32px] sm:rounded-[32px] shadow-2xl relative touch-pan-y -webkit-overflow-scrolling-touch"
        : "bg-[#F2F3F5] min-h-screen pb-32"

    const rawPhone = (order.clientPhone === 'Уточнить' || order.clientPhone === 'Не указан' || order.clientPhone === 'Clarify') && order.user?.phone_number
        ? order.user.phone_number
        : order.clientPhone;
    const displayPhone = formatPhoneNumber(rawPhone);

    return (
        <div className={containerClasses} onClick={isModal ? handleClose : undefined}>
            <motion.div
                className={contentClasses}
                onClick={e => e.stopPropagation()}
                initial={isModal ? { y: "100%" } : { y: 0 }}
                animate={isModal ? { y: isClosing ? "100%" : "0%" } : { y: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                drag={false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.2 }}
                onDragEnd={(_, info) => {
                    if (isModal && false) {
                        if (info.offset.y > 150 || info.velocity.y > 500) {
                            handleClose()
                        }
                    }
                }}
            >

                {/* Header */}
                <div className="bg-white/80 backdrop-blur-md px-6 py-4 sticky top-0 z-20 flex items-center justify-between border-b border-gray-100/50">
                    {isModal ? (
                        <button onClick={handleClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors">
                            <X size={20} />
                        </button>
                    ) : (
                        <Link href="/tasks" className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                    )}

                    <div className="flex flex-col items-center">
                        <h1 className="text-lg font-bold text-gray-900 leading-tight">Заказ #{localOrder.id}</h1>
                        <span className="text-xs font-medium text-gray-400">
                            Сегодня • {localOrder.time}
                        </span>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                            <MoreVertical size={20} />
                        </button>

                        {isMenuOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setIsMenuOpen(false)}
                                />
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 overflow-hidden">
                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false)
                                            setIsDeleteConfirmOpen(true)
                                        }}
                                        className="w-full px-4 py-3 flex items-center gap-3 text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                        <span className="font-medium">Удалить</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="p-4 flex flex-col gap-4">

                    {/* Status Card */}
                    <div className="bg-white p-5 rounded-[24px] shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full ${statusInfo.bg} flex items-center justify-center ${statusInfo.color}`}>
                                <StatusIcon size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Статус</p>
                                <p className={`text-lg font-medium ${statusInfo.color}`}>{statusInfo.label}</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-wide">
                                {localOrder.type === 'delivery' ? 'Доставка' : 'Самовывоз'}
                            </div>
                            {localOrder.address ? (
                                <div className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 border border-purple-100">
                                    <Globe size={12} />
                                    Онлайн
                                </div>
                            ) : (
                                <div className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 border border-gray-200">
                                    <Store size={12} />
                                    Офлайн
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Client Card */}
                    <div className="bg-white p-5 rounded-[24px] shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-base font-bold text-gray-900">Клиент</h2>
                            <div className="flex items-center gap-2">
                                <a href={rawPhone ? `tel:${rawPhone.replace(/[^\d+]/g, '')}` : '#'} className="w-9 h-9 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors">
                                    <Phone size={18} />
                                </a>
                            </div>
                        </div>

                        {order.userId ? (
                            <Link href={`/clients/${order.userId}`} className="flex items-center justify-between mb-5 hover:bg-gray-50 -mx-2 px-2 py-2 rounded-xl transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-100">
                                        {order.user?.photo_url ? (
                                            <img src={order.user.photo_url} alt={order.client} className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={24} className="text-gray-400" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">{order.client}</h3>
                                        <p className="text-sm font-medium text-gray-400 mt-1">{displayPhone}</p>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                    <ChevronRight size={18} />
                                </div>
                            </Link>
                        ) : (
                            <div className="flex items-center gap-4 mb-5">
                                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-100">
                                    {order.user?.photo_url ? (
                                        <img src={order.user.photo_url} alt={order.client} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={24} className="text-gray-400" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 leading-tight">{order.client}</h3>
                                    <p className="text-sm font-medium text-gray-400 mt-1">{displayPhone}</p>
                                </div>
                            </div>
                        )}

                        {/* Driver Comment / General Comment */}
                        {order.comment && (
                            <div className="bg-amber-50 p-4 rounded-xl flex gap-3 text-amber-900">
                                <MessageSquare size={18} className="shrink-0 mt-0.5 opacity-60" />
                                <span className="text-sm font-medium leading-snug">
                                    "{order.comment}"
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Delivery Details */}
                    <div className="bg-white p-5 rounded-[24px] shadow-sm">
                        <h2 className="text-base font-bold text-gray-900 mb-5">Детали доставки</h2>

                        <div className="space-y-5">
                            <div className="flex items-start gap-4">
                                <div className="w-9 h-9 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center shrink-0">
                                    <Clock size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Дата и время</p>
                                    <p className="text-sm font-bold text-gray-900 leading-snug">{order.deliveryTime || `${order.date} в ${order.time}`}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-9 h-9 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center shrink-0">
                                    <MapPin size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Адрес</p>
                                    <p className="text-sm font-bold text-gray-900 leading-snug">{formatAddress(order.address)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Details */}
                    {order.paymentMethod && (
                        <div className="bg-white p-5 rounded-[24px] shadow-sm">
                            <h2 className="text-base font-bold text-gray-900 mb-5">Оплата</h2>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                    <CheckCircle2 size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Способ</p>
                                    <p className="text-sm font-bold text-gray-900 capitalize">
                                        {order.paymentMethod === 'click' ? 'Click' :
                                            order.paymentMethod === 'payme' ? 'Payme' :
                                                order.paymentMethod === 'cash' ? 'Наличные' :
                                                    order.paymentMethod === 'card' ? 'Карта' : order.paymentMethod}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Order Content */}
                    <div className="bg-white p-5 rounded-[24px] shadow-sm">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-base font-bold text-gray-900">Состав заказа</h2>
                            <span className="text-xs font-bold text-gray-400">{order.items.length} поз.</span>
                        </div>

                        <div className="space-y-4">
                            {itemsToDisplay.map((item, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 p-1 flex items-center justify-center shrink-0 relative overflow-hidden cursor-pointer active:scale-95 transition-transform"
                                            onClick={() => item.image && setSelectedImage(item.image)}
                                        >
                                            {item.image ? (
                                                <img src={item.image} className="w-full h-full object-cover rounded-xl" alt="" />
                                            ) : (
                                                <ShoppingBag size={20} className="text-gray-300" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 leading-tight mb-1">{item.name}</p>
                                            <p className="text-xs font-medium text-gray-400">{item.price.toLocaleString()} сум/шт</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-900">{(item.price * item.quantity).toLocaleString()} сум</p>
                                        <p className="text-xs font-bold text-gray-400 mt-1">x{item.quantity}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-5 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-base font-bold text-gray-400">Итого</span>
                            <span className="text-xl font-bold text-gray-900">{order.total.toLocaleString()} сум</span>
                        </div>
                    </div>

                    {/* HISTORY */}
                    <div className="bg-white p-5 rounded-[24px] shadow-sm mb-20">
                        <h2 className="text-base font-bold text-gray-900 mb-5">История</h2>
                        <div className="relative pl-3 space-y-6">
                            <div className="absolute left-[5.5px] top-2 bottom-2 w-[1px] bg-gray-200"></div>

                            {/* Render History from Array */}
                            {localOrder.history && localOrder.history.length > 0 ? (
                                localOrder.history.map((record: any, idx: number) => {
                                    const info = getStatusInfo(record.status);
                                    let activeClass = "bg-gray-300";
                                    if (record.status === 'done' || record.status === 'paid') activeClass = "bg-green-500";
                                    else if (record.status === 'new') activeClass = "bg-blue-500";
                                    else if (record.status === 'pending_payment') activeClass = "bg-orange-500";
                                    else activeClass = "bg-blue-500";

                                    return (
                                        <div key={idx} className="relative flex items-center gap-4">
                                            <div className={`w-3 h-3 rounded-full ${activeClass} ring-4 ring-white relative z-10 shrink-0`}></div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 capitalize">
                                                    {info.label || record.status}
                                                </p>
                                                <p className="text-xs font-medium text-gray-400">{record.time}</p>
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                /* Fallback if history is empty */
                                <div className="relative flex items-center gap-4">
                                    <div className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-white relative z-10 shrink-0"></div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">Создан</p>
                                        <p className="text-xs font-medium text-gray-400">{localOrder.time}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sticky Actions Footer */}
                {['new', 'pending_payment', 'paid', 'processing', 'shipping'].includes(localOrder.status) && (
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-30 sm:absolute sm:rounded-b-[32px]">
                        <div className="flex gap-3 max-w-md mx-auto">
                            {(localOrder.status === 'new' || localOrder.status === 'pending_payment' || localOrder.status === 'paid') && (
                                <>
                                    <button
                                        onClick={() => handleStatusUpdate('cancelled')}
                                        disabled={isLoading}
                                        className="flex-1 py-3.5 rounded-xl bg-gray-100 text-gray-900 font-medium text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
                                    >
                                        Отменить
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate('processing')}
                                        disabled={isLoading}
                                        className="flex-1 py-3.5 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        Принять
                                    </button>
                                </>
                            )}
                            {localOrder.status === 'processing' && (
                                <button
                                    onClick={() => handleStatusUpdate('shipping')}
                                    disabled={isLoading}
                                    className="flex-1 py-3.5 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    Отправить в путь
                                </button>
                            )}
                            {localOrder.status === 'shipping' && (
                                <button
                                    onClick={() => handleStatusUpdate('done')}
                                    disabled={isLoading}
                                    className="flex-1 py-3.5 rounded-xl bg-green-600 text-white font-medium text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                                >
                                    Завершить заказ
                                </button>
                            )}
                        </div>
                    </div>
                )}

            </motion.div>

            {/* Image Modal */}
            {
                selectedImage && (
                    <div
                        className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
                        onClick={(e) => {
                            e.stopPropagation()
                            setSelectedImage(null)
                        }}
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setSelectedImage(null)
                            }}
                            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-50"
                        >
                            <X size={24} />
                        </button>
                        <div className="relative w-full max-w-lg aspect-square" onClick={e => e.stopPropagation()}>
                            <img
                                src={selectedImage}
                                alt="Full Screen"
                                className="w-full h-full object-contain rounded-2xl shadow-2xl"
                            />
                        </div>
                    </div>
                )
            }

            {/* Confirm Delete Modal */}
            {isDeleteConfirmOpen && (
                <div className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-xs rounded-[32px] p-6 shadow-2xl text-center animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Удалить заказ?</h3>
                        <p className="text-sm text-gray-500 font-medium mb-6">
                            Вы уверены, что хотите удалить заказ #{localOrder.id}? Это действие нельзя отменить.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsDeleteConfirmOpen(false)}
                                disabled={isDeleting}
                                className="flex-1 h-12 rounded-2xl bg-gray-100 font-bold text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 h-12 rounded-2xl bg-red-500 font-bold text-white shadow-lg shadow-red-500/20 hover:bg-red-600 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isDeleting ? 'Удаление...' : 'Удалить'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    )
}
