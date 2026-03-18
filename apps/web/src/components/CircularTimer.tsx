import { useState, useEffect, useRef } from 'react';

interface CircularTimerProps {
    timeMs: number;         // Current time remaining (from server)
    maxTimeMs: number;      // Max time for this level
    isActive: boolean;      // Whether this timer is counting down
    label: string;          // "Tú" or "Rival"
    size?: number;          // Diameter in px
}

export function CircularTimer({
    timeMs,
    maxTimeMs,
    isActive,
    label,
    size = 90,
}: CircularTimerProps) {
    // Local countdown that ticks every second when active
    const [localTimeMs, setLocalTimeMs] = useState(timeMs);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Sync with server time whenever it changes
    useEffect(() => {
        setLocalTimeMs(timeMs);
    }, [timeMs]);

    // Local countdown when active
    useEffect(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (isActive && localTimeMs > 0) {
            intervalRef.current = setInterval(() => {
                setLocalTimeMs((prev) => Math.max(0, prev - 1000));
            }, 1000);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive]); // Only restart interval when active state changes

    const totalSeconds = Math.max(0, Math.floor(localTimeMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}`;

    const fraction = maxTimeMs > 0 ? localTimeMs / maxTimeMs : 1;
    const clampedFraction = Math.max(0, Math.min(1, fraction));

    // Color thresholds
    const getColor = () => {
        if (totalSeconds <= 10) return 'var(--timer-critical, #ff4444)';
        if (totalSeconds <= 30) return 'var(--timer-warning, #ffaa00)';
        return 'var(--timer-normal, #44cc44)';
    };

    // SVG calculations
    const strokeWidth = 4;
    const radius = (size - strokeWidth * 2) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - clampedFraction);
    const center = size / 2;

    return (
        <div
            className={`circular-timer ${isActive ? 'circular-timer--active' : ''} ${totalSeconds <= 10 ? 'circular-timer--critical' : ''}`}
            style={{ width: size, height: size }}
        >
            <svg width={size} height={size} className="circular-timer__svg">
                {/* Background ring */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth={strokeWidth}
                />
                {/* Progress ring */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={getColor()}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    className="circular-timer__ring"
                    transform={`rotate(-90 ${center} ${center})`}
                />
            </svg>
            <div className="circular-timer__content">
                <span className="circular-timer__time" style={{ color: getColor() }}>
                    {timeStr}
                </span>
                <span className="circular-timer__label">{label}</span>
            </div>
        </div>
    );
}
