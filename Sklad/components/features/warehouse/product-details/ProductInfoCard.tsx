import Image from "next/image";
import { Sprout, Package, Tag, Clock, Truck, Camera } from "lucide-react";
import { useRef } from "react";

interface ProductInfoCardProps {
    item: any;
    name: string;
    setName: (val: string) => void;
    category: string;
    setCategory: (val: string) => void;
    supplier: string;
    setSupplier: (val: string) => void;
    stock: number;
    isEditing: boolean;
    isBouquet: boolean;
    currentStatus: string;
    onImageClick?: () => void;
    image: string;
    images: string[];
    onImageUpload: (file: File) => void;
    onRemoveImage?: (idx: number) => void;
}

export function ProductInfoCard({
    item, name, setName, category, setCategory, supplier, setSupplier, stock, isEditing, isBouquet, currentStatus, onImageClick, image, images, onImageUpload, onRemoveImage
}: ProductInfoCardProps) {
    const safeColor = item.color || "bg-gray-200";
    const formatNumber = (num: number) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageClick = () => {
        if (isEditing) {
            fileInputRef.current?.click();
        } else {
            onImageClick?.();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onImageUpload(file);
        }
    };

    return (
        <div className="bg-white p-5 rounded-[24px] shadow-sm flex items-start gap-5">
            {/* Small Image */}
            <div
                className={`relative w-24 h-24 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden ${safeColor.split(' ')[0]} bg-opacity-20 cursor-pointer active:scale-95 transition-transform group`}
                onClick={handleImageClick}
            >
                {image ? (
                    <Image
                        src={image.startsWith("/static") ? `http://localhost:8000${image}` : image}
                        alt={name}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className={`w-10 h-10 rounded-full ${safeColor}`}></div>
                )}

                {images && images.length > 1 && (
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-bold text-white z-10 border border-white/20">
                        {images.length}
                    </div>
                )}

                {isEditing && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="text-white" size={24} />
                    </div>
                )}

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                />
            </div>

            {/* Name & ID */}
            <div className="flex-1 pt-1">
                <div className="flex items-start justify-between">
                    <div>
                        {isEditing ? (
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="text-xl font-bold text-gray-900 leading-tight mb-1 w-full bg-transparent border-b border-dashed border-gray-300 focus:border-blue-500 focus:outline-none p-0"
                            />
                        ) : (
                            <h2 className="text-xl font-bold text-gray-900 leading-tight mb-1">{name}</h2>
                        )}
                        <p className="text-sm text-gray-500 font-medium">#{item.id}</p>
                    </div>
                    {isBouquet ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-gray-700 border border-gray-200">
                            Букет
                        </span>
                    ) : (
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${currentStatus === 'OK' ? 'bg-gray-100 border-gray-200 text-gray-700' :
                            currentStatus === 'Low' ? 'bg-gray-200 border-gray-300 text-gray-900' : 'bg-gray-50 border-gray-100 text-gray-400'
                            }`}>
                            {currentStatus === 'OK' ? 'В наличии' : currentStatus === 'Low' ? 'Мало' : 'Нет'}
                        </span>
                    )}
                </div>
                <div className="mt-4 flex flex-wrap items-end gap-3">
                    {/* Category */}
                    <div className="flex flex-col gap-1.5 min-w-[120px]">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1 font-sans">
                            {isBouquet ? "Категория витрины" : "Категория"}
                        </span>
                        {isEditing ? (
                            <input
                                type="text"
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="h-[34px] w-full px-3 text-xs border border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 bg-blue-50/30 text-blue-700 placeholder-blue-300 font-bold"
                                placeholder="Категория..."
                            />
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-600">
                                {(category?.toLowerCase() === "flowers" || category === "Цветы") ? <Sprout size={14} className="text-emerald-500" /> :
                                    (category?.toLowerCase() === "packaging" || category === "Упаковка") ? <Package size={14} className="text-amber-500" /> :
                                        <Tag size={14} className="text-blue-500" />}
                                {(category?.toLowerCase() === "all" || category === "Разное" || !category) ? "Общее" : category}
                            </span>
                        )}
                    </div>

                    {/* Date/Stock Info */}
                    {isBouquet ? (
                        item.created_at && (
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1 font-sans">Создан</span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-500">
                                    <Clock size={14} />
                                    {new Date(item.created_at).toLocaleDateString('ru-RU')}
                                </span>
                            </div>
                        )
                    ) : (
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1 font-sans">Остаток</span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-900">
                                <Package size={14} className="text-purple-500" />
                                {formatNumber(stock)} {item.unit || "шт"}
                            </span>
                        </div>
                    )}

                    {/* Supplier */}
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1 font-sans">Поставщик</span>
                        {isEditing ? (
                            <input
                                type="text"
                                value={supplier}
                                onChange={e => setSupplier(e.target.value)}
                                className="h-[34px] w-32 px-3 text-xs border border-indigo-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-indigo-50/50 text-indigo-700 placeholder-indigo-300 font-bold"
                                placeholder="Поставщик..."
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${supplier ? "bg-indigo-50 border border-indigo-100 text-indigo-600" : "bg-gray-50 border border-gray-100 text-gray-400"}`}>
                                <Truck size={14} strokeWidth={2} />
                                {supplier || "Не указан"}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
