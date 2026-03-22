import { supabase } from './lib/supabaseClient';

const API_BASE = import.meta.env.PROD 
    ? 'https://phpstack-1279051-6287800.cloudwaysapps.com/api' 
    : '/api';

async function request<T>(path: string, method = 'GET', body?: object): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    
    if (localStorage.getItem('DEV_TOKEN')) {
        headers['x-dev-user'] = localStorage.getItem('x-dev-user') || 'admin';
    } else {
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
    getUsers: () => request<any>('/admin/users'),
    banUser: (userId: string) => request(`/admin/users/${userId}/ban`, 'POST'),
    unbanUser: (userId: string) => request(`/admin/users/${userId}/unban`, 'POST'),
    adjustWallet: (userId: string, data: { amount: number; currencyType: string; reason: string }) =>
        request(`/admin/users/${userId}/wallet`, 'POST', data),
    updateLevel: (userId: string, data: { level: number; resetXp?: boolean }) =>
        request(`/admin/users/${userId}/level`, 'POST', data),
    updateUserConfig: (userId: string, data: { isPremium?: boolean }) =>
        request(`/admin/users/${userId}/config`, 'POST', data),

    // Matches
    getMatches: (limit = 50) => request<any>(`/admin/matches?limit=${limit}`),

    // Withdrawals
    getWithdrawals: () => request<any[]>('/admin/withdrawals'),
    approveWithdrawal: (id: string) => request(`/admin/withdrawals/${id}/approve`, 'POST'),
    rejectWithdrawal: (id: string) => request(`/admin/withdrawals/${id}/reject`, 'POST'),

    // Tournaments
    getTournaments: () => request<any[]>('/tournament'),
    createTournament: (data: any) => request('/tournament', 'POST', data),
    startTournament: (id: string) => request(`/tournament/${id}/start`, 'POST'),

    // Achievements
    getAchievements: () => request<any[]>('/admin/achievements'),
    createAchievement: (data: any) => request('/admin/achievements', 'POST', data),
    updateAchievement: (id: string, data: any) => request(`/admin/achievements/${id}`, 'PUT', data),
    deleteAchievement: (id: string) => request(`/admin/achievements/${id}`, 'DELETE'),

    // Settings
    getSettings: () => request<any[]>('/admin/settings'),
    updateSetting: (key: string, value: string) => request(`/admin/settings/${key}`, 'PUT', { value }),
};
