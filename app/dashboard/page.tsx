'use client'

import { useEffect, useState, useCallback } from 'react'
import { AlertCircle, CheckCircle2, DollarSign, Building2, Calendar, Clock, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import Link from 'next/link'

type RentRow = { id: string; amount: number; due_date: string; status: string; paid_date: string | null; tenant?: { full_name: string; avatar_color: string }; property?: { name: string } }
type Expense = { id: string; title: string; amount: number; date: string; category: string }
type MainticketRow = { id: string; title: string; status: string; property?: { name: string } }
type UrgentItem = { id: string; type: 'rent' | 'maintenance' | 'lease'; title: string; subtitle: string; date?: string; link: string }

const AVATAR_COLORS = ['#E8392A', '#6366F1', '#22C55E', '#F59E0B']

export default function DashboardPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)

    // Stats
    const [monthlyCollected, setMonthlyCollected] = useState(0)
    const [monthlyTotal, setMonthlyTotal] = useState(0)
    const [paidCount, setPaidCount] = useState(0)
    const [totalCount, setTotalCount] = useState(0)
    const [openIssues, setOpenIssues] = useState(0)

    // Recent data
    const [recentRents, setRecentRents] = useState<RentRow[]>([])
    const [recentExpenses, setRecentExpenses] = useState<Expense[]>([])
    const [maintenanceSummary, setMaintenanceSummary] = useState<MainticketRow[]>([])
    const [urgentItems, setUrgentItems] = useState<UrgentItem[]>([])

    const fetchData = useCallback(async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        const now = new Date()
        const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
        const firstOfNext = `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}-01`
        const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        const [
            { data: rentRows },
            { data: expenses },
            { data: tickets },
            { data: overdueRents },
            { data: expiringLeases },
        ] = await Promise.all([
            supabase.from('rent_payments')
                .select('*, tenant:tenants(full_name, avatar_color), property:properties(name)')
                .eq('user_id', user.id)
                .gte('due_date', firstOfMonth)
                .lt('due_date', firstOfNext)
                .order('due_date', { ascending: false }),
            supabase.from('expenses')
                .select('id, title, amount, date, category')
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .limit(4),
            supabase.from('maintenance_tickets')
                .select('id, title, status, property:properties(name)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(4),
            supabase.from('rent_payments')
                .select('*, tenant:tenants(full_name), property:properties(name)')
                .eq('user_id', user.id)
                .eq('status', 'pending')
                .lt('due_date', now.toISOString().split('T')[0])
                .limit(2),
            supabase.from('leases')
                .select('*, property:properties(name), tenant:tenants(full_name)')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .lte('end_date', sixtyDaysFromNow)
                .gte('end_date', now.toISOString().split('T')[0])
                .limit(2),
        ])

        const rents = (rentRows || []) as RentRow[]
        const exps = (expenses || []) as Expense[]
        const tks = (tickets || []) as unknown as MainticketRow[]

        const total = rents.reduce((s, r) => s + Number(r.amount), 0)
        const collected = rents.filter(r => r.status === 'paid').reduce((s, r) => s + Number(r.amount), 0)
        const overdueCheck = (r: RentRow) => r.status !== 'paid' && new Date(r.due_date) < now
        const effectiveStatus = (r: RentRow) => overdueCheck(r) ? 'overdue' : r.status

        setMonthlyTotal(total)
        setMonthlyCollected(collected)
        setPaidCount(rents.filter(r => r.status === 'paid').length)
        setTotalCount(rents.length)
        setOpenIssues(tks.filter(t => t.status === 'open' || t.status === 'in progress').length)
        setRecentRents(rents.slice(0, 5).map(r => ({ ...r, status: effectiveStatus(r) })))
        setRecentExpenses(exps)
        setMaintenanceSummary(tks)

        // Build Urgent Items
        const urgent: UrgentItem[] = [];
        
        // Add Overdue Rents
        (overdueRents || []).forEach((r: any) => {
            urgent.push({
                id: r.id,
                type: 'rent',
                title: `Overdue: ${r.property?.name || 'Property'}`,
                subtitle: `${r.tenant?.full_name} is overdue by $${r.amount}`,
                date: r.due_date,
                link: '/dashboard/rent'
            })
        });

        // Add Open Tickets
        tks.filter(t => t.status === 'open').forEach(t => {
            urgent.push({
                id: t.id,
                type: 'maintenance',
                title: `Open Ticket: ${t.title}`,
                subtitle: `At ${t.property?.name || 'Property'}`,
                link: '/dashboard/maintenance'
            })
        });

        // Add Expiring Leases
        (expiringLeases || []).forEach((l: any) => {
            urgent.push({
                id: l.id,
                type: 'lease',
                title: 'Lease Expiring Soon',
                subtitle: `${l.tenant?.full_name} at ${l.property?.name}`,
                date: l.end_date,
                link: '/dashboard/leases'
            })
        })

        setUrgentItems(urgent.slice(0, 3))
        setLoading(false)
    }, [supabase])

    useEffect(() => { fetchData() }, [fetchData])

    const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const initials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

    const statCards = [
        {
            label: 'Monthly Rent', icon: DollarSign,
            value: loading ? '...' : `$${monthlyCollected.toLocaleString()}`,
            sub: loading ? '' : `$${monthlyTotal.toLocaleString()} expected`,
            subColor: 'var(--dash-badge-paid-text)',
            iconBg: 'var(--dash-badge-paid-bg)', iconColor: 'var(--dash-badge-paid-text)',
        },
        {
            label: 'Tenants Paid', icon: CheckCircle2,
            value: loading ? '...' : `${paidCount} / ${totalCount}`,
            sub: loading ? '' : totalCount > 0 ? `${Math.round((paidCount / totalCount) * 100)}% collection rate` : 'No tenants this month',
            subColor: paidCount === totalCount && totalCount > 0 ? 'var(--dash-badge-paid-text)' : 'var(--dash-badge-pend-text)',
            iconBg: 'var(--dash-badge-paid-bg)', iconColor: 'var(--dash-badge-paid-text)',
        },
        {
            label: 'Open Issues', icon: AlertCircle,
            value: loading ? '...' : String(openIssues),
            sub: openIssues > 0 ? 'Needs attention' : 'All clear',
            subColor: openIssues > 0 ? 'var(--dash-badge-over-text)' : 'var(--dash-badge-paid-text)',
            iconBg: openIssues > 0 ? 'var(--dash-badge-over-bg)' : 'var(--dash-badge-paid-bg)',
            iconColor: openIssues > 0 ? 'var(--dash-badge-over-text)' : 'var(--dash-badge-paid-text)',
        },
    ]

    const maintenaceDotBg: Record<string, string> = { open: 'var(--dash-badge-over-bg)', 'in progress': 'var(--dash-badge-pend-bg)', fixed: 'var(--dash-badge-paid-bg)' }
    const maintenanceDotColor: Record<string, string> = { open: 'var(--dash-badge-over-text)', 'in progress': 'var(--dash-badge-pend-text)', fixed: 'var(--dash-badge-paid-text)' }

    return (
        // fix: page_padding — px-4 mobile, px-8 md+; space-y-4 mobile, space-y-6 md+
        <div className="w-full px-4 py-4 md:px-8 md:py-6 space-y-4 md:space-y-6" style={{ transition: 'background-color 200ms ease' }}>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--dash-text)' }}>Dashboard</h1>
                    <p className="text-sm" style={{ color: 'var(--dash-muted)' }}>Here&apos;s what&apos;s happening with your properties.</p>
                </div>
                {/* Today / Summary Button (Mobile) */}
                <div className="md:hidden">
                    <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#E8392A]/10 text-[#E8392A] text-xs font-bold border border-[#E8392A]/20">
                        {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · Today
                    </div>
                </div>
            </div>

            {/* Today's Attention Section */}
            {!loading && urgentItems.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {urgentItems.map((item) => (
                        <Link key={item.id} href={item.link} className="flex flex-col gap-1 p-4 rounded-2xl border transition-all hover:scale-[1.01] active:scale-[0.99]"
                            style={{ background: 'var(--dash-card-bg)', borderColor: 'var(--dash-card-border)' }}>
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    {item.type === 'rent' && <Clock className="w-4 h-4 text-[#E8392A]" />}
                                    {item.type === 'maintenance' && <AlertCircle className="w-4 h-4 text-amber-500" />}
                                    {item.type === 'lease' && <Calendar className="w-4 h-4 text-blue-500" />}
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{item.type}</span>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                            </div>
                            <h4 className="text-sm font-bold truncate" style={{ color: 'var(--dash-text)' }}>{item.title}</h4>
                            <p className="text-xs truncate" style={{ color: 'var(--dash-muted)' }}>{item.subtitle}</p>
                        </Link>
                    ))}
                </div>
            )}

            {/* fix: stat_cards_grid — grid-cols-1 mobile, grid-cols-3 md+ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                {statCards.map((card) => {
                    const Icon = card.icon
                    return (
                        <div
                            key={card.label}
                            className="rounded-2xl p-4 flex items-start justify-between gap-4 w-full transition-colors duration-200"
                            style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}
                        >
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--dash-muted)' }}>{card.label}</p>
                                <p className="text-2xl font-bold mb-1.5 truncate" style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--dash-text)' }}>{card.value}</p>
                                <p className="text-xs font-medium truncate" style={{ color: card.subColor }}>{card.sub}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1" style={{ background: card.iconBg }}>
                                <Icon className="w-5 h-5" style={{ color: card.iconColor }} />
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Rent Activity Table */}
            <div
                className="rounded-2xl w-full overflow-hidden transition-colors duration-200"
                style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}
            >
                {/* fix: section_headers — flex items-center justify-between, right side flex-shrink-0 */}
                <div className="px-4 py-4 md:px-6 flex items-center justify-between w-full" style={{ borderBottom: '1px solid var(--dash-border)' }}>
                    <h2 className="text-sm md:text-base font-semibold" style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--dash-text)' }}>Recent Rent Activity</h2>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs hidden sm:inline" style={{ color: 'var(--dash-muted)' }}>{monthLabel}</span>
                        <Link href="/dashboard/rent" className="text-xs font-semibold hover:opacity-80" style={{ color: '#E8392A' }}>View all →</Link>
                    </div>
                </div>

                {loading ? (
                    <div className="p-4 md:p-6 space-y-3">
                        {[1, 2, 3].map(i => <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: 'var(--dash-nav-hover)' }} />)}
                    </div>
                ) : recentRents.length === 0 ? (
                    <div className="py-6">
                        <EmptyState 
                            icon={DollarSign}
                            title="No rent data for this month"
                            description="Add active tenants to start tracking their monthly rent payments."
                            actionLabel="Add Property"
                            onAction={() => window.location.href = '/dashboard/properties'}
                        />
                    </div>
                ) : recentRents.map((row, idx) => (
                    // fix: recent_rent_row_layout — flex w-full, avatar flex-shrink-0, name flex-1 min-w-0, amount+badge ml-auto flex-shrink-0
                    <div
                        key={row.id}
                        className="flex items-center gap-3 w-full px-4 py-3.5 md:px-6 transition-colors duration-150"
                        style={{ borderBottom: idx < recentRents.length - 1 ? '1px solid var(--dash-divider)' : 'none' }}
                    >
                        {/* Avatar — flex-shrink-0 so it never compresses */}
                        <div
                            className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: (row as any).tenant?.avatar_color || AVATAR_COLORS[idx % AVATAR_COLORS.length] }}
                        >
                            {initials((row as any).tenant?.full_name || '?')}
                        </div>

                        {/* Name + address — flex-1 min-w-0 absorbs space, truncate prevents overflow */}
                        <div className="flex flex-col flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: 'var(--dash-text)' }}>
                                {(row as any).tenant?.full_name || '—'}
                            </p>
                            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--dash-muted)' }}>
                                {(row as any).property?.name || '—'}
                            </p>
                        </div>

                        {/* Amount + badge — ml-auto flex-shrink-0, never compresses */}
                        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                            <span className="text-sm font-semibold" style={{ color: 'var(--dash-text)' }}>${Number(row.amount).toLocaleString()}</span>
                            <StatusBadge status={row.status} variant="rent" />
                        </div>
                    </div>
                ))}
            </div>

            {/* fix: bottom_two_column_grid — grid-cols-1 mobile, grid-cols-2 md+ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">

                {/* Recent Expenses */}
                <div className="rounded-2xl w-full overflow-hidden transition-colors duration-200" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}>
                    {/* fix: section_headers */}
                    <div className="px-4 py-4 md:px-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--dash-border)' }}>
                        <h2 className="text-sm md:text-base font-semibold" style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--dash-text)' }}>Recent Expenses</h2>
                        <Link href="/dashboard/expenses" className="text-xs font-semibold hover:opacity-80 flex-shrink-0" style={{ color: '#E8392A' }}>View all →</Link>
                    </div>
                    <div className="px-4 md:px-6 py-2">
                        {loading
                            ? [1, 2, 3].map(i => <div key={i} className="h-10 my-2 rounded-lg animate-pulse" style={{ background: 'var(--dash-nav-hover)' }} />)
                            : recentExpenses.length === 0
                                ? <div className="py-8"><EmptyState icon={DollarSign} title="No expenses" description="You haven't logged any expenses yet." /></div>
                                : recentExpenses.map((exp, i) => (
                                    <div key={exp.id} className="flex items-center justify-between gap-3 py-3.5" style={{ borderBottom: i < recentExpenses.length - 1 ? '1px solid var(--dash-divider)' : 'none' }}>
                                        {/* Title + meta — min-w-0 to allow truncation */}
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm truncate" style={{ color: 'var(--dash-expense-text)' }}>{exp.title}</p>
                                            <p className="text-xs mt-0.5 capitalize truncate" style={{ color: 'var(--dash-subtle)' }}>
                                                {exp.category} · {new Date(exp.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                            </p>
                                        </div>
                                        {/* Amount — flex-shrink-0 */}
                                        <span className="text-sm font-semibold flex-shrink-0" style={{ color: 'var(--dash-text)' }}>${Number(exp.amount).toLocaleString()}</span>
                                    </div>
                                ))
                        }
                    </div>
                </div>

                {/* Maintenance Summary */}
                <div className="rounded-2xl w-full overflow-hidden transition-colors duration-200" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}>
                    {/* fix: section_headers */}
                    <div className="px-4 py-4 md:px-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--dash-border)' }}>
                        <h2 className="text-sm md:text-base font-semibold" style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--dash-text)' }}>Maintenance</h2>
                        <Link href="/dashboard/maintenance" className="text-xs font-semibold hover:opacity-80 flex-shrink-0" style={{ color: '#E8392A' }}>View all →</Link>
                    </div>
                    <div className="px-4 md:px-6 py-2">
                        {loading
                            ? [1, 2, 3].map(i => <div key={i} className="h-10 my-2 rounded-lg animate-pulse" style={{ background: 'var(--dash-nav-hover)' }} />)
                            : maintenanceSummary.length === 0
                                ? <div className="py-8"><EmptyState icon={AlertCircle} title="No tickets" description="Maintenance requests will appear here." /></div>
                                : maintenanceSummary.map((item, i) => (
                                    <div key={item.id} className="flex items-center justify-between gap-3 py-3.5" style={{ borderBottom: i < maintenanceSummary.length - 1 ? '1px solid var(--dash-divider)' : 'none' }}>
                                        {/* Title + property — min-w-0 */}
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm truncate" style={{ color: 'var(--dash-expense-text)' }}>{item.title}</p>
                                            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--dash-subtle)' }}>{(item as any).property?.name || '—'}</p>
                                        </div>
                                        {/* Status badge — flex-shrink-0 */}
                                        <div className="flex items-center gap-1.5 text-xs font-semibold rounded-full px-2.5 py-1 flex-shrink-0" style={{ background: maintenaceDotBg[item.status] || 'var(--dash-nav-hover)', color: maintenanceDotColor[item.status] || 'var(--dash-muted)' }}>
                                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: maintenanceDotColor[item.status] || 'var(--dash-muted)' }} />
                                            <span className="capitalize">{item.status}</span>
                                        </div>
                                    </div>
                                ))
                        }
                    </div>
                </div>

            </div>
        </div>
    )
}
