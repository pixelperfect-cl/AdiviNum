/**
 * AdiviNum — Design System Constants
 */
export const Colors = {
    // Core palette
    background: '#0A0E1A',
    backgroundLight: '#111827',
    surface: '#1A1F2E',
    surfaceLight: '#242A3D',
    surfaceHover: '#2D3548',

    // Text
    textPrimary: '#F1F5F9',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',

    // Accent / Brand
    primary: '#FFD700',        // Gold — main brand color
    primaryDark: '#B8960E',
    secondary: '#6366F1',      // Indigo
    secondaryLight: '#818CF8',

    // Game states
    fama: '#FFD700',           // Gold for Famas
    toque: '#3B82F6',          // Blue for Toques
    miss: '#374151',           // Dark gray for misses

    // Status
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    // Borders
    border: '#1E293B',
    borderLight: '#334155',

    // Level colors
    levelColors: [
        '#9E9E9E', // 1 Gris
        '#64B5F6', // 2 Azul claro
        '#1565C0', // 3 Azul oscuro
        '#4CAF50', // 4 Verde
        '#FFEB3B', // 5 Amarillo
        '#FF9800', // 6 Naranja
        '#F44336', // 7 Rojo
        '#E91E63', // 8 Fucsia
        '#9C27B0', // 9 Morado
        '#FFD700', // 10 Dorado
    ] as const,
} as const;

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
} as const;

export const FontSize = {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
    xxxl: 36,
    display: 48,
} as const;

export const BorderRadius = {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    full: 9999,
} as const;

export const API_URL = __DEV__
    ? 'http://localhost:3000'
    : 'https://api.adivinum.com';

export const WS_URL = __DEV__
    ? 'http://localhost:3000/game'
    : 'https://api.adivinum.com/game';
