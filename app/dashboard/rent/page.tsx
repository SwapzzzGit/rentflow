'use client'

import { useEffect, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Download, CheckCircle, RotateCcw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge } from '@/components/ui/status-badge'
import toast from 'react-hot-toast'

type RentRow = {
    id: string
    tenant_id: string
    property_id: string
    amount: number
    due_date: string
    paid_date: string | null
    status: string
    notes: string | null
    tenant?: { full_name: string; avatar_color: string }
    property?: { name: string }
}

type PayingState = { id: string; paid_date: string; note: string } | null

export default function RentPage() {
    const supabase = createClient()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [rows, setRows] = useState<RentRow[]>([])
    const [loading, setLoading] = useState(true)
    const [paying, setPaying] = useState<PayingState>(null)
    const [confirming, setConfirming] = useState(false)

    const month = currentDate.getMonth()
    const year = currentDate.getFullYear()
    const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    const fetchRents = useCallback(async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        // Ensure rows exist for all active tenants this month
        const firstOfMonth = `${year}-${String(month + 1).padStart(2, '0')}-01`
        const { data: activeTenants } = await supabase.from('tenants').select('id, property_id, rent_amount').eq('user_id', user.id).eq('status', 'active')

        if (activeTenants && activeTenants.length > 0) {
            const { data: existing } = await supabase.from('rent_payments')
                .select('tenant_id')
                .eq('user_id', user.id)
                .gte('due_date', firstOfMonth)
                .lt('due_date', `${year}-${String(month + 2).padStart(2, '0')}-01`)

            const existingTenantIds = new Set((existing || []).map((r: any) => r.tenant_id))
            const toInsert = activeTenants
                .filter((t: any) => !existingTenantIds.has(t.id))
                .map((t: any) => ({ user_id: user.id, tenant_id: t.id, property_id: t.property_id, amount: t.rent_amount || 0, due_date: firstOfMonth, status: 'pending' }))

            if (toInsert.length > 0) {
                await supabase.from('rent_payments').insert(toInsert)
            }
        }

        // Fetch rows for this month
        const { data, error } = await supabase.from('rent_payments')
            .select('*, tenant:tenants(full_name, avatar_color), property:properties(name)')
            .eq('user_id', user.id)
            .gte('due_date', firstOfMonth)
            .lt('due_date', `${year}-${String(month + 2).padStart(2, '0')}-01`)
            .order('due_date', { ascending: true })

        if (error) { toast.error('Failed to load rent data'); setLoading(false); return }
        setRows((data || []) as RentRow[])
        setLoading(false)
    }, [supabase, month, year])

    useEffect(() => { fetchRents() }, [fetchRents])

    function prevMonth() { setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)) }
    function nextMonth() { setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)) }

    function isOverdue(row: RentRow) {
        return row.status !== 'paid' && new Date(row.due_date) < new Date()
    }

    const effectiveStatus = (row: RentRow) => isOverdue(row) ? 'overdue' : row.status

    // Summary stats
    const total = rows.reduce((sum, r) => sum + Number(r.amount), 0)
    const collected = rows.filter(r => r.status === 'paid').reduce((sum, r) => sum + Number(r.amount), 0)
    const outstanding = total - collected
    const rate = total > 0 ? Math.round((collected / total) * 100) : 0

    async function confirmPayment() {
        if (!paying) return
        setConfirming(true)
        const { error } = await supabase.from('rent_payments').update({ status: 'paid', paid_date: paying.paid_date, notes: paying.note || null }).eq('id', paying.id)
        if (error) { toast.error(error.message); setConfirming(false); return }
        toast.success('Rent marked as paid ✓')
        setPaying(null)
        setConfirming(false)
        fetchRents()
    }

    async function undoPayment(id: string) {
        const { error } = await supabase.from('rent_payments').update({ status: 'pending', paid_date: null, notes: null }).eq('id', id)
        if (error) { toast.error(error.message); return }
        toast.success('Payment undone')
        fetchRents()
    }

    function exportCSV() {
        const header = ['Tenant', 'Property', 'Amount', 'Due Date', 'Status', 'Paid Date']
        const csvRows = rows.map(r => [
            (r as any).tenant?.full_name || '', (r as any).property?.name || '',
            r.amount, r.due_date, effectiveStatus(r), r.paid_date || '',
        ])
        const csv = [header, ...csvRows].map(row => row.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = `rent-${monthLabel.replace(' ', '-')}.csv`; a.click()
        URL.revokeObjectURL(url)
    }

    const initials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

    return (
        <div className="p-8 w-full">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--dash-text)' }}>Rent Tracking</h1>
                <div className="flex items-center gap-4">
                    {/* Month selector */}
                    <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}>
                        <button onClick={prevMonth} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors" style={{ color: 'var(--dash-muted)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--dash-nav-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-semibold w-36 text-center" style={{ color: 'var(--dash-text)' }}>{monthLabel}</span>
                        <button onClick={nextMonth} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors" style={{ color: 'var(--dash-muted)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--dash-nav-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                    <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors" style={{ color: 'var(--dash-text)', background: 'var(--dash-nav-hover)', border: '1px solid var(--dash-border)' }}>
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </div>
            </div>

            {/* Summary pills */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Expected', value: `$${total.toLocaleString()}`, color: 'var(--dash-text)' },
                    { label: 'Collected', value: `$${collected.toLocaleString()}`, color: 'var(--dash-badge-paid-text)' },
                    { label: 'Outstanding', value: `$${outstanding.toLocaleString()}`, color: outstanding > 0 ? 'var(--dash-badge-over-text)' : 'var(--dash-badge-paid-text)' },
                    { label: 'Collection Rate', value: `${rate}%`, color: rate >= 80 ? 'var(--dash-badge-paid-text)' : 'var(--dash-badge-pend-text)' },
                ].map(stat => (
                    <div key={stat.label} className="rounded-xl px-5 py-4" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--dash-muted)' }}>{stat.label}</p>
                        <p className="text-xl font-bold" style={{ color: stat.color, fontFamily: 'var(--font-bricolage)' }}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Loading */}
            {loading && <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--dash-card-bg)' }} />)}</div>}

            {/* Table */}
            {!loading && (
                <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}>
                    {rows.length === 0 ? (
                        <p className="text-center py-16 text-sm" style={{ color: 'var(--dash-muted)' }}>No rent records for {monthLabel}. Add active tenants to generate records.</p>
                    ) : (
                        rows.map((row, idx) => {
                            const status = effectiveStatus(row)
                            const isPaid = row.status === 'paid'
                            const isPayingThis = paying?.id === row.id
                            return (
                                <div key={row.id} style={{ borderBottom: idx < rows.length - 1 ? '1px solid var(--dash-divider)' : 'none' }}>
                                    <div className="flex items-center gap-4 px-6 py-4 flex-wrap">
                                        {/* Avatar + name */}
                                        <div className="flex items-center gap-3 flex-1 min-w-[160px]">
                                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: (row as any).tenant?.avatar_color || '#E8392A' }}>
                                                {initials((row as any).tenant?.full_name || '?')}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold" style={{ color: 'var(--dash-text)' }}>{(row as any).tenant?.full_name || '—'}</p>
                                                <p className="text-xs" style={{ color: 'var(--dash-muted)' }}>{(row as any).property?.name || '—'}</p>
                                            </div>
                                        </div>
                                        {/* Amount */}
                                        <p className="text-sm font-bold w-24" style={{ color: 'var(--dash-text)' }}>${Number(row.amount).toLocaleString()}</p>
                                        {/* Due date */}
                                        <p className="text-xs hidden md:block w-24" style={{ color: 'var(--dash-muted)' }}>Due {new Date(row.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
                                        {/* Status */}
                                        <div className="w-24"><StatusBadge status={status} variant="rent" /></div>
                                        {/* Paid date */}
                                        <p className="text-xs hidden lg:block w-24" style={{ color: 'var(--dash-muted)' }}>{row.paid_date ? `Paid ${new Date(row.paid_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}` : ''}</p>
                                        {/* Actions */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {!isPaid ? (
                                                <button
                                                    onClick={() => setPaying({ id: row.id, paid_date: new Date().toISOString().split('T')[0], note: '' })}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90"
                                                    style={{ background: '#22C55E' }}
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5" /> Mark Paid
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => undoPayment(row.id)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                                                    style={{ color: 'var(--dash-muted)', background: 'var(--dash-nav-hover)' }}
                                                >
                                                    <RotateCcw className="w-3 h-3" /> Undo
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Inline mark-as-paid form */}
                                    {isPayingThis && (
                                        <div className="px-6 pb-4">
                                            <div className="rounded-xl p-4 flex flex-wrap items-end gap-4" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold" style={{ color: 'var(--dash-muted)' }}>Paid Date</label>
                                                    <input type="date" value={paying.paid_date} onChange={e => setPaying(p => p ? { ...p, paid_date: e.target.value } : null)} className="px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--dash-nav-hover)', border: '1px solid var(--dash-border)', color: 'var(--dash-text)' }} />
                                                </div>
                                                <div className="space-y-1 flex-1 min-w-[140px]">
                                                    <label className="text-xs font-semibold" style={{ color: 'var(--dash-muted)' }}>Note (optional)</label>
                                                    <input type="text" placeholder="e.g. Bank transfer" value={paying.note} onChange={e => setPaying(p => p ? { ...p, note: e.target.value } : null)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--dash-nav-hover)', border: '1px solid var(--dash-border)', color: 'var(--dash-text)' }} />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setPaying(null)} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ color: 'var(--dash-muted)', background: 'var(--dash-nav-hover)' }}>Cancel</button>
                                                    <button onClick={confirmPayment} disabled={confirming} className="px-4 py-2 rounded-lg text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50" style={{ background: '#22C55E' }}>
                                                        {confirming ? 'Saving...' : 'Confirm Payment'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>
            )}
        </div>
    )
}
