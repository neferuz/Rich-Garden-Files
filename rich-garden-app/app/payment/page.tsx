"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, CreditCard, Banknote, Smartphone, Check, Wallet, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function PaymentMethodsPage() {
    const router = useRouter()
    const [selectedMethod, setSelectedMethod] = useState('cash')

    const methods = [
        {
            id: 'payme',
            title: 'Payme',
            subtitle: 'Мгновенная оплата',
            icon: CreditCard,
            color: '#00CCCC'
        },
        {
            id: 'click',
            title: 'Click Evolution',
            subtitle: 'Быстрый перевод',
            icon: Smartphone,
            color: '#007AFF'
        },
        {
            id: 'uzum',
            title: 'Uzum Bank',
            subtitle: 'Экосистема',
            icon: Wallet,
            color: '#7000FF'
        },
        {
            id: 'cash',
            title: 'Наличные',
            subtitle: 'При получении',
            icon: Banknote,
            color: '#10B981'
        }
    ]

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    }

    return (
        <main className="min-h-screen bg-[#f9fafb] pb-32">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
                <div className="px-4 h-16 flex items-center justify-between">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full border border-black/10 bg-transparent active:scale-95 transition-transform">
                        <ChevronLeft size={24} strokeWidth={1.5} className="text-black" />
                    </button>

                    <h1 className="text-[22px] font-bold text-black lowercase tracking-tight">оплата</h1>

                    <div className="w-10 h-10" />
                </div>
            </header>

            <motion.div
                className="px-4 pt-6 grid grid-cols-1 gap-4"
                variants={container}
                initial="hidden"
                animate="show"
            >
                {methods.map((method) => {
                    const isSelected = selectedMethod === method.id
                    return (
                        <motion.div
                            key={method.id}
                            variants={item}
                            onClick={() => setSelectedMethod(method.id)}
                            className={`group relative glass-premium-light rounded-[32px] p-5 cursor-pointer hover:shadow-premium-light transition-all duration-500 overflow-hidden ${isSelected ? '!border-black !border-[1.5px] bg-white/60' : ''}`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {/* Background Gradient Hover Effect */}
                            <div
                                className="absolute inset-0 rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                style={{
                                    background: `radial-gradient(circle at center, ${method.color}15 0%, transparent 70%)`
                                }}
                            />

                            <div className="relative z-10 flex items-center gap-5">
                                {/* Icon */}
                                <div
                                    className="w-14 h-14 rounded-[24px] flex items-center justify-center shrink-0 backdrop-blur-md transition-all duration-300 shadow-sm"
                                    style={{
                                        backgroundColor: isSelected ? method.color : `${method.color}15`,
                                        color: isSelected ? 'white' : method.color,
                                        boxShadow: isSelected ? `0 10px 20px -5px ${method.color}60` : 'none'
                                    }}
                                >
                                    <method.icon
                                        size={26}
                                        strokeWidth={2}
                                    />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <h3 className={`text-[17px] font-bold tracking-tight mb-0.5 transition-colors ${isSelected ? 'text-black' : 'text-gray-900'}`}>
                                        {method.title}
                                    </h3>
                                    <p className="text-[13px] font-medium text-gray-400 tracking-wide">
                                        {method.subtitle}
                                    </p>
                                </div>

                                {/* Selection Indicator */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isSelected
                                    ? 'bg-black text-white shadow-lg transform scale-100'
                                    : 'bg-transparent text-transparent transform scale-90'
                                    }`}>
                                    <Check size={16} strokeWidth={3} />
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </motion.div>

            {/* Bottom Button */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="fixed bottom-10 left-6 right-6"
            >
                <button
                    onClick={() => router.back()}
                    className="w-full h-16 bg-black text-white rounded-[28px] font-bold text-[17px] active:scale-95 transition-all shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-black/30 flex items-center justify-center gap-3"
                >
                    <span>Подтвердить выбор</span>
                    <ArrowRight size={20} />
                </button>
            </motion.div>
        </main>
    )
}
