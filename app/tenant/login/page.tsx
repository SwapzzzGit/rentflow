'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, Home } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TenantLoginPage() {
    const supabase = createClient()
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)

    // If already authed, redirect
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) router.push('/tenant/dashboard')
        })
    }, [supabase, router])

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        if (!email || !password) { toast.error('Please enter email and password'); return }
        setLoading(true)
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
            toast.error(error.message)
            setLoading(false)
            return
        }
        router.push('/tenant/dashboard')
    }

    const inputCls = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-red-500/20 focus:border-[#E8392A]"
    const inputStyle = { background: '#F9FAFB', border: '1.5px solid #E5E7EB', color: '#111' }

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #FFF5F4 0%, #FFFFFF 50%, #F8F9FF 100%)' }}>
            <div className="w-full max-w-sm">
                {/* Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 text-white text-2xl font-bold shadow-lg" style={{ background: 'linear-gradient(135deg, #E8392A, #c9281a)' }}>R</div>
                    <h1 className="text-2xl font-bold mb-1" style={{ color: '#111', fontFamily: 'var(--font-bricolage, serif)' }}>Tenant Portal</h1>
                    <p className="text-sm" style={{ color: '#6B7280' }}>Sign in to view your rent, lease & maintenance</p>
                </div>

                {/* Card */}
                <div className="rounded-2xl p-7 shadow-xl" style={{ background: 'white', border: '1px solid #F0F0F5' }}>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>Email address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className={inputCls}
                                style={inputStyle}
                                autoComplete="email"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>Password</label>
                            <div className="relative">
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Your password"
                                    className={`${inputCls} pr-12`}
                                    style={inputStyle}
                                    autoComplete="current-password"
                                />
                                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{ color: '#9CA3AF' }}>
                                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                            style={{ background: 'linear-gradient(135deg, #E8392A, #c9281a)' }}
                        >
                            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : 'Sign in'}
                        </button>
                    </form>
                </div>

                {/* Footer help */}
                <div className="mt-5 text-center space-y-2">
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>
                        Don&apos;t have access?{' '}
                        <span className="font-medium" style={{ color: '#6B7280' }}>Request an invite from your landlord.</span>
                    </p>
                    <p className="text-xs" style={{ color: '#D1D5DB' }}>
                        Your first login uses the link sent to your email.
                    </p>
                </div>
            </div>
        </div>
    )
}
