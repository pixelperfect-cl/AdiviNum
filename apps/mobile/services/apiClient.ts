import { API_URL } from '@/constants/theme';
import { getIdToken } from './supabaseAuth';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * API client with automatic Supabase token injection
 */
async function request<T>(
    path: string,
    method: HttpMethod = 'GET',
    body?: object,
): Promise<T> {
    const token = await getIdToken();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
}

export const api = {
    // Auth
    register: (data: { email: string; username: string }) =>
        request('/auth/register', 'POST', data),

    login: () =>
        request<{ user: any; wallet: any }>('/auth/login', 'POST'),

    // User
    getProfile: (userId: string) =>
        request(`/users/${userId}/profile`),

    getStats: (userId: string) =>
        request(`/users/${userId}/stats`),

    // Wallet
    getWallet: (userId: string) =>
        request(`/wallet/${userId}`),

    getTransactions: (userId: string) =>
        request(`/wallet/${userId}/transactions`),

    deposit: (userId: string, amount: number, currencyType: string) =>
        request(`/wallet/${userId}/deposit`, 'POST', { amount, currencyType }),

    // Payment
    createDeposit: (data: { userId: string; amount: number; gateway: string }) =>
        request('/payment/deposit', 'POST', data),

    requestWithdrawal: (data: any) =>
        request('/payment/withdraw', 'POST', data),

    // Ranking
    getGlobalRanking: (limit = 100) =>
        request(`/ranking/global?limit=${limit}`),

    getCountryRanking: (country: string) =>
        request(`/ranking/country/${country}`),

    // Referral
    getReferralCode: (userId: string) =>
        request<{ code: string }>(`/referral/${userId}/code`),

    applyReferralCode: (userId: string, code: string) =>
        request('/referral/apply', 'POST', { userId, code }),

    getReferralStats: (userId: string) =>
        request(`/referral/${userId}/stats`),

    // Push Notifications
    updatePushToken: (userId: string, token: string) =>
        request(`/users/${userId}/push-token`, 'POST', { token }),

    // Tournaments
    listTournaments: () =>
        request('/tournament'),

    getTournament: (id: string) =>
        request(`/tournament/${id}`),

    registerForTournament: (tournamentId: string, userId: string) =>
        request(`/tournament/${tournamentId}/register`, 'POST', { userId }),
};
