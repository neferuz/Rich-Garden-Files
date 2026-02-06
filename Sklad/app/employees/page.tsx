"use client"

import { useState, useEffect } from "react"
import { Users, Plus, UserCog, Briefcase, Wallet, Truck, Search, Trash2, X, ChevronRight, Phone, Shield } from "lucide-react"
import { api, Employee } from "@/services/api"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import ProtectedRoute from "@/components/ProtectedRoute"
import { cn } from "@/lib/utils"

const ROLES = [
    { value: 'owner', label: 'Владелец', icon: Shield, color: 'text-purple-600', bg: 'bg-purple-100' },
    { value: 'admin', label: 'Администратор', icon: UserCog, color: 'text-blue-600', bg: 'bg-blue-100' },
    { value: 'manager', label: 'Менеджер', icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { value: 'worker', label: 'Сотрудник', icon: Users, color: 'text-gray-600', bg: 'bg-gray-100' },
    { value: 'finance', label: 'Финансист', icon: Wallet, color: 'text-green-600', bg: 'bg-green-100' },
    { value: 'courier', label: 'Курьер', icon: Truck, color: 'text-orange-600', bg: 'bg-orange-100' },
]

export default function EmployeesPage() {
    return (
        <ProtectedRoute allowedRoles={['owner', 'admin']}>
            <EmployeesContent />
        </ProtectedRoute>
    )
}

function EmployeesContent() {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Modal states
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

    const fetchEmployees = () => {
        setIsLoading(true)
        api.getEmployees()
            .then(data => {
                setEmployees(data)
                setIsLoading(false)
            })
            .catch(err => {
                console.error(err)
                setIsLoading(false)
            })
    }

    useEffect(() => {
        fetchEmployees()
    }, [])

    const filteredEmployees = employees.filter(e =>
        e.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.username || "").toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-gray-50/50 pb-32">
            {/* Header */}
            <div className="pt-6 px-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Сотрудники</h1>
                        <p className="text-gray-500 text-sm font-medium mt-1">Всего: {employees.length}</p>
                    </div>
                    <button
                        onClick={() => setIsAddOpen(true)}
                        className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 transition-colors shadow-lg shadow-black/20 active:scale-95"
                    >
                        <Plus size={24} />
                    </button>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Поиск сотрудника..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white h-12 rounded-[20px] pl-12 pr-4 text-gray-900 placeholder:text-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-black/5 shadow-sm border border-gray-100"
                    />
                </div>

                {/* List */}
                <div className="flex flex-col gap-3">
                    {isLoading ? (
                        <div className="text-center py-12 text-gray-400">Загрузка...</div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">Сотрудники не найдены</div>
                    ) : (
                        filteredEmployees.map(emp => {
                            const roleConfig = ROLES.find(r => r.value === emp.role) || ROLES[3]
                            const RoleIcon = roleConfig.icon

                            return (
                                <div
                                    key={emp.id}
                                    onClick={() => setSelectedEmployee(emp)}
                                    className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-100 active:scale-[0.99] transition-transform cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-100">
                                            {emp.photo_url ? (
                                                <img src={emp.photo_url} alt={emp.full_name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xl font-bold text-gray-400">{emp.full_name[0]}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-bold text-gray-900 text-lg truncate pr-2">
                                                    {emp.full_name}
                                                </h3>
                                                {emp.is_active ? (
                                                    <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                                                ) : (
                                                    <div className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={`px-2 py-0.5 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 ${roleConfig.bg} ${roleConfig.color}`}>
                                                    <RoleIcon size={12} />
                                                    {roleConfig.label}
                                                </div>
                                                {emp.username && (
                                                    <span className="text-xs text-gray-400 truncate">@{emp.username}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Drawers */}
            <AnimatePresence>
                {isAddOpen && (
                    <AddEmployeeDrawer onClose={() => setIsAddOpen(false)} onRefresh={fetchEmployees} />
                )}
                {selectedEmployee && (
                    <EditEmployeeDrawer employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} onRefresh={fetchEmployees} />
                )}
            </AnimatePresence>

        </div>
    )
}

// Reusable Drawer Component
function Drawer({ children, onClose, title }: { children: React.ReactNode, onClose: () => void, title?: string }) {
    const [isClosing, setIsClosing] = useState(false)

    useEffect(() => {
        // Не блокируем скролл body, так как модал имеет свой скролл
        // document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [])

    const handleClose = () => {
        setIsClosing(true)
        setTimeout(onClose, 300)
    }

    return (
        <div className={`fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end justify-center sm:items-center p-0 sm:p-4 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`} onClick={handleClose}>
            <motion.div
                className="w-full sm:max-w-md max-h-[90vh] bg-[#F2F3F5] overflow-y-auto overscroll-contain rounded-t-[32px] sm:rounded-[32px] shadow-2xl relative touch-pan-y -webkit-overflow-scrolling-touch"
                onClick={e => e.stopPropagation()}
                initial={{ y: "100%" }}
                animate={{ y: isClosing ? "100%" : "0%" }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                drag={false}
            >
                {/* Header */}
                <div className="bg-white/80 backdrop-blur-md px-6 py-4 sticky top-0 z-20 flex items-center justify-between border-b border-gray-100/50">
                    <div className="w-10" />
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-1 bg-gray-300 rounded-full mb-3 opacity-50" />
                        {title && <h1 className="text-lg font-bold text-gray-900 leading-tight">{title}</h1>}
                    </div>
                    <button onClick={handleClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 pb-8">
                    {children}
                </div>
            </motion.div>
        </div>
    )
}

function AddEmployeeDrawer({ onClose, onRefresh }: { onClose: () => void, onRefresh: () => void }) {
    const [fullName, setFullName] = useState("")
    const [telegramId, setTelegramId] = useState("")
    const [username, setUsername] = useState("")
    const [role, setRole] = useState("worker")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        if (!fullName || !telegramId) return

        setLoading(true)
        try {
            await api.createEmployee({
                full_name: fullName,
                telegram_id: parseInt(telegramId),
                username: username || undefined,
                role,
                is_active: true
            })
            onRefresh()
            onClose()
        } catch (e) {
            console.error(e)
            alert("Ошибка при создании сотрудника")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Drawer onClose={onClose} title="Новый сотрудник">
            <div className="bg-white p-5 rounded-[24px] shadow-sm mb-4">
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-1 mb-1.5 block">Имя сотрудника</label>
                        <input
                            value={fullName} onChange={e => setFullName(e.target.value)}
                            className="w-full h-12 bg-gray-50 rounded-[16px] px-4 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/5"
                            placeholder="Иван Иванов"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-1 mb-1.5 block">Telegram ID</label>
                        <input
                            type="number"
                            value={telegramId} onChange={e => setTelegramId(e.target.value)}
                            className="w-full h-12 bg-gray-50 rounded-[16px] px-4 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/5"
                            placeholder="123456789"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-1 mb-1.5 block">Username</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">@</span>
                            <input
                                value={username} onChange={e => setUsername(e.target.value.replace('@', ''))}
                                className="w-full h-12 bg-gray-50 rounded-[16px] pl-8 pr-4 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/5"
                                placeholder="username"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-5 rounded-[24px] shadow-sm mb-6">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-1 mb-3 block">Роль</label>
                <div className="grid grid-cols-2 gap-2">
                    {ROLES.map(r => (
                        <button
                            key={r.value}
                            onClick={() => setRole(r.value)}
                            className={cn(
                                "h-12 rounded-[16px] text-sm font-bold flex items-center justify-center gap-2 transition-all",
                                role === r.value
                                    ? "bg-black text-white shadow-lg shadow-black/10 scale-[1.02]"
                                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                            )}
                        >
                            <r.icon size={16} />
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={handleSubmit}
                disabled={loading || !fullName || !telegramId}
                className="w-full h-14 rounded-[24px] bg-black text-white font-bold text-lg hover:bg-gray-900 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
            >
                {loading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                <span>Создать сотрудника</span>
            </button>
        </Drawer>
    )
}

function EditEmployeeDrawer({ employee, onClose, onRefresh }: { employee: Employee, onClose: () => void, onRefresh: () => void }) {
    const [role, setRole] = useState(employee.role)
    const [isActive, setIsActive] = useState(employee.is_active)
    const [loading, setLoading] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleSave = async () => {
        setLoading(true)
        try {
            await api.updateEmployee(employee.id, { role, is_active: isActive })
            onRefresh()
            onClose()
        } catch (e) {
            console.error(e)
            alert("Ошибка сохранения")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm("Удалить сотрудника?")) return
        setIsDeleting(true)
        try {
            await api.deleteEmployee(employee.id)
            onRefresh()
            onClose()
        } catch (e) {
            console.error(e)
            alert("Ошибка удаления")
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Drawer onClose={onClose} title={employee.full_name}>
            {/* Profile Header */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm mb-4 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-4 border-gray-50 mb-3 text-3xl font-bold text-gray-300">
                    {employee.photo_url ? (
                        <img src={employee.photo_url} alt={employee.full_name} className="w-full h-full object-cover" />
                    ) : (
                        employee.full_name[0]
                    )}
                </div>
                <h2 className="text-xl font-bold text-gray-900 text-center">{employee.full_name}</h2>
                <p className="text-sm font-medium text-gray-400 mb-4">{employee.username ? `@${employee.username}` : `ID: ${employee.telegram_id}`}</p>

                <div className="flex gap-2">
                    <a href={`https://t.me/${employee.username || ''}`} target="_blank" className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors">
                        <Briefcase size={18} />
                    </a>
                    <div className={cn("px-4 h-10 rounded-full flex items-center justify-center font-bold text-sm uppercase", employee.is_active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500")}>
                        {employee.is_active ? "Активен" : "Скрыт"}
                    </div>
                </div>
            </div>

            {/* Role Selector */}
            <div className="bg-white p-5 rounded-[24px] shadow-sm mb-4">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-1 mb-3 block">Роль</label>
                <div className="grid grid-cols-2 gap-2">
                    {ROLES.map(r => (
                        <button
                            key={r.value}
                            onClick={() => setRole(r.value)}
                            className={cn(
                                "h-12 rounded-[16px] text-sm font-bold flex items-center justify-center gap-2 transition-all",
                                role === r.value
                                    ? "bg-black text-white shadow-lg shadow-black/10 scale-[1.02]"
                                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                            )}
                        >
                            <r.icon size={16} />
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="bg-white p-5 rounded-[24px] shadow-sm mb-6 space-y-4">
                <div className="flex items-center justify-between p-2">
                    <div>
                        <div className="font-bold text-gray-900 text-sm">Доступ к системе</div>
                        <div className="text-xs text-gray-400 font-medium">Может ли сотрудник использовать бота</div>
                    </div>
                    <button
                        onClick={() => setIsActive(!isActive)}
                        className={cn("w-12 h-7 rounded-full transition-colors relative", isActive ? 'bg-green-500' : 'bg-gray-200')}
                    >
                        <div className={cn("w-5 h-5 bg-white rounded-full shadow-sm absolute top-1 transition-all", isActive ? 'left-6' : 'left-1')} />
                    </button>
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-16 h-14 rounded-[20px] bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors active:scale-95"
                >
                    {isDeleting ? <div className="w-5 h-5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" /> : <Trash2 size={22} />}
                </button>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 h-14 rounded-[20px] bg-black text-white font-bold text-lg hover:bg-gray-900 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                >
                    {loading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    <span>Сохранить изменения</span>
                </button>
            </div>

        </Drawer>
    )
}
