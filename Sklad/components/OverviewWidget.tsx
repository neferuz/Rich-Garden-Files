"use client"

import { Check, AlertTriangle, X, Clock, Leaf } from "lucide-react"

export default function OverviewWidget() {
    return (
        <div className="mt-8 bg-white border border-gray-200 rounded-2xl flex flex-col md:flex-row h-auto md:h-64 relative overflow-hidden">
            {/* BRANDING: Leaf Icon Top Right */}
            <div className="absolute top-4 right-4 text-green-700/20 pointer-events-none">
                <Leaf size={120} strokeWidth={1} />
            </div>

            {/* LEFT SECTION: Stock Overview */}
            <div className="w-full md:w-1/2 p-6 flex flex-col relative">
                <h3 className="text-gray-500 font-medium text-sm tracking-wide uppercase mb-6">Overview</h3>

                <div className="flex-1 flex flex-col justify-center gap-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xl font-bold text-gray-800">Stock Overview</h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* In Stock */}
                        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-green-50/50 border border-green-100">
                            <div className="w-8 h-8 rounded-full bg-[#228B22] flex items-center justify-center mb-2">
                                <Check className="text-white w-4 h-4" strokeWidth={3} />
                            </div>
                            <span className="text-xs text-green-800 font-medium mb-1">In Stock</span>
                            <span className="text-2xl font-bold text-[#228B22]">345</span>
                        </div>

                        {/* Low Stock */}
                        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                            <div className="w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center mb-2">
                                <AlertTriangle className="text-white w-4 h-4" strokeWidth={3} />
                            </div>
                            <span className="text-xs text-amber-800 font-medium mb-1">Low Stock</span>
                            <span className="text-2xl font-bold text-[#D4AF37]">15</span>
                        </div>

                        {/* Out of Stock */}
                        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-red-50/50 border border-red-100">
                            <div className="w-8 h-8 rounded-full bg-[#EF4444] flex items-center justify-center mb-2">
                                <X className="text-white w-4 h-4" strokeWidth={3} />
                            </div>
                            <span className="text-xs text-red-800 font-medium mb-1">Out of Stock</span>
                            <span className="text-2xl font-bold text-[#EF4444]">6</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* VERTICAL DIVIDER */}
            <div className="hidden md:block w-px bg-gray-100 my-4 self-stretch"></div>

            {/* RIGHT SECTION: Tasks */}
            <div className="w-full md:w-1/2 p-6 flex flex-col relative z-10">
                <h3 className="text-gray-500 font-medium text-sm tracking-wide uppercase mb-6">Tasks</h3>

                <div className="flex flex-col gap-4">
                    {/* Task 1 */}
                    <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100">
                        <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center shrink-0 mr-4">
                            <AlertTriangle className="text-[#D4AF37]" size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-900 font-medium">Остаток: Розы</span>
                            <span className="text-[#D4AF37] text-sm font-semibold">8 шт</span>
                        </div>
                    </div>

                    {/* Task 2 */}
                    <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mr-4">
                            <Clock className="text-blue-600" size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-900 font-medium">Сборка: 2 заказа</span>
                            <span className="text-blue-600 text-sm font-semibold">ждут</span>
                        </div>
                    </div>

                    {/* Task 3 */}
                    <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100">
                        <div className="w-10 h-10 rounded-full bg-[#EF4444]/10 flex items-center justify-center shrink-0 mr-4">
                            <AlertTriangle className="text-[#EF4444]" size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-900 font-medium">Задержка: Заказ #124</span>
                            <span className="text-[#EF4444] text-sm font-semibold">Критично</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
