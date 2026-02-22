'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    LayoutDashboard,
    Building2,
    Users,
    DollarSign,
    Wrench,
    BarChart3,
    MoreHorizontal,
    BarChart2,
    FileText,
    Settings,
    X
} from 'lucide-react'

const mainNav = [
    { label: 'Home', icon: LayoutDashboard, route: '/dashboard' },
    { label: 'Properties', icon: Building2, route: '/dashboard/properties' },
    { label: 'Tenants', icon: Users, route: '/dashboard/tenants' },
    { label: 'Rent', icon: DollarSign, route: '/dashboard/rent' },
    { label: 'Maint', icon: Wrench, route: '/dashboard/maintenance' },
]

const moreNav = [
    { label: 'Expenses', icon: BarChart3, route: '/dashboard/expenses' },
    { label: 'Reports', icon: BarChart2, route: '/dashboard/reports' },
    { label: 'Leases', icon: FileText, route: '/dashboard/leases' },
    { label: 'Settings', icon: Settings, route: '/dashboard/settings' },
]

export function MobileBottomNav() {
    const pathname = usePathname()
    const router = useRouter()
    const [isMoreOpen, setIsMoreOpen] = useState(false)

    const isActive = (route: string) =>
        route === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(route)

    // Close drawer on navigation
    useEffect(() => {
        setIsMoreOpen(false)
    }, [pathname])

    return (
        <>
            <nav
                className="md:hidden fixed bottom-0 left-0 right-0 z-[60] flex items-center justify-around px-2 pb-safe shadow-[0_-8px_30px_rgb(0,0,0,0.1)] dark:shadow-[0_-8px_30px_rgb(0,0,0,0.5)]"
                style={{
                    background: 'var(--mobile-nav-bg, rgba(255, 255, 255, 0.85))',
                    borderTop: '1px solid var(--dash-border)',
                    backdropFilter: 'blur(24px)',
                    paddingTop: '10px',
                    paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
                }}
            >
                {/* CSS variables for mobile nav background if not using tailwind exclusively for backdrop blur + transparency */}
                <style jsx>{`
                    nav {
                        background: rgba(255, 255, 255, 0.85);
                    }
                    :global(.dark) nav {
                        background: rgba(10, 10, 10, 0.85);
                    }
                `}</style>

                {mainNav.map(({ label, icon: Icon, route }) => {
                    const active = isActive(route)
                    return (
                        <Link
                            key={route}
                            href={route}
                            className={`flex flex-col items-center gap-1 group transition-all duration-300 ${active ? 'scale-110' : 'opacity-60 hover:opacity-100'}`}
                        >
                            <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                <Icon className="w-5 h-5 flex-shrink-0" />
                            </div>
                            <span className={`text-[9px] font-bold leading-none tracking-tight ${active ? 'text-emerald-500 dark:text-emerald-400' : 'text-gray-500'}`}>
                                {label}
                            </span>
                        </Link>
                    )
                })}

                {/* More Button */}
                <button
                    onClick={() => setIsMoreOpen(true)}
                    className={`flex flex-col items-center gap-1 transition-all duration-300 ${isMoreOpen ? 'scale-110' : 'opacity-60 hover:opacity-100'}`}
                >
                    <div className="p-1.5 rounded-xl text-gray-500 dark:text-gray-400">
                        <MoreHorizontal className="w-5 h-5 flex-shrink-0" />
                    </div>
                    <span className="text-[9px] font-bold leading-none tracking-tight text-gray-500">
                        More
                    </span>
                </button>
            </nav>

            {/* More Drawer */}
            {isMoreOpen && (
                <div className="md:hidden fixed inset-0 z-[70] animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-black/40 dark:bg-black/90 backdrop-blur-md" onClick={() => setIsMoreOpen(false)} />

                    <div className="absolute inset-x-4 bottom-[calc(theme(spacing.24)+env(safe-area-inset-bottom))] bg-white dark:bg-[#0D0D0D] border border-gray-100 dark:border-white/5 rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">More Options</h3>
                            <button onClick={() => setIsMoreOpen(false)} className="p-2 rounded-full bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {moreNav.map((item) => {
                                const active = isActive(item.route)
                                return (
                                    <button
                                        key={item.route}
                                        onClick={() => { router.push(item.route); setIsMoreOpen(false) }}
                                        className={`flex flex-col items-start gap-3 p-4 rounded-2xl border transition-all ${active ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 dark:text-emerald-400' : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 text-gray-600 dark:text-gray-300'}`}
                                    >
                                        <div className={`p-2 rounded-xl ${active ? 'bg-emerald-500/20' : 'bg-gray-100 dark:bg-white/5'}`}>
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-bold">{item.label}</span>
                                    </button>
                                )
                            })}
                        </div>

                        <div className="mt-6 pt-6 border-t border-white/5">
                            <p className="text-[10px] text-center font-bold text-gray-600 uppercase tracking-widest">RentFlow Pro v1.2</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
