"use client"

import { usePathname } from "next/navigation"
import ProtectedRoute from "./ProtectedRoute"

export default function AdminWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    // We allow /profile page to handle its own auth state 
    // to show users their Telegram ID if they are not yet in the system
    if (pathname === '/profile') {
        return <>{children}</>
    }

    // All other pages are strictly protected
    return (
        <ProtectedRoute>
            {children}
        </ProtectedRoute>
    )
}
