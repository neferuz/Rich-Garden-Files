"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    ChevronLeft, Plus, Trash2, Edit2, X,
    Music, User, Zap, Sparkles, AlertTriangle, Smile, Package, Pen
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { api, WowEffect } from "@/services/api"

const ICON_MAP: Record<string, any> = {
    music: Music,
    user: User,
    zap: Zap,
    sparkles: Sparkles,
    smile: Smile,
    package: Package,
    pen: Pen
}

// Function to format price with spaces
const formatPrice = (price: number) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export default function WowEffectsPage() {
    const [effects, setEffects] = useState<WowEffect[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [deleteId, setDeleteId] = useState<number | null>(null)

    // Form state
    const [formData, setFormData] = useState<Partial<WowEffect>>({
        name: '',
        price: 0,
        icon: 'zap',
        category: 'wow',
        description: '',
        is_active: true
    })

    useEffect(() => {
        fetchEffects()
    }, [])

    const fetchEffects = async () => {
        setIsLoading(true)
        try {
            const data = await api.getWowEffects()
            setEffects(data)
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        if (!formData.name) return

        try {
            if (editingId) {
                const updated = await api.updateWowEffect(editingId, formData)
                setEffects(prev => prev.map(e => e.id === editingId ? updated : e))
                setEditingId(null)
            } else {
                const created = await api.createWowEffect({
                    name: formData.name!,
                    price: Number(formData.price) || 0,
                    icon: formData.icon || 'zap',
                    category: formData.category || 'wow',
                    description: formData.description || '',
                    is_active: formData.is_active ?? true
                })
                setEffects(prev => [...prev, created])
                setIsAdding(false)
            }
            setFormData({ name: '', price: 0, icon: 'zap', description: '', is_active: true })
        } catch (error) {
            console.error(error)
            alert('Ошибка при сохранении')
        }
    }

    const confirmDelete = async () => {
        if (deleteId) {
            try {
                await api.deleteWowEffect(deleteId)
                setEffects(prev => prev.filter(e => e.id !== deleteId))
                setDeleteId(null)
            } catch (error) {
                console.error(error)
                alert('Ошибка при удалении')
            }
        }
    }

    const startEdit = (effect: WowEffect) => {
        setEditingId(effect.id)
        setFormData(effect)
        setIsAdding(false)
    }

    return (
        <div className="min-h-screen bg-[#F8F9FB] pb-20">
            {/* Header */}
            <div className="pt-6 px-6 mb-4 flex items-center justify-between">
                <Link href="/profile" className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-100 text-gray-500 hover:text-black hover:bg-gray-50 transition-colors shadow-sm">
                    <ChevronLeft size={22} />
                </Link>
                <h1 className="text-xl font-medium text-gray-900">Вау эффекты</h1>
                <button
                    onClick={() => {
                        setIsAdding(true)
                        setEditingId(null)
                        setFormData({ name: '', price: 0, icon: 'zap', category: 'wow', description: '', is_active: true })
                    }}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-black text-white active:scale-90 transition-all shadow-lg shadow-black/20"
                >
                    <Plus size={20} strokeWidth={2.5} />
                </button>
            </div>

            <div className="p-4 space-y-3">
                <AnimatePresence mode="wait">
                    {(isAdding || editingId) && (
                        <motion.div
                            key="form-container"
                            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                            className="overflow-hidden"
                        >
                            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-xl shadow-black/5 space-y-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-medium text-gray-900 text-lg">{editingId ? 'Редактировать' : 'Новый эффект'}</h3>
                                    <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="text-gray-400 p-2"><X size={20} /></button>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest ml-1">Название</label>
                                        <input
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full h-12 px-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-black/5 font-medium transition-all"
                                            placeholder="Напр. Саксофонист"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest ml-1">Цена (сум)</label>
                                            <input
                                                type="text"
                                                value={formData.price === 0 ? '' : formatPrice(formData.price || 0)}
                                                onChange={e => {
                                                    const val = e.target.value.replace(/\s/g, '');
                                                    if (/^\d*$/.test(val)) {
                                                        setFormData({ ...formData, price: Number(val) });
                                                    }
                                                }}
                                                className="w-full h-12 px-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-black/5 font-medium transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest ml-1">Иконка</label>
                                            <select
                                                value={formData.icon}
                                                onChange={e => setFormData({ ...formData, icon: e.target.value })}
                                                className="w-full h-12 px-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-black/5 font-medium transition-all appearance-none"
                                            >
                                                <option value="music">Музыка</option>
                                                <option value="user">Человек</option>
                                                <option value="zap">Энергия</option>
                                                <option value="sparkles">Магия</option>
                                                <option value="smile">Смайл (Улыбка)</option>
                                                <option value="package">Коробка (Подарок)</option>
                                                <option value="pen">Ручка (Открытка)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest ml-1">Категория</label>
                                            <select
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full h-12 px-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-black/5 font-medium transition-all appearance-none"
                                            >
                                                <option value="wow">Вау эффект</option>
                                                <option value="extra">К подарку (допы)</option>
                                                <option value="postcard">Открытка</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-3 pt-4">
                                            <button
                                                onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                                className={cn(
                                                    "w-10 h-6 rounded-full relative transition-colors duration-300",
                                                    formData.is_active ? "bg-green-500" : "bg-gray-200"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-4 h-4 bg-white rounded-full absolute top-1 transition-all",
                                                    formData.is_active ? "left-5" : "left-1"
                                                )} />
                                            </button>
                                            <span className="text-sm font-medium text-gray-600">Активен</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest ml-1">Описание</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full p-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-black/5 font-medium transition-all"
                                            rows={2}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleSave}
                                    className="w-full h-14 bg-black text-white rounded-2xl font-medium active:scale-[0.98] transition-all"
                                >
                                    Сохранить изменения
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="space-y-3">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50">
                            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-sm font-medium">Загрузка эффектов...</p>
                        </div>
                    ) : effects.length > 0 ? (
                        effects.map((effect, i) => {
                            const Icon = ICON_MAP[effect.icon] || Zap
                            return (
                                <motion.div
                                    layout
                                    key={effect.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2, delay: i * 0.03 }}
                                    className={cn(
                                        "p-3.5 rounded-[22px] border border-gray-100 shadow-sm flex items-center gap-3.5 active:scale-[0.99] transition-all",
                                        effect.is_active ? "bg-white" : "bg-gray-50/50 grayscale opacity-80"
                                    )}
                                >
                                    <div className={cn(
                                        "w-11 h-11 rounded-[16px] flex items-center justify-center shrink-0",
                                        effect.is_active ? "bg-orange-50 text-orange-600" : "bg-gray-100 text-gray-400"
                                    )}>
                                        <Icon size={20} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <h3 className="font-medium text-gray-900 text-[14px] truncate leading-tight">{effect.name}</h3>
                                                <span className={cn(
                                                    "text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase",
                                                    effect.category === 'wow' ? "bg-purple-50 text-purple-500" :
                                                        effect.category === 'postcard' ? "bg-orange-50 text-orange-500" :
                                                            "bg-blue-50 text-blue-500"
                                                )}>
                                                    {effect.category === 'wow' ? 'Вау' :
                                                        effect.category === 'postcard' ? 'Открытка' : 'Доп'}
                                                </span>
                                            </div>
                                            {!effect.is_active && <span className="text-[9px] font-medium text-gray-400 uppercase tracking-tighter">Черновик</span>}
                                        </div>
                                        <p className="text-[14px] font-medium text-black">{formatPrice(effect.price)} <span className="text-[11px] font-medium text-gray-400">сум</span></p>
                                    </div>

                                    <div className="flex gap-1.5 px-0.5">
                                        <button
                                            onClick={() => startEdit(effect)}
                                            className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 transition-colors hover:bg-black hover:text-white group"
                                        >
                                            <Edit2 size={14} className="group-hover:scale-110 transition-transform" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteId(effect.id)}
                                            className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-500 transition-colors hover:bg-red-500 hover:text-white group"
                                        >
                                            <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
                                        </button>
                                    </div>
                                </motion.div>
                            )
                        })
                    ) : (
                        <div className="text-center py-20 bg-white/50 rounded-[32px] border border-dashed border-gray-200">
                            <Zap size={48} className="mx-auto text-gray-300 mb-4" strokeWidth={1} />
                            <p className="text-gray-400 font-medium">Нет добавленных эффектов</p>
                            <button
                                onClick={() => setIsAdding(true)}
                                className="mt-4 text-sm font-bold text-black"
                            >
                                Добавить первый
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Alert for Deletion */}
            <AnimatePresence>
                {deleteId && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/50 backdrop-blur-md"
                            onClick={() => setDeleteId(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-white w-full max-w-[320px] rounded-[32px] p-6 shadow-2xl relative z-10 text-center"
                        >
                            <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={32} strokeWidth={1.5} />
                            </div>

                            <h3 className="text-xl font-medium text-gray-900 mb-2">Удалить эффект?</h3>
                            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                                Это действие нельзя будет отменить. Данный эффект исчезнет из списка доступных.
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setDeleteId(null)}
                                    className="h-12 rounded-2xl bg-gray-100 text-gray-900 font-medium text-sm active:scale-95 transition-all"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="h-12 rounded-2xl bg-red-500 text-white font-medium text-sm active:scale-95 transition-all shadow-lg shadow-red-500/20"
                                >
                                    Удалить
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
