"use client"

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useProducts } from '@/hooks/useProducts';
import { Navbar } from "@/components/features/home/Navbar";
import { HeroSlider } from "@/components/features/home/HeroSlider";
import { Stories } from "@/components/features/home/Stories";
import { CategoryTabs } from "@/components/features/home/CategoryTabs";
import { ProductRow } from "@/components/features/catalog/ProductRow";
import { SearchOverlay } from "@/components/features/search/SearchOverlay";
import { AnimatedBackground } from "@/components/features/home/AnimatedBackground";

export default function ShopPage() {
  const telegramUser = useTelegramAuth();
  const { products, categories, loading, getProductsByCategory } = useProducts();

  const [activeCategory, setActiveCategory] = useState("Все");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isStoriesOpen, setIsStoriesOpen] = useState(false);

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    // Removed auto-scroll to keep position as requested
  };

  // Sort product rows: "В наличии" first, then active category, then others
  const sortedRowCategories = categories.filter(c => c !== "Все").sort((a, b) => {
    const isAvailableA = a.toLowerCase() === 'в наличии';
    const isAvailableB = b.toLowerCase() === 'в наличии';

    if (isAvailableA) return -1;
    if (isAvailableB) return 1;

    if (a === activeCategory) return -1;
    if (b === activeCategory) return 1;
    return 0;
  });

  return (
    <div className="min-h-screen relative pb-32 font-sans selection:bg-black selection:text-white">
      {/* Animated Mesh Gradient Background */}
      <AnimatedBackground />

      {/* Search Overlay */}
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        telegramUserId={telegramUser?.telegram_id}
      />

      {/* Top Navbar */}
      <div className={`transition-opacity duration-300 ${isStoriesOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <Navbar
          telegramUser={telegramUser}
          onSearchClick={() => setIsSearchOpen(true)}
        />
      </div>

      {/* Hero Slider */}
      <HeroSlider />

      {/* Main Content Sheet Overlapping Banner */}
      <div className="relative z-10 -mt-12 bg-white rounded-t-[48px] overflow-hidden min-h-screen pb-20 border-t border-black/5">
        {/* Stories */}
        <Stories onStoryOpen={setIsStoriesOpen} />

        {/* Category Tabs */}
        <CategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onCategoryClick={handleCategoryClick}
        />

        {/* Dynamic Sections by Category */}
        <motion.div layout className="space-y-2 mt-2">
          {sortedRowCategories.map((catName) => {
            const catProducts = getProductsByCategory(catName);
            if (catProducts.length === 0) return null;

            const isFeatured = catName.toLowerCase() === 'в наличии';
            const catSlug = isFeatured ? 'в наличии' : (catProducts[0]?.category?.toLowerCase() || catName.toLowerCase());

            return (
              <motion.div
                layout
                key={catName}
                initial={{ opacity: 0.8, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  layout: { type: "spring", stiffness: 200, damping: 25 },
                  opacity: { duration: 0.4 }
                }}
              >
                <ProductRow
                  title={catName}
                  products={catProducts}
                  categorySlug={catSlug}
                  telegramUserId={telegramUser?.telegram_id}
                  isFeatured={isFeatured}
                />
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Bottom Navigation */}
      <div className={`transition-opacity duration-300 ${isStoriesOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <BottomNav />
      </div>
    </div>
  );
}
