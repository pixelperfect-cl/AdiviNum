const API_BASE = import.meta.env.PROD
    ? '/api'
    : (import.meta.env.VITE_API_URL || 'http://localhost:3000/api');

import { supabase } from '../lib/supabaseClient';

export function clearDevUser() {
    // Left empty to prevent breaking imports
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (localStorage.getItem('DEV_TOKEN')) {
        headers['x-dev-user'] = localStorage.getItem('x-dev-user') || 'player';
    } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
        }
    }

    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            ...headers,
            ...options.headers,
        },
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(error.message || `API Error: ${res.status}`);
    }

    const text = await res.text();
    if (!text) return null as T;
    return JSON.parse(text);
}

export const api = {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body?: unknown) =>
        request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
    patch: <T>(path: string, body?: unknown) =>
        request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
    delete: <T>(path: string) =>
        request<T>(path, { method: 'DELETE' }),
};

export const tournamentApi = {
    getTournaments: (params?: { schedule?: string; status?: string }) => {
        const query = new URLSearchParams();
        if (params?.schedule) query.set('schedule', params.schedule);
        if (params?.status) query.set('status', params.status);
        const qs = query.toString();
        return api.get<any[]>(`/tournament${qs ? `?${qs}` : ''}`);
    },
    register: (id: string, userId: string) => api.post(`/tournament/${id}/register`, { userId }),
};

export { API_BASE };
