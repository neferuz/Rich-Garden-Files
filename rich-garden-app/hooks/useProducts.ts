import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface Product {
    id: number;
    name: string;
    category: string;
    price: string;
    price_raw: number;
    image: string;
    rating: number;
    isHit: boolean;
    isNew: boolean;
}

export function useProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>(["Все"]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getProducts().then(data => {
            // Filter ONLY bouquets (No ingredients) AND In Stock
            const bouquets = data.filter((p: any) => !p.is_ingredient && p.composition && p.composition !== "[]" && p.stock_quantity > 0).map((p: any) => ({
                id: p.id,
                name: p.name,
                category: p.category,
                price: p.price_display || `${p.price_raw.toLocaleString()} сум`,
                image: p.image.startsWith('http') ? p.image : `http://localhost:8000${p.image}`,
                rating: p.rating,
                isHit: p.is_hit,
                isNew: p.is_new,
                price_raw: p.price_raw
            }));

            setProducts(bouquets);

            // Derive unique categories
            const BOUQUET_MAPPING: Record<string, string> = {
                'mix': 'Авторские',
                'roses': 'Розы',
                'peonies': 'Пионы',
                'tulips': 'Тюльпаны',
                'boxes': 'Коробки',
                'baskets': 'Корзины',
                'wedding': 'Свадебные'
            };

            const catsSet = new Set<string>(["Все"]);
            bouquets.forEach((b: Product) => {
                if (b.category) catsSet.add(BOUQUET_MAPPING[b.category.toLowerCase()] || b.category);
            });
            setCategories(Array.from(catsSet));
        })
            .catch(err => console.error("Failed to load products", err))
            .finally(() => setLoading(false));
    }, []);

    const getProductsByCategory = (category: string) => {
        if (category === "Все") return products;

        const BOUQUET_MAPPING: Record<string, string> = {
            'mix': 'Авторские',
            'roses': 'Розы',
            'peonies': 'Пионы',
            'tulips': 'Тюльпаны',
            'boxes': 'Коробки',
            'baskets': 'Корзины',
            'wedding': 'Свадебные'
        };

        return products.filter(p => {
            const label = p.category ? (BOUQUET_MAPPING[p.category.toLowerCase()] || p.category) : "";
            return label === category;
        });
    };

    return { products, categories, loading, getProductsByCategory };
}
