"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, MapPin, ChevronRight, MessageSquareText, Wallet, CreditCard, Banknote, Check, X, Home, Building2, AlignLeft, Gift, PenLine, Music, Smile, PartyPopper, ShoppingBag, Heart, Sparkles, Box } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { api, type Address } from '@/lib/api'
import { useCart } from '@/context/CartContext'
import Link from 'next/link'

export default function CheckoutPage() {
    const router = useRouter()
    const [paymentMethod, setPaymentMethod] = useState('cash')

    // Address State
    const [savedAddresses, setSavedAddresses] = useState<Address[]>([])
    const [address, setAddress] = useState<any>(null)
    const [isAddingAddress, setIsAddingAddress] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [tempAddress, setTempAddress] = useState({ title: 'Дом', street: '', details: '' })

    // User ID (Mock for now)
    const USER_ID = 12345;

    useEffect(() => {
        // Fetch saved addresses
        api.getAddresses(USER_ID).then(data => {
            setSavedAddresses(data)
        })
    }, [])

    // Add-on states
    const [postcard, setPostcard] = useState({ active: false, text: '' })
    const [wowEffect, setWowEffect] = useState('')
    const [selectedExtras, setSelectedExtras] = useState<string[]>([])
    const [isOrderPlaced, setIsOrderPlaced] = useState(false)
    const [isPlacingOrder, setIsPlacingOrder] = useState(false)

    const { cartItems, totalPrice, clearCart, isLoaded } = useCart()
    const [telegramUser, setTelegramUser] = useState<any>(null)

    // Telegram Auth Check
    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
            const tg = (window as any).Telegram.WebApp;
            const user = tg.initDataUnsafe?.user;
            if (user) setTelegramUser(user);
        }
    }, [])

    // Redirect if empty
    useEffect(() => {
        if (isLoaded && cartItems.length === 0 && !isOrderPlaced) {
            router.replace('/')
        }
    }, [isLoaded, cartItems, isOrderPlaced, router])

    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
            </div>
        )
    }

    if (cartItems.length === 0 && !isOrderPlaced) {
        return null // Will redirect
    }

    const handlePlaceOrder = async () => {
        if (!address) {
            alert("Пожалуйста, выберите или добавьте адрес доставки")
            return
        }

        setIsPlacingOrder(true)

        try {
            const extras = {
                postcard: postcard.active ? postcard.text : null,
                wow_effect: wowEffect || null,
                addons: selectedExtras
            }

            const orderData = {
                customer_name: telegramUser?.first_name || 'Гость',
                customer_phone: telegramUser?.phone_number || 'Уточнить',
                total_price: totalPrice,
                telegram_id: telegramUser?.id || 12345,
                address: address ? `${address.title}: ${address.street}${address.details ? `, ${address.details}` : ''}` : undefined,
                comment: postcard.active ? postcard.text : undefined,
                payment_method: paymentMethod,
                extras: JSON.stringify(extras),
                items: JSON.stringify(cartItems.map(item => ({
                    id: item.product.id,
                    name: item.product.name,
                    price: item.product.price_raw || parseInt(item.product.price.toString().replace(/\D/g, '')),
                    quantity: item.quantity,
                    image: item.product.image
                })))
            }

            await api.createOrder(orderData)

            setIsPlacingOrder(false)
            setIsOrderPlaced(true)
            clearCart()

            // Trigger confetti
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: any = setInterval(function () {
                const timeLeft = animationEnd - Date.now();
                if (timeLeft <= 0) return clearInterval(interval);
                const particleCount = 50 * (timeLeft / duration);
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: ['#000000', '#FFD700', '#FF1493'] });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: ['#000000', '#FFD700', '#FF1493'] });
            }, 250);
        } catch (err) {
            console.error(err)
            alert("Ошибка при оформлении заказа")
            setIsPlacingOrder(false)
        }
    }

    const paymentMethods = [
        { id: 'cash', name: 'Наличные', icon: <Banknote size={26} />, color: 'text-green-600', bg: 'bg-green-50' },
        { id: 'click', name: 'Click', icon: <span className="font-black text-[18px] tracking-tighter">Cl</span>, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'payme', name: 'Payme', icon: <span className="font-black text-[18px] tracking-tighter">Pa</span>, color: 'text-teal-600', bg: 'bg-teal-50' },
        { id: 'uzum', name: 'Uzum', icon: <span className="font-black text-[18px] tracking-tighter">Uz</span>, color: 'text-violet-600', bg: 'bg-violet-50' },
    ]

    const wowOptions = [
        { id: 'violin', name: 'Скрипач', icon: <Music size={20} /> },
        { id: 'brutal', name: 'Брутальный мужчина', icon: <img src="https://em-content.zobj.net/source/apple/391/person-in-tuxedo_1f935.png" alt="" className="w-5 h-5 grayscale" /> },
    ]

    const toyOptions = [
        { id: 'bear', name: 'Мишка Тедди', price: '250 000' },
        { id: 'bunny', name: 'Зайка', price: '180 000' },
    ]

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } }
    }

    const handleSaveAddress = async () => {
        if (!tempAddress.street) return
        setIsSaving(true)

        try {
            const newAddr = await api.createAddress(USER_ID, {
                title: tempAddress.title,
                address: tempAddress.street,
                info: tempAddress.details
            })

            if (newAddr) {
                setSavedAddresses(prev => [...prev, newAddr])
                setAddress({ title: newAddr.title, street: newAddr.address, details: newAddr.info })
            } else {
                setAddress(tempAddress)
            }
        } catch (e) {
            console.error(e)
            setAddress(tempAddress)
        }

        setTimeout(() => {
            setIsSaving(false)
            setIsAddingAddress(false)
        }, 500)
    }

    const toggleExtra = (id: string) => {
        if (selectedExtras.includes(id)) {
            setSelectedExtras(selectedExtras.filter(e => e !== id))
        } else {
            setSelectedExtras([...selectedExtras, id])
        }
    }

    return (
        <div className="min-h-screen bg-[#F5F5F7] pb-44 font-sans selection:bg-black selection:text-white">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-[#F5F5F7]/80 backdrop-blur-xl">
                <div className="px-5 h-16 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="w-11 h-11 flex items-center justify-center -ml-2 rounded-full active:scale-90 transition-transform"
                    >
                        <ChevronLeft size={26} className="text-black" />
                    </button>
                    <h1 className="text-[18px] font-bold text-black tracking-tight">Оформление</h1>
                    <div className="w-11"></div>
                </div>
            </header>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="px-5 py-2 space-y-8"
            >

                {/* Delivery Address Section */}
                <motion.section variants={itemVariants}>
                    <div className="flex items-end justify-between mb-4 px-1">
                        <h2 className="text-[22px] font-extrabold text-black leading-none">Куда везти?</h2>
                        {address && !isAddingAddress && !isSaving && (
                            <button
                                onClick={() => {
                                    setAddress(null)
                                }}
                                className="text-[15px] font-bold text-blue-600 active:opacity-60 transition-opacity"
                            >
                                Изменить
                            </button>
                        )}
                    </div>

                    <AnimatePresence mode="wait">
                        {!address && !isAddingAddress && !isSaving ? (
                            <div className="space-y-3">
                                {/* Saved Addresses Carousel */}
                                {savedAddresses.length > 0 && (
                                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                                        {savedAddresses.map(addr => (
                                            <motion.button
                                                key={addr.id}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setAddress({ title: addr.title, street: addr.address, details: addr.info })}
                                                className="min-w-[160px] bg-white p-4 rounded-[24px] border border-gray-200 text-left flex flex-col gap-1 shadow-sm"
                                            >
                                                <span className="font-bold text-black">{addr.title}</span>
                                                <span className="text-xs text-gray-500 line-clamp-2">{addr.address}</span>
                                            </motion.button>
                                        ))}
                                    </div>
                                )}

                                <motion.button
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    onClick={() => {
                                        setTempAddress({ title: 'Дом', street: '', details: '' })
                                        setIsAddingAddress(true)
                                    }}
                                    className="w-full h-[100px] rounded-[32px] border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 text-gray-400 hover:bg-white hover:border-gray-200 active:scale-[0.98] transition-all bg-white/50"
                                >
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                        <ChevronRight size={20} className="text-gray-400 rotate-90" />
                                    </div>
                                    <span className="font-bold text-[14px]">Новый адрес</span>
                                </motion.button>
                            </div>
                        ) : (isAddingAddress || isSaving) ? (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-[32px] p-5 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] border border-white min-h-[300px] flex flex-col justify-center"
                            >
                                {isSaving ? (
                                    <div className="flex flex-col items-center justify-center py-8">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                            className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-500/30"
                                        >
                                            <Check size={32} className="text-white stroke-[4]" />
                                        </motion.div>
                                        <h3 className="text-[18px] font-bold text-black">Сохранено!</h3>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-center mb-5 px-1">
                                            <h3 className="text-[20px] font-extrabold text-black">Новый адрес</h3>
                                            <button onClick={() => setIsAddingAddress(false)} className="w-9 h-9 flex items-center justify-center bg-[#F5F5F7] rounded-full active:scale-90 transition-transform">
                                                <X size={20} className="text-black" />
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            {/* Title Input */}
                                            <div className="bg-[#F5F5F7] rounded-[24px] p-2 pr-4 flex items-center gap-2 focus-within:ring-2 focus-within:ring-black/5 transition-all">
                                                <div className="w-10 h-10 flex items-center justify-center shrink-0 text-black">
                                                    <Home size={24} strokeWidth={1.5} />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block leading-none mb-1">Название</label>
                                                    <input
                                                        value={tempAddress.title}
                                                        onChange={(e) => setTempAddress({ ...tempAddress, title: e.target.value })}
                                                        className="w-full bg-transparent font-bold text-[16px] text-black outline-none placeholder:text-gray-300 leading-tight"
                                                        placeholder="Дом"
                                                    />
                                                </div>
                                            </div>

                                            {/* Street Input */}
                                            <div className="bg-[#F5F5F7] rounded-[24px] p-2 pr-4 flex items-center gap-2 focus-within:ring-2 focus-within:ring-black/5 transition-all">
                                                <div className="w-10 h-10 flex items-center justify-center shrink-0 text-black">
                                                    <MapPin size={24} strokeWidth={1.5} />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block leading-none mb-1">Улица</label>
                                                    <input
                                                        value={tempAddress.street}
                                                        onChange={(e) => setTempAddress({ ...tempAddress, street: e.target.value })}
                                                        className="w-full bg-transparent font-bold text-[16px] text-black outline-none placeholder:text-gray-300 leading-tight"
                                                        placeholder="Поиск улицы..."
                                                    />
                                                </div>
                                            </div>

                                            {/* Details Input */}
                                            <div className="bg-[#F5F5F7] rounded-[24px] p-2 pr-4 flex items-center gap-2 focus-within:ring-2 focus-within:ring-black/5 transition-all">
                                                <div className="w-10 h-10 flex items-center justify-center shrink-0 text-black">
                                                    <AlignLeft size={24} strokeWidth={1.5} />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block leading-none mb-1">Детали</label>
                                                    <input
                                                        value={tempAddress.details}
                                                        onChange={(e) => setTempAddress({ ...tempAddress, details: e.target.value })}
                                                        className="w-full bg-transparent font-bold text-[16px] text-black outline-none placeholder:text-gray-300 leading-tight"
                                                        placeholder="Подъезд, этаж..."
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleSaveAddress}
                                                className="w-full h-14 bg-black text-white font-bold text-[16px] rounded-[24px] mt-2 active:scale-[0.98] shadow-lg shadow-black/20 transition-all"
                                            >
                                                Сохранить адрес
                                            </button>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="card"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-[32px] p-5 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] border border-white relative overflow-hidden group active:scale-[0.98] transition-all duration-300"
                            >
                                <div className="flex items-start gap-4 z-10 relative">
                                    <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center shrink-0 shadow-lg shadow-black/20">
                                        <MapPin size={22} className="text-white" strokeWidth={2.5} />
                                    </div>
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <h3 className="text-[17px] font-bold text-black leading-tight mb-1">
                                            {address.title}
                                        </h3>
                                        <p className="text-[16px] font-medium text-gray-900 leading-snug">
                                            {address.street}
                                        </p>
                                        <p className="text-[14px] text-gray-400 mt-1.5 leading-relaxed font-medium">
                                            {address.details}
                                        </p>
                                    </div>
                                </div>
                                {/* Decorative Map BG Pattern */}
                                <div className="absolute top-0 right-0 w-32 h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.section>

                {/* Courier Comment */}
                <motion.section variants={itemVariants}>
                    <div className="flex items-center gap-3 mb-4 px-1">
                        <h2 className="text-[22px] font-extrabold text-black leading-none">Пожелания</h2>
                    </div>
                    <div className="bg-white rounded-[28px] p-2 pr-3 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] flex items-center gap-3 focus-within:ring-2 focus-within:ring-black/5 transition-shadow">
                        <div className="w-12 h-12 rounded-[20px] bg-[#FFF8F2] flex items-center justify-center shrink-0">
                            <MessageSquareText size={22} className="text-[#FF8A00]" strokeWidth={1.5} />
                        </div>
                        <input
                            type="text"
                            placeholder="Комментарий"
                            className="flex-1 h-full bg-transparent font-bold text-[16px] text-black placeholder:text-gray-300 outline-none"
                        />
                    </div>
                </motion.section>

                {/* Add-ons Section */}
                <motion.section variants={itemVariants}>
                    <div className="flex items-center gap-3 mb-4 px-1">
                        <h2 className="text-[22px] font-extrabold text-black leading-none">Дополнить</h2>
                    </div>

                    <div className="bg-white rounded-[32px] p-2 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] space-y-2">
                        {/* Postcard */}
                        <div className="rounded-[28px] overflow-hidden transition-all duration-300">
                            <button
                                onClick={() => setPostcard({ ...postcard, active: !postcard.active })}
                                className={`w-full p-4 flex items-center gap-4 transition-colors ${postcard.active ? 'bg-black text-white' : 'bg-transparent text-black hover:bg-gray-50'}`}
                            >
                                <div className={`w-12 h-12 rounded-[22px] flex items-center justify-center shrink-0 transition-colors ${postcard.active ? 'bg-white/20' : 'bg-[#F2F2F5]'}`}>
                                    <PenLine size={24} strokeWidth={1.5} className={postcard.active ? 'text-white' : 'text-black'} />
                                </div>
                                <div className="flex-1 text-left">
                                    <h3 className={`text-[16px] font-bold leading-tight ${postcard.active ? 'text-white' : 'text-black'}`}>Открытка</h3>
                                    <p className={`text-[13px] font-medium ${postcard.active ? 'text-white/60' : 'text-gray-500'}`}>Напишите теплые слова</p>
                                </div>
                                {postcard.active && <Check size={20} className="text-white" />}
                            </button>
                            <AnimatePresence>
                                {postcard.active && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="px-4 pb-4 bg-black"
                                    >
                                        <textarea
                                            value={postcard.text}
                                            onChange={(e) => setPostcard({ ...postcard, text: e.target.value })}
                                            placeholder="Текст вашего поздравления..."
                                            className="w-full h-24 bg-white/10 rounded-[20px] p-4 text-white placeholder:text-white/30 resize-none outline-none font-medium text-[15px]"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Wow Effect */}
                        <div className="p-2">
                            <h4 className="px-2 mb-3 text-[13px] font-bold text-gray-500 uppercase tracking-wider">Вау эффект</h4>
                            <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                                {wowOptions.map(option => (
                                    <button
                                        key={option.id}
                                        onClick={() => setWowEffect(wowEffect === option.id ? '' : option.id)}
                                        className={`flex-shrink-0 relative pl-3 pr-5 py-3 rounded-[24px] border transition-all flex items-center gap-3 ${wowEffect === option.id
                                            ? 'bg-black border-black text-white shadow-lg'
                                            : 'bg-white border-gray-100 text-black shadow-sm'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${wowEffect === option.id ? 'bg-white/20' : 'bg-gray-100'
                                            }`}>
                                            {option.icon}
                                        </div>
                                        <span className={`font-bold text-[14px] whitespace-nowrap ${wowEffect === option.id ? 'text-white' : 'text-black'}`}>{option.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Extra Items (Balloons, Toys) */}
                        <div className="p-2 pt-0">
                            <h4 className="px-2 mb-3 text-[13px] font-bold text-gray-500 uppercase tracking-wider">К подарку</h4>
                            <div className="space-y-2">
                                <button
                                    onClick={() => toggleExtra('balloons')}
                                    className={`w-full p-3 rounded-[24px] flex items-center gap-4 transition-all ${selectedExtras.includes('balloons') ? 'bg-[#FFF8F2] ring-2 ring-[#FF8A00]/20' : 'bg-[#F9F9F9]'}`}
                                >
                                    <div className="w-10 h-10 rounded-[18px] bg-white flex items-center justify-center shadow-sm text-[#FF8A00]">
                                        <PartyPopper size={20} />
                                    </div>
                                    <span className="flex-1 text-left font-bold text-black text-[15px]">Шары (5 шт)</span>
                                    {selectedExtras.includes('balloons') && <Check size={20} className="text-[#FF8A00]" />}
                                </button>

                                <div className="grid grid-cols-2 gap-2">
                                    {toyOptions.map(toy => (
                                        <button
                                            key={toy.id}
                                            onClick={() => toggleExtra(toy.id)}
                                            className={`p-3 rounded-[24px] flex flex-col items-start gap-2 transition-all ${selectedExtras.includes(toy.id) ? 'bg-[#F2F8FF] ring-2 ring-blue-500/20' : 'bg-[#F9F9F9]'}`}
                                        >
                                            <div className="w-full flex justify-between items-start">
                                                <div className="w-10 h-10 rounded-[18px] bg-white flex items-center justify-center shadow-sm text-blue-500">
                                                    <Smile size={20} />
                                                </div>
                                                {selectedExtras.includes(toy.id) && <Check size={18} className="text-blue-500" />}
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-black text-[14px] leading-tight">{toy.name}</h5>
                                                <p className="text-[12px] font-medium text-gray-500 mt-0.5">{toy.price}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Payment Method */}
                <motion.section variants={itemVariants}>
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h2 className="text-[22px] font-extrabold text-black leading-none">Оплата</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {paymentMethods.map((method) => (
                            <button
                                key={method.id}
                                onClick={() => setPaymentMethod(method.id)}
                                className={`relative h-[88px] rounded-[28px] p-4 flex flex-col justify-between transition-all duration-300 ${paymentMethod === method.id
                                    ? 'bg-black shadow-[0_12px_30px_-8px_rgba(0,0,0,0.3)] scale-[1.02]'
                                    : 'bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] active:scale-95 border border-transparent'
                                    }`}
                            >
                                <div className="flex items-start justify-between w-full">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${paymentMethod === method.id ? 'bg-white/20 text-white' : `${method.bg} ${method.color}`
                                        }`}>
                                        {method.icon}
                                    </div>
                                    {paymentMethod === method.id && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="w-6 h-6 rounded-full bg-white flex items-center justify-center"
                                        >
                                            <Check size={14} className="text-black stroke-[4]" />
                                        </motion.div>
                                    )}
                                </div>
                                <span className={`text-[15px] font-bold text-left ${paymentMethod === method.id ? 'text-white' : 'text-gray-900'
                                    }`}>
                                    {method.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </motion.section>
            </motion.div>

            {/* Bottom Action */}
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="fixed bottom-8 left-0 right-0 px-5 z-40"
            >
                <div className="absolute inset-x-0 bottom-[-32px] h-[100px] bg-gradient-to-t from-[#F5F5F7] to-transparent pointer-events-none" />
                <button
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder || cartItems.length === 0}
                    className="relative w-full h-[72px] bg-[#111] rounded-[28px] flex items-center justify-between pl-7 pr-2 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.4)] active:scale-[0.98] transition-all overflow-hidden disabled:opacity-80"
                >
                    {isPlacingOrder ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col items-start justify-center space-y-0.5">
                                <span className="text-white/50 text-[12px] font-bold uppercase tracking-wider">итого</span>
                                <span className="text-white font-bold text-[20px] tracking-tight">{totalPrice.toLocaleString()} сум</span>
                            </div>
                            <div className="h-[56px] px-8 bg-white rounded-[22px] flex items-center justify-center gap-2 group hover:bg-gray-50 transition-colors disabled:opacity-50">
                                <span className="text-black font-bold text-[16px]">
                                    {cartItems.length > 0 ? 'Оплатить' : 'Корзина пуста'}
                                </span>
                                {cartItems.length > 0 && <ChevronRight size={18} className="text-black stroke-[3]" />}
                            </div>
                        </>
                    )}
                </button>
            </motion.div>

            {/* Success Overlay */}
            <AnimatePresence>
                {isOrderPlaced && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-between p-6 pb-12 overflow-hidden"
                    >
                        {/* Dramatic Background Decorations */}
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square bg-[#FFD700]/5 rounded-full blur-[100px]"
                        />
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                            className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square bg-pink-500/5 rounded-full blur-[100px]"
                        />

                        <div className="relative z-10 w-full flex flex-col items-center flex-1 justify-center mt-[-40px]">
                            <motion.div
                                initial={{ scale: 0, rotate: -45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                                className="w-24 h-24 bg-black rounded-[32px] flex items-center justify-center mb-10 shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
                            >
                                <Sparkles size={40} className="text-[#FFD700]" />
                            </motion.div>

                            <motion.h2
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-[38px] font-black text-black mb-4 leading-none text-center tracking-tighter lowercase"
                            >
                                ваш заказ<br />принят!
                            </motion.h2>

                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-[17px] text-gray-400 font-medium text-center max-w-[280px] leading-relaxed lowercase"
                            >
                                мы уже начали собирать ваш прекрасный букет. за статусом можно следить в профиле.
                            </motion.p>
                        </div>

                        <div className="relative z-10 w-full space-y-6">
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                className="flex flex-col items-center gap-3"
                            >
                                <div className="flex -space-x-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-gray-50 flex items-center justify-center overflow-hidden">
                                            <div className="w-full h-full bg-gradient-to-br from-pink-50 to-gray-50 flex items-center justify-center">
                                                <Heart size={16} className="text-pink-200" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[12px] text-gray-400 font-bold uppercase tracking-[0.2em]">с любовью</p>
                                <h3 className="text-[26px] font-black text-black tracking-tighter lowercase leading-none">rich garden</h3>
                            </motion.div>

                            <motion.div
                                initial={{ y: 40, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 1 }}
                                className="flex flex-col gap-3"
                            >
                                <Link
                                    href="/orders"
                                    className="w-full h-[72px] bg-black rounded-[28px] text-white font-bold text-[17px] active:scale-[0.98] shadow-2xl shadow-black/20 transition-all flex items-center justify-center gap-3"
                                >
                                    <Box size={20} />
                                    <span className="lowercase">мои заказы</span>
                                </Link>
                                <button
                                    onClick={() => router.push('/')}
                                    className="w-full h-[72px] bg-gray-50 rounded-[28px] text-black font-bold text-[17px] active:scale-[0.98] transition-all flex items-center justify-center lowercase"
                                >
                                    в каталог
                                </button>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
