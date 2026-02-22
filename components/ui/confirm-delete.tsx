'use client'

interface ConfirmDeleteProps {
    message?: string
    onConfirm: () => void
    onCancel: () => void
    loading?: boolean
}

export function ConfirmDelete({
    message = 'Are you sure you want to delete this? This action cannot be undone.',
    onConfirm,
    onCancel,
    loading = false,
}: ConfirmDeleteProps) {
    return (
        <div
            className="rounded-xl p-4 mt-2"
            style={{ background: 'rgba(232,57,42,0.08)', border: '1px solid rgba(232,57,42,0.25)' }}
        >
            <p className="text-sm mb-3" style={{ color: 'var(--dash-text)' }}>
                {message}
            </p>
            <div className="flex items-center gap-2">
                <button
                    onClick={onConfirm}
                    disabled={loading}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: '#E8392A' }}
                >
                    {loading ? 'Deleting...' : 'Delete'}
                </button>
                <button
                    onClick={onCancel}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                    style={{ color: 'var(--dash-muted)', background: 'var(--dash-nav-hover)' }}
                >
                    Cancel
                </button>
            </div>
        </div>
    )
}
