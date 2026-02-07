"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProductCardProduct = {
  id: number | string;
  name: string;
  price: string;
  image: string;
  images?: string[];
  isHit?: boolean;
  isNew?: boolean;
};

type ProductCardProps = {
  product: ProductCardProduct;
  variant?: "grid" | "row";
  isFavorite?: boolean;
  isInCart?: boolean;
  onFavoriteClick?: (e: React.MouseEvent) => void;
  onCartClick?: (e: React.MouseEvent) => void;
  onCardClick?: () => void;
  showFavorite?: boolean;
  showCart?: boolean;
  className?: string;
};

import { useState } from "react";
import { AnimatePresence } from "framer-motion";

/** Единая карточка товара. Всегда <img> (без Next Image) — избегаем client-side errors. */
export function ProductCard({
  product,
  variant = "grid",
  isFavorite = false,
  isInCart = false,
  onFavoriteClick,
  onCartClick,
  showFavorite = true,
  showCart = true,
  onCardClick,
  className,
}: ProductCardProps) {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const allImages = product?.images && product.images.length > 0
    ? product.images
    : [product?.image || "/placeholder.png"];

  const name = product?.name ?? "";
  const price = product?.price ?? "";
  const id = product?.id;

  if (!id) return null;

  const nextImage = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev + 1) % allImages.length);
  };

  return (
    <Link
      href={`/product/${id}`}
      onClick={onCardClick}
      className={cn(
        "group block bg-white rounded-[28px] overflow-hidden transition-all duration-300 border border-black/5",
        variant === "row" && "w-[165px] xs:w-[180px] sm:w-[200px] md:w-[220px] shrink-0 snap-center",
        className
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-square p-1.5 overflow-hidden">
        <div className="w-full h-full rounded-[22px] overflow-hidden bg-[#F9F9FB] relative">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImgIndex}
              src={allImages[currentImgIndex]}
              alt={name}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full object-cover transition-transform duration-700 ease-out sm:group-hover:scale-110"
              onError={(e) => {
                const t = e.target as HTMLImageElement;
                if (t && t.src !== "/placeholder.png") t.src = "/placeholder.png";
              }}
              onClick={(e) => {
                if (allImages.length > 1) {
                  nextImage(e);
                }
              }}
            />
          </AnimatePresence>

          {/* Area to tap for next image - Invisible but captures clicks */}
          {allImages.length > 1 && (
            <div
              className="absolute inset-0 z-[5]"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                nextImage(e);
              }}
            />
          )}

          {/* Navigation Image Counter (e.g. 1/2) */}
          {allImages.length > 1 && (
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <div className="bg-white/10 backdrop-blur-xl px-2.5 h-[14px] rounded-full border border-white/10 flex items-center justify-center">
                <span className="text-[7.5px] font-medium text-white tracking-[0.1em] translate-y-[0.2px]">
                  {currentImgIndex + 1} / {allImages.length}
                </span>
              </div>
            </div>
          )}

          {/* Overlay for better image depth */}
          <div className="absolute inset-0 bg-black/5 opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {showFavorite && onFavoriteClick && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onFavoriteClick(e);
              }}
              className="absolute top-2 right-2 w-7 h-7 glass-premium-light rounded-full flex items-center justify-center text-black active:scale-95 transition-all z-20"
            >
              <Heart
                size={14}
                className={cn(isFavorite ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-500 transition-colors")}
                strokeWidth={2}
              />
            </button>
          )}

          {product?.isHit && (
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 backdrop-blur-md rounded-full shadow-sm z-10 border border-white/20">
              <span className="text-[8px] font-bold text-black uppercase tracking-widest flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-blue-600 animate-pulse"></span>
                TOP
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-3 pb-3 pt-1 flex flex-col">
        <h3 className="text-[13px] font-semibold text-gray-800 line-clamp-2 h-[1.85rem] leading-tight tracking-tight group-hover:text-black transition-colors">
          {name}
        </h3>

        <div className="flex items-center justify-between mt-2">
          <div className="flex flex-col">
            <span className="text-[14px] xs:text-[15px] sm:text-[16px] font-black text-black tracking-tight">{price}</span>
          </div>

          {showCart && onCartClick && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCartClick(e);
              }}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 active:scale-75",
                isInCart
                  ? "bg-[#ff4d94] text-white"
                  : "bg-black text-white hover:bg-gray-800"
              )}
            >
              <div className="relative w-full h-full flex items-center justify-center">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isInCart ? 0 : 1,
                    opacity: isInCart ? 0 : 1,
                    rotate: isInCart ? 90 : 0
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="absolute"
                >
                  <Plus size={18} strokeWidth={2.5} />
                </motion.div>

                <motion.div
                  initial={false}
                  animate={{
                    scale: isInCart ? 1 : 0,
                    opacity: isInCart ? 1 : 0,
                    rotate: isInCart ? 0 : -90
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="absolute"
                >
                  <Check size={18} strokeWidth={3.5} />
                </motion.div>
              </div>
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
