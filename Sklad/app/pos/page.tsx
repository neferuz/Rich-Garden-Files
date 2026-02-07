"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Plus, User, ShoppingBag, X, Calendar, Phone, Check, ChevronRight, CreditCard, Wallet, Smartphone, MessageSquare, Percent } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { api, Client, Product, OrderCreate } from "@/services/api"
// import { toast } from "sonner" // Removing sonner
// import Image from "next/image" // Removed to fix image loading issues
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

    useEffect(() => {
        // Restore session from localStorage
        const savedCart = localStorage.getItem('pos_cart')
        const savedClient = localStorage.getItem('pos_selected_client')

        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart))
            } catch (e) {
                console.error("Failed to parse cart", e)
            }
        }

        if (savedClient) {
            try {
                setSelectedClient(JSON.parse(savedClient))
            } catch (e) {
                console.error("Failed to parse client", e)
            }
        }

        // Load products
        setLoadingProducts(true)
        api.getProducts()
            .then(data => {
                setProducts(data || [])
            })
            .catch(err => {
                console.error("Error loading products:", err)
            })
            .finally(() => {
                setLoadingProducts(false)
            })

        // Load clients
        api.getClients()
            .then(data => {
                setClients(data || [])
            })
            .catch(err => {
                console.error("Error loading clients:", err)
            })
    }, [])

    // Hide total block when keyboard is open (input focused)
    useEffect(() => {
        const handleFocus = (e: FocusEvent) => {
            const target = e.target as HTMLElement
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                // Мгновенное скрытие без задержек
                setIsKeyboardOpen(true)
            }
        }

        const handleBlur = () => {
            // Delay to check if another input is focused
            setTimeout(() => {
                const activeElement = document.activeElement as HTMLElement
                if (!activeElement || (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA' && !activeElement.isContentEditable)) {
                    setIsKeyboardOpen(false)
                }
            }, 150)
        }

        // Listen for viewport changes (Telegram WebApp)
        const handleViewportChange = () => {
            if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                const tg = window.Telegram.WebApp
                const viewportHeight = tg.viewportHeight || window.innerHeight
                const isVisible = viewportHeight < window.outerHeight * 0.75 // If viewport is significantly smaller, keyboard is likely open
                setIsKeyboardOpen(isVisible)
            }
        }

        // Also check on window resize (for mobile browsers)
        const handleResize = () => {
            if (typeof window !== 'undefined') {
                const visualViewport = window.visualViewport
                if (visualViewport) {
                    const heightDiff = window.innerHeight - visualViewport.height
                    // Более чувствительное определение - клавиатура открыта если высота уменьшилась больше чем на 100px
                    setIsKeyboardOpen(heightDiff > 100)
                } else {
                    // Fallback для браузеров без visualViewport
                    const currentHeight = window.innerHeight
                    const initialHeight = window.screen.height
                    setIsKeyboardOpen(currentHeight < initialHeight * 0.7)
                }
            }
        }

        document.addEventListener('focusin', handleFocus)
        document.addEventListener('focusout', handleBlur)
        window.addEventListener('resize', handleResize)
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize)
        }

        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp
            tg.onEvent('viewportChanged', handleViewportChange)
        }

        return () => {
            document.removeEventListener('focusin', handleFocus)
            document.removeEventListener('focusout', handleBlur)
            window.removeEventListener('resize', handleResize)
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleResize)
            }
            if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                const tg = window.Telegram.WebApp
                tg.offEvent('viewportChanged', handleViewportChange)
            }
        }
    }, [])

    const [processing, setProcessing] = useState(false)

    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

    // Checkout State
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


    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(productQuery.toLowerCase())
    )

    const filteredClients = clients.filter(c =>
        c.first_name.toLowerCase().includes(clientQuery.toLowerCase()) ||
        (c.phone_number && c.phone_number.includes(clientQuery))
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

    const router = useRouter()

    const handleCheckout = () => {
        if (!selectedClient) {
            showNotification("Выберите клиента", "error")
            return
        }
        if (cart.length === 0) {
            showNotification("Корзина пуста", "error")
            return
        }
        // Сохраняем данные в localStorage
        localStorage.setItem('pos_cart', JSON.stringify(cart))
        localStorage.setItem('pos_selected_client', JSON.stringify(selectedClient))
        // Переходим на страницу оформления
        router.push('/pos/checkout')
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
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsClientModalOpen(true);
                            }}
                            className="text-blue-600 text-[11px] font-bold flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full active:scale-95 transition-transform relative z-10 cursor-pointer hover:bg-blue-100"
                            type="button"
                            style={{ position: 'relative', zIndex: 100 }}
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
                    {loadingProducts ? (
                        <div className="col-span-2 flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="col-span-2 text-center py-12 text-gray-500">
                            <p className="text-sm">Товары не найдены</p>
                        </div>
                    ) : (
                        filteredProducts.map(product => {
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
                                            <img
                                                src={product.image.startsWith('http') ? product.image : product.image}
                                                alt={product.name}
                                                className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-110"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = '/placeholder.png';
                                                }}
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
                        })
                    )}
                </div>
            </div>

            {/* Итог и кнопка оформления */}
            {cart.length > 0 && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className={`fixed inset-x-0 mx-auto w-full max-w-[350px] z-[60] transition-all duration-150 ease-in-out ${isKeyboardOpen ? 'opacity-0 pointer-events-none translate-y-full scale-95' : 'opacity-100 pointer-events-auto translate-y-0 scale-100'}`}
                    style={{ bottom: 'calc(1.5rem + var(--tg-content-safe-area-bottom) + var(--tg-safe-area-bottom) + 80px)' }}
                >
                    <div className="bg-white/90 backdrop-blur-2xl border border-white/40 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] rounded-[32px] px-6 py-4 flex flex-col gap-3 ring-1 ring-black/5">
                        {/* Итоговая сумма */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Итого</span>
                            <span className="text-xl font-bold text-gray-900">
                                {totalAmount.toLocaleString()} сум
                            </span>
                        </div>

                        {/* Кнопка оформления */}
                        <button
                            onClick={handleCheckout}
                            disabled={!selectedClient || processing}
                            className="w-full h-12 bg-black text-white rounded-[24px] font-bold text-sm shadow-lg shadow-black/20 hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {processing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Оформление...</span>
                                </>
                            ) : (
                                <>
                                    <Check size={18} strokeWidth={2.5} />
                                    <span>Оформить заказ</span>
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Client Modal */}
            <AnimatePresence>
                {isClientModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
                        onClick={() => setIsClientModalOpen(false)}
                        style={{ zIndex: 9999 }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-[32px] p-6 w-full max-w-md shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Новый клиент</h2>
                                <button
                                    onClick={() => setIsClientModalOpen(false)}
                                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Имя *
                                    </label>
                                    <input
                                        type="text"
                                        value={newClient.first_name}
                                        onChange={(e) => setNewClient({ ...newClient, first_name: e.target.value })}
                                        placeholder="Введите имя"
                                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-[16px] focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Телефон
                                    </label>
                                    <input
                                        type="tel"
                                        value={newClient.phone_number}
                                        onChange={(e) => setNewClient({ ...newClient, phone_number: e.target.value })}
                                        placeholder="+998 90 123 45 67"
                                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-[16px] focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Дата рождения
                                    </label>
                                    <input
                                        type="date"
                                        value={newClient.birth_date}
                                        onChange={(e) => setNewClient({ ...newClient, birth_date: e.target.value })}
                                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-[16px] focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                    />
                                </div>

                                <button
                                    onClick={handleAddClient}
                                    className="w-full h-12 bg-black text-white rounded-[16px] font-bold text-sm shadow-lg shadow-black/20 hover:bg-gray-800 active:scale-95 transition-all flex items-center justify-center gap-2 mt-6"
                                >
                                    <Plus size={18} />
                                    <span>Создать клиента</span>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
