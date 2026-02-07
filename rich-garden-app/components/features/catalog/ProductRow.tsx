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
  isFeatured = false,
}: {
  title: string;
  products: any[];
  categorySlug?: string;
  telegramUserId?: number;
  isFeatured?: boolean;
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
    <div
      id={`section-${title}`}
      className={`mb-0 py-4 transition-all duration-500 ${isFeatured ? 'bg-gradient-to-r from-gray-50 via-gray-100/30 to-gray-50 border border-gray-200/60 relative overflow-hidden rounded-[32px] mx-2' : ''}`}
    >
      {isFeatured && (
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <ArrowUpRight size={100} className="text-black rotate-12" />
        </div>
      )}
      <div className="px-6 pb-4 flex items-center justify-between relative z-10">
        <div className="flex flex-col">
          {isFeatured && <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Готовые к отправке</span>}
          <h3 className={`text-[22px] font-black tracking-tight ${isFeatured ? 'text-black' : 'text-black'}`}>{title}</h3>
        </div>
        {categorySlug && (
          <Link
            href={`/catalog/${categorySlug}`}
            className={`${isFeatured ? 'bg-white/60 hover:bg-white text-black' : 'bg-white/40 text-black'} backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-1.5 active:scale-95 transition-all border border-white/60`}
          >
            <span className="text-[12px] font-bold">{isFeatured ? 'смотреть' : 'все'}</span>
            <ArrowUpRight size={14} className="text-black" />
          </Link>
        )}
      </div>

      <div
        className="flex overflow-x-auto no-scrollbar gap-4 px-6 pb-2 snap-x relative z-10"
        onScroll={handleScroll}
      >
        {products.map((product) => {
          // Parse additional images from JSON string if they exist
          let additionalImages: string[] = [];
          if (product.images) {
            try {
              const parsed = JSON.parse(product.images);
              if (Array.isArray(parsed)) {
                additionalImages = parsed;
              }
            } catch (e) {
              console.error("Failed to parse product images", e);
            }
          }

          // Combine primary image with additional ones, ensuring no duplicates
          const uniqueImages = Array.from(new Set([product.image, ...additionalImages])).filter(Boolean) as string[];

          // Format price robustly
          const formattedPrice = product.price
            ? (product.price.toString().includes('сум')
              ? product.price
              : `${(product.price_raw || parseInt(product.price.toString().replace(/\D/g, '')) || 0).toLocaleString()} сум`)
            : `${(product.price_raw || 0).toLocaleString()} сум`;

          const p: ProductCardProduct = {
            id: product.id,
            name: product.name,
            price: formattedPrice,
            image: product.image || "/placeholder.png",
            images: uniqueImages,
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
                  toast.success("Добавлено", { description: product.name, duration: 1500 });
                }
              }}
            />
          );
        })}
      </div>

      {products.length > 2 && (
        <div className="px-6 mb-4 mt-1">
          <div className="h-[3px] w-1/3 mx-auto bg-black/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-black/40 rounded-full"
              initial={{ width: "20%" }}
              animate={{
                width: `${20 + scrollProgress * 80}%`,
              }}
              transition={{ type: "spring", bounce: 0, duration: 0.1 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
