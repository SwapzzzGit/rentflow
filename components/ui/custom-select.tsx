'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'

type Option = { label: string; value: string }

interface CustomSelectProps {
    value: string
    onChange: (value: string) => void
    options: Option[]
    placeholder?: string
    disabled?: boolean
    className?: string
}

export function CustomSelect({
    value,
    onChange,
    options,
    placeholder,
    disabled,
    className = '',
}: CustomSelectProps) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    // Close on outside click
    useEffect(() => {
        function handle(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        if (open) document.addEventListener('mousedown', handle)
        return () => document.removeEventListener('mousedown', handle)
    }, [open])

    // Close on Escape
    useEffect(() => {
        function handle(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
        if (open) document.addEventListener('keydown', handle)
        return () => document.removeEventListener('keydown', handle)
    }, [open])

    const allOptions: Option[] = placeholder ? [{ value: '', label: placeholder }, ...options] : options
    const selected = allOptions.find(o => o.value === value)
    const displayLabel = selected?.label ?? placeholder ?? 'Select...'
    const isPlaceholder = !value && !!placeholder

    return (
        <div ref={ref} className={`relative w-full ${className}`} style={{ zIndex: open ? 50 : 'auto' }}>
            {/* Trigger button */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-sm text-left transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                    background: 'var(--dash-nav-hover)',
                    border: open ? '1px solid #E8392A' : '1px solid var(--dash-border)',
                    color: isPlaceholder ? 'var(--dash-muted)' : 'var(--dash-text)',
                    boxShadow: open ? '0 0 0 3px rgba(232,57,42,0.12)' : 'none',
                }}
            >
                <span className="truncate">{displayLabel}</span>
                <ChevronDown
                    className="w-4 h-4 flex-shrink-0 transition-transform duration-200"
                    style={{
                        color: 'var(--dash-muted)',
                        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                />
            </button>

            {/* Dropdown panel — fixed dark mode with explicit colors */}
            {open && (
                <div
                    className="absolute left-0 right-0 mt-1.5 rounded-xl overflow-hidden shadow-2xl"
                    style={{
                        zIndex: 999,
                        animation: 'selectIn 120ms cubic-bezier(0.16,1,0.3,1) both',
                        border: '1px solid var(--dash-card-border)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        background: 'var(--custom-select-bg)',
                    }}
                >
                    {allOptions.map((opt, idx) => {
                        const isSelected = opt.value === value
                        const isPlaceholderOpt = opt.value === '' && !!placeholder
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onMouseDown={e => {
                                    e.preventDefault()
                                    onChange(opt.value)
                                    setOpen(false)
                                }}
                                className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-left transition-colors custom-select-option"
                                style={{
                                    background: isSelected ? 'rgba(232,57,42,0.12)' : 'transparent',
                                    color: isPlaceholderOpt
                                        ? 'var(--dash-muted)'
                                        : isSelected
                                            ? '#E8392A'
                                            : 'var(--dash-text)',
                                    fontWeight: isSelected ? 600 : 400,
                                    borderBottom: idx < allOptions.length - 1 ? '1px solid var(--dash-border)' : 'none',
                                }}
                                onMouseEnter={e => {
                                    if (!isSelected) {
                                        e.currentTarget.style.background = 'var(--dash-nav-hover)'
                                    }
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = isSelected ? 'rgba(232,57,42,0.12)' : 'transparent'
                                }}
                            >
                                <span>{opt.label}</span>
                                {isSelected && !isPlaceholderOpt && (
                                    <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#E8392A' }} />
                                )}
                            </button>
                        )
                    })}
                </div>
            )}

            <style>{`
                @keyframes selectIn {
                    from { opacity: 0; transform: translateY(-6px) scale(0.98); }
                    to   { opacity: 1; transform: translateY(0)    scale(1);    }
                }
                :root {
                    --custom-select-bg: rgba(255,255,255,0.98);
                }
                html.dark {
                    --custom-select-bg: rgba(17,24,39,0.98);
                }
            `}</style>
        </div>
    )
}
