"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, Banner } from "@/lib/api";

export function HeroSlider() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getBanners().then(data => {
            if (data.length > 0) {
                setBanners(data);
            }
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="w-full h-[550px] bg-gray-50 flex items-center justify-center animate-pulse"></div>;
    if (banners.length === 0) return null;

    const currentBanner = banners[currentSlide];

    // Extract hex color if it matches bg-[#...] pattern
    const bgHexMatch = currentBanner.bg_color.match(/bg-\[(#[a-fA-F0-9]{3,6})\]/);
    const bgStyle = bgHexMatch ? { backgroundColor: bgHexMatch[1] } : {};
    // If we found a hex match, don't use the class to avoid conflicts (though inline style wins)
    // If no match, pass the original string as it might be a standard class like 'bg-white'
    const bgClass = bgHexMatch ? '' : currentBanner.bg_color;

    return (
        <div className="relative w-full h-[550px] overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={1}
                    onDragEnd={(e, { offset, velocity }) => {
                        const swipe = Math.abs(offset.x) * velocity.x;
                        if (swipe < -100 || offset.x < -50) {
                            setCurrentSlide((prev) => (prev + 1) % banners.length);
                        } else if (swipe > 100 || offset.x > 50) {
                            setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
                        }
                    }}
                    style={bgStyle}
                    className={`absolute inset-0 ${bgClass} flex flex-col justify-center px-6 cursor-grab active:cursor-grabbing`}
                >
                    {currentBanner.image_url && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={currentBanner.image_url.startsWith('http') ? currentBanner.image_url : `http://127.0.0.1:8000${currentBanner.image_url}`}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    )}

                    {/* Text Content */}
                    <div className="relative z-10 flex flex-col items-start w-full pt-10">
                        <motion.h2
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            style={{ color: currentBanner.title_color || '#000000' }}
                            className="text-[40px] font-extrabold text-black leading-[1.05] mb-3 tracking-tight"
                        >
                            {currentBanner.title}
                        </motion.h2>

                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            style={{ color: currentBanner.subtitle_color || '#000000' }}
                            className="text-sm font-semibold text-black/80 mb-8 whitespace-pre-line leading-relaxed"
                        >
                            {currentBanner.subtitle}
                        </motion.p>

                        {/* Button */}
                        <motion.button
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            style={{
                                backgroundColor: currentBanner.button_bg_color || '#000000',
                                color: currentBanner.button_text_color || '#FFFFFF'
                            }}
                            className="px-6 py-4 bg-black text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 hover:opacity-90 active:scale-95 transition-all"
                        >
                            {currentBanner.button_text}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                        </motion.button>
                    </div>

                    {/* Dots (Centered Bottom) */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                        {banners.map((_, idx) => (
                            <div
                                key={idx}
                                onClick={() => setCurrentSlide(idx)}
                                className={`h-1.5 w-1.5 rounded-full transition-all duration-300 cursor-pointer ${currentSlide === idx ? 'bg-black scale-125' : 'bg-black/20 hover:bg-black/40'}`}
                            />
                        ))}
                    </div>

                </motion.div>
            </AnimatePresence>
        </div>
    );
}
