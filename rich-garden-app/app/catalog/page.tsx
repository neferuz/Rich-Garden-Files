"use client"

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, ChevronRight, X } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'
import { api } from '@/lib/api'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const categoryNames: Record<string, string> = {
  roses: "Розы",
  peonies: "Пионы",
  tulips: "Тюльпаны",
  mix: "Авторские миксы",
  gypso: "Гипсофила",
  boxes: "Цветы в коробке",
  baskets: "Корзины",
  wedding: "Свадебные",
  dried: "Сухоцветы"
}


export default function CatalogPage() {
  const [query, setQuery] = useState("")
  const [dynamicCategories, setDynamicCategories] = useState<{ id: string, name: string }[]>([])
  const [allProducts, setAllProducts] = useState<any[]>([])

  useEffect(() => {
    api.getProducts().then(data => {
      const catsSet = new Set<string>()
      const catsData: { id: string, name: string }[] = []

      // Filter only bouquets
      const bouquets = data.filter(p => !p.is_ingredient && p.composition && p.composition !== "[]")

      bouquets.forEach(b => {
        if (b.category) {
          const rawCat = b.category.toLowerCase()
          if (!catsSet.has(rawCat)) {
            catsSet.add(rawCat)
            const name = categoryNames[rawCat] || b.category
            catsData.push({ id: rawCat, name: name.toLowerCase() })
          }
        }
      })
      setDynamicCategories(catsData)
      setAllProducts(bouquets)
    })
  }, [])

  const filteredProducts = query
    ? allProducts.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    : []

  return (
    <main className="min-h-screen bg-[#f9fafb] pb-32">

      {/* Search Header (Input Only) */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#f9fafb]/90 backdrop-blur-md border-b border-gray-200/50">
        <div className="px-6 h-16 flex items-center gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="поиск"
            className="flex-1 h-full bg-transparent text-[26px] font-bold text-black placeholder:text-gray-300 outline-none lowercase tracking-tight leading-none"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery("")} className="p-2 text-gray-400">
              <X size={20} />
            </button>
          )}
          <div className="relative shrink-0 ml-2">
            <ShoppingBag size={22} className="text-black" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-6 pt-24 pb-32">

        {/* Results or Tabs */}
        <div className="flex flex-col gap-1">

          {query ? (
            // Search Results
            <div className="flex flex-col gap-4">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <Link key={product.id} href={`/product/${product.id}`} className="py-2 border-b border-gray-50">
                    <p className="text-[18px] font-bold text-black lowercase">{product.name}</p>
                    <p className="text-[14px] text-gray-400">{product.price}</p>
                  </Link>
                ))
              ) : (
                <p className="text-gray-400 text-center py-10">ничего не найдено</p>
              )}
            </div>
          ) : (
            // Category List only
            <>
              {dynamicCategories.map((cat, idx) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <Link href={`/catalog/${cat.id}`} className="group w-full py-3 flex items-center justify-between active:scale-95 transition-transform border-b border-transparent hover:border-gray-50">
                    <span className="text-[26px] font-bold text-black tracking-tight lowercase leading-none">{cat.name}</span>
                    <ChevronRight size={24} className="text-gray-200 group-hover:text-black transition-colors" />
                  </Link>
                </motion.div>
              ))}
            </>
          )}

        </div>
      </div>

      <BottomNav />
    </main>
  )
}
