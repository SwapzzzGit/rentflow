'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'

export default function ResetPasswordPage() {
    const supabase = createClient()
    const router = useRouter()

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [sessionReady, setSessionReady] = useState(false)

    // The auth callback already exchanged the code for a session.
    // We just need to confirm a session exists before showing the form.
    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
                setSessionReady(true)
            } else {
                // No session — the link may have expired or already been used
                setError('This password reset link has expired or already been used. Please request a new one.')
            }
        })
    }, [supabase])

    async function handleUpdatePassword(e: React.FormEvent) {
        e.preventDefault()
        setError('')

        if (password.length < 8) {
            setError('Password must be at least 8 characters.')
            return
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.')
            return
        }

        setLoading(true)
        const { error } = await supabase.auth.updateUser({ password })
        setLoading(false)

        if (error) {
            setError(error.message)
        } else {
            setSuccess(true)
            // Small delay so the user can see the success state
            setTimeout(() => router.replace('/dashboard'), 2500)
        }
    }

    const inputStyle: React.CSSProperties = {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-[#080808] relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#E8392A] opacity-[0.04] blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-[#E8392A] opacity-[0.03] blur-[100px]" />
            </div>

            <div className="w-full max-w-md relative z-10">
                <div
                    className="rounded-2xl p-6 border"
                    style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
                >
                    {/* Logo */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <div className="w-8 h-8 bg-[#E8392A] rounded-lg flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                                <path d="M3 14V7.5L9 3L15 7.5V14C15 14.55 14.55 15 14 15H10.5V11H7.5V15H4C3.45 15 3 14.55 3 14Z" fill="white" />
                            </svg>
                        </div>
                        <span className="text-lg font-bold text-white tracking-tight" style={{ fontFamily: 'var(--font-bricolage)' }}>
                            RentFlow
                        </span>
                    </div>

                    {success ? (
                        <div className="text-center py-4">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}>
                                <CheckCircle2 className="w-6 h-6 text-[#22C55E]" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-bricolage)' }}>Password updated!</h2>
                            <p className="text-[#666666] text-sm">Redirecting you to the dashboard…</p>
                        </div>
                    ) : !sessionReady ? (
                        <div className="text-center py-4">
                            {error ? (
                                <>
                                    <div className="rounded-xl px-4 py-3 text-sm text-[#FF6B55] mb-4" style={{ background: 'rgba(232,57,42,0.1)', border: '1px solid rgba(232,57,42,0.2)' }}>
                                        {error}
                                    </div>
                                    <a href="/forgot-password" className="text-sm text-[#E8392A] hover:text-[#FF6B55] transition-colors font-medium">
                                        Request a new reset link →
                                    </a>
                                </>
                            ) : (
                                <div className="flex items-center justify-center gap-2 text-[#666666] text-sm">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Verifying link…
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="mb-5">
                                <h1 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-bricolage)' }}>
                                    Set new password
                                </h1>
                                <p className="text-sm text-[#666666]">Choose a strong password for your RentFlow account.</p>
                            </div>

                            <form onSubmit={handleUpdatePassword} className="flex flex-col gap-3">
                                {/* New Password */}
                                <div>
                                    <label className="block text-xs font-medium text-[#888888] mb-1 uppercase tracking-wider">New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444444]" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Min. 8 characters"
                                            required
                                            className="w-full pl-10 pr-11 py-2.5 rounded-xl text-white placeholder-[#444444] text-sm outline-none transition-all"
                                            style={inputStyle}
                                            onFocus={(e) => { e.target.style.borderColor = '#E8392A'; e.target.style.boxShadow = '0 0 0 1px #E8392A' }}
                                            onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }}
                                            suppressHydrationWarning
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#444444] hover:text-white transition-colors"
                                            suppressHydrationWarning
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-xs font-medium text-[#888888] mb-1 uppercase tracking-wider">Confirm Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444444]" />
                                        <input
                                            type={showConfirm ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Repeat your password"
                                            required
                                            className="w-full pl-10 pr-11 py-2.5 rounded-xl text-white placeholder-[#444444] text-sm outline-none transition-all"
                                            style={inputStyle}
                                            onFocus={(e) => { e.target.style.borderColor = '#E8392A'; e.target.style.boxShadow = '0 0 0 1px #E8392A' }}
                                            onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }}
                                            suppressHydrationWarning
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(!showConfirm)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#444444] hover:text-white transition-colors"
                                            suppressHydrationWarning
                                        >
                                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Error */}
                                {error && (
                                    <div className="rounded-xl px-4 py-2.5 text-sm text-[#FF6B55]" style={{ background: 'rgba(232,57,42,0.1)', border: '1px solid rgba(232,57,42,0.2)' }}>
                                        {error}
                                    </div>
                                )}

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold text-white transition-all mt-1"
                                    style={{ background: loading ? '#555' : '#E8392A' }}
                                    onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#FF6B55' }}
                                    onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#E8392A' }}
                                    suppressHydrationWarning
                                >
                                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating password…</> : <>Update Password <ArrowRight className="w-4 h-4" /></>}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
