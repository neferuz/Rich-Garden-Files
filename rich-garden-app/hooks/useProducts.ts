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
                if (b.category) {
                    const mapped = BOUQUET_MAPPING[b.category.toLowerCase()];
                    // Если есть маппинг - используем его, иначе используем оригинальное название категории
                    catsSet.add(mapped || b.category);
                }
            });
            setCategories(Array.from(catsSet));
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
