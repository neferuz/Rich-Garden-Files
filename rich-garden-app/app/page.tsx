"use client"

import { useState, useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useProducts } from '@/hooks/useProducts';
import { Navbar } from "@/components/features/home/Navbar";
import { HeroSlider } from "@/components/features/home/HeroSlider";
import { Stories } from "@/components/features/home/Stories";
import { CategoryTabs } from "@/components/features/home/CategoryTabs";
import { ProductRow } from "@/components/features/catalog/ProductRow";
import { SearchOverlay } from "@/components/features/search/SearchOverlay";

export default function ShopPage() {
  const telegramUser = useTelegramAuth();
  const { products, categories, loading, getProductsByCategory } = useProducts();

  const [activeCategory, setActiveCategory] = useState("Все");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    if (category === "Все") {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const element = document.getElementById(`section-${category}`);
      if (element) {
        const headerOffset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32 font-sans selection:bg-black selection:text-white">

      {/* Search Overlay */}
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        telegramUserId={telegramUser?.telegram_id}
      />

      {/* Top Navbar */}
      <Navbar
        telegramUser={telegramUser}
        onSearchClick={() => setIsSearchOpen(true)}
      />

      {/* Hero Slider */}
      <HeroSlider />

      {/* Stories */}
      <Stories />

      {/* Category Tabs */}
      <CategoryTabs
        categories={categories}
        activeCategory={activeCategory}
        onCategoryClick={handleCategoryClick}
      />

      {/* Dynamic Sections by Category */}
      {categories.filter(c => c !== "Все").map((catName) => {
        const catProducts = getProductsByCategory(catName);
        if (catProducts.length === 0) return null;

        const catSlug = catProducts[0]?.category?.toLowerCase() || catName.toLowerCase();

        return (
          <ProductRow
            key={catName}
            title={catName}
            products={catProducts}
            categorySlug={catSlug}
            telegramUserId={telegramUser?.telegram_id}
          />
        );
      })}

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
