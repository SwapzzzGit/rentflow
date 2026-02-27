'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Home, DollarSign, Wrench, FileText, LogOut, Menu, X } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'

const NAV = [
    { href: '/tenant/dashboard', label: 'Dashboard', icon: Home },
    { href: '/tenant/rent', label: 'Rent', icon: DollarSign },
    { href: '/tenant/maintenance', label: 'Maintenance', icon: Wrench },
    { href: '/tenant/lease', label: 'Lease', icon: FileText },
]

export default function TenantLayout({ children }: { children: React.ReactNode }) {
    const supabase = createClient()
    const router = useRouter()
    const pathname = usePathname()
    const [tenantName, setTenantName] = useState('')
    const [mobileOpen, setMobileOpen] = useState(false)

    // undefined = still checking, null = no session, Session = authed
    const [session, setSession] = useState<Session | null | undefined>(undefined)

    useEffect(() => {
        // 1. Get current session immediately
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session ?? null)
        })

        // 2. Keep in sync with any auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
            setSession(s ?? null)
        })

        return () => subscription.unsubscribe()
    }, [supabase])

    // Load tenant name once session is confirmed
    useEffect(() => {
        if (!session) return
        supabase
            .from('tenants')
            .select('full_name')
            .eq('portal_user_id', session.user.id)
            .single()
            .then(({ data }) => { if (data) setTenantName(data.full_name) })
    }, [session, supabase])

    async function signOut() {
        await supabase.auth.signOut()
        router.push('/tenant/login')
    }

    // ── Auth & Route Protection ──
    const isAuthPage = pathname === '/tenant/login' || pathname === '/tenant/forgot-password' || pathname === '/tenant/set-password'

    useEffect(() => {
        if (session === null && !isAuthPage) {
            router.replace('/tenant/login')
        }
    }, [session, router, isAuthPage])

    // ── 1. If it's an auth page, just render it immediately (they handle their own auth redirects/shells) ──
    if (isAuthPage) {
        return <>{children}</>
    }

    // ── 2. Still checking session: show blank screen (warm stone) ──
    if (session === undefined) {
        return <div className="min-h-screen" style={{ background: '#F5F4F0' }} />
    }

    // ── 3. Definitely no session: return null (useEffect will handle the redirect) ──
    if (session === null) {
        return null
    }

    const initials = tenantName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)

    return (
        <div className="min-h-screen" style={{ background: '#F5F4F0' }}>
            {/* ── Top Navbar ── */}
            <header className="sticky top-0 z-40 w-full" style={{ background: 'white', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
                    {/* Logo */}
                    <Link href="/tenant/dashboard" className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ background: '#E8392A' }}>
                            <Home className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold" style={{ color: '#0A0A0A', fontFamily: 'var(--font-serif)' }}>RentFlow</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(232,57,42,0.1)', color: '#E8392A' }}>Tenant</span>
                    </Link>

                    {/* Desktop nav */}
                    <nav className="hidden md:flex items-center gap-1">
                        {NAV.map(({ href, label, icon: Icon }) => {
                            const active = pathname === href
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all relative"
                                    style={{ color: active ? '#E8392A' : '#6B7280' }}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                    {active && <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full" style={{ background: '#E8392A' }} />}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Right: avatar + logout */}
                    <div className="flex items-center gap-2">
                        {tenantName && (
                            <div className="hidden md:flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#E8392A' }}>{initials}</div>
                                <span className="text-sm font-medium" style={{ color: '#374151' }}>{tenantName.split(' ')[0]}</span>
                            </div>
                        )}
                        <button onClick={signOut} className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:text-red-500" style={{ color: '#9CA3AF' }}>
                            <LogOut className="w-4 h-4" /> Sign out
                        </button>
                        {/* Mobile hamburger */}
                        <button className="md:hidden p-2 rounded-lg" style={{ color: '#374151' }} onClick={() => setMobileOpen(v => !v)}>
                            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile slide-down menu */}
                {mobileOpen && (
                    <div className="md:hidden border-t px-4 py-3 space-y-1" style={{ borderColor: 'rgba(0,0,0,0.06)', background: 'white' }}>
                        {NAV.map(({ href, label, icon: Icon }) => {
                            const active = pathname === href
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    onClick={() => setMobileOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium"
                                    style={{ background: active ? 'rgba(232,57,42,0.08)' : 'transparent', color: active ? '#E8392A' : '#374151' }}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </Link>
                            )
                        })}
                        <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mt-1 hover:text-red-500 transition-colors" style={{ color: '#9CA3AF', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                            <LogOut className="w-4 h-4" /> Sign out
                        </button>
                    </div>
                )}
            </header>

            {/* ── Page content ── */}
            <main className="max-w-5xl mx-auto px-4 py-6">
                {children}
            </main>

            {/* ── Mobile bottom nav ── */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex" style={{ background: 'white', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                {NAV.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href
                    return (
                        <Link
                            key={href}
                            href={href}
                            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-all"
                            style={{ color: active ? '#E8392A' : '#9CA3AF' }}
                        >
                            <Icon className="w-5 h-5" />
                            {label}
                        </Link>
                    )
                })}
            </nav>
            <div className="md:hidden h-16" />
        </div>
    )
}
