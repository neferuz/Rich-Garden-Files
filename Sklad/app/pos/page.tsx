"use client"

import { useState, useEffect } from "react"
import { Search, Plus, User, ShoppingBag, X, Calendar, Phone, Check, ChevronRight, CreditCard, Wallet, Smartphone, MessageSquare, Percent } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { api, Client, Product, OrderCreate } from "@/services/api"
// import { toast } from "sonner" // Removing sonner
import Image from "next/image"
import { NotificationToast } from "@/components/shared/NotificationToast"

export default function POSPage() {
    // Client State
    const [clientQuery, setClientQuery] = useState("")
    const [clients, setClients] = useState<Client[]>([])
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)
    const [isClientModalOpen, setIsClientModalOpen] = useState(false)
    const [newClient, setNewClient] = useState({ first_name: "", phone_number: "", birth_date: "" })

    // Product State
    const [productQuery, setProductQuery] = useState("")
    const [products, setProducts] = useState<Product[]>([])
    const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([])

    // Loading States
    const [loadingProducts, setLoadingProducts] = useState(false)
    const [processing, setProcessing] = useState(false)

    const [isSearchOpen, setIsSearchOpen] = useState(false)

    // Checkout State
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'payme' | 'click'>('cash')
    const [discount, setDiscount] = useState<number | string>("")
    const [comment, setComment] = useState("")

    // Notification State
    const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

    const showNotification = (msg: string, type: 'success' | 'error') => {
        setNotification({ msg, type })
        setTimeout(() => {
            setNotification(null)
        }, 3000)
    }

    useEffect(() => {
        // Initial fetch
        api.getClients().then(setClients).catch(console.error)
        setLoadingProducts(true)
        api.getProducts().then(setProducts).finally(() => setLoadingProducts(false))
    }, [])

    useEffect(() => {
        if (isCheckoutOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => { document.body.style.overflow = 'unset' }
    }, [isCheckoutOpen])

    // Filtered lists
    const filteredClients = clientQuery.length > 0
        ? clients.filter(c => c.first_name.toLowerCase().includes(clientQuery.toLowerCase()) || c.phone_number?.includes(clientQuery))
        : []

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(productQuery.toLowerCase())
    )

    const handleAddClient = async () => {
        try {
            if (!newClient.first_name) return showNotification("Введите имя", "error")

            const created = await api.createClient({
                first_name: newClient.first_name,
                phone_number: newClient.phone_number,
                birth_date: newClient.birth_date,
            })
            setClients(prev => [created, ...prev])
            setSelectedClient(created)
            setIsClientModalOpen(false)
            setNewClient({ first_name: "", phone_number: "", birth_date: "" })
            showNotification("Клиент создан успешно", "success")
        } catch (e) {
            console.error("Error creating client:", e)
            showNotification("Ошибка сервера. Проверьте соединение.", "error")
        }
    }

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id)
            if (existing) {
                return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
            }
            return [...prev, { product, quantity: 1 }]
        })
    }

    const removeFromCart = (productId: number) => {
        setCart(prev => prev.filter(item => item.product.id !== productId))
    }

    const updateQuantity = (productId: number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === productId) {
                const newQty = Math.max(1, item.quantity + delta)
                return { ...item, quantity: newQty }
            }
            return item
        }))
    }

    const totalAmount = cart.reduce((sum, item) => sum + (item.product.price_raw * item.quantity), 0)

    const handleCheckout = () => {
        if (!selectedClient) {
            showNotification("Выберите клиента", "error")
            return
        }
        if (cart.length === 0) {
            showNotification("Корзина пуста", "error")
            return
        }
        setIsCheckoutOpen(true)
    }

    const handleProcessOrder = async () => {
        if (!selectedClient) return

        setProcessing(true)
        try {
            const discountVal = Number(discount?.toString().replace(/\s/g, '')) || 0
            const finalTotal = Math.max(0, totalAmount - discountVal)

            const orderData: OrderCreate = {
                user_id: selectedClient.id,
                items: JSON.stringify(cart.map(item => ({
                    id: item.product.id,
                    quantity: item.quantity,
                    price: item.product.price_raw
                }))),
                total_price: finalTotal,
                status: 'done',
                customer_name: selectedClient.first_name,
                customer_phone: selectedClient.phone_number,
                payment_method: paymentMethod,
                comment: comment,
                extras: JSON.stringify({ discount: discountVal })
            }

            await api.createOrder(orderData)
            showNotification("Продажа успешна!", "success")

            // Reset
            setCart([])
            setSelectedClient(null)
            setClientQuery("")
            setIsCheckoutOpen(false)
            setDiscount("")
            setComment("")
            setPaymentMethod("cash")
        } catch (e: any) {
            console.error(e)
            showNotification(e.message || "Ошибка при оформлении", "error")
        } finally {
            setProcessing(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-32">
            <AnimatePresence>
                {notification && <NotificationToast msg={notification.msg} type={notification.type} />}
            </AnimatePresence>

            {/* Header with Animated Search */}
            <div className="pt-6 px-6 mb-2">
                <div className="flex items-center justify-between h-14 mb-2 relative">
                    {/* Title & Actions (Visible when search is closed) */}
                    <div className={`absolute inset-0 flex items-center justify-between transition-all duration-300 ${isSearchOpen ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Терминал</h1>
                        </div>

                        <div className="flex gap-2">

                            <button
                                onClick={() => setIsClientModalOpen(true)}
                                className="flex items-center justify-center w-10 h-10 bg-black text-white rounded-full shadow-lg shadow-black/20 hover:bg-gray-800 active:scale-95 transition-all"
                            >
                                <Plus size={22} />
                            </button>
                        </div>
                    </div>

                    {/* Search Input (Visible when search is open) */}
                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isSearchOpen ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 pointer-events-none'}`}>
                        <div className="relative w-full">
                            <input
                                type="text"
                                placeholder="Поиск товаров..."
                                value={productQuery}
                                onChange={(e) => setProductQuery(e.target.value)}
                                className="w-full h-14 pl-12 pr-12 bg-white text-gray-900 placeholder:text-gray-500 placeholder:font-medium rounded-[24px] border border-gray-200 shadow-lg focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-gray-300 transition-all duration-300 text-[15px] font-medium"
                                autoFocus={isSearchOpen}
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                                <Search size={20} strokeWidth={2} />
                            </div>
                            <button
                                onClick={() => { setIsSearchOpen(false); setProductQuery(""); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={18} strokeWidth={2} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Client Section */}
            <div className="mb-8 px-6">
                <div className="flex items-center justify-between mb-2 px-2">
                    <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Клиент</h2>
                    {!selectedClient && (
                        <button
                            onClick={() => setIsClientModalOpen(true)}
                            className="text-blue-600 text-[11px] font-bold flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full active:scale-95 transition-transform"
                        >
                            <Plus size={12} /> Новый
                        </button>
                    )}
                </div>

                {selectedClient ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative overflow-hidden p-3 rounded-[24px] shadow-sm border border-gray-100"
                    >
                        {/* Glass Background */}
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-0" />

                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-[18px] bg-gray-100 flex items-center justify-center text-white shadow-inner overflow-hidden border border-gray-50">
                                    {selectedClient.photo_url ? (
                                        <img src={selectedClient.photo_url} alt={selectedClient.first_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={20} className="text-gray-400" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg leading-tight text-gray-900">{selectedClient.first_name}</h3>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-1">
                                        <Phone size={12} />
                                        {(() => {
                                            const phone = selectedClient.phone_number || "Без номера";
                                            if (!phone || phone === "Без номера") return phone;

                                            let clean = phone.replace(/\s/g, '');
                                            if (!clean.startsWith('+') && /^\d/.test(clean)) clean = '+' + clean;

                                            if (clean.startsWith('+998') && clean.length === 13) {
                                                return `+998 ${clean.slice(4, 6)} ${clean.slice(6, 9)} ${clean.slice(9, 11)} ${clean.slice(11, 13)}`;
                                            }
                                            return phone;
                                        })()}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedClient(null)}
                                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all active:scale-95 bg-white/50"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <div className="relative group">
                        <div className="relative flex items-center w-full transition-all duration-300 transform">
                            <input
                                type="text"
                                placeholder="Поиск клиента..."
                                value={clientQuery}
                                onChange={(e) => setClientQuery(e.target.value)}
                                className="w-full h-14 pl-12 pr-12 bg-white/70 backdrop-blur-md text-gray-900 placeholder:text-gray-500 placeholder:font-medium rounded-[24px] border border-gray-200/50 shadow-sm focus:bg-white focus:ring-4 focus:ring-black/5 focus:shadow-xl focus:border-gray-300 transition-all duration-300 text-[15px] font-medium"
                            />
                            <div className="absolute left-4 flex items-center pointer-events-none text-gray-500 z-20">
                                <Search size={20} strokeWidth={2} />
                            </div>
                            {clientQuery && (
                                <div className="absolute right-3 flex items-center z-20">
                                    <button
                                        onClick={() => setClientQuery("")}
                                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <X size={18} strokeWidth={2} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Autocomplete Dropdown */}
                        <AnimatePresence>
                            {clientQuery.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[24px] shadow-xl border border-gray-100 z-20 overflow-hidden max-h-[300px] overflow-y-auto"
                                >
                                    {filteredClients.length > 0 ? (
                                        filteredClients.map(client => (
                                            <div
                                                key={client.id}
                                                onClick={() => {
                                                    setSelectedClient(client)
                                                    setClientQuery("")
                                                }}
                                                className="p-4 border-b border-gray-50 flex items-center gap-3 hover:bg-gray-50 cursor-pointer last:border-0"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                                                    {client.photo_url ? (
                                                        <img src={client.photo_url} alt={client.first_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User size={16} className="text-gray-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{client.first_name}</div>
                                                    <div className="text-xs text-gray-400 font-medium">
                                                        {(() => {
                                                            const phone = client.phone_number;
                                                            if (!phone) return "";

                                                            let clean = phone.replace(/\s/g, '');
                                                            if (!clean.startsWith('+') && /^\d/.test(clean)) clean = '+' + clean;

                                                            if (clean.startsWith('+998') && clean.length === 13) {
                                                                return `+998 ${clean.slice(4, 6)} ${clean.slice(6, 9)} ${clean.slice(9, 11)} ${clean.slice(11, 13)}`;
                                                            }
                                                            return phone;
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-gray-400">Ничего не найдено</div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Product Section */}
            <div className="mb-24 px-6">
                <div className="flex items-center justify-between mb-2 px-2">
                    <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Товары</h2>
                </div>

                <div className="relative group mb-6">
                    <div className="relative flex items-center w-full transition-all duration-300 transform">
                        <input
                            type="text"
                            placeholder="Поиск товаров..."
                            value={productQuery}
                            onChange={(e) => setProductQuery(e.target.value)}
                            className="w-full h-14 pl-12 pr-14 bg-white/70 backdrop-blur-md text-gray-900 placeholder:text-gray-500 placeholder:font-medium rounded-[24px] border border-gray-200/50 shadow-sm focus:bg-white focus:ring-4 focus:ring-black/5 focus:shadow-xl focus:border-gray-300 transition-all duration-300 text-[15px] font-medium"
                        />
                        <div className="absolute left-4 flex items-center pointer-events-none text-gray-500 z-20">
                            <Search size={20} strokeWidth={2} />
                        </div>

                        {productQuery && (
                            <div className="absolute right-3 flex items-center gap-1 z-20">
                                <button
                                    onClick={() => setProductQuery("")}
                                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X size={18} strokeWidth={2} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {filteredProducts.map(product => {
                        const inCart = cart.find(i => i.product.id === product.id)
                        const quantity = inCart?.quantity || 0

                        return (
                            <motion.div
                                key={product.id}
                                layoutId={`product-${product.id}`}
                                className={`
                                    relative flex flex-col p-2 rounded-[24px] transition-all duration-300 cursor-pointer overflow-hidden group
                                    ${quantity > 0
                                        ? 'bg-white ring-2 ring-green-500 shadow-md'
                                        : 'bg-white border border-gray-100'
                                    }
                                `}
                                onClick={() => quantity > 0 ? removeFromCart(product.id) : addToCart(product)}
                            >
                                {/* Image Area - Taller & Fuller */}
                                <div className="h-32 w-full relative bg-gray-50 rounded-[18px] mb-2 overflow-hidden flex items-center justify-center">
                                    {product.image ? (
                                        <Image
                                            src={product.image.startsWith('http') ? product.image : `http://127.0.0.1:8000${product.image}`}
                                            alt={product.name}
                                            fill
                                            className="object-contain p-2 transition-transform duration-500 group-hover:scale-110"
                                        />
                                    ) : (
                                        <ShoppingBag className="text-gray-200 w-8 h-8" />
                                    )}
                                    {/* Overlay for selection */}
                                    {quantity > 0 && <div className="absolute inset-0 bg-green-500/5" />}
                                </div>

                                {/* Content */}
                                <div className="px-1 flex flex-col pt-0.5">
                                    <h3 className="font-bold text-[13px] leading-[1.2] text-gray-900 line-clamp-2 min-h-[2.4em]">
                                        {product.name}
                                    </h3>

                                    <div className="flex items-end justify-between mt-1">
                                        <span className={`text-[14px] font-bold ${quantity > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                            {product.price_raw?.toLocaleString()} сум
                                        </span>

                                        <div className={`
                                            w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm
                                            ${quantity > 0
                                                ? 'bg-green-500 text-white shadow-green-500/30'
                                                : 'bg-black text-white shadow-black/20'
                                            }
                                        `}>
                                            {quantity > 0 ? (
                                                <span className="font-semibold text-[13px]">{quantity}</span>
                                            ) : (
                                                <Plus size={16} strokeWidth={2} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </div>

            {/* Bottom Cart Bar */}
            <AnimatePresence>
                <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    exit={{ y: 100 }}
                    className="fixed bottom-28 inset-x-0 mx-auto w-full max-w-[350px] z-40"
                >
                    <div className="bg-black text-white p-3 px-5 rounded-[32px] shadow-2xl flex items-center justify-between backdrop-blur-xl bg-black/95">
                        <div>
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wide mb-0.5">К оплате</p>
                            <p className="text-lg font-bold">{totalAmount.toLocaleString()} сум</p>
                        </div>
                        <button
                            onClick={handleCheckout}
                            disabled={processing || cart.length === 0}
                            className="bg-white text-black px-5 py-2.5 rounded-[24px] font-bold text-xs flex items-center gap-2 hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                        >
                            {processing ? '...' : (
                                <>
                                    Оплатить <ChevronRight size={16} />
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Create Client Modal */}
            <AnimatePresence>
                {isClientModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsClientModalOpen(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative z-10"
                        >
                            <h2 className="text-2xl font-bold mb-6">Новый клиент</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-3 mb-1.5 block tracking-widest">Имя</label>
                                    <input
                                        type="text"
                                        value={newClient.first_name}
                                        onChange={e => setNewClient({ ...newClient, first_name: e.target.value })}
                                        className="w-full h-14 px-5 rounded-[24px] bg-gray-50/50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-gray-300 transition-all text-[15px] font-medium text-gray-900 placeholder:font-medium placeholder:text-gray-400"
                                        placeholder="Иван"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-3 mb-1.5 block tracking-widest">Телефон</label>
                                    <input
                                        type="tel"
                                        value={newClient.phone_number}
                                        onChange={e => setNewClient({ ...newClient, phone_number: e.target.value })}
                                        className="w-full h-14 px-5 rounded-[24px] bg-gray-50/50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-gray-300 transition-all text-[15px] font-medium text-gray-900 placeholder:font-medium placeholder:text-gray-400"
                                        placeholder="+998 90 123 45 67"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-3 mb-1.5 block tracking-widest">Дата рождения</label>
                                    <input
                                        type="date"
                                        value={newClient.birth_date}
                                        onChange={e => setNewClient({ ...newClient, birth_date: e.target.value })}
                                        className="w-full h-14 px-5 rounded-[24px] bg-gray-50/50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-gray-300 transition-all text-[15px] font-medium text-gray-900 placeholder:font-medium placeholder:text-gray-400"
                                    />
                                </div>

                                <button
                                    onClick={handleAddClient}
                                    className="w-full h-14 bg-black text-white rounded-[24px] font-bold text-[14px] mt-4 shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
                                >
                                    Создать
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Checkout Modal (Full Screen) */}
            <AnimatePresence>
                {isCheckoutOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: "100%" }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[60] bg-gray-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between shrink-0 shadow-sm z-20">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Оформление заказа</h2>
                                <p className="text-sm text-gray-400 font-medium">Клиент: {selectedClient?.first_name}</p>
                            </div>
                            <button
                                onClick={() => setIsCheckoutOpen(false)}
                                className="w-12 h-12 rounded-full bg-gray-100 text-gray-900 hover:bg-gray-200 flex items-center justify-center transition-colors active:scale-95"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-hidden">
                            <div className="h-full overflow-y-auto p-4 md:p-6">
                                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 pb-6">

                                    {/* Left: Items List */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                            <h3 className="font-bold text-gray-900 text-lg">Выбранные товары</h3>
                                            <span className="text-sm font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                                                {cart.reduce((a, c) => a + c.quantity, 0)} позиции
                                            </span>
                                        </div>
                                        <div className="space-y-3">
                                            {cart.map((item) => (
                                                <div key={item.product.id} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-100 group transition-all hover:shadow-md">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 border border-gray-100 p-1">
                                                            {item.product.image ? (
                                                                <img src={item.product.image.startsWith('http') ? item.product.image : `http://127.0.0.1:8000${item.product.image}`} alt="" className="w-full h-full object-cover rounded-lg" />
                                                            ) : <ShoppingBag size={20} className="text-gray-300" />}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-900 text-[15px]">{item.product.name}</div>
                                                            <div className="text-sm text-gray-500 font-medium flex items-center gap-1.5 mt-0.5">
                                                                <span className="font-bold text-gray-700">{item.quantity} шт</span>
                                                                <span className="text-gray-300">•</span>
                                                                <span>{item.product.price_raw.toLocaleString()} сум</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-base text-gray-900">
                                                            {(item.product.price_raw * item.quantity).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Right: Payment & Summary */}
                                    <div className="space-y-6">
                                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                                            {/* Financials Section */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between py-1">
                                                    <span className="text-gray-500 font-medium font-bold">Сумма заказа</span>
                                                    <span className="text-lg font-bold text-gray-900">{totalAmount.toLocaleString()} сум</span>
                                                </div>

                                                <div className="h-px bg-gray-50 w-full" />

                                                {/* Discount Input */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-2 px-1">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Скидка</label>
                                                        {Number(discount) > 0 && (
                                                            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">Применено</span>
                                                        )}
                                                    </div>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={discount ? discount.toString().replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, " ") : ""}
                                                            onChange={(e) => {
                                                                const raw = e.target.value.replace(/\D/g, '');
                                                                setDiscount(raw);
                                                            }}
                                                            placeholder="0"
                                                            className="w-full h-14 bg-gray-50 border border-transparent rounded-2xl px-5 font-bold text-xl text-gray-900 focus:bg-white focus:border-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all"
                                                        />
                                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-gray-400">сум</div>
                                                    </div>
                                                </div>

                                                {/* Total Board */}
                                                <div className="flex items-center justify-between p-5 bg-[#0a0a0a] text-white rounded-2xl shadow-xl shadow-black/10 mt-2 overflow-hidden relative">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                                                    <div className="relative z-10">
                                                        <span className="text-xs font-bold opacity-60 uppercase tracking-widest flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                                            К оплате
                                                        </span>
                                                        <div className="text-2xl font-black mt-1">
                                                            {Math.max(0, totalAmount - (Number(discount?.toString().replace(/\s/g, '')) || 0)).toLocaleString()} сум
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Payment Methods */}
                                            <div className="pt-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 block px-1">Способ оплаты</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {[
                                                        { id: 'cash', label: 'Наличные', icon: Wallet, color: '#000000' },
                                                        { id: 'card', label: 'Терминал', icon: CreditCard, color: '#000000' },
                                                        { id: 'payme', label: 'Payme', icon: Smartphone, color: '#00CCCC' },
                                                        { id: 'click', label: 'Click', icon: Smartphone, color: '#0073FF' }
                                                    ].map((method) => {
                                                        const isSelected = paymentMethod === method.id;
                                                        return (
                                                            <button
                                                                key={method.id}
                                                                onClick={() => setPaymentMethod(method.id as any)}
                                                                className={`h-14 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold text-sm transition-all active:scale-95 ${isSelected
                                                                    ? 'text-white shadow-lg border-transparent'
                                                                    : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                                                                    }`}
                                                                style={isSelected ? { backgroundColor: method.color } : {}}
                                                            >
                                                                <method.icon size={18} /> {method.label}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            {/* Comment */}
                                            <div className="pt-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block px-1">Заметка</label>
                                                <div className="relative">
                                                    <textarea
                                                        value={comment}
                                                        onChange={(e) => setComment(e.target.value)}
                                                        placeholder="Особенности заказа, упаковка..."
                                                        className="w-full h-24 bg-gray-50 border border-transparent rounded-2xl p-4 text-sm font-medium focus:bg-white focus:border-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all resize-none shadow-inner"
                                                    />
                                                    <MessageSquare size={16} className="absolute right-4 bottom-4 text-gray-300" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fixed Bottom Action */}
                        <div className="p-4 border-t border-gray-100 bg-white shrink-0 safe-bottom z-20">
                            <div className="max-w-6xl mx-auto flex items-center justify-end">
                                <button
                                    onClick={handleProcessOrder}
                                    disabled={processing}
                                    className="w-full md:w-auto md:min-w-[300px] h-14 bg-[#2e6fef] text-white rounded-[20px] font-bold text-lg shadow-xl shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:scale-100"
                                >
                                    {processing ? (
                                        <span className="animate-pulse">Обработка...</span>
                                    ) : (
                                        <>
                                            Подтвердить оплату <ChevronRight size={24} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
