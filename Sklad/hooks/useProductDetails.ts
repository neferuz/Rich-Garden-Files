import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";

type Item = {
    id: string;
    name: string;
    category: "all" | "flowers" | "packaging" | "extra";
    total: number;
    unit: string;
    min?: number;
    status: "OK" | "Low" | "No";
    color?: string;
    image?: string;
    buyPrice: number;
    sellPrice: number;
    stock_quantity?: number;
    cost_price?: number;
    price_raw?: number;
    supplier?: string;
    history?: any[];
    composition?: string | any[];
    item_type?: string;
    created_at?: string;
};

export function useProductDetails(item?: any) {
    const router = useRouter();

    // Helpers
    const getStock = (i: any) => i?.stock_quantity ?? i?.total ?? 0;
    const getBuy = (i: any) => i?.cost_price ?? i?.buyPrice ?? 0;

    // Use price_raw for sell price, fallback to sellPrice or 0
    // Note: In backend sell price is price_raw (integer).
    const getSell = (i: any) => i?.price_raw ?? i?.sellPrice ?? 0;

    // Local state
    const [buyPrice, setBuyPrice] = useState(0);
    const [sellPrice, setSellPrice] = useState(0);
    const [stock, setStock] = useState(0);
    const [income, setIncome] = useState(0);
    const [writeOff, setWriteOff] = useState(0);
    const [supplier, setSupplier] = useState("");
    const [name, setName] = useState("");
    const [category, setCategory] = useState("mix");
    const [history, setHistory] = useState<any[]>([]);

    // UI State
    const [isEditing, setIsEditing] = useState(false);
    const [activeAction, setActiveAction] = useState<'income' | 'writeoff' | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isUnpublishConfirmOpen, setIsUnpublishConfirmOpen] = useState(false);
    const [notification, setNotification] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
    const [actionValue, setActionValue] = useState("");

    useEffect(() => {
        if (item) {
            setStock(getStock(item));
            setBuyPrice(getBuy(item));
            setSellPrice(getSell(item));
            setIncome(0);
            setWriteOff(0);
            setSupplier(item.supplier || "");
            setName(item.name || "");
            setCategory(item.category || "mix");
            setHistory(item.history || []);
            setIsEditing(false);
        }
    }, [item]);

    const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleSave = async () => {
        if (!item) return;
        try {
            const res = await api.updateProduct(Number(item.id), {
                name,
                category,
                stock_quantity: stock,
                supplier,
                cost_price: buyPrice,
                price_raw: sellPrice,
                price_display: `${sellPrice.toLocaleString().replace(/,/g, " ")} сум`
            });
            if (res && res.history) setHistory(res.history);
            setIsEditing(false);
            showNotification("Товар обновлен", "success");
        } catch (err) {
            console.error(err);
            showNotification("Ошибка обновления", "error");
        }
    };

    const confirmAction = async () => {
        const val = Number(actionValue.replace(/\s/g, ''));
        if (!val || val <= 0) return;

        try {
            let updatedProduct;
            if (activeAction === 'income') {
                updatedProduct = await api.supplyProduct(Number(item.id), val, buyPrice, supplier);
                setStock((s) => s + val);
                setIncome((i) => i + val);
                showNotification(`Приход: +${val} шт`, "success");
            } else {
                const newStock = Math.max(0, stock - val);
                updatedProduct = await api.updateProduct(Number(item.id), { stock_quantity: newStock });
                setStock(newStock);
                setWriteOff((w) => w + val);
                showNotification(`Списание: -${val} шт`, "success"); // Changed type to success for confirmation
            }
            if (updatedProduct && updatedProduct.history) {
                setHistory(updatedProduct.history);
            }
            setActiveAction(null);
            setActionValue("");
        } catch (err) {
            console.error(err);
            showNotification("Ошибка операции", "error");
        }
    };

    const handlePublish = async () => {
        if (!item) return;
        try {
            await api.updateProduct(Number(item.id), {
                stock_quantity: 1,
                is_new: true,
                price_raw: sellPrice,
                price_display: `${sellPrice.toLocaleString().replace(/,/g, " ")} сум`
            });
            setStock(1);
            showNotification("Букет выставлен на витрину!", 'success');
            router.refresh();
        } catch (e) {
            console.error("Failed to publish", e);
            showNotification("Ошибка при выставлении", 'error');
        }
    };

    const handleUnpublish = async () => {
        if (!item) return;
        try {
            await api.updateProduct(Number(item.id), { stock_quantity: 0 });
            setStock(0);
            setIsUnpublishConfirmOpen(false);
            showNotification("Букет снят с витрины", 'success');
            router.refresh();
        } catch (e) {
            console.error("Failed to unpublish", e);
            showNotification("Ошибка", 'error');
        }
    };

    const handleDelete = async () => {
        if (!item) return;
        try {
            await api.deleteProduct(item.id);
            setIsDeleteConfirmOpen(false);
            window.location.href = '/warehouse';
        } catch (e) {
            console.error("Failed to delete", e);
            alert("Не удалось удалить товар.");
        }
    };

    return {
        // State
        buyPrice, setBuyPrice,
        sellPrice, setSellPrice,
        stock, setStock,
        income, setIncome,
        writeOff, setWriteOff,
        supplier, setSupplier,
        name, setName,
        category, setCategory,
        history, setHistory,
        isEditing, setIsEditing,
        activeAction, setActiveAction,
        isMenuOpen, setIsMenuOpen,
        isDeleteConfirmOpen, setIsDeleteConfirmOpen,
        isUnpublishConfirmOpen, setIsUnpublishConfirmOpen,
        notification,
        actionValue, setActionValue,

        // Calculated
        currentStatus: stock === 0 ? 'No' : stock < 5 ? 'Low' : 'OK',
        isBouquet: !!(item?.composition && item.composition !== "[]"),

        // Actions
        handleSave,
        confirmAction,
        handlePublish,
        handleUnpublish,
        handleDelete
    };
}
