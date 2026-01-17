"use client"

import { useState, useEffect } from "react"
import { Users, Plus, MoreHorizontal, Shield, UserCog, Briefcase, Wallet, Truck, Check, X, Search, Trash2 } from "lucide-react"
import { api, Employee, EmployeeCreate, EmployeeUpdate } from "@/services/api"
import { useRouter } from "next/navigation"

const ROLES = [
    { value: 'owner', label: 'Владелец', icon: Shield, color: 'bg-purple-100 text-purple-700' },
    { value: 'admin', label: 'Администратор', icon: UserCog, color: 'bg-blue-100 text-blue-700' },
    { value: 'manager', label: 'Менеджер', icon: Briefcase, color: 'bg-indigo-100 text-indigo-700' },
    { value: 'worker', label: 'Сотрудник', icon: Users, color: 'bg-gray-100 text-gray-700' },
    { value: 'finance', label: 'Финансист', icon: Wallet, color: 'bg-green-100 text-green-700' },
    { value: 'courier', label: 'Курьер', icon: Truck, color: 'bg-orange-100 text-orange-700' },
]

import ProtectedRoute from "@/components/ProtectedRoute"

export default function EmployeesPage() {
    return (
        <ProtectedRoute allowedRoles={['owner', 'admin']}>
            <EmployeesContent />
        </ProtectedRoute>
    )
}

function EmployeesContent() {
    const router = useRouter()
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
                                                <div className={`px-2 py-0.5 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 ${roleConfig.color}`}>
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

            {/* Add Modal */}
            {isAddOpen && (
                <AddEmployeeModal onClose={() => setIsAddOpen(false)} onRefresh={fetchEmployees} />
            )}

            {/* Edit Modal */}
            {selectedEmployee && (
                <EditEmployeeModal employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} onRefresh={fetchEmployees} />
            )}

        </div>
    )
}

function AddEmployeeModal({ onClose, onRefresh }: { onClose: () => void, onRefresh: () => void }) {
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
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="bg-white w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl relative z-10 animate-slide-up">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Новый сотрудник</h2>

                <div className="space-y-4 mb-8">
                    <div>
                        <label className="text-xs font-medium text-gray-400 uppercase ml-1 mb-1 block">Имя сотрудника</label>
                        <input
                            value={fullName} onChange={e => setFullName(e.target.value)}
                            className="w-full h-14 bg-gray-50 rounded-[20px] px-4 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/5"
                            placeholder="Иван Иванов"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-400 uppercase ml-1 mb-1 block">Telegram ID</label>
                        <input
                            type="number"
                            value={telegramId} onChange={e => setTelegramId(e.target.value)}
                            className="w-full h-14 bg-gray-50 rounded-[20px] px-4 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/5"
                            placeholder="123456789"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-400 uppercase ml-1 mb-1 block">Username (опционально)</label>
                        <input
                            value={username} onChange={e => setUsername(e.target.value)}
                            className="w-full h-14 bg-gray-50 rounded-[20px] px-4 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/5"
                            placeholder="@username"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-400 uppercase ml-1 mb-1 block">Роль</label>
                        <div className="grid grid-cols-2 gap-2">
                            {ROLES.map(r => (
                                <button
                                    key={r.value}
                                    onClick={() => setRole(r.value)}
                                    className={`h-12 rounded-[16px] text-sm font-bold flex items-center justify-center gap-2 transition-all ${role === r.value ? 'bg-black text-white shadow-lg shadow-black/10' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 h-14 rounded-[20px] bg-gray-100 text-gray-900 font-bold hover:bg-gray-200 transition-colors">
                        Отмена
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !fullName || !telegramId}
                        className="flex-1 h-14 rounded-[20px] bg-black text-white font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-black/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        <span>Добавить</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

function EditEmployeeModal({ employee, onClose, onRefresh }: { employee: Employee, onClose: () => void, onRefresh: () => void }) {
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
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="bg-white w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl relative z-10 animate-slide-up">

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{employee.full_name}</h2>
                        <p className="text-sm text-gray-400">ID: {employee.telegram_id}</p>
                    </div>
                    {employee.is_active ? (
                        <div className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold uppercase">Активен</div>
                    ) : (
                        <div className="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs font-bold uppercase">Скрыт</div>
                    )}
                </div>

                <div className="space-y-6 mb-8">
                    <div>
                        <label className="text-xs font-medium text-gray-400 uppercase ml-1 mb-2 block">Роль сотрудника</label>
                        <div className="grid grid-cols-2 gap-2">
                            {ROLES.map(r => (
                                <button
                                    key={r.value}
                                    onClick={() => setRole(r.value)}
                                    className={`h-12 rounded-[16px] text-sm font-bold flex items-center justify-center gap-2 transition-all ${role === r.value ? 'bg-black text-white shadow-lg shadow-black/10' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-[24px] flex items-center justify-between">
                        <div>
                            <div className="font-bold text-gray-900 text-sm">Активный доступ</div>
                            <div className="text-xs text-gray-400">Разрешить доступ к боту</div>
                        </div>
                        <button
                            onClick={() => setIsActive(!isActive)}
                            className={`w-12 h-7 rounded-full transition-colors relative ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-1 transition-transform ${isActive ? 'left-6' : 'left-1'}`} />
                        </button>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="w-14 h-14 rounded-[20px] bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                    >
                        {isDeleting ? <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" /> : <Trash2 size={20} />}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-1 h-14 rounded-[20px] bg-black text-white font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-black/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        <span>Сохранить</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
