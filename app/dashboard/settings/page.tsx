'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/useProfile'
import {
    User, Settings2, Bell, Lock, CreditCard, AlertTriangle,
    ChevronDown, Camera, Eye, EyeOff, Check, X
} from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Types ───────────────────────────────────────────────────────────────────
type TabId = 'profile' | 'preferences' | 'notifications' | 'security' | 'billing' | 'danger'

const TABS: { id: TabId; label: string; icon: React.ElementType; danger?: boolean }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Settings2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'billing', label: 'Plan & Billing', icon: CreditCard },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, danger: true },
]

// ─── Shared input style ───────────────────────────────────────────────────────
const INPUT = 'w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all focus:ring-2'
const inputStyle = {
    background: 'var(--dash-nav-hover)',
    border: '1px solid var(--dash-border)',
    color: 'var(--dash-text)',
}
const focusClass = 'focus:ring-red-500/30 focus:border-[#E8392A]'

const LABEL = 'block text-xs font-semibold uppercase tracking-wide mb-1.5'
const labelStyle = { color: 'var(--dash-muted)' }

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`w-full rounded-2xl p-6 space-y-5 ${className}`} style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}>
            {children}
        </div>
    )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return <h2 className="text-base font-bold mb-1" style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--dash-text)' }}>{children}</h2>
}

function SaveButton({ children, loading, onClick }: { children: React.ReactNode; loading?: boolean; onClick?: () => void }) {
    return (
        <button onClick={onClick} disabled={loading} className="mt-2 w-full rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ background: '#E8392A' }}>
            {loading ? 'Saving...' : children}
        </button>
    )
}

// ─── Custom Select ────────────────────────────────────────────────────────────
function CustomSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
    return (
        <div className="space-y-1.5">
            <label className={LABEL} style={labelStyle}>{label}</label>
            <div className="relative">
                <select
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className={`${INPUT} ${focusClass} appearance-none pr-10`}
                    style={inputStyle}
                >
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4" style={{ color: 'var(--dash-muted)' }} />
            </div>
        </div>
    )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!checked)}
            className="w-11 h-6 rounded-full relative flex-shrink-0 transition-colors duration-200 focus:outline-none"
            style={{ background: checked ? '#E8392A' : 'var(--dash-border)' }}
        >
            <div
                className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow transition-transform duration-200"
                style={{ transform: checked ? 'translateX(22px)' : 'translateX(2px)' }}
            />
        </button>
    )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function SettingsPage() {
    const { profile, email, refetch } = useProfile()
    const supabase = createClient()
    const router = useRouter()
    const avatarRef = useRef<HTMLInputElement>(null)
    const [activeTab, setActiveTab] = useState<TabId>('profile')

    // Profile fields
    const [fullName, setFullName] = useState('')
    const [phone, setPhone] = useState('')
    const [company, setCompany] = useState('')
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [savingProfile, setSavingProfile] = useState(false)

    // Preferences
    const [currency, setCurrency] = useState('USD')
    const [timezone, setTimezone] = useState('UTC')
    const [dateFormat, setDateFormat] = useState('MM/DD/YYYY')
    const [savingPrefs, setSavingPrefs] = useState(false)

    // Notifications
    const [notifs, setNotifs] = useState({ rent_due: true, maintenance_update: true, lease_expiry: true, payment_received: true })
    const [savingNotifs, setSavingNotifs] = useState(false)

    // Security
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showNewPw, setShowNewPw] = useState(false)
    const [showConfirmPw, setShowConfirmPw] = useState(false)
    const [savingPw, setSavingPw] = useState(false)

    // Danger zone
    const [deleteConfirmText, setDeleteConfirmText] = useState('')
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [exportingData, setExportingData] = useState(false)

    // Populate from profile
    useEffect(() => {
        if (!profile) return
        setFullName(profile.full_name ?? '')
        setPhone(profile.phone ?? '')
        setCompany(profile.company_name ?? '')
        setAvatarPreview(profile.avatar_url ?? null)
        setCurrency(profile.currency ?? 'USD')
        setTimezone(profile.timezone ?? 'UTC')
        setDateFormat(profile.date_format ?? 'MM/DD/YYYY')
        if (profile.email_notifications) setNotifs(profile.email_notifications)
    }, [profile])

    // ── Avatar upload ─────────────────────────────────────────────────────────
    async function handleAvatarSelect(file: File | null) {
        if (!file) return
        if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }
        setAvatarFile(file)
        setAvatarPreview(URL.createObjectURL(file))
    }

    async function uploadAvatarAndSave(): Promise<string | null> {
        if (!avatarFile) return profile?.avatar_url ?? null
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null
        const ext = (avatarFile.name.split('.').pop() ?? 'jpg').toLowerCase()
        // RLS policy checks foldername[1] = auth.uid() — path must be exactly {uid}/avatar.{ext}
        const path = `${user.id}/avatar.${ext}`
        const { error } = await supabase.storage.from('avatars').upload(path, avatarFile, {
            upsert: true,
            cacheControl: '3600',
        })
        if (error) { toast.error('Avatar upload failed: ' + error.message); return null }
        const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
        return pub.publicUrl + `?t=${Date.now()}` // Cache bust
    }

    // ── Save Profile ──────────────────────────────────────────────────────────
    async function saveProfile() {
        if (!fullName.trim()) { toast.error('Full name is required'); return }
        setSavingProfile(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setSavingProfile(false); return }

        const avatarUrl = await uploadAvatarAndSave()

        // Only include optional fields when non-empty — prevents schema errors
        // if company_name / phone columns haven't been added yet via:
        //   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name text;
        //   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
        const updates: Record<string, unknown> = {
            id: user.id,
            full_name: fullName.trim(),
            ...(phone.trim() ? { phone: phone.trim() } : {}),
            ...(company.trim() ? { company_name: company.trim() } : {}),
            ...(avatarUrl !== null ? { avatar_url: avatarUrl } : {}),
        }

        const { error } = await supabase.from('profiles').upsert(updates)

        if (error) { toast.error(error.message); setSavingProfile(false); return }
        await refetch()
        toast.success('Profile saved ✓')
        setSavingProfile(false)
        setAvatarFile(null)
    }

    // ── Save Preferences ──────────────────────────────────────────────────────
    async function savePreferences() {
        setSavingPrefs(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setSavingPrefs(false); return }
        const { error } = await supabase.from('profiles').upsert({ id: user.id, currency, timezone, date_format: dateFormat })
        if (error) { toast.error(error.message); setSavingPrefs(false); return }
        await refetch()
        toast.success('Preferences saved ✓')
        setSavingPrefs(false)
    }

    // ── Save Notifications ────────────────────────────────────────────────────
    async function saveNotifications() {
        setSavingNotifs(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setSavingNotifs(false); return }
        const { error } = await supabase.from('profiles').upsert({ id: user.id, email_notifications: notifs })
        if (error) { toast.error(error.message); setSavingNotifs(false); return }
        await refetch()
        toast.success('Notification preferences saved ✓')
        setSavingNotifs(false)
    }

    // ── Change Password ───────────────────────────────────────────────────────
    async function changePassword() {
        if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return }
        if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return }
        setSavingPw(true)
        const { error } = await supabase.auth.updateUser({ password: newPassword })
        if (error) { toast.error(error.message); setSavingPw(false); return }
        toast.success('Password updated ✓')
        setNewPassword('')
        setConfirmPassword('')
        setSavingPw(false)
    }

    // ── Export Data ───────────────────────────────────────────────────────────
    async function exportData() {
        setExportingData(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setExportingData(false); return }

        const [props, tenants, rent, expenses, tickets, leases] = await Promise.all([
            supabase.from('properties').select('*').eq('user_id', user.id),
            supabase.from('tenants').select('*').eq('user_id', user.id),
            supabase.from('rent_payments').select('*').eq('user_id', user.id),
            supabase.from('expenses').select('*').eq('user_id', user.id),
            supabase.from('maintenance_tickets').select('*').eq('user_id', user.id),
            supabase.from('leases').select('*').eq('user_id', user.id),
        ])

        const sections = [
            { name: 'Properties', rows: props.data ?? [] },
            { name: 'Tenants', rows: tenants.data ?? [] },
            { name: 'Rent Payments', rows: rent.data ?? [] },
            { name: 'Expenses', rows: expenses.data ?? [] },
            { name: 'Maintenance Tickets', rows: tickets.data ?? [] },
            { name: 'Leases', rows: leases.data ?? [] },
        ]

        let csv = ''
        sections.forEach(({ name, rows }) => {
            csv += `\n# ${name}\n`
            if (rows.length === 0) { csv += 'No data\n'; return }
            const keys = Object.keys(rows[0])
            csv += keys.join(',') + '\n'
            rows.forEach(r => { csv += keys.map(k => JSON.stringify((r as any)[k] ?? '')).join(',') + '\n' })
        })

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `rentflow-export-${new Date().toISOString().split('T')[0]}.csv`
        a.click(); URL.revokeObjectURL(url)
        toast.success('Export downloaded ✓')
        setExportingData(false)
    }

    // ── Delete Account ────────────────────────────────────────────────────────
    async function deleteAccount() {
        if (deleteConfirmText !== 'DELETE') { toast.error('Type DELETE to confirm'); return }
        toast('Account deletion requires a server-side function — contact support.', { icon: '⚠️' })
        setShowDeleteModal(false)
    }

    // ── Render helpers ────────────────────────────────────────────────────────
    const displayName = profile?.full_name || email
    const initial = (profile?.full_name || email)?.[0]?.toUpperCase() ?? 'U'

    // ─── Tab content ──────────────────────────────────────────────────────────
    const TabContent = () => {
        switch (activeTab) {

            // ── Profile ───────────────────────────────────────────────────────
            case 'profile': return (
                <Card>
                    <SectionTitle>Profile Information</SectionTitle>
                    <p className="text-sm" style={{ color: 'var(--dash-muted)' }}>Your name and contact details visible in reports and tenant communications.</p>

                    {/* Avatar */}
                    <div className="flex items-center gap-5">
                        <div className="relative flex-shrink-0 cursor-pointer group" onClick={() => avatarRef.current?.click()}>
                            {avatarPreview
                                ? <img src={avatarPreview} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
                                : <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0" style={{ background: '#E8392A' }}>{initial}</div>
                            }
                            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--dash-text)' }}>{displayName || 'Your Name'}</p>
                            <p className="text-xs mb-3" style={{ color: 'var(--dash-muted)' }}>{email}</p>
                            <div className="flex gap-3">
                                <button onClick={() => avatarRef.current?.click()} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'var(--dash-nav-hover)', border: '1px solid var(--dash-border)', color: 'var(--dash-text)' }}>
                                    Change photo
                                </button>
                                {avatarPreview && (
                                    <button onClick={() => { setAvatarPreview(null); setAvatarFile(null) }} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ color: '#E8392A', border: '1px solid rgba(232,57,42,0.3)' }}>
                                        Remove
                                    </button>
                                )}
                            </div>
                            <input ref={avatarRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => handleAvatarSelect(e.target.files?.[0] ?? null)} />
                        </div>
                    </div>

                    {/* Name + Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={LABEL} style={labelStyle}>Full Name *</label>
                            <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Smith" className={`${INPUT} ${focusClass}`} style={inputStyle} />
                        </div>
                        <div>
                            <label className={LABEL} style={labelStyle}>Email Address</label>
                            <input value={email} disabled className={`${INPUT} opacity-50 cursor-not-allowed`} style={inputStyle} />
                            <p className="text-xs mt-1" style={{ color: 'var(--dash-muted)' }}>Email cannot be changed here.</p>
                        </div>
                    </div>

                    {/* Phone + Company */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={LABEL} style={labelStyle}>Phone Number</label>
                            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className={`${INPUT} ${focusClass}`} style={inputStyle} />
                        </div>
                        <div>
                            <label className={LABEL} style={labelStyle}>Company / Business Name</label>
                            <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Smith Properties LLC" className={`${INPUT} ${focusClass}`} style={inputStyle} />
                        </div>
                    </div>

                    <SaveButton loading={savingProfile} onClick={saveProfile}>Save Profile</SaveButton>
                </Card>
            )

            // ── Preferences ───────────────────────────────────────────────────
            case 'preferences': return (
                <Card>
                    <SectionTitle>Display Preferences</SectionTitle>
                    <p className="text-sm" style={{ color: 'var(--dash-muted)' }}>These settings affect how dates, currencies, and times are displayed across the app.</p>
                    <CustomSelect label="Currency" value={currency} onChange={setCurrency} options={['USD — US Dollar', 'EUR — Euro', 'GBP — British Pound', 'AUD — Australian Dollar', 'CAD — Canadian Dollar', 'INR — Indian Rupee', 'AED — UAE Dirham']} />
                    <CustomSelect label="Timezone" value={timezone} onChange={setTimezone} options={['UTC', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Kolkata', 'Asia/Dubai', 'Australia/Sydney']} />
                    <CustomSelect label="Date Format" value={dateFormat} onChange={setDateFormat} options={['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']} />
                    <SaveButton loading={savingPrefs} onClick={savePreferences}>Save Preferences</SaveButton>
                </Card>
            )

            // ── Notifications ─────────────────────────────────────────────────
            case 'notifications': return (
                <Card>
                    <SectionTitle>Email Notifications</SectionTitle>
                    <p className="text-sm" style={{ color: 'var(--dash-muted)' }}>Choose which events trigger email alerts. Email delivery powered by Resend (Phase 9).</p>
                    <div className="space-y-4 pt-2">
                        {[
                            { key: 'rent_due', label: 'Rent Due Reminder', desc: 'Email 3 days before rent is due' },
                            { key: 'payment_received', label: 'Payment Received', desc: 'Email when a tenant payment is marked as paid' },
                            { key: 'maintenance_update', label: 'Maintenance Updates', desc: 'Email when a ticket status changes' },
                            { key: 'lease_expiry', label: 'Lease Expiry Alert', desc: 'Email 60 days before a lease expires' },
                        ].map(({ key, label, desc }) => (
                            <div key={key} className="flex items-center justify-between gap-4 w-full py-3" style={{ borderBottom: '1px solid var(--dash-divider)' }}>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium" style={{ color: 'var(--dash-text)' }}>{label}</p>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--dash-muted)' }}>{desc}</p>
                                </div>
                                <Toggle
                                    checked={notifs[key as keyof typeof notifs]}
                                    onChange={v => setNotifs(n => ({ ...n, [key]: v }))}
                                />
                            </div>
                        ))}
                    </div>
                    <SaveButton loading={savingNotifs} onClick={saveNotifications}>Save Notification Preferences</SaveButton>
                </Card>
            )

            // ── Security ──────────────────────────────────────────────────────
            case 'security': return (
                <div className="space-y-5">
                    <Card>
                        <SectionTitle>Change Password</SectionTitle>
                        <div className="space-y-4">
                            <div>
                                <label className={LABEL} style={labelStyle}>New Password</label>
                                <div className="relative">
                                    <input type={showNewPw ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 8 characters" className={`${INPUT} ${focusClass} pr-12`} style={inputStyle} />
                                    <button onClick={() => setShowNewPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--dash-muted)' }}>
                                        {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className={LABEL} style={labelStyle}>Confirm New Password</label>
                                <div className="relative">
                                    <input type={showConfirmPw ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className={`${INPUT} ${focusClass} pr-12`} style={inputStyle} />
                                    <button onClick={() => setShowConfirmPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--dash-muted)' }}>
                                        {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {confirmPassword && newPassword !== confirmPassword && (
                                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#E8392A' }}><X className="w-3 h-3" /> Passwords don't match</p>
                                )}
                                {confirmPassword && newPassword === confirmPassword && newPassword.length >= 8 && (
                                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#22C55E' }}><Check className="w-3 h-3" /> Passwords match</p>
                                )}
                            </div>
                        </div>
                        <SaveButton loading={savingPw} onClick={changePassword}>Update Password</SaveButton>
                    </Card>

                    <Card>
                        <SectionTitle>Active Sessions</SectionTitle>
                        <p className="text-sm" style={{ color: 'var(--dash-muted)' }}>You are currently signed in on this device. To protect your account, you can sign out all other sessions.</p>
                        <button
                            onClick={async () => {
                                await supabase.auth.signOut({ scope: 'others' })
                                toast.success('Signed out of all other sessions')
                            }}
                            className="mt-1 px-4 py-2.5 rounded-xl text-sm font-semibold"
                            style={{ border: '1px solid var(--dash-border)', color: 'var(--dash-text)', background: 'var(--dash-nav-hover)' }}
                        >
                            Sign out of all other sessions
                        </button>
                    </Card>
                </div>
            )

            // ── Plan & Billing ────────────────────────────────────────────────
            case 'billing': {
                const plan = profile?.plan ?? 'free'
                const isPro = plan === 'pro' || plan === 'business'
                const FREE_FEATURES = ['1 property', 'Up to 5 tenants', 'Basic rent tracking', 'Maintenance tickets']
                const PRO_FEATURES = ['Unlimited properties', 'Unlimited tenants', 'CSV + PDF exports', 'Email reminders', 'Lease document storage']
                return (
                    <Card>
                        <div className="flex items-center gap-3 mb-2">
                            <SectionTitle>Current Plan</SectionTitle>
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize" style={{ background: isPro ? 'rgba(232,57,42,0.12)' : 'var(--dash-nav-hover)', color: isPro ? '#E8392A' : 'var(--dash-muted)', border: `1px solid ${isPro ? 'rgba(232,57,42,0.3)' : 'var(--dash-border)'}` }}>
                                {plan.charAt(0).toUpperCase() + plan.slice(1)}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Free */}
                            <div className="rounded-xl p-5 space-y-3" style={{ background: 'var(--dash-nav-hover)', border: `2px solid ${!isPro ? '#E8392A' : 'var(--dash-border)'}` }}>
                                <p className="font-bold text-sm" style={{ color: 'var(--dash-text)' }}>Free</p>
                                <p className="text-2xl font-bold" style={{ color: 'var(--dash-text)' }}>$0<span className="text-xs font-normal ml-1" style={{ color: 'var(--dash-muted)' }}>/mo</span></p>
                                <ul className="space-y-1.5">
                                    {FREE_FEATURES.map(f => (
                                        <li key={f} className="flex items-center gap-2 text-xs" style={{ color: 'var(--dash-muted)' }}>
                                            <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#22C55E' }} />{f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            {/* Pro */}
                            <div className="rounded-xl p-5 space-y-3" style={{ background: 'var(--dash-nav-hover)', border: `2px solid ${isPro ? '#E8392A' : 'var(--dash-border)'}` }}>
                                <p className="font-bold text-sm" style={{ color: 'var(--dash-text)' }}>Pro</p>
                                <p className="text-2xl font-bold" style={{ color: 'var(--dash-text)' }}>$19<span className="text-xs font-normal ml-1" style={{ color: 'var(--dash-muted)' }}>/mo</span></p>
                                <ul className="space-y-1.5">
                                    {PRO_FEATURES.map(f => (
                                        <li key={f} className="flex items-center gap-2 text-xs" style={{ color: 'var(--dash-muted)' }}>
                                            <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#E8392A' }} />{f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        {!isPro && (
                            <button disabled className="w-full py-3 rounded-xl text-sm font-semibold text-white opacity-60 cursor-not-allowed mt-2" style={{ background: '#E8392A' }}>
                                Upgrade to Pro — $19/mo (Coming in Phase 9 · Stripe)
                            </button>
                        )}
                    </Card>
                )
            }

            // ── Danger Zone ───────────────────────────────────────────────────
            case 'danger': return (
                <div className="space-y-5">
                    {/* Export */}
                    <Card>
                        <SectionTitle>Export My Data</SectionTitle>
                        <p className="text-sm" style={{ color: 'var(--dash-muted)' }}>Download all your properties, tenants, rent, and expense records as a CSV file.</p>
                        <button onClick={exportData} disabled={exportingData} className="mt-1 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80" style={{ border: '1px solid var(--dash-border)', color: 'var(--dash-text)', background: 'var(--dash-nav-hover)' }}>
                            {exportingData ? 'Exporting...' : 'Export All Data'}
                        </button>
                    </Card>

                    {/* Delete account */}
                    <Card>
                        <SectionTitle>Delete Account</SectionTitle>
                        <p className="text-sm" style={{ color: 'var(--dash-muted)' }}>Permanently delete your account and all associated data. This action cannot be undone.</p>
                        <button onClick={() => setShowDeleteModal(true)} className="mt-1 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-red-50 dark:hover:bg-red-900/10" style={{ border: '1px solid #E8392A', color: '#E8392A' }}>
                            Delete Account
                        </button>
                    </Card>

                    {/* Delete modal */}
                    {showDeleteModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
                            <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}>
                                <h3 className="text-lg font-bold mb-2" style={{ color: '#E8392A' }}>Delete Account</h3>
                                <p className="text-sm mb-4" style={{ color: 'var(--dash-muted)' }}>This will permanently delete all your data. Type <strong>DELETE</strong> to confirm.</p>
                                <input
                                    value={deleteConfirmText}
                                    onChange={e => setDeleteConfirmText(e.target.value)}
                                    placeholder="Type DELETE"
                                    className={`${INPUT} ${focusClass} mb-4`}
                                    style={inputStyle}
                                />
                                <div className="flex gap-3">
                                    <button onClick={() => { setShowDeleteModal(false); setDeleteConfirmText('') }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'var(--dash-nav-hover)', border: '1px solid var(--dash-border)', color: 'var(--dash-text)' }}>
                                        Cancel
                                    </button>
                                    <button onClick={deleteAccount} disabled={deleteConfirmText !== 'DELETE'} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40" style={{ background: '#E8392A' }}>
                                        Delete Forever
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )

            default: return null
        }
    }

    return (
        <div className="w-full max-w-5xl mx-auto px-6 py-6">
            <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--dash-text)' }}>Settings</h1>

            <div className="flex flex-col md:flex-row gap-6">
                {/* ── Left tab nav ── */}
                <nav className="flex-shrink-0 md:w-52 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0">
                    {TABS.map(({ id, label, icon: Icon, danger }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left whitespace-nowrap transition-all w-full"
                            style={{
                                background: activeTab === id ? 'var(--dash-nav-active-bg)' : 'transparent',
                                color: danger ? '#E8392A' : activeTab === id ? 'var(--dash-text)' : 'var(--dash-nav-inactive)',
                                borderLeft: activeTab === id ? '2px solid #E8392A' : '2px solid transparent',
                            }}
                        >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            {label}
                        </button>
                    ))}
                </nav>

                {/* ── Right content ── */}
                <div className="flex-1 min-w-0">
                    <TabContent />
                </div>
            </div>
        </div>
    )
}
