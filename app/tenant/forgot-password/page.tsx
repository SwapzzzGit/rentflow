'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Home, Mail, Loader2, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function TenantForgotPasswordPage() {
    const supabase = createClient()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    async function handleReset(e: React.FormEvent) {
        e.preventDefault()
        if (!email) { toast.error('Please enter your email address'); return }

        setLoading(true)
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/tenant/set-password`,
        })

        if (error) {
            toast.error('Could not send reset email. Please check the address and try again.')
            setLoading(false)
            return
        }

        setSuccess(true)
        setLoading(false)
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{
                background: '#080808',
                backgroundImage: 'radial-gradient(ellipse 70% 40% at 50% -5%, rgba(232,57,42,0.12) 0%, transparent 60%)',
            }}
        >
            <div className="w-full max-w-md">
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
                    {!success ? (
                        <>
                            <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-serif)' }}>Reset your password</h1>
                            <p className="text-sm mb-7" style={{ color: '#9CA3AF' }}>Enter your email and we will send you a reset link.</p>

                            <form onSubmit={handleReset} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>Email address</label>
                                    <input
                                        key="forgot-password-email"
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-red-500/20"
                                        style={inputStyle}
                                        autoComplete="email"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                                    style={{ background: '#E8392A' }}
                                >
                                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : 'Send Reset Link'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="w-8 h-8 text-green-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-serif)' }}>Check your email</h2>
                            <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>
                                We sent a password reset link to <strong className="text-white">{email}</strong>.
                                Click the link in the email to set a new password.
                            </p>
                            <p className="text-xs mb-8" style={{ color: '#4B5563' }}>
                                Did not receive it? Check your spam folder.
                            </p>
                        </div>
                    )}

                    <Link
                        href="/tenant/login"
                        className="text-sm text-gray-400 hover:text-white transition block text-center mt-4"
                    >
                        ← Back to Sign in
                    </Link>
                </div>
            </div>
        </div>
    )
}

const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1.5px solid rgba(255,255,255,0.08)',
    color: '#fff',
}
