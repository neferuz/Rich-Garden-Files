"use client"

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { BottomNav } from '@/components/BottomNav'
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Bell,
    Calendar as CalendarIcon,
    Heart,
    Gift,
    Users,
    X,
    Cake,
    ChevronDown,
    ChevronUp,
    Search,
    User,
    Trash2,
    HelpCircle,
    Info
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { api, CalendarEvent, FamilyMember } from '@/lib/api'
import { toast } from 'sonner'

// --- Types ---
type EventType = 'birthday' | 'anniversary' | 'family' | 'other'

interface CalendarEventExtended extends CalendarEvent {
    personImage?: string
}

// --- Mock Data ---
const DEFAULT_TG_ID = 12345 // For dev outside telegram

const INITIAL_FAMILY: FamilyMember[] = []

const MONTH_NAMES = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
]

// --- Utils ---
const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = new Date(year, month, 1).getDay()
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1
    const days = []
    for (let i = 0; i < adjustedFirstDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i))
    return days
}

const getCollapsedDays = (centerDate: Date) => {
    const days = []
    for (let i = -3; i <= 3; i++) {
        const d = new Date(centerDate)
        d.setDate(centerDate.getDate() + i)
        days.push(d)
    }
    return days
}

export default function CalendarPage() {
    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [family, setFamily] = useState<FamilyMember[]>([])
    const [telegramId, setTelegramId] = useState<number>(DEFAULT_TG_ID)
    const router = useRouter()

    const [isLoading, setIsLoading] = useState(true)

    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [isCalendarExpanded, setIsCalendarExpanded] = useState(false)
    const [isYearPickerOpen, setIsYearPickerOpen] = useState(false)
    const [isFamilyGalleryOpen, setIsFamilyGalleryOpen] = useState(false)
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
    const [isHelpOpen, setIsHelpOpen] = useState(false)
    const [isAddFamilyOpen, setIsAddFamilyOpen] = useState(false)

    // Form States
    const [isAddEventOpen, setIsAddEventOpen] = useState(false)
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
    const [newEventDate, setNewEventDate] = useState(new Date())
    const [newEventTitle, setNewEventTitle] = useState('')
    const [selectedType, setSelectedType] = useState<EventType>('birthday')

    // Family Form States
    const [newMemberName, setNewMemberName] = useState('')
    const [newMemberRelation, setNewMemberRelation] = useState('')
    const [newMemberBirthday, setNewMemberBirthday] = useState(new Date())
    const [isMemberDatePickerOpen, setIsMemberDatePickerOpen] = useState(false)

    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await api.getCalendarData(telegramId);
            setEvents(data.events);
            setFamily(data.family);
        } catch (error) {
            console.error("Failed to fetch calendar data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Initial Fetch
    useEffect(() => {
        const tg = (window as any).Telegram?.WebApp;
        const tgId = tg?.initDataUnsafe?.user?.id || DEFAULT_TG_ID;
        setTelegramId(tgId);
    }, []);

    useEffect(() => {
        fetchData();
    }, [telegramId]);

    // Scroll Lock when modals are open
    useEffect(() => {
        const anyModalOpen = isAddEventOpen || !!selectedEvent || isFamilyGalleryOpen || isYearPickerOpen || isDatePickerOpen || isDeleteConfirmOpen || isHelpOpen || isAddFamilyOpen
        if (anyModalOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => { document.body.style.overflow = 'unset' }
    }, [isAddEventOpen, selectedEvent, isFamilyGalleryOpen, isYearPickerOpen, isDatePickerOpen, isDeleteConfirmOpen, isHelpOpen, isAddFamilyOpen])

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date)
        setCurrentDate(date)
    }

    const changeMonth = (dir: number) => {
        const newDate = new Date(currentDate)
        newDate.setMonth(newDate.getMonth() + dir)
        setCurrentDate(newDate)
    }

    const handleSaveEvent = async () => {
        if (!newEventTitle.trim()) return

        try {
            const res = await api.createEvent(telegramId, {
                title: newEventTitle,
                date: newEventDate,
                type: selectedType
            });
            if (res) {
                await fetchData(); // Re-fetch all to get synced data
                setIsAddEventOpen(false);
                setNewEventTitle('');
                setNewEventDate(new Date());
                toast.success("Событие добавлено", {
                    description: newEventTitle
                });
            }
        } catch (error) {
            console.error("Failed to save event:", error);
            toast.error("Не удалось сохранить событие");
        }
    }

    const handleDeleteEvent = async (id: number | string) => {
        if (!selectedEvent) return;

        try {
            // If it's a birthday event tied to a member, delete the member (which deletes all their events)
            if (selectedEvent.family_member_id && selectedEvent.type === 'birthday') {
                await api.deleteFamilyMember(telegramId, selectedEvent.family_member_id);
                setFamily(prev => prev.filter(m => m.id !== selectedEvent.family_member_id));
                setEvents(prev => prev.filter(e => e.family_member_id !== selectedEvent.family_member_id));
                toast.success("Контакт и события удалены");
            } else {
                await api.deleteEvent(telegramId, id);
                setEvents(prev => prev.filter(e => e.id !== id));
                toast.success("Событие удалено");
            }
            setSelectedEvent(null);
            setIsDeleteConfirmOpen(false);
        } catch (error) {
            console.error("Failed to delete event:", error);
            toast.error("Ошибка при удалении");
        }
    }

    const handleSaveFamilyMember = async () => {
        if (!newMemberName.trim() || !newMemberRelation.trim()) return

        try {
            const dateStr = `${newMemberBirthday.getFullYear()}-${String(newMemberBirthday.getMonth() + 1).padStart(2, '0')}-${String(newMemberBirthday.getDate()).padStart(2, '0')}`;

            const res = await api.createFamilyMember(telegramId, {
                name: newMemberName,
                relation: newMemberRelation,
                birthday: dateStr,
                image: "none"
            });
            if (res) {
                await fetchData(); // Re-fetch all to get synced data
                setIsAddFamilyOpen(false);
                setNewMemberName('');
                setNewMemberRelation('');
                setNewMemberBirthday(new Date());
                toast.success("Контакт добавлен", {
                    description: newMemberName
                });
            }
        } catch (error) {
            console.error("Failed to save family member:", error);
            toast.error("Не удалось сохранить контакт");
        }
    }

    return (
        <main className="min-h-screen bg-white pb-32 selection:bg-black selection:text-white">

            {/* Minimalist Fixed Header - Profile Style */}
            <header className="fixed top-0 inset-x-0 bg-white/80 backdrop-blur-xl z-50 border-b border-gray-100/50">
                <div className="px-6 h-16 flex items-center justify-between">
                    <h1 className="text-[26px] font-bold text-black lowercase tracking-tight leading-none">календарь</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsHelpOpen(true)}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-100 text-gray-400 active:scale-95 transition-all hover:text-black hover:border-black/10"
                        >
                            <HelpCircle size={18} strokeWidth={1.5} />
                        </button>
                        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-100 text-gray-400 active:scale-95 transition-all hover:text-black hover:border-black/10 relative">
                            <Bell size={18} strokeWidth={1.5} />
                            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="pt-20 space-y-10">

                {/* --- Calendar Section --- */}
                <section className="px-6">
                    <div className="flex items-center justify-between mb-6">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsYearPickerOpen(true)}
                            className="flex items-center gap-2 group"
                        >
                            <span className="text-[20px] font-semibold text-black capitalize">
                                {MONTH_NAMES[currentDate.getMonth()]}, {currentDate.getFullYear()}
                            </span>
                            <ChevronDown size={16} className="text-gray-300 group-hover:text-black transition-colors" />
                        </motion.button>

                        <div className="flex gap-1">
                            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 hover:text-black">
                                <ChevronLeft size={24} />
                            </button>
                            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 hover:text-black">
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    </div>

                    <div className="relative transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]">
                        <AnimatePresence mode="wait">
                            {isCalendarExpanded ? (
                                <motion.div
                                    key="grid"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="space-y-6"
                                >
                                    <div className="grid grid-cols-7 text-center">
                                        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map(d => (
                                            <span key={d} className="text-[12px] font-semibold text-gray-300 uppercase tracking-widest">{d}</span>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-7 gap-y-2">
                                        {getDaysInMonth(currentDate).map((date, i) => {
                                            if (!date) return <div key={`empty-${i}`} />
                                            const isSelected = date.toDateString() === selectedDate.toDateString()
                                            const isToday = date.toDateString() === new Date().toDateString()
                                            const hasActiveEvent = events.some(e => e.date.toDateString() === date.toDateString())

                                            return (
                                                <button
                                                    key={date.toString()}
                                                    onClick={() => handleDateSelect(date)}
                                                    className={cn(
                                                        "relative h-11 w-11 mx-auto flex flex-col items-center justify-center rounded-2xl transition-all duration-300",
                                                        isSelected ? "bg-black text-white" : "hover:bg-gray-50 text-gray-900",
                                                        isToday && !isSelected && "ring-2 ring-gray-100 ring-offset-2"
                                                    )}
                                                >
                                                    <span className="text-[16px] font-medium">{date.getDate()}</span>
                                                    {hasActiveEvent && !isSelected && (
                                                        <span className="absolute bottom-1.5 w-1 h-1 bg-pink-500 rounded-full" />
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="strip"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="relative flex justify-center items-center gap-1.5 p-1.5 bg-gray-50/50 rounded-[32px] border border-gray-100/50"
                                >
                                    {getCollapsedDays(selectedDate).map((date, i) => {
                                        const isSelected = date.toDateString() === selectedDate.toDateString()
                                        const isToday = date.toDateString() === new Date().toDateString()
                                        const distance = Math.abs(i - 3) // Center is at index 3

                                        return (
                                            <button
                                                key={i}
                                                onClick={() => handleDateSelect(date)}
                                                className={cn(
                                                    "relative flex flex-col items-center justify-center w-[42px] h-[76px] rounded-[22px] transition-all duration-500 z-10",
                                                    isSelected ? "text-white" : "text-gray-400 hover:bg-white/80"
                                                )}
                                                style={{
                                                    opacity: isSelected ? 1 : 1 - (distance * 0.15),
                                                    transform: isSelected ? 'scale(1.1)' : `scale(${1 - (distance * 0.05)})`
                                                }}
                                            >
                                                {isSelected && (
                                                    <motion.div
                                                        layoutId="active-pill"
                                                        className="absolute inset-0 bg-black rounded-[22px] z-[-1]"
                                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                    />
                                                )}
                                                <span className={cn(
                                                    "text-[9px] font-bold uppercase tracking-wider mb-1.5",
                                                    isSelected ? "text-white/50" : "text-gray-300"
                                                )}>
                                                    {date.toLocaleDateString('ru-RU', { weekday: 'short' }).slice(0, 2)}
                                                </span>
                                                <span className={cn(
                                                    "text-[16px] font-bold tracking-tight",
                                                    isSelected ? "text-white" : isToday ? "text-blue-600" : "text-gray-900"
                                                )}>
                                                    {date.getDate()}
                                                </span>

                                                {events.some(e => e.date.toDateString() === date.toDateString()) && (
                                                    <motion.span
                                                        layoutId={isSelected ? "active-dot" : undefined}
                                                        className={cn(
                                                            "w-1 h-1 rounded-full mt-1.5",
                                                            isSelected ? "bg-white" : "bg-pink-500"
                                                        )}
                                                    />
                                                )}
                                            </button>
                                        )
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex justify-center mt-6">
                            <button
                                onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
                                className="px-4 py-2 rounded-full border border-gray-100 bg-white shadow-sm flex items-center gap-2 group hover:border-black/10 transition-colors"
                            >
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 group-hover:text-black transition-colors">
                                    {isCalendarExpanded ? "Свернуть" : "Развернуть"}
                                </span>
                                {isCalendarExpanded ? <ChevronUp size={14} className="text-gray-400 group-hover:text-black" /> : <ChevronDown size={14} className="text-gray-400 group-hover:text-black" />}
                            </button>
                        </div>
                    </div>
                </section>

                {/* --- Family Section --- */}
                <section>
                    <div className="px-6 flex items-center justify-between mb-5">
                        <h3 className="text-[18px] font-semibold text-black tracking-tight">Родные</h3>
                        <button
                            onClick={() => setIsFamilyGalleryOpen(true)}
                            className="text-[13px] font-medium text-gray-400 hover:text-black transition-colors"
                        >Все</button>
                    </div>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar px-6 pb-2">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsAddFamilyOpen(true)}
                            className="flex flex-col items-center gap-2 min-w-[64px]"
                        >
                            <div className="w-[64px] h-[64px] rounded-[24px] bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:border-black/20 hover:bg-gray-100 transition-all">
                                <Plus size={22} strokeWidth={1.5} />
                            </div>
                            <span className="text-[12px] font-medium text-gray-400">Добавить</span>
                        </motion.button>

                        {family.map((member, i) => {
                            const daysLeft = member.birthday ? (() => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const [y, m, d] = member.birthday.split('-').map(Number);
                                const bday = new Date(today.getFullYear(), m - 1, d);
                                if (bday < today) bday.setFullYear(today.getFullYear() + 1);
                                return Math.ceil((bday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                            })() : null;

                            const birthdayEvent = events.find(e =>
                                e.family_member_id === member.id &&
                                e.type === 'birthday'
                            );

                            return (
                                <motion.div
                                    key={member.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    onClick={() => birthdayEvent && setSelectedEvent(birthdayEvent)}
                                    className="flex flex-col items-center gap-2 min-w-[70px] group cursor-pointer"
                                >
                                    <div className="w-[64px] h-[64px] rounded-[24px] overflow-hidden relative flex items-center justify-center bg-gray-50 border border-gray-100 group">
                                        <User size={24} strokeWidth={1.5} className="text-gray-400 transition-transform duration-500 group-hover:scale-110" />
                                        <div className="absolute inset-0 border border-black/5 rounded-[24px]" />
                                    </div>
                                    <div className="text-center leading-tight">
                                        <p className="text-[12px] font-semibold text-black truncate w-16">{member.name}</p>
                                        {daysLeft !== null ? (
                                            <p className={cn(
                                                "text-[10px] font-bold mt-1 uppercase tracking-tighter",
                                                daysLeft <= 10 ? "text-black" : "text-gray-400"
                                            )}>
                                                {daysLeft === 0 ? "Сегодня!" : `через ${daysLeft} дн`}
                                            </p>
                                        ) : (
                                            <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase tracking-tighter">{member.relation}</p>
                                        )}
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </section>

                {/* --- Events List Section --- */}
                <section className="px-6 pb-20">
                    <h3 className="text-[18px] font-semibold text-black tracking-tight mb-5">
                        {selectedDate.toDateString() === new Date().toDateString() ? "Ближайшие события" : `События ${selectedDate.getDate()} ${MONTH_NAMES[selectedDate.getMonth()].toLowerCase()}`}
                    </h3>

                    <div className="space-y-1">
                        {(() => {
                            const dayEvents = events.filter(e => e.date.toDateString() === selectedDate.toDateString())
                            const list = dayEvents.length > 0 ? dayEvents : events.slice(0, 5)

                            if (list.length === 0) return (
                                <div className="py-20 text-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-gray-100/50">
                                        <CalendarIcon className="text-gray-300" size={24} />
                                    </div>
                                    <p className="text-gray-400 font-medium">Событий пока нет</p>
                                </div>
                            )

                            return list.map((event, idx) => (
                                <motion.div
                                    key={`event-${event.id}-${idx}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => setSelectedEvent(event)}
                                    className="group flex items-center gap-4 py-4 border-b border-gray-50 last:border-0 active:bg-gray-50/50 -mx-3 px-3 rounded-2xl transition-colors cursor-pointer"
                                >
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center",
                                        event.type === 'birthday' ? "bg-pink-50 text-pink-500" :
                                            event.type === 'anniversary' ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"
                                    )}>
                                        {event.type === 'birthday' ? <Cake size={20} strokeWidth={1.5} /> :
                                            event.type === 'anniversary' ? <Heart size={20} strokeWidth={1.5} /> : <Users size={20} strokeWidth={1.5} />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[16px] font-semibold text-black leading-tight truncate">{event.title}</h4>
                                        <p className="text-[12px] font-medium text-gray-400 mt-1 uppercase tracking-wide">
                                            {event.date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                                        </p>
                                    </div>

                                    {(event.type === 'birthday' || event.type === 'anniversary') ? (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); router.push('/catalog'); }}
                                            className="h-10 px-6 rounded-full bg-black text-white text-[12px] font-bold active:scale-95 transition-all uppercase tracking-tight"
                                        >
                                            Подарок
                                        </button>
                                    ) : (
                                        <ChevronRight size={20} className="text-gray-300" />
                                    )}
                                </motion.div>
                            ))
                        })()}
                    </div>
                </section>
            </div>

            {/* Premium Bottom Bar Action */}
            {!isAddEventOpen && (
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsAddEventOpen(true)}
                    className="fixed bottom-28 right-6 w-14 h-14 bg-black text-white rounded-[20px] flex items-center justify-center z-40 transition-shadow"
                >
                    <Plus size={28} strokeWidth={1.5} />
                </motion.button>
            )}

            {/* --- Modals / Sheets --- */}

            <AnimatePresence>
                {/* Year Picker */}
                {isYearPickerOpen && (
                    <motion.div
                        key="year-picker-overlay"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-xl z-[70] flex items-center justify-center p-6"
                        onClick={() => setIsYearPickerOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[48px] w-full max-w-sm p-10 shadow-2xl relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-[22px] font-semibold text-black tracking-tight">Выберите год</h3>
                                <button onClick={() => setIsYearPickerOpen(false)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 active:scale-90 transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 max-h-[360px] overflow-y-auto no-scrollbar pr-1 py-1">
                                {Array.from({ length: 14 }, (_, i) => currentDate.getFullYear() - 5 + i).map(y => (
                                    <motion.button
                                        key={y}
                                        whileTap={{ scale: 0.96 }}
                                        onClick={() => {
                                            const d = new Date(currentDate);
                                            d.setFullYear(y);
                                            setCurrentDate(d);
                                            setIsYearPickerOpen(false)
                                        }}
                                        className={cn(
                                            "py-5 rounded-[24px] text-[17px] font-semibold transition-all duration-300",
                                            y === currentDate.getFullYear()
                                                ? "bg-black text-white"
                                                : "bg-gray-50/80 text-gray-900 border border-gray-100/50 hover:bg-gray-100"
                                        )}>
                                        {y}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Date Picker for Form */}
                {isDatePickerOpen && (
                    <motion.div
                        key="date-picker-overlay"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-xl z-[80] flex items-center justify-center p-6"
                        onClick={() => setIsDatePickerOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[48px] w-full max-w-sm p-10 shadow-2xl relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-[22px] font-semibold text-black tracking-tight">Выберите дату</h3>
                                <button onClick={() => setIsDatePickerOpen(false)} className="p-2 bg-gray-50 rounded-full text-gray-400 active:scale-90 transition-all">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center mb-6">
                                {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d, idx) => (
                                    <span key={`header-${d}-${idx}`} className="text-[11px] font-bold text-gray-300 uppercase tracking-widest leading-none">{d}</span>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-2">
                                {getDaysInMonth(currentDate).map((date, i) => {
                                    if (!date) return <div key={`picker-empty-${i}`} />
                                    const isSel = date.toDateString() === newEventDate.toDateString()
                                    return (
                                        <motion.button
                                            whileTap={{ scale: 0.92 }}
                                            key={`picker-date-${date.getTime()}-${i}`}
                                            onClick={() => { setNewEventDate(date); setIsDatePickerOpen(false) }}
                                            className={cn(
                                                "h-10 w-10 flex items-center justify-center rounded-2xl text-[15px] font-semibold transition-all duration-300",
                                                isSel ? "bg-black text-white" : "text-gray-900 hover:bg-gray-50"
                                            )}
                                        >
                                            {date.getDate()}
                                        </motion.button>
                                    )
                                })}
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Add Event Bottom Sheet */}
                {isAddEventOpen && (
                    <motion.div
                        key="add-event-backdrop"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55]"
                        onClick={() => setIsAddEventOpen(false)}
                    />
                )}
                {isAddEventOpen && (
                    <motion.div
                        key="add-event-sheet"
                        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 inset-x-0 z-[60] bg-white rounded-t-[48px] overflow-hidden max-h-[90vh] flex flex-col"
                    >
                        <div className="p-8 pb-12">
                            <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-10" />
                            <div className="flex items-center justify-between mb-10">
                                <h2 className="text-[28px] font-semibold text-black leading-none tracking-tight">Новое событие</h2>
                                <button onClick={() => setIsAddEventOpen(false)} className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 active:scale-95 transition-all"><X size={24} /></button>
                            </div>

                            <div className="space-y-8">
                                <div className="flex gap-3 overflow-x-auto no-scrollbar">
                                    {[
                                        { id: 'birthday', label: 'ДР', icon: Cake, color: 'text-pink-500' },
                                        { id: 'anniversary', label: 'Годовщина', icon: Heart, color: 'text-red-500' },
                                        { id: 'family', label: 'Семья', icon: Users, color: 'text-blue-500' }
                                    ].map(type => (
                                        <button
                                            key={type.id}
                                            onClick={() => setSelectedType(type.id as EventType)}
                                            className={cn(
                                                "px-6 py-4 rounded-[24px] flex items-center gap-3 font-medium whitespace-nowrap active:scale-95 transition-all border-2 flex-1 justify-center",
                                                selectedType === type.id
                                                    ? "bg-black text-white border-black"
                                                    : "bg-gray-50 text-gray-900 border-transparent hover:border-gray-100"
                                            )}
                                        >
                                            <type.icon size={20} className={selectedType === type.id ? "text-white" : type.color} />
                                            <span>{type.label}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-gray-50/50 p-6 rounded-[32px] border border-gray-100/50">
                                        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest ml-1">Название</label>
                                        <input
                                            type="text"
                                            value={newEventTitle}
                                            onChange={(e) => setNewEventTitle(e.target.value)}
                                            placeholder="Например: День рождения Мамы"
                                            className="w-full bg-transparent text-[19px] font-medium text-black outline-none placeholder:text-gray-300 mt-2"
                                        />
                                    </div>

                                    <div className="flex gap-4">
                                        <div onClick={() => setIsDatePickerOpen(true)} className="flex-1 bg-gray-50/50 p-6 rounded-[32px] border border-gray-100/50 cursor-pointer active:bg-gray-100 transition-colors">
                                            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest ml-1">Дата</label>
                                            <div className="text-[19px] font-medium text-black mt-2">{newEventDate.toLocaleDateString('ru-RU')}</div>
                                        </div>
                                        <div className="flex-1 bg-gray-50/50 p-6 rounded-[32px] border border-gray-100/50">
                                            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest ml-1">Повтор</label>
                                            <select className="w-full bg-transparent text-[19px] font-medium text-black outline-none mt-2 appearance-none">
                                                <option>Ежегодно</option>
                                                <option>Никогда</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSaveEvent}
                                    className="w-full py-5 bg-black text-white text-[18px] font-semibold rounded-[32px] active:scale-[0.98] transition-all"
                                >
                                    Сохранить
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
                {/* Family Gallery Modal */}
                {isFamilyGalleryOpen && (
                    <motion.div
                        key="family-gallery-overlay"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-xl z-[75] flex items-center justify-center p-6"
                        onClick={() => setIsFamilyGalleryOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[40px] w-full max-w-sm p-8 shadow-2xl relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-[20px] font-semibold text-black tracking-tight">Вся семья</h3>
                                <button onClick={() => setIsFamilyGalleryOpen(false)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 active:scale-90 transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-6 max-h-[400px] overflow-y-auto no-scrollbar py-2">
                                {family.map((member, i) => (
                                    <motion.div
                                        key={member.id}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.03, type: "spring", stiffness: 200 }}
                                        className="flex flex-col items-center gap-2"
                                    >
                                        <div className="w-16 h-16 rounded-[24px] flex items-center justify-center bg-gray-50 border border-gray-100 shadow-sm relative group overflow-hidden">
                                            <User size={24} strokeWidth={1.5} className="text-gray-400 group-hover:scale-110 transition-transform duration-500" />
                                            <div className="absolute inset-0 border border-black/5 rounded-[24px]" />
                                        </div>
                                        <p className="text-[12px] font-semibold text-black truncate w-full text-center">{member.name}</p>
                                    </motion.div>
                                ))}
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    className="flex flex-col items-center gap-2"
                                    onClick={() => { setIsFamilyGalleryOpen(false); setIsAddFamilyOpen(true); }}
                                >
                                    <div className="w-16 h-16 rounded-[24px] bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-gray-400">
                                        <Plus size={20} />
                                    </div>
                                    <p className="text-[12px] font-medium text-gray-400">Добавить</p>
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Event Detail Bottom Sheet */}
                {selectedEvent && (
                    <motion.div
                        key="event-detail-backdrop"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[85]"
                        onClick={() => setSelectedEvent(null)}
                    />
                )}
                {selectedEvent && (
                    <motion.div
                        key="event-detail-sheet"
                        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 inset-x-0 z-[90] bg-white rounded-t-[48px] overflow-hidden flex flex-col"
                    >
                        <div className="p-8 pb-12">
                            <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-10" />
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-[24px] font-semibold text-black leading-none tracking-tight">Событие</h2>
                                <button onClick={() => setSelectedEvent(null)} className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 active:scale-95 transition-all"><X size={24} /></button>
                            </div>

                            <div className="flex items-center gap-6 mb-10">
                                <div className={cn(
                                    "w-20 h-20 rounded-[32px] flex items-center justify-center",
                                    selectedEvent.type === 'birthday' ? "bg-pink-50 text-pink-500" :
                                        selectedEvent.type === 'anniversary' ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"
                                )}>
                                    {selectedEvent.type === 'birthday' ? <Cake size={36} strokeWidth={1.5} /> :
                                        selectedEvent.type === 'anniversary' ? <Heart size={36} strokeWidth={1.5} /> : <Users size={36} strokeWidth={1.5} />}
                                </div>
                                <div>
                                    <h3 className="text-[22px] font-semibold text-black leading-tight">{selectedEvent.title}</h3>
                                    <div className="flex items-center gap-2 mt-2 text-gray-400">
                                        <CalendarIcon size={16} />
                                        <span className="text-[15px] font-medium">
                                            {selectedEvent.date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={() => router.push('/catalog')}
                                    className="w-full py-5 bg-gray-50 text-gray-900 text-[17px] font-semibold rounded-[32px] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                >
                                    <Gift size={20} strokeWidth={1.5} />
                                    Подобрать подарок
                                </button>

                                <button
                                    onClick={() => setIsDeleteConfirmOpen(true)}
                                    className="w-full py-5 bg-red-50 text-red-500 text-[17px] font-semibold rounded-[32px] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                >
                                    <Trash2 size={20} strokeWidth={1.5} />
                                    Удалить событие
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Delete Confirmation Alert */}
                {isDeleteConfirmOpen && (
                    <motion.div
                        key="delete-confirm-overlay"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex items-center justify-center p-8"
                        onClick={() => setIsDeleteConfirmOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[40px] w-full max-w-sm p-8 shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="text-center space-y-4 mb-8">
                                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto">
                                    <Trash2 size={32} strokeWidth={1.5} />
                                </div>
                                <h3 className="text-[22px] font-semibold text-black tracking-tight">
                                    {selectedEvent?.family_member_id ? "Удалить контакт?" : "Вы уверены?"}
                                </h3>
                                <p className="text-[15px] font-medium text-gray-400">
                                    {selectedEvent?.family_member_id
                                        ? "Все связанные события этого человека также будут удалены."
                                        : "Событие будет удалено навсегда. Это действие нельзя отменить."}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setIsDeleteConfirmOpen(false)}
                                    className="py-4 bg-gray-50 text-gray-900 text-[16px] font-semibold rounded-[24px] active:scale-95 transition-all"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={() => selectedEvent && handleDeleteEvent(selectedEvent.id)}
                                    className="py-4 bg-red-500 text-white text-[16px] font-semibold rounded-[24px] active:scale-95 transition-all shadow-lg shadow-red-500/20"
                                >
                                    Удалить
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Date Picker for Family Form */}
                {isMemberDatePickerOpen && (
                    <motion.div
                        key="member-date-picker-overlay"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-xl z-[80] flex items-center justify-center p-6"
                        onClick={() => setIsMemberDatePickerOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[48px] w-full max-w-sm p-10 shadow-2xl relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-[22px] font-semibold text-black tracking-tight">День рождения</h3>
                                <button onClick={() => setIsMemberDatePickerOpen(false)} className="p-2 bg-gray-50 rounded-full text-gray-400 active:scale-90 transition-all">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="grid grid-cols-7 gap-2">
                                {getDaysInMonth(currentDate).map((date, i) => {
                                    if (!date) return <div key={`member-picker-empty-${i}`} />
                                    const isSel = date.toDateString() === newMemberBirthday.toDateString()
                                    return (
                                        <motion.button
                                            whileTap={{ scale: 0.92 }}
                                            key={`member-picker-date-${date.getTime()}-${i}`}
                                            onClick={() => { setNewMemberBirthday(date); setIsMemberDatePickerOpen(false) }}
                                            className={cn(
                                                "h-10 w-10 flex items-center justify-center rounded-2xl text-[15px] font-semibold transition-all duration-300",
                                                isSel ? "bg-black text-white" : "text-gray-900 hover:bg-gray-50"
                                            )}
                                        >
                                            {date.getDate()}
                                        </motion.button>
                                    )
                                })}
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Add Family Member Bottom Sheet */}
                {isAddFamilyOpen && (
                    <motion.div
                        key="add-family-backdrop"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55]"
                        onClick={() => setIsAddFamilyOpen(false)}
                    />
                )}
                {isAddFamilyOpen && (
                    <motion.div
                        key="add-family-sheet"
                        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 inset-x-0 z-[60] bg-white rounded-t-[48px] overflow-hidden max-h-[90vh] flex flex-col"
                    >
                        <div className="p-8 pb-12">
                            <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-10" />
                            <div className="flex items-center justify-between mb-10">
                                <h2 className="text-[28px] font-semibold text-black leading-none tracking-tight">Новый член семьи</h2>
                                <button onClick={() => setIsAddFamilyOpen(false)} className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 active:scale-95 transition-all"><X size={24} /></button>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-gray-50/50 p-6 rounded-[32px] border border-gray-100/50">
                                    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest ml-1">Имя</label>
                                    <input
                                        type="text"
                                        value={newMemberName}
                                        onChange={(e) => setNewMemberName(e.target.value)}
                                        placeholder="Например: Мама"
                                        className="w-full bg-transparent text-[19px] font-medium text-black outline-none placeholder:text-gray-300 mt-2"
                                    />
                                </div>

                                <div className="bg-gray-50/50 p-6 rounded-[32px] border border-gray-100/50">
                                    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest ml-1">Кто это?</label>
                                    <input
                                        type="text"
                                        value={newMemberRelation}
                                        onChange={(e) => setNewMemberRelation(e.target.value)}
                                        placeholder="Например: Мама, Сестра"
                                        className="w-full bg-transparent text-[19px] font-medium text-black outline-none placeholder:text-gray-300 mt-2"
                                    />
                                </div>

                                <div onClick={() => setIsMemberDatePickerOpen(true)} className="bg-gray-50/50 p-6 rounded-[32px] border border-gray-100/50 cursor-pointer active:bg-gray-100 transition-colors">
                                    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest ml-1">День рождения</label>
                                    <div className="text-[19px] font-medium text-black mt-2">{newMemberBirthday.toLocaleDateString('ru-RU')}</div>
                                </div>

                                <button
                                    onClick={handleSaveFamilyMember}
                                    className="w-full py-5 bg-black text-white text-[18px] font-semibold rounded-[32px] active:scale-[0.98] transition-all"
                                >
                                    Добавить в семью
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Help / Information Modal */}
                {isHelpOpen && (
                    <motion.div
                        key="help-overlay"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-md z-[110] flex items-center justify-center p-8"
                        onClick={() => setIsHelpOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[40px] w-full max-w-sm p-8 shadow-2xl relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-black">
                                    <Info size={24} strokeWidth={1.5} />
                                </div>
                                <button onClick={() => setIsHelpOpen(false)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 active:scale-90 transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            <h3 className="text-[22px] font-bold text-black tracking-tight mb-6 lowercase">о календаре</h3>

                            <div className="space-y-6 mb-10">
                                {[
                                    { title: "События", text: "Планируйте дни рождения и праздники вашей семьи" },
                                    { title: "Обратный отсчет", text: "Смотрите, сколько дней осталось до каждого праздника" },
                                    { title: "Подарки", text: "Переходите в каталог, чтобы сразу подобрать идеальный подарок" }
                                ].map((item, id) => (
                                    <div key={id} className="flex gap-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-black mt-2 shrink-0" />
                                        <div>
                                            <p className="text-[16px] font-bold text-black leading-none mb-1">{item.title}</p>
                                            <p className="text-[14px] font-medium text-gray-400 leading-relaxed">{item.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => setIsHelpOpen(false)}
                                className="w-full py-5 bg-black text-white text-[17px] font-semibold rounded-[28px] active:scale-[0.98] transition-all"
                            >
                                Понятно
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isAddEventOpen && <BottomNav />}
        </main>
    )
}
