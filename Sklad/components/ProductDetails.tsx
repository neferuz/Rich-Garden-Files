"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useProductDetails } from "@/hooks/useProductDetails"
import { ProductInfoCard } from "./features/warehouse/product-details/ProductInfoCard"
import { ChevronLeft, ChevronRight, X, MoreVertical, Trash2, Image as ImageIcon, AlertTriangle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
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
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
    const [isImageMenuOpen, setIsImageMenuOpen] = useState(false)
    const [isImageDeleteConfirmOpen, setIsImageDeleteConfirmOpen] = useState(false)

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
        handleDelete,
        setAsMainImage
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

                    // Normalize image URL - remove domain if present, keep relative paths
                    const getImageSrc = (img: string | undefined) => {
                        if (!img) return '';
                        // If it's already a full URL, use it
                        if (img.startsWith('http://') || img.startsWith('https://')) {
                            return img;
                        }
                        // If it's a relative path starting with /static, use it as is
                        if (img.startsWith('/static')) {
                            return img;
                        }
                        // Otherwise, assume it's a relative path
                        return img;
                    };

                    const imageSrc = getImageSrc(currentImage);
                    console.log('Modal image debug:', { currentImage, imageSrc, allImages });

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

                            {/* Image Options Menu (3 dots) */}
                            <div className="absolute top-6 left-6 z-[340]">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setIsImageMenuOpen(!isImageMenuOpen)
                                    }}
                                    className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all border border-white/10"
                                >
                                    <MoreVertical size={24} />
                                </button>

                                <AnimatePresence>
                                    {isImageMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9, y: -20 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9, y: -20 }}
                                            className="absolute top-14 left-0 w-56 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-2 shadow-2xl z-[350] overflow-hidden"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <button
                                                onClick={() => {
                                                    setAsMainImage(allImages[selectedImageIndex || 0])
                                                    setIsImageMenuOpen(false)
                                                    setSelectedImageIndex(0)
                                                }}
                                                className="w-full h-12 px-4 flex items-center gap-3 text-white hover:bg-white/20 rounded-2xl transition-all"
                                            >
                                                <ImageIcon size={18} />
                                                <span className="font-bold text-sm">Сделать основной</span>
                                            </button>
                                            <div className="h-px bg-white/10 my-1 mx-2" />
                                            <button
                                                onClick={() => {
                                                    setIsImageDeleteConfirmOpen(true)
                                                    setIsImageMenuOpen(false)
                                                }}
                                                className="w-full h-12 px-4 flex items-center gap-3 text-red-400 hover:bg-red-500/20 rounded-2xl transition-all"
                                            >
                                                <Trash2 size={18} />
                                                <span className="font-bold text-sm">Удалить фото</span>
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
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
                                            src={imageSrc}
                                            alt="Full Screen"
                                            className="w-full h-full object-contain rounded-3xl shadow-2xl"
                                            onError={(e) => {
                                                console.error('Image load error in modal:', { currentImage, imageSrc, attemptedSrc: (e.target as HTMLImageElement).src });
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                            }}
                                            onLoad={() => {
                                                console.log('Image loaded successfully in modal:', imageSrc);
                                            }}
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
            {/* Image Delete Confirmation Modal */}
            <AnimatePresence>
                {isImageDeleteConfirmOpen && (
                    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsImageDeleteConfirmOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-[320px] rounded-[32px] p-8 shadow-2xl relative z-10 text-center"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-20 h-20 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6">
                                <AlertTriangle size={40} />
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Удалить фото?</h3>
                            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                                Вы уверены, что хотите удалить это изображение? Это действие нельзя будет отменить.
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setIsImageDeleteConfirmOpen(false)}
                                    className="h-14 rounded-[22px] bg-gray-100 text-gray-900 font-bold text-base hover:bg-gray-200 transition-colors"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={() => {
                                        removeImage(selectedImageIndex || 0)
                                        setIsImageDeleteConfirmOpen(false)
                                        setSelectedImageIndex(null)
                                        // Auto-save the change
                                        setTimeout(handleSave, 100)
                                    }}
                                    className="h-14 rounded-[22px] bg-red-500 text-white font-bold text-base hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                                >
                                    Удалить
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div >
    )
}
