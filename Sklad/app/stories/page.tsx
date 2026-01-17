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
            <div className="sticky top-0 z-50 bg-[#F8F9FB]/80 backdrop-blur-xl border-b border-gray-100/50">
                <div className="pt-6 px-6 pb-4 flex items-center justify-between">
                    <Link href="/profile" className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-gray-100 text-gray-400 active:scale-90 transition-all shadow-sm">
                        <ChevronLeft size={24} />
                    </Link>
                    <div className="text-center">
                        <h1 className="text-[19px] font-semibold text-gray-900 leading-tight">Stories</h1>
                        <p className="text-[12px] font-medium text-gray-400">Управление контентом</p>
                    </div>
                    <button
                        onClick={openAddModal}
                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-blue-600 text-white active:scale-90 transition-all shadow-[0_8px_20px_rgba(37,99,235,0.25)]"
                    >
                        <Plus size={24} />
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
                    <div className="grid grid-cols-1 gap-4">
                        {stories.map((story) => (
                            <div key={story.id} className="bg-gray-50/50 p-5 rounded-[32px] transition-all active:scale-[0.99] flex items-center gap-5 group">
                                {/* Thumbnail */}
                                <div
                                    onClick={() => openPreviewModal(story)}
                                    className="relative w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-blue-500 via-purple-500 to-rose-400 flex-shrink-0 animate-in fade-in zoom-in duration-500 cursor-pointer hover:scale-105 transition-transform"
                                >
                                    <div className="w-full h-full rounded-full bg-white p-[2px]">
                                        <img
                                            src={`http://127.0.0.1:8000${story.thumbnail_url}`}
                                            alt={story.title}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    </div>
                                    {story.content_type === 'video' && (
                                        <div className="absolute -right-1 -bottom-1 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg border-2 border-white">
                                            <Video size={10} />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 text-[16px] truncate">{story.title}</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <div className="flex items-center gap-1 text-[12px] font-medium text-blue-500">
                                            <Eye size={12} />
                                            <span>{story.views_count} просмотров</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openStatsModal(story)}
                                        className="w-10 h-10 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center transition-all hover:bg-blue-50 hover:text-blue-500 active:scale-90"
                                    >
                                        <BarChart3 size={18} />
                                    </button>
                                    <button
                                        onClick={() => openEditModal(story)}
                                        className="w-10 h-10 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center transition-all hover:bg-emerald-50 hover:text-emerald-500 active:scale-90"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(story.id)}
                                        className="w-10 h-10 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center transition-all hover:bg-rose-50 hover:text-rose-500 active:scale-90"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Addition/Edit Modal */}
            <AnimatePresence>
                {(modalState === 'add' || modalState === 'edit') && (
                    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                            onClick={() => !isUploading && closeModal()}
                        />
                        <motion.form
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            onSubmit={handleAction}
                            className="relative w-full max-w-lg bg-white rounded-t-[40px] sm:rounded-[40px] p-8 pb-12 shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-2xl font-semibold text-gray-900">
                                        {modalState === 'add' ? 'Новый сторис' : 'Редактирование'}
                                    </h3>
                                    <p className="text-sm font-medium text-gray-400 mt-1">
                                        Заполните контент для ваших клиентов
                                    </p>
                                </div>
                                <button type="button" onClick={closeModal} className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 active:scale-90 transition-all">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-8">
                                {/* Title Input */}
                                <div className="space-y-3">
                                    <label className="text-[14px] font-semibold text-gray-500 px-1">Название истории</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Напр: Весенняя коллекция 🌸"
                                        className="w-full h-16 px-6 rounded-3xl bg-gray-50 border-2 border-transparent focus:border-blue-500/10 focus:bg-white focus:ring-4 focus:ring-blue-500/5 font-medium text-gray-900 transition-all text-lg"
                                        required
                                    />
                                </div>

                                {/* Content Type Switch */}
                                <div className="space-y-3">
                                    <label className="text-[14px] font-semibold text-gray-500 px-1">Тип контента</label>
                                    <div className="grid grid-cols-2 gap-2 p-1.5 bg-gray-50 rounded-[24px]">
                                        <button
                                            type="button"
                                            onClick={() => setContentType('image')}
                                            className={cn(
                                                "h-12 rounded-2xl flex items-center justify-center gap-2 font-semibold transition-all",
                                                contentType === 'image' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"
                                            )}
                                        >
                                            <ImageIcon size={18} />
                                            <span>Фото</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setContentType('video')}
                                            className={cn(
                                                "h-12 rounded-2xl flex items-center justify-center gap-2 font-semibold transition-all",
                                                contentType === 'video' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"
                                            )}
                                        >
                                            <Film size={18} />
                                            <span>Видео</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    {/* Thumbnail Selection */}
                                    <div className="space-y-3">
                                        <label className="text-[14px] font-semibold text-gray-500 px-1 text-center block">Миниатюра</label>
                                        <label className="block w-full aspect-square rounded-[32px] bg-gray-50 border-3 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-all relative overflow-hidden group active:scale-95">
                                            {thumbnailUrl ? (
                                                <img src={thumbnailUrl} className="w-full h-full object-cover" />
                                            ) : (
                                                <>
                                                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-gray-300 shadow-sm mb-3">
                                                        <ImageIcon size={28} />
                                                    </div>
                                                    <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">1:1 Фото</span>
                                                </>
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
                                    <div className="space-y-3">
                                        <label className="text-[14px] font-semibold text-gray-500 px-1 text-center block">Весь контент</label>
                                        <label className="block w-full aspect-square rounded-[32px] bg-gray-50 border-3 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-all relative overflow-hidden group active:scale-95">
                                            {contentUrl ? (
                                                contentType === 'video' ? (
                                                    <video src={contentUrl} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                                                ) : (
                                                    <img src={contentUrl} className="w-full h-full object-cover" />
                                                )
                                            ) : (
                                                <>
                                                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-gray-300 shadow-sm mb-3">
                                                        {contentType === 'video' ? <Video size={28} /> : <Upload size={28} />}
                                                    </div>
                                                    <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                                                        {contentType === 'video' ? 'Видео 9:16' : 'Фото 9:16'}
                                                    </span>
                                                </>
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

                            <button
                                type="submit"
                                disabled={isUploading}
                                className="w-full h-16 bg-gray-900 text-white font-medium text-[16px] rounded-[24px] mt-10 shadow-xl shadow-gray-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:active:scale-100"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>Сохранение...</span>
                                    </>
                                ) : (
                                    <>
                                        {modalState === 'add' ? <Sparkles size={20} className="text-blue-400" /> : <Edit2 size={20} className="text-blue-400" />}
                                        <span>{modalState === 'add' ? "Опубликовать в Stories" : "Сохранить изменения"}</span>
                                    </>
                                )}
                            </button>
                        </motion.form>
                    </div>
                )}
            </AnimatePresence>

            {/* Statistics Modal */}
            <AnimatePresence>
                {modalState === 'stats' && selectedStory && (
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
                            className="relative w-full max-w-lg bg-white rounded-t-[40px] sm:rounded-[40px] p-8 pb-12 shadow-2xl z-10 max-h-[85vh] overflow-hidden flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-2xl font-semibold text-gray-900">Аналитика</h3>
                                    <p className="text-sm font-medium text-gray-400 mt-1">{selectedStory.title}</p>
                                </div>
                                <button onClick={closeModal} className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                                    <X size={24} />
                                </button>
                            </div>

                            {isLoadingStats ? (
                                <div className="flex flex-col items-center py-20 gap-4">
                                    <Loader2 className="animate-spin text-blue-500" size={32} />
                                    <span className="text-gray-400 font-medium">Загружаем данные...</span>
                                </div>
                            ) : (
                                <>
                                    {/* Stats Highlights */}
                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className="bg-blue-50/50 p-6 rounded-[32px] border border-blue-50">
                                            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-blue-500 mb-4 shadow-sm">
                                                <Users size={20} />
                                            </div>
                                            <div className="text-2xl font-bold text-gray-900">{storyStats?.views_count || 0}</div>
                                            <div className="text-[12px] font-semibold text-blue-600/60 uppercase tracking-wider mt-1">Зрителей</div>
                                        </div>
                                        <div className="bg-emerald-50/50 p-6 rounded-[32px] border border-emerald-50">
                                            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-emerald-500 mb-4 shadow-sm">
                                                <Clock size={20} />
                                            </div>
                                            <div className="text-2xl font-bold text-gray-900">100%</div>
                                            <div className="text-[12px] font-semibold text-emerald-600/60 uppercase tracking-wider mt-1">Досмотра</div>
                                        </div>
                                    </div>

                                    {/* Viewers List */}
                                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
                                        <h4 className="text-[14px] font-semibold text-gray-900 px-2">Список просмотров</h4>
                                        {storyStats?.viewers.length === 0 ? (
                                            <div className="py-12 text-center text-gray-400 font-medium">
                                                Пока никто не посмотрел эту историю
                                            </div>
                                        ) : (
                                            storyStats?.viewers.map((viewer, i) => (
                                                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-[24px]">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-500 font-bold border border-gray-100 overflow-hidden relative">
                                                            {viewer.user_photo ? (
                                                                <img src={viewer.user_photo} alt={viewer.user_name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="uppercase">{viewer.user_name.slice(0, 1)}</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900 text-sm">{viewer.user_name}</div>
                                                            <div className="text-[11px] font-medium text-gray-400">
                                                                ID: {viewer.user_id} • {new Date(viewer.viewed_at).toLocaleDateString()} в {new Date(viewer.viewed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                                                        <Check size={14} strokeWidth={3} />
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </>
                            )}
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
        </div>
    )
}
