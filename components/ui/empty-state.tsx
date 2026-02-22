'use client'

import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
    icon: LucideIcon
    title: string
    description: string
    actionLabel?: string
    onAction?: () => void
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
    return (
        <div
            className="flex flex-col items-center justify-center text-center py-20 px-8 rounded-2xl"
            style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}
        >
            <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: 'rgba(232,57,42,0.1)' }}
            >
                <Icon className="w-8 h-8" style={{ color: '#E8392A' }} />
            </div>
            <h3
                className="text-lg font-bold mb-2"
                style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--dash-text)' }}
            >
                {title}
            </h3>
            <p className="text-sm mb-6 max-w-xs" style={{ color: 'var(--dash-muted)' }}>
                {description}
            </p>
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: '#E8392A' }}
                >
                    {actionLabel}
                </button>
            )}
        </div>
    )
}
