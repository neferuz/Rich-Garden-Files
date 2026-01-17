import { api } from '@/lib/api'
import ProductContent from './ProductContent'

export async function generateStaticParams() {
    try {
        // Using 127.0.0.1 for reliability
        const res = await fetch('http://127.0.0.1:8000/api/products', { cache: 'no-store' })
        const products = await res.json()

        return products.map((product: any) => ({
            id: product.id.toString(),
        }))
    } catch (e) {
        console.error("Failed to generate static params for products", e)
        return []
    }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <ProductContent productId={id} />
}
