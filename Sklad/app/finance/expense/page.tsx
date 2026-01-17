"use client"

import { useState } from "react"
import { ChevronLeft, Calendar as CalendarIcon, Wallet, ChevronDown, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { api } from "@/services/api"
import ProtectedRoute from "@/components/ProtectedRoute"

const expenseCategories = [
    "Закупка товара",
    "Аренда",
    "Зарплата",
    "Маркетинг",
    "Коммунальные услуги",
    "Прочее"
]

export default function ExpensePage() {
    const router = useRouter()
    const [amount, setAmount] = useState("")
    const [category, setCategory] = useState(expenseCategories[0])
    const [customCategory, setCustomCategory] = useState("")
    const [note, setNote] = useState("")
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

    // Format number with spaces (e.g., 1 000 000)
    const formatNumber = (value: string) => {
        // Remove non-digits
        const digits = value.replace(/\D/g, "")
        // Format with space every 3 digits
        return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
    }

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\s/g, "")
        if (!/^\d*$/.test(rawValue)) return // Only allow digits
        setAmount(formatNumber(rawValue))
    }

    const handleSubmit = async () => {
        const rawAmount = parseInt(amount.replace(/\s/g, ""), 10)
        if (!rawAmount) return

        setStatus('loading')
        try {
            const finalCategory = category === "Прочее" && customCategory.trim() ? customCategory.trim() : category
            await api.createExpense({
                amount: rawAmount,
                category: finalCategory,
                note,
                date: date ? date.toISOString() : new Date().toISOString()
            })
            setStatus('success')
            setTimeout(() => router.back(), 1000)
        } catch (err) {
            console.error(err)
            setStatus('error')
            setTimeout(() => setStatus('idle'), 2000)
        }
    }

    const quickAmounts = [
        { label: "10 000", value: 10000 },
        { label: "100 000", value: 100000 },
        { label: "1 000 000", value: 1000000 },
    ]



    return (
        <ProtectedRoute allowedRoles={['owner', 'finance']}>
            <div className="min-h-screen bg-gray-50/50 pb-32">
                {/* ... existing content ... */}
                {/* Header */}
                <div className="pt-6 px-6 mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm text-gray-700 hover:text-gray-900 active:scale-95 transition-all">
                            <ChevronLeft size={22} className="mr-[1px]" />
                        </Link>
                        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Новый расход</h1>
                    </div>
                </div>

                <div className="px-6 space-y-6 max-w-lg mx-auto">

                    {/* Amount Input (Styled) */}
                    <div className="bg-white p-6 rounded-[32px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 relative overflow-hidden transition-all hover:shadow-lg">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#2663eb] to-blue-400"></div>

                        <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2 pl-1">Сумма расхода</label>
                        <div className="relative flex items-baseline">
                            <input
                                type="text"
                                value={amount}
                                onChange={handleAmountChange}
                                placeholder="0"
                                className="w-full bg-transparent border-none focus:outline-none focus:ring-0 font-medium text-gray-900 text-[32px] placeholder:text-gray-200 tracking-tight leading-none"
                                autoFocus
                            />
                            <span className="text-gray-400 font-medium text-lg ml-2 flex-shrink-0">сум</span>
                        </div>

                        {/* Quick Suggestions */}
                        <div className="flex gap-2.5 mt-6 overflow-x-auto no-scrollbar pb-1">
                            {quickAmounts.map((qa) => (
                                <button
                                    key={qa.value}
                                    onClick={() => setAmount(formatNumber(qa.value.toString()))}
                                    className="px-4 py-2.5 rounded-[18px] bg-gray-50 text-gray-600 text-[13px] font-medium active:scale-95 transition-all hover:bg-blue-50 hover:text-[#2663eb] whitespace-nowrap border border-gray-100"
                                >
                                    {qa.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                        {/* Category Selection */}
                        <div>
                            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2 pl-1">Категория</label>
                            <div className="relative mb-3">
                                <select
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className="w-full h-[60px] px-5 rounded-[24px] bg-white border border-gray-100 focus:outline-none focus:border-blue-400/50 focus:ring-4 focus:ring-blue-50/50 font-medium text-gray-900 appearance-none transition-all shadow-sm text-[17px] hover:border-gray-300"
                                >
                                    {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={24} />
                            </div>

                            {category === "Прочее" && (
                                <input
                                    type="text"
                                    value={customCategory}
                                    onChange={e => setCustomCategory(e.target.value)}
                                    placeholder="Название категории..."
                                    className="w-full h-[60px] px-5 rounded-[24px] bg-white border border-gray-100 focus:outline-none focus:border-blue-400/50 focus:ring-4 focus:ring-blue-50/50 font-medium text-gray-900 transition-all shadow-sm text-[17px] hover:border-gray-300"
                                />
                            )}
                        </div>

                        {/* Date Picker */}
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 pl-1">Дата</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className="w-full h-[60px] px-5 rounded-[24px] bg-white border border-gray-100 flex items-center justify-between text-left font-medium text-gray-900 hover:bg-gray-50 transition-all shadow-sm active:scale-[0.99] text-[17px] group">
                                        <span className="group-hover:text-black">{date ? format(date, "d MMMM yyyy", { locale: ru }) : "Выберите дату"}</span>
                                        <CalendarIcon className="text-gray-400 group-hover:text-[#2663eb] transition-colors" size={22} />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-white rounded-[24px] border-none shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] ring-1 ring-black/5" align="center">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        locale={ru}
                                        className="rounded-[24px] border-0 p-4"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Note */}
                        <div>
                            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2 pl-1">Комментарий</label>
                            <textarea
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                placeholder="Например: закупка упаковки..."
                                className="w-full h-32 p-5 rounded-[28px] bg-white border border-gray-100 focus:outline-none focus:border-blue-400/50 focus:ring-4 focus:ring-blue-50/50 font-medium text-gray-900 resize-none transition-all placeholder:text-gray-300 text-[17px] shadow-sm hover:border-gray-300"
                            />
                        </div>
                    </div>

                </div>

                {/* Fixed Bottom Action Button (Replaces BottomNav) */}
                <div className="fixed bottom-6 inset-x-0 px-6 z-50 max-w-lg mx-auto pointer-events-none">
                    <button
                        onClick={handleSubmit}
                        disabled={status !== 'idle'}
                        className={`w-full h-[72px] pointer-events-auto rounded-[28px] font-medium text-[19px] shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 ring-1 ring-white/20 
                    ${status === 'success' ? 'bg-green-500 shadow-green-500/30 text-white' :
                                status === 'error' ? 'bg-red-500 shadow-red-500/30 text-white' :
                                    'bg-[#2663eb] text-white shadow-[#2663eb]/30 hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:active:scale-100'}`}
                    >
                        {status === 'loading' ? (
                            <span>Сохранение...</span>
                        ) : status === 'success' ? (
                            <>
                                <span>Успешно!</span>
                                <CheckCircle2 size={24} />
                            </>
                        ) : status === 'error' ? (
                            <>
                                <span>Ошибка</span>
                                <AlertCircle size={24} />
                            </>
                        ) : (
                            <>
                                <span>Записать расход</span>
                                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                                    <Wallet size={18} strokeWidth={2.5} className="text-white" />
                                </div>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </ProtectedRoute>
    )
}
