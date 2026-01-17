import React from "react";

interface CategoryTabsProps {
    categories: string[];
    activeCategory: string;
    onCategoryClick: (category: string) => void;
}

export function CategoryTabs({ categories, activeCategory, onCategoryClick }: CategoryTabsProps) {
    return (
        <div className="mt-8 pl-6 overflow-x-auto no-scrollbar pb-2">
            <div className="flex gap-2.5 pr-6 items-center">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => onCategoryClick(cat)}
                        className={`px-5 py-2.5 rounded-[20px] text-[15px] font-medium transition-all duration-200 border ${activeCategory === cat
                                ? 'bg-transparent border-black text-black shadow-sm'
                                : 'bg-[#F2F2F7] border-transparent text-gray-900 hover:bg-[#E5E5EA]'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>
    );
}
