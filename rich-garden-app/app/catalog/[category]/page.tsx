import CategoryContent from './CategoryContent'

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

export async function generateStaticParams() {
    const fallbackCategories = [
        'all', 'roses', 'peonies', 'tulips', 'mix',
        'gypso', 'boxes', 'baskets', 'wedding', 'dried'
    ]

    try {
        // Using 127.0.0.1 to avoid localhost DNS issues in some Node environments
        const res = await fetch('http://127.0.0.1:8000/api/products', { cache: 'no-store' })
        const data = await res.json()

        const categories = new Set<string>(fallbackCategories)

        const mapping: Record<string, string> = {
            'available': 'В наличии',
            'в наличии': 'В наличии',
            'mix': 'Миксы',
            'roses': 'Розы',
            'peonies': 'Пионы',
            'tulips': 'Тюльпаны',
            'boxes': 'Коробки',
            'baskets': 'Корзины',
            'wedding': 'Свадебные'
        }

        data.forEach((p: any) => {
            const isBouquet = !p.is_ingredient && p.stock_quantity > 0
            if (isBouquet && p.category) {
                const raw = p.category;
                const lower = p.category.toLowerCase().trim();
                const mapped = (mapping[lower] || lower).toLowerCase();

                // Add variations to pre-generate paths
                categories.add(raw);
                categories.add(lower);
                categories.add(mapped);
                categories.add(encodeURIComponent(raw));
                categories.add(encodeURIComponent(lower));
                categories.add(encodeURIComponent(mapped));
            }
        })

        const paths = Array.from(categories).map((cat) => ({
            category: cat,
        }))

        console.log("Next.js pre-generating paths:", paths.map(p => p.category))
        return paths
    } catch (e) {
        console.error("Failed to fetch products for static params, using fallbacks", e)
        return fallbackCategories.map(cat => ({ category: cat }))
    }
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
    const { category } = await params
    return <CategoryContent categorySlug={category} />
}
