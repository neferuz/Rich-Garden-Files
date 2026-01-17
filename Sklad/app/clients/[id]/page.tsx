"use client"

import { useState, useEffect, Suspense } from "react"
import {
    ChevronLeft, Phone, MessageCircle, MapPin, Clock, MoreHorizontal,
    ShoppingBag, FolderClock, Send, X, Calendar as CalendarIcon,
    Cake, User as UserIcon, Search, Trash2, AlertTriangle, Gift, ChevronRight
} from "lucide-react"
import Link from "next/link"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { api, Order, CalendarEvent, FamilyMember as FamilyMemberType } from "@/services/api"
import OrderDetails from "@/components/OrderDetails"

type Address = {
    id: number;
    title: string;
    address: string;
    info?: string;
}

type Client = {
    id: number;
    telegram_id: number;
    first_name: string;
    username?: string;
    photo_url?: string;
    phone_number?: string;
    created_at: string;
    addresses: Address[];
}

function SendMessageModal({ client, isOpen, onClose }: { client: Client, isOpen: boolean, onClose: () => void }) {
    const [message, setMessage] = useState("")
    if (!isOpen) return null
    return (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-6 outline-none">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative z-10 animate-in fade-in zoom-in duration-300">
                <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-black transition-colors">
                    <X size={18} />
                </button>
                <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                        <MessageCircle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Написать клиенту</h3>
                    <p className="text-sm text-gray-400 font-medium">{client.first_name}</p>
                </div>
                <div className="space-y-4">
                    <div className="bg-gray-50 rounded-[20px] p-4 border-2 border-transparent focus-within:border-blue-100 focus-within:bg-white transition-all duration-300">
                        <textarea
                            rows={4}
                            placeholder="Введите сообщение..."
                            className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-gray-900 placeholder:text-gray-400 text-[15px] resize-none p-0 block"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>
                    <button
                        disabled={!message.trim()}
                        className="w-full h-14 rounded-2xl bg-black text-white font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-xl shadow-black/10"
                    >
                        <Send size={18} />
                        <span>Отправить</span>
                    </button>
                    <button onClick={onClose} className="w-full h-12 rounded-2xl bg-gray-50 text-gray-500 font-medium hover:bg-gray-100 transition-colors">
                        Отмена
                    </button>
                </div>
            </div>
        </div>
    )
}

function ConfirmDeleteModal({ isOpen, onClose, onConfirm, isDeleting, clientName }: {
    isOpen: boolean, onClose: () => void, onConfirm: () => void, isDeleting: boolean, clientName: string
}) {
    if (!isOpen) return null
    return (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-6 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}
            />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative z-10 text-center"
            >
                <div className="w-20 h-20 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle size={40} strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Вы уверены?</h3>
                <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                    Вы собираетесь удалить клиента <span className="text-gray-900 font-bold">{clientName}</span>. Это действие необратимо.
                </p>
                <div className="flex flex-row gap-3">
                    <button onClick={onConfirm} disabled={isDeleting}
                        className="flex-1 h-14 rounded-2xl bg-red-600 text-white font-medium flex items-center justify-center gap-2 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-xl shadow-red-200"
                    >
                        {isDeleting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 size={20} />}
                        <span>Удалить</span>
                    </button>
                    <button onClick={onClose} disabled={isDeleting}
                        className="flex-1 h-14 rounded-2xl bg-gray-50 text-gray-500 font-medium hover:bg-gray-100 transition-colors active:scale-95 disabled:opacity-30"
                    >
                        Отмена
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

function EventDetailModal({ item, onClose }: {
    item: { type: 'birthday' | 'event', data: any } | null,
    onClose: () => void
}) {
    if (!item) return null;

    const getDaysLeft = (targetDate: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(targetDate);
        target.setFullYear(today.getFullYear());
        if (target < today) target.setFullYear(today.getFullYear() + 1);
        const diff = target.getTime() - today.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const targetDate = item.type === 'birthday' ? item.data.birthday : item.data.date;
    const daysLeft = getDaysLeft(targetDate);
    const dateStr = new Date(targetDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

    return (
        <div className="fixed inset-0 z-[220] flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}
            />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="relative w-full max-w-md bg-white rounded-t-[40px] p-6 pb-12 shadow-2xl"
            >
                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-8" />
                <div className="flex items-center gap-5 mb-8 px-2">
                    <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center shadow-sm ${item.type === 'birthday' ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-600"}`}>
                        {item.type === 'birthday' ? <Cake size={28} strokeWidth={1.5} /> : <CalendarIcon size={28} strokeWidth={1.5} />}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 leading-tight">{item.data.title || item.data.name}</h2>
                        <p className="text-sm font-medium text-gray-400 mt-1">{item.type === 'birthday' ? (item.data.relation || 'День рождения') : 'Личное событие'}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-[#F8F9FB] p-4 rounded-[20px] border border-gray-100/50 text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Когда</p>
                        <p className="text-[15px] font-bold text-gray-900">{dateStr}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-[20px] border border-blue-100/30 text-center">
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wide mb-1">Осталось</p>
                        <p className="text-[15px] font-bold text-blue-600">{daysLeft} дней</p>
                    </div>
                </div>
                <div className="bg-gray-50/50 rounded-[28px] p-4 mb-8 border border-gray-100/50 space-y-4">
                    {item.data.user && (
                        <Link
                            href={`/clients/${item.data.user.id}`}
                            className="flex items-center justify-between group active:scale-[0.98] transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 shadow-sm overflow-hidden relative">
                                    {item.data.user.photo_url ? (
                                        <img
                                            src={item.data.user.photo_url}
                                            alt={item.data.user.first_name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                (e.target as HTMLImageElement).parentElement!.classList.add('bg-gray-100');
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400 font-bold text-lg">
                                            {item.data.user.first_name[0]}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight leading-none mb-1">Добавил</p>
                                    <p className="text-[15px] font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">{item.data.user.first_name}</p>
                                    {item.data.user.phone_number && (
                                        <p className="text-[11px] font-medium text-gray-400 mt-1">{item.data.user.phone_number}</p>
                                    )}
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                <ChevronRight size={16} />
                            </div>
                        </Link>
                    )}
                    {item.data.created_at && (
                        <div className="flex items-center gap-3 pt-4 border-t border-gray-100/50">
                            <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 shadow-sm">
                                <CalendarIcon size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight leading-none mb-1">Создано</p>
                                <p className="text-[15px] font-bold text-gray-900">
                                    {new Date(item.data.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="w-full h-14 bg-[hsl(218.73deg,88.73%,58.24%)] text-white rounded-[22px] font-medium text-[15px] shadow-lg shadow-[hsla(218.73deg,88.73%,58.24%,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    Понятно
                </button>
            </motion.div>
        </div>
    );
}

function ClientDetailsContent({ params }: { params: { id: string } }) {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const orderId = searchParams.get('order')

    const [client, setClient] = useState<Client | null>(null)
    const [orders, setOrders] = useState<Order[]>([])
    const [userEvents, setUserEvents] = useState<CalendarEvent[]>([])
    const [userBirthdays, setUserBirthdays] = useState<FamilyMemberType[]>([])
    const [orderSearch, setOrderSearch] = useState("")
    const [loading, setLoading] = useState(true)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false)
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [selectedDetailItem, setSelectedDetailItem] = useState<{ type: 'birthday' | 'event', data: any } | null>(null)

    const handleDeleteClient = async () => {
        if (!client) return
        setIsDeleting(true)
        try {
            await api.deleteClient(client.id)
            router.push('/clients')
        } catch (e) {
            console.error(e)
            alert('Ошибка при удалении клиента')
            setIsDeleting(false)
            setIsConfirmModalOpen(false)
        }
    }

    const filteredOrders = orders.filter(order => {
        const q = orderSearch.toLowerCase();
        return order.id.toLowerCase().includes(q) || order.items.some(i => i.name.toLowerCase().includes(q));
    });

    useEffect(() => {
        const clientId = parseInt(params.id)
        fetch('http://localhost:8000/api/clients')
            .then(res => res.json())
            .then(async (data: Client[]) => {
                const found = data.find(c => c.id === clientId)
                if (found) {
                    setClient(found)
                    try {
                        const [ordersData, calendarData] = await Promise.all([
                            api.getOrdersByUserId(found.telegram_id),
                            api.getAllCalendarData()
                        ])
                        setOrders(ordersData)
                        setUserEvents(calendarData.events.filter(e => e.user_id === clientId))
                        setUserBirthdays(calendarData.family.filter(f => f.user_id === clientId))
                    } catch (e) {
                        console.error("Error fetching related data:", e)
                    }
                }
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [params.id])

    const selectedOrder = orderId ? orders.find(o => o.id.toString() === orderId) : null

    if (loading) return <div className="p-6 text-center text-gray-500 font-medium">Загрузка...</div>
    if (!client) return <div className="p-6 text-center text-gray-500 font-medium">Клиент не найден</div>

    const mainAddress = client.addresses && client.addresses.length > 0
        ? `${client.addresses[0].title}: ${client.addresses[0].address}` : "Нет адреса"

    return (
        <div className="min-h-screen bg-gray-50/50 pb-32 uppercase-none">
            {/* Header */}
            <div className="px-6 pt-6 flex items-center justify-between mb-8 relative">
                <Link href="/clients" className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-100 text-gray-500 hover:text-black hover:bg-gray-50 transition-colors shadow-sm">
                    <ChevronLeft size={22} />
                </Link>
                <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Профиль клиента</div>
                <div className="relative">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`w-10 h-10 flex items-center justify-center rounded-full transition-all shadow-sm border ${isMenuOpen ? 'bg-black border-black text-white' : 'bg-white border-gray-100 text-gray-500 hover:text-black hover:bg-gray-50'}`}
                    >
                        <MoreHorizontal size={22} />
                    </button>
                    {isMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
                                <button onClick={() => { setIsMenuOpen(false); setIsConfirmModalOpen(true); }}
                                    disabled={isDeleting} className="w-full px-4 py-3 flex items-center gap-3 text-red-600 hover:bg-red-50 transition-colors text-sm font-bold disabled:opacity-50"
                                >
                                    <Trash2 size={18} />
                                    <span>Удалить клиента</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="px-6">
                {/* Profile Card */}
                <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden mb-8 text-center">
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-blue-50 to-gray-50 z-0" />
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-3xl font-bold mb-4 bg-gray-100 overflow-hidden text-gray-400">
                            {client.photo_url ? <img src={client.photo_url} alt="" className="w-full h-full object-cover" /> : (client.first_name?.[0] || 'U')}
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 mb-1">{client.first_name} {client.username ? `(@${client.username})` : ''}</h1>
                        <div className="flex items-center gap-1.5 text-gray-400 text-sm font-medium mb-6">
                            <MapPin size={14} />
                            {mainAddress}
                        </div>
                        <div className="flex gap-3 w-full">
                            <a href={`tel:${client.phone_number}`} className="flex-1 h-12 rounded-[20px] bg-black text-white font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-lg shadow-black/20 active:scale-95 no-underline">
                                <Phone size={18} />
                                <span>Позвонить</span>
                            </a>
                            <div className="flex gap-2">
                                <button onClick={() => setIsMessageModalOpen(true)} className="w-12 h-12 rounded-[20px] bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors active:scale-95 shadow-sm border border-blue-100">
                                    <MessageCircle size={20} />
                                </button>
                                <a href={client.username ? `https://t.me/${client.username}` : `tg://user?id=${client.telegram_id}`} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-[20px] bg-[#229ED9] text-white flex items-center justify-center hover:bg-[#1c8adb] transition-colors active:scale-95 shadow-sm shadow-[#229ED9]/20">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Addresses */}
                <h3 className="text-lg font-bold text-gray-900 mb-4 px-1">Адреса доставки</h3>
                <div className="flex flex-col gap-3 mb-8">
                    {client.addresses?.length > 0 ? client.addresses.map(addr => (
                        <div key={addr.id} className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-100 flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><MapPin size={20} /></div>
                            <div>
                                <div className="font-bold text-gray-900 text-[15px]">{addr.title}</div>
                                <div className="text-sm text-gray-500 leading-snug">{addr.address}</div>
                            </div>
                        </div>
                    )) : <div className="text-gray-400 text-sm text-center py-4 bg-white rounded-[24px] border border-dashed border-gray-200">Адресов пока нет</div>}
                </div>

                {/* Added Events */}
                <h3 className="text-lg font-bold text-gray-900 mb-4 px-1">Добавленные события</h3>
                <div className="flex flex-col gap-3 mb-8">
                    {[...userBirthdays, ...userEvents].length > 0 ? (
                        [
                            ...userBirthdays.map(b => ({ ...b, type: 'birthday' as const, title: b.name, date: b.birthday })),
                            ...userEvents.map(e => ({ ...e, type: 'event' as const }))
                        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((item, idx) => (
                            <div key={`${item.id}-${idx}`} onClick={() => setSelectedDetailItem({ type: item.type, data: item })}
                                className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-100 flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center ${item.type === 'birthday' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-600'}`}>
                                        {item.type === 'birthday' ? <Cake size={22} /> : <CalendarIcon size={22} />}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900 text-[15px] mb-0.5">{item.title}</div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-xs font-medium text-gray-400">
                                                {item.type === 'birthday' ? 'День рождения' : 'Событие'} • {new Date(item.date!).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                                            </div>
                                            {item.user && (
                                                <div className="flex items-center gap-1 ml-1 bg-gray-50 px-1.5 py-0.5 rounded-full border border-gray-100/50">
                                                    <div className="w-4 h-4 rounded-full bg-white overflow-hidden border border-gray-200">
                                                        {item.user.photo_url ? (
                                                            <img src={item.user.photo_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[6px] font-bold text-gray-400">{item.user.first_name[0]}</div>
                                                        )}
                                                    </div>
                                                    <span className="text-[9px] font-medium text-gray-500">{item.user.first_name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400"><ChevronRight size={18} /></div>
                            </div>
                        ))
                    ) : <div className="text-gray-400 text-sm text-center py-6 bg-white rounded-[24px] border border-dashed border-gray-200">Событий пока нет</div>}
                </div>

                {/* Orders */}
                <div className="flex flex-col gap-4 mb-4 px-1">
                    <h3 className="text-lg font-bold text-gray-900">Последние заказы</h3>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder="Поиск по заказам..." value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)}
                            className="w-full bg-white border border-gray-100 rounded-[22px] py-4 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
                        />
                    </div>
                </div>
                <div className="flex flex-col gap-3">
                    {filteredOrders.length > 0 ? filteredOrders.map(order => (
                        <Link key={order.id} href={`${pathname}?order=${order.id}`} scroll={false}
                            className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-100 flex items-center justify-between active:scale-[0.99] transition-transform no-underline"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center ${order.status === 'done' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                                    <ShoppingBag size={22} />
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900 text-[15px] mb-0.5">Заказ #{order.id}</div>
                                    <div className="text-xs font-medium text-gray-400 line-clamp-1 max-w-[150px]">{order.items.length} поз. • {order.status}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-gray-900">{order.total.toLocaleString()} сум</div>
                                <div className="text-xs font-medium text-gray-400">{order.date}</div>
                            </div>
                        </Link>
                    )) : <div className="text-gray-400 text-sm text-center py-6 bg-white rounded-[24px] border border-dashed border-gray-200">Заказов не найдено</div>}
                </div>
            </div>

            <AnimatePresence>
                {isMessageModalOpen && <SendMessageModal client={client} isOpen={isMessageModalOpen} onClose={() => setIsMessageModalOpen(false)} />}
                {isConfirmModalOpen && <ConfirmDeleteModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} onConfirm={handleDeleteClient} isDeleting={isDeleting} clientName={client.first_name} />}
                {selectedDetailItem && <EventDetailModal item={selectedDetailItem} onClose={() => setSelectedDetailItem(null)} />}
            </AnimatePresence>

            {selectedOrder && <OrderDetails order={selectedOrder} isModal={true} onClose={() => router.push(pathname, { scroll: false })} />}
        </div>
    )
}

export default function ClientDetailsPage({ params }: { params: { id: string } }) {
    return (
        <Suspense fallback={<div className="p-6 text-center text-gray-500 font-medium">Загрузка...</div>}>
            <ClientDetailsContent params={params} />
        </Suspense>
    )
}
