"use client"

import { Leaf, Check, AlertTriangle, X } from "lucide-react"

export default function StockOverviewPremium() {
    return (
        <div className="mt-8 w-full">
            {/* Main Container: Soft white with subtle emerald gradient */}
            <div
                className="relative w-full rounded-[24px] p-8 border border-gray-100 overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, rgba(22, 101, 52, 0.03) 0%, rgba(255, 255, 255, 1) 100%)',
                    backgroundColor: '#FFFFFF',
                    boxShadow: 'inset 0 0 40px rgba(255, 255, 255, 0.5)'
                }}
            >
                {/* Header */}
                <div className="flex items-center gap-2 mb-8 relative z-10">
                    <h2 className="text-xl font-bold text-[#1A1A1A] tracking-tight">
                        Stock Overview
                    </h2>
                    <Leaf className="text-[#228B22] opacity-80" size={18} strokeWidth={2} />
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">

                    {/* In Stock Card */}
                    <div className="group relative h-48 rounded-[20px] overflow-hidden transition-all duration-500 hover:scale-[1.02] cursor-pointer">
                        {/* Gradient Background */}
                        <div
                            className="absolute inset-0 bg-gradient-to-br from-[#228B22] to-[#166534]"
                        ></div>

                        {/* Content */}
                        <div className="relative h-full flex flex-col items-center justify-center text-white p-4">
                            {/* Icon Top */}
                            <div className="mb-3 p-2 bg-white/20 backdrop-blur-md rounded-full">
                                <Check size={20} strokeWidth={3} className="text-white" />
                            </div>

                            {/* Number */}
                            <span className="text-5xl font-bold mb-1 tracking-tight drop-shadow-sm">345</span>

                            {/* Label */}
                            <span className="text-base font-medium opacity-90">In Stock</span>
                        </div>

                        {/* Subtle Leaf Pattern Overlay */}
                        <Leaf
                            className="absolute -bottom-4 -right-4 text-white opacity-10 rotate-[-15deg]"
                            size={120}
                            strokeWidth={1}
                        />
                    </div>

                    {/* Low Stock Card */}
                    <div className="group relative h-48 rounded-[20px] overflow-hidden transition-all duration-500 hover:scale-[1.02] cursor-pointer">
                        {/* Gradient Background (Gold) */}
                        <div
                            className="absolute inset-0 bg-gradient-to-br from-[#D4AF37] to-[#B8860B]"
                        ></div>

                        {/* Content */}
                        <div className="relative h-full flex flex-col items-center justify-center text-[#1A1A1A] p-4">
                            {/* Icon Top */}
                            <div className="mb-3 p-2 bg-black/10 backdrop-blur-md rounded-full">
                                <AlertTriangle size={20} strokeWidth={3} className="text-[#1A1A1A]" />
                            </div>

                            {/* Number (Dark text as requested) */}
                            <span className="text-5xl font-bold mb-1 tracking-tight drop-shadow-sm">15</span>

                            {/* Label */}
                            <span className="text-base font-bold opacity-80">Low Stock</span>
                        </div>
                        {/* Subtle Leaf Pattern Overlay */}
                        <Leaf
                            className="absolute -bottom-4 -right-4 text-black opacity-5 rotate-[-15deg]"
                            size={120}
                            strokeWidth={1}
                        />
                    </div>

                    {/* Out of Stock Card */}
                    <div className="group relative h-48 rounded-[20px] overflow-hidden transition-all duration-500 hover:scale-[1.02] cursor-pointer">
                        {/* Gradient Background (Red) */}
                        <div
                            className="absolute inset-0 bg-gradient-to-br from-[#EF4444] to-[#DC2626]"
                        ></div>

                        {/* Content */}
                        <div className="relative h-full flex flex-col items-center justify-center text-white p-4">
                            {/* Icon Top */}
                            <div className="mb-3 p-2 bg-white/20 backdrop-blur-md rounded-full">
                                <X size={20} strokeWidth={3} className="text-white" />
                            </div>

                            {/* Number */}
                            <span className="text-5xl font-bold mb-1 tracking-tight drop-shadow-sm">6</span>

                            {/* Label */}
                            <span className="text-base font-medium opacity-90">Out of Stock</span>
                        </div>
                        {/* Subtle Leaf Pattern Overlay */}
                        <Leaf
                            className="absolute -bottom-4 -right-4 text-white opacity-10 rotate-[-15deg]"
                            size={120}
                            strokeWidth={1}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
