import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useFavorites } from "@/context/FavoritesContext";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { useState } from "react";
import { api } from "@/lib/api";
import { ProductCard, type ProductCardProduct } from "./ProductCard";

export function ProductRow({
  title,
  products,
  categorySlug,
  telegramUserId,
}: {
  title: string;
  products: any[];
  categorySlug: string;
  telegramUserId?: number;
}) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addToCart, cartItems, removeFromCart } = useCart();
  const [scrollProgress, setScrollProgress] = useState(0);

  const isInCart = (productId: number | string) =>
    cartItems.some((item) => String(item.product.id) === String(productId));

  const handleProductClick = (productId: number) => {
    if (telegramUserId) {
      api.addRecentlyViewed(telegramUserId, productId).catch(console.error);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollLeft, scrollWidth, clientWidth } = e.currentTarget;
    const maxScroll = scrollWidth - clientWidth;
    const progress = maxScroll > 0 ? scrollLeft / maxScroll : 0;
    setScrollProgress(progress);
  };

  if (products.length === 0) return null;

  return (
    <div id={`section-${title}`}>
      <div className="px-6 mt-8 mb-4 flex items-center justify-between">
        <h3 className="text-[20px] font-bold text-gray-900 tracking-tight">{title}</h3>
        <Link
          href={`/catalog/${categorySlug}`}
          className="bg-[#DBE6FF] px-4 py-1.5 rounded-full flex items-center gap-1.5 active:scale-95 transition-transform"
        >
          <span className="text-[13px] font-bold text-blue-900 mb-[1px]">все</span>
          <ArrowUpRight size={16} className="text-blue-900" />
        </Link>
      </div>

      <div className="relative">
        <div
          className="flex gap-4 overflow-x-auto no-scrollbar px-6 md:px-8 py-2 snap-x snap-mandatory"
          onScroll={handleScroll}
        >
          {products.map((product) => {
            const p: ProductCardProduct = {
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.image || "/placeholder.png",
              isHit: product.isHit,
              isNew: product.isNew,
            };
            return (
              <ProductCard
                key={product.id}
                product={p}
                variant="row"
                isFavorite={isFavorite(product.id)}
                isInCart={isInCart(product.id)}
                showFavorite
                showCart
                onCardClick={() => handleProductClick(product.id)}
                onFavoriteClick={() => {
                  toggleFavorite({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                  });
                  toast.dismiss();
                  toast.success(
                    isFavorite(product.id) ? "Удалено из избранного" : "Добавлено в избранное",
                    { description: product.name, duration: 2000 }
                  );
                }}
                onCartClick={() => {
                  if (isInCart(product.id)) {
                    removeFromCart(product.id);
                    toast.error("Удалено из корзины", { description: product.name });
                  } else {
                    addToCart(product);
                  }
                }}
              />
            );
          })}
        </div>

        {products.length > 2 && (
          <div className="px-6 mt-6 flex justify-center">
            <div className="bg-gray-200 rounded-full h-1 w-24 overflow-hidden relative">
              <motion.div
                className="absolute top-0 bottom-0 bg-black rounded-full w-8"
                animate={{ left: `${scrollProgress * (96 - 32)}px` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
