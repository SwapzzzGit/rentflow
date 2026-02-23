'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Shield, Lock, Eye, EyeOff, Loader2, CheckCircle2, XCircle, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SetPasswordPage() {
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [verifying, setVerifying] = useState(true)
    const [sessionReady, setSessionReady] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        let isMounted = true

        const checkSession = async () => {
            try {
                // Supabase createBrowserClient automatically parses hash fragments 
                // and establishes session if tokens are in the URL.
                const { data: { session } } = await supabase.auth.getSession()

                if (session && isMounted) {
                    setSessionReady(true)
                    setVerifying(false)
                }
            } catch (err) {
                console.error('[set-password] Session check error:', err)
            }
        }

        // 1. Initial check
        checkSession()

        // 2. Listen for auth state changes (Supabase establishes session from hash asynchronously)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!isMounted) return

            console.log('[set-password] Auth event:', event)

            if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
                if (session) {
                    setSessionReady(true)
                    setVerifying(false)
                }
            }
        })

        // 3. Timeout if no session established after 3 seconds
        const timer = setTimeout(() => {
            if (isMounted && !sessionReady) {
                setVerifying(false)
                setError('Invalid or expired invite link. Please ask your landlord to send a new invite.')
            }
        }, 3500)

        return () => {
            isMounted = false
            subscription.unsubscribe()
            clearTimeout(timer)
        }
    }, [supabase.auth, sessionReady])

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password.length < 8) {
            toast.error('Password must be at least 8 characters')
            return
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        setSubmitting(true)
        try {
            const { error: updateErr } = await supabase.auth.updateUser({
                password: password
            })

            if (updateErr) throw updateErr

            setSuccess(true)
            toast.success('Password set successfully!')

            // Redirect after 2 seconds
            setTimeout(() => {
                router.push('/tenant/dashboard')
            }, 2000)
        } catch (err: any) {
            toast.error(err.message || 'Failed to update password')
            setSubmitting(false)
        }
    }

    if (verifying) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-black">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Verifying your invite link...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-black">
                <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-lg text-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Invite Link Error</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                        {error}
                    </p>
                    <button
                        onClick={() => router.push('/tenant/login')}
                        className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-sm font-semibold transition-colors text-gray-900 dark:text-white"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-black">
                <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-lg text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Password Set!</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">Your account is now ready.</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">Taking you to your dashboard...</p>
                    <div className="mt-8 flex justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-black font-sans">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-lg">
                {/* Logo Section */}
                <div className="flex items-center gap-2.5 mb-8">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white" style={{ fontFamily: 'var(--font-bricolage)' }}>RentFlow</span>
                        <p className="text-[10px] uppercase tracking-widest text-blue-600 dark:text-blue-400 font-bold">Tenant Portal</p>
                    </div>
                </div>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome to RentFlow</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Please set a secure password for your tenant account.</p>
                </div>

                <form onSubmit={handleSetPassword} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">New Password</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength={8}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-11 pr-12 py-3.5 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none border"
                                placeholder="Min 8 characters"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Confirm Password</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength={8}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full pl-11 pr-12 py-3.5 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none border"
                                placeholder="Repeat your password"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 group"
                    >
                        {submitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                Set Password
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Password must be at least 8 characters long and include numbers or special characters for extra security.
                    </p>
                </div>
            </div>
        </div>
    )
}
