"use client"

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, MapPin, ChevronRight, MessageSquareText, Wallet, CreditCard, Banknote, Check, X, Home, Building2, AlignLeft, Gift, PenLine, Music, Smile, PartyPopper, ShoppingBag, Heart, Sparkles, Box, User, Zap, Package, Pen } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { api, type Address } from '@/lib/api'
import { useCart } from '@/context/CartContext'
import Link from 'next/link'
import { toast } from 'sonner'

const ICON_MAP: Record<string, any> = {
    music: Music,
    user: User,
    zap: Zap,
    sparkles: Sparkles,
    smile: Smile,
    package: Package,
    pen: Pen
}

const formatPrice = (price: number) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

import { AnimatedBackground } from "@/components/features/home/AnimatedBackground"
import { cn } from "@/lib/utils"

export default function CheckoutPage() {
    const router = useRouter()
    const [paymentMethod, setPaymentMethod] = useState('cash')
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Address State
    const [savedAddresses, setSavedAddresses] = useState<Address[]>([])
    const [address, setAddress] = useState<any>(null)
    const [isAddingAddress, setIsAddingAddress] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [tempAddress, setTempAddress] = useState({ title: 'Дом', street: '', details: '' })

    const [telegramUser, setTelegramUser] = useState<any>(null)
    const [userProfile, setUserProfile] = useState<{ phone_number?: string } | null>(null)

    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
            const tg = (window as any).Telegram.WebApp;
            const user = tg.initDataUnsafe?.user;
            if (user) {
                setTelegramUser(user);
                api.authTelegram({
                    telegram_id: user.id,
                    first_name: user.first_name,
                    username: user.username,
                    photo_url: user.photo_url,
                    phone_number: (user as any).phone_number
                } as any).catch(console.error);
            }
        } else if (process.env.NODE_ENV === 'development') {
            const mockUser = { id: 12345678, first_name: 'Local Test' };
            setTelegramUser(mockUser);
            api.authTelegram({
                telegram_id: mockUser.id,
                first_name: mockUser.first_name,
            } as any).catch(console.error);
        }
    }, [])

    useEffect(() => {
        if (telegramUser?.id) {
            api.getAddresses(telegramUser.id).then(data => setSavedAddresses(data));
            api.getUser(telegramUser.id).then(u => u && setUserProfile({ phone_number: u.phone_number ?? undefined }));
        } else {
            setUserProfile(null);
        }
    }, [telegramUser])

    // Add-on states
    const [postcard, setPostcard] = useState({ active: false, text: '' })
    const [wowEffect, setWowEffect] = useState<any>(null)
    const [wowOptions, setWowOptions] = useState<any[]>([])
    const [extraOptions, setExtraOptions] = useState<any[]>([])
    const [postcardItem, setPostcardItem] = useState<any>(null)
    const [selectedExtras, setSelectedExtras] = useState<number[]>([]) // IDs of selected extras
    const [isOrderPlaced, setIsOrderPlaced] = useState(false)
    const [isPlacingOrder, setIsPlacingOrder] = useState(false)
    const [clickPayUrl, setClickPayUrl] = useState<string | null>(null)
    const [clickPayFallback, setClickPayFallback] = useState(false)
    const [paymeReceiptId, setPaymeReceiptId] = useState<string | null>(null)

    useEffect(() => {
        api.getWowEffects().then(effects => {
            const active = effects.filter(e => e.is_active)
            setWowOptions(active.filter(e => e.category === 'wow'))
            setExtraOptions(active.filter(e => e.category === 'extra'))
            setPostcardItem(active.find(e => e.category === 'postcard'))
        })
    }, [])

    // Payme Subscribe API: polling статуса чека
    useEffect(() => {
        if (!paymeReceiptId) return
        const interval = setInterval(async () => {
            const status = await api.getPaymeReceiptStatus(paymeReceiptId)
            if (status.paid) {
                clearInterval(interval)
                setPaymeReceiptId(null)
                clearCart() // Очищаем корзину только после подтверждённой оплаты Payme
                const duration = 3 * 1000
                const animationEnd = Date.now() + duration
                const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 }
                const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min
                const iv = setInterval(function () {
                    const timeLeft = animationEnd - Date.now()
                    if (timeLeft <= 0) return clearInterval(iv)
                    const particleCount = 50 * (timeLeft / duration)
                    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: ['#000000', '#FFD700', '#FF1493'] })
                    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: ['#000000', '#FFD700', '#FF1493'] })
                }, 250)
                toast.success('Оплата прошла успешно!')
            }
        }, 2500)
        return () => clearInterval(interval)
    }, [paymeReceiptId])

    // Delivery Time State
    const [deliveryType, setDeliveryType] = useState<'ready' | 'scheduled'>('ready')
    const [deliveryDate, setDeliveryDate] = useState<string>('')
    const [deliveryTime, setDeliveryTime] = useState<string>('')

    const dates = useMemo(() => {
        const d = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const next = new Date(today);
            next.setDate(today.getDate() + i);
            d.push({
                full: next.toISOString().split('T')[0],
                day: next.getDate(),
                month: next.toLocaleString('ru', { month: 'short' }),
                weekday: i === 0 ? 'сегодня' : i === 1 ? 'завтра' : next.toLocaleString('ru', { weekday: 'short' })
            });
        }
        return d;
    }, []);

    useEffect(() => {
        if (!deliveryDate) setDeliveryDate(dates[0].full)
        if (!deliveryTime) setDeliveryTime('12:00 - 13:00')
    }, [dates])

    const timeSlots = [
        "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00",
        "12:00 - 13:00", "13:00 - 14:00", "14:00 - 15:00",
        "15:00 - 16:00", "16:00 - 17:00", "17:00 - 18:00",
        "18:00 - 19:00", "19:00 - 20:00", "20:00 - 21:00"
    ]

    const { cartItems, totalPrice: basePrice, clearCart, isLoaded } = useCart()

    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)

    useEffect(() => {
        const handleFocus = (e: any) => {
            if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
                setIsKeyboardVisible(true)
            }
        }
        const handleBlur = (e: any) => {
            if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
                setIsKeyboardVisible(false)
            }
        }

        window.addEventListener('focusin', handleFocus)
        window.addEventListener('focusout', handleBlur)

        // Visual Viewport API for more reliable keyboard detection on some mobile browsers
        const handleViewportResize = () => {
            if (window.visualViewport) {
                const isProbablyKeyboard = window.visualViewport.height < window.innerHeight * 0.8
                setIsKeyboardVisible(isProbablyKeyboard)
            }
        }

        window.visualViewport?.addEventListener('resize', handleViewportResize)

        return () => {
            window.removeEventListener('focusin', handleFocus)
            window.removeEventListener('focusout', handleBlur)
            window.visualViewport?.removeEventListener('resize', handleViewportResize)
        }
    }, [])

    const totalPrice = useMemo(() => {
        const wowPrice = wowEffect ? Number(wowEffect.price) : 0
        const postcardPrice = postcard.active ? Number(postcardItem?.price ?? 10000) : 0
        const extrasPrice = selectedExtras.reduce((sum, id) => {
            const item = extraOptions.find(e => Number(e.id) === Number(id))
            return sum + (item ? Number(item.price) : 0)
        }, 0)

        return basePrice + wowPrice + postcardPrice + extrasPrice
    }, [basePrice, wowEffect, postcard.active, postcardItem, selectedExtras, extraOptions])

    // Redirect if empty
    useEffect(() => {
        if (typeof window !== 'undefined' && isLoaded && cartItems.length === 0 && !isOrderPlaced) {
            router.replace('/')
        }
    }, [isLoaded, cartItems, isOrderPlaced, router])

    if (!isLoaded) {
        return (
            <div className="min-h-screen relative flex items-center justify-center">
                <AnimatedBackground />
                <div className="w-12 h-12 border-4 border-black/10 border-t-black rounded-full animate-spin"></div>
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
                addons: selectedExtras,
                delivery_time: deliveryType === 'ready' ? 'По готовности' : `${deliveryDate} в ${deliveryTime}`
            }

            const phoneForOrder = userProfile?.phone_number || (telegramUser as any)?.phone_number || 'Уточнить';
            const orderData = {
                customer_name: telegramUser?.first_name || 'Гость',
                customer_phone: phoneForOrder,
                total_price: totalPrice,
                telegram_id: telegramUser?.id,
                address: address ? `${address.title}: ${address.street}${address.details ? `, ${address.details}` : ''}` : undefined,
                comment: postcard.active ? postcard.text : undefined,
                delivery_time: deliveryType === 'ready' ? 'По готовности' : `${deliveryDate} в ${deliveryTime}`,
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

            const createdOrder = await api.createOrder(orderData)

            if (paymentMethod === 'click' || paymentMethod === 'payme') {
                const ordersUrl = typeof window !== 'undefined' ? `${window.location.origin}/orders` : 'http://localhost:3000/orders';
                const clickReturnUrl = 'https://t.me/rich_garden_bot?start=payment_done';
                const returnUrl = paymentMethod === 'click' ? clickReturnUrl : ordersUrl;
                const phoneForClick = userProfile?.phone_number || (telegramUser as any)?.phone_number;
                const telegramId = telegramUser?.id ?? null;

                if (paymentMethod === 'click') {
                    const invoice = await api.createClickInvoice(createdOrder.id, totalPrice, returnUrl, phoneForClick, telegramId);
                    console.log('[Click] createClickInvoice response:', { status: invoice?.status, payment_url: invoice?.payment_url, url: invoice?.url, invoice_id: invoice?.invoice_id, fallback: invoice?.fallback_pay_link });
                    const clickSuccess = invoice && invoice.status === 'success' && (invoice.invoice_id != null || invoice.payment_url || invoice.url || invoice.fallback_pay_link);
                    if (clickSuccess) {
                        // Не очищаем корзину — только после успешной оплаты; при возврате назад покажем уведомление и оставим товары
                        setIsOrderPlaced(true);
                        setIsPlacingOrder(false);
                        const payUrl = invoice.payment_url || invoice.url || 'https://click.uz';
                        console.log('[Click] using payUrl:', payUrl);
                        setClickPayUrl(payUrl);
                        setClickPayFallback(Boolean(invoice.fallback_pay_link));
                        return;
                    }
                    let errorMsg = invoice?.error || 'Ошибка создания счёта Click. Попробуйте позже или выберите другой способ оплаты.';
                    if (typeof errorMsg === 'string' && /не является пользователем|not a click user/i.test(errorMsg))
                        errorMsg = 'Этот номер не привязан к Click. Укажите номер с аккаунтом Click или выберите Payme / наличными.';
                    await api.deleteOrder(createdOrder.id);
                    alert(errorMsg);
                    setIsPlacingOrder(false);
                    return;
                }

                // Payme: Subscribe API (Mini App) — receipts.create + receipts.send, без редиректа
                const receipt = await api.createPaymeReceipt(createdOrder.id, phoneForClick ?? undefined);
                if (receipt?.status === 'success' && receipt?.receipt_id) {
                    // Не очищаем корзину здесь — только когда опрос вернёт status.paid
                    setIsOrderPlaced(true);
                    setIsPlacingOrder(false);
                    setPaymeReceiptId(receipt.receipt_id);
                    return;
                }
                let errorMsg = receipt?.error || 'Ошибка создания чека Payme. Попробуйте позже или выберите другой способ оплаты.';
                if (receipt?.error_code === -31001 || receipt?.error_type === 'service_unavailable') {
                    errorMsg = 'Сервис Payme временно недоступен. Возможные причины:\n' +
                        '• Касса не активирована для Subscribe API\n' +
                        '• Временные проблемы на стороне Payme\n\n' +
                        'Попробуйте позже или выберите другой способ оплаты (Click или наличные).';
                }
                await api.deleteOrder(createdOrder.id);
                alert(errorMsg);
                setIsPlacingOrder(false);
                return;
            }

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
        if (!tempAddress.street) {
            alert("Пожалуйста, введите адрес")
            return
        }

        if (!telegramUser?.id) {
            console.warn("Telegram user not found, using address locally")
            setIsSaving(true)
            setTimeout(() => {
                setAddress(tempAddress)
                setIsSaving(false)
                setIsAddingAddress(false)
            }, 600)
            return
        }

        setIsSaving(true)

        try {
            const newAddr = await api.createAddress(telegramUser.id, {
                title: tempAddress.title,
                address: tempAddress.street,
                info: tempAddress.details
            })

            if (newAddr) {
                console.log("Address saved successfully:", newAddr)
                setSavedAddresses(prev => {
                    const exists = prev.find(a => a.id === newAddr.id)
                    if (exists) return prev
                    return [...prev, newAddr]
                })
                setAddress({ title: newAddr.title, street: newAddr.address, details: newAddr.info })
                toast.success("Адрес сохранен")
            } else {
                console.error("Failed to save address to DB (empty response)")
                setAddress(tempAddress)
                alert("Ошибка: Не удалось сохранить адрес в базе")
            }
        } catch (e: any) {
            console.error("Address save error:", e)
            setAddress(tempAddress)
            alert(`Ошибка при сохранении: ${e.message || "Неизвестная ошибка"}`)
        }

        setTimeout(() => {
            setIsSaving(false)
            setIsAddingAddress(false)
        }, 500)
    }


    return (
        <main className="min-h-screen relative pb-44 font-sans selection:bg-black selection:text-white">
            <AnimatedBackground />

            {/* Header */}
            <header className={cn(
                "fixed top-0 inset-x-0 z-50 transition-all duration-300 px-2",
                scrolled ? "bg-white border-b border-black/5" : "bg-transparent"
            )}>
                <div className="px-5 h-16 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full border border-black/5 bg-transparent active:scale-95 transition-transform"
                    >
                        <ChevronLeft size={24} className="text-black" />
                    </button>
                    <h1 className="text-[18px] font-bold text-black uppercase tracking-tight">Оформление</h1>
                    <div className="w-10"></div>
                </div>
            </header>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="px-5 pt-20 space-y-8"
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
                                                className="min-w-[160px] bg-white p-4 rounded-[24px] border border-black/5 text-left flex flex-col gap-1"
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
                                    className="w-full h-[100px] rounded-[32px] border-2 border-dashed border-black/5 flex flex-col items-center justify-center gap-2 text-black/40 hover:bg-white/40 hover:border-black/20 active:scale-[0.98] transition-all bg-white"
                                >
                                    <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center">
                                        <ChevronRight size={20} className="text-black rotate-90" />
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
                                                className="w-full h-14 bg-black text-white font-bold text-[16px] rounded-[24px] mt-2 active:scale-[0.98] border border-black/5 transition-all"
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
                                className="bg-white rounded-[32px] p-5 border border-black/5 relative overflow-hidden group active:scale-[0.98] transition-all duration-300"
                            >
                                <div className="flex items-start gap-4 z-10 relative">
                                    <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center shrink-0">
                                        <MapPin size={22} className="text-white" strokeWidth={2.5} />
                                    </div>
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <h3 className="text-[17px] font-bold text-black leading-tight mb-1">
                                            {address.title}
                                        </h3>
                                        <p className="text-[16px] font-medium text-black/80 leading-snug">
                                            {address.street}
                                        </p>
                                        <p className="text-[14px] text-black/50 mt-1.5 leading-relaxed font-medium">
                                            {address.details}
                                        </p>
                                    </div>
                                </div>
                                {/* Decorative Map BG Pattern */}
                                <div className="absolute top-0 right-0 w-32 h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.section>

                {/* Courier Comment */}
                <motion.section variants={itemVariants}>
                    <div className="flex items-center gap-3 mb-4 px-1">
                        <h2 className="text-[22px] font-extrabold text-black leading-none px-1">пожелания</h2>
                    </div>
                    <div className="bg-white rounded-[28px] p-2 pr-4 border border-black/5 flex items-center gap-3 transition-all">
                        <div className="w-12 h-12 rounded-[20px] bg-black/5 flex items-center justify-center shrink-0">
                            <PenLine size={22} className="text-black" strokeWidth={1.5} />
                        </div>
                        <input
                            type="text"
                            placeholder="комментарий к заказу"
                            className="flex-1 h-full bg-transparent font-black text-[16px] text-black placeholder:text-black/20 outline-none lowercase"
                        />
                    </div>
                </motion.section>

                {/* Delivery Time Section */}
                <motion.section variants={itemVariants}>
                    <div className="flex items-end justify-between mb-4 px-1">
                        <h2 className="text-[22px] font-extrabold text-black leading-none px-1 lowercase">когда доставить?</h2>
                    </div>

                    <div className="space-y-4">
                        {/* Type Toggle */}
                        <div className="bg-white rounded-[32px] p-2 border border-black/5 grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setDeliveryType('ready')}
                                className={cn(
                                    "h-14 rounded-[24px] font-medium text-[15px] transition-all lowercase",
                                    deliveryType === 'ready' ? "bg-black text-white" : "text-black/40 hover:bg-black/5"
                                )}
                            >
                                по готовности
                            </button>
                            <button
                                onClick={() => setDeliveryType('scheduled')}
                                className={cn(
                                    "h-14 rounded-[24px] font-medium text-[15px] transition-all lowercase",
                                    deliveryType === 'scheduled' ? "bg-black text-white" : "text-black/40 hover:bg-black/5"
                                )}
                            >
                                ко времени
                            </button>
                        </div>

                        <AnimatePresence mode="wait">
                            {deliveryType === 'scheduled' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-4 overflow-hidden"
                                >
                                    {/* Date Selector */}
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
                                        {dates.map((d, i) => (
                                            <button
                                                key={d.full}
                                                onClick={() => setDeliveryDate(d.full)}
                                                className={cn(
                                                    "shrink-0 min-w-[80px] h-[90px] rounded-[24px] flex flex-col items-center justify-center gap-1 transition-all border",
                                                    deliveryDate === d.full
                                                        ? "bg-black border-black text-white"
                                                        : "bg-white border-black/5 text-black hover:bg-white/60"
                                                )}
                                            >
                                                <span className={cn("text-[10px] font-medium uppercase tracking-widest", deliveryDate === d.full ? "text-white/40" : "text-black/20")}>
                                                    {d.weekday}
                                                </span>
                                                <span className="text-[20px] font-medium leading-none">{d.day}</span>
                                                <span className={cn("text-[12px] font-medium lowercase", deliveryDate === d.full ? "text-white/60" : "text-black/40")}>
                                                    {d.month}
                                                </span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Time Selector */}
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
                                        {timeSlots.map((slot) => (
                                            <button
                                                key={slot}
                                                onClick={() => setDeliveryTime(slot)}
                                                className={cn(
                                                    "shrink-0 min-w-[130px] h-12 rounded-[22px] font-medium text-[14px] transition-all border lowercase",
                                                    deliveryTime === slot
                                                        ? "bg-black border-black text-white"
                                                        : "bg-white border-black/5 text-black active:bg-white/60"
                                                )}
                                            >
                                                {slot}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {deliveryType === 'ready' && (
                            <div className="bg-black/5 rounded-[28px] p-5 flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center shrink-0">
                                    <Zap size={20} className="text-black/20" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-[15px] font-black text-black/60 lowercase">быстрая доставка</h4>
                                    <p className="text-[13px] font-medium text-black/30 leading-snug lowercase">
                                        доставим букет сразу после того, как флорист закончит его сборку. обычно это занимает от 40 до 90 минут.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.section>

                {/* Add-ons Section */}
                <motion.section variants={itemVariants}>
                    <div className="flex items-center gap-3 mb-4 px-1">
                        <h2 className="text-[22px] font-extrabold text-black leading-none">Дополнительно</h2>
                    </div>

                    <div className="bg-white rounded-[32px] p-2 border border-black/5 space-y-2">
                        {/* Postcard */}
                        <div className="rounded-[28px] overflow-hidden transition-all duration-300">
                            <button
                                onClick={() => setPostcard({ ...postcard, active: !postcard.active })}
                                className={cn(
                                    "w-full p-4 flex items-center gap-4 transition-all",
                                    postcard.active ? "bg-black text-white" : "bg-transparent text-black active:bg-black/5"
                                )}
                            >
                                <div className={cn(
                                    "w-12 h-12 rounded-[22px] flex items-center justify-center shrink-0 transition-colors",
                                    postcard.active ? "bg-white/20" : "bg-black/5"
                                )}>
                                    <PenLine size={24} strokeWidth={1.5} className={postcard.active ? 'text-white' : 'text-black'} />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="flex justify-between items-center">
                                        <h3 className={cn("text-[16px] font-bold leading-tight", postcard.active ? "text-white" : "text-black")}>{postcardItem?.name ?? 'Открытка'}</h3>
                                        <span className={cn("text-[13px] font-bold", postcard.active ? "text-white/80" : "text-black/60")}>{formatPrice(postcardItem?.price ?? 10000)} сум</span>
                                    </div>
                                    <p className={cn("text-[13px] font-medium", postcard.active ? "text-white/60" : "text-gray-500")}>{postcardItem?.description ?? 'Напишите теплые слова'}</p>
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
                            <div className="flex flex-col gap-2">
                                {wowOptions.map(option => {
                                    const IconComp = ICON_MAP[option.icon] || Zap
                                    const isSelected = wowEffect?.id === option.id
                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => setWowEffect(isSelected ? null : option)}
                                            className={`relative pl-3 pr-5 py-3.5 rounded-[24px] border transition-all flex flex-col gap-2 ${isSelected
                                                ? 'bg-black border-black text-white'
                                                : 'bg-white border-black/5 text-black'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3 w-full">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isSelected ? 'bg-white/20' : 'bg-gray-100'
                                                    }`}>
                                                    <IconComp size={19} className={isSelected ? 'text-white' : 'text-orange-500'} />
                                                </div>
                                                <div className="flex-1 min-w-0 flex justify-between items-center text-left">
                                                    <span className={`font-bold text-[15px] truncate ${isSelected ? 'text-white' : 'text-black'}`}>{option.name}</span>
                                                    <span className={`text-[13px] font-bold shrink-0 ${isSelected ? 'text-white/80' : 'text-black/60'}`}>{formatPrice(option.price)} сум</span>
                                                </div>
                                            </div>
                                            <AnimatePresence>
                                                {isSelected && option.description && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="px-1 text-left"
                                                    >
                                                        <p className="text-[12px] font-medium text-white/70 leading-relaxed pb-1">
                                                            {option.description}
                                                        </p>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Extra Items (Balloons, Toys from DB) */}
                        <div className="p-2 pt-0">
                            <h4 className="px-2 mb-3 text-[13px] font-bold text-black/40 uppercase tracking-wider">К подарку</h4>
                            <div className="flex flex-col gap-2">
                                {extraOptions.map(option => {
                                    const IconComp = ICON_MAP[option.icon] || Smile
                                    const isSelected = selectedExtras.includes(option.id)
                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => {
                                                if (isSelected) setSelectedExtras(selectedExtras.filter(id => id !== option.id))
                                                else setSelectedExtras([...selectedExtras, option.id])
                                            }}
                                            className={cn(
                                                "w-full p-3 rounded-[24px] flex flex-col gap-2 transition-all",
                                                isSelected ? "bg-black text-white" : "bg-white border border-black/5 active:bg-black/10"
                                            )}
                                        >
                                            <div className="flex items-center gap-4 w-full">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-[18px] flex items-center justify-center shadow-sm shrink-0",
                                                    isSelected ? "bg-white/20 text-white" : "bg-white text-gray-400"
                                                )}>
                                                    <IconComp size={20} />
                                                </div>
                                                <div className="flex-1 flex justify-between items-center text-left">
                                                    <span className="font-bold text-[15px]">{option.name}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn("text-[13px] font-bold", isSelected ? "text-white/80" : "text-black/60")}>{formatPrice(option.price)} сум</span>
                                                        {isSelected && <Check size={18} className="text-white" />}
                                                    </div>
                                                </div>
                                            </div>
                                            <AnimatePresence>
                                                {isSelected && option.description && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="px-1 text-left"
                                                    >
                                                        <p className={cn("text-[12px] font-medium leading-relaxed pb-1", isSelected ? "text-white/60" : "text-gray-400")}>
                                                            {option.description}
                                                        </p>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </button>
                                    )
                                })}
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
                                className={cn(
                                    "relative h-[88px] rounded-[28px] p-4 flex flex-col justify-between transition-all duration-300 border border-black/5",
                                    paymentMethod === method.id
                                        ? "bg-black text-white scale-[1.02]"
                                        : "bg-white active:scale-95"
                                )}
                            >
                                <div className="flex items-start justify-between w-full">
                                    <div className={cn(
                                        "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors",
                                        paymentMethod === method.id ? "bg-white/20 text-white" : `${method.bg} ${method.color}`
                                    )}>
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
                                <span className={cn("text-[15px] font-bold text-left", paymentMethod === method.id ? "text-white" : "text-black")}>
                                    {method.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </motion.section>
            </motion.div>

            {/* Bottom Action */}
            <AnimatePresence>
                {!isKeyboardVisible && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed bottom-8 left-0 right-0 px-5 z-40"
                    >
                        <div className="absolute inset-x-0 bottom-[-32px] h-[100px] bg-gradient-to-t from-white/20 to-transparent pointer-events-none backdrop-blur-sm" />
                        <button
                            onClick={handlePlaceOrder}
                            disabled={isPlacingOrder || cartItems.length === 0}
                            className="relative w-full h-[72px] bg-[#111] rounded-[28px] flex items-center justify-between pl-7 pr-2 active:scale-[0.98] transition-all overflow-hidden disabled:opacity-80"
                        >
                            {isPlacingOrder ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-col items-start justify-center space-y-0.5">
                                        <span className="text-white/50 text-[12px] font-bold uppercase tracking-wider">итого</span>
                                        <span className="text-white font-bold text-[20px] tracking-tight">{formatPrice(totalPrice)} сум</span>
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
                )}
            </AnimatePresence>

            {/* Success Overlay */}
            <AnimatePresence>
                {isOrderPlaced && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-between p-6 pb-12 overflow-hidden"
                    >
                        {/* Кнопка «Назад» на оверлее — при возврате без оплаты показываем уведомление, корзина не очищается */}
                        {(clickPayUrl || paymeReceiptId) && (
                            <button
                                type="button"
                                onClick={() => {
                                    setClickPayUrl(null);
                                    setPaymeReceiptId(null);
                                    setIsOrderPlaced(false);
                                    toast.error('Оплата не удалась', { description: 'Вы вернулись назад. Товары остались в корзине — можете оплатить снова.' });
                                }}
                                className="absolute top-6 left-5 z-20 w-11 h-11 flex items-center justify-center rounded-full bg-gray-100 text-black active:scale-90 transition-transform"
                            >
                                <ChevronLeft size={24} />
                            </button>
                        )}
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
                            {clickPayUrl ? (
                                <>
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                                        className="w-20 h-20 bg-[#00aeef]/10 rounded-[24px] flex items-center justify-center mb-8"
                                    >
                                        <CreditCard size={36} className="text-[#00aeef]" />
                                    </motion.div>
                                    <motion.h2
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-[28px] font-black text-black mb-3 leading-none text-center tracking-tighter lowercase"
                                    >
                                        счёт выставлен
                                    </motion.h2>
                                    <motion.p
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                        className="text-[15px] text-gray-500 font-medium text-center max-w-[300px] leading-relaxed lowercase"
                                    >
                                        {clickPayFallback
                                            ? 'по этому номеру нет аккаунта Click. нажмите кнопку ниже — откроется оплата картой на сайте Click.'
                                            : 'в приложении Click пришло уведомление «Выставлен счёт…». нажмите кнопку ниже, откройте Click и оплатите счёт там.'}
                                    </motion.p>
                                </>
                            ) : paymeReceiptId ? (
                                <>
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                                        className="w-20 h-20 bg-[#00aeef]/10 rounded-[24px] flex items-center justify-center mb-8"
                                    >
                                        <CreditCard size={36} className="text-[#00aeef]" />
                                    </motion.div>
                                    <motion.h2
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-[28px] font-black text-black mb-3 leading-none text-center tracking-tighter lowercase"
                                    >
                                        ваш заказ принят!
                                    </motion.h2>
                                    <motion.p
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                        className="text-[15px] text-gray-500 font-medium text-center max-w-[300px] leading-relaxed lowercase"
                                    >
                                        счёт выставлен в приложении Payme — пришло уведомление «Выставлен счёт…». нажмите кнопку ниже, откройте Payme и оплатите счёт там.
                                    </motion.p>
                                </>
                            ) : (
                                <>
                                    <motion.div
                                        initial={{ scale: 0, rotate: -45 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                                        className="w-24 h-24 bg-black rounded-[32px] flex items-center justify-center mb-10"
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
                                </>
                            )}
                        </div>

                        <div className="relative z-10 w-full space-y-6">
                            {!clickPayUrl && !paymeReceiptId && (
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
                            )}

                            <motion.div
                                initial={{ y: 40, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 1 }}
                                className="flex flex-col gap-3"
                            >
                                {clickPayUrl && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const url = clickPayUrl || '';
                                                if (!url) {
                                                    console.error('[Click] URL пустой!');
                                                    return;
                                                }

                                                console.log('[Click] Открываю URL:', url);

                                                const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;

                                                try {
                                                    if (tg?.openLink) {
                                                        tg.openLink(url, { try_instant_view: false });
                                                    } else if (tg?.openTelegramLink) {
                                                        tg.openTelegramLink(url);
                                                    } else {
                                                        window.location.href = url;
                                                    }
                                                } catch (e) {
                                                    console.error('[Click] Ошибка при открытии:', e);
                                                    try { window.location.href = url; } catch (e2) { alert('Не удалось открыть Click. Скопируйте ссылку: ' + url); }
                                                }
                                            }}
                                            className="w-full h-[72px] bg-[#00aeef] rounded-[28px] text-white font-bold text-[17px] active:scale-[0.98] border border-black/5 transition-all flex items-center justify-center gap-3 lowercase"
                                        >
                                            <span>Открыть Click</span>
                                            <ChevronRight size={20} />
                                        </button>
                                        <div className="w-full h-[72px] bg-teal-50 rounded-[28px] text-teal-700 font-medium text-[15px] flex items-center justify-center gap-2 lowercase border border-teal-200">
                                            <span className="inline-block w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                                            проверяем статус оплаты…
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setClickPayUrl(null);
                                                setIsOrderPlaced(false);
                                                toast.error('Оплата не удалась', { description: 'Вы вернулись назад. Товары остались в корзине — можете оплатить снова.' });
                                            }}
                                            className="w-full h-[56px] bg-gray-100 rounded-[24px] text-gray-700 font-bold text-[15px] active:scale-[0.98] transition-all lowercase"
                                        >
                                            Вернуться к заказу
                                        </button>
                                    </>
                                )}
                                {paymeReceiptId && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const url = `https://checkout.paycom.uz/${paymeReceiptId}`;
                                                const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;
                                                try {
                                                    if (tg?.openLink) {
                                                        tg.openLink(url, { try_instant_view: false });
                                                    } else if (tg?.openTelegramLink) {
                                                        tg.openTelegramLink(url);
                                                    } else {
                                                        window.location.href = url;
                                                    }
                                                } catch (e) {
                                                    console.error('[Payme] Ошибка при открытии:', e);
                                                    try { window.location.href = url; } catch (e2) { alert('Не удалось открыть счёт Payme. Перейдите: ' + url); }
                                                }
                                            }}
                                            className="w-full h-[72px] bg-[#00aeef] rounded-[28px] text-white font-bold text-[17px] active:scale-[0.98] border border-black/5 transition-all flex items-center justify-center gap-3 lowercase"
                                        >
                                            <span>Открыть Payme</span>
                                            <ChevronRight size={20} />
                                        </button>
                                        <div className="w-full h-[72px] bg-teal-50 rounded-[28px] text-teal-700 font-medium text-[15px] flex items-center justify-center gap-2 lowercase border border-teal-200">
                                            <span className="inline-block w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                                            проверяем статус оплаты…
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPaymeReceiptId(null);
                                                setIsOrderPlaced(false);
                                                toast.error('Оплата не удалась', { description: 'Вы вернулись назад. Товары остались в корзине — можете оплатить снова.' });
                                            }}
                                            className="w-full h-[56px] bg-gray-100 rounded-[24px] text-gray-700 font-bold text-[15px] active:scale-[0.98] transition-all lowercase"
                                        >
                                            Вернуться к заказу
                                        </button>
                                    </>
                                )}
                                {!clickPayUrl && !paymeReceiptId && (
                                    <>
                                        <Link
                                            href="/orders"
                                            className="w-full h-[72px] bg-black rounded-[28px] text-white font-bold text-[17px] active:scale-[0.98] border border-black/5 transition-all flex items-center justify-center gap-3"
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
                                    </>
                                )}
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    )
}
