'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { ProfileProvider, useProfile } from '@/hooks/useProfile'
import {
    LayoutDashboard,
    Building2,
    Users,
    DollarSign,
    Wrench,
    BarChart3,
    BarChart2,
    FileText,
    Settings,
    LogOut,
    PanelLeftClose,
    PanelLeftOpen,
    Sun,
    Moon,
} from 'lucide-react'

const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, route: '/dashboard' },
    { label: 'Properties', icon: Building2, route: '/dashboard/properties' },
    { label: 'Tenants', icon: Users, route: '/dashboard/tenants' },
    { label: 'Rent', icon: DollarSign, route: '/dashboard/rent' },
    { label: 'Maintenance', icon: Wrench, route: '/dashboard/maintenance' },
    { label: 'Expenses', icon: BarChart3, route: '/dashboard/expenses' },
    { label: 'Reports', icon: BarChart2, route: '/dashboard/reports' },
    { label: 'Leases', icon: FileText, route: '/dashboard/leases' },
    { label: 'Settings', icon: Settings, route: '/dashboard/settings' },
]

// The inner layout consumes the ProfileProvider context
function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const { profile, email } = useProfile()

    const [open, setOpen] = useState(true)
    const [theme, setTheme] = useState<'dark' | 'light'>('dark')
    const [signingOut, setSigningOut] = useState(false)

    useEffect(() => {
        const savedSidebar = localStorage.getItem('sidebar')
        if (savedSidebar !== null) setOpen(savedSidebar === 'true')

        const savedTheme = (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
        setTheme(savedTheme)
        applyTheme(savedTheme)
    }, [])

    function applyTheme(t: 'dark' | 'light') {
        if (t === 'light') document.documentElement.classList.add('light')
        else document.documentElement.classList.remove('light')
    }

    function toggleSidebar() {
        const next = !open
        setOpen(next)
        localStorage.setItem('sidebar', String(next))
    }

    function toggleTheme() {
        const next = theme === 'dark' ? 'light' : 'dark'
        setTheme(next)
        localStorage.setItem('theme', next)
        applyTheme(next)
    }

    async function handleLogout() {
        setSigningOut(true)
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    const isActive = (route: string) =>
        route === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(route)

    /* Label: fades + collapses width when sidebar closed */
    const labelStyle = {
        maxWidth: open ? '160px' : '0px',
        opacity: open ? 1 : 0,
        overflow: 'hidden' as const,
        whiteSpace: 'nowrap' as const,
        transition: 'max-width 250ms cubic-bezier(0.16,1,0.3,1), opacity 150ms ease',
    }

    /* Tooltip shown on icon hover when collapsed */
    const Tooltip = ({ label }: { label: string }) =>
        !open ? (
            <div
                className="absolute left-full ml-3 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                style={{ background: '#1a1a1a', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.35)' }}
            >
                {label}
            </div>
        ) : null

    return (
        /*
         * CRITICAL layout:
         * - Outer: flex h-screen overflow-hidden → full viewport flex row
         * - Aside:  flex-shrink-0 + overflow-hidden + width class → clips all bleeds
         * - Main:   flex-1 min-w-0 → takes ALL remaining space, zero fixed margins
         */
        <>
            <div className="flex h-screen overflow-hidden" style={{ background: 'var(--dash-bg)', transition: 'background-color 200ms ease' }}>

                {/* ─────────────── SIDEBAR — hidden on mobile ─────────────── */}
                <aside
                    className={`hidden md:flex flex-col flex-shrink-0 h-full overflow-hidden ${open ? 'w-[240px]' : 'w-[68px]'}`}
                    style={{
                        transition: 'width 250ms cubic-bezier(0.16,1,0.3,1)',
                        background: 'var(--dash-sidebar-bg)',
                        borderRight: '1px solid var(--dash-border)',
                    }}
                >

                    {/* Header row: logo collapses away, toggle always visible */}
                    <div
                        className="flex items-center px-3 py-4 flex-shrink-0"
                        style={{
                            borderBottom: '1px solid var(--dash-border)',
                            justifyContent: open ? 'space-between' : 'center',
                        }}
                    >
                        {/* Logo — the ENTIRE logo collapses to width:0 when closed */}
                        <div
                            className="flex items-center gap-2 overflow-hidden flex-shrink-0"
                            style={{
                                maxWidth: open ? '160px' : '0px',
                                opacity: open ? 1 : 0,
                                transition: 'max-width 250ms cubic-bezier(0.16,1,0.3,1), opacity 200ms ease',
                            }}
                        >
                            <div className="w-8 h-8 bg-[#E8392A] rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                                    <path d="M3 14V7.5L9 3L15 7.5V14C15 14.55 14.55 15 14 15H10.5V11H7.5V15H4C3.45 15 3 14.55 3 14Z" fill="white" />
                                </svg>
                            </div>
                            <span
                                className="text-base font-bold tracking-tight whitespace-nowrap"
                                style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--dash-text)' }}
                            >
                                RentFlow
                            </span>
                        </div>

                        {/* Toggle button — always visible, centers itself when logo is gone */}
                        <button
                            onClick={toggleSidebar}
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                            style={{ color: 'var(--dash-muted)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--dash-text)'; e.currentTarget.style.background = 'var(--dash-nav-hover)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--dash-muted)'; e.currentTarget.style.background = 'transparent' }}
                            suppressHydrationWarning
                        >
                            {open ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Nav items */}
                    <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
                        {navItems.map(({ label, icon: Icon, route }) => {
                            const active = isActive(route)
                            return (
                                <div key={route} className="relative group">
                                    <Link
                                        href={route}
                                        className="flex items-center rounded-xl text-sm font-medium transition-all"
                                        style={{
                                            gap: open ? '12px' : '0',
                                            justifyContent: open ? 'flex-start' : 'center',
                                            padding: open ? '10px 12px' : '10px 0',
                                            color: active ? 'var(--dash-text)' : 'var(--dash-nav-inactive)',
                                            background: active ? 'var(--dash-nav-active-bg)' : 'transparent',
                                            borderLeft: active ? '2px solid #E8392A' : '2px solid transparent',
                                        }}
                                        onMouseEnter={(e) => { if (!active) { e.currentTarget.style.color = 'var(--dash-text)'; e.currentTarget.style.background = 'var(--dash-nav-hover)' } }}
                                        onMouseLeave={(e) => { if (!active) { e.currentTarget.style.color = 'var(--dash-nav-inactive)'; e.currentTarget.style.background = 'transparent' } }}
                                    >
                                        <Icon className="w-4 h-4 flex-shrink-0" />
                                        <span style={labelStyle}>{label}</span>
                                    </Link>
                                    <Tooltip label={label} />
                                </div>
                            )
                        })}
                    </nav>

                    {/* Bottom section */}
                    <div className="flex-shrink-0 px-2 pb-4 pt-2" style={{ borderTop: '1px solid var(--dash-border)' }}>

                        {/* Theme toggle */}
                        <div className="relative group">
                            <div
                                onClick={toggleTheme}
                                className="flex items-center rounded-xl text-sm cursor-pointer transition-all"
                                style={{
                                    justifyContent: open ? 'space-between' : 'center',
                                    padding: open ? '10px 12px' : '10px 0',
                                    color: 'var(--dash-muted)',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--dash-text)'; e.currentTarget.style.background = 'var(--dash-nav-hover)' }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--dash-muted)'; e.currentTarget.style.background = 'transparent' }}
                            >
                                <div className="flex items-center gap-3">
                                    {theme === 'dark' ? <Moon className="w-4 h-4 flex-shrink-0" /> : <Sun className="w-4 h-4 flex-shrink-0" />}
                                    <span style={labelStyle}>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
                                </div>
                                {open && (
                                    <div
                                        className="w-10 h-5 rounded-full relative flex-shrink-0 transition-colors duration-200"
                                        style={{ background: theme === 'light' ? '#E8392A' : 'var(--dash-toggle-track)' }}
                                    >
                                        <div
                                            className="w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform duration-200"
                                            style={{ transform: theme === 'light' ? 'translateX(22px)' : 'translateX(2px)' }}
                                        />
                                    </div>
                                )}
                            </div>
                            <Tooltip label={theme === 'dark' ? 'Switch to light' : 'Switch to dark'} />
                        </div>

                        {/* Divider */}
                        <div className="my-2" style={{ height: '1px', background: 'var(--dash-divider)' }} />

                        {/* User info — live from useProfile() */}
                        <div
                            className="flex items-center rounded-xl px-2 py-2 mb-0.5 overflow-hidden"
                            style={{ gap: open ? '10px' : '0', justifyContent: open ? 'flex-start' : 'center' }}
                        >
                            {profile?.avatar_url
                                ? <img src={profile.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                                : <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white" style={{ background: '#E8392A' }}>
                                    {(profile?.full_name || email)?.[0]?.toUpperCase() ?? 'U'}
                                </div>
                            }
                            <div className="overflow-hidden min-w-0">
                                <p className="text-xs font-medium truncate" style={{ ...labelStyle, transition: 'max-width 250ms cubic-bezier(0.16,1,0.3,1), opacity 150ms ease', color: 'var(--dash-text)' }}>
                                    {profile?.full_name || email || 'Loading...'}
                                </p>
                                <p className="text-[10px] mt-0.5 capitalize" style={{ ...labelStyle, transition: 'max-width 250ms cubic-bezier(0.16,1,0.3,1), opacity 150ms ease', color: 'var(--dash-muted)' }}>
                                    {profile?.plan ?? 'free'} plan
                                </p>
                            </div>
                        </div>

                        {/* Logout */}
                        <div className="relative group">
                            <button
                                onClick={handleLogout}
                                disabled={signingOut}
                                className="w-full flex items-center rounded-xl text-sm transition-all"
                                style={{
                                    gap: open ? '10px' : '0',
                                    justifyContent: open ? 'flex-start' : 'center',
                                    padding: open ? '9px 12px' : '9px 0',
                                    color: 'var(--dash-muted)',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = '#E8392A'; e.currentTarget.style.background = 'rgba(232,57,42,0.08)' }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--dash-muted)'; e.currentTarget.style.background = 'transparent' }}
                                suppressHydrationWarning
                            >
                                <LogOut className="w-4 h-4 flex-shrink-0" />
                                <span style={labelStyle}>{signingOut ? 'Signing out...' : 'Log out'}</span>
                            </button>
                            <Tooltip label="Log out" />
                        </div>
                    </div>
                </aside>

                {/* ─────────────── MAIN CONTENT ─────────────── */}
                <main
                    className="flex-1 min-w-0 overflow-y-auto pb-20 md:pb-0 relative"
                    style={{ background: 'var(--dash-bg)', transition: 'background-color 200ms ease' }}
                >
                    {/* ──── Mobile Sticky Header ──── */}
                    <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-5 py-4 backdrop-blur-xl bg-[var(--dash-bg)]/80 border-b border-[var(--dash-border)]">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#E8392A] rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                                    <path d="M3 14V7.5L9 3L15 7.5V14C15 14.55 14.55 15 14 15H10.5V11H7.5V15H4C3.45 15 3 14.55 3 14Z" fill="white" />
                                </svg>
                            </div>
                            <span className="text-lg font-black tracking-tight" style={{ fontFamily: 'var(--font-bricolage)' }}>
                                RentFlow
                            </span>
                        </div>

                        {/* Profile Avatar Trigger (Mobile) */}
                        <div
                            onClick={() => (window as any).toggleMobileProfile?.()}
                            className="w-9 h-9 rounded-full ring-2 ring-emerald-500/20 active:scale-95 transition-all overflow-hidden cursor-pointer"
                        >
                            {profile?.avatar_url
                                ? <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#E8392A' }}>
                                    {(profile?.full_name || email)?.[0]?.toUpperCase() ?? 'U'}
                                </div>
                            }
                        </div>
                    </header>

                    <div className="max-w-[1600px] mx-auto">
                        {children}
                    </div>

                    {/* Mobile Profile Bottom Sheet Portal Shell */}
                    <MobileProfileDrawer profile={profile} email={email} onLogout={handleLogout} />
                </main>
            </div>
            {/* Mobile bottom nav — only visible on < md screens */}
            <MobileBottomNav />
        </>
    )
}

function MobileProfileDrawer({ profile, email, onLogout }: any) {
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    useEffect(() => {
        (window as any).toggleMobileProfile = () => setIsOpen(true)
        return () => { delete (window as any).toggleMobileProfile }
    }, [])

    if (!isOpen) return null

    return (
        <div className="md:hidden fixed inset-0 z-[100] animate-in fade-in duration-200">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

            {/* Drawer */}
            <div className="absolute inset-x-0 bottom-0 bg-gray-900 rounded-t-[32px] border-t border-gray-800 p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
                <div className="w-12 h-1.5 bg-gray-700 rounded-full mx-auto mb-8" />

                <div className="flex items-center gap-4 mb-8">
                    {profile?.avatar_url
                        ? <img src={profile.avatar_url} alt="Avatar" className="w-16 h-16 rounded-full object-cover ring-4 ring-emerald-500/10" />
                        : <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-xl" style={{ background: '#E8392A' }}>
                            {(profile?.full_name || email)?.[0]?.toUpperCase() ?? 'U'}
                        </div>
                    }
                    <div className="min-w-0">
                        <h3 className="text-xl font-bold text-white truncate">{profile?.full_name || 'User'}</h3>
                        <p className="text-sm text-gray-400 truncate">{email}</p>
                        <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                            {profile?.plan || 'Free'} Plan
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    {[
                        { label: 'Profile Settings', route: '/dashboard/settings?tab=profile', icon: Users },
                        { label: 'Preferences', route: '/dashboard/settings?tab=preferences', icon: LayoutDashboard },
                        { label: 'Security', route: '/dashboard/settings?tab=security', icon: Settings },
                    ].map(item => (
                        <button
                            key={item.label}
                            onClick={() => { router.push(item.route); setIsOpen(false) }}
                            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-800/40 border border-gray-800 active:bg-gray-800 transition-all text-gray-300 font-semibold"
                        >
                            <item.icon className="w-5 h-5 text-gray-500" />
                            {item.label}
                        </button>
                    ))}

                    <div className="h-4" />

                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 active:bg-red-500/20 transition-all text-red-500 font-bold"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProfileProvider>
            <DashboardLayoutInner>{children}</DashboardLayoutInner>
        </ProfileProvider>
    )
}
