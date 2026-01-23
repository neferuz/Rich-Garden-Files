const API_URL = 'http://localhost:8000/api';

export type Product = {
    id: number;
    name: string;
    category: string;
    price_display: string;
    price_raw: number;
    image: string;
    images?: string; // JSON string of additional images
    rating: number;
    is_hit: boolean;
    is_new: boolean;
    description?: string;
    cost_price?: number;
    composition?: string; // JSON string
    stock_quantity?: number;
    supplier?: string;
    history?: {
        id: number;
        action: 'income' | 'writeoff';
        quantity: number;
        date: string;
    }[];
};

export type ProductCreate = Omit<Product, 'id'>;

export interface OrderItem {
    id: string; // Product ID
    name: string;
    quantity: number;
    price: number;
    image?: string;
}

export type Order = {
    id: string;
    userId?: number;
    client: string;
    clientPhone: string;
    total: number;
    status: string;
    date: string;
    time: string;
    createdAt: string; // ISO string
    type: 'delivery' | 'pickup';
    address?: string;
    comment?: string;
    paymentMethod?: string;
    extras?: any;
    items: OrderItem[];
    history?: any[];
    user?: {
        first_name: string;
        username?: string;
        phone_number?: string;
        telegram_id?: number;
        photo_url?: string;
    };
};

export type Expense = {
    id: number;
    amount: number;
    category: string;
    note?: string;
    date: string;
};

export type WowEffect = {
    id: number;
    name: string;
    price: number;
    icon: string;
    category: string;
    description?: string;
    is_active: boolean;
};

export type WowEffectCreate = Omit<WowEffect, 'id'>;
export type WowEffectUpdate = Partial<WowEffectCreate>;

export const api = {
    async getProducts(category?: string, search?: string): Promise<Product[]> {
        const query = new URLSearchParams();
        if (category) query.append('category', category);
        if (search) query.append('search', search);

        const res = await fetch(`${API_URL}/products?${query.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
    },

    async getProductById(id: number): Promise<Product> {
        const res = await fetch(`${API_URL}/products/${id}`);
        if (!res.ok) throw new Error('Failed to fetch product');
        return res.json();
    },

    async createProduct(product: ProductCreate): Promise<Product> {
        const res = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product),
        });
        if (!res.ok) throw new Error('Failed to create product');
        return res.json();
    },

    async updateProduct(id: number, product: Partial<Product>): Promise<Product> {
        const res = await fetch(`${API_URL}/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product),
        });
        if (!res.ok) throw new Error('Failed to update product');
        return res.json();
    },

    async deleteProduct(id: number): Promise<void> {
        const res = await fetch(`${API_URL}/products/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) throw new Error('Failed to delete product');
    },

    async createExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
        const res = await fetch(`${API_URL}/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expense),
        });
        if (!res.ok) throw new Error('Failed to create expense');
        return res.json();
    },

    async getExpenses(): Promise<Expense[]> {
        const res = await fetch(`${API_URL}/expenses`);
        if (!res.ok) throw new Error('Failed to fetch expenses');
        return res.json();
    },

    async uploadImage(file: File): Promise<{ url: string }> {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) throw new Error('Failed to upload image');
        return res.json();
    },

    async supplyProduct(productId: number, quantity: number, costPrice: number, supplier?: string): Promise<Product> {
        const res = await fetch(`${API_URL}/products/${productId}/supply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                quantity: quantity,
                cost_price: costPrice,
                supplier: supplier
            }),
        });
        if (!res.ok) throw new Error('Failed to register supply');
        return res.json();
    },

    async updateOrderStatus(id: string, status: string): Promise<Order> {
        const res = await fetch(`${API_URL}/orders/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error('Failed to update order status');
        return res.json();
    },

    _mapOrder(o: any): Order {
        return {
            id: o.id.toString(),
            userId: o.user_id,
            client: (o.customer_name === 'Гость' || o.customer_name === 'Guest' || !o.customer_name) && o.user ? o.user.first_name : o.customer_name,
            clientPhone: (() => {
                let phone = (o.customer_phone && o.customer_phone !== 'Уточнить' && o.customer_phone !== 'Clarify')
                    ? o.customer_phone
                    : (o.user?.phone_number || 'Уточнить');

                if (phone === 'Уточнить') return phone;

                // Ensure starts with +
                if (!phone.startsWith('+') && /^\d/.test(phone)) {
                    phone = '+' + phone;
                }

                // Format Uzbekistan numbers: +998901234567 -> +998 90 123 45 67
                // Remove spaces first to clean up
                const clean = phone.replace(/\s/g, '');
                if (clean.startsWith('+998') && clean.length === 13) {
                    return `+998 ${clean.slice(4, 6)} ${clean.slice(6, 9)} ${clean.slice(9, 11)} ${clean.slice(11, 13)}`;
                }

                return phone;
            })(),
            total: parseFloat(o.total_price),
            status: o.status,
            date: new Date(o.created_at).toLocaleDateString('ru-RU'),
            time: new Date(o.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
            createdAt: o.created_at,
            type: 'delivery', // Defaulting for now as backend doesn't distinguishing yet
            address: o.address,
            paymentMethod: o.payment_method,
            extras: (() => {
                try { return o.extras ? (typeof o.extras === 'string' ? JSON.parse(o.extras) : o.extras) : {} }
                catch (e) { return {} }
            })(),
            items: (() => {
                try {
                    const parsed = typeof o.items === 'string' ? JSON.parse(o.items) : o.items
                    return Array.isArray(parsed) ? parsed : []
                } catch (e) { return [] }
            })(),
            history: o.history ? JSON.parse(o.history) : [],
            user: o.user
        };
    },

    async getOrders(): Promise<Order[]> {
        const res = await fetch(`${API_URL}/orders`);
        if (!res.ok) throw new Error('Failed to fetch orders');
        const data = await res.json();

        // Map backend orders to UI format
        return data.map((o: any) => this._mapOrder(o));
    },

    async getOrderById(id: string): Promise<Order> {
        const res = await fetch(`${API_URL}/orders/${id}`);
        if (!res.ok) throw new Error('Failed to fetch order');
        const data = await res.json();
        return this._mapOrder(data);
    },

    async getOrdersByUserId(telegramId: number): Promise<Order[]> {
        const res = await fetch(`${API_URL}/user/${telegramId}/orders`);
        if (!res.ok) throw new Error('Failed to fetch user orders');
        const data = await res.json();
        return data.map((o: any) => this._mapOrder(o));
    },

    async getOrdersByClientId(clientId: number): Promise<Order[]> {
        const res = await fetch(`${API_URL}/clients/${clientId}/orders`);
        if (!res.ok) throw new Error('Failed to fetch client orders');
        const data = await res.json();
        return data.map((o: any) => this._mapOrder(o));
    },

    async getClients(): Promise<Client[]> {
        const res = await fetch(`${API_URL}/clients`);
        if (!res.ok) throw new Error('Failed to fetch clients');
        return res.json();
    },

    async createClickInvoice(orderId: string | number, amount: number, returnUrl: string): Promise<any> {
        const res = await fetch(`${API_URL}/payments/create-click-invoice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderId, amount: Math.round(amount), return_url: returnUrl }),
        });
        if (!res.ok) throw new Error('Failed to create Click invoice');
        return res.json();
    },

    async createPaymeInvoice(orderId: string | number, amount: number, returnUrl: string): Promise<any> {
        const res = await fetch(`${API_URL}/payments/create-payme-invoice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderId, amount: Math.round(amount), return_url: returnUrl }),
        });
        if (!res.ok) throw new Error('Failed to create Payme invoice');
        return res.json();
    },

    async searchClients(query: string): Promise<Client[]> {
        const res = await fetch(`${API_URL}/clients/search?q=${query}`);
        // If not implemented on backend, we might fallback to getClients and filter, but let's assume valid endpoint or just fetch all
        // For now fetch all and filter client side if needed or assume backend search.
        // Actually, backend might not have /clients/search. Let's stick to getClients for now and filter.
        // Wait, common pattern.
        return this.getClients().then(clients =>
            clients.filter(c =>
                c.first_name.toLowerCase().includes(query.toLowerCase()) ||
                (c.phone_number && c.phone_number.includes(query))
            )
        );
    },

    async createClient(client: ClientCreate): Promise<Client> {
        // Backend expects /api/user or specific endpoint?
        // User router usually has create.
        const res = await fetch(`${API_URL}/clients/offline`, { // We might need a specific endpoint or use generic user creation
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(client),
        });
        if (!res.ok) throw new Error('Failed to create client');
        return res.json();
    },

    async createOrder(order: OrderCreate): Promise<Order> {
        console.log("Sending order data:", JSON.stringify(order, null, 2));
        const res = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order),
        });
        if (!res.ok) {
            const error = await res.text();
            throw new Error(`Failed to create order: ${error}`);
        }
        return res.json();
    },

    // Employees
    async getEmployees(): Promise<Employee[]> {
        const res = await fetch(`${API_URL}/employees`);
        if (!res.ok) throw new Error('Failed to fetch employees');
        return res.json();
    },

    async createEmployee(employee: EmployeeCreate): Promise<Employee> {
        const res = await fetch(`${API_URL}/employees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employee),
        });
        if (!res.ok) throw new Error('Failed to create employee');
        return res.json();
    },

    async updateEmployee(id: number, employee: EmployeeUpdate): Promise<Employee> {
        const res = await fetch(`${API_URL}/employees/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employee),
        });
        if (!res.ok) throw new Error('Failed to update employee');
        return res.json();
    },

    async deleteEmployee(id: number): Promise<void> {
        const res = await fetch(`${API_URL}/employees/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete employee');
    },

    // Calendar & Family
    async getCalendarData(telegramId: number): Promise<CalendarDataResponse> {
        const res = await fetch(`${API_URL}/calendar/${telegramId}`);
        if (!res.ok) throw new Error('Failed to fetch calendar data');
        return res.json();
    },

    async getAllCalendarData(): Promise<CalendarDataResponse> {
        const res = await fetch(`${API_URL}/calendar/all/global`);
        if (!res.ok) throw new Error('Failed to fetch global calendar data');
        return res.json();
    },

    async createFamilyMember(telegramId: number, member: any): Promise<FamilyMember> {
        const res = await fetch(`${API_URL}/calendar/${telegramId}/family`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(member),
        });
        if (!res.ok) throw new Error('Failed to create family member');
        return res.json();
    },

    async deleteFamilyMember(telegramId: number, memberId: number): Promise<void> {
        const res = await fetch(`${API_URL}/calendar/${telegramId}/family/${memberId}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete family member');
    },

    async createEvent(telegramId: number, event: any): Promise<CalendarEvent> {
        const res = await fetch(`${API_URL}/calendar/${telegramId}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
        });
        if (!res.ok) throw new Error('Failed to create event');
        return res.json();
    },

    async deleteEvent(telegramId: number, eventId: number | string): Promise<void> {
        const res = await fetch(`${API_URL}/calendar/${telegramId}/events/${eventId}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete event');
    },

    async deleteClient(id: number): Promise<void> {
        const res = await fetch(`${API_URL}/clients/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete client');
    },

    async broadcastMessage(text: string, filterType: 'all' | 'purchased' | 'leads'): Promise<{ total: number; success: number; failed: number }> {
        const res = await fetch(`${API_URL}/clients/broadcast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, filter_type: filterType }),
        });
        if (!res.ok) throw new Error('Failed to send broadcast');
        return res.json();
    },

    // Stories
    async getStories(): Promise<Story[]> {
        const res = await fetch(`${API_URL}/stories/`);
        if (!res.ok) throw new Error('Failed to fetch stories');
        return res.json();
    },

    async createStory(story: StoryCreate): Promise<Story> {
        const res = await fetch(`${API_URL}/stories/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(story),
        });
        if (!res.ok) throw new Error('Failed to create story');
        return res.json();
    },

    async updateStory(id: number, story: StoryUpdate): Promise<Story> {
        const res = await fetch(`${API_URL}/stories/${id}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(story),
        });
        if (!res.ok) throw new Error('Failed to update story');
        return res.json();
    },

    async deleteStory(id: number): Promise<void> {
        const res = await fetch(`${API_URL}/stories/${id}/`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete story');
    },

    async getStoryStats(id: number): Promise<StoryStats> {
        const res = await fetch(`${API_URL}/stories/${id}/stats/`);
        if (!res.ok) throw new Error('Failed to fetch story stats');
        return res.json();
    },

    async logStoryView(id: number, userId: number): Promise<void> {
        const res = await fetch(`${API_URL}/stories/${id}/view/${userId}`, {
            method: 'POST'
        });
        if (!res.ok) throw new Error('Failed to log story view');
    },

    // Banners
    async getBanners(activeOnly = false): Promise<Banner[]> {
        const res = await fetch(`${API_URL}/banners?active_only=${activeOnly}`);
        if (!res.ok) throw new Error('Failed to fetch banners');
        return res.json();
    },

    async createBanner(data: BannerCreate): Promise<Banner> {
        const res = await fetch(`${API_URL}/banners/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create banner');
        return res.json();
    },

    async updateBanner(id: number, data: BannerUpdate): Promise<Banner> {
        const res = await fetch(`${API_URL}/banners/${id}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update banner');
        return res.json();
    },

    async deleteBanner(id: number): Promise<void> {
        const res = await fetch(`${API_URL}/banners/${id}/`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete banner');
    },

    // Wow Effects
    async getWowEffects(): Promise<WowEffect[]> {
        const res = await fetch(`${API_URL}/wow-effects/`);
        if (!res.ok) throw new Error('Failed to fetch wow effects');
        return res.json();
    },

    async createWowEffect(data: WowEffectCreate): Promise<WowEffect> {
        const res = await fetch(`${API_URL}/wow-effects/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create wow effect');
        return res.json();
    },

    async updateWowEffect(id: number, data: WowEffectUpdate): Promise<WowEffect> {
        const res = await fetch(`${API_URL}/wow-effects/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update wow effect');
        return res.json();
    },

    async deleteWowEffect(id: number): Promise<void> {
        const res = await fetch(`${API_URL}/wow-effects/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete wow effect');
    },
};

export type Employee = {
    id: number;
    telegram_id: number;
    full_name: string;
    username?: string;
    role: string;
    photo_url?: string;
    is_active: boolean;
    created_at: string;
};

export type EmployeeCreate = {
    telegram_id: number;
    full_name: string;
    username?: string;
    role: string;
    photo_url?: string;
    is_active?: boolean;
};

export type EmployeeUpdate = Partial<EmployeeCreate>;

export type Client = {
    id: number;
    telegram_id: number;
    first_name: string;
    username?: string;
    photo_url?: string;
    phone_number?: string;
    birth_date?: string; // New field
    created_at: string;
    orders_count: number;
    total_spent: number;
};

export type ClientCreate = {
    first_name: string;
    phone_number?: string;
    birth_date?: string;
    telegram_id?: number | null; // Optional/Null for offline
};

export type OrderCreate = {
    user_id?: number; // Optional if guest, but for offline user we will have ID
    items: any;
    total_price: number;
    customer_name?: string;
    customer_phone?: string;
    status?: string; // 'done' by default for offline
    payment_method?: string; // 'cash', 'card'
    comment?: string;
    extras?: any;
};

export type FamilyMember = {
    id: number;
    user_id: number;
    name: string;
    relation: string;
    birthday: string | null;
    image: string;
    created_at: string;
    user?: {
        id: number;
        first_name: string;
        username?: string;
        phone_number?: string;
        photo_url?: string;
    };
};

export type CalendarEvent = {
    id: number | string;
    user_id: number;
    family_member_id: number | null;
    title: string;
    date: string;
    type: string;
    created_at: string;
    user?: {
        id: number;
        first_name: string;
        username?: string;
        phone_number?: string;
        photo_url?: string;
    };
};

export type CalendarDataResponse = {
    family: FamilyMember[];
    events: CalendarEvent[];
};

export type Story = {
    id: number;
    title: string;
    thumbnail_url: string;
    content_url: string;
    content_type: 'image' | 'video';
    bg_color: string;
    is_active: boolean;
    views_count: number;
    created_at: string;
};

export type StoryCreate = Omit<Story, 'id' | 'created_at' | 'views_count'>;
export type StoryUpdate = Partial<StoryCreate>;

export type StoryStats = {
    id: number;
    title: string;
    views_count: number;
    viewers: {
        user_id: number;
        user_name: string;
        user_photo?: string;
        viewed_at: string;
    }[];
};

export type Banner = {
    id: number;
    title: string;
    subtitle: string;
    button_text: string;
    bg_color: string;
    image_url?: string;
    link?: string;

    title_color?: string;
    subtitle_color?: string;
    button_text_color?: string;
    button_bg_color?: string;

    sort_order: number;
    is_active: boolean;
};

export type BannerCreate = Omit<Banner, 'id'>;
export type BannerUpdate = Partial<BannerCreate>;
