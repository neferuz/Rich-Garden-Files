import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, X, Loader2, Play } from 'lucide-react';
import { api, Story } from "@/lib/api";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";

export function Stories() {
    const telUser = useTelegramAuth();
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
    const activeStory = activeStoryIndex !== null ? stories[activeStoryIndex] : null;

    useEffect(() => {
        api.getStories(telUser?.telegram_id)
            .then((data) => setStories(Array.isArray(data) ? data : []))
            .catch(() => setStories([]))
            .finally(() => setLoading(false));
    }, [telUser?.telegram_id]);

    useEffect(() => {
        if (activeStory && telUser?.telegram_id) {
            // Log view to backend
            api.logStoryView(activeStory.id, telUser.telegram_id).catch(console.error);

            // Only update locally if it's not already marked as viewed to avoid infinite loop
            if (!activeStory.is_viewed_by_me) {
                setStories(prev => prev.map(s =>
                    s.id === activeStory.id ? { ...s, is_viewed_by_me: true } : s
                ));
            }
        }
    }, [activeStory?.id, activeStory?.is_viewed_by_me, telUser?.telegram_id]);

    const handleNextStory = () => {
        if (activeStoryIndex !== null) {
            if (activeStoryIndex < stories.length - 1) {
                setActiveStoryIndex(activeStoryIndex + 1);
            } else {
                setActiveStoryIndex(null);
            }
        }
    };

    const handlePrevStory = () => {
        if (activeStoryIndex !== null && activeStoryIndex > 0) {
            setActiveStoryIndex(activeStoryIndex - 1);
        }
    };

    if (loading) return null;
    if (stories.length === 0) return null;

    return (
        <>
            <div className="pt-6 pb-2 pl-4 overflow-x-auto no-scrollbar">
                <div className="flex gap-4 pr-6">
                    {stories.map((story, idx) => (
                        <div
                            key={story.id}
                            onClick={() => setActiveStoryIndex(idx)}
                            className="flex flex-col items-center gap-2 min-w-[72px] cursor-pointer group"
                        >
                            <div className={cn(
                                "w-[72px] h-[72px] rounded-full p-[2px] transition-all relative",
                                // Ring logic: black if NOT viewed, otherwise just background
                                !story.is_viewed_by_me
                                    ? "bg-black ring-2 ring-white"
                                    : "p-[1px] bg-gray-200"
                            )}>
                                <div className={cn(
                                    "w-full h-full rounded-full border-[2px] border-white overflow-hidden relative shadow-inner",
                                    story.bg_color || "bg-pink-100"
                                )}>
                                    <img
                                        src={story.thumbnail_url.startsWith('http') ? story.thumbnail_url : story.thumbnail_url}
                                        alt={story.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = '/placeholder.png';
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-white/10 backdrop-blur-[0.5px]"></div>
                                </div>
                                {story.content_type === 'video' && (
                                    <div className="absolute -right-1 -bottom-1 w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white">
                                        <Play size={10} fill="currentColor" />
                                    </div>
                                )}
                            </div>
                            <span className={cn(
                                "text-[11px] text-center leading-tight tracking-tight max-w-[80px] line-clamp-1 transition-colors",
                                !story.is_viewed_by_me ? "font-bold text-gray-900" : "font-medium text-gray-400"
                            )}>
                                {story.title}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <AnimatePresence>
                {activeStory && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-0 sm:p-4 sm:py-8"
                        onClick={() => setActiveStoryIndex(null)}
                    >
                        <div
                            className="relative w-full h-full sm:w-[420px] sm:h-[800px] sm:rounded-[32px] overflow-hidden bg-black shadow-2xl isolate"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <motion.div
                                key={activeStory.id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.3 }}
                                className="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing"
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.2}
                                onDragEnd={(e, { offset, velocity }) => {
                                    const swipe = Math.abs(offset.x) * velocity.x;
                                    if (offset.x < -50 || swipe < -500) {
                                        handleNextStory();
                                    } else if (offset.x > 50 || swipe > 500) {
                                        handlePrevStory();
                                    }
                                }}
                            >
                                <div className="w-full h-full relative pointer-events-none">
                                    {activeStory.content_type === 'video' ? (
                                        <video
                                            src={activeStory.content_url.startsWith('http') ? activeStory.content_url : activeStory.content_url}
                                            className="w-full h-full object-cover"
                                            autoPlay
                                            muted
                                            playsInline
                                            onEnded={handleNextStory}
                                            onError={(e) => {
                                                const target = e.target as HTMLVideoElement;
                                                target.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <img
                                            src={activeStory.content_url.startsWith('http') ? activeStory.content_url : activeStory.content_url}
                                            alt={activeStory.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = '/placeholder.png';
                                            }}
                                        />
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none"></div>
                            </motion.div>

                            {/* Left/Right Tap Zones */}
                            <div className="absolute inset-y-0 left-0 w-1/5 z-20" onClick={handlePrevStory}></div>
                            <div className="absolute inset-y-0 right-0 w-1/5 z-20" onClick={handleNextStory}></div>

                            {/* Progress Bar */}
                            <div className="absolute top-4 left-4 right-4 z-30 flex gap-1.5 pt-safe-top pointer-events-none">
                                {stories.map((s, idx) => (
                                    <div key={s.id} className="h-0.5 flex-1 bg-white/30 rounded-full overflow-hidden">
                                        {idx === activeStoryIndex && (
                                            <motion.div
                                                initial={{ width: "0%" }}
                                                animate={{ width: "100%" }}
                                                transition={{ duration: 5, ease: "linear" }}
                                                className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                                onAnimationComplete={handleNextStory}
                                            />
                                        )}
                                        {idx < (activeStoryIndex || 0) && (
                                            <div className="w-full h-full bg-white"></div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Header */}
                            <div className="absolute top-8 left-4 right-4 z-30 flex items-center justify-between mt-2 pointer-events-none">
                                <div className="flex items-center gap-3 pointer-events-auto">
                                    <div className="w-9 h-9 rounded-full border border-white/20 relative overflow-hidden bg-white/20 backdrop-blur-md">
                                        <img
                                            src={activeStory.thumbnail_url.startsWith('http') ? activeStory.thumbnail_url : activeStory.thumbnail_url}
                                            alt={activeStory.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = '/placeholder.png';
                                            }}
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white font-bold text-sm leading-none drop-shadow-md">{activeStory.title}</span>
                                        <span className="text-white/60 text-[10px] font-medium leading-none mt-1">Опубликовано недавно</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setActiveStoryIndex(null)}
                                    className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white bg-white/10 backdrop-blur-xl rounded-full active:scale-90 transition-all border border-white/10 pointer-events-auto"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Footer / CTA */}
                            <div className="absolute bottom-0 left-0 right-0 p-8 z-30 flex flex-col items-center pb-12 pointer-events-none">
                                <div className="text-center mb-8">
                                    <h3 className="text-3xl font-bold text-white mb-2 drop-shadow-lg tracking-tight leading-tight">{activeStory.title}</h3>
                                    <p className="text-white/80 text-[15px] font-medium">Rich Garden • Premium Flowers</p>
                                </div>

                                <button
                                    onClick={() => setActiveStoryIndex(null)}
                                    className="w-full h-15 bg-white text-black font-bold text-[15px] rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.5)] active:scale-95 transition-transform flex items-center justify-center gap-2 pointer-events-auto"
                                >
                                    <span>Понятно</span>
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
