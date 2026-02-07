import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface Product {
    id: number;
    name: string;
    category: string;
    price: string;
    price_raw: number;
    image: string;
    images?: string;
    rating: number;
    isHit: boolean;
    isNew: boolean;
}

export function useProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>(["Все"]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getProducts()
            .then(data => {
                if (!Array.isArray(data)) {
                    setProducts([]);
                    setCategories(["Все"]);
                    return;
                }
                // Filter ONLY bouquets (No ingredients) AND In Stock
                // Ослаблен фильтр: убрана проверка на composition !== "[]", так как некоторые букеты могут иметь пустой состав
                const bouquets = data.filter((p: any) => !p.is_ingredient && p.stock_quantity > 0).map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    category: p.category,
                    price: p.price_display || `${p.price_raw.toLocaleString()} сум`,
                    image: p.image ? (p.image.startsWith('http') ? p.image : p.image) : '/placeholder.png',
                    images: p.images || "[]",
                    rating: p.rating,
                    isHit: p.is_hit,
                    isNew: p.is_new,
                    price_raw: p.price_raw
                }));

                setProducts(bouquets);

                // Derive unique categories
                const BOUQUET_MAPPING: Record<string, string> = {
                    'available': 'В наличии',
                    'в наличии': 'В наличии',
                    'mix': 'Авторские',
                    'roses': 'Розы',
                    'peonies': 'Пионы',
                    'tulips': 'Тюльпаны',
                    'boxes': 'Коробки',
                    'baskets': 'Корзины',
                    'wedding': 'Свадебные'
                };

                const catsSet = new Set<string>(["Все"]);
                bouquets.forEach((b: any) => {
                    if (b.category) {
                        const rawCat = b.category.trim().toLowerCase();
                        const mapped = BOUQUET_MAPPING[rawCat];
                        catsSet.add(mapped || b.category.trim());
                    }
                });

                // Sort: "Все" first, then "В наличии", then others
                const sortedCats = Array.from(catsSet).sort((a, b) => {
                    if (a === "Все") return -1;
                    if (b === "Все") return 1;
                    if (a === "В наличии") return -1;
                    if (b === "В наличии") return 1;
                    return 0;
                });

                setCategories(sortedCats);
            })
            .catch(err => {
                console.error("Failed to load products", err);
                setProducts([]);
                setCategories(["Все"]);
            })
            .finally(() => setLoading(false));
    }, []);

    const getProductsByCategory = (category: string) => {
        if (category === "Все") return products;

        const BOUQUET_MAPPING: Record<string, string> = {
            'available': 'В наличии',
            'в наличии': 'В наличии',
            'mix': 'Авторские',
            'roses': 'Розы',
            'peonies': 'Пионы',
            'tulips': 'Тюльпаны',
            'boxes': 'Коробки',
            'baskets': 'Корзины',
            'wedding': 'Свадебные'
        };

        return products.filter(p => {
            if (!p.category) return false;
            const mapped = BOUQUET_MAPPING[p.category.toLowerCase()];
            // Сравниваем либо с маппингом, либо с оригинальным названием категории
            const label = mapped || p.category;
            return label === category;
        });
    };

    return { products, categories, loading, getProductsByCategory };
}
