import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { TelegramUser } from "@/hooks/useTelegramAuth";

interface NavbarProps {
    telegramUser: TelegramUser | null;
    onSearchClick: () => void;
}

const GREETINGS = [
    "Добро пожаловать,",
    "Какие цветы вы любите?",
    "Повод для улыбки",
    "Магия цветов",
    "Весеннее настроение",
    "Порадуйте близких"
];

export function Navbar({ telegramUser, onSearchClick }: NavbarProps) {
    const [greetingIndex, setGreetingIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setGreetingIndex((prev) => (prev + 1) % GREETINGS.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <nav className="fixed top-3 inset-x-0 z-50 px-4 pointer-events-none flex items-center justify-center">
            <div className="w-[94%] max-w-lg h-16 bg-white border border-black/5 rounded-[32px] px-4 flex items-center justify-between pointer-events-auto">

                {/* Profile & Greeting */}
                <div className="flex items-center gap-3.5">
                    <div className="flex-shrink-0 relative w-11 h-11 rounded-full overflow-hidden border border-black/10 transition-transform active:scale-95">
                        <Image
                            src={telegramUser?.photo_url || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop"}
                            alt="Profile"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div className="flex flex-col justify-center pt-0.5">
                        <div className="h-[14px] relative">
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={greetingIndex}
                                    initial={{ y: 5, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -5, opacity: 0 }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className="text-gray-500 text-[11px] font-medium uppercase tracking-[0.1em] leading-none absolute left-0 bottom-0 whitespace-nowrap"
                                >
                                    {GREETINGS[greetingIndex]}
                                </motion.span>
                            </AnimatePresence>
                        </div>
                        <div className="flex items-center gap-1.5 -mt-0.5">
                            <span className="text-gray-900 text-[16px] font-bold tracking-tight">
                                {telegramUser?.first_name || 'Гость'}
                            </span>
                            <motion.span
                                animate={{ rotate: [0, 20, 0, 20, 0] }}
                                transition={{
                                    duration: 2.5,
                                    repeat: Infinity,
                                    repeatDelay: 1
                                }}
                                className="text-[17px] origin-bottom-right inline-block"
                            >
                                👋
                            </motion.span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5 pr-1">
                    <button
                        onClick={onSearchClick}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-gray-800 hover:bg-gray-100/40 active:scale-90 transition-all"
                    >
                        <Search size={21} strokeWidth={1.5} />
                    </button>


                </div>
            </div>
        </nav>
    );
}
