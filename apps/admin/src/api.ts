import { supabase } from './lib/supabaseClient';

const API_BASE = '/api';

async function request<T>(path: string, method = 'GET', body?: object): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    
    // Check if we have a dev token
    if (localStorage.getItem('DEV_TOKEN')) {
        headers['x-dev-user'] = localStorage.getItem('x-dev-user') || 'admin';
    } else {
        // Check if we have a Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
        }
    }

    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
    }

    return res.json();
}

export const adminApi = {
    // Dashboard
    getDashboard: () => request<any>('/admin/dashboard'),

    // Users
    getUsers: () => request<any[]>('/admin/users'),
    banUser: (userId: string) => request(`/admin/users/${userId}/ban`, 'POST'),
    unbanUser: (userId: string) => request(`/admin/users/${userId}/unban`, 'POST'),

    // Matches
    getMatches: (limit = 50) => request<any[]>(`/admin/matches?limit=${limit}`),

    // Withdrawals
    getWithdrawals: () => request<any[]>('/admin/withdrawals'),
    approveWithdrawal: (id: string) => request(`/admin/withdrawals/${id}/approve`, 'POST'),
    rejectWithdrawal: (id: string) => request(`/admin/withdrawals/${id}/reject`, 'POST'),

    // Tournaments
    getTournaments: () => request<any[]>('/tournament'),
    createTournament: (data: any) => request('/tournament', 'POST', data),
    startTournament: (id: string) => request(`/tournament/${id}/start`, 'POST'),
};
