'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, Home } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import type { Session } from '@supabase/supabase-js'

export default function TenantLoginPage() {
    const supabase = createClient()
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)

    // undefined = still checking, null = not authed, Session = already in
    const [session, setSession] = useState<Session | null | undefined>(undefined)

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session ?? null)
        })
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
            setSession(s ?? null)
        })
        return () => subscription.unsubscribe()
    }, [supabase])

    // Already authed → send to dashboard
    if (session === undefined) return <div className="min-h-screen" style={{ background: '#080808' }} />
    if (session !== null) {
        router.replace('/tenant/dashboard')
        return null
    }

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        if (!email || !password) { toast.error('Please enter email and password'); return }
        setLoading(true)
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) { toast.error(error.message); setLoading(false); return }
        router.push('/tenant/dashboard')
    }

    const inputStyle = {
        background: 'rgba(255,255,255,0.05)',
        border: '1.5px solid rgba(255,255,255,0.08)',
        color: '#fff',
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{
                background: '#080808',
                backgroundImage: 'radial-gradient(ellipse 70% 40% at 50% -5%, rgba(232,57,42,0.12) 0%, transparent 60%)',
            }}
        >
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
                    <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-serif)' }}>Sign in</h1>
                    <p className="text-sm mb-7" style={{ color: '#9CA3AF' }}>View your rent, lease &amp; maintenance</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>Email address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-red-500/20"
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
                                    className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-red-500/20"
                                    style={inputStyle}
                                    autoComplete="current-password"
                                />
                                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{ color: '#9CA3AF' }}>
                                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <Link
                                href="/tenant/forgot-password"
                                className="text-xs text-gray-400 hover:text-white transition text-right block mt-1 mb-4"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                            style={{ background: '#E8392A' }}
                        >
                            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : 'Sign in'}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="mt-5 text-center space-y-2">
                    <p className="text-xs" style={{ color: '#4B5563' }}>
                        Don&apos;t have access?{' '}
                        <span style={{ color: '#6B7280' }}>Request an invite from your landlord.</span>
                    </p>
                    <p className="text-xs" style={{ color: '#374151' }}>
                        Are you a landlord?{' '}
                        <Link href="/login" className="font-semibold transition-opacity hover:opacity-80" style={{ color: '#E8392A' }}>
                            Log in here →
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
