"use client"

import { useState, useEffect } from "react"
import { ShoppingBag, Menu, Heart, ChevronRight, Star } from "lucide-react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

// Mock Data
const categories = ["Все", "Розы", "Пионы", "Авторские", "Свадебные", "Коробки"]

const featured = [
    { id: 1, title: "Grand Amour", subtitle: "101 красная роза", price: "1 250 000 сум", image: "/flowers.png", bg: "bg-red-500" },
    { id: 2, title: "White Dream", subtitle: "Пионовидные розы", price: "850 000 сум", image: "/flowers2.png", bg: "bg-orange-100" },
    { id: 3, title: "Spring Vibes", subtitle: "Тюльпаны микс", price: "450 000 сум", image: "/flowers.png", bg: "bg-pink-200" },
]

const products = [
    { id: 101, name: "Velvet Rose", price: "450 000 сум", image: "/flowers.png", rating: 4.9 },
    { id: 102, name: "Summer Breeze", price: "320 000 сум", image: "/flowers2.png", rating: 4.8 },
    { id: 103, name: "Pink Lady", price: "550 000 сум", image: "/flowers.png", rating: 5.0 },
    { id: 104, name: "White Cloud", price: "380 000 сум", image: "/flowers2.png", rating: 4.7 },
]

export default function ShopPage() {
    const [currentSlide, setCurrentSlide] = useState(0)

    // Auto-scroll carousel
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % featured.length)
        }, 5000)
        return () => clearInterval(timer)
    }, [])

    return (
        <div className="min-h-screen bg-white pb-20 font-sans selection:bg-black selection:text-white">

            {/* Nav */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-white/10 backdrop-blur-md">
                <button className="w-10 h-10 rounded-full bg-white/40 backdrop-blur-md flex items-center justify-center text-gray-900 border border-white/20 shadow-sm">
                    <Menu size={20} />
                </button>
                <div className="font-bold text-xl tracking-tight text-gray-900 drop-shadow-sm">RICH GARDEN</div>
                <button className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center shadow-lg shadow-black/10 active:scale-95 transition-transform">
                    <ShoppingBag size={18} />
                </button>
            </nav>

            {/* Hero Carousel */}
            <div className="relative w-full h-[540px] overflow-hidden rounded-b-[48px] shadow-2xl shadow-gray-200">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7 }}
                        className={`absolute inset-0 ${featured[currentSlide].bg} flex items-center justify-center`}
                    >
                        {/* Abstract BG shapes */}
                        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full blur-3xl -ml-16 -mb-16"></div>

                        <div className="relative z-10 text-center px-6 mt-16 w-full flex flex-col items-center">
                            <motion.div
                                initial={{ y: 30, opacity: 0, scale: 0.9 }}
                                animate={{ y: 0, opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                                className="w-[300px] h-[300px] relative mb-6 drop-shadow-2xl"
                            >
                                <Image src={featured[currentSlide].image} alt={featured[currentSlide].title} fill className="object-contain" />
                            </motion.div>
                            <motion.h2
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-3xl font-bold text-gray-900 mb-1"
                            >
                                {featured[currentSlide].title}
                            </motion.h2>
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-gray-800/80 font-semibold mb-6"
                            >
                                {featured[currentSlide].subtitle}
                            </motion.p>
                            <motion.button
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="px-8 py-3.5 bg-black text-white rounded-full font-bold shadow-xl shadow-black/20 hover:scale-105 active:scale-95 transition-transform flex items-center gap-2 mx-auto"
                            >
                                <span>Купить</span>
                                <span className="w-1 h-1 bg-gray-500 rounded-full mx-1"></span>
                                <span>{featured[currentSlide].price}</span>
                            </motion.button>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Dots */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {featured.map((_, idx) => (
                        <div
                            key={idx}
                            onClick={() => setCurrentSlide(idx)}
                            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${currentSlide === idx ? 'w-6 bg-black' : 'w-1.5 bg-black/20'}`}
                        />
                    ))}
                </div>
            </div>

            {/* Categories */}
            <div className="mt-8 pl-6 overflow-x-auto no-scrollbar pb-4 -ml-2">
                <div className="flex gap-3 pl-2 pr-6">
                    {categories.map((cat, idx) => (
                        <button
                            key={idx}
                            className={`px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-sm ${idx === 0 ? 'bg-black text-white shadow-black/20' : 'bg-gray-50 border border-gray-100 text-gray-500'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Popular Section */}
            <div className="px-6 mt-4 mb-3 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Популярное</h3>
                <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-black hover:text-white transition-colors">
                    <ChevronRight size={18} />
                </button>
            </div>

            <div className="px-6 grid grid-cols-2 gap-x-4 gap-y-6">
                {products.map(product => (
                    <div key={product.id} className="group relative cursor-pointer active:scale-[0.98] transition-transform">
                        <div className="relative w-full aspect-[3/4] bg-gray-50 rounded-[28px] overflow-hidden mb-3 border border-gray-50 shadow-sm">
                            <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                            <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/60 backdrop-blur-md flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-white transition-colors">
                                <Heart size={16} className={product.id === 101 ? "fill-red-500 text-red-500" : ""} />
                            </button>
                        </div>
                        <div className="pl-1">
                            <div className="flex items-center justify-between mb-1">
                                <h4 className="font-bold text-gray-900 text-[16px] leading-tight">{product.name}</h4>
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-gray-900">{product.price}</p>
                                <div className="flex items-center gap-1">
                                    <Star size={10} className="fill-yellow-400 text-yellow-400" />
                                    <span className="text-[10px] font-bold text-gray-500">{product.rating}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Special Offer */}
            <div className="px-6 mt-8">
                <div className="w-full h-48 bg-[#1a1a1a] rounded-[32px] relative overflow-hidden flex items-center px-8 text-white shadow-xl shadow-gray-200">
                    <div className="relative z-10 max-w-[65%]">
                        <span className="text-[10px] font-bold bg-white/20 px-2.5 py-1 rounded-lg uppercase tracking-wider mb-3 inline-block">Акция</span>
                        <h3 className="text-2xl font-bold leading-none mb-2">Бесплатная доставка</h3>
                        <p className="text-xs text-gray-400 mb-5 font-medium">При заказе от 500 000 сум</p>
                        <button className="px-5 py-2 bg-white text-black text-xs font-bold rounded-full">Подробнее</button>
                    </div>
                    <div className="absolute -right-6 -bottom-6 w-56 h-56 rotate-12">
                        <Image src="/flowers2.png" alt="Delivery" fill className="object-contain" />
                    </div>
                </div>
            </div>

            <div className="h-12 w-full flex items-center justify-center mt-12 opacity-30 pb- safe-area-pb">
                <div className="h-1 w-12 bg-gray-300 rounded-full" />
            </div>

        </div>
    )
}
