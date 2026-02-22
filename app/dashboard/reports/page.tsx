'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, BarChart2, Building2 } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
type Property = { id: string; address: string }
type MonthlyData = { month: string; income: number; expenses: number; net: number }

function StatCard({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) {
    return (
        <div className="w-full rounded-2xl p-5 space-y-1" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--dash-muted)' }}>{label}</p>
            <p className="text-2xl font-bold" style={{ color: positive === true ? '#16A34A' : positive === false ? '#E8392A' : 'var(--dash-text)' }}>{value}</p>
            {sub && <p className="text-xs" style={{ color: 'var(--dash-muted)' }}>{sub}</p>}
        </div>
    )
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function ReportsPage() {
    const supabase = createClient()
    const [properties, setProperties] = useState<Property[]>([])
    const [selectedProp, setSelectedProp] = useState<string>('all')
    const [dateRange, setDateRange] = useState('this_year')
    const [cashFlowData, setCashFlowData] = useState<MonthlyData[]>([])
    const [totalIncome, setTotalIncome] = useState(0)
    const [totalExpenses, setTotalExpenses] = useState(0)
    const [expenseCategories, setExpenseCategories] = useState<{ category: string; amount: number }[]>([])
    const [occupancy, setOccupancy] = useState<{ address: string; occupied: boolean }[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: props } = await supabase.from('properties').select('id, address').eq('user_id', user.id)
            setProperties(props || [])

            await loadReports(user.id)
        }
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        async function reloadIfUser() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            await loadReports(user.id)
        }
        reloadIfUser()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProp, dateRange])

    async function loadReports(userId: string) {
        setLoading(true)
        const now = new Date()
        const year = now.getFullYear()

        let startDate: string
        let endDate: string = now.toISOString().split('T')[0]

        if (dateRange === 'this_year') {
            startDate = `${year}-01-01`
        } else if (dateRange === 'last_year') {
            startDate = `${year - 1}-01-01`
            endDate = `${year - 1}-12-31`
        } else if (dateRange === 'this_month') {
            startDate = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
        } else {
            startDate = `${year - 1}-01-01`
        }

        // Build queries
        let rentQuery = supabase
            .from('rent_payments')
            .select('amount, paid_date, property_id')
            .eq('user_id', userId)
            .eq('status', 'paid')
            .gte('paid_date', startDate)
            .lte('paid_date', endDate)

        let expQuery = supabase
            .from('expenses')
            .select('amount, date, category, property_id')
            .eq('user_id', userId)
            .gte('date', startDate)
            .lte('date', endDate)

        if (selectedProp !== 'all') {
            rentQuery = rentQuery.eq('property_id', selectedProp)
            expQuery = expQuery.eq('property_id', selectedProp)
        }

        const [{ data: rents }, { data: exps }] = await Promise.all([rentQuery, expQuery])

        // Compute monthly cash flow
        const monthMap: Record<string, { income: number; expenses: number }> = {}
        for (let m = 0; m < 12; m++) {
            monthMap[MONTHS[m]] = { income: 0, expenses: 0 }
        }

        ; (rents || []).forEach(r => {
            const m = MONTHS[new Date(r.paid_date!).getMonth()]
            monthMap[m].income += Number(r.amount)
        })
            ; (exps || []).forEach(e => {
                const m = MONTHS[new Date(e.date).getMonth()]
                monthMap[m].expenses += Number(e.amount)
            })

        const cashFlow: MonthlyData[] = Object.entries(monthMap).map(([month, d]) => ({
            month,
            income: d.income,
            expenses: d.expenses,
            net: d.income - d.expenses,
        }))
        setCashFlowData(cashFlow)

        const totalInc = (rents || []).reduce((s, r) => s + Number(r.amount), 0)
        const totalExp = (exps || []).reduce((s, e) => s + Number(e.amount), 0)
        setTotalIncome(totalInc)
        setTotalExpenses(totalExp)

        // Expense categories
        const catMap: Record<string, number> = {}
            ; (exps || []).forEach(e => {
                const cat = e.category || 'Other'
                catMap[cat] = (catMap[cat] || 0) + Number(e.amount)
            })
        setExpenseCategories(
            Object.entries(catMap)
                .map(([category, amount]) => ({ category, amount }))
                .sort((a, b) => b.amount - a.amount)
        )

        // Occupancy
        const { data: tenants } = await supabase
            .from('tenants')
            .select('property_id, properties(address)')
            .eq('user_id', userId)
            .is('vacated_at', null)

        const { data: allProps } = await supabase
            .from('properties')
            .select('id, address')
            .eq('user_id', userId)

        const occupiedIds = new Set((tenants || []).map(t => t.property_id))
        setOccupancy((allProps || []).map(p => ({ address: p.address, occupied: occupiedIds.has(p.id) })))

        setLoading(false)
    }

    const net = totalIncome - totalExpenses
    const margin = totalIncome > 0 ? ((net / totalIncome) * 100).toFixed(1) : '0'
    const occupancyRate = occupancy.length > 0
        ? ((occupancy.filter(o => o.occupied).length / occupancy.length) * 100).toFixed(0)
        : '0'

    const RANGE_OPTIONS = [
        { value: 'this_month', label: 'This Month' },
        { value: 'this_year', label: 'This Year' },
        { value: 'last_year', label: 'Last Year' },
        { value: 'all_time', label: 'All Time' },
    ]

    return (
        <div className="w-full max-w-5xl mx-auto px-6 py-6 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--dash-text)' }}>
                        Financial Reports
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--dash-muted)' }}>P&L, cash flow, and occupancy across your portfolio</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    {/* Property filter */}
                    <div className="relative">
                        <select
                            value={selectedProp}
                            onChange={e => setSelectedProp(e.target.value)}
                            className="rounded-xl border px-4 py-2.5 text-sm outline-none appearance-none pr-9 transition-all focus:ring-2 focus:ring-red-500/30"
                            style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)', color: 'var(--dash-text)' }}
                        >
                            <option value="all">All Properties</option>
                            {properties.map(p => (
                                <option key={p.id} value={p.id}>{p.address}</option>
                            ))}
                        </select>
                        <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--dash-muted)' }} />
                    </div>
                    {/* Date range */}
                    <div className="relative">
                        <select
                            value={dateRange}
                            onChange={e => setDateRange(e.target.value)}
                            className="rounded-xl border px-4 py-2.5 text-sm outline-none appearance-none pr-9 transition-all focus:ring-2 focus:ring-red-500/30"
                            style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)', color: 'var(--dash-text)' }}
                        >
                            {RANGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <BarChart2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--dash-muted)' }} />
                    </div>
                </div>
            </div>

            {/* ─── P&L Summary Cards ─── */}
            <section>
                <h2 className="text-base font-bold mb-4" style={{ color: 'var(--dash-text)', fontFamily: 'var(--font-bricolage)' }}>P&L Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Total Income" value={`$${totalIncome.toLocaleString()}`} sub="Rent collected" positive={true} />
                    <StatCard label="Total Expenses" value={`$${totalExpenses.toLocaleString()}`} sub="All categories" positive={false} />
                    <StatCard label="Net Profit" value={`$${net.toLocaleString()}`} sub={net >= 0 ? 'Positive' : 'Negative'} positive={net >= 0} />
                    <StatCard label="Profit Margin" value={`${margin}%`} sub="Of income kept" positive={Number(margin) >= 50} />
                </div>
            </section>

            {/* ─── Cash Flow Chart ─── */}
            <section>
                <h2 className="text-base font-bold mb-4" style={{ color: 'var(--dash-text)', fontFamily: 'var(--font-bricolage)' }}>Cash Flow — Monthly</h2>
                <div className="w-full rounded-2xl p-6" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}>
                    {loading ? (
                        <div className="h-64 rounded-xl animate-pulse" style={{ background: 'var(--dash-nav-hover)' }} />
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={cashFlowData} barCategoryGap="30%">
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--dash-border)" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--dash-muted)' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: 'var(--dash-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                                <Tooltip
                                    formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name.charAt(0).toUpperCase() + name.slice(1)]}
                                    contentStyle={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)', borderRadius: '12px', fontSize: '13px' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '16px' }} />
                                <Bar dataKey="income" fill="#16A34A" radius={[4, 4, 0, 0]} name="Income" />
                                <Bar dataKey="expenses" fill="#E8392A" radius={[4, 4, 0, 0]} name="Expenses" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </section>

            {/* ─── Expense Breakdown & Occupancy ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Expense categories */}
                <section>
                    <h2 className="text-base font-bold mb-4" style={{ color: 'var(--dash-text)', fontFamily: 'var(--font-bricolage)' }}>Expense Breakdown</h2>
                    <div className="w-full rounded-2xl p-5 space-y-3" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}>
                        {loading ? (
                            [1, 2, 3].map(i => <div key={i} className="h-10 rounded-xl animate-pulse" style={{ background: 'var(--dash-nav-hover)' }} />)
                        ) : expenseCategories.length === 0 ? (
                            <div className="text-center py-8">
                                <DollarSign className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--dash-muted)' }} />
                                <p className="text-sm" style={{ color: 'var(--dash-muted)' }}>No expenses in this period</p>
                            </div>
                        ) : expenseCategories.map(({ category, amount }) => {
                            const pct = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
                            return (
                                <div key={category} className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm capitalize" style={{ color: 'var(--dash-text)' }}>{category}</span>
                                        <div className="text-right">
                                            <span className="text-sm font-semibold" style={{ color: 'var(--dash-text)' }}>${amount.toLocaleString()}</span>
                                            <span className="text-xs ml-2" style={{ color: 'var(--dash-muted)' }}>{pct.toFixed(0)}%</span>
                                        </div>
                                    </div>
                                    <div className="h-1.5 rounded-full" style={{ background: 'var(--dash-nav-hover)' }}>
                                        <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: '#E8392A' }} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>

                {/* Occupancy */}
                <section>
                    <h2 className="text-base font-bold mb-4" style={{ color: 'var(--dash-text)', fontFamily: 'var(--font-bricolage)' }}>Occupancy Rate</h2>
                    <div className="w-full rounded-2xl p-5 space-y-4" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}>
                        {/* Overall rate */}
                        <div className="flex items-center gap-4">
                            <div className="relative w-16 h-16 flex-shrink-0">
                                <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--dash-nav-hover)" strokeWidth="3" />
                                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E8392A" strokeWidth="3"
                                        strokeDasharray={`${occupancyRate}, 100`} strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-sm font-bold" style={{ color: 'var(--dash-text)' }}>{occupancyRate}%</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-base font-bold" style={{ color: 'var(--dash-text)' }}>{occupancy.filter(o => o.occupied).length} / {occupancy.length} occupied</p>
                                <p className="text-xs" style={{ color: 'var(--dash-muted)' }}>Portfolio occupancy rate</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {loading ? (
                                [1, 2].map(i => <div key={i} className="h-10 rounded-xl animate-pulse" style={{ background: 'var(--dash-nav-hover)' }} />)
                            ) : occupancy.map(({ address, occupied }) => (
                                <div key={address} className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: 'var(--dash-nav-hover)' }}>
                                    <p className="text-sm truncate min-w-0 mr-3" style={{ color: 'var(--dash-text)' }}>{address}</p>
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: occupied ? 'rgba(22,163,74,0.12)' : 'rgba(107,114,128,0.12)', color: occupied ? '#16A34A' : '#6B7280' }}>
                                        {occupied ? 'Occupied' : 'Vacant'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}
