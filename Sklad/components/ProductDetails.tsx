"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useProductDetails } from "@/hooks/useProductDetails"
import { ProductInfoCard } from "./features/warehouse/product-details/ProductInfoCard"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { BouquetComposition } from "./features/warehouse/product-details/BouquetComposition"
import { StockStats } from "./features/warehouse/product-details/StockStats"
import { FinanceCard } from "./features/warehouse/product-details/FinanceCard"
import { HistoryCard } from "./features/warehouse/product-details/HistoryCard"
import { ActionModals } from "./features/warehouse/product-details/ActionModals"
import { ProductDetailsHeader } from "./features/warehouse/product-details/ProductDetailsHeader"
import { NotificationToast } from "./shared/NotificationToast"
import { BottomActions } from "./features/warehouse/product-details/BottomActions"
import { X } from "lucide-react"

export default function ProductDetails({ item, isModal = false, onClose }: { item?: any, isModal?: boolean, onClose?: () => void }) {
    const router = useRouter()
    const [isClosing, setIsClosing] = useState(false)
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)

    const {
        buyPrice, setBuyPrice,
        sellPrice, setSellPrice,
        stock, setStock,
        income, setIncome,
        writeOff, setWriteOff,
        supplier, setSupplier,
        name, setName,
        category, setCategory,
        image, setImage,
        images, setImages,
        history, setHistory,
        removeImage,

        composition, setComposition,
        availableProducts,

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
        handleImageUpload,
        addToComposition,
        removeFromComposition,
        updateCompositionQuantity,

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
            {/* The Sheet Card */}
            <motion.div
                className={`w-full bg-gray-100 rounded-t-[32px] overflow-hidden flex flex-col h-[90vh] mt-auto shadow-2xl relative`}
                initial={{ y: "100%" }}
                animate={{ y: isClosing ? "100%" : "0%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                drag={isModal ? "y" : false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.2 }}
                onDragEnd={(_, info) => {
                    if (isModal) {
                        // Threshold to close
                        if (info.offset.y > 150 || info.velocity.y > 500) {
                            handleClose()
                        }
                    }
                }}
            >

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

                {/* ScrollableContent */}
                <div className="overflow-y-auto h-full pb-32">
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
                            onImageClick={() => (image || images.length > 0) && setSelectedImageIndex(0)}
                            image={image}
                            images={images}
                            onImageUpload={handleImageUpload}
                            onRemoveImage={removeImage}
                        />

                        {isBouquet && (
                            <BouquetComposition
                                item={item}
                                formatNumber={formatNumber}
                                isEditing={isEditing}
                                composition={composition}
                                availableProducts={availableProducts}
                                addToComposition={addToComposition}
                                removeFromComposition={removeFromComposition}
                                updateCompositionQuantity={updateCompositionQuantity}
                            />
                        )}

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

                {isEditing ? (
                    <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-3 safe-bottom pb-8">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="flex-1 h-12 rounded-[18px] bg-gray-100 text-gray-900 font-bold text-base flex items-center justify-center active:scale-[0.98] transition-transform"
                        >
                            Отмена
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 h-12 rounded-[18px] bg-[#2e6fef] text-white font-bold text-base flex items-center justify-center active:scale-[0.98] transition-transform shadow-[0_4px_20px_-4px_rgba(46,111,239,0.5)]"
                        >
                            Сохранить
                        </button>
                    </div>
                ) : (
                    <BottomActions
                        isBouquet={isBouquet}
                        stock={stock}
                        setActiveAction={setActiveAction}
                        setActionValue={setActionValue}
                        setIsUnpublishConfirmOpen={setIsUnpublishConfirmOpen}
                        handlePublish={handlePublish}
                    />
                )}

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

            </motion.div>

            {/* Image Modal */}
            {
                selectedImageIndex !== null && (() => {
                    // Unique images from both main 'image' and 'images' array
                    const allImages = Array.from(new Set([image, ...images])).filter(Boolean);
                    const currentImage = allImages[selectedImageIndex];

                    const handlePrev = (e: React.MouseEvent) => {
                        e.stopPropagation();
                        setSelectedImageIndex((prev) => (prev === 0 || prev === null ? allImages.length - 1 : prev - 1));
                    };

                    const handleNext = (e: React.MouseEvent) => {
                        e.stopPropagation();
                        setSelectedImageIndex((prev) => (prev === allImages.length - 1 || prev === null ? 0 : prev + 1));
                    };

                    return (
                        <div
                            className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-300"
                            onClick={(e) => {
                                e.stopPropagation()
                                setSelectedImageIndex(null)
                            }}
                        >
                            {/* Close Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedImageIndex(null)
                                }}
                                className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all z-[320] border border-white/10"
                            >
                                <X size={24} />
                            </button>

                            {/* Counter */}
                            <div className="absolute top-8 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/90 text-sm font-bold tracking-widest z-[320]">
                                {selectedImageIndex + 1} / {allImages.length}
                            </div>

                            <div className="relative w-full h-full flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={selectedImageIndex}
                                        initial={{ opacity: 0, x: 20, scale: 0.9 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        exit={{ opacity: 0, x: -20, scale: 0.9 }}
                                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                        className="relative w-full max-w-2xl aspect-square"
                                    >
                                        <img
                                            src={currentImage?.startsWith("/static") ? `http://localhost:8000${currentImage}` : currentImage}
                                            alt="Full Screen"
                                            className="w-full h-full object-contain rounded-3xl shadow-2xl"
                                        />
                                    </motion.div>
                                </AnimatePresence>

                                {/* Slider Controls */}
                                {allImages.length > 1 && (
                                    <>
                                        <button
                                            onClick={handlePrev}
                                            className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center text-white hover:bg-black/60 active:scale-90 transition-all z-[310] border border-white/10 shadow-lg"
                                        >
                                            <ChevronLeft size={36} strokeWidth={2.5} />
                                        </button>
                                        <button
                                            onClick={handleNext}
                                            className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center text-white hover:bg-black/60 active:scale-90 transition-all z-[310] border border-white/10 shadow-lg"
                                        >
                                            <ChevronRight size={36} strokeWidth={2.5} />
                                        </button>

                                        {/* Dots */}
                                        <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-3 z-[310]">
                                            {allImages.map((_, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedImageIndex(idx);
                                                    }}
                                                    className={`h-2 rounded-full transition-all duration-300 ${idx === selectedImageIndex ? 'w-8 bg-white' : 'w-2 bg-white/20'}`}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )
                })()
            }
        </div >
    )
}
