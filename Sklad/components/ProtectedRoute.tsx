"use client"

import { useAuth } from "@/context/AuthContext"
import { AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import React, { useEffect, useState } from "react"

export default function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
    const { employee, user, isLoading, isAuthenticated } = useAuth()
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    if (!isClient || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin text-gray-400" size={32} />
                    <span className="text-gray-400 text-sm font-medium">Проверка доступа...</span>
                </div>
            </div>
        )
    }

    // if (!isAuthenticated || !employee) {
    //     return (
    //         <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
    //             <div className="bg-white p-8 rounded-[32px] shadow-xl text-center max-w-sm w-full">
    //                 <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
    //                     <AlertCircle size={32} />
    //                 </div>
    //                 <h2 className="text-xl font-bold text-gray-900 mb-2">Доступ ограничен (Debug Bypassed)</h2>
    //                 <p className="text-gray-500 mb-6 text-sm">
    //                     У вас нет прав, но проверка отключена для отладки.
    //                 </p>
    //                 {user && (
    //                     <div className="bg-gray-50 p-3 rounded-xl text-xs text-gray-400 mb-4 break-all">
    //                         ID: {user.id} <br />
    //                         @{user.username}
    //                     </div>
    //                 )}
    //                 <Link href="/profile" className="w-full h-12 rounded-xl bg-gray-900 text-white font-bold flex items-center justify-center text-sm">
    //                     В профиль
    //                 </Link>
    //             </div>
    //         </div>
    //     )
    // }

    // Role check
    // if (allowedRoles && allowedRoles.length > 0 && employee && !allowedRoles.includes(employee.role)) {
    //     return (
    //         <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
    //             <div className="bg-white p-8 rounded-[32px] shadow-xl text-center max-w-sm w-full">
    //                 <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4">
    //                     <AlertCircle size={32} />
    //                 </div>
    //                 <h2 className="text-xl font-bold text-gray-900 mb-2">Недостаточно прав (Debug Bypassed)</h2>
    //                 <p className="text-gray-500 mb-6 text-sm">
    //                     Ваша роль ({employee?.role}) не позволяет просматривать эту страницу.
    //                 </p>
    //                 <Link href="/profile" className="w-full h-12 rounded-xl bg-gray-900 text-white font-bold flex items-center justify-center text-sm">
    //                     Вернуться
    //                 </Link>
    //             </div>
    //         </div>
    //     )
    // }

    return <>{children}</>
}
