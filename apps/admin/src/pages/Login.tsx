import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const logoUrl = `${import.meta.env.BASE_URL}LogoAdivinum.webp`;

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
        <div className="adm-login">
            {/* Animated background particles */}
            <div className="adm-login__bg">
                <div className="adm-login__orb adm-login__orb--1" />
                <div className="adm-login__orb adm-login__orb--2" />
                <div className="adm-login__orb adm-login__orb--3" />
            </div>

            <div className="adm-login__card">
                {/* Logo */}
                <div className="adm-login__brand">
                    <img src={logoUrl} alt="AdiviNum" className="adm-login__logo" />
                    <div className="adm-login__badge">PANEL ADMINISTRADOR</div>
                </div>

                {/* Form */}
                <form className="adm-login__form" onSubmit={handleLogin}>
                    <div className="adm-login__field">
                        <label className="adm-login__label">Correo electrónico</label>
                        <input 
                            type="email" 
                            className="adm-login__input"
                            placeholder="admin@adivinum.cl" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            required 
                        />
                    </div>
                    <div className="adm-login__field">
                        <label className="adm-login__label">Contraseña</label>
                        <input 
                            type="password" 
                            className="adm-login__input"
                            placeholder="••••••••" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            required 
                        />
                    </div>

                    <button type="submit" disabled={isLoading} className="adm-login__submit">
                        {isLoading ? (
                            <span className="adm-login__spinner" />
                        ) : (
                            'Iniciar Sesión'
                        )}
                    </button>

                    {error && (
                        <div className="adm-login__error">
                            <span>⚠️</span> {error}
                        </div>
                    )}
                </form>

                {/* Divider */}
                <div className="adm-login__divider">
                    <span>o continuar con</span>
                </div>

                {/* Social buttons */}
                <div className="adm-login__socials">
                    <button 
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="adm-login__social-btn adm-login__social-btn--google"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Google
                    </button>
                    <button 
                        onClick={handleDevLogin}
                        disabled={isLoading}
                        className="adm-login__social-btn adm-login__social-btn--dev"
                    >
                        🚀 Dev Access
                    </button>
                </div>

                {/* Footer */}
                <div className="adm-login__footer">
                    Powered by <strong>Pixel Perfect</strong>
                </div>
            </div>

            <style>{`
                .adm-login {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #070B14;
                    position: relative;
                    overflow: hidden;
                    padding: 20px;
                }

                /* Animated gradient orbs */
                .adm-login__bg {
                    position: absolute;
                    inset: 0;
                    overflow: hidden;
                    z-index: 0;
                }
                .adm-login__orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    opacity: 0.3;
                    animation: orbFloat 12s ease-in-out infinite;
                }
                .adm-login__orb--1 {
                    width: 400px; height: 400px;
                    background: radial-gradient(circle, #3B82F6, transparent 70%);
                    top: -100px; left: -100px;
                    animation-delay: 0s;
                }
                .adm-login__orb--2 {
                    width: 350px; height: 350px;
                    background: radial-gradient(circle, #FFD700, transparent 70%);
                    bottom: -80px; right: -80px;
                    animation-delay: -4s;
                }
                .adm-login__orb--3 {
                    width: 250px; height: 250px;
                    background: radial-gradient(circle, #8B5CF6, transparent 70%);
                    top: 50%; left: 60%;
                    animation-delay: -8s;
                }
                @keyframes orbFloat {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -20px) scale(1.05); }
                    66% { transform: translate(-20px, 15px) scale(0.95); }
                }

                /* Card */
                .adm-login__card {
                    position: relative;
                    z-index: 1;
                    width: 100%;
                    max-width: 400px;
                    background: rgba(17, 24, 39, 0.85);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 24px;
                    padding: 40px 36px 32px;
                    box-shadow:
                        0 0 0 1px rgba(255, 215, 0, 0.05),
                        0 20px 60px rgba(0, 0, 0, 0.5),
                        0 0 80px rgba(59, 130, 246, 0.08);
                }

                /* Brand */
                .adm-login__brand {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin-bottom: 32px;
                }
                .adm-login__logo {
                    width: 200px;
                    height: auto;
                    filter: drop-shadow(0 4px 20px rgba(255, 215, 0, 0.2));
                }
                .adm-login__badge {
                    margin-top: 8px;
                    font-size: 10px;
                    font-weight: 800;
                    letter-spacing: 3px;
                    color: #94A3B8;
                    background: rgba(148, 163, 184, 0.1);
                    border: 1px solid rgba(148, 163, 184, 0.15);
                    padding: 4px 14px;
                    border-radius: 20px;
                }

                /* Form */
                .adm-login__form {
                    display: flex;
                    flex-direction: column;
                    gap: 18px;
                }
                .adm-login__field {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .adm-login__label {
                    font-size: 12px;
                    font-weight: 600;
                    color: #94A3B8;
                    letter-spacing: 0.5px;
                }
                .adm-login__input {
                    padding: 12px 16px;
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    background: rgba(255, 255, 255, 0.04);
                    color: #F1F5F9;
                    font-size: 14px;
                    transition: all 0.2s ease;
                    outline: none;
                }
                .adm-login__input::placeholder {
                    color: #475569;
                }
                .adm-login__input:focus {
                    border-color: rgba(255, 215, 0, 0.4);
                    background: rgba(255, 255, 255, 0.06);
                    box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.08);
                }

                /* Submit button */
                .adm-login__submit {
                    margin-top: 4px;
                    padding: 14px;
                    border-radius: 12px;
                    border: none;
                    background: linear-gradient(135deg, #FFD700, #F59E0B);
                    color: #000;
                    font-size: 15px;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    letter-spacing: 0.5px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 48px;
                }
                .adm-login__submit:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 8px 24px rgba(255, 215, 0, 0.3);
                }
                .adm-login__submit:active:not(:disabled) {
                    transform: translateY(0);
                }
                .adm-login__submit:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                /* Spinner */
                .adm-login__spinner {
                    width: 20px;
                    height: 20px;
                    border: 2.5px solid rgba(0, 0, 0, 0.2);
                    border-top-color: #000;
                    border-radius: 50%;
                    animation: spin 0.6s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                /* Error */
                .adm-login__error {
                    padding: 10px 14px;
                    border-radius: 10px;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    color: #FCA5A5;
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                /* Divider */
                .adm-login__divider {
                    display: flex;
                    align-items: center;
                    margin: 24px 0;
                    gap: 12px;
                }
                .adm-login__divider::before,
                .adm-login__divider::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: rgba(255, 255, 255, 0.06);
                }
                .adm-login__divider span {
                    font-size: 11px;
                    font-weight: 600;
                    color: #64748B;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    white-space: nowrap;
                }

                /* Social buttons */
                .adm-login__socials {
                    display: flex;
                    gap: 10px;
                }
                .adm-login__social-btn {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 12px;
                    border-radius: 12px;
                    font-size: 13px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .adm-login__social-btn--google {
                    background: rgba(255, 255, 255, 0.06);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #E2E8F0;
                }
                .adm-login__social-btn--google:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: rgba(255, 255, 255, 0.18);
                }
                .adm-login__social-btn--dev {
                    background: rgba(139, 92, 246, 0.12);
                    border: 1px solid rgba(139, 92, 246, 0.2);
                    color: #A78BFA;
                }
                .adm-login__social-btn--dev:hover {
                    background: rgba(139, 92, 246, 0.2);
                    border-color: rgba(139, 92, 246, 0.35);
                }

                /* Footer */
                .adm-login__footer {
                    text-align: center;
                    margin-top: 28px;
                    font-size: 11px;
                    color: #475569;
                }
                .adm-login__footer strong {
                    color: #64748B;
                }
            `}</style>
        </div>
    );
}
