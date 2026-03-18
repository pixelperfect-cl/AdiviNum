import { useState } from 'react';
import { useUserStore } from '../stores/userStore';

export function LoginPage() {
    const { login, signUp, loginAsDev, loginWithGoogle, isLoading, error } = useUserStore();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLogin) {
            await login(email, password);
        } else {
            await signUp(email, password, username);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-brand">
                    <h1 className="login-logo">AdiviNum</h1>
                    <p className="login-tagline">Adivina el número secreto</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    {!isLogin && (
                        <input
                            type="text"
                            placeholder="Nombre de Usuario"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    )}
                    <input
                        type="email"
                        placeholder="Correo Electrónico"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button type="submit" disabled={isLoading} className="login-submit-btn">
                        {isLoading ? 'Cargando...' : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
                    </button>
                </form>

                {error && (
                    <div className="login-error">
                        ⚠️ {error}
                    </div>
                )}

                <div style={{ marginTop: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                        onClick={() => loginWithGoogle()}
                        disabled={isLoading}
                        style={{
                            background: '#fff',
                            color: '#444',
                            border: '1px solid #ccc',
                            padding: '10px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                        type="button"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            <path fill="none" d="M1 1h22v22H1z" />
                        </svg>
                        Continuar con Google
                    </button>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                            onClick={() => loginAsDev('player')}
                            disabled={isLoading}
                            style={{
                                background: '#333',
                                color: '#fff',
                                border: '1px solid #555',
                                padding: '8px 4px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                flex: 1
                            }}
                        >
                            🚀 Player 1
                        </button>
                        <button 
                            onClick={() => loginAsDev('player2')}
                            disabled={isLoading}
                            style={{
                                background: '#333',
                                color: '#fff',
                                border: '1px solid #555',
                                padding: '8px 4px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                flex: 1
                            }}
                        >
                            🚀 Player 2
                        </button>
                    </div>
                </div>

                <p className="login-footer">
                    {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
                    <button className="login-toggle-btn" onClick={() => setIsLogin(!isLogin)} type="button">
                        {isLogin ? 'Regístrate aquí' : 'Inicia Sesión'}
                    </button>
                </p>
            </div>
            
            <style>{`
                .login-form {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-top: 24px;
                }
                .login-form input {
                    padding: 12px;
                    border-radius: 8px;
                    border: 1px solid var(--border-color, #ccc);
                    background: var(--bg-card, #2b2b36);
                    color: var(--text-color, #fff);
                    font-size: 1rem;
                }
                .login-submit-btn {
                    padding: 12px;
                    border-radius: 8px;
                    border: none;
                    background: var(--gold, #FFD700);
                    color: #000;
                    font-weight: bold;
                    cursor: pointer;
                    margin-top: 8px;
                }
                .login-submit-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .login-toggle-btn {
                    background: none;
                    border: none;
                    color: var(--gold, #FFD700);
                    cursor: pointer;
                    text-decoration: underline;
                    padding: 0;
                    font-size: inherit;
                }
            `}</style>
        </div>
    );
}
