"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ArrowUpRight, ArrowDownLeft, Wallet, TrendingUp, Calendar as CalendarIcon, Download, X, Filter, Check, User, Package, MoreVertical, Trash2, AlertCircle, Info, Phone, ShoppingCart, UserCheck, MessageSquare, CreditCard } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth, subWeeks, subMonths } from "date-fns"
import { ru } from "date-fns/locale"
import { api } from "@/services/api"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Calendar } from "@/components/ui/calendar"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export default function FinancePage() {
    const [period, setPeriod] = useState("Эта неделя")
    const [date, setDate] = useState<Date | undefined>(undefined)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [transactions, setTransactions] = useState<any[]>([])
    const [stats, setStats] = useState({ balance: 0, income: 0, expense: 0 })
    const [selectedTx, setSelectedTx] = useState<any>(null)
    const [isClosingTx, setIsClosingTx] = useState(false)
    const [chartData, setChartData] = useState<any[]>([])
    const [isDeleting, setIsDeleting] = useState(false)
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
    const [isChartDetailsOpen, setIsChartDetailsOpen] = useState(false)

    const formatNumber = (num: number) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")

    const fetchData = async () => {
        try {
            // Fetch all data
            const [expenses, allOrders] = await Promise.all([api.getExpenses(), api.getOrders()])

            // Calculate period range
            const now = new Date()
            let start: Date, end: Date

            if (date) {
                // Custom day view
                start = new Date(date)
                start.setHours(0, 0, 0, 0)
                end = new Date(date)
                end.setHours(23, 59, 59, 999)
            } else if (period === "Эта неделя") {
                start = startOfWeek(now, { weekStartsOn: 1 })
                end = endOfWeek(now, { weekStartsOn: 1 })
            } else if (period === "Прошлая неделя") {
                const last = subWeeks(now, 1)
                start = startOfWeek(last, { weekStartsOn: 1 })
                end = endOfWeek(last, { weekStartsOn: 1 })
            } else if (period === "Этот месяц") {
                start = startOfMonth(now)
                end = endOfMonth(now)
            } else if (period === "Прошлый месяц") {
                const last = subMonths(now, 1)
                start = startOfMonth(last)
                end = endOfMonth(last)
            } else {
                // Default/Fallback
                start = startOfWeek(now, { weekStartsOn: 1 })
                end = endOfWeek(now, { weekStartsOn: 1 })
            }

            // Map Expenses
            const mappedExpenses = expenses.map(item => ({
                id: `exp-${item.id}`,
                title: item.category,
                type: 'expense' as const,
                date: new Date(item.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
                isoDate: item.date,
                amount: formatNumber(item.amount),
                rawAmount: item.amount,
                icon: ArrowDownLeft,
                raw: item
            }))

            // Map Income Orders (new, paid, done, shipping)
            const incomeOrders = allOrders.filter(o =>
                o.status === 'paid' || o.status === 'done' || o.status === 'shipping' || o.status === 'processing' || o.status === 'new'
            )

            const mappedIncome = incomeOrders.map(order => ({
                id: `ord-${order.id}`,
                title: `Заказ #${order.id} (${order.client})`,
                type: 'income' as const,
                date: `${order.date}, ${order.time}`,
                isoDate: order.createdAt,
                amount: formatNumber(order.total),
                rawAmount: order.total,
                icon: ArrowUpRight,
                raw: order
            }))

            // 1. Calculate Stats based ONLY on selected period
            let currentIncome = 0
            let currentExpense = 0

            mappedExpenses.forEach(item => {
                const d = new Date(item.isoDate)
                if (d >= start && d <= end) {
                    currentExpense += item.rawAmount
                }
            })

            mappedIncome.forEach(item => {
                const d = new Date(item.isoDate)
                if (d >= start && d <= end) {
                    currentIncome += item.rawAmount
                }
            })

            setStats({
                balance: currentIncome - currentExpense,
                income: currentIncome,
                expense: currentExpense
            })

            // 2. Filter list of transactions to show ONLY for selected period
            const allMapped = [...mappedExpenses, ...mappedIncome]
            const periodTransactions = allMapped.filter(tx => {
                const d = new Date(tx.isoDate)
                return d >= start && d <= end
            }).sort((a, b) => {
                const dateA = a.isoDate ? new Date(a.isoDate).getTime() : 0
                const dateB = b.isoDate ? new Date(b.isoDate).getTime() : 0
                return dateB - dateA
            })

            setTransactions(periodTransactions)

            // 3. Calculate Chart Data
            const daysInPeriod = eachDayOfInterval({ start, end })
            const chartSource = daysInPeriod.map(day => {
                const dayIncome = mappedIncome
                    .filter(i => isSameDay(new Date(i.isoDate), day))
                    .reduce((sum, curr) => sum + curr.rawAmount, 0)

                const dayExpense = mappedExpenses
                    .filter(e => isSameDay(new Date(e.isoDate), day))
                    .reduce((sum, curr) => sum + curr.rawAmount, 0)

                const labelIncome = dayIncome > 0
                    ? (dayIncome >= 1000000 ? `${(dayIncome / 1000000).toFixed(1)}м` : `${(dayIncome / 1000).toFixed(0)}к`)
                    : ''

                const labelExpense = dayExpense > 0
                    ? (dayExpense >= 1000000 ? `${(dayExpense / 1000000).toFixed(1)}м` : `${(dayExpense / 1000).toFixed(0)}к`)
                    : ''

                return {
                    day: format(day, daysInPeriod.length > 7 ? 'd' : 'EEEEEE', { locale: ru }),
                    income: dayIncome,
                    expense: dayExpense,
                    labelIncome,
                    labelExpense,
                    fullDay: format(day, 'd MMMM', { locale: ru })
                }
            })

            const maxRefVal = Math.max(...chartSource.map(s => Math.max(s.income, s.expense)), 1000)
            const finalChartData = chartSource.map(s => ({
                ...s,
                incomeHeight: (s.income / maxRefVal) * 100,
                expenseHeight: (s.expense / maxRefVal) * 100,
            }))

            setChartData(finalChartData)

        } catch (e) {
            console.error(e)
            toast.error("Ошибка при загрузке данных")
        }
    }

    // Filtering State
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest')

    // Scroll Lock
    useEffect(() => {
        if (selectedTx || isFilterOpen || isDialogOpen || isChartDetailsOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [selectedTx, isFilterOpen, isDialogOpen, isChartDetailsOpen])

    useEffect(() => {
        fetchData()
    }, [period, date])

    const handleCloseTx = () => {
        setIsClosingTx(true)
        setTimeout(() => {
            setSelectedTx(null)
            setIsClosingTx(false)
        }, 300)
    }

    const handleDelete = async () => {
        if (!selectedTx) return
        setIsDeleting(true)
        try {
            if (selectedTx.type === 'expense') {
                await api.deleteExpense(selectedTx.raw.id)
            } else {
                await api.deleteOrder(selectedTx.raw.id)
            }
            toast.success("Успешно удалено")
            setIsDeleteConfirmOpen(false)
            handleCloseTx()
            fetchData()
        } catch (e) {
            console.error(e)
            toast.error("Ошибка при удалении")
        } finally {
            setIsDeleting(false)
        }
    }

    // Filter Logic
    const filteredTransactions = transactions.filter(tx => {
        if (filterType === 'all') return true
        return tx.type === filterType
    }).sort((a, b) => {
        const dA = a.isoDate ? new Date(a.isoDate).getTime() : 0
        const dB = b.isoDate ? new Date(b.isoDate).getTime() : 0
        if (sortOrder === 'newest') return dB - dA
        if (sortOrder === 'oldest') return dA - dB
        if (sortOrder === 'highest') return b.rawAmount - a.rawAmount
        if (sortOrder === 'lowest') return a.rawAmount - b.rawAmount
        return 0
    })

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[340px] p-0 bg-white/90 backdrop-blur-[32px] rounded-[32px] border border-white/40 shadow-2xl z-[60] [&>button]:hidden">
                    <div className="flex items-center justify-between p-5 pb-2">
                        <DialogTitle className="font-bold text-lg text-gray-900 ml-2 tracking-tight">Выберите дату</DialogTitle>
                        <button
                            onClick={() => setIsDialogOpen(false)}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                        >
                            <X size={20} strokeWidth={2.5} />
                        </button>
                    </div>

                    <div className="px-4 pb-6 pt-0 flex justify-center">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(d) => {
                                setDate(d)
                                if (d) {
                                    setPeriod(format(d, "d MMM yyyy", { locale: ru }))
                                    setIsDialogOpen(false)
                                }
                            }}
                            locale={ru}
                            className="p-3 bg-transparent"
                            classNames={{
                                day_selected: "bg-blue-600 text-white hover:bg-blue-600 rounded-2xl shadow-lg shadow-blue-200",
                                day_today: "bg-blue-50 text-blue-600 font-bold rounded-2xl",
                                day: "h-11 w-11 p-0 font-semibold text-gray-700 hover:bg-gray-100 rounded-2xl transition-all flex items-center justify-center",
                                head_cell: "text-gray-400 font-bold text-xs w-11",
                                nav_button: "border border-gray-100 bg-white hover:bg-blue-50 transition-colors shadow-sm rounded-xl",
                                caption: "flex justify-center pt-1 relative items-center mb-4 font-bold text-gray-900"
                            }}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            <div className="pt-8 px-6 mb-8">
                <div className="flex items-center justify-between mb-8">
                    <Link href="/profile" className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-blue-600 hover:border-blue-100 transition-all active:scale-95">
                        <ChevronLeft size={22} />
                    </Link>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">Финансы</h1>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all active:scale-95">
                                <CalendarIcon size={20} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={12} className="w-56 p-3 rounded-3xl bg-white/95 backdrop-blur-xl border border-gray-100 shadow-2xl z-50">
                            <DropdownMenuLabel className="px-3 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Период</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => { setPeriod("Эта неделя"); setDate(undefined); }} className="rounded-xl px-3 py-3 font-semibold text-gray-700 focus:bg-blue-50 focus:text-blue-600 mt-1 transition-colors">
                                Эта неделя
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setPeriod("Прошлая неделя"); setDate(undefined); }} className="rounded-xl px-3 py-3 font-semibold text-gray-700 focus:bg-blue-50 focus:text-blue-600 transition-colors">
                                Прошлая неделя
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-gray-100 my-2" />
                            <DropdownMenuItem onClick={() => { setPeriod("Этот месяц"); setDate(undefined); }} className="rounded-xl px-3 py-3 font-semibold text-gray-700 focus:bg-blue-50 focus:text-blue-600 transition-colors">
                                Этот месяц
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setPeriod("Прошлый месяц"); setDate(undefined); }} className="rounded-xl px-3 py-3 font-semibold text-gray-700 focus:bg-blue-50 focus:text-blue-600 transition-colors">
                                Прошлый месяц
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-gray-100 my-2" />
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.preventDefault()
                                    setIsDialogOpen(true)
                                }}
                                className="rounded-xl px-3 py-3 font-bold text-blue-600 focus:bg-blue-50 transition-colors"
                            >
                                Выбрать даты...
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <TrendingUp size={16} />
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Приход</span>
                        </div>
                        <div className="text-xl font-bold text-emerald-600 tracking-tight">+{formatNumber(stats.income)}</div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 transform rotate-180">
                                <TrendingUp size={16} />
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Расход</span>
                        </div>
                        <div className="text-xl font-bold text-rose-600 tracking-tight">-{formatNumber(stats.expense)}</div>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm flex flex-col mb-8 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                                <Wallet size={14} className="text-blue-500" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                    {date ? format(date, 'd MMMM', { locale: ru }) : period}
                                </span>
                            </div>
                        </div>

                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Итоговый баланс</div>
                        <div className="flex items-baseline gap-1.5">
                            <div className="text-3xl font-bold tracking-tight text-gray-900">{formatNumber(stats.balance)}</div>
                            <div className="text-sm font-semibold text-gray-400">сум</div>
                        </div>
                    </div>
                </motion.div>

                <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm mb-8 overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-base font-bold text-gray-900 leading-none mb-1">Динамика</h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Приход / Расход</p>
                        </div>
                        <button
                            onClick={() => setIsChartDetailsOpen(true)}
                            className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest"
                        >
                            Детали
                        </button>
                    </div>

                    <div className="h-32 flex items-end justify-between gap-1 px-1 relative">
                        {chartData.map((data, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end relative">
                                <div className="flex gap-[1px] items-end justify-center w-full h-full relative z-[2]">
                                    <div className="flex flex-col items-center flex-1 h-full justify-end">
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${data.incomeHeight}%` }}
                                            transition={{ duration: 0.8, delay: i * 0.03, ease: [0.23, 1, 0.32, 1] }}
                                            className="w-full rounded-t-sm min-h-[2px] bg-blue-500"
                                        />
                                    </div>
                                    <div className="flex flex-col items-center flex-1 h-full justify-end">
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${data.expenseHeight}%` }}
                                            transition={{ duration: 0.8, delay: i * 0.03 + 0.1, ease: [0.23, 1, 0.32, 1] }}
                                            className="w-full rounded-t-sm min-h-[2px] bg-rose-400"
                                        />
                                    </div>
                                </div>
                                <div className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">{data.day}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-gray-900 tracking-tight">История</h3>
                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-blue-600 transition-all active:scale-95"
                    >
                        <Filter size={18} />
                    </button>
                </div>

                <div className="space-y-3">
                    {filteredTransactions.length > 0 ? (
                        filteredTransactions.map((tx) => (
                            <motion.div
                                key={tx.id}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedTx(tx)}
                                className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm flex items-center justify-between transition-all hover:border-blue-100 group cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                                        <tx.icon size={20} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900 line-clamp-1 pr-2 text-[14px] mb-0.5 tracking-tight group-hover:text-blue-600 transition-colors">
                                            {tx.type === 'income' ? (tx.raw?.client || tx.title) : tx.title}
                                        </div>
                                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{tx.date}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`font-bold text-base mb-0.5 tracking-tight ${tx.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {tx.type === 'income' ? '+' : '-'}{tx.amount}
                                    </div>
                                    <div className="text-[8px] font-bold text-gray-300 uppercase leading-none">UZS</div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="py-24 bg-white rounded-[40px] border border-gray-100 flex flex-col items-center justify-center text-center px-10 shadow-sm">
                            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-200 mb-6">
                                <Wallet size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Операций не найдено</h3>
                            <p className="text-sm font-semibold text-gray-400 max-w-[240px]">За этот период транзакций пока нет</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Transaction Detail Overlay */}
            <AnimatePresence>
                {selectedTx && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[100]"
                            onClick={handleCloseTx}
                        />

                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: isClosingTx ? "100%" : "0%" }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 35, stiffness: 350, mass: 1 }}
                            className="fixed bottom-0 left-0 right-0 h-[85vh] bg-gray-50 rounded-t-[40px] shadow-2xl z-[110] flex flex-col overflow-hidden"
                        >
                            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-6" onClick={handleCloseTx} />

                            <div className="px-6 pb-4 flex items-center justify-between bg-transparent">
                                <button onClick={handleCloseTx} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400">
                                    <X size={20} strokeWidth={2.5} />
                                </button>
                                <span className="font-bold text-base text-gray-900">Операция</span>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400">
                                            <MoreVertical size={20} strokeWidth={2.5} />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" sideOffset={8} className="w-56 p-2 rounded-2xl bg-white border border-gray-100 shadow-xl z-[120]">
                                        <DropdownMenuItem className="rounded-xl px-4 py-2.5 font-bold text-[13px] text-gray-800 focus:bg-gray-50">
                                            Скачать чек
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => setIsDeleteConfirmOpen(true)}
                                            className="rounded-xl px-4 py-2.5 font-bold text-[13px] text-rose-600 focus:bg-rose-50"
                                        >
                                            Удалить запись
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1 space-y-6 no-scrollbar">
                                {/* Hero Card */}
                                <div className="bg-white rounded-[32px] p-8 flex flex-col items-center text-center shadow-sm border border-gray-100 relative overflow-hidden">
                                    <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center mb-4 shadow-sm ${selectedTx.type === 'income' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                        <selectedTx.icon size={36} strokeWidth={2.5} />
                                    </div>
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{selectedTx.type === 'income' ? 'Приход' : 'Расход'}</h4>
                                    <div className="flex items-baseline gap-1.5">
                                        <div className={`text-3xl font-bold tracking-tight ${selectedTx.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {selectedTx.type === 'income' ? '+' : '-'}{selectedTx.amount}
                                        </div>
                                        <div className="text-sm font-bold text-gray-300">сум</div>
                                    </div>
                                </div>

                                {/* Order details */}
                                {selectedTx.type === 'income' && selectedTx.raw && (
                                    <>
                                        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 space-y-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <User size={16} className="text-blue-500" />
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">Клиент</span>
                                            </div>
                                            <div className="bg-gray-50 rounded-[24px] p-4 flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                                                    <UserCheck size={24} className="text-gray-400" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-[15px] text-gray-900">{selectedTx.raw.client}</div>
                                                    <div className="text-[11px] font-medium text-gray-400 flex items-center gap-1.5">
                                                        <Phone size={10} /> {selectedTx.raw.clientPhone || 'Нет телефона'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {selectedTx.raw.items && selectedTx.raw.items.length > 0 && (
                                            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <ShoppingCart size={16} className="text-orange-500" />
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Товары</span>
                                                </div>
                                                <div className="space-y-2">
                                                    {selectedTx.raw.items.map((item: any, idx: number) => (
                                                        <div key={idx} className="flex items-center justify-between p-3 rounded-[20px] bg-gray-50">
                                                            <div className="flex items-center gap-3">
                                                                {item.image ? (
                                                                    <img src={item.image} className="w-10 h-10 rounded-lg object-cover shadow-sm" />
                                                                ) : (
                                                                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-gray-300">
                                                                        <Package size={18} />
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <div className="font-bold text-[13px] text-gray-900 line-clamp-1">{item.name}</div>
                                                                    <div className="text-[10px] font-medium text-gray-400">{item.quantity} x {formatNumber(item.price)}</div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right font-bold text-[13px]">
                                                                {formatNumber(item.price * item.quantity)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 space-y-5">
                                    <div className="flex justify-between items-center text-[13px]">
                                        <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">Дата</span>
                                        <span className="text-gray-900 font-bold">{selectedTx.date}</span>
                                    </div>
                                    <div className="h-px bg-gray-50 w-full" />
                                    <div className="flex justify-between items-center text-[13px]">
                                        <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">Категория</span>
                                        <span className="text-gray-900 font-bold capitalize">{selectedTx.title}</span>
                                    </div>
                                    <div className="h-px bg-gray-50 w-full" />
                                    <div className="flex justify-between items-center text-[13px]">
                                        <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">ID</span>
                                        <span className="font-mono text-blue-500 font-bold">#{selectedTx.id.split('-').pop()?.toUpperCase()}</span>
                                    </div>
                                </div>

                                {(selectedTx.raw?.comment || selectedTx.raw?.note) && (
                                    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
                                        <div className="text-gray-400 font-bold text-[10px] uppercase tracking-wider mb-3">Заметка</div>
                                        <p className="text-gray-900 font-medium text-[14px] leading-relaxed italic bg-gray-50 p-4 rounded-[20px] border-l-4 border-blue-500">
                                            «{selectedTx.raw.comment || selectedTx.raw.note}»
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 pb-12 bg-white border-t border-gray-100">
                                <button
                                    onClick={handleCloseTx}
                                    className="w-full bg-blue-600 text-white font-bold text-base py-4 rounded-2xl shadow-lg transition-all"
                                >
                                    Закрыть
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Chart Dynamics Details Modal */}
            <AnimatePresence>
                {isChartDetailsOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[150]"
                            onClick={() => setIsChartDetailsOpen(false)}
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 32, stiffness: 350 }}
                            className="fixed inset-x-0 bottom-0 z-[160] h-[90vh] bg-white rounded-t-[48px] flex flex-col overflow-hidden"
                        >
                            <div className="w-14 h-1.5 bg-gray-200 rounded-full mx-auto my-6" />
                            <div className="px-8 pb-6 flex items-center justify-between border-b border-gray-100 bg-white">
                                <button onClick={() => setIsChartDetailsOpen(false)} className="w-11 h-11 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:bg-blue-600 transition-all">
                                    <X size={22} />
                                </button>
                                <span className="font-bold text-lg text-gray-900">Детальная динамика</span>
                                <div className="w-11" />
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {chartData.map((data, i) => (
                                    <div key={i} className="bg-gray-50 rounded-[28px] p-5 flex items-center justify-between">
                                        <div>
                                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{data.fullDay}</div>
                                            <div className="text-[15px] font-bold text-gray-900 capitalize">{data.day}</div>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <div className="text-emerald-600 font-bold text-sm">+{formatNumber(data.income)} сум</div>
                                            <div className="text-rose-500 font-bold text-sm">-{formatNumber(data.expense)} сум</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-8 pb-14 bg-white border-t border-gray-100">
                                <button
                                    onClick={() => setIsChartDetailsOpen(false)}
                                    className="w-full bg-blue-600 text-white font-bold text-lg py-5 rounded-3xl shadow-xl shadow-blue-200 active:scale-95 transition-all"
                                >
                                    Закрыть
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Filter Overlay */}
            <AnimatePresence>
                {isFilterOpen && (
                    <>
                        <div className="fixed inset-0 z-[160] bg-gray-900/60 backdrop-blur-md" onClick={() => setIsFilterOpen(false)} />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 32, stiffness: 350 }}
                            className="fixed bottom-0 left-0 right-0 z-[170] bg-white rounded-t-[48px] p-10 pb-16"
                        >
                            <div className="flex items-center justify-between mb-10">
                                <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Фильтры</h3>
                                <button onClick={() => setIsFilterOpen(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:text-blue-600 transition-all">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-10">
                                <div>
                                    <label className="text-gray-400 font-bold text-xs uppercase tracking-[2px] block mb-5">Категории</label>
                                    <div className="flex flex-wrap gap-3">
                                        {['all', 'income', 'expense'].map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => setFilterType(t as any)}
                                                className={`px-6 py-4 rounded-2xl text-[13px] font-bold transition-all ${filterType === t ? 'bg-blue-600 text-white shadow-xl' : 'bg-gray-100 text-gray-500'}`}
                                            >
                                                {t === 'all' ? 'Все операции' : t === 'income' ? 'Приходы' : 'Расходы'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setIsFilterOpen(false)}
                                    className="w-full bg-blue-600 text-white font-bold text-lg py-5 rounded-3xl shadow-xl shadow-blue-200 mt-4 active:scale-95 transition-all"
                                >
                                    Применить
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Delete Confirm Modal */}
            <AnimatePresence>
                {isDeleteConfirmOpen && (
                    <div className="fixed inset-0 z-[200] bg-gray-900/40 backdrop-blur-sm flex items-end justify-center" onClick={() => setIsDeleteConfirmOpen(false)}>
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: "0%" }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 32, stiffness: 350 }}
                            className="w-full bg-white rounded-t-[48px] p-10 pb-16 safe-area-bottom shadow-4xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-rose-50 rounded-[32px] flex items-center justify-center text-rose-600 mb-8 border border-rose-100 shadow-sm">
                                    <AlertCircle size={40} />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Удалить операцию?</h3>
                                <p className="text-gray-500 font-semibold mb-10 max-w-[280px]">
                                    Данные будут удалены навсегда из вашей отчетности.
                                </p>

                                <div className="flex flex-col gap-4 w-full">
                                    <button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="w-full bg-rose-600 text-white font-bold text-lg py-5 rounded-3xl shadow-xl shadow-rose-100 active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        {isDeleting ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" /> : 'Да, удалить'}
                                    </button>
                                    <button
                                        onClick={() => setIsDeleteConfirmOpen(false)}
                                        className="w-full bg-gray-100 text-gray-700 font-bold text-lg py-5 rounded-3xl"
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
