'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SignaturePad } from '@/components/ui/signature-pad'
import {
    Check, Clock, FileText, Download, Send, RefreshCw,
    CheckCircle2, Circle, ChevronLeft
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
    property?: { name: string; address: string }
    tenant?: { full_name: string; email: string; avatar_color: string }
}

const STATUS_CONFIG = {
    draft: { color: '#6B7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.2)', label: 'Draft' },
    pending_landlord: { color: '#D97706', bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.25)', label: 'Awaiting Landlord Signature' },
    pending_tenant: { color: '#2563EB', bg: 'rgba(37,99,235,0.08)', border: 'rgba(37,99,235,0.25)', label: 'Awaiting Tenant Signature' },
    signed: { color: '#16A34A', bg: 'rgba(22,163,74,0.08)', border: 'rgba(22,163,74,0.25)', label: 'Fully Signed' },
    expired: { color: '#6B7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.2)', label: 'Expired' },
} as const

export default function LeaseDetailPage() {
    const supabase = createClient()
    const router = useRouter()
    const params = useParams()
    const leaseId = params.id as string

    const [lease, setLease] = useState<Lease | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [sendingRequest, setSendingRequest] = useState(false)
    const [downloadingPdf, setDownloadingPdf] = useState(false)
    const [viewingDoc, setViewingDoc] = useState(false)
    const [landlordSig, setLandlordSig] = useState<string | null>(null)

    const fetchLease = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        const { data, error } = await supabase
            .from('leases')
            .select(`
        id, status, start_date, end_date, rent_amount, document_url, notes,
        signing_token, signing_requested_at, landlord_signed_at, tenant_signed_at,
        signed_at, signed_pdf_url, landlord_signature,
        property:properties(name, address),
        tenant:tenants(full_name, email, avatar_color)
      `)
            .eq('id', leaseId)
            .eq('user_id', user.id)
            .single()

        if (error || !data) { toast.error('Lease not found'); router.push('/dashboard/leases'); return }
        setLease(data as unknown as Lease)
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

    const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null

    return (
        <div className="p-6 max-w-3xl mx-auto w-full space-y-5">
            {/* Back button */}
            <button onClick={() => router.push('/dashboard/leases')} className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--dash-muted)' }}>
                <ChevronLeft className="w-4 h-4" /> Back to Leases
            </button>

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--dash-text)' }}>
                    {property?.name || 'Lease Agreement'}
                </h1>
                <p className="text-sm" style={{ color: 'var(--dash-muted)' }}>
                    {tenant?.full_name && `${tenant.full_name} · `}
                    {fmt(lease.start_date)} — {fmt(lease.end_date)}
                </p>
            </div>

            {/* Status Banner */}
            <div className="rounded-2xl p-4 flex flex-wrap items-center gap-4" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {status === 'signed'
                        ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: cfg.color }} />
                        : <Clock className="w-5 h-5 flex-shrink-0" style={{ color: cfg.color }} />}
                    <div>
                        <p className="text-sm font-semibold" style={{ color: cfg.color }}>
                            {status === 'draft' && 'This lease has not been sent for signing yet.'}
                            {status === 'pending_landlord' && 'Waiting for your signature. Sign below to proceed.'}
                            {status === 'pending_tenant' && 'You have signed. Waiting for tenant to sign.'}
                            {status === 'signed' && `✓ Fully Signed on ${fmt(lease.signed_at)}`}
                            {status === 'expired' && 'This lease has expired.'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                    {status === 'draft' && (
                        <button
                            onClick={handleSendForSigning}
                            disabled={sendingRequest}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                            style={{ background: '#E8392A' }}
                        >
                            <Send className="w-3.5 h-3.5" />
                            {sendingRequest ? 'Sending…' : 'Send for Signature'}
                        </button>
                    )}
                    {status === 'pending_tenant' && (
                        <button
                            onClick={handleSendForSigning}
                            disabled={sendingRequest}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                            style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            {sendingRequest ? 'Sending…' : 'Resend Reminder'}
                        </button>
                    )}
                    {status === 'signed' && (
                        <button
                            onClick={handleDownloadPdf}
                            disabled={downloadingPdf}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                            style={{ background: '#16A34A' }}
                        >
                            <Download className="w-3.5 h-3.5" />
                            {downloadingPdf ? 'Loading…' : 'Download Signed PDF'}
                        </button>
                    )}
                </div>
            </div>

            {/* Landlord Signature Section */}
            {status === 'pending_landlord' && (
                <div className="rounded-2xl p-6 space-y-4" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}>
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
                            className="w-full py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                            style={{ background: '#E8392A' }}
                        >
                            {saving ? 'Saving signature…' : 'Submit My Signature'}
                        </button>
                    )}
                </div>
            )}

            {/* Lease Details Card */}
            <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}>
                <p className="text-sm font-bold" style={{ color: 'var(--dash-text)' }}>Lease Details</p>
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
            </div>

            {/* Signing Timeline */}
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
                            label: 'Landlord Signed',
                            date: fmt(lease.landlord_signed_at),
                            done: !!lease.landlord_signed_at,
                        },
                        {
                            label: 'Tenant Signed',
                            date: fmt(lease.tenant_signed_at),
                            done: !!lease.tenant_signed_at,
                        },
                    ].map((step, idx, arr) => (
                        <div key={step.label} className="flex gap-4">
                            {/* Timeline connector + circle */}
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
                            {/* Step content */}
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

            {/* Download signed PDF */}
            {status === 'signed' && lease.signed_pdf_url && (
                <div className="rounded-2xl p-5 flex items-center justify-between gap-4" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(22,163,74,0.1)' }}>
                            <FileText className="w-5 h-5" style={{ color: '#16A34A' }} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--dash-text)' }}>Signed Lease PDF</p>
                            <p className="text-xs" style={{ color: 'var(--dash-muted)' }}>Both parties signed · {fmt(lease.signed_at)}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleDownloadPdf}
                        disabled={downloadingPdf}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                        style={{ background: '#16A34A' }}
                    >
                        <Download className="w-4 h-4" />
                        {downloadingPdf ? 'Loading…' : 'Download'}
                    </button>
                </div>
            )}
            {/* Original lease document */}
            {lease.document_url && (
                <div className="rounded-2xl p-5 flex items-center justify-between gap-4" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(232,57,42,0.08)' }}>
                            <FileText className="w-5 h-5" style={{ color: '#E8392A' }} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--dash-text)' }}>Original Lease Document</p>
                            <p className="text-xs" style={{ color: 'var(--dash-muted)' }}>PDF · Click to open</p>
                        </div>
                    </div>
                    <button
                        onClick={handleViewLeaseDoc}
                        disabled={viewingDoc}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                        style={{ background: '#E8392A' }}
                    >
                        <Download className="w-4 h-4" />
                        {viewingDoc ? 'Loading…' : 'View'}
                    </button>
                </div>
            )}
        </div>
    )
}
