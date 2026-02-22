import { ChevronDown } from 'lucide-react'

type Option = { label: string; value: string }

interface CustomSelectProps {
    value: string
    onChange: (value: string) => void
    options: Option[]
    placeholder?: string
    disabled?: boolean
    className?: string
    style?: React.CSSProperties
}

export function CustomSelect({
    value,
    onChange,
    options,
    placeholder,
    disabled,
    className = '',
    style,
}: CustomSelectProps) {
    return (
        <div className={`relative w-full ${className}`}>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                disabled={disabled}
                className="appearance-none w-full rounded-xl px-4 py-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-red-500/30 focus:border-[#E8392A] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
                style={{
                    background: 'var(--dash-nav-hover)',
                    border: '1px solid var(--dash-border)',
                    color: 'var(--dash-text)',
                    ...style,
                }}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map(o => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
            <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4"
                style={{ color: 'var(--dash-muted)' }}
            />
        </div>
    )
}
