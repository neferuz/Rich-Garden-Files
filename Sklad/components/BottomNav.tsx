"use client"

import { Home, Package, Plus, ClipboardList, User, Banknote, Store } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"

export default function BottomNav() {
    const pathname = usePathname()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

    // Lock body scroll when menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = ""
        }
        return () => {
            document.body.style.overflow = ""
        }
    }, [isMenuOpen])

    // Hide BottomNav when keyboard is open (input focused)
    useEffect(() => {
        const handleFocus = (e: FocusEvent) => {
            const target = e.target as HTMLElement
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
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
            }, 100)
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

        document.addEventListener('focusin', handleFocus)
        document.addEventListener('focusout', handleBlur)
        
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp
            tg.onEvent('viewportChanged', handleViewportChange)
        }

        return () => {
            document.removeEventListener('focusin', handleFocus)
            document.removeEventListener('focusout', handleBlur)
            if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                const tg = window.Telegram.WebApp
                tg.offEvent('viewportChanged', handleViewportChange)
            }
        }
    }, [])

    // Hide BottomNav on Shop page, Expense creation, Supply page, Broadcast page, and Checkout page
    if (pathname?.startsWith("/shop") || pathname === "/finance/expense" || pathname === "/warehouse/supply" || pathname === "/flowers/new" || pathname === "/clients/broadcast" || pathname === "/pos/checkout") {
        return null
    }

    // Helper to determine active state style
    const getLinkClass = (isActive: boolean) => {
        if (isActive) {
            return "flex flex-col items-center gap-1 group"
        }
        return "flex flex-col items-center gap-1 text-gray-400 hover:text-black transition-colors group p-2"
    }

    const renderIcon = (isActive: boolean, Icon: any) => {
        if (isActive) {
            return (
                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center shadow-lg shadow-black/20 group-hover:scale-105 transition-transform duration-300 relative">
                    <Icon size={20} className="stroke-[1.5]" />
                    <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-black/20"></div>
                </div>
            )
        }
        return <Icon size={24} strokeWidth={1.5} className="group-hover:-translate-y-0.5 transition-transform duration-300" />
    }

    return (
        <>
            {/* Backdrop for closing - placed BEHIND the nav z-index (50) */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 z-[40] bg-white/60 backdrop-blur-xl transition-all duration-300"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            <div className={`fixed inset-x-0 mx-auto w-full max-w-[350px] z-[50] transition-all duration-300 ${isKeyboardOpen ? 'opacity-0 pointer-events-none translate-y-full' : 'opacity-100 pointer-events-auto'}`} style={{ bottom: 'calc(1.5rem + var(--tg-content-safe-area-bottom) + var(--tg-safe-area-bottom))' }}>
                <div className="bg-white/90 backdrop-blur-2xl border border-white/40 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] rounded-[32px] px-6 py-3.5 flex items-center justify-between ring-1 ring-black/5">

                    {/* Home */}
                    <Link href="/" className={getLinkClass(pathname === "/")}>
                        {renderIcon(pathname === "/", Home)}
                    </Link>

                    {/* Warehouse */}
                    <Link href="/warehouse" className={getLinkClass(pathname === "/warehouse")}>
                        {renderIcon(pathname === "/warehouse", Package)}
                    </Link>

                    {/* Plus - Center Custom Button with Speed Dial */}
                    <div className="relative">
                        {/* Speed Dial Menu - Grid Layout 2x2 */}
                        <div className={`
                            absolute bottom-full left-1/2 -translate-x-1/2 mb-8 w-[320px] h-[220px] pointer-events-none transition-all duration-300 z-0
                            ${isMenuOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 translate-y-4"}
                        `}>
                            {/* Top Left - Bouquet */}
                            <Link
                                href="/flowers/new?type=bouquet"
                                onClick={() => setIsMenuOpen(false)}
                                className="absolute top-0 left-0 w-[155px] bg-white/95 backdrop-blur-xl border border-white/50 shadow-xl shadow-blue-500/20 rounded-[28px] py-4 flex flex-col items-center gap-2 cursor-pointer hover:bg-white transition-all hover:scale-105 active:scale-95 outline-none ring-1 ring-black/5"
                            >
                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center transition-colors">
                                    <Plus size={22} strokeWidth={2.5} />
                                </div>
                                <span className="text-xs font-bold text-gray-600 tracking-tight uppercase">Букет</span>
                            </Link>

                            {/* Top Right - Offline (New) */}
                            <Link
                                href="/pos"
                                onClick={() => setIsMenuOpen(false)}
                                className="absolute top-0 right-0 w-[155px] bg-white/95 backdrop-blur-xl border border-white/50 shadow-xl shadow-purple-500/20 rounded-[28px] py-4 flex flex-col items-center gap-2 cursor-pointer hover:bg-white transition-all hover:scale-105 active:scale-95 outline-none ring-1 ring-black/5"
                            >
                                <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center transition-colors">
                                    <Store size={22} strokeWidth={2.5} />
                                </div>
                                <span className="text-xs font-bold text-gray-600 tracking-tight uppercase">Офлайн</span>
                            </Link>

                            {/* Bottom Left - Expense */}
                            <Link
                                href="/finance/expense"
                                onClick={() => setIsMenuOpen(false)}
                                className="absolute bottom-0 left-0 w-[155px] bg-white/95 backdrop-blur-xl border border-white/50 shadow-xl shadow-red-500/20 rounded-[28px] py-4 flex flex-col items-center gap-2 cursor-pointer hover:bg-white transition-all hover:scale-105 active:scale-95 outline-none ring-1 ring-black/5"
                            >
                                <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center transition-colors">
                                    <Banknote size={22} strokeWidth={2.5} />
                                </div>
                                <span className="text-xs font-bold text-gray-600 tracking-tight uppercase">Расход</span>
                            </Link>

                            {/* Bottom Right - Supply */}
                            <Link
                                href="/warehouse/supply"
                                onClick={() => setIsMenuOpen(false)}
                                className="absolute bottom-0 right-0 w-[155px] bg-white/95 backdrop-blur-xl border border-white/50 shadow-xl shadow-emerald-500/20 rounded-[28px] py-4 flex flex-col items-center gap-2 cursor-pointer hover:bg-white transition-all hover:scale-105 active:scale-95 outline-none ring-1 ring-black/5"
                            >
                                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center transition-colors">
                                    <Package size={22} strokeWidth={2.5} />
                                </div>
                                <span className="text-xs font-bold text-gray-600 tracking-tight uppercase">Приход</span>
                            </Link>
                        </div>

                        {/* Trigger Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="flex flex-col items-center justify-center group outline-none relative z-10"
                        >
                            <div className={`
                                w-12 h-12 rounded-full text-white flex items-center justify-center shadow-xl border-2 border-white transition-all duration-300 ring-2 ring-black/5
                                ${isMenuOpen ? "bg-gray-900 rotate-45 scale-110" : "bg-gradient-to-tr from-blue-600 to-blue-500 hover:scale-105 active:scale-95"}
                            `}>
                                <Plus size={24} strokeWidth={1.5} />
                            </div>
                        </button>
                    </div>

                    {/* Orders */}
                    <Link href="/orders" className={getLinkClass(pathname === "/orders")}>
                        {renderIcon(pathname === "/orders", ClipboardList)}
                    </Link>

                    {/* Profile */}
                    <Link href="/profile" className={getLinkClass(pathname?.startsWith("/profile") || pathname?.startsWith("/employees") || pathname?.startsWith("/finance") || pathname?.startsWith("/clients") || pathname?.startsWith("/stories"))}>
                        {renderIcon(pathname?.startsWith("/profile") || pathname?.startsWith("/employees") || pathname?.startsWith("/finance") || pathname?.startsWith("/clients") || pathname?.startsWith("/stories"), User)}
                    </Link>

                </div>
            </div>
        </>
    )
}
