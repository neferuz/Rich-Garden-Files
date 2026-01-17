import { Phone, User, ExternalLink, MessageSquare, MapPin, Clock } from "lucide-react"
import Link from "next/link"
import { Order } from "@/services/api"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface OrderUserInfoProps {
    order: Order
}

export function OrderUserInfo({ order }: OrderUserInfoProps) {
    return (
        <div className="space-y-4">
            {/* Client Card */}
            <div className="bg-white p-5 rounded-[24px] shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <span className="font-bold text-gray-900">Клиент</span>
                    <div className="flex gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors">
                                    <Phone size={16} />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-3 rounded-2xl shadow-xl border-gray-100 animate-in fade-in zoom-in duration-200 z-[9999]">
                                <a
                                    href={`tel:${order.clientPhone}`}
                                    className="text-base font-bold text-gray-900 hover:text-green-600 transition-colors flex items-center gap-2 no-underline px-1"
                                >
                                    <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                                        <Phone size={14} />
                                    </div>
                                    {order.clientPhone}
                                    <span className="text-[10px] bg-black text-white px-2 py-1 rounded-full font-bold ml-2">ПОЗВОНИТЬ</span>
                                </a>
                            </PopoverContent>
                        </Popover>
                        {order.userId && (
                            <Link
                                href={`/clients/${order.userId}`}
                                className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                            >
                                <ExternalLink size={16} />
                            </Link>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                        <User size={24} className="text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <Popover>
                            <PopoverTrigger asChild>
                                <div className="cursor-pointer hover:bg-gray-50 -m-1 p-1 rounded-xl transition-colors active:scale-95">
                                    {order.userId ? (
                                        <div className="block">
                                            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-1">
                                                {order.client}
                                                {order.user?.username && (
                                                    <span className="text-sm font-medium text-gray-400 ml-1">@{order.user.username}</span>
                                                )}
                                            </h3>
                                            <div className="flex flex-col gap-0.5">
                                                <p className="text-sm text-gray-500 font-medium">{order.clientPhone}</p>
                                                {order.user?.telegram_id && (
                                                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">TG ID: {order.user.telegram_id}</p>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <h3 className="font-bold text-gray-900 text-lg">{order.client}</h3>
                                            <p className="text-sm text-gray-500 font-medium">{order.clientPhone}</p>
                                        </>
                                    )}
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-3 rounded-2xl shadow-xl border-gray-100 animate-in fade-in zoom-in duration-200 z-[9999]">
                                <a
                                    href={`tel:${order.clientPhone}`}
                                    className="text-base font-bold text-gray-900 hover:text-green-600 transition-colors flex items-center gap-2 no-underline px-1"
                                >
                                    <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                                        <Phone size={14} />
                                    </div>
                                    {order.clientPhone}
                                    <span className="text-xs bg-black text-white px-2 py-1 rounded-full font-bold ml-2">ПОЗВОНИТЬ</span>
                                </a>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                {order.comment && order.comment.trim() !== '' && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded-xl flex items-start gap-3">
                        <MessageSquare size={16} className="text-yellow-600 mt-0.5 shrink-0" />
                        <p className="text-sm text-yellow-800 font-medium leading-snug">&quot;{order.comment}&quot;</p>
                    </div>
                )}
            </div>

            {/* Delivery Info */}
            <div className="bg-white p-5 rounded-[24px] shadow-sm space-y-4">
                <h3 className="font-bold text-gray-900">Детали доставки</h3>

                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                        <Clock size={16} className="text-gray-500" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-400 uppercase">Время</p>
                        <p className="text-sm font-semibold text-gray-900">{order.date}, {order.time}</p>
                    </div>
                </div>

                {order.address && (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                            <MapPin size={16} className="text-gray-500" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-400 uppercase">Адрес</p>
                            <p className="text-sm font-semibold text-gray-900 leading-snug">{order.address}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
