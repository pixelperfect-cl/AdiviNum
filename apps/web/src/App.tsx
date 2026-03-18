import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { PlayPage } from './pages/PlayPage';
import { GamePage } from './pages/GamePage';
import { RankingPage } from './pages/RankingPage';
import { ProfilePage } from './pages/ProfilePage';
import { HistoryPage } from './pages/HistoryPage';
import { SpectatePage } from './pages/SpectatePage';
import { AchievementsPage } from './pages/AchievementsPage';
import { FriendsPage } from './pages/FriendsPage';
import { ChangelogPage } from './pages/ChangelogPage';
import { OnboardingTutorial } from './components/OnboardingTutorial';
import { useUserStore } from './stores/userStore';
import { ConnectionStatus } from './components/ConnectionStatus';
import { I18nProvider } from './i18n/i18n';
import './index.css';

function AuthenticatedApp() {

    return (
        <Routes>
            <Route path="/game" element={<GamePage />} />
            <Route path="*" element={
                <>
                <Layout>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/play" element={<PlayPage />} />
                        <Route path="/ranking" element={<RankingPage />} />
                        <Route path="/history" element={<HistoryPage />} />
                        <Route path="/spectate" element={<SpectatePage />} />
                        <Route path="/achievements" element={<AchievementsPage />} />
                        <Route path="/friends" element={<FriendsPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/changelog" element={<ChangelogPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Layout>
                <OnboardingTutorial />
                </>
            } />
        </Routes>
    );
}

function App() {
    const { isAuthenticated, initAuthListener } = useUserStore();

    useEffect(() => {
        const unsubscribe = initAuthListener();
        return () => unsubscribe();
    }, [initAuthListener]);

    return (
        <I18nProvider>
        <BrowserRouter>
            <ConnectionStatus />
            {isAuthenticated ? (
                <AuthenticatedApp />
            ) : (
                <Routes>
                    <Route path="*" element={<LoginPage />} />
                </Routes>
            )}
        </BrowserRouter>
        </I18nProvider>
    );
}

export default App;
