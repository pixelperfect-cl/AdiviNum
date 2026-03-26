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
        <div className="gl">
            {/* Animated background */}
            <div className="gl__bg">
                <div className="gl__orb gl__orb--gold" />
                <div className="gl__orb gl__orb--blue" />
                <div className="gl__orb gl__orb--purple" />
                <div className="gl__grid" />
            </div>

            <div className="gl__wrapper">
                {/* Logo + tagline */}
                <div className="gl__brand">
                    <img src="/LogoAdivinum.webp" alt="AdiviNum" className="gl__logo" />
                    <p className="gl__tagline">Adivina el número secreto</p>
                </div>

                {/* Main card */}
                <div className="gl__card">
                    {/* Tab toggle */}
                    <div className="gl__tabs">
                        <button
                            className={`gl__tab ${isLogin ? 'gl__tab--active' : ''}`}
                            onClick={() => setIsLogin(true)}
                            type="button"
                        >
                            Iniciar Sesión
                        </button>
                        <button
                            className={`gl__tab ${!isLogin ? 'gl__tab--active' : ''}`}
                            onClick={() => setIsLogin(false)}
                            type="button"
                        >
                            Registrarse
                        </button>
                    </div>

                    {/* Form */}
                    <form className="gl__form" onSubmit={handleSubmit}>
                        {!isLogin && (
                            <div className="gl__field">
                                <label className="gl__label">Nombre de usuario</label>
                                <div className="gl__input-wrap">
                                    <span className="gl__input-icon">👤</span>
                                    <input
                                        type="text"
                                        className="gl__input"
                                        placeholder="Tu nombre en el juego"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        )}
                        <div className="gl__field">
                            <label className="gl__label">Correo electrónico</label>
                            <div className="gl__input-wrap">
                                <span className="gl__input-icon">✉️</span>
                                <input
                                    type="email"
                                    className="gl__input"
                                    placeholder="tu@correo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="gl__field">
                            <label className="gl__label">Contraseña</label>
                            <div className="gl__input-wrap">
                                <span className="gl__input-icon">🔒</span>
                                <input
                                    type="password"
                                    className="gl__input"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={isLoading} className="gl__submit">
                            {isLoading ? (
                                <span className="gl__spinner" />
                            ) : (
                                <>
                                    {isLogin ? '🎯 Entrar al Juego' : '🚀 Crear Cuenta'}
                                </>
                            )}
                        </button>
                    </form>

                    {error && (
                        <div className="gl__error">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Divider */}
                    <div className="gl__divider">
                        <span>o continuar con</span>
                    </div>

                    {/* Google */}
                    <button
                        onClick={() => loginWithGoogle()}
                        disabled={isLoading}
                        className="gl__google"
                        type="button"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continuar con Google
                    </button>

                    {/* Dev quick access */}
                    <div className="gl__dev-row">
                        <button onClick={() => loginAsDev('player')}  disabled={isLoading} className="gl__dev-btn">
                            ⚡ Player 1
                        </button>
                        <button onClick={() => loginAsDev('player2')} disabled={isLoading} className="gl__dev-btn">
                            ⚡ Player 2
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="gl__footer">
                    Powered by <strong>Pixel Perfect</strong>
                </div>
            </div>

            <style>{`
                /* =============================================
                   Game Login — Premium Design
                   ============================================= */
                .gl {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--bg, #070B14);
                    position: relative;
                    overflow: hidden;
                    padding: 24px 16px;
                }

                /* Animated orbs */
                .gl__bg {
                    position: absolute;
                    inset: 0;
                    z-index: 0;
                    overflow: hidden;
                }
                .gl__orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(100px);
                    opacity: 0.25;
                    animation: glOrb 14s ease-in-out infinite;
                }
                .gl__orb--gold {
                    width: 500px; height: 500px;
                    background: radial-gradient(circle, #FFD700, transparent 70%);
                    top: -150px; right: -100px;
                    animation-delay: 0s;
                }
                .gl__orb--blue {
                    width: 400px; height: 400px;
                    background: radial-gradient(circle, #3B82F6, transparent 70%);
                    bottom: -100px; left: -100px;
                    animation-delay: -5s;
                }
                .gl__orb--purple {
                    width: 300px; height: 300px;
                    background: radial-gradient(circle, #8B5CF6, transparent 70%);
                    top: 40%; left: 50%;
                    animation-delay: -9s;
                }
                .gl__grid {
                    position: absolute;
                    inset: 0;
                    background-image:
                        linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
                    background-size: 60px 60px;
                    mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
                    -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
                }
                @keyframes glOrb {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(40px, -30px) scale(1.08); }
                    66% { transform: translate(-25px, 20px) scale(0.94); }
                }

                /* Wrapper */
                .gl__wrapper {
                    position: relative;
                    z-index: 1;
                    width: 100%;
                    max-width: 420px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                /* Brand */
                .gl__brand {
                    text-align: center;
                    margin-bottom: 28px;
                }
                .gl__logo {
                    width: 220px;
                    height: auto;
                    filter: drop-shadow(0 6px 24px rgba(255, 215, 0, 0.25));
                    animation: glLogoIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
                }
                @keyframes glLogoIn {
                    from { opacity: 0; transform: translateY(-16px) scale(0.9); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .gl__tagline {
                    margin-top: 8px;
                    font-size: 12px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 4px;
                    color: var(--text-muted, #64748B);
                    animation: glFadeIn 1s 0.3s both;
                }
                @keyframes glFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                /* Card */
                .gl__card {
                    width: 100%;
                    background: rgba(17, 24, 39, 0.8);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 20px;
                    padding: 28px 28px 24px;
                    box-shadow:
                        0 0 0 1px rgba(255, 215, 0, 0.04),
                        0 24px 64px rgba(0, 0, 0, 0.5);
                    animation: glCardIn 0.6s 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
                }
                @keyframes glCardIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* Tabs */
                .gl__tabs {
                    display: flex;
                    background: rgba(255, 255, 255, 0.04);
                    border-radius: 12px;
                    padding: 4px;
                    margin-bottom: 24px;
                    border: 1px solid rgba(255, 255, 255, 0.04);
                }
                .gl__tab {
                    flex: 1;
                    padding: 10px;
                    border: none;
                    border-radius: 10px;
                    background: none;
                    color: var(--text-muted, #64748B);
                    font-size: 13px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.25s ease;
                    font-family: inherit;
                }
                .gl__tab--active {
                    background: rgba(255, 215, 0, 0.12);
                    color: var(--gold, #FFD700);
                    box-shadow: 0 2px 8px rgba(255, 215, 0, 0.1);
                }

                /* Form */
                .gl__form {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .gl__field {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .gl__label {
                    font-size: 11px;
                    font-weight: 700;
                    color: var(--text-muted, #64748B);
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                }
                .gl__input-wrap {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                .gl__input-icon {
                    position: absolute;
                    left: 14px;
                    font-size: 14px;
                    pointer-events: none;
                    opacity: 0.6;
                }
                .gl__input {
                    width: 100%;
                    padding: 13px 16px 13px 42px;
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.07);
                    background: rgba(255, 255, 255, 0.03);
                    color: var(--text-primary, #F1F5F9);
                    font-size: 14px;
                    font-family: inherit;
                    transition: all 0.2s ease;
                    outline: none;
                }
                .gl__input::placeholder {
                    color: rgba(148, 163, 184, 0.4);
                }
                .gl__input:focus {
                    border-color: rgba(255, 215, 0, 0.35);
                    background: rgba(255, 255, 255, 0.05);
                    box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.06);
                }

                /* Submit */
                .gl__submit {
                    margin-top: 4px;
                    padding: 14px;
                    border-radius: 12px;
                    border: none;
                    background: linear-gradient(135deg, #FFD700 0%, #F59E0B 100%);
                    color: #000;
                    font-size: 15px;
                    font-weight: 800;
                    font-family: inherit;
                    cursor: pointer;
                    transition: all 0.25s ease;
                    letter-spacing: 0.3px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 50px;
                    gap: 6px;
                }
                .gl__submit:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 28px rgba(255, 215, 0, 0.35);
                }
                .gl__submit:active:not(:disabled) {
                    transform: translateY(0);
                }
                .gl__submit:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                /* Spinner */
                .gl__spinner {
                    width: 22px;
                    height: 22px;
                    border: 3px solid rgba(0, 0, 0, 0.15);
                    border-top-color: #000;
                    border-radius: 50%;
                    animation: glSpin 0.6s linear infinite;
                    display: inline-block;
                }
                @keyframes glSpin {
                    to { transform: rotate(360deg); }
                }

                /* Error */
                .gl__error {
                    margin-top: 12px;
                    padding: 10px 14px;
                    border-radius: 10px;
                    background: rgba(239, 68, 68, 0.08);
                    border: 1px solid rgba(239, 68, 68, 0.15);
                    color: #FCA5A5;
                    font-size: 13px;
                }

                /* Divider */
                .gl__divider {
                    display: flex;
                    align-items: center;
                    margin: 20px 0;
                    gap: 12px;
                }
                .gl__divider::before,
                .gl__divider::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: rgba(255, 255, 255, 0.05);
                }
                .gl__divider span {
                    font-size: 10px;
                    font-weight: 700;
                    color: var(--text-muted, #64748B);
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    white-space: nowrap;
                }

                /* Google */
                .gl__google {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    padding: 13px;
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    background: rgba(255, 255, 255, 0.04);
                    color: var(--text-primary, #E2E8F0);
                    font-size: 14px;
                    font-weight: 600;
                    font-family: inherit;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .gl__google:hover:not(:disabled) {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: rgba(255, 255, 255, 0.15);
                    transform: translateY(-1px);
                }

                /* Dev buttons */
                .gl__dev-row {
                    display: flex;
                    gap: 8px;
                    margin-top: 10px;
                }
                .gl__dev-btn {
                    flex: 1;
                    padding: 10px;
                    border-radius: 10px;
                    border: 1px solid rgba(139, 92, 246, 0.15);
                    background: rgba(139, 92, 246, 0.06);
                    color: #A78BFA;
                    font-size: 12px;
                    font-weight: 700;
                    font-family: inherit;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .gl__dev-btn:hover:not(:disabled) {
                    background: rgba(139, 92, 246, 0.14);
                    border-color: rgba(139, 92, 246, 0.3);
                }

                /* Footer */
                .gl__footer {
                    margin-top: 24px;
                    text-align: center;
                    font-size: 11px;
                    color: rgba(100, 116, 139, 0.5);
                    animation: glFadeIn 1s 0.6s both;
                }
                .gl__footer strong {
                    color: rgba(100, 116, 139, 0.7);
                }
            `}</style>
        </div>
    );
}
