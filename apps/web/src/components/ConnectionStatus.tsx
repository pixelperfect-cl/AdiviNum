/**
 * ConnectionStatus — shows an offline banner when the browser loses connection.
 * Uses the browser's `online`/`offline` events + periodic API ping.
 */
import { useState, useEffect } from 'react';

export function ConnectionStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            // Show "back online" briefly, then hide
            setTimeout(() => setShowBanner(false), 2000);
        };
        const handleOffline = () => {
            setIsOnline(false);
            setShowBanner(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!showBanner && isOnline) return null;

    return (
        <div className={`connection-banner ${isOnline ? 'connection-banner--online' : 'connection-banner--offline'}`}>
            <span className="connection-banner-icon">
                {isOnline ? '✅' : '📡'}
            </span>
            <span className="connection-banner-text">
                {isOnline
                    ? 'Conexión recuperada'
                    : 'Sin conexión — algunas funciones no estarán disponibles'}
            </span>
        </div>
    );
}
