'use client'

interface StatusBadgeProps {
    status: string
    variant?: 'rent' | 'maintenance' | 'lease' | 'property' | 'tenant'
}

const rentColors: Record<string, { bg: string; text: string }> = {
    paid: { bg: 'var(--dash-badge-paid-bg)', text: 'var(--dash-badge-paid-text)' },
    overdue: { bg: 'var(--dash-badge-over-bg)', text: 'var(--dash-badge-over-text)' },
    pending: { bg: 'var(--dash-badge-pend-bg)', text: 'var(--dash-badge-pend-text)' },
}

const maintenanceColors: Record<string, { bg: string; text: string }> = {
    open: { bg: 'var(--dash-badge-over-bg)', text: 'var(--dash-badge-over-text)' },
    'in progress': { bg: 'var(--dash-badge-pend-bg)', text: 'var(--dash-badge-pend-text)' },
    fixed: { bg: 'var(--dash-badge-paid-bg)', text: 'var(--dash-badge-paid-text)' },
}

const generalColors: Record<string, { bg: string; text: string }> = {
    active: { bg: 'var(--dash-badge-paid-bg)', text: 'var(--dash-badge-paid-text)' },
    inactive: { bg: 'rgba(120,120,120,0.15)', text: 'var(--dash-muted)' },
    vacant: { bg: 'var(--dash-badge-pend-bg)', text: 'var(--dash-badge-pend-text)' },
    expired: { bg: 'var(--dash-badge-over-bg)', text: 'var(--dash-badge-over-text)' },
}

export function StatusBadge({ status, variant }: StatusBadgeProps) {
    const key = status.toLowerCase()
    let colors: { bg: string; text: string } | undefined

    if (variant === 'rent') colors = rentColors[key]
    else if (variant === 'maintenance') colors = maintenanceColors[key]
    else colors = maintenanceColors[key] ?? rentColors[key] ?? generalColors[key]

    // fallback
    if (!colors) colors = { bg: 'rgba(120,120,120,0.15)', text: 'var(--dash-muted)' }

    return (
        <span
            className="inline-flex items-center text-xs font-semibold rounded-full px-3 py-1 whitespace-nowrap"
            style={{ background: colors.bg, color: colors.text }}
        >
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    )
}
