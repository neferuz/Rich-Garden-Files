"use client"

import { useState, useEffect, useRef } from "react"
import {
    ChevronLeft, Plus, Trash2, Image as ImageIcon,
    Upload, Loader2, Sparkles, Check, X, Eye,
    Edit2, Video, Film, BarChart3, Users, Clock
} from "lucide-react"
import Link from "next/link"
import { api, Story, StoryCreate, StoryUpdate, StoryStats } from "@/services/api"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export default function StoriesManagementPage() {
    const [stories, setStories] = useState<Story[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isUploading, setIsUploading] = useState(false)
    const [modalState, setModalState] = useState<'none' | 'add' | 'edit' | 'stats' | 'preview' | 'delete'>('none')

    // Selection for edit/stats
    const [selectedStory, setSelectedStory] = useState<Story | null>(null)
    const [storyToDelete, setStoryToDelete] = useState<number | null>(null)
    const [storyStats, setStoryStats] = useState<StoryStats | null>(null)
    const [isLoadingStats, setIsLoadingStats] = useState(false)

    // Form state
    const [title, setTitle] = useState("")
    const [contentType, setContentType] = useState<'image' | 'video'>('image')
    const [thumbnail, setThumbnail] = useState<File | null>(null)
    const [content, setContent] = useState<File | null>(null)
    const [thumbnailUrl, setThumbnailUrl] = useState("")
    const [contentUrl, setContentUrl] = useState("")

    useEffect(() => {
        fetchStories()
    }, [])

    const fetchStories = async () => {
        setIsLoading(true)
        try {
            const data = await api.getStories()
            setStories(data)
        } catch (error) {
            console.error("Failed to fetch stories", error)
        } finally {
            setIsLoading(false)
        }
    }

    const openAddModal = () => {
        resetForm()
        setModalState('add')
    }

    const openEditModal = (story: Story) => {
        setSelectedStory(story)
        setTitle(story.title)
        setContentType(story.content_type)
        setThumbnailUrl(`http://127.0.0.1:8000${story.thumbnail_url}`)
        setContentUrl(`http://127.0.0.1:8000${story.content_url}`)
        setModalState('edit')
    }

    const openStatsModal = async (story: Story) => {
        setSelectedStory(story)
        setModalState('stats')
        setIsLoadingStats(true)
        try {
            const stats = await api.getStoryStats(story.id)
            setStoryStats(stats)
        } catch (error) {
            console.error("Failed to fetch stats", error)
        } finally {
            setIsLoadingStats(false)
        }
    }

    const handleAction = async (e: React.FormEvent) => {
        e.preventDefault()

        if (modalState === 'add') {
            if (!title || !thumbnail || !content) {
                alert("Пожалуйста, заполните все поля")
                return
            }

            setIsUploading(true)
            try {
                const thumbRes = await api.uploadImage(thumbnail)
                const contentRes = await api.uploadImage(content)

                const newStory: StoryCreate = {
                    title,
                    thumbnail_url: thumbRes.url,
                    content_url: contentRes.url,
                    content_type: contentType,
                    bg_color: "bg-blue-100",
                    is_active: true
                }

                await api.createStory(newStory)
                closeModal()
                fetchStories()
            } catch (error) {
                alert("Ошибка при загрузке")
            } finally {
                setIsUploading(false)
            }
        } else if (modalState === 'edit' && selectedStory) {
            setIsUploading(true)
            try {
                let finalThumbnailUrl = selectedStory.thumbnail_url
                let finalContentUrl = selectedStory.content_url

                if (thumbnail) {
                    const thumbRes = await api.uploadImage(thumbnail)
                    finalThumbnailUrl = thumbRes.url
                }
                if (content) {
                    const contentRes = await api.uploadImage(content)
                    finalContentUrl = contentRes.url
                }

                const updateData: StoryUpdate = {
                    title,
                    thumbnail_url: finalThumbnailUrl,
                    content_url: finalContentUrl,
                    content_type: contentType
                }

                await api.updateStory(selectedStory.id, updateData)
                closeModal()
                fetchStories()
            } catch (error) {
                alert("Ошибка при обновлении")
            } finally {
                setIsUploading(false)
            }
        }
    }

    const openPreviewModal = (story: Story) => {
        setSelectedStory(story)
        setModalState('preview')
    }

    const resetForm = () => {
        setTitle("")
        setContentType('image')
        setThumbnail(null)
        setContent(null)
        setThumbnailUrl("")
        setContentUrl("")
        setSelectedStory(null)
        setStoryStats(null)
    }

    const closeModal = () => {
        setModalState('none')
    }

    const handleDeleteClick = (id: number) => {
        setStoryToDelete(id)
        setModalState('delete')
    }

    const confirmDelete = async () => {
        if (!storyToDelete) return
        try {
            await api.deleteStory(storyToDelete)
            setStories(stories.filter(s => s.id !== storyToDelete))
            closeModal()
        } catch (error) {
            console.error("Delete failed", error)
        }
    }

    return (
        <div className="min-h-screen bg-[#F8F9FB] pb-32">
            {/* Beautiful Header */}
            {/* Header (Finance Style) */}
            <div className="pt-6 px-6 mb-6">
                <div className="flex items-center justify-between">
                    <Link href="/profile" className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-100 text-gray-500 hover:text-black hover:bg-gray-50 transition-colors shadow-sm">
                        <ChevronLeft size={22} />
                    </Link>
                    <h1 className="text-xl font-bold text-gray-900">Stories</h1>
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
                            <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                        </div>
                        <span className="text-gray-400 text-sm font-medium tracking-wide">Загружаем сторис...</span>
                    </div>
                ) : stories.length === 0 ? (
                    <div className="bg-white rounded-[40px] p-12 text-center border border-dashed border-gray-200 shadow-sm">
                        <div className="w-20 h-20 rounded-3xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-6 transform rotate-3">
                            <Sparkles size={40} />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">Ваша лента пуста</h3>
                        <p className="text-sm text-gray-400 font-medium mb-8 max-w-[240px] mx-auto">Создайте красивый анонс или акцию для ваших клиентов прямо сейчас</p>
                        <button
                            onClick={openAddModal}
                            className="h-14 px-8 rounded-2xl bg-blue-600 text-white font-medium text-[15px] shadow-[0_10px_25px_rgba(37,99,235,0.2)] active:scale-95 transition-all"
                        >
                            Добавить первый сторис
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {stories.map((story) => (
                            <div key={story.id} className="group relative bg-white rounded-[24px] shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
                                {/* Preview Area */}
                                <div
                                    onClick={() => openPreviewModal(story)}
                                    className="relative w-full aspect-[9/13] bg-gray-100 cursor-pointer overflow-hidden"
                                >
                                    {story.content_type === 'video' ? (
                                        <div className="w-full h-full relative">
                                            <video
                                                src={`http://127.0.0.1:8000${story.content_url}`}
                                                className="w-full h-full object-cover"
                                                muted loop playsInline
                                            />
                                        </div>
                                    ) : (
                                        <img
                                            src={`http://127.0.0.1:8000${story.content_url}`}
                                            alt={story.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                    )}

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-60 group-hover:opacity-80 transition-opacity pointer-events-none" />

                                    {/* Top Right Type Icon */}
                                    <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                                        {story.content_type === 'video' ? <Video size={12} /> : <ImageIcon size={12} />}
                                    </div>

                                    {/* Hover Actions Overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openStatsModal(story); }}
                                            className="w-9 h-9 rounded-full bg-white text-blue-600 flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                                            title="Статистика"
                                        >
                                            <BarChart3 size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openEditModal(story); }}
                                            className="w-9 h-9 rounded-full bg-white text-gray-700 flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                                            title="Редактировать"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteClick(story.id); }}
                                            className="w-9 h-9 rounded-full bg-white text-rose-500 flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                                            title="Удалить"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {/* Bottom Info */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
                                        <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 mb-1 drop-shadow-md">{story.title}</h3>
                                        <div className="flex items-center gap-1.5 text-white/80 text-[11px] font-medium">
                                            <Eye size={12} />
                                            <span>{story.views_count}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Addition/Edit Modal */}
            <AnimatePresence>
                {(modalState === 'add' || modalState === 'edit') && (
                    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-6 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto"
                            onClick={() => !isUploading && closeModal()}
                        />
                        <motion.form
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
                            onSubmit={handleAction}
                            className="relative w-full max-w-lg bg-[#f2f2f7] rounded-t-[32px] sm:rounded-[40px] shadow-2xl z-10 max-h-[92vh] flex flex-col pointer-events-auto"
                        >
                            {/* Drag Handle */}
                            <div className="flex-shrink-0 pt-5 pb-2 cursor-grab active:cursor-grabbing touch-none flex justify-center bg-[#f2f2f7] rounded-t-[32px] sm:rounded-t-[40px]">
                                <div className="w-10 h-1.5 bg-gray-300 rounded-full opacity-60" />
                            </div>

                            <div className="overflow-y-auto overflow-x-hidden p-6 sm:p-8 space-y-8 bg-[#f2f2f7] flex-1">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-2xl font-black text-black tracking-tight leading-none">
                                            {modalState === 'add' ? 'Новая история' : 'Редактирование'}
                                        </h3>
                                        <p className="text-[13px] font-semibold text-gray-400 mt-1.5">
                                            Создайте контент для ваших клиентов
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="w-9 h-9 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center hover:bg-gray-300 transition-colors"
                                    >
                                        <X size={18} strokeWidth={2.5} />
                                    </button>
                                </div>

                                {/* Title Input */}
                                <div className="space-y-2">
                                    <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wide ml-1">Заголовок</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Напр: Лето 2026 ☀️"
                                        className="w-full h-14 px-5 rounded-[20px] bg-white border-none shadow-sm text-[17px] font-semibold text-black placeholder:text-gray-300 focus:ring-0 focus:outline-none transition-all focus:scale-[1.01]"
                                        required
                                    />
                                </div>

                                {/* Content Type */}
                                <div className="space-y-2">
                                    <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wide ml-1">Тип контента</label>
                                    <div className="grid grid-cols-2 gap-2 p-1 bg-white rounded-[24px]">
                                        <button
                                            type="button"
                                            onClick={() => setContentType('image')}
                                            className={cn(
                                                "h-11 rounded-[20px] flex items-center justify-center gap-2 text-[15px] font-bold transition-all duration-300",
                                                contentType === 'image' ? "bg-[#3173f1] text-white shadow-md shadow-blue-500/20" : "text-gray-400 hover:text-gray-600"
                                            )}
                                        >
                                            <ImageIcon size={18} />
                                            <span>Фото</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setContentType('video')}
                                            className={cn(
                                                "h-11 rounded-[20px] flex items-center justify-center gap-2 text-[15px] font-bold transition-all duration-300",
                                                contentType === 'video' ? "bg-[#3173f1] text-white shadow-md shadow-blue-500/20" : "text-gray-400 hover:text-gray-600"
                                            )}
                                        >
                                            <Film size={18} />
                                            <span>Видео</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Thumbnail Selection */}
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wide text-center block">Обложка</label>
                                        <label className="block w-full aspect-square rounded-[28px] bg-white shadow-sm hover:shadow-md transition-all relative overflow-hidden group cursor-pointer active:scale-95">
                                            {thumbnailUrl ? (
                                                <img src={thumbnailUrl} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 gap-2">
                                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                                                        <ImageIcon size={24} />
                                                    </div>
                                                    <span className="text-[11px] font-bold uppercase">1:1</span>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) {
                                                        setThumbnail(file)
                                                        setThumbnailUrl(URL.createObjectURL(file))
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>

                                    {/* Main Content Selection */}
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wide text-center block">Контент</label>
                                        <label className="block w-full aspect-square rounded-[28px] bg-white shadow-sm hover:shadow-md transition-all relative overflow-hidden group cursor-pointer active:scale-95">
                                            {contentUrl ? (
                                                contentType === 'video' ? (
                                                    <video src={contentUrl} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                                                ) : (
                                                    <img src={contentUrl} className="w-full h-full object-cover" />
                                                )
                                            ) : (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 gap-2">
                                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                                                        {contentType === 'video' ? <Video size={24} /> : <Upload size={24} />}
                                                    </div>
                                                    <span className="text-[11px] font-bold uppercase">9:16</span>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept={contentType === 'video' ? "video/*" : "image/*"}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) {
                                                        setContent(file)
                                                        setContentUrl(URL.createObjectURL(file))
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 sm:p-8 pt-0 bg-[#f2f2f7]">
                                <button
                                    type="submit"
                                    disabled={isUploading}
                                    className="w-full h-16 bg-[#3173f1] text-white font-black text-[17px] rounded-[24px] shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:active:scale-100"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={24} />
                                            <span>Загрузка...</span>
                                        </>
                                    ) : (
                                        <>
                                            {modalState === 'add' ? <Sparkles size={20} className="text-white/80" fill="currentColor" /> : <Edit2 size={20} />}
                                            <span>{modalState === 'add' ? "Опубликовать" : "Сохранить"}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.form>
                    </div>
                )}
            </AnimatePresence>

            {/* Statistics Modal */}
            <AnimatePresence>
                {modalState === 'stats' && selectedStory && (
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
                            className="relative w-full max-w-lg bg-[#f2f2f7] rounded-t-[32px] sm:rounded-[40px] shadow-2xl z-10 max-h-[85vh] overflow-hidden flex flex-col pointer-events-auto"
                        >
                            {/* Drag Handle */}
                            <div className="flex-shrink-0 pt-5 pb-2 cursor-grab active:cursor-grabbing touch-none flex justify-center bg-[#f2f2f7] rounded-t-[32px] sm:rounded-t-[40px]">
                                <div className="w-10 h-1.5 bg-gray-300 rounded-full opacity-60" />
                            </div>

                            <div className="flex-1 overflow-hidden flex flex-col p-6 sm:p-8 pt-2">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-2xl font-black text-black tracking-tight leading-none">Аналитика</h3>
                                        <p className="text-[13px] font-semibold text-gray-400 mt-1.5 line-clamp-1">{selectedStory.title}</p>
                                    </div>
                                    <button onClick={closeModal} className="w-9 h-9 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center hover:bg-gray-300 transition-colors">
                                        <X size={18} strokeWidth={2.5} />
                                    </button>
                                </div>

                                {isLoadingStats ? (
                                    <div className="flex flex-col items-center py-20 gap-4">
                                        <Loader2 className="animate-spin text-black" size={32} />
                                        <span className="text-gray-400 font-bold text-sm">Загрузка данных...</span>
                                    </div>
                                ) : (
                                    <>
                                        {/* Stats Highlights */}
                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            <div className="bg-white p-5 rounded-[28px] shadow-sm flex flex-col items-center justify-center gap-2">
                                                <div className="w-10 h-10 rounded-2xl bg-[#3173f1] text-white flex items-center justify-center mb-1 shadow-md shadow-blue-200">
                                                    <Eye size={20} strokeWidth={2.5} />
                                                </div>
                                                <div className="text-3xl font-black text-black tracking-tight">{storyStats?.views_count || 0}</div>
                                                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Просмотров</div>
                                            </div>
                                            <div className="bg-white p-5 rounded-[28px] shadow-sm flex flex-col items-center justify-center gap-2">
                                                <div className="w-10 h-10 rounded-2xl bg-[#3173f1] text-white flex items-center justify-center mb-1 shadow-md shadow-blue-200">
                                                    <Clock size={20} strokeWidth={2.5} />
                                                </div>
                                                <div className="text-3xl font-black text-black tracking-tight">100%</div>
                                                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Досмотра</div>
                                            </div>
                                        </div>

                                        {/* Viewers List */}
                                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1">
                                            <h4 className="text-[13px] font-bold text-gray-400 uppercase tracking-wide px-2 mb-2">Зрители</h4>
                                            {storyStats?.viewers.length === 0 ? (
                                                <div className="py-12 text-center text-gray-400 font-bold text-sm bg-white rounded-[24px]">
                                                    Пока никто не смотрел
                                                </div>
                                            ) : (
                                                storyStats?.viewers.map((viewer, i) => (
                                                    <div key={i} className="flex items-center justify-between p-3 pl-4 bg-white rounded-[20px] shadow-sm">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-black font-black border border-gray-100 overflow-hidden relative">
                                                                {viewer.user_photo ? (
                                                                    <img src={viewer.user_photo} alt={viewer.user_name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span className="uppercase text-sm">{viewer.user_name.slice(0, 1)}</span>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-black text-[15px]">{viewer.user_name}</div>
                                                                <div className="text-[11px] font-semibold text-gray-400">
                                                                    {new Date(viewer.viewed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center mr-1">
                                                            <Check size={14} strokeWidth={3} />
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Preview Modal */}
            <AnimatePresence>
                {modalState === 'preview' && selectedStory && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
                            onClick={closeModal}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-[400px] aspect-[9/16] bg-black rounded-[40px] overflow-hidden shadow-2xl z-10"
                        >
                            <button
                                onClick={closeModal}
                                className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white z-40 active:scale-90 transition-all"
                            >
                                <X size={24} />
                            </button>

                            <div className="absolute top-8 left-6 right-6 z-30 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-black text-[10px]">
                                    RG
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white font-bold text-sm leading-none">{selectedStory.title}</span>
                                    <span className="text-white/60 text-[10px] font-medium mt-1">Предпросмотр</span>
                                </div>
                            </div>

                            <div className="w-full h-full relative">
                                {selectedStory.content_type === 'video' ? (
                                    <video
                                        src={`http://127.0.0.1:8000${selectedStory.content_url}`}
                                        className="w-full h-full object-cover"
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                    />
                                ) : (
                                    <img
                                        src={`http://127.0.0.1:8000${selectedStory.content_url}`}
                                        alt={selectedStory.title}
                                        className="w-full h-full object-cover"
                                    />
                                )}
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
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Удалить историю?</h3>
                            <p className="text-gray-500 text-sm mb-8 px-4">Это действие нельзя отменить. История будет удалена навсегда.</p>

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
        </div >
    )
}
