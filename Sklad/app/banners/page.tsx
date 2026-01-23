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
            {/* Header (Finance Style) */}
            <div className="pt-6 px-6 mb-6">
                <div className="flex items-center justify-between">
                    <Link href="/profile" className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-100 text-gray-500 hover:text-black hover:bg-gray-50 transition-colors shadow-sm">
                        <ChevronLeft size={22} />
                    </Link>
                    <h1 className="text-xl font-bold text-gray-900">Баннеры</h1>
                    <button
                        onClick={openAddModal}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-[#3173f1] text-white hover:bg-[#2563eb] transition-colors shadow-lg shadow-blue-500/20 active:scale-95"
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </div>

            <div className="px-6 mt-8 space-y-6">
                {isLoading ? (
                    <div className="flex flex-col items-center py-32 gap-4">
                        <div className="relative w-12 h-12">
                            <div className="absolute inset-0 rounded-full border-4 border-blue-50"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-[#3173f1] border-t-transparent animate-spin"></div>
                        </div>
                        <span className="text-gray-400 text-sm font-medium tracking-wide">Загружаем баннеры...</span>
                    </div>
                ) : banners.length === 0 ? (
                    <div className="bg-white rounded-[40px] p-12 text-center border border-dashed border-gray-200 shadow-sm max-w-md mx-auto">
                        <div className="w-20 h-20 rounded-3xl bg-blue-50 text-[#3173f1] flex items-center justify-center mx-auto mb-6 transform -rotate-3">
                            <Sparkles size={40} />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">Баннеров пока нет</h3>
                        <p className="text-sm text-gray-400 font-medium mb-8 max-w-[240px] mx-auto">Добавьте первый рекламный баннер для главного экрана</p>
                        <button
                            onClick={openAddModal}
                            className="h-14 px-8 rounded-2xl bg-[#3173f1] text-white font-medium text-[15px] shadow-[0_10px_25px_rgba(49,115,241,0.2)] active:scale-95 transition-all"
                        >
                            Создать баннер
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {banners.map((banner, index) => (
                            <div key={banner.id} className="group relative aspect-[2/1] w-full rounded-[32px] overflow-hidden shadow-sm bg-white border border-gray-100 transition-all hover:shadow-xl hover:-translate-y-1 duration-300">
                                {/* Preview Content */}
                                <div className={`absolute inset-0 ${banner.bg_color} flex flex-col justify-center px-8 transition-all`}>
                                    {banner.image_url && (
                                        <>
                                            <img
                                                src={banner.image_url.startsWith('http') ? banner.image_url : `http://127.0.0.1:8000${banner.image_url}`}
                                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                            {/* Gradient Overlay for text readability */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
                                        </>
                                    )}
                                    <div className="relative z-10 w-3/4">
                                        <h2 className="text-[22px] font-black leading-tight mb-2 tracking-tight line-clamp-2 drop-shadow-sm" style={{ color: banner.title_color }}>
                                            {banner.title}
                                        </h2>
                                        <p className="text-[14px] font-semibold mb-5 whitespace-pre-line leading-relaxed line-clamp-2 opacity-90" style={{ color: banner.subtitle_color }}>
                                            {banner.subtitle}
                                        </p>
                                        <div
                                            className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest inline-flex items-center gap-2 self-start rounded-xl shadow-lg"
                                            style={{ backgroundColor: banner.button_bg_color, color: banner.button_text_color }}
                                        >
                                            {banner.button_text}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Overlay */}
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleMove(index, 'up') }}
                                        disabled={index === 0}
                                        className="w-9 h-9 rounded-full bg-white/90 backdrop-blur shadow-lg flex items-center justify-center text-black active:scale-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white hover:scale-110"
                                    >
                                        <ArrowUp size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleMove(index, 'down') }}
                                        disabled={index === banners.length - 1}
                                        className="w-9 h-9 rounded-full bg-white/90 backdrop-blur shadow-lg flex items-center justify-center text-black active:scale-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white hover:scale-110"
                                    >
                                        <ArrowDown size={16} />
                                    </button>
                                    <button
                                        onClick={() => openEditModal(banner)}
                                        className="w-9 h-9 rounded-full bg-white/90 backdrop-blur shadow-lg flex items-center justify-center text-[#3173f1] active:scale-90 transition-all hover:bg-white hover:scale-110"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(banner.id)}
                                        className="w-9 h-9 rounded-full bg-white/90 backdrop-blur shadow-lg flex items-center justify-center text-rose-500 active:scale-90 transition-all hover:bg-white hover:scale-110"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {(modalState === 'add' || modalState === 'edit') && (
                    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-6 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto"
                            onClick={closeModal}
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            drag="y"
                            dragConstraints={{ top: 0 }}
                            dragElastic={{ top: 0.05, bottom: 0.5 }}
                            onDragEnd={(_, info) => {
                                if (info.offset.y > 150 || info.velocity.y > 500) {
                                    closeModal()
                                }
                            }}
                            className="relative w-full max-w-lg bg-[#f2f2f7] rounded-t-[32px] sm:rounded-[40px] shadow-2xl z-10 max-h-[92vh] flex flex-col pointer-events-auto"
                        >
                            {/* Drag Handle */}
                            <div className="flex-shrink-0 pt-5 pb-2 cursor-grab active:cursor-grabbing touch-none flex justify-center bg-[#f2f2f7] rounded-t-[32px] sm:rounded-t-[40px]">
                                <div className="w-10 h-1.5 bg-gray-300 rounded-full opacity-60" />
                            </div>

                            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 sm:p-8 pt-2 space-y-8">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-2xl font-black text-black tracking-tight leading-none">
                                            {modalState === 'add' ? 'Новый баннер' : 'Редактирование'}
                                        </h3>
                                        <p className="text-[13px] font-semibold text-gray-400 mt-1.5">
                                            Настройте внешний вид главной
                                        </p>
                                    </div>
                                    <button onClick={closeModal} className="w-9 h-9 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center hover:bg-gray-300 transition-colors">
                                        <X size={18} strokeWidth={2.5} />
                                    </button>
                                </div>

                                {/* Live Preview */}
                                <div className="space-y-2">
                                    <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wide ml-1">Предпросмотр</label>
                                    <div className="aspect-[2/1] w-full rounded-[28px] overflow-hidden shadow-sm relative border border-gray-100 group">
                                        <div className={`absolute inset-0 ${bgColor} flex flex-col justify-center px-6 transition-all`}>
                                            {bgType === 'image' && bgImageUrl && (
                                                <>
                                                    <img src={bgImageUrl} className="absolute inset-0 w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                                                </>
                                            )}
                                            <div className="relative z-10 w-3/4 pointer-events-none">
                                                <h2 className="text-[20px] font-black leading-tight mb-2 tracking-tight break-words line-clamp-2" style={{ color: titleColor }}>
                                                    {title || "Заголовок"}
                                                </h2>
                                                <p className="text-[13px] font-semibold mb-4 whitespace-pre-line leading-relaxed line-clamp-2" style={{ color: subtitleColor }}>
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
                                </div>

                                {/* Form Fields */}
                                <div className="space-y-6">
                                    {/* Title */}
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wide ml-1">Заголовок</label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <input
                                                    value={title}
                                                    onChange={e => setTitle(e.target.value)}
                                                    className="w-full h-14 bg-white rounded-[20px] px-5 pl-12 font-bold text-gray-900 border-none shadow-sm focus:outline-none focus:ring-0 placeholder:text-gray-300"
                                                    placeholder="Напр: СЕЗОН ПИОНОВ"
                                                    required
                                                />
                                                <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                                            </div>
                                            <div className="h-14 w-14 rounded-[20px] bg-white shadow-sm overflow-hidden relative cursor-pointer flex items-center justify-center shrink-0 border-2 border-transparent hover:border-gray-200 transition-colors">
                                                <input
                                                    type="color"
                                                    value={titleColor}
                                                    onChange={e => setTitleColor(e.target.value)}
                                                    className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] p-0 m-0 cursor-pointer opacity-0"
                                                />
                                                <div className="w-8 h-8 rounded-full shadow-sm ring-1 ring-black/5" style={{ background: titleColor }} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Subtitle */}
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wide ml-1">Подзаголовок</label>
                                        <div className="flex gap-2">
                                            <textarea
                                                value={subtitle}
                                                onChange={e => setSubtitle(e.target.value)}
                                                className="w-full h-24 bg-white rounded-[24px] p-5 font-semibold text-gray-900 border-none shadow-sm focus:outline-none resize-none leading-relaxed placeholder:text-gray-300 py-4"
                                                placeholder="Описание акции..."
                                                required
                                            />
                                            <div className="h-24 w-14 rounded-[20px] bg-white shadow-sm overflow-hidden relative cursor-pointer flex items-center justify-center shrink-0 border-2 border-transparent hover:border-gray-200 transition-colors">
                                                <input
                                                    type="color"
                                                    value={subtitleColor}
                                                    onChange={e => setSubtitleColor(e.target.value)}
                                                    className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] p-0 m-0 cursor-pointer opacity-0"
                                                />
                                                <div className="w-8 h-8 rounded-full shadow-sm ring-1 ring-black/5" style={{ background: subtitleColor }} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Button Settings */}
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wide ml-1">Кнопка</label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <input
                                                    value={buttonText}
                                                    onChange={e => setButtonText(e.target.value)}
                                                    className="w-full h-14 bg-white rounded-[20px] px-5 pl-12 font-bold text-gray-900 border-none shadow-sm focus:outline-none uppercase placeholder:text-gray-300"
                                                    placeholder="КУПИТЬ"
                                                />
                                                <MousePointerClick className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                                            </div>

                                            <div className="flex flex-col gap-1 items-center">
                                                <div className="h-14 w-14 rounded-[20px] bg-white shadow-sm overflow-hidden relative cursor-pointer flex items-center justify-center shrink-0 border-2 border-transparent hover:border-gray-200 transition-colors">
                                                    <input
                                                        type="color"
                                                        value={btnTextColor}
                                                        onChange={e => setBtnTextColor(e.target.value)}
                                                        className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] p-0 m-0 cursor-pointer opacity-0"
                                                    />
                                                    <div className="w-6 h-6 rounded-full shadow-sm ring-1 ring-black/5" style={{ background: btnTextColor }} />
                                                </div>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Текст</span>
                                            </div>

                                            <div className="flex flex-col gap-1 items-center">
                                                <div className="h-14 w-14 rounded-[20px] bg-white shadow-sm overflow-hidden relative cursor-pointer flex items-center justify-center shrink-0 border-2 border-transparent hover:border-gray-200 transition-colors">
                                                    <input
                                                        type="color"
                                                        value={btnBgColor}
                                                        onChange={e => setBtnBgColor(e.target.value)}
                                                        className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] p-0 m-0 cursor-pointer opacity-0"
                                                    />
                                                    <div className="w-6 h-6 rounded-full shadow-sm ring-1 ring-black/5" style={{ background: btnBgColor }} />
                                                </div>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Фон</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Background Settings */}
                                    <div className="space-y-4">
                                        <div className="flex bg-white p-1.5 rounded-[20px] w-full shadow-sm">
                                            <button
                                                type="button"
                                                onClick={() => setBgType('color')}
                                                className={cn("flex-1 h-11 rounded-[16px] text-[13px] font-bold transition-all", bgType === 'color' ? "bg-black text-white shadow-md" : "text-gray-400 hover:text-gray-600")}
                                            >
                                                Цвет фона
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setBgType('image')}
                                                className={cn("flex-1 h-11 rounded-[16px] text-[13px] font-bold transition-all", bgType === 'image' ? "bg-black text-white shadow-md" : "text-gray-400 hover:text-gray-600")}
                                            >
                                                Изображение
                                            </button>
                                        </div>

                                        {bgType === 'color' ? (
                                            <div className="grid grid-cols-4 gap-3 p-2 bg-white rounded-[24px] shadow-sm">
                                                {[
                                                    "bg-[#d9f99d]", "bg-[#fbcfe8]", "bg-[#bae6fd]", "bg-[#fde047]",
                                                    "bg-[#e9d5ff]", "bg-[#fed7aa]", "bg-[#cbd5e1]", "bg-white"
                                                ].map(color => (
                                                    <button
                                                        key={color}
                                                        type="button"
                                                        onClick={() => setBgColor(color)}
                                                        className={`h-12 rounded-[16px] border-2 transition-all ${color} ${bgColor === color ? 'border-black scale-90 shadow-md ring-2 ring-black/5' : 'border-transparent hover:scale-105'}`}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <label className="block w-full aspect-[4/3] rounded-[28px] bg-white shadow-sm border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all relative overflow-hidden group active:scale-95">
                                                    {bgImageUrl ? (
                                                        <div className="relative w-full h-full group">
                                                            <img src={bgImageUrl} className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-sm">
                                                                <Edit2 size={28} />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-3">
                                                            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                                                                <ImageIcon size={28} />
                                                            </div>
                                                            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Загрузить фото</span>
                                                        </div>
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
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 sm:p-8 pt-0 bg-[#f2f2f7]">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="w-full h-16 bg-[#3173f1] text-white rounded-[24px] font-black text-[17px] active:scale-[0.98] transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={24} /> : (modalState === 'add' ? <Sparkles size={20} fill="currentColor" text-white /> : <Edit2 size={20} />)}
                                    <span>{modalState === 'add' ? 'Создать баннер' : 'Сохранить изменения'}</span>
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
                            <p className="text-gray-500 text-sm mb-8 px-4 font-medium">Это действие нельзя отменить. Баннер исчезнет из приложения.</p>

                            <div className="flex gap-3">
                                <button
                                    onClick={closeModal}
                                    className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-900 font-bold active:scale-95 transition-all hover:bg-gray-200"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 h-12 rounded-2xl bg-rose-500 text-white font-bold shadow-lg shadow-rose-200 active:scale-95 transition-all hover:bg-rose-600"
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
