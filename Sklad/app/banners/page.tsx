"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, Plus, Trash2, Edit2, Loader2, Sparkles, X, Palette, Type, MousePointerClick, Image as ImageIcon, Upload, ArrowUp, ArrowDown } from "lucide-react"
import Link from "next/link"
import { api, Banner, BannerCreate, BannerUpdate } from "@/services/api"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export default function BannersPage() {
    const [banners, setBanners] = useState<Banner[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [modalState, setModalState] = useState<'none' | 'add' | 'edit' | 'delete'>('none')
    const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null)
    const [bannerToDelete, setBannerToDelete] = useState<number | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // Form state
    const [title, setTitle] = useState("")
    const [subtitle, setSubtitle] = useState("")
    const [buttonText, setButtonText] = useState("")
    const [bgColor, setBgColor] = useState("bg-[#d9f99d]") // Default from user request
    const [bgType, setBgType] = useState<'color' | 'image'>('color')
    const [bgImage, setBgImage] = useState<File | null>(null)
    const [bgImageUrl, setBgImageUrl] = useState("")

    // New Color State
    const [titleColor, setTitleColor] = useState("#000000")
    const [subtitleColor, setSubtitleColor] = useState("#000000")
    const [btnTextColor, setBtnTextColor] = useState("#FFFFFF")
    const [btnBgColor, setBtnBgColor] = useState("#000000")

    useEffect(() => {
        fetchBanners()
    }, [])

    const fetchBanners = async () => {
        try {
            const data = await api.getBanners()
            setBanners(data)
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const resetForm = () => {
        setTitle("")
        setSubtitle("")
        setButtonText("УЗНАТЬ ПОДРОБНЕЕ")
        setBgColor("bg-[#d9f99d]")
        setBgType('color')
        setBgImage(null)
        setBgImageUrl("")

        setTitleColor("#000000")
        setSubtitleColor("#000000")
        setBtnTextColor("#FFFFFF")
        setBtnBgColor("#000000")

        setSelectedBanner(null)
    }

    const openAddModal = () => {
        resetForm()
        setModalState('add')
    }

    const openEditModal = (banner: Banner) => {
        setSelectedBanner(banner)
        setTitle(banner.title)
        setSubtitle(banner.subtitle)
        setButtonText(banner.button_text)
        setBgColor(banner.bg_color)

        setTitleColor(banner.title_color || "#000000")
        setSubtitleColor(banner.subtitle_color || "#000000")
        setBtnTextColor(banner.button_text_color || "#FFFFFF")
        setBtnBgColor(banner.button_bg_color || "#000000")

        if (banner.image_url) {
            setBgType('image')
            setBgImageUrl(banner.image_url.startsWith('http') ? banner.image_url : `http://127.0.0.1:8000${banner.image_url}`)
        } else {
            setBgType('color')
        }
        setModalState('edit')
    }

    const closeModal = () => {
        setModalState('none')
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            let finalImageUrl = selectedBanner?.image_url

            if (bgType === 'image' && bgImage) {
                const uploadRes = await api.uploadImage(bgImage)
                finalImageUrl = uploadRes.url
            } else if (bgType === 'color') {
                finalImageUrl = undefined
            }

            if (modalState === 'add') {
                const newBanner: BannerCreate = {
                    title,
                    subtitle,
                    button_text: buttonText,
                    bg_color: bgColor,
                    image_url: finalImageUrl,

                    title_color: titleColor,
                    subtitle_color: subtitleColor,
                    button_text_color: btnTextColor,
                    button_bg_color: btnBgColor,

                    sort_order: banners.length + 1,
                    is_active: true
                }
                await api.createBanner(newBanner)
            } else if (modalState === 'edit' && selectedBanner) {
                const updateData: BannerUpdate = {
                    title,
                    subtitle,
                    button_text: buttonText,
                    bg_color: bgColor,
                    image_url: finalImageUrl,

                    title_color: titleColor,
                    subtitle_color: subtitleColor,
                    button_text_color: btnTextColor,
                    button_bg_color: btnBgColor
                }
                await api.updateBanner(selectedBanner.id, updateData)
            }
            fetchBanners()
            closeModal()
        } catch (error) {
            console.error(error)
            alert("Error saving banner")
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = (id: number) => {
        setBannerToDelete(id)
        setModalState('delete')
    }

    const confirmDelete = async () => {
        if (!bannerToDelete) return
        try {
            await api.deleteBanner(bannerToDelete)
            setBanners(banners.filter(b => b.id !== bannerToDelete))
            setModalState('none')
        } catch (error) {
            console.error(error)
        }
    }

    const handleMove = async (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return
        if (direction === 'down' && index === banners.length - 1) return

        const targetIndex = direction === 'up' ? index - 1 : index + 1
        const currentBanner = banners[index]
        const targetBanner = banners[targetIndex]

        // Optimistic update
        const newBanners = [...banners]
        newBanners[index] = targetBanner
        newBanners[targetIndex] = currentBanner
        setBanners(newBanners)

        try {
            const currentOrder = currentBanner.sort_order
            const targetOrder = targetBanner.sort_order

            // Swap sort orders
            await api.updateBanner(currentBanner.id, { sort_order: targetOrder })
            await api.updateBanner(targetBanner.id, { sort_order: currentOrder })

            // Refetch to ensure consistency
            // fetchBanners() // Optional if optimistic is enough, but safest to sync
        } catch (error) {
            console.error(error)
            alert("Error moving banner")
            fetchBanners() // Revert
        }
    }

    return (
        <div className="min-h-screen bg-[#F8F9FB] pb-32">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
                <div className="px-6 h-16 flex items-center justify-between">
                    <Link href="/profile" className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full border border-black/10 bg-transparent active:scale-95 transition-transform hover:bg-black hover:text-white">
                        <ChevronLeft size={24} strokeWidth={1.5} />
                    </Link>

                    <h1 className="text-[22px] font-bold text-black lowercase tracking-tight">баннеры</h1>

                    <button
                        onClick={openAddModal}
                        className="w-10 h-10 flex items-center justify-center -mr-2 rounded-full bg-black text-white active:scale-95 transition-transform shadow-lg shadow-black/20"
                    >
                        <Plus size={24} strokeWidth={1.5} />
                    </button>
                </div>
            </header>

            <div className="px-6 mt-8 space-y-6">
                {isLoading ? (
                    <div className="flex flex-col items-center py-32 gap-4">
                        <Loader2 className="animate-spin text-gray-400" size={32} />
                        <span className="text-gray-400 text-sm font-medium">Загрузка...</span>
                    </div>
                ) : banners.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">Нет баннеров. Добавьте первый!</div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 max-w-[500px] mx-auto">
                        {banners.map((banner, index) => (
                            <div key={banner.id} className="relative aspect-[2/1] w-full rounded-[32px] overflow-hidden group shadow-sm bg-white border border-gray-100">
                                {/* Preview using user's classes */}
                                <div className={`absolute inset-0 ${banner.bg_color} flex flex-col justify-center px-6 transition-all`}>
                                    {banner.image_url && (
                                        <>
                                            <img
                                                src={banner.image_url.startsWith('http') ? banner.image_url : `http://127.0.0.1:8000${banner.image_url}`}
                                                className="absolute inset-0 w-full h-full object-cover"
                                            />
                                            {/* Overlay to ensure text readability */}
                                            {/* <div className="absolute inset-0 bg-black/10" /> */}
                                        </>
                                    )}
                                    <div className="relative z-10 w-2/3">
                                        <h2 className="text-[20px] font-bold leading-tight mb-2 tracking-tight line-clamp-2" style={{ color: banner.title_color }}>
                                            {banner.title}
                                        </h2>
                                        <p className="text-[13px] font-medium mb-4 whitespace-pre-line leading-relaxed line-clamp-2" style={{ color: banner.subtitle_color }}>
                                            {banner.subtitle}
                                        </p>
                                        <div
                                            className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-2 self-start rounded-xl"
                                            style={{ backgroundColor: banner.button_bg_color, color: banner.button_text_color }}
                                        >
                                            {banner.button_text}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleMove(index, 'up') }}
                                        disabled={index === 0}
                                        className="w-8 h-8 rounded-full bg-white/90 backdrop-blur shadow-sm flex items-center justify-center text-black active:scale-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                                    >
                                        <ArrowUp size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleMove(index, 'down') }}
                                        disabled={index === banners.length - 1}
                                        className="w-8 h-8 rounded-full bg-white/90 backdrop-blur shadow-sm flex items-center justify-center text-black active:scale-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                                    >
                                        <ArrowDown size={14} />
                                    </button>
                                    <button
                                        onClick={() => openEditModal(banner)}
                                        className="w-8 h-8 rounded-full bg-white/90 backdrop-blur shadow-sm flex items-center justify-center text-black active:scale-90 transition-all hover:bg-white"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(banner.id)}
                                        className="w-8 h-8 rounded-full bg-white/90 backdrop-blur shadow-sm flex items-center justify-center text-rose-500 active:scale-90 transition-all hover:bg-white"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {(modalState !== 'none') && (
                    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                            onClick={closeModal}
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="relative w-full max-w-lg bg-white rounded-t-[40px] sm:rounded-[40px] shadow-2xl z-10 max-h-[90vh] overflow-y-auto flex flex-col"
                        >
                            <div className="p-6 pb-2 flex items-center justify-between">
                                <h3 className="text-[20px] font-bold text-black lowercase tracking-tight">
                                    {modalState === 'add' ? 'новый баннер' : 'редактировать'}
                                </h3>
                                <button onClick={closeModal} className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-black transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6">
                                {/* Preview */}
                                <div className="aspect-[2/1] w-full rounded-[32px] overflow-hidden shadow-sm relative border border-gray-100">
                                    <div className={`absolute inset-0 ${bgColor} flex flex-col justify-center px-6 transition-all`}>
                                        {bgType === 'image' && bgImageUrl && (
                                            <img src={bgImageUrl} className="absolute inset-0 w-full h-full object-cover" />
                                        )}
                                        <div className="relative z-10 w-2/3">
                                            <h2 className="text-[20px] font-bold leading-tight mb-2 tracking-tight break-words line-clamp-2" style={{ color: titleColor }}>
                                                {title || "Заголовок"}
                                            </h2>
                                            <p className="text-[13px] font-medium mb-4 whitespace-pre-line leading-relaxed line-clamp-2" style={{ color: subtitleColor }}>
                                                {subtitle || "Подзаголовок баннера\nв две строки"}
                                            </p>
                                            <div
                                                className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-2 self-start rounded-xl shadow-lg"
                                                style={{ backgroundColor: btnBgColor, color: btnTextColor }}
                                            >
                                                {buttonText || "Кнопка"}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <form id="bannerForm" onSubmit={handleSave} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-500 ml-1">Заголовок</label>
                                        <div className="flex gap-3">
                                            <div className="relative flex-1">
                                                <input
                                                    value={title}
                                                    onChange={e => setTitle(e.target.value)}
                                                    className="w-full h-14 bg-gray-50 rounded-2xl px-5 pl-12 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/5"
                                                    placeholder="Напр: СЕЗОН ПИОНОВ"
                                                    required
                                                />
                                                <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                            </div>
                                            <div className="h-14 w-14 rounded-2xl bg-gray-50 overflow-hidden relative cursor-pointer border border-gray-100 flex items-center justify-center shrink-0">
                                                <input
                                                    type="color"
                                                    value={titleColor}
                                                    onChange={e => setTitleColor(e.target.value)}
                                                    className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] p-0 m-0 cursor-pointer opacity-0"
                                                />
                                                <div className="w-6 h-6 rounded-full border border-gray-200" style={{ background: titleColor }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-500 ml-1">Подзаголовок</label>
                                        <div className="flex gap-3">
                                            <textarea
                                                value={subtitle}
                                                onChange={e => setSubtitle(e.target.value)}
                                                className="w-full h-24 bg-gray-50 rounded-2xl p-5 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/5 resize-none leading-relaxed"
                                                placeholder="Описание акции или предложения..."
                                                required
                                            />
                                            <div className="h-24 w-14 rounded-2xl bg-gray-50 overflow-hidden relative cursor-pointer border border-gray-100 flex items-center justify-center shrink-0">
                                                <input
                                                    type="color"
                                                    value={subtitleColor}
                                                    onChange={e => setSubtitleColor(e.target.value)}
                                                    className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] p-0 m-0 cursor-pointer opacity-0"
                                                />
                                                <div className="w-6 h-6 rounded-full border border-gray-200" style={{ background: subtitleColor }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-sm font-medium text-gray-500 ml-1">Кнопка</label>
                                        <div className="flex gap-3">
                                            <div className="relative flex-1">
                                                <input
                                                    value={buttonText}
                                                    onChange={e => setButtonText(e.target.value)}
                                                    className="w-full h-14 bg-gray-50 rounded-2xl px-5 pl-12 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/5 uppercase"
                                                    placeholder="КУПИТЬ"
                                                />
                                                <MousePointerClick className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                            </div>

                                            {/* Color Pickers for Button */}
                                            <div className="h-14 w-14 rounded-2xl bg-gray-50 overflow-hidden relative cursor-pointer border border-gray-100 flex items-center justify-center shrink-0">
                                                <input
                                                    type="color"
                                                    value={btnTextColor}
                                                    onChange={e => setBtnTextColor(e.target.value)}
                                                    className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] p-0 m-0 cursor-pointer opacity-0"
                                                />
                                                <div className="w-6 h-6 rounded-full border border-gray-200" style={{ background: btnTextColor }} />
                                                <span className="text-[8px] absolute bottom-1 text-gray-400 font-bold">Текст</span>
                                            </div>

                                            <div className="h-14 w-14 rounded-2xl bg-gray-50 overflow-hidden relative cursor-pointer border border-gray-100 flex items-center justify-center shrink-0">
                                                <input
                                                    type="color"
                                                    value={btnBgColor}
                                                    onChange={e => setBtnBgColor(e.target.value)}
                                                    className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] p-0 m-0 cursor-pointer opacity-0"
                                                />
                                                <div className="w-6 h-6 rounded-full border border-gray-200" style={{ background: btnBgColor }} />
                                                <span className="text-[8px] absolute bottom-1 text-gray-400 font-bold">Фон</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex bg-gray-100 p-1 rounded-2xl w-full">
                                            <button
                                                type="button"
                                                onClick={() => setBgType('color')}
                                                className={cn("flex-1 h-10 rounded-xl text-sm font-medium transition-all", bgType === 'color' ? "bg-white text-black shadow-sm" : "text-gray-400")}
                                            >
                                                Цвет
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setBgType('image')}
                                                className={cn("flex-1 h-10 rounded-xl text-sm font-medium transition-all", bgType === 'image' ? "bg-white text-black shadow-sm" : "text-gray-400")}
                                            >
                                                Фото
                                            </button>
                                        </div>

                                        {bgType === 'color' ? (
                                            <div className="grid grid-cols-4 gap-3">
                                                {[
                                                    "bg-[#d9f99d]", // Lime
                                                    "bg-[#fbcfe8]", // Pink
                                                    "bg-[#bae6fd]", // Blue
                                                    "bg-[#fde047]", // Yellow
                                                    "bg-[#e9d5ff]", // Purple
                                                    "bg-[#fed7aa]", // Orange
                                                    "bg-[#cbd5e1]", // Slate
                                                    "bg-white"      // White
                                                ].map(color => (
                                                    <button
                                                        key={color}
                                                        type="button"
                                                        onClick={() => setBgColor(color)}
                                                        className={`h-12 rounded-xl border-2 transition-all ${color} ${bgColor === color ? 'border-black scale-95 shadow-lg' : 'border-transparent hover:scale-105'}`}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <label className="block w-full aspect-[4/3] rounded-[32px] bg-gray-50 border-3 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-all relative overflow-hidden group active:scale-95">
                                                    {bgImageUrl ? (
                                                        <div className="relative w-full h-full group">
                                                            <img src={bgImageUrl} className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                                <Edit2 size={24} />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-gray-300 shadow-sm mb-3">
                                                                <ImageIcon size={28} />
                                                            </div>
                                                            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Загрузить фото</span>
                                                        </>
                                                    )}
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0]
                                                            if (file) {
                                                                setBgImage(file)
                                                                setBgImageUrl(URL.createObjectURL(file))
                                                            }
                                                        }}
                                                    />
                                                </label>
                                                <p className="text-[11px] text-center text-gray-400 font-medium">
                                                    Рекомендуемый размер: 1080x1350 (4:5) или вертикальное.<br />
                                                    Текст будет накладываться поверх фото.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </form>
                            </div>

                            <div className="p-8 pt-0">
                                <button
                                    form="bannerForm"
                                    disabled={isSaving}
                                    className="w-full h-16 bg-black text-white rounded-[24px] font-bold text-lg active:scale-95 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-2"
                                >
                                    {isSaving && <Loader2 className="animate-spin" />}
                                    {modalState === 'add' ? 'Создать баннер' : 'Сохранить'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {modalState === 'delete' && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                            onClick={closeModal}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl z-10 text-center"
                        >
                            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Удалить баннер?</h3>
                            <p className="text-gray-500 text-sm mb-8 px-4">Это действие нельзя отменить. Баннер будет удален из слайдера навсегда.</p>

                            <div className="flex gap-3">
                                <button
                                    onClick={closeModal}
                                    className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-900 font-semibold active:scale-95 transition-all"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 h-12 rounded-2xl bg-rose-500 text-white font-semibold shadow-lg shadow-rose-200 active:scale-95 transition-all"
                                >
                                    Удалить
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
