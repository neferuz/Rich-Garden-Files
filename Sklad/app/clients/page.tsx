"use client"

import { useState, useEffect } from "react"
import { Search, Plus, ChevronRight, Phone, Filter, ArrowDownUp, Check } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import ProtectedRoute from "@/components/ProtectedRoute"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { formatPhoneNumber } from "@/lib/utils"

type Client = {
    id: number;
    telegram_id: number;
    first_name: string;
    username?: string;
    photo_url?: string;
    phone_number?: string;
    created_at: string;
    orders_count: number;
    total_spent: number;
}

export default function ClientsPage() {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState("")
    const [clients, setClients] = useState<Client[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [filterType, setFilterType] = useState<'all' | 'online' | 'offline'>('all')
    const [sortOrder, setSortOrder] = useState<'new' | 'old'>('new')

    useEffect(() => {
        fetch('/api/clients')
            .then(res => res.json())
            .then(data => {
                setClients(data)
                setIsLoading(false)
            })
            .catch(err => {
                console.error("Failed to fetch clients", err)
                setIsLoading(false)
            })
    }, [])

    const filteredClients = clients.filter(c => {
        const matchesSearch = (c.first_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.phone_number || "").includes(searchQuery)

        if (!matchesSearch) return false

        if (filterType === 'online') return !!c.telegram_id
        if (filterType === 'offline') return !c.telegram_id

        return true
    })

    const sortedClients = [...filteredClients].sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime()
        const dateB = new Date(b.created_at || 0).getTime()
        return sortOrder === 'new' ? dateB - dateA : dateA - dateB
    })

    return (
        <ProtectedRoute allowedRoles={['owner', 'admin', 'manager', 'worker']}>
            <div className="min-h-screen bg-gray-50/50 pb-32">
                {/* Header */}
                <div className="pt-6 px-6 mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Клиенты</h1>
                            <p className="text-gray-500 text-sm font-medium mt-1">Всего: {clients.length}</p>
                        </div>
                    </div>

                    {/* Search & Filter */}
                    <div className="flex gap-3 mb-6">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Поиск клиента..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white h-12 rounded-[20px] pl-12 pr-4 text-gray-900 placeholder:text-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-black/5 shadow-sm border border-gray-100"
                            />
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className={`w-12 h-12 flex items-center justify-center rounded-[20px] border transition-colors shadow-sm ${filterType !== 'all' ? 'bg-[#2663eb] text-white border-[#2663eb]' : 'bg-white border-gray-100 text-gray-500 hover:text-black hover:bg-gray-50'}`}>
                                    <Filter size={20} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl p-2 bg-white shadow-xl shadow-black/5 border-gray-100">
                                <DropdownMenuItem onClick={() => setFilterType('all')} className="rounded-lg cursor-pointer flex items-center justify-between">
                                    <span>Все</span>
                                    {filterType === 'all' && <Check size={16} />}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilterType('online')} className="rounded-lg cursor-pointer flex items-center justify-between">
                                    <span>Online</span>
                                    {filterType === 'online' && <Check size={16} />}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilterType('offline')} className="rounded-lg cursor-pointer flex items-center justify-between">
                                    <span>Offline</span>
                                    {filterType === 'offline' && <Check size={16} />}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setSortOrder('new')} className="rounded-lg cursor-pointer flex items-center justify-between">
                                    <span>Сначала новые</span>
                                    {sortOrder === 'new' && <Check size={16} />}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortOrder('old')} className="rounded-lg cursor-pointer flex items-center justify-between">
                                    <span>Сначала старые</span>
                                    {sortOrder === 'old' && <Check size={16} />}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>


                    </div>

                    {/* Clients List */}
                    <div className="flex flex-col gap-3">
                        {isLoading ? (
                            <div className="text-center py-10 text-gray-400">Загрузка клиентов...</div>
                        ) : sortedClients.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">Клиенты не найдены</div>
                        ) : (
                            sortedClients.map((client) => (
                                <Link href={`/clients/${client.id}`} key={client.id}>
                                    <div className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-100 active:scale-[0.99] transition-transform group cursor-pointer relative overflow-hidden">
                                        <div className="flex items-center gap-4">
                                            {/* Avatar */}
                                            <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold bg-gray-100 overflow-hidden text-gray-500 shrink-0">
                                                {client.photo_url ? (
                                                    <img src={client.photo_url} alt={client.first_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    client.first_name?.[0] || 'U'
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <h3 className="font-bold text-gray-900 text-[16px] truncate leading-tight">
                                                    {client.first_name}
                                                </h3>

                                                {client.username && (
                                                    <span className="text-sm font-medium text-blue-600 truncate mt-0.5">@{client.username}</span>
                                                )}
                                            </div>

                                            {/* Status */}
                                            <div className="shrink-0 flex items-center">
                                                {client.telegram_id ? (
                                                    <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wide">
                                                        Online
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wide">
                                                        Offline
                                                    </span>
                                                )}
                                            </div>

                                            {/* Arrow */}
                                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-colors shrink-0">
                                                <ChevronRight size={18} />
                                            </div>
                                        </div>

                                        {/* Stats Footer */}
                                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                                            <div className="flex items-center gap-1 text-xs font-semibold text-gray-400">
                                                <span>Заказов:</span>
                                                <span className="text-gray-900">{client.orders_count || 0}</span>
                                            </div>
                                            <div className="text-xs font-bold px-2.5 py-1 rounded-lg bg-gray-50 text-gray-500">
                                                {(client.total_spent || 0).toLocaleString()} сум
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    )
}
