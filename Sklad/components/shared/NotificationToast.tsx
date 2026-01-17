import { Check, AlertCircle } from "lucide-react";

interface NotificationToastProps {
    msg: string;
    type: 'success' | 'error';
}

export function NotificationToast({ msg, type }: NotificationToastProps) {
    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[110] animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="px-6 py-3 rounded-full flex items-center gap-3 bg-black/80 backdrop-blur-xl text-white border border-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]">
                {type === 'success' ? (
                    <Check size={18} className="text-white" strokeWidth={3} />
                ) : (
                    <AlertCircle size={18} className="text-white" strokeWidth={3} />
                )}
                <span className="font-semibold text-sm tracking-wide">{msg}</span>
            </div>
        </div>
    );
}
