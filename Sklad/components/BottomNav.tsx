"use client"

import { Home, Package, Plus, ClipboardList, User, Banknote } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"

export default function BottomNav() {
    const pathname = usePathname()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

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

    // Hide BottomNav on Shop page, Expense creation, and Supply page
    if (pathname?.startsWith("/shop") || pathname === "/finance/expense" || pathname === "/warehouse/supply" || pathname === "/flowers/new") {
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
            {/* Backdrop for closing - placed outside to not dim the nav itself */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 z-[90] bg-black/10 backdrop-blur-[2px] transition-all duration-300"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            <div className="fixed bottom-6 inset-x-0 mx-auto w-full max-w-[350px] z-[50]">
                <div className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] rounded-[32px] px-6 py-3.5 flex items-center justify-between ring-1 ring-black/5">

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
                        {/* Speed Dial Menu - Animate Presence equivalent logic */}
                        <div className={`
                            absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[320px] h-[220px] pointer-events-none transition-all duration-300 z-0
                            ${isMenuOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-90 translate-y-4"}
                        `}>
                            {/* Top Center - Bouquet (Create) */}
                            <Link
                                href="/flowers/new?type=bouquet"
                                onClick={() => setIsMenuOpen(false)}
                                className="absolute top-0 left-1/2 -translate-x-1/2 w-[150px] bg-white/95 backdrop-blur-xl border border-white/50 shadow-xl shadow-blue-500/20 rounded-[24px] py-3 flex flex-col items-center gap-1 cursor-pointer hover:bg-white transition-all hover:scale-105 active:scale-95 outline-none ring-1 ring-black/5"
                            >
                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center transition-colors">
                                    <Plus size={20} strokeWidth={2.5} />
                                </div>
                                <span className="text-xs font-bold text-gray-600 tracking-tight uppercase">Букет</span>
                            </Link>

                            {/* Bottom Left - Expense */}
                            <Link
                                href="/finance/expense"
                                onClick={() => setIsMenuOpen(false)}
                                className="absolute bottom-6 left-0 w-[150px] bg-white/95 backdrop-blur-xl border border-white/50 shadow-xl shadow-red-500/20 rounded-[24px] py-3 flex flex-col items-center gap-1 cursor-pointer hover:bg-white transition-all hover:scale-105 active:scale-95 outline-none ring-1 ring-black/5"
                            >
                                <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center transition-colors">
                                    <Banknote size={20} strokeWidth={2.5} />
                                </div>
                                <span className="text-xs font-bold text-gray-600 tracking-tight uppercase">Расход</span>
                            </Link>

                            {/* Bottom Right - Supply */}
                            <Link
                                href="/warehouse/supply"
                                onClick={() => setIsMenuOpen(false)}
                                className="absolute bottom-6 right-0 w-[150px] bg-white/95 backdrop-blur-xl border border-white/50 shadow-xl shadow-emerald-500/20 rounded-[24px] py-3 flex flex-col items-center gap-1 cursor-pointer hover:bg-white transition-all hover:scale-105 active:scale-95 outline-none ring-1 ring-black/5"
                            >
                                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center transition-colors">
                                    <Package size={20} strokeWidth={2.5} />
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
