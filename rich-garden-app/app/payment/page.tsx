"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, CreditCard, Banknote, Smartphone, Check, Wallet, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { AnimatedBackground } from "@/components/features/home/AnimatedBackground"

export default function PaymentMethodsPage() {
    const router = useRouter()

    const methods = [
        {
            id: 'payme',
            title: 'Payme',
            subtitle: 'Мгновенная онлайн оплата',
            icon: CreditCard,
            color: '#00CCCC'
        },
        {
            id: 'click',
            title: 'Click Evolution',
            subtitle: 'Быстрая оплата картой',
            icon: Smartphone,
            color: '#007AFF'
        },
        {
            id: 'cash',
            title: 'Наличные',
            subtitle: 'Оплата при получении курьеру',
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
        <main className="min-h-screen pb-32 relative overflow-x-hidden pt-16">
            <AnimatedBackground />

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-black/5">
                <div className="px-4 h-16 flex items-center justify-between">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full border border-black/5 bg-white active:scale-95 transition-all">
                        <ChevronLeft size={24} strokeWidth={2.5} className="text-black" />
                    </button>

                    <h1 className="text-[22px] font-black text-black lowercase tracking-tighter leading-none">оплата</h1>

                    <div className="w-10 h-10" />
                </div>
            </header>

            <div className="px-5 pt-8 mb-6">
                <h2 className="text-[28px] font-black text-black leading-tight tracking-tight mb-2 lowercase">способы оплаты</h2>
                <p className="text-black/40 text-[15px] font-medium leading-snug lowercase">
                    основной выбор способа оплаты <br />происходит при оформлении заказа
                </p>
            </div>

            <motion.div
                className="px-4 grid grid-cols-1 gap-3 relative z-10"
                variants={container}
                initial="hidden"
                animate="show"
            >
                {methods.map((method) => {
                    return (
                        <motion.div
                            key={method.id}
                            variants={item}
                            className="bg-white rounded-[32px] p-5 border border-black/5 flex items-center gap-5"
                        >
                            {/* Icon */}
                            <div
                                className="w-14 h-14 rounded-[24px] flex items-center justify-center shrink-0"
                                style={{
                                    backgroundColor: `${method.color}15`,
                                    color: method.color,
                                }}
                            >
                                <method.icon
                                    size={28}
                                    strokeWidth={2.5}
                                />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-[17px] font-medium text-black tracking-tighter lowercase mb-0.5">
                                    {method.title}
                                </h3>
                                <p className="text-[13px] font-medium text-black/30 tracking-tight lowercase">
                                    {method.subtitle}
                                </p>
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
                className="fixed bottom-28 left-6 right-6 z-20"
            >
                <Link
                    href="/"
                    className="w-full h-[72px] bg-black text-white rounded-[32px] font-black text-[17px] active:scale-[0.98] transition-all flex items-center justify-center gap-3 lowercase"
                >
                    <span>в каталог</span>
                    <ArrowRight size={20} className="opacity-40" strokeWidth={3} />
                </Link>
            </motion.div>
        </main>
    )
}
