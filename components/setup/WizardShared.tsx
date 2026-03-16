'use client'

import { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

// ── WizardCard ────────────────────────────────────────────────────────────────
export function WizardCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
      <h2
        className="text-xl font-bold text-slate-900 mb-1"
        style={{ fontFamily: 'var(--font-bricolage, sans-serif)' }}
      >
        {title}
      </h2>
      <p className="text-sm text-slate-500 mb-6">{subtitle}</p>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

// ── WizardField ───────────────────────────────────────────────────────────────
export function WizardField({
  label,
  required,
  helper,
  children,
}: {
  label: string
  required?: boolean
  helper?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {helper && <p className="text-xs text-slate-400">{helper}</p>}
    </div>
  )
}

// ── WizardSelect ──────────────────────────────────────────────────────────────
export function WizardSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
}) {
  return (
    <select
      className="wizard-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

// ── WizardCTA ─────────────────────────────────────────────────────────────────
export function WizardCTA({
  onClick,
  disabled,
  loading,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  children: ReactNode
}) {
  const isDisabled = disabled || loading
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-150 mt-2"
      style={{
        background: isDisabled ? '#e2e8f0' : '#0f172a',
        color: isDisabled ? '#94a3b8' : '#ffffff',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
      }}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}

// ── WizardBackButton ──────────────────────────────────────────────────────────
export function WizardBackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1 mb-4"
    >
      ← Back
    </button>
  )
}
