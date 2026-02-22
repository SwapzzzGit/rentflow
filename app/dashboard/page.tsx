'use client'

import { useEffect, useState, useCallback } from 'react'
import { AlertCircle, CheckCircle2, DollarSign, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge } from '@/components/ui/status-badge'
import Link from 'next/link'

type RentRow = { id: string; amount: number; due_date: string; status: string; paid_date: string | null; tenant?: { full_name: string; avatar_color: string }; property?: { name: string } }
type Expense = { id: string; title: string; amount: number; date: string; category: string }
type MainticketRow = { id: string; title: string; status: string; property?: { name: string } }

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

    const fetchData = useCallback(async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        const now = new Date()
        const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
        const firstOfNext = `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}-01`

        const [
            { data: rentRows },
            { data: expenses },
            { data: tickets },
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
        ])

        const rents = (rentRows || []) as RentRow[]
        const exps = (expenses || []) as Expense[]
        const tks = (tickets || []) as MainticketRow[]

        const total = rents.reduce((s, r) => s + Number(r.amount), 0)
        const collected = rents.filter(r => r.status === 'paid').reduce((s, r) => s + Number(r.amount), 0)
        const overdueCheck = (r: RentRow) => r.status !== 'paid' && new Date(r.due_date) < now
        const effectiveStatus = (r: RentRow) => overdueCheck(r) ? 'overdue' : r.status

        setMonthlyTotal(total)
        setMonthlyCollected(collected)
        setPaidCount(rents.filter(r => r.status === 'paid').length)
        setTotalCount(rents.length)
        setOpenIssues(tks.filter(t => t.status === 'open').length)
        setRecentRents(rents.slice(0, 5).map(r => ({ ...r, status: effectiveStatus(r) })))
        setRecentExpenses(exps)
        setMaintenanceSummary(tks)
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
        <div className="p-8 w-full" style={{ transition: 'background-color 200ms ease' }}>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--dash-text)' }}>Dashboard</h1>
                <p className="text-sm" style={{ color: 'var(--dash-muted)' }}>Here&apos;s what&apos;s happening with your properties.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-6">
                {statCards.map((card) => {
                    const Icon = card.icon
                    return (
                        <div key={card.label} className="rounded-2xl p-6 flex items-start justify-between gap-4 transition-colors duration-200" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--dash-muted)' }}>{card.label}</p>
                                <p className="text-2xl font-bold mb-1.5" style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--dash-text)' }}>{card.value}</p>
                                <p className="text-xs font-medium" style={{ color: card.subColor }}>{card.sub}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1" style={{ background: card.iconBg }}>
                                <Icon className="w-5 h-5" style={{ color: card.iconColor }} />
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Rent Activity Table */}
            <div className="rounded-2xl mb-6 overflow-hidden transition-colors duration-200" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}>
                <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--dash-border)' }}>
                    <h2 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--dash-text)' }}>Recent Rent Activity</h2>
                    <div className="flex items-center gap-3">
                        <span className="text-xs" style={{ color: 'var(--dash-muted)' }}>{monthLabel}</span>
                        <Link href="/dashboard/rent" className="text-xs font-semibold hover:opacity-80" style={{ color: '#E8392A' }}>View all →</Link>
                    </div>
                </div>
                {loading ? (
                    <div className="p-6 space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: 'var(--dash-nav-hover)' }} />)}</div>
                ) : recentRents.length === 0 ? (
                    <p className="text-center py-10 text-sm" style={{ color: 'var(--dash-muted)' }}>No rent data for {monthLabel}. Add active tenants to track rent.</p>
                ) : recentRents.map((row, idx) => (
                    <div key={row.id} className="dash-row flex items-center justify-between px-6 py-4 transition-colors duration-150" style={{ borderBottom: idx < recentRents.length - 1 ? '1px solid var(--dash-divider)' : 'none' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: (row as any).tenant?.avatar_color || AVATAR_COLORS[idx % AVATAR_COLORS.length] }}>
                                {initials((row as any).tenant?.full_name || '?')}
                            </div>
                            <div>
                                <p className="text-sm font-medium" style={{ color: 'var(--dash-text)' }}>{(row as any).tenant?.full_name || '—'}</p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--dash-muted)' }}>{(row as any).property?.name || '—'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-semibold" style={{ color: 'var(--dash-text)' }}>${Number(row.amount).toLocaleString()}</span>
                            <StatusBadge status={row.status} variant="rent" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom: Expenses + Maintenance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">

                {/* Recent Expenses */}
                <div className="rounded-2xl overflow-hidden transition-colors duration-200" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}>
                    <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--dash-border)' }}>
                        <h2 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--dash-text)' }}>Recent Expenses</h2>
                        <Link href="/dashboard/expenses" className="text-xs font-semibold hover:opacity-80" style={{ color: '#E8392A' }}>View all →</Link>
                    </div>
                    <div className="px-6 py-2">
                        {loading ? [1, 2, 3].map(i => <div key={i} className="h-10 my-2 rounded-lg animate-pulse" style={{ background: 'var(--dash-nav-hover)' }} />) :
                            recentExpenses.length === 0
                                ? <p className="text-sm text-center py-8" style={{ color: 'var(--dash-muted)' }}>No expenses recorded yet.</p>
                                : recentExpenses.map((exp, i) => (
                                    <div key={exp.id} className="flex items-center justify-between py-3.5" style={{ borderBottom: i < recentExpenses.length - 1 ? '1px solid var(--dash-divider)' : 'none' }}>
                                        <div>
                                            <p className="text-sm" style={{ color: 'var(--dash-expense-text)' }}>{exp.title}</p>
                                            <p className="text-xs mt-0.5 capitalize" style={{ color: 'var(--dash-subtle)' }}>{exp.category} · {new Date(exp.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
                                        </div>
                                        <span className="text-sm font-semibold" style={{ color: 'var(--dash-text)' }}>${Number(exp.amount).toLocaleString()}</span>
                                    </div>
                                ))
                        }
                    </div>
                </div>

                {/* Maintenance Summary */}
                <div className="rounded-2xl overflow-hidden transition-colors duration-200" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}>
                    <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--dash-border)' }}>
                        <h2 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--dash-text)' }}>Maintenance</h2>
                        <Link href="/dashboard/maintenance" className="text-xs font-semibold hover:opacity-80" style={{ color: '#E8392A' }}>View all →</Link>
                    </div>
                    <div className="px-6 py-2">
                        {loading ? [1, 2, 3].map(i => <div key={i} className="h-10 my-2 rounded-lg animate-pulse" style={{ background: 'var(--dash-nav-hover)' }} />) :
                            maintenanceSummary.length === 0
                                ? <p className="text-sm text-center py-8" style={{ color: 'var(--dash-muted)' }}>No maintenance tickets yet.</p>
                                : maintenanceSummary.map((item, i) => (
                                    <div key={item.id} className="flex items-center justify-between py-3.5" style={{ borderBottom: i < maintenanceSummary.length - 1 ? '1px solid var(--dash-divider)' : 'none' }}>
                                        <div>
                                            <p className="text-sm" style={{ color: 'var(--dash-expense-text)' }}>{item.title}</p>
                                            <p className="text-xs mt-0.5" style={{ color: 'var(--dash-subtle)' }}>{(item as any).property?.name || '—'}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1" style={{ background: maintenaceDotBg[item.status] || 'var(--dash-nav-hover)', color: maintenanceDotColor[item.status] || 'var(--dash-muted)' }}>
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
