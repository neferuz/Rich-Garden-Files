"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Calendar as CalendarIcon,
    Cake,
    User,
    X,
    ArrowUpRight,
    Search,
    Gift,
    Phone,
    ChevronLeft,
    ChevronRight,
    Eye,
    Filter,
    SlidersHorizontal
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { api, CalendarEvent, FamilyMember } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

const MONTH_NAMES = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
]

const getDaysLeftFormatted = (birthday: string | null) => {
    if (!birthday) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const bdayDate = new Date(birthday)
    if (isNaN(bdayDate.getTime())) return null

    let bday = new Date(today.getFullYear(), bdayDate.getMonth(), bdayDate.getDate())
    if (bday < today) bday.setFullYear(today.getFullYear() + 1)

    const diffTime = bday.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

type FilterType = 'today' | 'upcoming' | 'month' | 'all'

export default function CalendarPage() {
    const { user } = useAuth()
    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [family, setFamily] = useState<FamilyMember[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // UI States
    const [viewDate, setViewDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedItem, setSelectedItem] = useState<{ type: 'member' | 'event', data: any } | null>(null)

    // Filter State
    const [activeFilter, setActiveFilter] = useState<FilterType>('all')
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [slideDirection, setSlideDirection] = useState(0) // -1 left, 1 right

    const scrollContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isLoading) return

        // Scroll to selected date center
        const timer = setTimeout(() => {
            const uniqueId = `date-${selectedDate.getDate()}-${selectedDate.getMonth()}`
            const el = document.getElementById(uniqueId)
            if (el && scrollContainerRef.current) {
                const container = scrollContainerRef.current
                const elRect = el.getBoundingClientRect()
                const containerRect = container.getBoundingClientRect()
                const offset = elRect.left - containerRect.left
                const targetScroll = container.scrollLeft + offset - (containerRect.width / 2) + (elRect.width / 2)

                container.scrollTo({ left: targetScroll, behavior: 'auto' })
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [selectedDate, viewDate, isLoading])

    const fetchData = useCallback(async () => {
        setIsLoading(true)
        try {
            const data = await api.getAllCalendarData()
            setEvents(data.events || [])
            setFamily(data.family || [])
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Month Navigation with Animation Direction
    const nextMonth = () => {
        setSlideDirection(1)
        const d = new Date(viewDate)
        d.setMonth(d.getMonth() + 1)
        setViewDate(d)
    }

    const prevMonth = () => {
        setSlideDirection(-1)
        const d = new Date(viewDate)
        d.setMonth(d.getMonth() - 1)
        setViewDate(d)
    }

    const getDaysInMonth = () => {
        const year = viewDate.getFullYear()
        const month = viewDate.getMonth()
        const date = new Date(year, month, 1)
        const days = []
        while (date.getMonth() === month) {
            days.push(new Date(date))
            date.setDate(date.getDate() + 1)
        }
        return days
    }

    // Filter Items Logic
    const filteredItems = useMemo(() => {
        let items: any[] = []

        // Helper to process family members into unified format
        const familyAsItems = family.map(m => ({
            ...m,
            itemType: 'birthday',
            daysLeft: getDaysLeftFormatted(m.birthday),
            dateObj: new Date(m.birthday || new Date()) // approximate for sorting if needed
        }))

        const eventsAsItems = events.map(e => ({
            ...e,
            itemType: 'event',
            daysLeft: (() => {
                const d = new Date(e.date)
                const now = new Date()
                now.setHours(0, 0, 0, 0)
                const diff = d.getTime() - now.getTime()
                return Math.ceil(diff / (1000 * 3600 * 24))
            })(),
            dateObj: new Date(e.date)
        }))

        if (activeFilter === 'today') {
            items = [...eventsAsItems, ...familyAsItems].filter(i => {
                if (i.itemType === 'birthday') {
                    const d = new Date((i as any).birthday!)
                    return d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth()
                } else {
                    const d = new Date((i as any).date)
                    return d.getDate() === selectedDate.getDate() &&
                        d.getMonth() === selectedDate.getMonth() &&
                        d.getFullYear() === selectedDate.getFullYear()
                }
            })
        }
        else if (activeFilter === 'upcoming') {
            items = [...eventsAsItems, ...familyAsItems].filter(i =>
                i.daysLeft !== null && i.daysLeft >= 0 && i.daysLeft <= 45
            ).sort((a, b) => (a.daysLeft || 999) - (b.daysLeft || 999))
        }
        else if (activeFilter === 'month') {
            items = [...eventsAsItems, ...familyAsItems].filter(i => {
                if (i.itemType === 'birthday') {
                    const d = new Date((i as any).birthday!)
                    return d.getMonth() === viewDate.getMonth()
                } else {
                    const d = new Date((i as any).date)
                    return d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewDate.getFullYear()
                }
            }).sort((a, b) => {
                const dayA = new Date((a as any).date || (a as any).birthday).getDate()
                const dayB = new Date((b as any).date || (b as any).birthday).getDate()
                return dayA - dayB
            })
        }
        else if (activeFilter === 'all') {
            // Show everything sorted by "days left" (nearest future first), including today/tomorrow
            // We filter out past events (daysLeft < 0) for cleaner view? Or just show all upcoming.
            items = [...eventsAsItems, ...familyAsItems]
                .filter(i => i.daysLeft !== null && i.daysLeft >= 0)
                .sort((a, b) => (a.daysLeft || 999) - (b.daysLeft || 999))
        }

        // Search Filter
        if (searchQuery) {
            items = items.filter(i => {
                const name = i.name || i.title || ''
                return name.toLowerCase().includes(searchQuery.toLowerCase())
            })
        }

        return items
    }, [events, family, selectedDate, activeFilter, viewDate, searchQuery])


    const renderCard = (item: any, index: number) => {
        const isBirthday = item.itemType === 'birthday'
        const title = isBirthday ? item.name : item.title
        const subtitle = isBirthday ? item.relation : 'Событие'

        const itemDate = new Date(isBirthday ? item.birthday! : item.date)
        const dateString = itemDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })

        const daysLeftText = item.daysLeft === 0 ? 'Сегодня' :
            item.daysLeft === 1 ? 'Завтра' :
                `Через ${item.daysLeft} дн`

        const daysLeftColor = item.daysLeft <= 3 ? "text-rose-500 bg-rose-50" : "text-blue-600 bg-blue-50"
        const iconColor = isBirthday ? "bg-rose-100 text-rose-500" : "bg-blue-100 text-blue-600"

        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                key={`${item.itemType}-${item.id}`}
                onClick={() => setSelectedItem({ type: isBirthday ? 'member' : 'event', data: item })}
                className="w-full"
            >
                <div className="bg-white p-4 rounded-[24px] border border-gray-100 active:scale-[0.98] transition-all flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-[18px] flex flex-col items-center justify-center shrink-0", iconColor)}>
                        {/* Show Date inside the icon box instead of icon? Or icon + small date. Let's try Date Number + Month like iOS calendar icon */}
                        <span className="text-[13px] font-bold leading-none">{itemDate.getDate()}</span>
                        <span className="text-[9px] font-medium uppercase leading-none mt-0.5">{itemDate.toLocaleDateString('ru-RU', { month: 'short' }).slice(0, 3)}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <h4 className="text-[15px] font-bold text-gray-900 truncate pr-2">{title}</h4>
                            <span className={cn("text-[10px] font-medium px-2 py-1 rounded-full whitespace-nowrap", daysLeftColor)}>
                                {daysLeftText}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs font-medium text-gray-400">{subtitle}</p>
                            {item.user && (
                                <div className="flex items-center gap-1.5 ml-auto">
                                    <div className="w-5 h-5 rounded-full bg-gray-100 overflow-hidden border border-gray-100">
                                        {item.user.photo_url ? (
                                            <img src={item.user.photo_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-[8px] font-bold text-gray-400">
                                                {item.user.first_name[0]}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-medium text-gray-400">{item.user.first_name}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        )
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                    <p className="text-gray-500 text-sm font-medium">Загрузка...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F8F9FB] pb-40 overflow-hidden">
            {/* Header */}
            <div className="pt-6 px-6 mb-2">
                <div className="flex items-center justify-between h-14 mb-2 relative">
                    <div className={`absolute inset-0 flex items-center justify-between transition-all duration-300 ${isSearchOpen ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Календарь</h1>
                        </div>
                        <button onClick={() => setIsSearchOpen(true)} className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm text-gray-500 hover:text-black">
                            <Search size={20} />
                        </button>
                    </div>

                    <div className={`absolute inset-0 flex items-center gap-3 transition-all duration-300 ${isSearchOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Поиск..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-10 pl-10 pr-4 rounded-full border border-gray-200 focus:outline-none focus:border-blue-500 bg-white text-sm"
                                autoFocus={isSearchOpen}
                            />
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                        <button onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                            <X size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Month Navigation */}
            <div className="px-6 flex items-center justify-between mb-2">
                <button onClick={prevMonth} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 active:scale-95 transition-all">
                    <ChevronLeft size={18} />
                </button>
                <div className="flex flex-col items-center">
                    <AnimatePresence mode="popLayout" custom={slideDirection}>
                        <motion.h2
                            key={viewDate.toISOString()}
                            custom={slideDirection}
                            initial={{ x: slideDirection * 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: slideDirection * -50, opacity: 0 }}
                            className="text-lg font-bold text-gray-900 capitalize"
                        >
                            {MONTH_NAMES[viewDate.getMonth()]}
                        </motion.h2>
                    </AnimatePresence>
                    <span className="text-xs font-medium text-gray-400">{viewDate.getFullYear()}</span>
                </div>
                <button onClick={nextMonth} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 active:scale-95 transition-all">
                    <ChevronRight size={18} />
                </button>
            </div>

            {/* Scrollable Month Strip */}
            <AnimatePresence mode="wait">
                <motion.div
                    ref={scrollContainerRef}
                    key={viewDate.getMonth()}
                    initial={{ opacity: 0, x: slideDirection * 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: slideDirection * -20 }}
                    className="px-6 flex gap-2 overflow-x-auto pb-4 pt-2 mb-2 hide-scrollbar items-center"
                >
                    {getDaysInMonth().map((date) => {
                        const isSelected = date.toDateString() === selectedDate.toDateString()
                        const isToday = date.toDateString() === new Date().toDateString()
                        return (
                            <button
                                key={date.toISOString()}
                                id={`date-${date.getDate()}-${date.getMonth()}`}
                                onClick={() => {
                                    setSelectedDate(date);
                                    setActiveFilter('today');
                                }}
                                className={`
                                    min-w-[3.5em] h-[4.5em] rounded-[18px] flex flex-col items-center justify-center transition-all duration-300 border relative flex-shrink-0
                                    ${isSelected
                                        ? "bg-blue-600 text-white border-blue-600 shadow-lg scale-105 z-10"
                                        : "bg-white border-gray-100 text-gray-400 hover:border-gray-300"
                                    }
                                    ${isToday && !isSelected ? "border-blue-200 bg-blue-50/50" : ""}
                                `}
                            >
                                <span className={cn("text-[10px] font-medium uppercase mb-1", isSelected ? "text-blue-100" : "")}>{date.toLocaleDateString('ru-RU', { weekday: 'short' })}</span>
                                <span className="text-lg font-medium">{date.getDate()}</span>
                                {isToday && !isSelected && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-500" />}
                            </button>
                        )
                    })}
                </motion.div>
            </AnimatePresence>

            {/* List Content */}
            <div className="px-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900">
                        {activeFilter === 'today' ? 'События дня' :
                            activeFilter === 'upcoming' ? 'Скоро' :
                                activeFilter === 'month' ? 'В этом месяце' : 'Все события'}
                    </h3>
                    {activeFilter === 'today' && (
                        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                            {selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                        </span>
                    )}
                </div>

                <div className="flex flex-col gap-3 min-h-[300px]">
                    <AnimatePresence mode="popLayout">
                        {filteredItems.map((item, index) => renderCard(item, index))}
                    </AnimatePresence>

                    {/* Empty State */}
                    {filteredItems.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <Search className="text-gray-300" size={24} />
                            </div>
                            <p className="text-gray-400 font-medium text-sm">Ничего не найдено</p>
                            <button
                                onClick={() => setActiveFilter('all')}
                                className="mt-4 text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100 transition-colors"
                            >
                                Показать все события
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Fixed Bottom Filter Button */}
            <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-30">
                <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-full shadow-2xl border border-gray-200/50 flex gap-1">
                    {[
                        { id: 'today', icon: <CalendarIcon size={16} />, label: 'День' },
                        { id: 'upcoming', icon: <ArrowUpRight size={16} />, label: 'Скоро' },
                        { id: 'month', icon: <Filter size={16} />, label: 'Месяц' },
                        { id: 'all', icon: <SlidersHorizontal size={16} />, label: 'Все' },
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setActiveFilter(t.id as FilterType)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all",
                                activeFilter === t.id
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                                    : "text-gray-500 hover:bg-gray-50"
                            )}
                        >
                            {t.icon}
                            <span>{t.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedItem(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="relative w-full max-w-sm bg-white rounded-[32px] p-8 shadow-2xl z-10"
                        >

                            <div className="flex items-center gap-5 mb-8">
                                <div className={cn(
                                    "w-16 h-16 rounded-[22px] flex items-center justify-center shadow-sm",
                                    selectedItem.type === 'member' ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-600"
                                )}>
                                    {selectedItem.type === 'member' ? <Cake size={28} strokeWidth={1.5} /> : <CalendarIcon size={28} strokeWidth={1.5} />}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 leading-tight">
                                        {selectedItem.data.name || selectedItem.data.title}
                                    </h2>
                                    <p className="text-sm font-medium text-gray-400 mt-1">
                                        {selectedItem.type === 'member' ? selectedItem.data.relation : 'Личное событие'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-[#F8F9FB] p-4 rounded-[20px] text-center">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Когда</p>
                                    <p className="text-[15px] font-bold text-gray-900">
                                        {new Date(selectedItem.type === 'member' ? selectedItem.data.birthday : selectedItem.data.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                                    </p>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-[20px] text-center">
                                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wide mb-1">Осталось</p>
                                    <p className="text-[15px] font-bold text-blue-600">
                                        {selectedItem.data.daysLeft} дней
                                    </p>
                                </div>
                            </div>

                            {/* Metadata Section */}
                            <div className="bg-gray-50/50 rounded-[28px] p-4 mb-8 border border-gray-100/50 space-y-4 text-left">
                                {selectedItem.data.user && (
                                    <Link
                                        href={`/clients/${selectedItem.data.user.id}`}
                                        className="flex items-center justify-between group active:scale-[0.98] transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 shadow-sm overflow-hidden relative">
                                                {selectedItem.data.user.photo_url ? (
                                                    <img
                                                        src={selectedItem.data.user.photo_url}
                                                        alt={selectedItem.data.user.first_name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                            (e.target as HTMLImageElement).parentElement!.classList.add('bg-gray-100');
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400 font-bold text-lg">
                                                        {selectedItem.data.user.first_name[0]}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight leading-none mb-1">Добавил</p>
                                                <p className="text-[15px] font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">{selectedItem.data.user.first_name}</p>
                                                {selectedItem.data.user.phone_number && (
                                                    <p className="text-[11px] font-medium text-gray-400 mt-1">{selectedItem.data.user.phone_number}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                            <ChevronRight size={16} />
                                        </div>
                                    </Link>
                                )}

                                {selectedItem.data.created_at && (
                                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100/50">
                                        <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 shadow-sm">
                                            <CalendarIcon size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight leading-none mb-1">Создано</p>
                                            <p className="text-[15px] font-bold text-gray-900 leading-none">
                                                {new Date(selectedItem.data.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setSelectedItem(null)}
                                className="w-full h-14 bg-[hsl(218.73deg,88.73%,58.24%)] text-white rounded-[22px] font-medium text-[15px] shadow-lg shadow-[hsla(218.73deg,88.73%,58.24%,0.4)] active:scale-95 transition-all flex items-center justify-center"
                            >
                                Понятно
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
