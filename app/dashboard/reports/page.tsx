'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    TrendingUp, TrendingDown, DollarSign, Home,
    Calendar, ChevronDown, Download, Filter,
    ArrowUpRight, ArrowDownRight, PieChart as PieIcon,
    BarChart2, Activity, Wallet
} from 'lucide-react'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
    Legend, ComposedChart, Line
} from 'recharts'
import toast from 'react-hot-toast'

// ─── Constants & Styles ──────────────────────────────────────────────────────
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const CARD_STYLE = "rounded-2xl bg-white dark:bg-[#0D0D0D] border border-gray-200 dark:border-white/5 p-6 transition-all hover:border-gray-300 dark:hover:border-white/10 group"
const STAT_LABEL = "text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-1 block"
const STAT_VALUE = "text-3xl font-bold text-gray-900 dark:text-white tracking-tight"

// ─── Custom Tooltip ─────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, isDark }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/5 rounded-xl p-3 shadow-2xl backdrop-blur-md">
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-4 mb-1 last:mb-0">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-xs text-gray-600 dark:text-gray-300">{entry.name}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                            ${entry.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                ))}
            </div>
        )
    }
    return null
}

// ─── Tab Components ──────────────────────────────────────────────────────────

export default function ReportsPage() {
    const supabase = createClient()
    const [activeTab, setActiveTab] = useState<'overview' | 'pl' | 'cash' | 'expenses'>('overview')
    const [dateRange, setDateRange] = useState<'month' | 'last_month' | 'year' | 'all'>('month')
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)
    const [isDark, setIsDark] = useState(false)

    useEffect(() => {
        // Initial check
        setIsDark(document.documentElement.classList.contains('dark'))

        // Observe class changes on html element
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains('dark'))
        })
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

        fetchData()
        return () => observer.disconnect()
    }, [dateRange])

    // Chart dynamic colors
    const chartGridColor = isDark ? '#1f2937' : '#e5e7eb'
    const chartAxisColor = isDark ? '#4b5563' : '#9ca3af'
    const chartTooltipBg = isDark ? '#1f2937' : '#ffffff'

    async function fetchData() {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // 1. Fetch Income (Rent Payments)
            const { data: payments } = await supabase
                .from('rent_payments')
                .select('amount, status, paid_date, property_id, properties(name)')
                .eq('user_id', user.id)
                .eq('status', 'paid')

            // 2. Fetch Expenses
            const { data: expenses } = await supabase
                .from('expenses')
                .select('amount, category, date, property_id, properties(name)')
                .eq('user_id', user.id)

            // 3. Fetch Properties (for occupancy)
            const { data: properties } = await (supabase
                .from('properties')
                .select('id, name, total_units, (SELECT count(*) FROM tenants WHERE property_id = properties.id)')
                .eq('user_id', user.id) as any)

            // Process Data (Simplified for Demo Logic - usually done via Group By on backend)
            // Month-by-month aggregation (last 12 months)
            const monthlyData: any[] = []
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            const now = new Date()

            for (let i = 11; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                const monthName = months[d.getMonth()]
                const year = d.getFullYear()

                const monthIncome = (payments || [])
                    .filter(p => {
                        const pd = new Date(p.paid_date)
                        return pd.getMonth() === d.getMonth() && pd.getFullYear() === year
                    })
                    .reduce((sum, p) => sum + Number(p.amount), 0)

                const monthExpense = (expenses || [])
                    .filter(e => {
                        const ed = new Date(e.date)
                        return ed.getMonth() === d.getMonth() && ed.getFullYear() === year
                    })
                    .reduce((sum, e) => sum + Number(e.amount), 0)

                monthlyData.push({
                    name: `${monthName} ${year}`,
                    income: monthIncome,
                    expense: monthExpense,
                    net: monthIncome - monthExpense
                })
            }

            // Category aggregation
            const categoryMap: any = {}
            expenses?.forEach(e => {
                categoryMap[e.category] = (categoryMap[e.category] || 0) + Number(e.amount)
            })
            const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }))

            // Property Net aggregation
            const propertyNet = properties?.map((p: any) => {
                const pIncome = (payments || []).filter(pay => pay.property_id === p.id).reduce((s, pay) => s + Number(pay.amount), 0)
                const pExpense = (expenses || []).filter(ex => ex.property_id === p.id).reduce((s, ex) => s + Number(ex.amount), 0)
                const units = Number(p.total_units || 1)
                const occupied = (p as any).count || 0
                return {
                    name: p.name,
                    income: pIncome,
                    expense: pExpense,
                    net: pIncome - pExpense,
                    occupancy: (occupied / units) * 100
                }
            })

            setData({
                monthly: monthlyData,
                categories: categoryData,
                properties: propertyNet,
                summary: {
                    totalIncome: payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0,
                    totalExpense: expenses?.reduce((sum: number, e: any) => sum + Number(e.amount), 0) || 0,
                    avgOccupancy: properties?.length ? (properties.reduce((sum: number, p: any) => sum + (((p as any).count || 0) / Number(p.total_units || 1)), 0) / properties.length) * 100 : 0
                }
            })

        } catch (error) {
            console.error('Error fetching report data:', error)
            toast.error('Failed to load financial reports')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="p-8 space-y-6 animate-pulse">
                <div className="flex justify-between items-center mb-8">
                    <div className="space-y-2">
                        <div className="h-8 w-48 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
                        <div className="h-4 w-64 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl"></div>
                    ))}
                </div>
                <div className="h-[400px] bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl"></div>
            </div>
        )
    }

    const income = data?.summary?.totalIncome || 0
    const expense = data?.summary?.totalExpense || 0
    const net = income - expense

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white p-6 md:p-8 transition-colors duration-200">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* ── Header ─────────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ fontFamily: 'var(--font-bricolage)' }}>
                            Financial Reports
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Portfolio performance and cash flow analysis overview.</p>
                    </div>

                    <div className="flex items-center p-1 bg-gray-100 dark:bg-[#0D0D0D] border border-gray-200 dark:border-white/5 rounded-full">
                        {[
                            { id: 'month', label: 'Month' },
                            { id: 'last_month', label: 'Last' },
                            { id: 'year', label: 'Year' },
                            { id: 'all', label: 'All Time' }
                        ].map(r => (
                            <button
                                key={r.id}
                                onClick={() => setDateRange(r.id as any)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${dateRange === r.id ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-lg' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Tabs ───────────────────────────────────────────────────── */}
                <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none border-b border-gray-200 dark:border-gray-800">
                    {[
                        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                        { id: 'pl', label: 'P&L Per Property', icon: BarChart2 },
                        { id: 'cash', label: 'Cash Flow', icon: Wallet },
                        { id: 'expenses', label: 'Expense Breakdown', icon: PieIcon }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap border-b-2 -mb-[2px] ${activeTab === tab.id ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── Tab Content ────────────────────────────────────────────── */}
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className={CARD_STYLE}>
                                <div className="flex justify-between items-start mb-4">
                                    <span className={STAT_LABEL}>Total Income</span>
                                    <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                                        <TrendingUp className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className={STAT_VALUE}>${income.toLocaleString()}</div>
                                <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                                    <ArrowUpRight className="w-3 h-3" /> 12.5% vs last month
                                </div>
                            </div>

                            <div className={CARD_STYLE}>
                                <div className="flex justify-between items-start mb-4">
                                    <span className={STAT_LABEL}>Total Expenses</span>
                                    <div className="p-2 bg-red-500/10 rounded-xl text-red-400">
                                        <TrendingDown className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className={STAT_VALUE}>${expense.toLocaleString()}</div>
                                <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-red-400 uppercase tracking-wider">
                                    <ArrowDownRight className="w-3 h-3" /> 4.2% vs last month
                                </div>
                            </div>

                            <div className={CARD_STYLE}>
                                <div className="flex justify-between items-start mb-4">
                                    <span className={STAT_LABEL}>Net Profit</span>
                                    <div className={`p-2 ${net >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'} rounded-xl`}>
                                        <DollarSign className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className={`${STAT_VALUE} ${net >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-500'}`}>
                                    ${net.toLocaleString()}
                                </div>
                                <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                    {((net / (income || 1)) * 100).toFixed(1)}% Profit Margin
                                </div>
                            </div>

                            <div className={CARD_STYLE}>
                                <div className="flex justify-between items-start mb-4">
                                    <span className={STAT_LABEL}>Occupancy Rate</span>
                                    <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                                        <Home className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className={STAT_VALUE}>{data?.summary?.avgOccupancy?.toFixed(1)}%</div>
                                <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    Across portfolio
                                </div>
                            </div>
                        </div>

                        {/* Main Income Chart */}
                        <div className="bg-white dark:bg-[#0D0D0D] border border-gray-200 dark:border-white/5 rounded-3xl p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-bold mb-1 text-gray-900 dark:text-white">Income vs Expenses</h3>
                                    <p className="text-xs text-gray-500">12-month performance trend line.</p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Income</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Expenses</span>
                                    </div>
                                </div>
                            </div>
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data?.monthly}>
                                        <defs>
                                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: chartAxisColor, fontSize: 10, fontWeight: 700 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: chartAxisColor, fontSize: 10, fontWeight: 700 }}
                                            tickFormatter={(val) => `$${val}`}
                                        />
                                        <Tooltip content={<CustomTooltip isDark={isDark} />} />
                                        <Area
                                            type="monotone"
                                            dataKey="income"
                                            stroke="#10b981"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorIncome)"
                                            name="Income"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="expense"
                                            stroke="#ef4444"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorExpense)"
                                            name="Expense"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Bottom Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Top Properties */}
                            <div className="bg-white dark:bg-[#0D0D0D] border border-gray-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
                                <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-white">Top Performing Properties</h3>
                                <div className="space-y-4">
                                    {(data?.properties || []).sort((a: any, b: any) => b.net - a.net).slice(0, 4).map((prop: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                                                    #{idx + 1}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{prop.name}</p>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{prop.occupancy.toFixed(0)}% Occupied</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+${prop.net.toLocaleString()}</p>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Net Profit</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Portfolio Breakdown */}
                            <div className="bg-white dark:bg-[#0D0D0D] border border-gray-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
                                <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-white">Occupancy Health</h3>
                                <div className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data?.properties?.map((p: any) => ({ name: p.name, value: p.income }))}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {data?.properties?.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip isDark={isDark} />} />
                                            <Legend
                                                verticalAlign="bottom"
                                                height={36}
                                                content={({ payload }) => (
                                                    <div className="flex flex-wrap justify-center gap-4 mt-4">
                                                        {payload?.map((entry: any, index: number) => (
                                                            <div key={index} className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{entry.value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── P&L Per Property Tab Content ────────────────────────────── */}
                {activeTab === 'pl' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Performance Per Property</h3>
                            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all">
                                <Download className="w-3.5 h-3.5" /> Export PDF Report
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {data?.properties?.map((prop: any, idx: number) => (
                                <div key={idx} className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-emerald-500/30 transition-all shadow-sm">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">{prop.name}</p>
                                        <p className="text-xs text-gray-500 mb-4">{prop.occupancy.toFixed(0)}% occupancy across all units</p>
                                        <div className="flex items-center gap-6">
                                            <div>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Income</p>
                                                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">${prop.income.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Expenses</p>
                                                <p className="text-lg font-bold text-red-500">-${prop.expense.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mini Sparkline replacement */}
                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Net Profit</p>
                                            <p className={`text-2xl font-black ${prop.net >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-500'}`}>
                                                ${prop.net.toLocaleString()}
                                            </p>
                                            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${prop.net >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>
                                                {((prop.net / (prop.income || 1)) * 100).toFixed(1)}% Margin
                                            </span>
                                        </div>
                                        <div className="p-3 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                            <Activity className={`w-6 h-6 ${prop.net >= 0 ? 'text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'text-red-500'}`} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Cash Flow Tab Content ─────────────────────────────────── */}
                {activeTab === 'cash' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="bg-white dark:bg-[#0D0D0D] border border-gray-200 dark:border-white/5 rounded-3xl p-8 shadow-sm">
                            <div className="mb-8">
                                <h3 className="text-xl font-bold mb-1 text-gray-900 dark:text-white">Monthly Cash Flow</h3>
                                <p className="text-xs text-gray-500">Net cash flow performance throughout the year.</p>
                            </div>
                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={data?.monthly}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: chartAxisColor, fontSize: 10, fontWeight: 700 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: chartAxisColor, fontSize: 10, fontWeight: 700 }}
                                        />
                                        <Tooltip content={<CustomTooltip isDark={isDark} />} />
                                        <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} name="Income" />
                                        <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} name="Expense" />
                                        <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2 }} name="Net Cash Flow" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className={CARD_STYLE}>
                                <span className={STAT_LABEL}>Avg. Monthly Income</span>
                                <div className="text-2xl font-bold">${Math.round(income / 12).toLocaleString()}</div>
                            </div>
                            <div className={CARD_STYLE}>
                                <span className={STAT_LABEL}>Avg. Monthly Expenses</span>
                                <div className="text-2xl font-bold">${Math.round(expense / 12).toLocaleString()}</div>
                            </div>
                            <div className={CARD_STYLE}>
                                <span className={STAT_LABEL}>Avg. Monthly Net</span>
                                <div className={`text-2xl font-bold ${net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                                    ${Math.round(net / 12).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Expense Breakdown Tab Content ────────────────────────────── */}
                {activeTab === 'expenses' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="lg:col-span-1 bg-white dark:bg-[#0D0D0D] border border-gray-200 dark:border-white/5 rounded-3xl p-8 flex flex-col items-center shadow-sm relative">
                            <h3 className="text-xl font-bold self-start mb-8 text-gray-900 dark:text-white">Expenses by Category</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data?.categories}
                                            innerRadius={80}
                                            outerRadius={100}
                                            paddingAngle={8}
                                            dataKey="value"
                                        >
                                            {data?.categories?.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip isDark={isDark} />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-x-0 bottom-0 top-0 flex flex-col items-center justify-center pointer-events-none mt-8">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Spent</p>
                                    <p className="text-3xl font-black text-gray-900 dark:text-white">${expense.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2 bg-white dark:bg-[#0D0D0D] border border-gray-200 dark:border-white/5 rounded-3xl p-4 overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-gray-800">
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Category</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Amount</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right whitespace-nowrap">% of Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                                    {data?.categories?.sort((a: any, b: any) => b.value - a.value).map((cat: any, idx: number) => (
                                        <tr key={idx} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{cat.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-bold text-gray-900 dark:text-white">
                                                ${cat.value.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-3 font-bold">
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">{((cat.value / (expense || 1)) * 100).toFixed(1)}%</span>
                                                    <div className="w-16 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                                        <div
                                                            className="h-full bg-emerald-500 transition-all duration-1000"
                                                            style={{ width: `${(cat.value / (expense || 1)) * 100}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function LayoutDashboard(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="7" height="9" x="3" y="3" rx="1" />
            <rect width="7" height="5" x="14" y="3" rx="1" />
            <rect width="7" height="9" x="14" y="12" rx="1" />
            <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
    )
}
