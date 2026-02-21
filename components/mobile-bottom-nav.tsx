'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Building2,
    Users,
    DollarSign,
    Wrench,
    BarChart3,
} from 'lucide-react'

const mobileNav = [
    { label: 'Home', icon: LayoutDashboard, route: '/dashboard' },
    { label: 'Properties', icon: Building2, route: '/dashboard/properties' },
    { label: 'Tenants', icon: Users, route: '/dashboard/tenants' },
    { label: 'Rent', icon: DollarSign, route: '/dashboard/rent' },
    { label: 'Maintenance', icon: Wrench, route: '/dashboard/maintenance' },
    { label: 'Expenses', icon: BarChart3, route: '/dashboard/expenses' },
]

export function MobileBottomNav() {
    const pathname = usePathname()

    const isActive = (route: string) =>
        route === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(route)

    return (
        <nav
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 pb-safe"
            style={{
                background: 'var(--dash-sidebar-bg)',
                borderTop: '1px solid var(--dash-border)',
                backdropFilter: 'blur(16px)',
                paddingTop: '8px',
                paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
            }}
        >
            {mobileNav.map(({ label, icon: Icon, route }) => {
                const active = isActive(route)
                return (
                    <Link
                        key={route}
                        href={route}
                        className="flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-all min-w-0"
                        style={{ color: active ? '#E8392A' : 'var(--dash-muted)' }}
                    >
                        <Icon
                            className="w-5 h-5 flex-shrink-0"
                            style={{
                                filter: active ? 'none' : undefined,
                            }}
                        />
                        <span
                            className="text-[9px] font-medium leading-none truncate"
                            style={{ color: active ? '#E8392A' : 'var(--dash-muted)' }}
                        >
                            {label}
                        </span>
                    </Link>
                )
            })}
        </nav>
    )
}
