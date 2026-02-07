"use client"

import { Home, LayoutGrid, Heart, User, ShoppingBag, Calendar } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useFavorites } from '@/context/FavoritesContext'
import { useCart } from '@/context/CartContext'

export function BottomNav() {
    const { favorites } = useFavorites()
    const { cartItems } = useCart()
    const pathname = usePathname()

    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)

    const isActive = (path: string) => {
        if (path === '/') return pathname === '/'
        return pathname.startsWith(path)
    }

    // Larger, pill design
    return (
        <div className="fixed bottom-8 inset-x-0 mx-auto w-full max-w-[390px] z-50 pointer-events-none px-4">
            <div className="bg-white border border-black/5 rounded-full px-2 py-2 flex items-center justify-between pointer-events-auto min-h-[72px]">

                {/* Home */}
                <Link href="/" className="flex-1 flex justify-center items-center group relative">
                    {isActive('/') ? (
                        <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center border border-black/5 group-hover:scale-105 transition-transform duration-300 relative">
                            <Home size={22} className="stroke-[1.5]" />
                            <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-black/20"></div>
                        </div>
                    ) : (
                        <div className="p-2 text-gray-400 hover:text-black transition-colors relative w-12 h-12 flex items-center justify-center">
                            <Home size={26} strokeWidth={1.5} className="group-hover:-translate-y-0.5 transition-transform duration-300" />
                        </div>
                    )}
                </Link>

                {/* Calendar (was Catalog) */}
                <Link href="/calendar" className="flex-1 flex justify-center items-center group relative">
                    {isActive('/calendar') ? (
                        <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center border border-black/5 group-hover:scale-105 transition-transform duration-300 relative">
                            <Calendar size={22} className="stroke-[1.5]" />
                            <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-black/20"></div>
                        </div>
                    ) : (
                        <div className="p-2 text-gray-400 hover:text-black transition-colors relative w-12 h-12 flex items-center justify-center">
                            <Calendar size={26} strokeWidth={1.5} className="group-hover:-translate-y-0.5 transition-transform duration-300" />
                        </div>
                    )}
                </Link>

                {/* Favorites */}
                <Link href="/favorites" className="flex-1 flex justify-center items-center group relative">
                    {isActive('/favorites') ? (
                        <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center border border-black/5 group-hover:scale-105 transition-transform duration-300 relative">
                            <Heart size={22} className="stroke-[1.5]" />
                            <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-black/20"></div>
                            {favorites.length > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white shadow-sm">
                                    {favorites.length}
                                </span>
                            )}
                        </div>
                    ) : (
                        <div className="p-2 text-gray-400 hover:text-black transition-colors relative w-12 h-12 flex items-center justify-center">
                            <Heart size={26} strokeWidth={1.5} className="group-hover:-translate-y-0.5 transition-transform duration-300" />
                            {favorites.length > 0 && (
                                <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white shadow-sm translate-x-1 -translate-y-1">
                                    {favorites.length}
                                </span>
                            )}
                        </div>
                    )}
                </Link>

                {/* Cart */}
                <Link href="/cart" className="flex-1 flex justify-center items-center group relative">
                    {isActive('/cart') ? (
                        <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center border border-black/5 group-hover:scale-105 transition-transform duration-300 relative">
                            <ShoppingBag size={22} className="stroke-[1.5]" />
                            <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-black/20"></div>
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white shadow-sm font-sans tracking-tight">
                                    {cartCount}
                                </span>
                            )}
                        </div>
                    ) : (
                        <div className="p-2 text-gray-400 hover:text-black transition-colors relative w-12 h-12 flex items-center justify-center">
                            <ShoppingBag size={26} strokeWidth={1.5} className="group-hover:-translate-y-0.5 transition-transform duration-300" />
                            {cartCount > 0 && (
                                <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white shadow-sm translate-x-1 -translate-y-1 font-sans tracking-tight">
                                    {cartCount}
                                </span>
                            )}
                        </div>
                    )}
                </Link>

                {/* Profile */}
                <Link href="/profile" className="flex-1 flex justify-center items-center group relative">
                    {isActive('/profile') ? (
                        <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center border border-black/5 group-hover:scale-105 transition-transform duration-300 relative">
                            <User size={22} className="stroke-[1.5]" />
                            <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-black/20"></div>
                        </div>
                    ) : (
                        <div className="p-2 text-gray-400 hover:text-black transition-colors relative w-12 h-12 flex items-center justify-center">
                            <User size={26} strokeWidth={1.5} className="group-hover:-translate-y-0.5 transition-transform duration-300" />
                        </div>
                    )}
                </Link>

            </div>
        </div>
    )
}
