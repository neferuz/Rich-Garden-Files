"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ArrowUpRight, ArrowDownLeft, Wallet, TrendingUp, Calendar as CalendarIcon, Download, X, Filter, Check, User, Package } from "lucide-react"
import Link from "next/link"
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
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [transactions, setTransactions] = useState<any[]>([])
    const [stats, setStats] = useState({ balance: 0, income: 0, expense: 0 })
    const [selectedTx, setSelectedTx] = useState<any>(null)
    const [isClosingTx, setIsClosingTx] = useState(false)
    const [chartData, setChartData] = useState<any[]>([])

    // Filtering State
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest')

    const formatNumber = (num: number) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")

    // Scroll Lock
    useEffect(() => {
        if (selectedTx || isFilterOpen || isDialogOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [selectedTx, isFilterOpen, isDialogOpen])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [expenses, orders] = await Promise.all([api.getExpenses(), api.getOrders()])

                let totalIncome = 0
                let totalExpense = 0

                const expenseItems = expenses.map(item => {
                    totalExpense += item.amount
                    return {
                        id: `exp-${item.id}`,
                        title: item.category,
                        type: 'expense',
                        date: new Date(item.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
                        isoDate: item.date,
                        amount: formatNumber(item.amount),
                        rawAmount: item.amount,
                        icon: ArrowDownLeft,
                        raw: item
                    }
                })

                const incomeItems = orders.map(order => {
                    const total = order.total || 0;
                    totalIncome += total
                    return {
                        id: `ord-${order.id}`,
                        title: `Заказ #${order.id} (${order.client})`,
                        type: 'income',
                        date: `${order.date}, ${order.time}`,
                        isoDate: order.createdAt,
                        amount: formatNumber(total),
                        rawAmount: total,
                        icon: ArrowUpRight,
                        raw: order
                    }
                })

                const all = [...expenseItems, ...incomeItems].sort((a, b) => {
                    const dateA = a.isoDate ? new Date(a.isoDate).getTime() : 0
                    const dateB = b.isoDate ? new Date(b.isoDate).getTime() : 0
                    return dateB - dateA
                })

                setTransactions(all)
                setStats({
                    balance: totalIncome - totalExpense,
                    income: totalIncome,
                    expense: totalExpense
                })

                // --- Calculate Chart Data (Income) ---
                const now = new Date()
                let start, end

                if (period === "Эта неделя") {
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
                    start = startOfWeek(now, { weekStartsOn: 1 })
                    end = endOfWeek(now, { weekStartsOn: 1 })
                }

                const days = eachDayOfInterval({ start, end })
                const statsMap = days.map(day => {
                    const dayIncome = incomeItems
                        .filter(i => {
                            if (!i.isoDate) return false
                            return isSameDay(new Date(i.isoDate), day)
                        })
                        .reduce((sum, curr) => sum + curr.rawAmount, 0)

                    const label = dayIncome > 0 ? `${(dayIncome / 1000000).toFixed(1)}м` : ''
                    return {
                        day: format(day, days.length > 7 ? 'd' : 'EEEEEE', { locale: ru }),
                        val: dayIncome,
                        label
                    }
                })

                let chartSource = statsMap
                if (statsMap.length > 10) {
                    chartSource = statsMap.slice(-7)
                }

                const maxVal = Math.max(...chartSource.map(s => s.val), 1)
                const finalChartData = chartSource.map(s => ({
                    day: s.day,
                    value: (s.val / maxVal) * 100,
                    label: s.label
                }))

                setChartData(finalChartData)
            } catch (e) {
                console.error(e)
            }
        }
        fetchData()
    }, [])

    const handleCloseTx = () => {
        setIsClosingTx(true)
        setTimeout(() => {
            setSelectedTx(null)
            setIsClosingTx(false)
        }, 300)
    }

    // Fallback for custom selection or standard
    const activeChartData = chartData.length > 0 ? chartData : []

    // Filter Logic
    const filteredTransactions = transactions.filter(tx => {
        if (filterType === 'all') return true
        return tx.type === filterType
    }).sort((a, b) => {
        if (sortOrder === 'newest') {
            // Already sorted by fetch, but ensuring
            const dateA = a.raw?.isoDate ? new Date(a.raw.isoDate).getTime() : (a.raw?.createdAt ? new Date(a.raw.createdAt).getTime() : 0)
            const dateB = b.raw?.isoDate ? new Date(b.raw.isoDate).getTime() : (b.raw?.createdAt ? new Date(b.raw.createdAt).getTime() : 0)
            // Fallback to isoDate direct property if mapped
            const dA = a.isoDate ? new Date(a.isoDate).getTime() : dateA
            const dB = b.isoDate ? new Date(b.isoDate).getTime() : dateB
            return dB - dA
        }
        if (sortOrder === 'oldest') {
            const dA = a.isoDate ? new Date(a.isoDate).getTime() : 0
            const dB = b.isoDate ? new Date(b.isoDate).getTime() : 0
            return dA - dB
        }
        if (sortOrder === 'highest') {
            return b.rawAmount - a.rawAmount
        }
        if (sortOrder === 'lowest') {
            return a.rawAmount - b.rawAmount
        }
        return 0
    })

    return (
        <div className="min-h-screen bg-gray-50/50 pb-32">

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[340px] p-0 bg-white/80 backdrop-blur-[32px] rounded-[32px] overflow-hidden border border-white/40 shadow-2xl shadow-black/10 z-[60] [&>button]:hidden">
                    <div className="flex items-center justify-between p-5 pb-2">
                        <DialogTitle className="font-bold text-lg text-black ml-2 tracking-tight">Выберите дату</DialogTitle>
                        <button
                            onClick={() => setIsDialogOpen(false)}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-black/5 text-black/40 hover:bg-black hover:text-white transition-all duration-300 active:scale-90"
                        >
                            <X size={18} strokeWidth={2.5} />
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
                                day_selected: "bg-black text-white hover:bg-black hover:text-white focus:bg-black focus:text-white rounded-[14px] shadow-lg shadow-black/20",
                                day_today: "bg-black/5 text-black font-bold rounded-[14px]",
                                day: "h-9 w-9 p-0 font-medium text-black/70 aria-selected:opacity-100 hover:bg-black/5 rounded-[14px] transition-all",
                                head_cell: "text-black/40 font-medium text-[0.8rem] w-9",
                                cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-transparent focus-within:relative focus-within:z-20",
                                nav_button: "border border-black/10 bg-white/50 hover:bg-white hover:border-black/20 shadow-sm rounded-[10px]",
                                caption: "flex justify-center pt-1 relative items-center mb-2 font-bold text-black"
                            }}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Header */}
            <div className="pt-6 px-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                    <Link href="/profile" className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-100 text-gray-500 hover:text-black hover:bg-gray-50 transition-colors shadow-sm">
                        <ChevronLeft size={22} />
                    </Link>
                    <h1 className="text-xl font-bold text-gray-900">Финансы</h1>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-black text-white hover:bg-gray-800 transition-colors shadow-lg shadow-black/20 active:scale-95">
                                <CalendarIcon size={20} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={8} className="w-48 p-2 rounded-[24px] bg-white/95 backdrop-blur-xl border border-gray-100 shadow-xl shadow-black/5 z-50">
                            <DropdownMenuLabel className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Период</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setPeriod("Эта неделя")} className="rounded-[12px] px-3 py-2.5 font-medium cursor-pointer focus:bg-gray-50 focus:text-black hover:bg-gray-50">
                                Эта неделя
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPeriod("Прошлая неделя")} className="rounded-[12px] px-3 py-2.5 font-medium cursor-pointer focus:bg-gray-50 focus:text-black hover:bg-gray-50">
                                Прошлая неделя
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-gray-100 my-1" />
                            <DropdownMenuItem onClick={() => setPeriod("Этот месяц")} className="rounded-[12px] px-3 py-2.5 font-medium cursor-pointer focus:bg-gray-50 focus:text-black hover:bg-gray-50">
                                Этот месяц
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPeriod("Прошлый месяц")} className="rounded-[12px] px-3 py-2.5 font-medium cursor-pointer focus:bg-gray-50 focus:text-black hover:bg-gray-50">
                                Прошлый месяц
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-gray-100 my-1" />
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.preventDefault()
                                    setIsDialogOpen(true)
                                }}
                                className="rounded-[12px] px-3 py-2.5 font-medium text-[#2663eb] cursor-pointer focus:bg-blue-50 focus:text-[#2663eb] hover:bg-blue-50"
                            >
                                Выбрать даты...
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Main Balance Card */}
                <div className="bg-gradient-to-br from-[#2663eb] to-[#1a4bd6] rounded-[32px] p-6 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden mb-6">
                    {/* Decorative blurred circles - kept white/10 for blue bg */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -ml-6 -mb-6" />

                    <div className="relative z-10">
                        <span className="text-blue-100 text-sm font-medium mb-1 block">Общий баланс</span>
                        <h2 className="text-4xl font-bold mb-6 tracking-tight">{formatNumber(stats.balance)} <span className="text-xl font-normal text-blue-200">сум</span></h2>

                        <div className="flex gap-4">
                            <div className="flex-1 bg-white/10 rounded-2xl p-3 backdrop-blur-md border border-white/10">
                                <div className="flex items-center gap-2 mb-1 text-green-300">
                                    <div className="w-5 h-5 rounded-full bg-green-400/20 flex items-center justify-center">
                                        <ArrowUpRight size={12} strokeWidth={3} />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-green-100">Доход</span>
                                </div>
                                <span className="text-lg font-bold">{formatNumber(stats.income)}</span>
                            </div>
                            <div className="flex-1 bg-white/10 rounded-2xl p-3 backdrop-blur-md border border-white/10">
                                <div className="flex items-center gap-2 mb-1 text-white">
                                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                                        <ArrowDownLeft size={12} strokeWidth={3} />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-blue-100">Расход</span>
                                </div>
                                <span className="text-lg font-bold">{formatNumber(stats.expense)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chart Section */}
                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 mb-6">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <TrendingUp size={20} className="text-[#2663eb]" />
                            Статистика
                        </h3>
                        <span className="text-xs font-bold bg-blue-50 text-[#2663eb] px-3 py-1.5 rounded-xl">{period}</span>
                    </div>

                    {/* CSS Bar Chart */}
                    <div className="flex items-end justify-between h-40 gap-3 px-2">
                        {activeChartData.map((item: any, index: any) => (
                            <div key={index} className="flex flex-col items-center gap-3 flex-1 group cursor-pointer h-full justify-end">
                                <div className="w-full relative flex items-end justify-center h-full">
                                    <div
                                        className={`w-full max-w-[14px] rounded-[6px] transition-all duration-500 group-hover:opacity-80 min-h-[6px] relative
                                            ${item.value >= 80
                                                ? 'bg-[#2663eb] shadow-lg shadow-blue-200'
                                                : 'bg-gray-100 group-hover:bg-blue-200'
                                            }
                                        `}
                                        style={{ height: `${item.value}%` }}
                                    />
                                    {/* Tooltip on hover */}
                                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gray-900 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-xl pointer-events-none whitespace-nowrap z-20 shadow-xl -translate-y-2 group-hover:translate-y-0">
                                        {item.label}
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                                    </div>
                                </div>
                                <span className={`text-[12px] font-bold transition-colors ${item.value >= 80 ? 'text-[#2663eb]' : 'text-gray-400'}`}>
                                    {item.day}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-lg font-bold text-gray-900">Транзакции</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsFilterOpen(true)}
                                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${filterType !== 'all' || sortOrder !== 'newest' ? 'bg-[#2663eb] text-white shadow-lg shadow-blue-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                            >
                                <Filter size={16} strokeWidth={2.5} />
                            </button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors">
                                <Download size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        {filteredTransactions.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 text-sm">Нет транзакций</div>
                        ) : (
                            filteredTransactions.map((tx) => (
                                <div key={tx.id} onClick={() => { setIsClosingTx(false); setSelectedTx(tx); }} className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-100 flex items-center justify-between active:scale-[0.99] transition-transform cursor-pointer hover:shadow-md">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-[20px] flex items-center justify-center ${tx.type === 'income' ? 'bg-green-50 text-green-600' :
                                            tx.type === 'expense' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600'
                                            }`}>
                                            <tx.icon size={22} strokeWidth={2} />
                                        </div>
                                        <div className="flex flex-col">
                                            <h4 className="font-bold text-gray-900 text-[15px]">{tx.title}</h4>
                                            <span className="text-xs font-medium text-gray-400">{tx.date}</span>
                                        </div>
                                    </div>
                                    <span className={`font-bold text-[15px] ${tx.type === 'income' ? 'text-green-600' : 'text-gray-900'
                                        }`}>
                                        {tx.type === 'income' ? '+' : '-'}{tx.amount} сум
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>

            {/* Styles for animation */}
            <style jsx global>{`
                @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
                @keyframes slide-down { from { transform: translateY(0); } to { transform: translateY(100%); } }
                .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.32, 0.72, 0, 1) forwards; }
                .animate-slide-down { animation: slide-down 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards; }
            `}</style>

            {/* Filter Modal */}
            {isFilterOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-300" onClick={() => setIsFilterOpen(false)}>
                    <div className="w-full bg-white rounded-t-[32px] p-6 pb-10 animate-in slide-in-from-bottom duration-300 transform" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-center mb-6">
                            <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
                        </div>

                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-gray-900">Фильтры</h3>
                            <button onClick={() => { setFilterType('all'); setSortOrder('newest'); setIsFilterOpen(false); }} className="text-sm font-semibold text-[#2663eb]">
                                Сбросить
                            </button>
                        </div>

                        <div className="space-y-8">
                            {/* Type Filter */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Тип операции</h4>
                                <div className="flex gap-3">
                                    {[
                                        { id: 'all', label: 'Все' },
                                        { id: 'income', label: 'Доходы' },
                                        { id: 'expense', label: 'Расходы' }
                                    ].map(type => (
                                        <button
                                            key={type.id}
                                            onClick={() => setFilterType(type.id as any)}
                                            className={`flex-1 py-3 px-4 rounded-[20px] font-bold text-sm transition-all border-2 ${filterType === type.id
                                                ? 'bg-[#2663eb] text-white border-[#2663eb] shadow-lg shadow-blue-200'
                                                : 'bg-transparent text-gray-600 border-gray-100 hover:border-gray-200'
                                                }`}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sort Filter */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Сортировка</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { id: 'newest', label: 'Сначала новые' },
                                        { id: 'oldest', label: 'Сначала старые' },
                                        { id: 'highest', label: 'По сумме (max)' },
                                        { id: 'lowest', label: 'По сумме (min)' }
                                    ].map(sort => (
                                        <button
                                            key={sort.id}
                                            onClick={() => setSortOrder(sort.id as any)}
                                            className={`py-3 px-4 rounded-[20px] font-bold text-sm text-left transition-all flex items-center justify-between border-2 ${sortOrder === sort.id
                                                ? 'bg-blue-50 text-[#2663eb] border-blue-100'
                                                : 'bg-transparent text-gray-600 border-gray-100 hover:border-gray-200'
                                                }`}
                                        >
                                            {sort.label}
                                            {sortOrder === sort.id && <Check size={16} strokeWidth={3} />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => setIsFilterOpen(false)}
                                className="w-full bg-[#2663eb] text-white font-bold text-lg py-4 rounded-[24px] shadow-xl shadow-blue-200 mt-4 active:scale-[0.98] transition-all"
                            >
                                Применить
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Transaction Details Modal (ProductDetails Style) */}
            {selectedTx && (
                <div
                    className={`fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col justify-end transition-opacity duration-300 ${isClosingTx ? 'opacity-0' : 'opacity-100'}`}
                    onClick={handleCloseTx}
                >
                    <div
                        className={`w-full bg-[#F2F4F8] rounded-t-[32px] overflow-hidden flex flex-col h-[85vh] mt-auto shadow-2xl relative ${isClosingTx ? 'animate-slide-down' : 'animate-slide-up'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-gray-200/50 sticky top-0 z-30">
                            <button onClick={handleCloseTx} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all">
                                <X size={20} />
                            </button>
                            <span className="font-bold text-lg text-gray-900">Детали транзакции</span>
                            <div className="w-9" />
                        </div>

                        <div className="p-6 overflow-y-auto bg-[#F2F4F8] flex-1">
                            <div className="flex flex-col items-center mb-8">
                                <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center mb-4 shadow-sm ${selectedTx.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    <selectedTx.icon size={40} strokeWidth={2.5} />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 text-center mb-2 leading-tight">{selectedTx.title}</h3>
                                <span className={`text-3xl font-bold tracking-tight ${selectedTx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                    {selectedTx.type === 'income' ? '+' : '-'}{selectedTx.amount} сум
                                </span>
                            </div>

                            <div className="bg-white rounded-[24px] p-2 shadow-sm border border-gray-100">
                                <div className="divide-y divide-gray-50">
                                    <div className="flex items-center justify-between p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                                                <CalendarIcon size={16} />
                                            </div>
                                            <span className="text-sm font-medium text-gray-500">Дата и время</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900">{selectedTx.date}</span>
                                    </div>

                                    <div className="flex items-center justify-between p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                                                <Wallet size={16} />
                                            </div>
                                            <span className="text-sm font-medium text-gray-500">Тип операции</span>
                                        </div>
                                        <span className={`text-sm font-bold px-3 py-1 rounded-full ${selectedTx.type === 'income' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                            {selectedTx.type === 'income' ? 'Доход' : 'Расход'}
                                        </span>
                                    </div>

                                    {selectedTx.raw?.note && (
                                        <div className="p-4">
                                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Комментарий</span>
                                            <p className="text-base font-medium text-gray-900 leading-relaxed bg-gray-50 p-4 rounded-[20px]">
                                                {selectedTx.raw.note}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Order Details for Income */}
                            {selectedTx.type === 'income' && selectedTx.raw && (
                                <>
                                    <div className="mt-4 bg-white rounded-[24px] p-5 shadow-sm border border-gray-100">
                                        <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                                <User size={14} />
                                            </div>
                                            Информация о клиенте
                                        </h4>
                                        <div className="flex items-center gap-3 mb-4">
                                            {selectedTx.raw.user?.photo_url ? (
                                                <img src={selectedTx.raw.user.photo_url} alt="User" className="w-12 h-12 rounded-[16px] object-cover bg-gray-100" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-[16px] bg-gray-100 flex items-center justify-center text-gray-400">
                                                    <User size={24} />
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-[15px] font-bold text-gray-900">{selectedTx.raw.client}</p>
                                                <p className="text-xs font-medium text-gray-500">{selectedTx.raw.clientPhone}</p>
                                            </div>
                                        </div>
                                        {selectedTx.raw.address && (
                                            <div className="bg-gray-50 rounded-[16px] p-3 text-sm text-gray-700 font-medium leading-relaxed">
                                                📍 {selectedTx.raw.address}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 bg-white rounded-[24px] p-5 shadow-sm border border-gray-100">
                                        <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
                                                <Package size={14} />
                                            </div>
                                            Состав заказа
                                        </h4>
                                        <div className="space-y-4">
                                            {selectedTx.raw.items.map((item: any, idx: number) => (
                                                <div key={idx} className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-[14px] bg-gray-50 border border-gray-100 overflow-hidden relative shrink-0">
                                                        <img
                                                            src={item.image && item.image.startsWith('http') ? item.image : `http://localhost:8000${item.image || ''}`}
                                                            alt={item.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[13px] font-bold text-gray-900 truncate">{item.name}</p>
                                                        <p className="text-[12px] text-gray-500 font-medium">
                                                            {item.quantity} шт × {item.price.toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <span className="text-[13px] font-bold text-gray-900 whitespace-nowrap">
                                                        {(item.quantity * item.price).toLocaleString()}
                                                    </span>
                                                </div>
                                            ))}
                                            <div className="pt-3 border-t border-gray-100 flex justify-between items-center mt-2">
                                                <span className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">Итого</span>
                                                <span className="text-[16px] font-black text-gray-900">{selectedTx.amount} сум</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
