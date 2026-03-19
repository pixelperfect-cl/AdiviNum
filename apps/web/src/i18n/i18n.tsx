import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

// ---- Supported languages ----
export type Locale = 'es' | 'en';

// ---- Translation dictionary type ----
type TranslationDict = Record<string, string>;
type Translations = Record<Locale, TranslationDict>;

// ---- Translations ----
const translations: Translations = {
    es: {
        // Navigation
        'nav.home': 'Inicio',
        'nav.play': 'Jugar',
        'nav.ranking': 'Ranking',
        'nav.history': 'Historial',
        'nav.spectate': 'Observar',
        'nav.achievements': 'Logros',
        'nav.friends': 'Amigos',
        'nav.profile': 'Perfil',
        'nav.tournaments': 'Torneos',

        // Home
        'home.welcome': 'Bienvenido',
        'home.quickPlay': 'Jugar Ahora',
        'home.stats': 'Estadísticas',
        'home.recentMatches': 'Partidas Recientes',

        // Play
        'play.matchmaking': 'Matchmaking',
        'play.tournament': 'Torneos',
        'play.practice': 'Práctica',
        'play.findMatch': 'Buscar Partida',
        'play.searching': 'Buscando rival...',
        'play.cancel': 'Cancelar',
        'play.level': 'Nivel',
        'play.bet': 'Apuesta',

        // Game
        'game.yourTurn': 'Tu turno',
        'game.opponentTurn': 'Turno del rival',
        'game.secret': 'Elige tu número secreto',
        'game.guess': 'Adivina el número',
        'game.submit': 'Enviar',
        'game.famas': 'Famas',
        'game.toques': 'Toques',
        'game.timeLeft': 'Tiempo restante',
        'game.victory': '¡Victoria!',
        'game.defeat': 'Derrota',
        'game.draw': 'Empate',
        'game.rematch': 'Revancha',
        'game.backToMenu': 'Volver al menú',
        'game.waiting': 'Esperando al rival...',

        // History
        'history.title': 'Historial de Partidas',
        'history.total': 'Total',
        'history.wins': 'Victorias',
        'history.losses': 'Derrotas',
        'history.winRate': 'Win Rate',
        'history.noMatches': 'Aún no has jugado ninguna partida.',
        'history.attempts': 'intentos',
        'history.abandon': 'Abandono',
        'history.timeout': 'Tiempo agotado',

        // Profile
        'profile.personalData': 'Datos Personales',
        'profile.statistics': 'Estadísticas',
        'profile.wallet': 'Billetera',
        'profile.achievements': 'Logros',
        'profile.save': 'Guardar',
        'profile.username': 'Nombre de usuario',

        // Friends
        'friends.title': 'Amigos',
        'friends.pending': 'Pendientes',
        'friends.search': 'Buscar',
        'friends.addFriend': 'Agregar Amigo',
        'friends.removeFriend': 'Eliminar',
        'friends.accept': 'Aceptar',
        'friends.reject': 'Rechazar',
        'friends.challenge': 'Retar',
        'friends.noFriends': 'Aún no tienes amigos.',
        'friends.searchPlaceholder': 'Buscar jugadores...',

        // Tournament
        'tournament.register': 'Inscribirse',
        'tournament.bracket': 'Bracket',
        'tournament.prizePool': 'Pozo de premios',
        'tournament.players': 'Jugadores',
        'tournament.startsAt': 'Comienza a las',
        'tournament.final': 'Final',
        'tournament.semifinal': 'Semifinal',
        'tournament.quarters': 'Cuartos',

        // League
        'league.season': 'Temporada',
        'league.remaining': 'Restante',
        'league.reward': 'Recompensa',
        'league.promotion': '¡Ascenso!',
        'league.demotion': 'Descenso',

        // General
        'general.loading': 'Cargando...',
        'general.error': 'Error',
        'general.retry': 'Reintentar',
        'general.close': 'Cerrar',
        'general.confirm': 'Confirmar',
        'general.cancel': 'Cancelar',
        'general.yes': 'Sí',
        'general.no': 'No',
        'general.vs': 'vs',
    },

    en: {
        // Navigation
        'nav.home': 'Home',
        'nav.play': 'Play',
        'nav.ranking': 'Ranking',
        'nav.history': 'History',
        'nav.spectate': 'Spectate',
        'nav.achievements': 'Achievements',
        'nav.friends': 'Friends',
        'nav.profile': 'Profile',
        'nav.tournaments': 'Tournaments',

        // Home
        'home.welcome': 'Welcome',
        'home.quickPlay': 'Quick Play',
        'home.stats': 'Statistics',
        'home.recentMatches': 'Recent Matches',

        // Play
        'play.matchmaking': 'Matchmaking',
        'play.tournament': 'Tournaments',
        'play.practice': 'Practice',
        'play.findMatch': 'Find Match',
        'play.searching': 'Searching for opponent...',
        'play.cancel': 'Cancel',
        'play.level': 'Level',
        'play.bet': 'Bet',

        // Game
        'game.yourTurn': 'Your turn',
        'game.opponentTurn': "Opponent's turn",
        'game.secret': 'Choose your secret number',
        'game.guess': 'Guess the number',
        'game.submit': 'Submit',
        'game.famas': 'Bulls',
        'game.toques': 'Cows',
        'game.timeLeft': 'Time left',
        'game.victory': 'Victory!',
        'game.defeat': 'Defeat',
        'game.draw': 'Draw',
        'game.rematch': 'Rematch',
        'game.backToMenu': 'Back to menu',
        'game.waiting': 'Waiting for opponent...',

        // History
        'history.title': 'Match History',
        'history.total': 'Total',
        'history.wins': 'Wins',
        'history.losses': 'Losses',
        'history.winRate': 'Win Rate',
        'history.noMatches': "You haven't played any matches yet.",
        'history.attempts': 'attempts',
        'history.abandon': 'Abandoned',
        'history.timeout': 'Timed out',

        // Profile
        'profile.personalData': 'Personal Data',
        'profile.statistics': 'Statistics',
        'profile.wallet': 'Wallet',
        'profile.achievements': 'Achievements',
        'profile.save': 'Save',
        'profile.username': 'Username',

        // Friends
        'friends.title': 'Friends',
        'friends.pending': 'Pending',
        'friends.search': 'Search',
        'friends.addFriend': 'Add Friend',
        'friends.removeFriend': 'Remove',
        'friends.accept': 'Accept',
        'friends.reject': 'Reject',
        'friends.challenge': 'Challenge',
        'friends.noFriends': "You don't have any friends yet.",
        'friends.searchPlaceholder': 'Search players...',

        // Tournament
        'tournament.register': 'Register',
        'tournament.bracket': 'Bracket',
        'tournament.prizePool': 'Prize Pool',
        'tournament.players': 'Players',
        'tournament.startsAt': 'Starts at',
        'tournament.final': 'Final',
        'tournament.semifinal': 'Semifinal',
        'tournament.quarters': 'Quarterfinals',

        // League
        'league.season': 'Season',
        'league.remaining': 'Remaining',
        'league.reward': 'Reward',
        'league.promotion': 'Promoted!',
        'league.demotion': 'Demoted',

        // General
        'general.loading': 'Loading...',
        'general.error': 'Error',
        'general.retry': 'Retry',
        'general.close': 'Close',
        'general.confirm': 'Confirm',
        'general.cancel': 'Cancel',
        'general.yes': 'Yes',
        'general.no': 'No',
        'general.vs': 'vs',
    },
};

// ---- i18n Context ----

interface I18nContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType>({
    locale: 'es',
    setLocale: () => {},
    t: (key) => key,
});

// ---- Storage key ----
const STORAGE_KEY = 'adivinum_locale';

// ---- Provider ----

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(() => {
        const saved = localStorage.getItem(STORAGE_KEY) as Locale;
        if (saved && translations[saved]) return saved;
        // Auto-detect from browser
        const browserLang = navigator.language.split('-')[0];
        return browserLang === 'en' ? 'en' : 'es';
    });

    const setLocale = useCallback((newLocale: Locale) => {
        setLocaleState(newLocale);
        localStorage.setItem(STORAGE_KEY, newLocale);
        document.documentElement.lang = newLocale;
    }, []);

    useEffect(() => {
        document.documentElement.lang = locale;
    }, [locale]);

    const t = useCallback((key: string, params?: Record<string, string | number>): string => {
        let text = translations[locale]?.[key] || translations['es']?.[key] || key;
        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                text = text.replace(`{${k}}`, String(v));
            });
        }
        return text;
    }, [locale]);

    return (
        <I18nContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </I18nContext.Provider>
    );
}

// ---- Hook ----

export function useI18n() {
    return useContext(I18nContext);
}

// ---- Available languages for UI ----

export const AVAILABLE_LOCALES: { code: Locale; label: string; flag: string }[] = [
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
];
