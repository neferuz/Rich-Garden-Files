"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import SearchBar from "@/components/SearchBar"
import StatsCards from "@/components/StatsCards"
import OrderDetails from "@/components/OrderDetails"
import ProtectedRoute from "@/components/ProtectedRoute"
import { api, Order } from "@/services/api"

export default function Home() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('order')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (orderId) {
      api.getOrderById(orderId)
        .then(setSelectedOrder)
        .catch(err => {
          console.error(err)
          setSelectedOrder(null)
        })
    } else {
      setSelectedOrder(null)
    }
  }, [orderId])

  const handleCloseModal = () => {
    router.replace('/', { scroll: false })
  }

  return (
    <ProtectedRoute>
      <SearchBar />
      <main className="px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Stats Cards */}
          <StatsCards />
        </div>
      </main>

      {selectedOrder && (
        <OrderDetails order={selectedOrder} isModal={true} onClose={handleCloseModal} />
      )}
    </ProtectedRoute>
  )
}
