'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CustomSelect } from '@/components/ui/custom-select'
import { DollarSign, Zap } from 'lucide-react'

type Payment = { id: string; amount: number; late_fee_amount?: number; due_date: string; paid_date: string | null; status: string; notes: string | null }

function StatusChip({ status }: { status: string }) {
    const map: Record<string, { bg: string; color: string; label: string }> = {
        paid: { bg: 'rgba(34,197,94,0.1)', color: '#16A34A', label: 'Paid' },
        pending: { bg: 'rgba(234,179,8,0.1)', color: '#CA8A04', label: 'Pending' },
        overdue: { bg: 'rgba(232,57,42,0.1)', color: '#E8392A', label: 'Overdue' },
    }
    const s = map[status] ?? map.pending
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span>
}

export default function TenantRentPage() {
    const supabase = createClient()
    const router = useRouter()
    const [payments, setPayments] = useState<Payment[]>([])
    const [loading, setLoading] = useState(true)
    const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()))

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/tenant/login'); return }

            const { data: t } = await supabase.from('tenants').select('id').eq('portal_user_id', user.id).single()
            if (!t) { router.push('/tenant/login'); return }

            const { data } = await supabase
                .from('rent_payments')
                .select('*')
                .eq('tenant_id', t.id)
                .order('due_date', { ascending: false })

            setPayments((data || []) as Payment[])
            setLoading(false)
        }
        load()
    }, [supabase, router])

    const years = [...new Set(payments.map(p => new Date(p.due_date).getFullYear()))].sort((a, b) => b - a)
    const yearOptions = years.map(y => ({ value: String(y), label: String(y) }))

    const filtered = payments.filter(p => new Date(p.due_date).getFullYear() === Number(filterYear))

    const total = filtered.reduce((s, p) => s + Number(p.amount), 0)
    const paid = filtered.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0)

    if (loading) return (
        <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: '#F3F4F6' }} />)}
        </div>
    )

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: '#111', fontFamily: 'var(--font-bricolage, serif)' }}>Rent Payments</h1>
                    <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>{filtered.length} records</p>
                </div>
                <div className="w-32">
                    <CustomSelect
                        value={filterYear}
                        onChange={setFilterYear}
                        options={yearOptions.length ? yearOptions : [{ value: filterYear, label: filterYear }]}
                    />
                </div>
            </div>

            {/* Summary chips */}
            <div className="grid grid-cols-2 gap-3">
                {[
                    { label: 'Total Due', value: `$${total.toLocaleString()}`, color: '#111' },
                    { label: 'Total Paid', value: `$${paid.toLocaleString()}`, color: '#16A34A' },
                ].map(s => (
                    <div key={s.label} className="rounded-xl px-4 py-3" style={{ background: 'white', border: '1px solid #E9EBF0' }}>
                        <p className="text-xs font-medium mb-1" style={{ color: '#9CA3AF' }}>{s.label}</p>
                        <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
                <div className="rounded-2xl py-16 text-center" style={{ background: 'white', border: '1px solid #E9EBF0' }}>
                    <DollarSign className="w-10 h-10 mx-auto mb-3" style={{ color: '#D1D5DB' }} />
                    <p className="text-sm font-medium" style={{ color: '#6B7280' }}>No rent records for {filterYear}</p>
                </div>
            ) : (
                <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid #E9EBF0' }}>
                    {/* Header */}
                    <div className="hidden sm:grid grid-cols-5 px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ background: '#F9FAFB', color: '#9CA3AF', borderBottom: '1px solid #E9EBF0' }}>
                        <span>Month</span>
                        <span>Amount</span>
                        <span>Status</span>
                        <span>Paid Date</span>
                        <span>Action</span>
                    </div>
                    {filtered.map((pay, i) => (
                        <div
                            key={pay.id}
                            className="flex sm:grid sm:grid-cols-5 items-center px-5 py-4 gap-3"
                            style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F3F4F6' : 'none' }}
                        >
                            <p className="text-sm font-medium flex-1" style={{ color: '#111' }}>
                                {new Date(pay.due_date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                            </p>
                            <div>
                                <p className="text-sm font-semibold" style={{ color: '#111' }}>${Number(pay.amount).toLocaleString()}</p>
                                {Number(pay.late_fee_amount) > 0 && (
                                    <p className="text-xs" style={{ color: '#E8392A' }}>+${Number(pay.late_fee_amount).toLocaleString()} late fee</p>
                                )}
                            </div>
                            <StatusChip status={pay.status} />
                            <p className="text-sm hidden sm:block" style={{ color: '#6B7280' }}>
                                {pay.paid_date ? new Date(pay.paid_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            </p>
                            {pay.status !== 'paid' ? (
                                <button
                                    onClick={() => router.push(`/tenant/rent/pay?id=${pay.id}`)}
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 whitespace-nowrap"
                                    style={{ background: '#E8392A' }}
                                >
                                    <Zap className="w-3 h-3" />
                                    Pay Online
                                </button>
                            ) : (
                                <div />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
