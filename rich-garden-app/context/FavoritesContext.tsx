"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
// We will use a simple alert/console for now if sonner isn't installed, or install it later.

export interface Product {
    id: number | string
    name: string
    price: string
    image: string
    isHit?: boolean
    isNew?: boolean
}

interface FavoritesContextType {
    favorites: Product[]
    toggleFavorite: (product: Product) => void
    isFavorite: (productId: number | string) => boolean
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: ReactNode }) {
    const [favorites, setFavorites] = useState<Product[]>([])

    useEffect(() => {
        const saved = localStorage.getItem('favorites')
        if (saved) {
            try {
                setFavorites(JSON.parse(saved))
            } catch (e) {
                console.error("Failed to parse favorites", e)
            }
        }
    }, [])

    useEffect(() => {
        localStorage.setItem('favorites', JSON.stringify(favorites))
    }, [favorites])

    const toggleFavorite = (product: Product) => {
        setFavorites(prev => {
            const exists = prev.some(p => p.id === product.id)
            if (exists) {
                return prev.filter(p => p.id !== product.id)
            } else {
                return [...prev, product]
            }
        })
    }

    const isFavorite = (productId: number | string) => {
        return favorites.some(p => p.id === productId)
    }

    return (
        <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
            {children}
        </FavoritesContext.Provider>
    )
}

export function useFavorites() {
    const context = useContext(FavoritesContext)
    if (context === undefined) {
        throw new Error('useFavorites must be used within a FavoritesProvider')
    }
    return context
}
