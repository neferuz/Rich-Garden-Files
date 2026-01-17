"use client"

import { AlertTriangle, Clock, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useState, useEffect } from "react"
import { api } from "@/services/api"

export default function TasksOverview() {
    const [stats, setStats] = useState({
        processingCount: 0,
        delayedCount: 0,
        lowStockCount: 8
    })

    useEffect(() => {
        api.getOrders().then(orders => {
            const processing = orders.filter(o => o.status === 'processing').length
            const newOrders = orders.filter(o => o.status === 'new').length
            setStats(prev => ({
                ...prev,
                processingCount: processing,
                delayedCount: newOrders
            }))
        }).catch(console.error)
    }, [])

    const tasks = [
        {
            title: "Остаток: Розы",
            value: `${stats.lowStockCount} шт`,
            status: "critical",
            icon: AlertTriangle,
            color: "#F59E0B",
            href: "/inventory"
        },
        {
            title: `Сборка: ${stats.processingCount} заказа`,
            value: "ждут",
            status: "info",
            icon: Clock,
            color: "#3B82F6",
            href: "/orders?status=processing"
        },
        {
            title: `Задержка: ${stats.delayedCount} заказа`,
            value: "Критично",
            status: "danger",
            icon: AlertCircle,
            color: "#EF4444",
            href: "/orders?status=new"
        }
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            className="mt-12"
            variants={container}
            initial="hidden"
            animate="show"
        >
            <div className="flex items-center justify-between mb-6 px-1">
                <h2 className="text-2xl tracking-tighter text-gray-900" style={{ fontWeight: 300 }}>
                    Обзор
                </h2>
                <div className="bg-gray-100 rounded-full px-3 py-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Live</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tasks.map((task, index) => (
                    <Link key={index} href={task.href}>
                        <motion.div
                            variants={item}
                            className="group relative glass-premium-light rounded-[24px] p-4 cursor-pointer hover:shadow-premium-light transition-all duration-500 overflow-hidden"
                            whileHover={{ scale: 1.02, y: -2 }}
                        >
                            {/* Background Gradient Hover Effect */}
                            <div
                                className="absolute inset-0 rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                style={{
                                    background: `radial-gradient(circle at center, ${task.color}10 0%, transparent 70%)`
                                }}
                            />

                            <div className="relative z-10 flex items-center gap-4">
                                {/* Icon */}
                                <div
                                    className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-md"
                                    style={{
                                        backgroundColor: `${task.color}15`,
                                        boxShadow: `0 4px 12px -2px ${task.color}20`
                                    }}
                                >
                                    <task.icon
                                        size={20}
                                        strokeWidth={2}
                                        style={{ color: task.color }}
                                    />
                                </div>

                                {/* Center Content */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xs text-gray-500 font-medium tracking-wide uppercase mb-0.5 truncate">
                                        {task.title.split(":")[0]}
                                    </h3>
                                    <p className="text-gray-900 font-bold tracking-tight truncate">
                                        {task.title.split(":")[1]?.trim()}
                                    </p>
                                </div>

                                {/* Link Indicator */}
                                <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ChevronRight size={14} className="text-gray-300" />
                                </div>

                                {/* Badge/Value */}
                                <div
                                    className="flex items-center justify-center px-3 py-1.5 rounded-full shrink-0"
                                    style={{
                                        backgroundColor: `${task.color}10`,
                                        color: task.color
                                    }}
                                >
                                    <span className="text-xs font-medium whitespace-nowrap">
                                        {task.value}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </Link>
                ))}
            </div>
        </motion.div>
    )
}
