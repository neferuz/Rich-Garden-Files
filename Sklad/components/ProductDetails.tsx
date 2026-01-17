"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useProductDetails } from "@/hooks/useProductDetails"
import { ProductInfoCard } from "./features/warehouse/product-details/ProductInfoCard"
import { BouquetComposition } from "./features/warehouse/product-details/BouquetComposition"
import { StockStats } from "./features/warehouse/product-details/StockStats"
import { FinanceCard } from "./features/warehouse/product-details/FinanceCard"
import { HistoryCard } from "./features/warehouse/product-details/HistoryCard"
import { ActionModals } from "./features/warehouse/product-details/ActionModals"
import { ProductDetailsHeader } from "./features/warehouse/product-details/ProductDetailsHeader"
import { NotificationToast } from "./shared/NotificationToast"
import { BottomActions } from "./features/warehouse/product-details/BottomActions"

export default function ProductDetails({ item, isModal = false, onClose }: { item?: any, isModal?: boolean, onClose?: () => void }) {
    const router = useRouter()
    const [isClosing, setIsClosing] = useState(false)

    const {
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

        currentStatus,
        isBouquet,

        handleSave,
        confirmAction,
        handlePublish,
        handleUnpublish,
        handleDelete
    } = useProductDetails(item);

    // Lock body scroll when modal is active
    useEffect(() => {
        if (isModal) {
            document.body.style.overflow = 'hidden'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isModal])

    const handleClose = () => {
        setIsClosing(true)
        setTimeout(() => {
            if (onClose) onClose()
            else router.back()
        }, 300)
    }

    if (!item) return null

    // Increased Z-index to 200 to cover BottomNav
    const containerClasses = isModal
        ? `fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex flex-col justify-end transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`
        : "min-h-screen bg-black/60 flex flex-col justify-end overflow-hidden"

    const formatNumber = (num: number) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")

    return (
        <div className={containerClasses} onClick={(e) => {
            if (isModal && e.target === e.currentTarget) handleClose()
        }}>
            <style jsx global>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                @keyframes slide-down {
                    from { transform: translateY(0); }
                    to { transform: translateY(100%); }
                }
                @keyframes count-bump {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }
                .animate-slide-up {
                    animation: slide-up 0.4s cubic-bezier(0.32, 0.72, 0, 1) forwards;
                }
                .animate-slide-down {
                    animation: slide-down 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards;
                }
                .animate-count {
                    animation: count-bump 0.2s ease-out;
                    display: inline-block;
                }
            `}</style>

            {/* Notification Toast */}
            {notification && <NotificationToast msg={notification.msg} type={notification.type} />}

            {/* The Sheet Card */}
            <div className={`w-full bg-gray-100 rounded-t-[32px] overflow-hidden flex flex-col h-[90vh] mt-auto shadow-2xl relative ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`}>

                <ProductDetailsHeader
                    handleClose={handleClose}
                    isMenuOpen={isMenuOpen}
                    setIsMenuOpen={setIsMenuOpen}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    handleSave={handleSave}
                    setIsDeleteConfirmOpen={setIsDeleteConfirmOpen}
                    isBouquet={isBouquet}
                />

                {/* Scrollable Content */}
                <div className={`overflow-y-auto h-full ${isBouquet ? 'pb-8' : 'pb-32'}`}>
                    <div className="p-6 space-y-6">

                        <ProductInfoCard
                            item={item}
                            name={name} setName={setName}
                            category={category} setCategory={setCategory}
                            supplier={supplier} setSupplier={setSupplier}
                            stock={stock}
                            isEditing={isEditing}
                            isBouquet={isBouquet}
                            currentStatus={currentStatus}
                        />

                        {isBouquet && <BouquetComposition item={item} formatNumber={formatNumber} />}

                        {!isBouquet && <StockStats stock={stock} income={income} writeOff={writeOff} formatNumber={formatNumber} />}

                        <FinanceCard
                            buyPrice={buyPrice}
                            sellPrice={sellPrice}
                            setBuyPrice={setBuyPrice}
                            setSellPrice={setSellPrice}
                            isEditing={isEditing}
                            isBouquet={isBouquet}
                        />

                        {!isBouquet && <HistoryCard history={history} />}

                    </div>
                </div>

                <BottomActions
                    isBouquet={isBouquet}
                    stock={stock}
                    setActiveAction={setActiveAction}
                    setActionValue={setActionValue}
                    setIsUnpublishConfirmOpen={setIsUnpublishConfirmOpen}
                    handlePublish={handlePublish}
                />

                <ActionModals
                    activeAction={activeAction} setActiveAction={setActiveAction}
                    actionValue={actionValue} setActionValue={setActionValue}
                    confirmAction={confirmAction}

                    isDeleteConfirmOpen={isDeleteConfirmOpen} setIsDeleteConfirmOpen={setIsDeleteConfirmOpen}
                    handleDelete={handleDelete}

                    isUnpublishConfirmOpen={isUnpublishConfirmOpen} setIsUnpublishConfirmOpen={setIsUnpublishConfirmOpen}
                    handleUnpublish={handleUnpublish}

                    itemUnit={item.unit || 'шт'}
                />

            </div>
        </div>
    )
}
