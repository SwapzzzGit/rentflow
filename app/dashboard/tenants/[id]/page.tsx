'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Edit2, DollarSign, Calendar, Home, Wrench, Mail, CheckCircle, Clock, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge } from '@/components/ui/status-badge'
import toast from 'react-hot-toast'

type Tenant = {
    id: string; full_name: string; email: string; phone: string; property_id: string
    rent_amount: number | null; lease_start: string; lease_end: string; status: string; avatar_color: string
    portal_enabled?: boolean; portal_invited_at?: string | null; portal_user_id?: string | null
    property?: { id: string; name: string; address: string }
}
type Payment = { id: string; amount: number; due_date: string; paid_date: string | null; status: string; notes: string | null }
type Ticket = { id: string; title: string; status: string; priority: string; created_at: string }

export default function TenantDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const supabase = createClient()
    const [tenant, setTenant] = useState<Tenant | null>(null)
    const [payments, setPayments] = useState<Payment[]>([])
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [loading, setLoading] = useState(true)
    const [inviting, setInviting] = useState(false)

    const fetchData = useCallback(async () => {
        setLoading(true)
        const [{ data: t }, { data: p }, { data: tk }] = await Promise.all([
            supabase.from('tenants').select('*, property:properties(id, name, address)').eq('id', id).single(),
            supabase.from('rent_payments').select('*').eq('tenant_id', id).order('due_date', { ascending: false }).limit(12),
            supabase.from('maintenance_tickets').select('id, title, status, priority, created_at').eq('tenant_id', id).order('created_at', { ascending: false }).limit(5),
        ])
        if (t) setTenant(t as Tenant)
        setPayments((p || []) as Payment[])
        setTickets((tk || []) as Ticket[])
        setLoading(false)
    }, [id, supabase])

    useEffect(() => { fetchData() }, [fetchData])

    async function inviteToPortal() {
        if (!tenant) return
        setInviting(true)
        try {
            const res = await fetch('/api/tenant/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId: tenant.id }),
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Invite failed')
            toast.success(json.message || 'Invite sent!')
            fetchData()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setInviting(false)
        }
    }

    if (loading) return (
        <div className="p-8 w-full">
            <div className="h-8 w-32 rounded-lg animate-pulse mb-8" style={{ background: 'var(--dash-card-bg)' }} />
            <div className="h-40 rounded-2xl animate-pulse" style={{ background: 'var(--dash-card-bg)' }} />
        </div>
    )

    if (!tenant) return (
        <div className="p-8 w-full text-center py-20" style={{ color: 'var(--dash-muted)' }}>
            Tenant not found. <button className="underline" onClick={() => router.push('/dashboard/tenants')}>Go back</button>
        </div>
    )

    const daysLeft = tenant.lease_end ? Math.ceil((new Date(tenant.lease_end).getTime() - Date.now()) / 86400000) : null
    const initials = tenant.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

    const card = (children: React.ReactNode) => (
        <div className="rounded-2xl p-6" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}>
            {children}
        </div>
    )

    const portalEnabled = tenant.portal_enabled
    const portalInvitedAt = tenant.portal_invited_at
    const portalUserId = tenant.portal_user_id

    return (
        <div className="p-8 w-full">
            {/* Back */}
            <button onClick={() => router.push('/dashboard/tenants')} className="flex items-center gap-2 text-sm mb-6 transition-colors hover:opacity-80" style={{ color: 'var(--dash-muted)' }}>
                <ArrowLeft className="w-4 h-4" /> Back to Tenants
            </button>

            {/* Header card */}
            {card(
                <div className="flex items-start gap-5 flex-wrap">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0" style={{ background: tenant.avatar_color || '#E8392A' }}>
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-1">
                            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--dash-text)' }}>{tenant.full_name}</h1>
                            <StatusBadge status={tenant.status} />
                        </div>
                        <p className="text-sm" style={{ color: 'var(--dash-muted)' }}>{tenant.email || '—'} {tenant.phone && `· ${tenant.phone}`}</p>
                        <p className="text-sm mt-1" style={{ color: 'var(--dash-muted)' }}>
                            <Home className="w-3.5 h-3.5 inline mr-1" />{(tenant as any).property?.name || '—'} · {(tenant as any).property?.address}
                        </p>
                    </div>
                    <button onClick={() => router.push(`/dashboard/tenants`)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold" style={{ color: 'var(--dash-muted)', background: 'var(--dash-nav-hover)', border: '1px solid var(--dash-border)' }}>
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                </div>
            )}

            {/* Info row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                {[
                    { icon: DollarSign, label: 'Monthly Rent', value: tenant.rent_amount ? `$${Number(tenant.rent_amount).toLocaleString()}` : '—' },
                    { icon: Calendar, label: 'Lease Start', value: tenant.lease_start ? new Date(tenant.lease_start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
                    { icon: Calendar, label: 'Lease End', value: tenant.lease_end ? new Date(tenant.lease_end).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
                    { icon: Calendar, label: 'Days Remaining', value: daysLeft !== null ? `${daysLeft} days` : '—', alert: daysLeft !== null && daysLeft < 30 },
                ].map(({ icon: Icon, label, value, alert }) => (
                    <div key={label} className="rounded-2xl p-5" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}>
                        <div className="flex items-center gap-2 mb-2">
                            <Icon className="w-4 h-4" style={{ color: 'var(--dash-muted)' }} />
                            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--dash-muted)' }}>{label}</p>
                        </div>
                        <p className="text-lg font-bold" style={{ color: alert ? '#E8392A' : 'var(--dash-text)', fontFamily: 'var(--font-bricolage)' }}>{value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Rent Payment History */}
                {card(
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--dash-text)' }}>Rent Payment History</h2>
                            <DollarSign className="w-4 h-4" style={{ color: 'var(--dash-muted)' }} />
                        </div>
                        {payments.length === 0 ? <p className="text-sm py-4 text-center" style={{ color: 'var(--dash-muted)' }}>No payments recorded yet.</p> : (
                            <div className="space-y-0">
                                {payments.map((pay, i) => (
                                    <div key={pay.id} className="flex items-center justify-between py-3" style={{ borderBottom: i < payments.length - 1 ? '1px solid var(--dash-divider)' : 'none' }}>
                                        <div>
                                            <p className="text-sm font-medium" style={{ color: 'var(--dash-text)' }}>{new Date(pay.due_date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
                                            <p className="text-xs" style={{ color: 'var(--dash-muted)' }}>{pay.paid_date ? `Paid ${new Date(pay.paid_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}` : 'Not paid'}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-semibold" style={{ color: 'var(--dash-text)' }}>${Number(pay.amount).toLocaleString()}</span>
                                            <StatusBadge status={pay.status} variant="rent" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Maintenance Tickets */}
                {card(
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--dash-text)' }}>Maintenance Tickets</h2>
                            <Wrench className="w-4 h-4" style={{ color: 'var(--dash-muted)' }} />
                        </div>
                        {tickets.length === 0 ? <p className="text-sm py-4 text-center" style={{ color: 'var(--dash-muted)' }}>No maintenance tickets.</p> : (
                            <div className="space-y-0">
                                {tickets.map((tk, i) => (
                                    <div key={tk.id} className="flex items-center justify-between py-3 cursor-pointer" onClick={() => router.push(`/dashboard/maintenance/${tk.id}`)} style={{ borderBottom: i < tickets.length - 1 ? '1px solid var(--dash-divider)' : 'none' }}>
                                        <div>
                                            <p className="text-sm font-medium" style={{ color: 'var(--dash-text)' }}>{tk.title}</p>
                                            <p className="text-xs" style={{ color: 'var(--dash-muted)' }}>{new Date(tk.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <StatusBadge status={tk.status} variant="maintenance" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── Tenant Portal Access ─────────────────────────────────────────── */}
            <div className="mt-6">
                {card(
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: portalEnabled ? 'rgba(34,197,94,0.1)' : 'rgba(232,57,42,0.08)' }}>
                                <Shield className="w-5 h-5" style={{ color: portalEnabled ? '#16A34A' : '#E8392A' }} />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold mb-1" style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--dash-text)' }}>Tenant Portal Access</h2>
                                {portalEnabled && portalInvitedAt ? (
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(34,197,94,0.1)', color: '#16A34A' }}>
                                            <CheckCircle className="w-3.5 h-3.5" /> Invite Sent
                                        </span>
                                        <span className="text-xs" style={{ color: 'var(--dash-muted)' }}>
                                            {new Date(portalInvitedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(107,114,128,0.1)', color: '#6B7280' }}>
                                        <Clock className="w-3.5 h-3.5" /> Not invited yet
                                    </span>
                                )}
                                {tenant.email && <p className="text-xs mt-1.5" style={{ color: 'var(--dash-muted)' }}>Invite will be sent to <strong>{tenant.email}</strong></p>}
                            </div>
                        </div>
                        <button
                            onClick={inviteToPortal}
                            disabled={inviting || !tenant.email}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 flex-shrink-0"
                            style={{
                                background: portalEnabled ? 'var(--dash-nav-hover)' : '#E8392A',
                                color: portalEnabled ? 'var(--dash-text)' : 'white',
                                border: portalEnabled ? '1px solid var(--dash-border)' : 'none',
                            }}
                        >
                            <Mail className="w-4 h-4" />
                            {inviting ? 'Sending…' : portalEnabled ? 'Resend Invite' : 'Invite to Portal'}
                        </button>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 flex gap-4 flex-wrap">
                <button
                    onClick={() => router.push('/dashboard/rent')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90"
                    style={{ background: '#E8392A' }}
                >
                    <DollarSign className="w-4 h-4" /> Mark Rent Paid
                </button>
                <button
                    onClick={() => router.push('/dashboard/maintenance')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    style={{ color: 'var(--dash-text)', background: 'var(--dash-nav-hover)', border: '1px solid var(--dash-border)' }}
                >
                    <Wrench className="w-4 h-4" /> Raise Maintenance Ticket
                </button>
            </div>
        </div>
    )
}
