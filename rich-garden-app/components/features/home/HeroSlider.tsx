"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, Banner } from "@/lib/api";

export function HeroSlider() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getBanners()
            .then(data => {
                setBanners(Array.isArray(data) ? data : []);
            })
            .catch(() => setBanners([]))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="w-full h-[60vh] bg-gray-50 flex items-center justify-center animate-pulse"></div>;
    if (banners.length === 0) return null;

    const currentBanner = banners[currentSlide];

    // Extract hex color if it matches bg-[#...] pattern
    const bgHexMatch = currentBanner.bg_color.match(/bg-\[(#[a-fA-F0-9]{3,6})\]/);
    const bgStyle = bgHexMatch ? { backgroundColor: bgHexMatch[1] } : {};
    const bgClass = bgHexMatch ? '' : currentBanner.bg_color;

    return (
        <div className="relative w-full h-[540px] overflow-hidden bg-gray-50">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
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
                    className={`absolute inset-0 ${bgClass} flex flex-col justify-end items-center text-center pb-16 sm:pb-20 px-8 cursor-grab active:cursor-grabbing`}
                    style={bgStyle}
                >
                    {currentBanner.image_url && (
                        <>
                            {/* Background Image with Ultra-Smooth Ken Burns */}
                            <motion.img
                                initial={{ scale: 1.15 }}
                                animate={{ scale: 1.05 }}
                                transition={{ duration: 15, ease: "linear" }}
                                src={currentBanner.image_url}
                                alt={currentBanner.title}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                            {/* Bottom-Focused Gradient for Text Contrast */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-0 pointer-events-none" />
                        </>
                    )}

                    {/* Centered-Bottom Content */}
                    <div className="relative z-10 flex flex-col items-center max-w-lg">
                        <motion.h2
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
                            style={{ color: currentBanner.title_color || '#FFFFFF' }}
                            className="text-[32px] sm:text-[44px] leading-[1] font-black mb-2 tracking-tighter uppercase drop-shadow-lg"
                        >
                            {currentBanner.title}
                        </motion.h2>

                        <motion.p
                            initial={{ y: 15, opacity: 0 }}
                            animate={{ opacity: 0.9, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            style={{ color: currentBanner.subtitle_color || '#FFFFFF' }}
                            className="text-[13px] sm:text-[15px] font-medium mb-6 max-w-[280px] sm:max-w-md leading-tight opacity-90 drop-shadow-md"
                        >
                            {currentBanner.subtitle}
                        </motion.p>

                        {/* Compact Luxury Button */}
                        {currentBanner.button_text && (
                            <motion.button
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4, duration: 0.8 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    backgroundColor: currentBanner.button_bg_color || '#FFFFFF',
                                    color: currentBanner.button_text_color || '#000000'
                                }}
                                className="px-8 py-3 text-[11px] font-black uppercase tracking-[0.2em] rounded-full border border-black/5 transition-all"
                            >
                                {currentBanner.button_text}
                            </motion.button>
                        )}
                    </div>

                    {/* Navigation Dots - Centered and only shown if more than 1 banner */}
                    {banners.length > 1 && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                            {banners.map((_, idx) => (
                                <motion.div
                                    key={idx}
                                    onClick={() => setCurrentSlide(idx)}
                                    animate={{
                                        width: currentSlide === idx ? 24 : 6,
                                        backgroundColor: currentSlide === idx ? (currentBanner.title_color || '#FFFFFF') : "rgba(255,255,255,0.3)"
                                    }}
                                    className="h-1.5 rounded-full cursor-pointer transition-all duration-300"
                                />
                            ))}
                        </div>
                    )}

                </motion.div>
            </AnimatePresence>
        </div>
    );
}
