"use client"

import { Bell, BellOff, BellRing, Info } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { motion } from "framer-motion"

export default function Navbar() {
  const pathname = usePathname()
  const { user, employee } = useAuth()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  // Hide Navbar on specific pages that have their own headers
  if (
    pathname?.startsWith("/warehouse") ||
    pathname?.startsWith("/orders") ||
    pathname?.startsWith("/profile") ||
    pathname?.startsWith("/employees") ||
    pathname?.startsWith("/finance") ||
    pathname?.startsWith("/clients") ||
    pathname?.startsWith("/shop") ||
    pathname?.startsWith("/flowers") ||
    pathname?.startsWith("/tasks") ||
    pathname?.startsWith("/calendar") ||
    pathname?.startsWith("/settings")
  ) {
    return null
  }

  const displayName = employee?.full_name || user?.first_name || "Гость"
  const displayRole = employee?.role === 'owner' ? 'Владелец' :
    employee?.role === 'admin' ? 'Администратор' :
      employee?.role === 'manager' ? 'Менеджер' :
        employee?.role === 'worker' ? 'Сотрудник' :
          employee?.role === 'finance' ? 'Финансист' :
            "Пользователь"

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm transition-all duration-300">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        {/* Профиль пользователя слева */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-auto p-0 hover:bg-transparent -ml-2">
              <div className="flex items-center gap-3 px-3 py-1.5 rounded-full hover:bg-white/50 hover:shadow-sm hover:ring-1 hover:ring-black/5 transition-all duration-200 group">
                <Avatar className="h-10 w-10 border-2 border-white shadow-sm transition-transform group-hover:scale-105">
                  <AvatarImage src={employee?.photo_url || user?.photo_url} alt={displayName} />
                  <AvatarFallback className="bg-gray-100 text-gray-600">{displayName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-gray-900 leading-none">{displayName}</span>
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium leading-tight mt-0.5">{displayRole}</span>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 rounded-2xl border-gray-100 shadow-xl shadow-black/5 bg-white/90 backdrop-blur-xl">
            <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-100" />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="w-full cursor-pointer focus:bg-gray-50 rounded-lg px-2 py-1.5 text-sm font-medium">
                Профиль
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-gray-50 rounded-lg cursor-pointer">Настройки</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Иконки справа */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full text-gray-500 hover:text-black hover:bg-white/50 transition-all duration-300 group">
                <motion.div animate={{ rotate: notificationsEnabled ? [0, -10, 10, -10, 10, 0] : 0 }} transition={{ repeat: notificationsEnabled ? Infinity : 0, duration: 2, repeatDelay: 1 }}>
                  {notificationsEnabled ? (
                    <BellRing className="h-5 w-5 text-blue-600" strokeWidth={1.5} />
                  ) : (
                    <Bell className="h-5 w-5" strokeWidth={1.5} />
                  )}
                </motion.div>
                {notificationsEnabled && (
                  <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-[28px] border-none bg-white/90 backdrop-blur-xl shadow-2xl p-4 mt-2">
              <div className="flex items-center justify-between mb-2 px-2">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900 tracking-tight">Уведомления</span>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Settings</span>
                </div>
                <button
                  onClick={(e) => { e.preventDefault(); setNotificationsEnabled(!notificationsEnabled); }}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-300 outline-none ${notificationsEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}
                >
                  <motion.div
                    animate={{ x: notificationsEnabled ? 22 : 3 }}
                    initial={false}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                  />
                </button>
              </div>
              <div className={`p-3 rounded-2xl mt-2 flex items-center gap-3 transition-colors ${notificationsEnabled ? 'bg-blue-50/50' : 'bg-gray-50'}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${notificationsEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                  {notificationsEnabled ? <BellRing size={18} /> : <BellOff size={18} />}
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-gray-900 leading-none">
                    {notificationsEnabled ? 'Активны' : 'Выключены'}
                  </span>
                  <span className="text-[10px] font-medium text-gray-500 mt-1 leading-tight">
                    {notificationsEnabled ? 'Присылаем важные новости' : 'Вас не будут беспокоить'}
                  </span>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
