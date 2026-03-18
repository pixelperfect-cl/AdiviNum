import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Login({ onLogin }: { onLogin: () => void }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        
        setIsLoading(false);
        if (authError) {
            setError(authError.message);
        } else {
            onLogin();
        }
    };

    const handleDevLogin = async () => {
        setIsLoading(true);
        setError('');

        // Activa el modo bypass local
        localStorage.setItem('DEV_TOKEN', 'true');
        localStorage.setItem('x-dev-user', 'admin');

        setIsLoading(false);
        onLogin();
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError('');
        const { error: authError } = await supabase.auth.signInWithOAuth({ 
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
        if (authError) {
            setError(authError.message);
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <h2>Admin Login</h2>
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input 
                        type="email" 
                        placeholder="Admin Email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required 
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                    />
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? '...' : 'Iniciar Sesión'}
                    </button>
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid #333', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button 
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        style={{
                            background: '#fff',
                            color: '#444',
                            border: '1px solid #ccc',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontWeight: 'bold'
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            <path fill="none" d="M1 1h22v22H1z" />
                        </svg>
                        Google Login
                    </button>
                    <button 
                        onClick={handleDevLogin}
                        disabled={isLoading}
                        style={{
                            background: '#2c3e50',
                            border: '1px solid #34495e',
                            width: '100%'
                        }}
                    >
                        🚀 Acceso Rápido (Admin Dev)
                    </button>
                </div>
            </div>
            <style>{`
                .login-page {
                    height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #1a1a2e;
                    color: white;
                }
                .login-container {
                    background: #16213e;
                    padding: 2rem;
                    border-radius: 8px;
                    width: 300px;
                }
                input {
                    padding: 0.5rem;
                    border-radius: 4px;
                    border: 1px solid #0f3460;
                    background: #1a1a2e;
                    color: white;
                }
                button {
                    padding: 0.5rem;
                    background: #e94560;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
}
