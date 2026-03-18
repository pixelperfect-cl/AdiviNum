/**
 * Skeleton loading components for AdiviNum.
 * Use these as placeholders while data is being fetched.
 */
import React from 'react';

interface SkeletonProps {
    width?: string;
    height?: string;
    borderRadius?: string;
    style?: React.CSSProperties;
    className?: string;
}

export function Skeleton({ width = '100%', height = '14px', borderRadius, style, className = '' }: SkeletonProps) {
    return (
        <div
            className={`skeleton ${className}`}
            style={{ width, height, borderRadius, ...style }}
        />
    );
}

export function SkeletonText({ lines = 3, short = false }: { lines?: number; short?: boolean }) {
    return (
        <>
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    className={`skeleton skeleton-text ${i === lines - 1 && short ? 'skeleton-text--short' : ''}`}
                />
            ))}
        </>
    );
}

export function SkeletonCard({ count = 3 }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="skeleton skeleton-card" />
            ))}
        </>
    );
}

export function SkeletonAvatar({ size = 48 }: { size?: number }) {
    return (
        <div
            className="skeleton skeleton-avatar"
            style={{ width: size, height: size }}
        />
    );
}

/**
 * A complete page skeleton with header, cards, and text.
 * Use for full-page loading states.
 */
export function PageSkeleton() {
    return (
        <div style={{ padding: '20px', maxWidth: '480px', margin: '0 auto' }}>
            <Skeleton width="60%" height="24px" style={{ marginBottom: '24px' }} />
            <SkeletonCard count={3} />
            <SkeletonText lines={2} short />
        </div>
    );
}
