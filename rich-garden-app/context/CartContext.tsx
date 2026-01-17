"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { toast } from 'sonner'

export interface Product {
    id: number | string
    name: string
    price: string
    price_raw?: number
    image: string
}

export interface CartItem {
    product: Product
    quantity: number
}

interface CartContextType {
    cartItems: CartItem[]
    addToCart: (product: Product) => void
    removeFromCart: (productId: number | string) => void
    updateQuantity: (productId: number | string, quantity: number) => void
    clearCart: () => void
    totalPrice: number
    isLoaded: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
    const [cartItems, setCartItems] = useState<CartItem[]>([])
    const [isLoaded, setIsLoaded] = useState(false)

    // Load from local storage
    useEffect(() => {
        const saved = localStorage.getItem('cart')
        if (saved) {
            try {
                setCartItems(JSON.parse(saved))
            } catch (e) {
                console.error("Failed to parse cart", e)
            }
        }
        setIsLoaded(true)
    }, [])

    // Save to local storage
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('cart', JSON.stringify(cartItems))
        }
    }, [cartItems, isLoaded])

    const addToCart = (product: Product) => {
        setCartItems(prev => {
            const existing = prev.find(item => item.product.id === product.id)
            if (existing) {
                toast.success("Количество обновлено", { description: product.name })
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            } else {
                toast.success("Добавлено в корзину", { description: product.name })
                return [...prev, { product, quantity: 1 }]
            }
        })
    }

    const removeFromCart = (productId: number | string) => {
        setCartItems(prev => prev.filter(item => item.product.id !== productId))
    }

    const updateQuantity = (productId: number | string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId)
            return
        }
        setCartItems(prev => prev.map(item =>
            item.product.id === productId ? { ...item, quantity } : item
        ))
    }

    const clearCart = () => {
        setCartItems([])
    }

    // Calculate total price
    const totalPrice = cartItems.reduce((total, item) => {
        // Use price_raw if available, otherwise try to parse string
        let price = item.product.price_raw || 0
        if (!price && item.product.price) {
            price = parseInt(item.product.price.replace(/\D/g, '')) || 0
        }
        return total + (price * item.quantity)
    }, 0)

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, totalPrice, isLoaded }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider')
    }
    return context
}
