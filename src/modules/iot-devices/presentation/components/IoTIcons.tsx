export function BottleIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 3h6" />
            <path d="M7 3v3a5 5 0 0 0 10 0V3" />
            <rect x="7" y="9" width="10" height="12" rx="2" />
        </svg>
    );
}

export function ScaleIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v18" />
            <rect x="3" y="16" width="18" height="5" rx="1" />
            <path d="M6 16V9a6 6 0 0 1 12 0v7" />
        </svg>
    );
}

export function WearableIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="7" y="5" width="10" height="14" rx="3" />
            <path d="M7 9H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2" />
            <path d="M17 9h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2" />
            <circle cx="12" cy="12" r="2" />
        </svg>
    );
}

export function HeartPulseIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12h4l2-5 4 10 2-5h6" />
            <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3-5.191 5.5-5.191 1.659 0 3.322.828 5.5 3.12 2.178-2.292 3.841-3.12 5.5-3.12C20 2 23 3.4 23 7.191c0 4.105-5.37 8.863-11 14.402Z" />
        </svg>
    );
}

export function FootstepsIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 17H5a2 2 0 0 0-2 2v2" />
            <path d="M16 7h3a2 2 0 0 1 2 2v2" />
            <path d="M8 17c0-4 4-7 4-7s4 3 4 7" />
            <ellipse cx="8" cy="9" rx="3" ry="4" />
            <ellipse cx="16" cy="15" rx="3" ry="4" />
        </svg>
    );
}

export function ThermometerIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
        </svg>
    );
}

export function BatteryIcon({ percentage }: { percentage: number }) {
    const fillWidth = Math.round((percentage / 100) * 14);
    const color = percentage > 50 ? "#16a34a" : percentage > 20 ? "#ca8a04" : "#dc2626";
    return (
        <svg width="22" height="12" viewBox="0 0 22 12" fill="none">
            <rect x="0.5" y="0.5" width="18" height="11" rx="2" stroke="#94a3b8" />
            <rect x="1.5" y="1.5" width={fillWidth} height="9" rx="1" fill={color} />
            <path d="M19.5 4v4a1.5 1.5 0 0 0 0-4Z" fill="#94a3b8" />
        </svg>
    );
}