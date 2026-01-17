import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Order, api } from '@/services/api'

export function useOrderDetails(order?: Order, isModal: boolean = false) {
    const router = useRouter()
    const [isClosing, setIsClosing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Lock body scroll logic
    useEffect(() => {
        if (isModal) {
            document.body.style.overflow = 'hidden'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isModal])

    const handleClose = () => {
        if (isModal) {
            setIsClosing(true)
            setTimeout(() => router.back(), 300)
        }
    }

    const updateStatus = async (newStatus: string) => {
        if (!order) return
        setIsLoading(true)
        try {
            await api.updateOrderStatus(order.id, newStatus)
            window.location.reload() // Or generic refresh if we switch to query client later
        } catch (e) {
            console.error(e)
            alert('Ошибка обновления статуса')
            setIsLoading(false)
        }
    }

    return {
        isClosing,
        handleClose,
        updateStatus,
        isLoading
    }
}
