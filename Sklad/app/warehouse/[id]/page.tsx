import ProductDetails from "@/components/ProductDetails"

// Temporary fetch function until we confirm backend endpoint
async function getProduct(id: string) {
    try {
        const res = await fetch(`/api/products/${id}`, { cache: 'no-store' });
        if (!res.ok) return null;
        return res.json();
    } catch (e) {
        console.error(e);
        return null;
    }
}

export default async function Page({ params }: { params: { id: string } }) {
    const item = await getProduct(params.id);
    return <ProductDetails item={item} />
}
