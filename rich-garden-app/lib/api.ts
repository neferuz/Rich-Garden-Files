export const API_URL = '/api';

export type Order = {
    id: number;
    user_id: number;
    customer_name: string;
    customer_phone: string;
    total_price: number;
    status: string;
    items: string; // JSON string
    address?: string;
    comment?: string;
    payment_method?: string;
    extras?: string; // JSON string
    created_at: string;
};

export type Product = {
    id: number;
    name: string;
    category: string;
    price_display: string;
    price_raw: number;
    image: string;
    images?: string; // JSON string
    rating: number;
    is_hit: boolean;
    is_new: boolean;
    description?: string;
    composition?: string;
    is_ingredient?: boolean;
    stock_quantity: number;
};

export type OrderCreate = {
    customer_name: string;
    customer_phone: string;
    total_price: number;
    items: string; // JSON string
    telegram_id?: number;
    address?: string;
    comment?: string;
    payment_method?: string;
    extras?: string; // JSON string
};

export type TelegramUser = {
    telegram_id: number;
    first_name: string;
    username?: string;
    photo_url?: string;
    phone_number?: string;
};

export type Address = {
    id: number;
    title: string;
    address: string;
    info?: string;
};

export type CalendarEvent = {
    id: number | string;
    title: string;
    date: Date;
    type: 'birthday' | 'anniversary' | 'family' | 'other';
    family_member_id?: number;
};

export type FamilyMember = {
    id: number;
    name: string;
    relation: string;
    birthday?: string;
    image: string;
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

export const api = {
    async getProducts(category?: string, search?: string): Promise<Product[]> {
        const query = new URLSearchParams();
        if (category) query.append('category', category);
        if (search) query.append('search', search);

        const res = await fetch(`${API_URL}/products?${query.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
    },

    async getProduct(id: string): Promise<Product> {
        const res = await fetch(`${API_URL}/products/${id}`);
        if (!res.ok) throw new Error('Failed to fetch product');
        return res.json();
    },

    async createOrder(order: OrderCreate): Promise<Order> {
        const res = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order),
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Failed to create order:', res.status, errorText);
            throw new Error(`Failed to create order: ${res.status} ${errorText}`);
        }
        return res.json();
    },

    async deleteOrder(orderId: number) {
        await fetch(`${API_URL}/orders/${orderId}`, { method: 'DELETE' });
    },

    async authTelegram(user: TelegramUser) {
        const res = await fetch(`${API_URL}/auth/telegram`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user),
        });
        if (!res.ok) return null;
        return res.json();
    },

    async getRecentlyViewed(telegramId: number): Promise<Product[]> {
        const res = await fetch(`${API_URL}/user/${telegramId}/recent`);
        if (!res.ok) return [];
        return res.json();
    },

    async addRecentlyViewed(telegramId: number, productId: number) {
        await fetch(`${API_URL}/user/${telegramId}/recent/${productId}`, {
            method: 'POST'
        });
    },

    async getPopularSearches(): Promise<{ tags: string[], products: Product[] }> {
        const res = await fetch(`${API_URL}/search/popular`);
        if (!res.ok) return { tags: [], products: [] };
        return res.json();
    },

    async createAddress(telegramId: number, address: { title: string, address: string, info?: string }): Promise<Address | null> {
        const res = await fetch(`${API_URL}/user/${telegramId}/addresses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(address),
        });
        if (!res.ok) return null;
        return res.json();
    },

    async getAddresses(telegramId: number): Promise<Address[]> {
        const res = await fetch(`${API_URL}/user/${telegramId}/addresses`, { cache: 'no-store' });
        if (!res.ok) return [];
        return res.json();
    },

    async getUser(telegramId: number): Promise<TelegramUser | null> {
        const res = await fetch(`${API_URL}/user/${telegramId}`, { cache: 'no-store' });
        if (!res.ok) return null;
        return res.json();
    },

    async getUserOrders(telegramId: number): Promise<Order[]> {
        const res = await fetch(`${API_URL}/user/${telegramId}/orders`, { cache: 'no-store' });
        if (!res.ok) return [];
        return res.json();
    },

    async getCalendarData(telegramId: number): Promise<{ family: FamilyMember[], events: CalendarEvent[] }> {
        const res = await fetch(`${API_URL}/calendar/${telegramId}`);
        if (!res.ok) return { family: [], events: [] };
        const data = await res.json();
        // Convert ISO date strings back to Date objects
        return {
            family: data.family,
            events: data.events.map((e: any) => ({
                ...e,
                date: new Date(e.date)
            }))
        };
    },

    async createFamilyMember(telegramId: number, member: Omit<FamilyMember, 'id'>): Promise<FamilyMember | null> {
        const res = await fetch(`${API_URL}/calendar/${telegramId}/family`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(member),
        });
        if (!res.ok) return null;
        return res.json();
    },

    async deleteFamilyMember(telegramId: number, memberId: number) {
        const res = await fetch(`${API_URL}/calendar/${telegramId}/family/${memberId}`, {
            method: 'DELETE'
        });
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Failed to delete family member: ${res.status} ${errorText}`);
        }
    },

    async createEvent(telegramId: number, event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent | null> {
        // Use local date parts to avoid timezone shifts from toISOString()
        const dateStr = typeof event.date === 'string' ? event.date : `${event.date.getFullYear()}-${String(event.date.getMonth() + 1).padStart(2, '0')}-${String(event.date.getDate()).padStart(2, '0')}`;

        const res = await fetch(`${API_URL}/calendar/${telegramId}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...event,
                date: dateStr
            }),
        });
        if (!res.ok) {
            console.error('Failed to create event:', await res.text());
            return null;
        }
        const data = await res.json();
        return { ...data, date: new Date(data.date) };
    },

    async deleteEvent(telegramId: number, eventId: number | string) {
        const res = await fetch(`${API_URL}/calendar/${telegramId}/events/${eventId}`, {
            method: 'DELETE'
        });
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Failed to delete event: ${res.status} ${errorText}`);
        }
    },

    async getStories(userId?: number): Promise<Story[]> {
        const url = userId ? `${API_URL}/stories/?user_id=${userId}` : `${API_URL}/stories/`;
        const res = await fetch(url);
        if (!res.ok) return [];
        return res.json();
    },

    async logStoryView(storyId: number, userId: number): Promise<void> {
        await fetch(`${API_URL}/stories/${storyId}/view/${userId}/`, {
            method: 'POST'
        });
    },

    async getBanners(): Promise<Banner[]> {
        const res = await fetch(`${API_URL}/banners?active_only=true`, { cache: 'no-store' });
        if (!res.ok) return [];
        return res.json();
    },

    async createClickInvoice(orderId: number, amount: number, returnUrl: string, phoneNumber?: string | null, telegramId?: number | null) {
        const body: { order_id: number; amount: number; return_url: string; phone_number?: string; telegram_id?: number } = {
            order_id: orderId,
            amount: amount,
            return_url: returnUrl
        };
        if (phoneNumber && phoneNumber.replace(/\D/g, '').length >= 9) {
            body.phone_number = phoneNumber;
        }
        if (telegramId) {
            body.telegram_id = telegramId;
        }
        const res = await fetch(`${API_URL}/payments/create-click-invoice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Failed to create click invoice', errorText);
            try {
                const json = JSON.parse(errorText);
                return { error: json.detail || "Unknown error" };
            } catch (e) {
                return { error: errorText };
            }
        }
        return res.json();
    },

    /** Merchant API (web): редирект на checkout.paycom.uz */
    async createPaymeInvoice(orderId: number, amount: number, returnUrl: string) {
        const res = await fetch(`${API_URL}/payments/create-payme-invoice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                order_id: orderId,
                amount: amount,
                return_url: returnUrl
            }),
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Failed to create payme invoice', errorText);
            try {
                const json = JSON.parse(errorText);
                if (json.detail) {
                    if (typeof json.detail === 'object' && json.detail.error) {
                        return {
                            error: json.detail.error,
                            error_code: json.detail.error_code,
                            error_type: json.detail.error_type,
                            suggestion: json.detail.suggestion
                        };
                    }
                    return { error: json.detail };
                }
                return { error: json.error || "Unknown error" };
            } catch (e) {
                return { error: errorText };
            }
        }
        return res.json();
    },

    /** Subscribe API (Mini App): receipts.create + receipts.send, без редиректа. Оплата в приложении Payme. */
    async createPaymeReceipt(orderId: number, phoneNumber?: string) {
        const body: { order_id: number; phone_number?: string } = { order_id: orderId };
        if (phoneNumber && phoneNumber.replace(/\D/g, '').length >= 9) {
            body.phone_number = phoneNumber;
        }
        const res = await fetch(`${API_URL}/payments/create-payme-receipt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Failed to create payme receipt', errorText);
            try {
                const json = JSON.parse(errorText);
                if (json.detail) {
                    if (typeof json.detail === 'object' && json.detail.error) {
                        return {
                            error: json.detail.error,
                            error_code: json.detail.error_code,
                            error_type: json.detail.error_type,
                        };
                    }
                    return { error: json.detail };
                }
                return { error: json.error || errorText };
            } catch (e) {
                return { error: errorText };
            }
        }
        return res.json();
    },

    /** Subscribe API: проверка статуса чека. paid === true — оплата прошла. */
    async getPaymeReceiptStatus(receiptId: string): Promise<{ status: string; paid: boolean; state?: number; error?: string }> {
        const res = await fetch(`${API_URL}/payments/payme-receipt-status/${encodeURIComponent(receiptId)}`);
        if (!res.ok) return { status: 'error', paid: false, error: await res.text() };
        return res.json();
    },

    async getWowEffects(): Promise<WowEffect[]> {
        const res = await fetch(`${API_URL}/wow-effects/`);
        if (!res.ok) return [];
        return res.json();
    }
};

export type Story = {
    id: number;
    title: string;
    thumbnail_url: string;
    content_url: string;
    content_type: 'image' | 'video';
    bg_color: string;
    views_count: number;
    is_viewed_by_me: boolean;
    created_at: string;
}

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
