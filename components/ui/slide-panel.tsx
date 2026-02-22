'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

interface SlidePanelProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
}

export function SlidePanel({ isOpen, onClose, title, children }: SlidePanelProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />
            {/* Panel */}
            <div
                className="fixed right-0 top-0 z-50 h-full w-full max-w-lg flex flex-col shadow-2xl"
                style={{ background: 'var(--dash-sidebar-bg)', borderLeft: '1px solid var(--dash-border)' }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-6 py-5 flex-shrink-0"
                    style={{ borderBottom: '1px solid var(--dash-border)' }}
                >
                    <h2
                        className="text-lg font-bold"
                        style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--dash-text)' }}
                    >
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                        style={{ color: 'var(--dash-muted)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--dash-nav-hover)'; e.currentTarget.style.color = 'var(--dash-text)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--dash-muted)' }}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    {children}
                </div>
            </div>
        </>
    )
}
