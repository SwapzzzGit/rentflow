'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FileText, Download, ExternalLink, Calendar, DollarSign, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

type Lease = {
    id: string
    start_date: string
    end_date: string
    rent_amount: number
    status: string
    signing_token: string | null
    document_url?: string | null
    signed_pdf_url?: string | null
    property?: { name: string; address: string }
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid #F3F4F6' }}>
            <span className="text-sm" style={{ color: '#6B7280' }}>{label}</span>
            <span className="text-sm font-semibold" style={{ color: highlight ? '#E8392A' : '#111' }}>{value}</span>
        </div>
    )
}

function SigningStatusBadge({ status }: { status: string }) {
    const config = {
        draft: { label: 'Draft', color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
        pending_landlord: { label: 'Awaiting Landlord', color: '#D97706', bg: 'rgba(217,119,6,0.1)' },
        pending_tenant: { label: 'Action Required: Sign!', color: '#E8392A', bg: 'rgba(232,57,42,0.1)' },
        signed: { label: '✓ Fully Signed', color: '#16A34A', bg: 'rgba(22,163,74,0.1)' },
        expired: { label: 'Expired', color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
        active: { label: 'Active', color: '#16A34A', bg: 'rgba(22,163,74,0.1)' },
    }
    const cfg = config[status as keyof typeof config] || config.draft
    return (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
            {cfg.label}
        </span>
    )
}

export default function TenantLeasePage() {
    const supabase = createClient()
    const router = useRouter()
    const [lease, setLease] = useState<Lease | null>(null)
    const [loading, setLoading] = useState(true)
    const [downloading, setDownloading] = useState(false)
    const [downloadingSignedPdf, setDownloadingSignedPdf] = useState(false)

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/tenant/login'); return }

            const { data: t } = await supabase.from('tenants').select('id').eq('portal_user_id', user.id).single()
            if (!t) { router.push('/tenant/login'); return }

            const { data } = await supabase
                .from('leases')
                .select('id, start_date, end_date, rent_amount, status, signing_token, document_url, signed_pdf_url, property:properties(name, address)')
                .eq('tenant_id', t.id)
                .order('end_date', { ascending: false })
                .limit(1)
                .single()

            if (data) setLease(data as unknown as Lease)
            setLoading(false)
        }
        load()
    }, [supabase, router])

    async function downloadDoc() {
        if (!lease?.document_url) return
        setDownloading(true)
        try {
            const { data, error } = await supabase.storage.from('lease-documents').createSignedUrl(lease.document_url, 3600)
            if (error || !data?.signedUrl) { toast.error('Could not load document'); return }
            window.open(data.signedUrl, '_blank')
            toast.success('Download started!')
        } finally {
            setDownloading(false)
        }
    }

    async function downloadSignedPdf() {
        if (!lease) return
        setDownloadingSignedPdf(true)
        try {
            const res = await fetch(`/api/leases/signed-pdf?leaseId=${lease.id}`)
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            window.open(data.url, '_blank')
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setDownloadingSignedPdf(false)
        }
    }

    if (loading) return (
        <div className="space-y-4">
            <div className="h-8 w-32 rounded-lg animate-pulse" style={{ background: '#F3F4F6' }} />
            <div className="h-64 rounded-2xl animate-pulse" style={{ background: '#F3F4F6' }} />
        </div>
    )

    if (!lease) return (
        <div className="rounded-2xl py-20 text-center" style={{ background: 'white', border: '1px solid #E9EBF0' }}>
            <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: '#D1D5DB' }} />
            <p className="text-sm font-medium" style={{ color: '#6B7280' }}>No active lease found</p>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Your landlord hasn&apos;t added a lease yet.</p>
        </div>
    )

    const daysLeft = Math.ceil((new Date(lease.end_date).getTime() - Date.now()) / 86400000)
    const isExpiring = daysLeft < 60
    const isExpired = daysLeft < 0
    const prop = (lease as any).property
    const daysLabel = isExpired ? `Expired ${Math.abs(daysLeft)}d ago` : `${daysLeft} days remaining`

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold" style={{ color: '#111', fontFamily: 'var(--font-bricolage, serif)' }}>Your Lease</h1>
                <SigningStatusBadge status={lease.status} />
            </div>

            {/* Action Required Banner for pending_tenant */}
            {lease.status === 'pending_tenant' && lease.signing_token && (
                <div className="rounded-2xl p-4" style={{ background: 'rgba(232,57,42,0.06)', border: '1px solid rgba(232,57,42,0.25)' }}>
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#E8392A' }} />
                        <div className="flex-1">
                            <p className="text-sm font-bold mb-1" style={{ color: '#E8392A' }}>Action Required: Please sign your lease</p>
                            <p className="text-xs mb-3" style={{ color: '#6B7280' }}>Your landlord has signed the lease. Your signature is needed to complete the agreement.</p>
                            <a
                                href={`/tenant/lease/sign?token=${lease.signing_token}`}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90"
                                style={{ background: '#E8392A' }}
                            >
                                Review &amp; Sign Lease →
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Signed banner */}
            {lease.status === 'signed' && (
                <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.25)' }}>
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: '#16A34A' }} />
                    <p className="text-sm font-semibold" style={{ color: '#16A34A' }}>Lease fully signed by both parties</p>
                </div>
            )}

            {/* Time remaining banner */}
            <div className="rounded-2xl px-5 py-4 flex items-center gap-3" style={{
                background: isExpired ? 'rgba(232,57,42,0.06)' : isExpiring ? 'rgba(234,179,8,0.06)' : 'rgba(34,197,94,0.06)',
                border: `1px solid ${isExpired ? 'rgba(232,57,42,0.2)' : isExpiring ? 'rgba(234,179,8,0.2)' : 'rgba(34,197,94,0.2)'}`,
            }}>
                <Clock className="w-5 h-5 flex-shrink-0" style={{ color: isExpired ? '#E8392A' : isExpiring ? '#CA8A04' : '#16A34A' }} />
                <span className="text-sm font-semibold" style={{ color: isExpired ? '#E8392A' : isExpiring ? '#CA8A04' : '#16A34A' }}>{daysLabel}</span>
            </div>

            {/* Lease details card */}
            <div className="rounded-2xl p-5 space-y-0" style={{ background: 'white', border: '1px solid #E9EBF0' }}>
                <p className="text-sm font-bold mb-3" style={{ color: '#111' }}>Lease Details</p>
                <InfoRow label="Property" value={prop?.name ?? '—'} />
                {prop?.address && <InfoRow label="Address" value={prop.address} />}
                <InfoRow label="Monthly Rent" value={`$${Number(lease.rent_amount).toLocaleString()}`} />
                <InfoRow label="Start Date" value={new Date(lease.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} />
                <InfoRow label="End Date" value={new Date(lease.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} highlight={isExpiring} />
            </div>

            {/* Download signed PDF */}
            {lease.status === 'signed' && lease.signed_pdf_url && (
                <div className="rounded-2xl p-5 flex items-center justify-between gap-4" style={{ background: 'white', border: '1px solid #E9EBF0' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(22,163,74,0.1)' }}>
                            <FileText className="w-5 h-5" style={{ color: '#16A34A' }} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold" style={{ color: '#111' }}>Signed Lease PDF</p>
                            <p className="text-xs" style={{ color: '#9CA3AF' }}>Both parties signed · Download a copy</p>
                        </div>
                    </div>
                    <button
                        onClick={downloadSignedPdf}
                        disabled={downloadingSignedPdf}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                        style={{ background: '#16A34A' }}
                    >
                        <Download className="w-4 h-4" />
                        {downloadingSignedPdf ? 'Loading…' : 'Download'}
                    </button>
                </div>
            )}

            {/* Original document download */}
            {lease.document_url && (
                <div className="rounded-2xl p-5 flex items-center justify-between gap-4" style={{ background: 'white', border: '1px solid #E9EBF0' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(232,57,42,0.08)' }}>
                            <FileText className="w-5 h-5" style={{ color: '#E8392A' }} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold" style={{ color: '#111' }}>Lease Document</p>
                            <p className="text-xs" style={{ color: '#9CA3AF' }}>PDF · Tap to download</p>
                        </div>
                    </div>
                    <button
                        onClick={downloadDoc}
                        disabled={downloading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                        style={{ background: '#E8392A' }}
                    >
                        <Download className="w-4 h-4" />
                        {downloading ? 'Loading…' : 'Download'}
                    </button>
                </div>
            )}
        </div>
    )
}
