import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface CategoryTabsProps {
    categories: string[];
    activeCategory: string;
    onCategoryClick: (category: string) => void;
}

export function CategoryTabs({ categories, activeCategory, onCategoryClick }: CategoryTabsProps) {
    return (
        <div className="mt-4 xs:mt-5 sm:mt-6 px-4 sm:px-6 overflow-x-auto no-scrollbar scroll-smooth sm:flex sm:justify-center">
            <div className="inline-flex min-w-max gap-0.5 sm:gap-1 p-1 bg-gray-100/40 backdrop-blur-xl rounded-full border border-gray-200/20 items-center">
                {categories.map((cat) => {
                    const isAvailable = cat === "В наличии";
                    return (
                        <button
                            key={cat}
                            onClick={() => onCategoryClick(cat)}
                            className={`relative px-3.5 xs:px-4 sm:px-5 py-1.5 xs:py-2 rounded-full text-[13px] xs:text-[14px] font-medium transition-all duration-300 whitespace-nowrap active:scale-95 z-10 flex items-center gap-1.5 ${activeCategory === cat
                                ? (isAvailable ? 'text-black font-extrabold' : 'text-black font-semibold')
                                : (isAvailable ? 'text-gray-500 hover:text-black' : 'text-gray-400 hover:text-gray-600')
                                }`}
                        >
                            {activeCategory === cat && (
                                <motion.div
                                    layoutId="activePill"
                                    className="absolute inset-0 bg-white border border-black/5 rounded-full"
                                    transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
                                />
                            )}
                            <span className="relative z-20 tracking-tight flex items-center gap-1.5">
                                {isAvailable && <Zap size={14} className={activeCategory === cat ? "fill-black text-black" : "text-gray-400"} />}
                                {cat}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

