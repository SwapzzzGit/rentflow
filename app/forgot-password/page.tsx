'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Mail, ArrowRight, Loader2, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
    const supabase = createClient()

    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    async function handleReset(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        })
        setLoading(false)

        if (error) {
            setError(error.message)
        } else {
            setSuccess(true)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-[#080808] relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#E8392A] opacity-[0.04] blur-[120px]" />
            </div>

            <div className="w-full max-w-md relative z-10">
                <div
                    className="rounded-2xl p-6 border"
                    style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
                >
                    {/* Logo inside card */}
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

                    {!success ? (
                        <>
                            <div className="mb-5">
                                <h1 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-bricolage)' }}>
                                    Reset your password
                                </h1>
                                <p className="text-sm text-[#666666]">Enter your email and we&apos;ll send you a reset link.</p>
                            </div>

                            <form onSubmit={handleReset} className="flex flex-col gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-[#888888] mb-1 uppercase tracking-wider">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444444]" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            required
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-white placeholder-[#444444] text-sm outline-none transition-all"
                                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                                            onFocus={(e) => { e.target.style.borderColor = '#E8392A'; e.target.style.boxShadow = '0 0 0 1px #E8392A' }}
                                            onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }}
                                            suppressHydrationWarning
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="rounded-xl px-4 py-2.5 text-sm text-[#FF6B55]" style={{ background: 'rgba(232,57,42,0.1)', border: '1px solid rgba(232,57,42,0.2)' }}>
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold text-white transition-all mt-1"
                                    style={{ background: loading ? '#555' : '#E8392A' }}
                                    onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#FF6B55' }}
                                    onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#E8392A' }}
                                    suppressHydrationWarning
                                >
                                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending link...</> : <>Send Reset Link <ArrowRight className="w-4 h-4" /></>}
                                </button>
                            </form>

                            <div className="mt-4 text-center">
                                <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-[#555555] hover:text-white transition-colors">
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    Back to login
                                </Link>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-2">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}>
                                <Mail className="w-6 h-6 text-[#22C55E]" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-bricolage)' }}>Reset link sent</h2>
                            <p className="text-[#666666] text-sm leading-relaxed mb-5">
                                We sent a reset link to <span className="text-white font-medium">{email}</span>. Check your inbox and click the link to set a new password.
                            </p>
                            <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-[#E8392A] hover:text-[#FF6B55] transition-colors font-medium">
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Back to login
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
