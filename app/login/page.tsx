'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'

export default function LoginPage() {
    const router = useRouter()
    const supabase = createClient()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        const { error } = await supabase.auth.signInWithPassword({ email, password })
        setLoading(false)

        if (error) {
            setError(error.message)
        } else {
            router.push('/dashboard')
            router.refresh()
        }
    }

    async function handleGoogleLogin() {
        setGoogleLoading(true)
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/auth/callback` },
        })
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

                    <div className="mb-5">
                        <h1 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-bricolage)' }}>
                            Welcome back
                        </h1>
                        <p className="text-sm text-[#666666]">Sign in to your RentFlow account.</p>
                    </div>

                    {/* Google OAuth */}
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={googleLoading}
                        className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl text-sm font-medium text-white transition-all mb-4"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                        suppressHydrationWarning
                    >
                        {googleLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                        )}
                        Continue with Google
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                        <span className="text-xs text-[#444444] font-medium">OR</span>
                        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                    </div>

                    <form onSubmit={handleLogin} className="flex flex-col gap-3">
                        {/* Email */}
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

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-medium text-[#888888] uppercase tracking-wider">Password</label>
                                <Link href="/forgot-password" className="text-xs text-[#555555] hover:text-[#E8392A] transition-colors">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444444]" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Your password"
                                    required
                                    className="w-full pl-10 pr-11 py-2.5 rounded-xl text-white placeholder-[#444444] text-sm outline-none transition-all"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
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
                            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#FF6B55' }}
                            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#E8392A' }}
                            suppressHydrationWarning
                        >
                            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : <>Log In <ArrowRight className="w-4 h-4" /></>}
                        </button>
                    </form>

                    <p className="text-center text-sm text-[#555555] mt-4">
                        Don&apos;t have an account?{' '}
                        <Link href="/signup" className="text-white hover:text-[#E8392A] transition-colors font-medium">
                            Sign up →
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
