'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Home, Lock, Eye, EyeOff, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

// Shared dark page shell with red glow
const Shell = ({ children }: { children: React.ReactNode }) => (
    <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
            background: '#080808',
            backgroundImage: 'radial-gradient(ellipse 70% 40% at 50% -5%, rgba(232,57,42,0.12) 0%, transparent 60%)',
        }}
    >
        {children}
    </div>
)

const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1.5px solid rgba(255,255,255,0.08)',
    color: '#fff',
}

export default function SetPasswordPage() {
    const supabase = createClient()
    const router = useRouter()
    const [verifying, setVerifying] = useState(true)
    const [sessionReady, setSessionReady] = useState(false)
    const [isResetFlow, setIsResetFlow] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        let isMounted = true

        const checkInitialSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (session && isMounted) {
                    setSessionReady(true)
                    setVerifying(false)
                }
            } catch (err) {
                console.error('[set-password] getSession error:', err)
            }
        }

        checkInitialSession()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!isMounted) return
            if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
                if (session) {
                    setSessionReady(true)
                    setVerifying(false)
                    if (event === 'PASSWORD_RECOVERY') setIsResetFlow(true)
                }
            }
        })

        const timer = setTimeout(() => {
            if (isMounted && !sessionReady) {
                setVerifying(false)
                setError('Link expired or invalid. Please request a new one if needed.')
            }
        }, 5000)

        return () => {
            isMounted = false
            subscription.unsubscribe()
            clearTimeout(timer)
        }
    }, [supabase, sessionReady])

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
        if (password !== confirmPassword) { toast.error('Passwords do not match'); return }
        setSubmitting(true)
        try {
            const { error: updateErr } = await supabase.auth.updateUser({ password })
            if (updateErr) throw updateErr
            setSuccess(true)
            toast.success('Password set successfully!')
            setTimeout(() => router.push('/tenant/dashboard'), 2000)
        } catch (err: any) {
            toast.error(err.message || 'Failed to update password')
            setSubmitting(false)
        }
    }

    if (verifying) {
        return (
            <Shell>
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#E8392A' }} />
                    <p className="text-sm font-medium" style={{ color: '#9CA3AF' }}>Verifying your invite link…</p>
                </div>
            </Shell>
        )
    }

    if (error && !sessionReady) {
        return (
            <Shell>
                <div className="w-full max-w-md rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(232,57,42,0.1)' }}>
                        <XCircle className="w-7 h-7" style={{ color: '#E8392A' }} />
                    </div>
                    <h1 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-serif)' }}>Invite Link Error</h1>
                    <p className="text-sm mb-7" style={{ color: '#9CA3AF' }}>{error}</p>
                    <button
                        onClick={() => router.push('/tenant/login')}
                        className="w-full py-3 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-85"
                        style={{ background: '#E8392A' }}
                    >
                        Back to Login
                    </button>
                </div>
            </Shell>
        )
    }

    if (success) {
        return (
            <Shell>
                <div className="w-full max-w-md rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(34,197,94,0.1)' }}>
                        <CheckCircle2 className="w-7 h-7" style={{ color: '#22C55E' }} />
                    </div>
                    <h1 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-serif)' }}>Password Set!</h1>
                    <p className="text-sm mb-1" style={{ color: '#9CA3AF' }}>Your account is ready.</p>
                    <p className="text-xs mb-6" style={{ color: '#555' }}>Taking you to your dashboard…</p>
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" style={{ color: '#22C55E' }} />
                </div>
            </Shell>
        )
    }

    return (
        <Shell>
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="flex items-center gap-2.5 mb-8 justify-center">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#E8392A' }}>
                        <Home className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-serif)' }}>RentFlow</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(232,57,42,0.15)', color: '#E8392A', border: '1px solid rgba(232,57,42,0.3)' }}>
                        Tenant Portal
                    </span>
                </div>

                {/* Card */}
                <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
                        {isResetFlow ? 'Set a new password' : 'Welcome to RentFlow'}
                    </h1>
                    <p className="text-sm mb-7" style={{ color: '#9CA3AF' }}>
                        {isResetFlow ? 'Enter and confirm your new password below.' : 'Set a secure password for your tenant account.'}
                    </p>

                    <form onSubmit={handleSetPassword} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>New Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="w-4 h-4" style={{ color: '#6B7280' }} />
                                </div>
                                <input
                                    key="password-input"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    minLength={8}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-12 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-red-500/20"
                                    style={inputStyle}
                                    placeholder="Min 8 characters"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center" style={{ color: '#6B7280' }}>
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>Confirm Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="w-4 h-4" style={{ color: '#6B7280' }} />
                                </div>
                                <input
                                    key="confirm-password-input"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    minLength={8}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-11 pr-12 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-red-500/20"
                                    style={inputStyle}
                                    placeholder="Repeat your password"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                            style={{ background: '#E8392A' }}
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Set Password'}
                        </button>
                    </form>

                    <p className="text-xs text-center mt-6" style={{ color: '#4B5563' }}>
                        Use at least 8 characters — mix of letters, numbers &amp; symbols.
                    </p>
                </div>
            </div>
        </Shell>
    )
}
