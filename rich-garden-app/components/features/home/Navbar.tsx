import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingBag } from 'lucide-react';
import { TelegramUser } from "@/hooks/useTelegramAuth";

interface NavbarProps {
    telegramUser: TelegramUser | null;
    onSearchClick: () => void;
}

export function Navbar({ telegramUser, onSearchClick }: NavbarProps) {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 pointer-events-none">
            {/* Left: Brand / User */}
            {telegramUser ? (
                <div className="pointer-events-auto bg-white/70 backdrop-blur-md pl-1.5 p-1.5 pr-4 rounded-full shadow-sm border border-white/50 active:scale-95 transition-transform flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-inner border border-white/50">
                        <Image
                            src={telegramUser.photo_url || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop"}
                            alt="Profile"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div className="flex flex-col leading-none gap-0.5">
                        <span className="text-gray-500 text-[11px] font-medium">Привет,</span>
                        <span className="text-gray-900 text-[14px] font-bold">{telegramUser.first_name} 👋</span>
                    </div>
                </div>
            ) : (
                <div className="pointer-events-auto px-4 py-2 bg-white/70 backdrop-blur-md rounded-full">
                    <span className="text-black font-bold text-lg">Rich Garden</span>
                </div>
            )}

            {/* Right: Actions */}
            <div className="pointer-events-auto flex items-center gap-2 bg-white/70 backdrop-blur-md p-1.5 rounded-full shadow-sm border border-white/50">
                <button onClick={onSearchClick} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-900 hover:bg-white/50 active:scale-90 transition-all">
                    <Search size={20} strokeWidth={2} />
                </button>
                <div className="w-[1px] h-4 bg-gray-300/50"></div>
                <Link href="/cart" className="relative w-10 h-10 rounded-full flex items-center justify-center text-gray-900 hover:bg-white/50 active:scale-90 transition-all">
                    <ShoppingBag size={20} strokeWidth={2} />
                    <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-white"></span>
                </Link>
            </div>
        </nav>
    );
}
