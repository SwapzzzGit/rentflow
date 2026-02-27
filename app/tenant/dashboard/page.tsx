'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DollarSign, Calendar, Wrench, Home, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

type Tenant = { id: string; full_name: string; rent_amount: number | null; property?: { name: string; address: string } }
type Lease = { id: string; start_date: string; end_date: string; rent_amount: number }
type RentPayment = { id: string; amount: number; due_date: string; status: string }
type Ticket = { id: string; status: string }

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`rounded-2xl p-5 ${className}`} style={{ background: 'white', border: '1px solid #E9EBF0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            {children}
        </div>
    )
}

function StatusChip({ status }: { status: string }) {
    const map: Record<string, { bg: string; color: string; label: string }> = {
        paid: { bg: 'rgba(34,197,94,0.1)', color: '#16A34A', label: 'Paid' },
        pending: { bg: 'rgba(234,179,8,0.1)', color: '#CA8A04', label: 'Pending' },
        overdue: { bg: 'rgba(232,57,42,0.1)', color: '#E8392A', label: 'Overdue' },
    }
    const s = map[status] ?? map.pending
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span>
}

export default function TenantDashboard() {
    const supabase = createClient()
    const router = useRouter()
    const [tenant, setTenant] = useState<Tenant | null>(null)
    const [lease, setLease] = useState<Lease | null>(null)
    const [nextRent, setNextRent] = useState<RentPayment | null>(null)
    const [openTickets, setOpenTickets] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return  // layout handles redirect

            const { data: t } = await supabase
                .from('tenants')
                .select('id, full_name, rent_amount, property:properties(name, address)')
                .eq('portal_user_id', user.id)
                .single()

            if (!t) return  // layout will redirect if genuinely unauthorised
            setTenant(t as unknown as Tenant)

            const [{ data: leaseData }, { data: rentData }, { data: ticketsData }] = await Promise.all([
                supabase.from('leases').select('id, start_date, end_date, rent_amount').eq('tenant_id', t.id).order('end_date', { ascending: false }).limit(1).single(),
                supabase.from('rent_payments').select('id, amount, due_date, status').eq('tenant_id', t.id).gte('due_date', new Date().toISOString().split('T')[0]).order('due_date', { ascending: true }).limit(1),
                supabase.from('maintenance_tickets').select('id, status').eq('tenant_id', t.id).in('status', ['open', 'in_progress']),
            ])

            if (leaseData) setLease(leaseData as Lease)
            if (rentData && rentData.length > 0) setNextRent(rentData[0] as RentPayment)
            setOpenTickets(ticketsData?.length ?? 0)
            setLoading(false)
        }
        load()
    }, [supabase])

    if (loading) return (
        <div className="space-y-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 rounded-2xl animate-pulse" style={{ background: '#E8E7E3' }} />)}
        </div>
    )

    if (!tenant) return null

    const daysLeft = lease?.end_date ? Math.ceil((new Date(lease.end_date).getTime() - Date.now()) / 86400000) : null
    const prop = (tenant as any).property

    return (
        <div className="space-y-5">
            {/* Welcome banner */}
            <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #E8392A 0%, #c9281a 100%)', color: 'white' }}>
                <p className="text-sm font-medium opacity-80">Welcome back</p>
                <h1 className="text-2xl font-bold mt-0.5" style={{ fontFamily: 'var(--font-bricolage, serif)' }}>
                    {tenant.full_name.split(' ')[0]} 👋
                </h1>
                {prop && <p className="text-sm opacity-75 mt-1 flex items-center gap-1.5"><Home className="w-3.5 h-3.5" />{prop.name}</p>}
            </div>

            {/* Summary grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Next Rent */}
                <Card>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>Next Rent Due</p>
                            {nextRent ? (
                                <>
                                    <p className="text-2xl font-bold" style={{ color: '#111', fontFamily: 'var(--font-bricolage, serif)' }}>
                                        ${Number(nextRent.amount).toLocaleString()}
                                    </p>
                                    <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
                                        {new Date(nextRent.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </p>
                                    <div className="mt-2"><StatusChip status={nextRent.status} /></div>
                                </>
                            ) : (
                                <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>No upcoming rent</p>
                            )}
                        </div>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(232,57,42,0.08)' }}>
                            <DollarSign className="w-5 h-5" style={{ color: '#E8392A' }} />
                        </div>
                    </div>
                </Card>

                {/* Lease */}
                <Card>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>Active Lease</p>
                            {lease ? (
                                <>
                                    <p className="text-2xl font-bold" style={{ color: daysLeft !== null && daysLeft < 60 ? '#E8392A' : '#111', fontFamily: 'var(--font-bricolage, serif)' }}>
                                        {daysLeft !== null ? `${daysLeft}d` : '—'}
                                    </p>
                                    <p className="text-sm mt-1" style={{ color: '#6B7280' }}>remaining</p>
                                    <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                                        {new Date(lease.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} →{' '}
                                        {new Date(lease.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>No active lease</p>
                            )}
                        </div>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.08)' }}>
                            <Calendar className="w-5 h-5" style={{ color: '#6366F1' }} />
                        </div>
                    </div>
                </Card>

                {/* Open tickets */}
                <Card>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>Open Requests</p>
                            <p className="text-2xl font-bold" style={{ color: openTickets > 0 ? '#CA8A04' : '#111', fontFamily: 'var(--font-bricolage, serif)' }}>{openTickets}</p>
                            <p className="text-sm mt-1" style={{ color: '#6B7280' }}>maintenance tickets</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(234,179,8,0.08)' }}>
                            <Wrench className="w-5 h-5" style={{ color: '#CA8A04' }} />
                        </div>
                    </div>
                </Card>

                {/* Property */}
                <Card>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>Your Property</p>
                            <p className="text-base font-bold mt-1" style={{ color: '#111' }}>{prop?.name ?? '—'}</p>
                            {prop?.address && <p className="text-sm mt-1" style={{ color: '#6B7280' }}>{prop.address}</p>}
                        </div>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34,197,94,0.08)' }}>
                            <Home className="w-5 h-5" style={{ color: '#16A34A' }} />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}
