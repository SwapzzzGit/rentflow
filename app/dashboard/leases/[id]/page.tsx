'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SignaturePad } from '@/components/ui/signature-pad'
import { SlidePanel } from '@/components/ui/slide-panel'
import { CustomSelect } from '@/components/ui/custom-select'
import {
    Check, Clock, FileText, Download, Send, RefreshCw,
    CheckCircle2, Circle, ChevronLeft, Shield, Trash2,
    Copy, ExternalLink, AlertTriangle, XCircle, PenLine
} from 'lucide-react'
import toast from 'react-hot-toast'

type Lease = {
    id: string
    status: string
    start_date: string
    end_date: string
    rent_amount: number | null
    document_url: string | null
    notes: string | null
    signing_token: string | null
    signing_requested_at: string | null
    landlord_signed_at: string | null
    tenant_signed_at: string | null
    signed_at: string | null
    signed_pdf_url: string | null
    landlord_signature: string | null
    terminated_at?: string | null
    termination_reason?: string | null
    terminated_by?: string | null
    termination_notice_days?: number | null
    property?: { name: string; address: string }
    tenant?: { full_name: string; email: string; avatar_color: string }
}

type AuditLog = {
    id: string
    event: string
    actor_name: string
    actor_email: string
    ip_address: string
    user_agent: string
    created_at: string
}

const STATUS_CONFIG = {
    draft: { color: '#6B7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.2)', label: 'Draft' },
    pending_landlord: { color: '#D97706', bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.25)', label: 'Awaiting Landlord Signature' },
    pending_tenant: { color: '#2563EB', bg: 'rgba(37,99,235,0.08)', border: 'rgba(37,99,235,0.25)', label: 'Awaiting Tenant Signature' },
    signed: { color: '#16A34A', bg: 'rgba(22,163,74,0.08)', border: 'rgba(22,163,74,0.25)', label: 'Fully Signed' },
    expired: { color: '#D97706', bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.2)', label: 'Expired' },
    terminated: { color: '#E8392A', bg: 'rgba(232,57,42,0.08)', border: 'rgba(232,57,42,0.25)', label: 'Terminated' },
} as const

const TERMINATION_REASONS = [
    { label: 'Non-payment of rent', value: 'Non-payment of rent' },
    { label: 'Lease violation', value: 'Lease violation' },
    { label: 'Property damage', value: 'Property damage' },
    { label: 'Mutual agreement', value: 'Mutual agreement' },
    { label: 'Landlord selling property', value: 'Landlord selling property' },
    { label: 'End of fixed term', value: 'End of fixed term' },
    { label: 'Tenant request', value: 'Tenant request' },
    { label: 'Other', value: 'Other' },
]

const NOTICE_PERIODS = [
    { label: 'Immediate', value: '0' },
    { label: '7 days', value: '7' },
    { label: '14 days', value: '14' },
    { label: '30 days', value: '30' },
    { label: '60 days', value: '60' },
    { label: '90 days', value: '90' },
]

export default function LeaseDetailPage() {
    const supabase = createClient()
    const router = useRouter()
    const params = useParams()
    const leaseId = params.id as string
    const signatureRef = useRef<HTMLDivElement>(null)

    const [lease, setLease] = useState<Lease | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [sendingRequest, setSendingRequest] = useState(false)
    const [downloadingPdf, setDownloadingPdf] = useState(false)
    const [viewingDoc, setViewingDoc] = useState(false)
    const [landlordSig, setLandlordSig] = useState<string | null>(null)
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])

    // Termination states
    const [terminateOpen, setTerminateOpen] = useState(false)
    const [termForm, setTermForm] = useState({
        reasonCategory: '',
        reasonDetail: '',
        noticePeriodDays: '30',
        effectiveDate: new Date().toISOString().split('T')[0],
    })
    const [terminating, setTerminating] = useState(false)

    const fetchLease = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        const { data, error } = await supabase
            .from('leases')
            .select(`
        id, status, start_date, end_date, rent_amount, document_url, notes,
        signing_token, signing_requested_at, landlord_signed_at, tenant_signed_at,
        signed_at, signed_pdf_url, landlord_signature, 
        terminated_at, termination_reason, terminated_by, termination_notice_days,
        property:properties(name, address),
        tenant:tenants(full_name, email, avatar_color)
      `)
            .eq('id', leaseId)
            .eq('user_id', user.id)
            .single()

        if (error || !data) { toast.error('Lease not found'); router.push('/dashboard/leases'); return }
        setLease(data as unknown as Lease)

        // Fetch audit trail logs
        const { data: logs } = await supabase
            .from('lease_audit_logs')
            .select('id, event, actor_name, actor_email, ip_address, user_agent, created_at')
            .eq('lease_id', leaseId)
            .order('created_at', { ascending: true })
        setAuditLogs(logs || [])

        setLoading(false)
    }, [supabase, leaseId, router])

    useEffect(() => { fetchLease() }, [fetchLease])

    async function handleSendForSigning() {
        setSendingRequest(true)
        try {
            const res = await fetch('/api/leases/request-signing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leaseId }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            toast.success('Signing request sent! Check your email.')
            fetchLease()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setSendingRequest(false)
        }
    }

    async function handleResendInvite() {
        setSendingRequest(true)
        try {
            const res = await fetch('/api/leases/resend-invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leaseId }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            toast.success('Signing reminder sent to tenant!')
            fetchLease()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setSendingRequest(false)
        }
    }

    async function handleCopySigningLink() {
        if (!lease?.signing_token) return
        const url = `${window.location.origin}/tenant/lease/sign?token=${lease.signing_token}`
        try {
            await navigator.clipboard.writeText(url)
            toast.success('Signing link copied to clipboard')
        } catch {
            toast.error('Failed to copy link')
        }
    }

    async function handleLandlordSign() {
        if (!landlordSig) { toast.error('Please save your signature first'); return }
        setSaving(true)
        try {
            const res = await fetch('/api/leases/landlord-sign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leaseId, signature: landlordSig }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            toast.success('Signature saved! Tenant has been notified.')
            fetchLease()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setSaving(false)
        }
    }

    async function handleTerminate() {
        if (!termForm.reasonCategory || termForm.reasonDetail.length < 20) {
            toast.error('Please select a reason and provide at least 20 characters of detail')
            return
        }
        setTerminating(true)
        try {
            const res = await fetch('/api/leases/terminate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leaseId,
                    reasonCategory: termForm.reasonCategory,
                    reasonDetail: termForm.reasonDetail,
                    noticePeriodDays: parseInt(termForm.noticePeriodDays),
                    effectiveDate: termForm.effectiveDate,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            toast.success('Lease terminated successfully')
            setTerminateOpen(false)
            fetchLease()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setTerminating(false)
        }
    }

    async function handleDownloadPdf() {
        setDownloadingPdf(true)
        try {
            const res = await fetch(`/api/leases/signed-pdf?leaseId=${leaseId}`)
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            window.open(data.url, '_blank')
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setDownloadingPdf(false)
        }
    }

    async function handleViewLeaseDoc() {
        if (!lease?.document_url) return
        setViewingDoc(true)
        try {
            const { data, error } = await supabase.storage
                .from('lease-documents')
                .createSignedUrl(lease.document_url, 3600)
            if (error || !data?.signedUrl) throw new Error(error?.message || 'Could not load document')
            window.open(data.signedUrl, '_blank')
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setViewingDoc(false)
        }
    }

    if (loading) return (
        <div className="p-8 space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: 'var(--dash-card-bg)' }} />)}
        </div>
    )

    if (!lease) return null

    const status = lease.status as keyof typeof STATUS_CONFIG
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft
    const property = (lease as any).property
    const tenant = (lease as any).tenant
    const isLegacy = status === 'signed' && !lease.signing_token
    const isTerminated = status === 'terminated'

    const fmt = (d: string | null | undefined) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null

    return (
        <div className="p-6 max-w-3xl mx-auto w-full space-y-5">
            {/* Back button */}
            <div className="flex items-center justify-between">
                <button onClick={() => router.push('/dashboard/leases')} className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--dash-muted)' }}>
                    <ChevronLeft className="w-4 h-4" /> Back to Leases
                </button>
                {isLegacy && (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider" style={{ background: 'var(--dash-nav-hover)', color: 'var(--dash-muted)', border: '1px solid var(--dash-border)' }}>
                        Legacy Lease — Manually Signed
                    </span>
                )}
            </div>

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold mb-1 truncate" style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--dash-text)' }}>
                        {property?.name || 'Lease Agreement'}
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--dash-muted)' }}>
                        {tenant?.full_name && `${tenant.full_name} · `}
                        {fmt(lease.start_date)} — {fmt(lease.end_date)}
                    </p>
                </div>
                {isTerminated && (
                    <div className="px-4 py-2 rounded-xl border flex items-center gap-2" style={{ borderColor: 'rgba(232,57,42,0.2)', background: 'rgba(232,57,42,0.05)', color: '#E8392A' }}>
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm font-bold">Terminated</span>
                    </div>
                )}
            </div>

            {/* Terminated Banner */}
            {isTerminated && (
                <div className="rounded-2xl p-5 border shadow-sm" style={{ background: 'rgba(232,57,42,0.08)', borderColor: 'rgba(232,57,42,0.2)' }}>
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(232,57,42,0.1)' }}>
                            <XCircle className="w-6 h-6 text-red-500" />
                        </div>
                        <div className="flex-1">
                            <p className="text-base font-bold mb-1" style={{ color: '#E8392A' }}>Lease Terminated</p>
                            <p className="text-sm mb-4" style={{ color: '#374151' }}>
                                This lease was terminated on <strong>{fmt(lease.terminated_at)}</strong> by {lease.terminated_by === 'landlord' ? 'the landlord' : lease.terminated_by || 'the landlord'}.
                            </p>
                            <div className="p-4 rounded-xl bg-white/50 dark:bg-black/20 border border-white/20">
                                <p className="text-xs font-semibold uppercase mb-2 tracking-wider" style={{ color: 'var(--dash-muted)' }}>Reason Detail</p>
                                <p className="text-sm italic" style={{ color: 'var(--dash-text)' }}>&quot;{lease.termination_reason || 'No reason provided.'}&quot;</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Banners (Active Flow) */}
            {!isTerminated && (
                <div className="rounded-2xl p-4 flex flex-wrap items-center gap-4" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {status === 'signed'
                            ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: cfg.color }} />
                            : <Clock className="w-5 h-5 flex-shrink-0" style={{ color: cfg.color }} />}
                        <div>
                            <p className="text-sm font-semibold" style={{ color: cfg.color }}>
                                {status === 'draft' && 'Draft — This lease has not been sent for signing yet.'}
                                {status === 'pending_landlord' && 'Awaiting Your Signature — This lease is waiting for you to sign first.'}
                                {status === 'pending_tenant' && `Awaiting Tenant Signature — You have signed. Waiting for ${tenant?.full_name || 'tenant'}.`}
                                {status === 'signed' && `✓ Fully Signed on ${fmt(lease.signed_at)}`}
                                {status === 'expired' && 'This lease has expired.'}
                            </p>
                            {status === 'pending_tenant' && tenant?.email && (
                                <p className="text-xs opacity-80 mt-0.5" style={{ color: cfg.color }}>Waiting on: {tenant.email}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        {status === 'draft' && (
                            <button
                                onClick={handleSendForSigning}
                                disabled={sendingRequest}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-all active:scale-95"
                                style={{ background: '#E8392A' }}
                            >
                                <Send className="w-3.5 h-3.5" />
                                {sendingRequest ? 'Sending…' : 'Send for Signature'}
                            </button>
                        )}
                        {status === 'pending_landlord' && (
                            <button
                                onClick={() => signatureRef.current?.scrollIntoView({ behavior: 'smooth' })}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all"
                                style={{ background: '#E8392A' }}
                            >
                                <PenLine className="w-3.5 h-3.5" />
                                Sign Now
                            </button>
                        )}
                        {status === 'pending_tenant' && (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCopySigningLink}
                                    className="p-2 rounded-xl hover:bg-white/20 transition-colors border"
                                    style={{ borderColor: cfg.border, color: cfg.color }}
                                    title="Copy Signing Link"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleResendInvite}
                                    disabled={sendingRequest}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-all border"
                                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${sendingRequest ? 'animate-spin' : ''}`} />
                                    {sendingRequest ? 'Sending…' : 'Resend Email'}
                                </button>
                            </div>
                        )}
                        {status === 'signed' && (
                            <button
                                onClick={handleDownloadPdf}
                                disabled={downloadingPdf}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-all active:scale-95"
                                style={{ background: '#16A34A' }}
                            >
                                <Download className="w-3.5 h-3.5" />
                                {downloadingPdf ? 'Loading…' : 'Download Signed PDF'}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Landlord Signature Section */}
            {!isTerminated && status === 'pending_landlord' && (
                <div ref={signatureRef} className="rounded-2xl p-6 space-y-4" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}>
                    <div>
                        <h2 className="text-base font-bold mb-1" style={{ color: 'var(--dash-text)' }}>Your Signature Required</h2>
                        <p className="text-sm" style={{ color: 'var(--dash-muted)' }}>Draw your signature below. After saving, the tenant will be notified to sign.</p>
                    </div>
                    <SignaturePad
                        label="Your signature"
                        onSave={(base64) => setLandlordSig(base64)}
                        onClear={() => setLandlordSig(null)}
                    />
                    {landlordSig && (
                        <button
                            onClick={handleLandlordSign}
                            disabled={saving}
                            className="w-full py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-all active:scale-95"
                            style={{ background: '#E8392A' }}
                        >
                            {saving ? 'Saving signature…' : 'Submit My Signature'}
                        </button>
                    )}
                </div>
            )}

            {/* Lease Details Card */}
            <div className="rounded-2xl p-5 space-y-1" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}>
                <p className="text-sm font-bold mb-3" style={{ color: 'var(--dash-text)' }}>Lease Details</p>
                {[
                    { label: 'Property', value: property?.name || '—' },
                    { label: 'Address', value: property?.address || '—' },
                    { label: 'Tenant', value: tenant?.full_name || '—' },
                    { label: 'Monthly Rent', value: lease.rent_amount ? `$${Number(lease.rent_amount).toLocaleString()}` : '—' },
                    { label: 'Start Date', value: fmt(lease.start_date) || '—' },
                    { label: 'End Date', value: fmt(lease.end_date) || '—' },
                ].map(row => (
                    <div key={row.label} className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid var(--dash-border)' }}>
                        <span className="text-sm" style={{ color: 'var(--dash-muted)' }}>{row.label}</span>
                        <span className="text-sm font-medium" style={{ color: 'var(--dash-text)' }}>{row.value}</span>
                    </div>
                ))}
                {isTerminated && (
                    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid var(--dash-border)' }}>
                        <span className="text-sm" style={{ color: 'var(--dash-muted)' }}>Terminated On</span>
                        <span className="text-sm font-medium text-red-500">{fmt(lease.terminated_at)}</span>
                    </div>
                )}
            </div>

            {/* Signing Timeline — Hidden for legacy or draft if no activity */}
            {(!isLegacy || lease.landlord_signed_at) && (
                <div className="rounded-2xl p-5" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}>
                    <p className="text-sm font-bold mb-5" style={{ color: 'var(--dash-text)' }}>Signing Timeline</p>
                    <div className="space-y-0">
                        {[
                            {
                                label: 'Signing Requested',
                                date: fmt(lease.signing_requested_at),
                                done: !!lease.signing_requested_at,
                            },
                            {
                                label: isLegacy ? 'Signed (Legacy)' : 'Landlord Signed',
                                date: fmt(lease.landlord_signed_at),
                                done: !!lease.landlord_signed_at,
                            },
                            {
                                label: isLegacy ? 'Signed (Legacy)' : 'Tenant Signed',
                                date: fmt(lease.tenant_signed_at),
                                done: !!lease.tenant_signed_at,
                            },
                        ].map((step, idx, arr) => (
                            <div key={step.label} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                                        style={{
                                            background: step.done ? 'rgba(22,163,74,0.1)' : 'var(--dash-nav-hover)',
                                            border: `2px solid ${step.done ? '#16A34A' : 'var(--dash-border)'}`,
                                        }}
                                    >
                                        {step.done
                                            ? <Check className="w-4 h-4" style={{ color: '#16A34A' }} />
                                            : <Circle className="w-3 h-3" style={{ color: 'var(--dash-muted)' }} />}
                                    </div>
                                    {idx < arr.length - 1 && (
                                        <div className="w-0.5 flex-1 my-1" style={{ background: step.done ? '#16A34A' : 'var(--dash-border)', minHeight: '24px' }} />
                                    )}
                                </div>
                                <div className="pb-5">
                                    <p className="text-sm font-medium" style={{ color: step.done ? 'var(--dash-text)' : 'var(--dash-muted)' }}>{step.label}</p>
                                    <p className="text-xs mt-0.5" style={{ color: step.done ? '#16A34A' : 'var(--dash-muted)' }}>
                                        {step.done ? step.date : 'Pending'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Signing Audit Trail — Only when flow has started */}
            {(auditLogs.length > 0 || !isLegacy) && (
                <div className="rounded-2xl p-5" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}>
                    <div className="flex items-center gap-2 mb-4">
                        <Shield className="w-4 h-4" style={{ color: '#2563EB' }} />
                        <p className="text-sm font-bold" style={{ color: 'var(--dash-text)' }}>Signing Audit Trail</p>
                    </div>

                    {auditLogs.length === 0 ? (
                        <p className="text-sm" style={{ color: 'var(--dash-muted)' }}>No signing activity yet. Events will be logged once signing is requested.</p>
                    ) : (
                        <div className="space-y-4">
                            {auditLogs.map((log) => {
                                const dotColor =
                                    log.event.includes('SIGNED') ? '#16A34A'
                                        : log.event.includes('VIEWED') ? '#2563EB'
                                            : log.event.includes('TERMINATED') ? '#E8392A'
                                                : '#9CA3AF'
                                const labelMap: Record<string, string> = {
                                    SIGNING_REQUESTED: 'Signing Requested',
                                    LANDLORD_SIGNED: 'Landlord Signed',
                                    TENANT_VIEWED: 'Tenant Viewed',
                                    TENANT_SIGNED: 'Tenant Signed',
                                    PDF_GENERATED: 'PDF Generated',
                                    PDF_DOWNLOADED: 'PDF Downloaded',
                                    LEASE_TERMINATED: 'Lease Terminated',
                                }
                                const ts = new Date(log.created_at)
                                const formattedTs = ts.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                                    + ' at ' + ts.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' UTC'

                                return (
                                    <div key={log.id} className="flex items-start gap-3">
                                        <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: dotColor }} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium" style={{ color: 'var(--dash-text)' }}>
                                                {labelMap[log.event] || log.event}
                                            </p>
                                            <p className="text-xs" style={{ color: 'var(--dash-muted)' }}>
                                                {log.actor_name} · {log.actor_email}
                                            </p>
                                            <p className="text-xs mt-0.5" style={{ color: 'var(--dash-muted)', fontFamily: 'monospace' }}>
                                                IP: {log.ip_address || 'Dashboard'}
                                            </p>
                                            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{formattedTs}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    <p className="text-xs mt-6 pt-4 border-t border-dashed" style={{ color: '#9CA3AF', borderColor: 'var(--dash-border)' }}>
                        Electronic signatures are stored with tamper-proof audit trails for legal admissibility under IT Act 2000 (India) and ESIGN Act 2000 (USA).
                    </p>
                </div>
            )}

            {/* Action Documents */}
            <div className="space-y-3">
                {status === 'signed' && lease.signed_pdf_url && (
                    <div className="rounded-2xl p-5 flex items-center justify-between gap-4" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(22,163,74,0.1)' }}>
                                <FileText className="w-5 h-5" style={{ color: '#16A34A' }} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold" style={{ color: 'var(--dash-text)' }}>Signed Lease PDF</p>
                                <p className="text-xs" style={{ color: 'var(--dash-muted)' }}>Fully Executed · {fmt(lease.signed_at)}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleDownloadPdf}
                            disabled={downloadingPdf}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-all active:scale-95"
                            style={{ background: '#16A34A' }}
                        >
                            <Download className="w-4 h-4" />
                            {downloadingPdf ? 'Loading…' : 'Download'}
                        </button>
                    </div>
                )}
                {lease.document_url && (
                    <div className="rounded-2xl p-5 flex items-center justify-between gap-4" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(232,57,42,0.08)' }}>
                                <FileText className="w-5 h-5" style={{ color: '#E8392A' }} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold" style={{ color: 'var(--dash-text)' }}>Original Lease Document</p>
                                <p className="text-xs" style={{ color: 'var(--dash-muted)' }}>PDF Agreement · Reference</p>
                            </div>
                        </div>
                        <button
                            onClick={handleViewLeaseDoc}
                            disabled={viewingDoc}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-all active:scale-95"
                            style={{ background: '#E8392A' }}
                        >
                            <ExternalLink className="w-4 h-4" />
                            {viewingDoc ? 'Loading…' : 'View'}
                        </button>
                    </div>
                )}
            </div>

            {/* Termination Section at bottom */}
            {!isTerminated && status === 'signed' && (
                <div className="pt-8 mt-8 border-t" style={{ borderColor: 'var(--dash-border)' }}>
                    <div className="flex flex-col items-center text-center max-w-md mx-auto">
                        <p className="text-sm font-semibold mb-2" style={{ color: 'var(--dash-text)' }}>End this agreement?</p>
                        <p className="text-xs mb-6" style={{ color: 'var(--dash-muted)' }}>
                            If the tenant is moving out or you need to terminate for violations, you can mark this lease as terminated. This will notify the tenant and move the lease to history.
                        </p>
                        <button
                            onClick={() => setTerminateOpen(true)}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold border hover:bg-red-50 dark:hover:bg-red-500/10 transition-all active:scale-95"
                            style={{ color: '#E8392A', borderColor: '#E8392A' }}
                        >
                            <Trash2 className="w-4 h-4" />
                            Terminate Lease
                        </button>
                    </div>
                </div>
            )}

            {/* Termination SlidePanel */}
            <SlidePanel isOpen={terminateOpen} onClose={() => setTerminateOpen(false)} title="Terminate Lease">
                <div className="space-y-6">
                    <div className="p-4 rounded-xl flex gap-3" style={{ background: 'rgba(232,57,42,0.08)', border: '1px solid rgba(232,57,42,0.2)' }}>
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: '#E8392A' }} />
                        <p className="text-xs leading-relaxed" style={{ color: '#374151' }}>
                            <strong>Warning:</strong> This action cannot be undone. The tenant will be notified immediately via email. This lease will be permanently marked as terminated.
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-muted)' }}>Reason Category *</label>
                        <CustomSelect
                            value={termForm.reasonCategory}
                            onChange={(v) => setTermForm(f => ({ ...f, reasonCategory: v }))}
                            options={TERMINATION_REASONS}
                            placeholder="Select a reason..."
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-muted)' }}>Reason Detail *</label>
                        <textarea
                            className="w-full px-4 py-3 rounded-xl text-sm outline-none min-h-[120px] resize-none"
                            style={{ background: 'var(--dash-nav-hover)', border: '1px solid var(--dash-border)', color: 'var(--dash-text)' }}
                            placeholder="Please provide specific details for this termination... (min 20 chars)"
                            value={termForm.reasonDetail}
                            onChange={(e) => setTermForm(f => ({ ...f, reasonDetail: e.target.value }))}
                        />
                        <p className="text-[10px] text-right" style={{ color: termForm.reasonDetail.length < 20 ? '#E8392A' : 'var(--dash-muted)' }}>
                            {termForm.reasonDetail.length}/20 characters minimum
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-muted)' }}>Notice Period *</label>
                            <CustomSelect
                                value={termForm.noticePeriodDays}
                                onChange={(v) => setTermForm(f => ({ ...f, noticePeriodDays: v }))}
                                options={NOTICE_PERIODS}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-muted)' }}>Effective Date *</label>
                            <input
                                type="date"
                                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                                style={{ background: 'var(--dash-nav-hover)', border: '1px solid var(--dash-border)', color: 'var(--dash-text)' }}
                                value={termForm.effectiveDate}
                                onChange={(e) => setTermForm(f => ({ ...f, effectiveDate: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-6">
                        <button
                            onClick={() => setTerminateOpen(false)}
                            className="flex-1 py-3 rounded-xl text-sm font-semibold border transition-colors"
                            style={{ color: 'var(--dash-muted)', background: 'var(--dash-sidebar-bg)', borderColor: 'var(--dash-border)' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleTerminate}
                            disabled={terminating || termForm.reasonDetail.length < 20 || !termForm.reasonCategory}
                            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-all active:scale-95"
                            style={{ background: '#E8392A' }}
                        >
                            {terminating ? 'Terminating...' : 'Terminate Lease'}
                        </button>
                    </div>
                </div>
            </SlidePanel>
        </div>
    )
}
